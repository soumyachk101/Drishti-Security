"""Drishti — AI-Powered Network Risk Intelligence platform."""

import uuid
import threading
from contextlib import asynccontextmanager

import networkx as nx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

from models import (
    ScanSession, ScanStartRequest, RemediateRequest,
)
from demo_data import build_demo_scan
from scanner import scan_target
from graph_engine import build_network_graph, get_reachable_nodes, discover_attack_paths
from risk_scoring import enrich_vulnerabilities, get_risk_summary
from ai_engine import generate_remediation, generate_executive_summary, generate_kill_chain
from report_gen import generate_report_html


# In-memory stores
sessions: dict[str, ScanSession] = {}
graphs: dict[str, nx.DiGraph] = {}
ws_connections: dict[str, list[WebSocket]] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Drishti", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_session(session_id: str, nodes: list) -> ScanSession:
    """Build a scan session from node list: enrich, graph, paths."""
    enriched = enrich_vulnerabilities(nodes)
    G = build_network_graph(enriched)
    graphs[session_id] = G
    paths = discover_attack_paths(enriched, G)

    internet_facing = sum(1 for n in enriched if n.risk_zone.value == "INTERNET_FACING")
    total_vulns = sum(len(n.vulnerabilities) for n in enriched)
    critical_vulns = sum(
        sum(1 for v in n.vulnerabilities if v.cvss_v3 >= 9.0)
        for n in enriched
    )
    most_critical = None
    if paths:
        most_critical = paths[0].blast_radius[-1] if paths[0].blast_radius else None

    session = ScanSession(
        id=session_id,
        status="complete",
        nodes=enriched,
        attack_paths=paths,
        total_vuln_count=total_vulns,
        critical_vuln_count=critical_vulns,
        internet_facing_count=internet_facing,
        most_critical_target=most_critical,
    )
    sessions[session_id] = session
    return session


def _create_demo_session() -> str:
    """Create and store a demo scan session. Returns session ID."""
    session_id = f"demo-{str(uuid.uuid4())[:6]}"
    session = build_demo_scan(session_id)
    _build_session(session_id, session.nodes)
    return session_id


@app.get("/")
async def root():
    return {"service": "Drishti API", "version": "1.0.0", "docs": "/docs"}


@app.get("/api/v1/demo")
async def load_demo():
    """Load pre-built demo data."""
    session_id = _create_demo_session()
    return {"session_id": session_id, "status": "complete"}


@app.post("/api/v1/scan/start")
async def start_scan(req: ScanStartRequest, bg: BackgroundTasks):
    """Start a network scan — returns immediately, scans in background.
    Falls back to demo data if real scan finds nothing (e.g., target unreachable
    from the server's network)."""
    session_id = f"scan-{str(uuid.uuid4())[:6]}"
    sessions[session_id] = ScanSession(id=session_id, status="scanning")

    def _run_scan():
        nodes = scan_target(req.target_network)
        if not nodes:
            # Real scan found nothing — fall back to demo data so user sees a result
            demo = build_demo_scan(session_id)
            nodes = demo.nodes
        _build_session(session_id, nodes)

    bg.add_task(_run_scan)
    return {"session_id": session_id, "status": "scanning"}


@app.get("/api/v1/scan/{session_id}")
async def get_scan(session_id: str):
    """Get scan session status and summary."""
    session = sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}, 404
    summary = get_risk_summary(session.nodes)
    return {
        "session": session.model_dump(),
        "summary": summary,
    }


@app.get("/api/v1/graph/{session_id}")
async def get_graph(session_id: str):
    """Get network graph as nodes + edges for React Flow."""
    session = sessions.get(session_id)
    G = graphs.get(session_id)
    if not session or not G:
        return {"error": "Session not found"}, 404

    zone_colors = {
        "INTERNET_FACING": "#ef4444",
        "DMZ": "#f97316",
        "INTERNAL": "#eab308",
        "CRITICAL": "#7c3aed",
    }

    nodes = []
    for node in session.nodes:
        nodes.append({
            "id": node.id,
            "position": _get_node_position(node.id, session.nodes),
            "data": {
                "label": node.hostname or node.id,
                "ip": node.id,
                "risk_zone": node.risk_zone.value,
                "cvss_max": node.cvss_max,
                "vuln_count": len(node.vulnerabilities),
                "os": node.os,
            },
            "style": {
                "background": zone_colors.get(node.risk_zone.value, "#6b7280"),
                "color": "#fff",
                "border": "1px solid rgba(255,255,255,0.2)",
                "borderRadius": "8px",
                "padding": "10px",
                "width": 180,
            },
        })

    edges = []
    for u, v, data in G.edges(data=True):
        edges.append({
            "id": f"{u}-{v}",
            "source": u,
            "target": v,
            "label": data.get("exploit", ""),
            "animated": True,
            "style": {"stroke": "#ef4444"},
        })

    return {"nodes": nodes, "edges": edges}


def _get_node_position(node_id: str, nodes):
    """Layout nodes in a simple layered grid."""
    zone_order = {"INTERNET_FACING": 0, "DMZ": 1, "INTERNAL": 2, "CRITICAL": 3}
    node_map = {n.id: n for n in nodes}
    n = node_map.get(node_id)
    if not n:
        return {"x": 0, "y": 0}
    layer = zone_order.get(n.risk_zone.value, 0)
    # Count index within layer
    layer_nodes = [x for x in nodes if zone_order.get(x.risk_zone.value, 0) == layer]
    idx = layer_nodes.index(n) if n in layer_nodes else 0
    return {"x": 300 + idx * 250, "y": 100 + layer * 200}


@app.get("/api/v1/paths/{session_id}")
async def get_attack_paths(session_id: str):
    """Get ranked attack paths."""
    session = sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}, 404
    return {"paths": [p.model_dump() for p in session.attack_paths]}


@app.get("/api/v1/graph/{session_id}/blast-radius/{node_id}")
async def get_blast_radius(session_id: str, node_id: str):
    """Get all nodes reachable from compromised node."""
    G = graphs.get(session_id)
    if not G:
        return {"error": "Session not found"}, 404
    reachable = get_reachable_nodes(node_id, G)
    return {"node_id": node_id, "blast_radius": reachable}


@app.post("/api/v1/remediate")
async def remediate(req: RemediateRequest):
    """Generate AI remediation script for a vulnerability."""
    session = sessions.get(req.session_id)
    if not session:
        return {"error": "Session not found"}, 404

    # Find the node and vulnerability
    target_node = None
    target_vuln = None
    for node in session.nodes:
        if node.id == req.node_id:
            target_node = node
            for vuln in node.vulnerabilities:
                if vuln.cve_id == req.cve_id:
                    target_vuln = vuln
                    break
            break

    if not target_node or not target_vuln:
        return {"error": "Node or vulnerability not found"}, 404

    # Find relevant attack path
    relevant_path = None
    for path in session.attack_paths:
        for step in path.steps:
            if step.to_node == req.node_id:
                relevant_path = path
                break
        if relevant_path:
            break

    script = await generate_remediation(target_vuln, target_node, relevant_path)
    return {"script": script.model_dump()}


@app.get("/api/v1/executive-summary/{session_id}")
async def get_executive_summary(session_id: str):
    """Generate AI executive summary."""
    session = sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}, 404
    summary = await generate_executive_summary(session)
    return {"summary": summary}


@app.get("/api/v1/kill-chain/{session_id}/{path_id}")
async def get_kill_chain(session_id: str, path_id: str):
    """Generate AI kill chain narrative for an attack path."""
    session = sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}, 404
    for path in session.attack_paths:
        if path.id == path_id:
            narrative = await generate_kill_chain(path)
            return {"narrative": narrative}
    return {"error": "Path not found"}, 404


@app.get("/api/v1/report/{session_id}")
async def get_report(session_id: str):
    """Generate HTML risk report."""
    session = sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}, 404
    html = generate_report_html(session)
    return HTMLResponse(content=html)


@app.get("/api/v1/nodes/{session_id}")
async def get_nodes(session_id: str):
    """Get all nodes with details."""
    session = sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}, 404
    return {"nodes": [n.model_dump() for n in session.nodes]}


@app.websocket("/ws/scan/{session_id}")
async def websocket_scan(ws: WebSocket, session_id: str):
    """WebSocket for live scan updates."""
    await ws.accept()
    if session_id not in ws_connections:
        ws_connections[session_id] = []
    ws_connections[session_id].append(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        ws_connections[session_id].remove(ws)


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
