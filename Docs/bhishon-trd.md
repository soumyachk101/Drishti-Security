# Technical Requirements Document (TRD)
## Bhishon Security — AI-Powered Network Risk Intelligence Platform
**Version:** 1.0.0  
**Author:** Soumya Chakraborty  
**Date:** May 2026  
**Status:** Hackathon Build

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           BHISHON SECURITY SYSTEM                             │
│                                                                                │
│  ┌─────────────────┐    WebSocket/REST    ┌──────────────────────────────┐   │
│  │   EDGE AGENTS   │ ──────────────────►  │      CENTRAL SERVER          │   │
│  │  (Python 3.11)  │ ◄────────────────── │  (FastAPI + Python 3.11)     │   │
│  │                 │                      │                              │   │
│  │ • nmap scanner  │                      │ ┌──────────────────────────┐ │   │
│  │ • CVE matcher   │                      │ │   NetworkX Graph Engine  │ │   │
│  │ • pre-filter    │                      │ │   Attack Path Analyzer   │ │   │
│  │ • metadata out  │                      │ └──────────────────────────┘ │   │
│  └─────────────────┘                      │ ┌──────────────────────────┐ │   │
│                                            │ │   AI Remediation Engine  │ │   │
│  ┌─────────────────┐                      │ │   (Claude API)           │ │   │
│  │   TARGET NETWORK│                      │ └──────────────────────────┘ │   │
│  │  (Lab / Demo)   │                      │ ┌──────────────────────────┐ │   │
│  │                 │                      │ │   Risk Scoring Engine    │ │   │
│  │  VMs / Nodes    │                      │ │   (CVSS + EPSS + Graph)  │ │   │
│  └─────────────────┘                      │ └──────────────────────────┘ │   │
│                                            └──────────────────────────────┘   │
│                                                         │                      │
│                                            ┌────────────▼─────────────────┐   │
│                                            │        FRONTEND UI           │   │
│                                            │  (React 18 + React Flow)     │   │
│                                            │  • Attack graph canvas       │   │
│                                            │  • Blast radius animation    │   │
│                                            │  • Fix-It panel              │   │
│                                            │  • Executive dashboard       │   │
│                                            └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
Target Network
     │
     ▼
Edge Agent (Python)
  1. nmap scan → open ports, services, OS
  2. CVE lookup → match services to NVD database
  3. Edge Filter → strip raw packets, keep metadata only
  4. Serialize to JSON payload
     │
     ▼ HTTP POST / WebSocket
Central Server (FastAPI)
  5. Receive metadata from all agents
  6. Build NetworkX graph
  7. Run attack path algorithms
  8. Score risks (CVSS × EPSS × asset weight)
  9. Call Claude API for remediation scripts
  10. Stream results to frontend
     │
     ▼ WebSocket / REST
Frontend (React)
  11. Render React Flow graph
  12. Animate blast radius on node click
  13. Display CVE details, fix scripts, $ risk
  14. Generate PDF report
```

---

## 2. Backend — Central Server

### 2.1 Tech Stack

| Component | Technology | Version |
|---|---|---|
| Runtime | Python | 3.11+ |
| Web Framework | FastAPI | 0.111+ |
| Graph Engine | NetworkX | 3.3+ |
| Task Queue | asyncio + background tasks | built-in |
| Data Validation | Pydantic v2 | 2.7+ |
| CVE Database | NVD API / local OSV JSON | - |
| HTTP Client | httpx | 0.27+ |
| AI Integration | Anthropic Python SDK | latest |
| Report Gen | WeasyPrint / ReportLab | latest |

### 2.2 API Endpoints

```
POST   /api/v1/scan/start          → Trigger new scan session
GET    /api/v1/scan/{session_id}   → Get scan status
POST   /api/v1/agents/report       → Edge agent data ingestion endpoint
GET    /api/v1/graph/{session_id}  → Get full network graph (JSON)
GET    /api/v1/paths/{session_id}  → Get ranked attack paths
POST   /api/v1/remediate           → Request AI remediation for a vuln
GET    /api/v1/report/{session_id} → Generate + download PDF report
WS     /ws/scan/{session_id}       → Live scan progress stream
```

### 2.3 Data Models (Pydantic)

```python
class NetworkNode(BaseModel):
    id: str                         # IP address
    hostname: Optional[str]
    os: Optional[str]               # OS fingerprint
    risk_zone: RiskZone             # INTERNET_FACING | DMZ | INTERNAL | CRITICAL
    asset_criticality: float        # 0.0 - 1.0
    open_ports: List[PortInfo]
    vulnerabilities: List[Vulnerability]
    cvss_max: float                 # Highest CVSS score on this node

class PortInfo(BaseModel):
    port: int
    protocol: str                   # tcp | udp
    service: str                    # e.g. "http", "ssh", "mysql"
    version: Optional[str]

class Vulnerability(BaseModel):
    cve_id: str                     # e.g. CVE-2024-12345
    cvss_v3: float
    epss_score: float               # Exploit Prediction Scoring System
    description: str
    affected_service: str
    mitre_tactic: Optional[str]     # Initial Access, Lateral Movement, etc.
    financial_risk_usd: Optional[float]

class AttackPath(BaseModel):
    id: str
    steps: List[AttackStep]         # Ordered list of node hops
    total_risk_score: float
    blast_radius: List[str]         # All node IDs reachable after compromise
    financial_impact_usd: float
    mitre_tactics: List[str]

class AttackStep(BaseModel):
    from_node: str
    to_node: str
    exploit_vector: str             # e.g. "CVE-2024-12345 via port 22"
    cvss_score: float
```

### 2.4 Graph Engine (NetworkX)

```python
# Network graph construction
G = nx.DiGraph()

# Add nodes with attributes
for node in network_nodes:
    G.add_node(node.id, 
               risk_zone=node.risk_zone,
               cvss_max=node.cvss_max,
               asset_criticality=node.asset_criticality)

# Add edges (exploitable paths)
for connection in exploitable_connections:
    weight = calculate_edge_weight(connection)
    G.add_edge(connection.from_ip, connection.to_ip, 
               weight=weight,
               exploit=connection.cve_id)

# Attack path discovery
# Entry points = internet-facing nodes
entry_points = [n for n,d in G.nodes(data=True) 
                if d['risk_zone'] == RiskZone.INTERNET_FACING]

# Crown jewels = critical asset nodes
crown_jewels = [n for n,d in G.nodes(data=True) 
                if d['risk_zone'] == RiskZone.CRITICAL]

# Find shortest weighted paths
attack_paths = []
for entry in entry_points:
    for target in crown_jewels:
        try:
            path = nx.shortest_path(G, entry, target, weight='weight')
            attack_paths.append(path)
        except nx.NetworkXNoPath:
            continue

# Risk scoring per path
def score_path(path: List[str]) -> float:
    score = 0
    for i in range(len(path) - 1):
        edge_data = G[path[i]][path[i+1]]
        node_data = G.nodes[path[i+1]]
        score += (edge_data['cvss'] * 
                  node_data['asset_criticality'] * 
                  reachability_factor(G, path[i+1]))
    return score
```

### 2.5 Risk Scoring Engine

**CVSS-based Node Risk Score:**
```
Node Risk Score = CVSS_v3 × (1 + zone_multiplier) × asset_criticality
```

**Zone Multipliers:**
- INTERNET_FACING: 2.5×
- DMZ: 1.8×
- INTERNAL: 1.0×
- CRITICAL: 3.0× (these are targets, not multiplied for reachability)

**Financial Risk Formula:**
```python
def calculate_financial_risk(vuln: Vulnerability, node: NetworkNode) -> float:
    # Base cost from IBM Cost of Data Breach 2024 (India avg: $2.18M)
    BASE_BREACH_COST_USD = 2_180_000
    
    # EPSS = probability this CVE gets exploited in next 30 days
    p_exploit = vuln.epss_score
    
    # Asset criticality (0.1 to 1.0)
    criticality = node.asset_criticality
    
    # Risk zone factor
    zone_factor = ZONE_MULTIPLIERS[node.risk_zone]
    
    return BASE_BREACH_COST_USD * p_exploit * criticality * zone_factor
```

---

## 3. Edge Agent

### 3.1 Architecture

```python
# bhishon_agent.py — Runs on each target machine
class BhishonAgent:
    def __init__(self, server_url: str, api_key: str):
        self.server_url = server_url
        self.api_key = api_key
        self.local_ip = self._get_local_ip()
    
    def run_scan(self, target_network: str = None):
        # 1. Run nmap scan
        raw_scan = self._nmap_scan(target_network or self.local_ip + '/24')
        
        # 2. Parse results
        nodes = self._parse_nmap_output(raw_scan)
        
        # 3. CVE enrichment
        enriched = self._enrich_with_cves(nodes)
        
        # 4. EDGE FILTER — strip raw data, keep metadata only
        metadata = self._filter_to_metadata(enriched)
        
        # 5. Send to server
        self._report_to_server(metadata)
    
    def _filter_to_metadata(self, nodes: List[dict]) -> dict:
        """
        Edge filtering: Instead of sending full packet dumps,
        send only structured threat metadata.
        Reduces data volume by ~80-90%.
        """
        return {
            "agent_ip": self.local_ip,
            "timestamp": datetime.utcnow().isoformat(),
            "nodes": [
                {
                    "ip": node["ip"],
                    "os": node.get("os"),
                    "open_ports": node["ports"],  # just port numbers + services
                    "cves": [{"id": c["id"], "cvss": c["cvss"]} 
                             for c in node["cves"]],
                    # NO raw packet data
                    # NO full nmap XML
                    # NO packet payloads
                }
                for node in nodes
            ]
        }
```

### 3.2 Nmap Integration

```python
import nmap

def _nmap_scan(self, target: str) -> dict:
    nm = nmap.PortScanner()
    nm.scan(hosts=target, 
            arguments='-sV -O --script vuln -T4 --max-retries 2')
    return nm
```

### 3.3 CVE Enrichment

```python
def _enrich_with_cves(self, nodes):
    for node in nodes:
        for port in node["ports"]:
            service = port["service"]
            version = port.get("version")
            
            if service and version:
                # Query NVD API
                cves = self._query_nvd(service, version)
                
                # Add EPSS scores
                for cve in cves:
                    cve["epss"] = self._query_epss(cve["id"])
                
                port["cves"] = cves
    return nodes

def _query_nvd(self, service: str, version: str) -> list:
    url = f"https://services.nvd.nist.gov/rest/json/cves/2.0"
    params = {"keywordSearch": f"{service} {version}", "resultsPerPage": 5}
    resp = httpx.get(url, params=params, timeout=10)
    # Parse and return CVE list
    ...

def _query_epss(self, cve_id: str) -> float:
    url = f"https://api.first.org/data/v1/epss?cve={cve_id}"
    resp = httpx.get(url, timeout=5)
    return resp.json()["data"][0]["epss"]
```

---

## 4. Frontend — React UI

### 4.1 Tech Stack

| Component | Technology |
|---|---|
| Framework | React 18 |
| Graph Visualization | React Flow (reactflow) |
| Charts / Heatmap | Recharts |
| Styling | Tailwind CSS |
| State Management | Zustand |
| HTTP Client | Axios |
| Real-time | WebSocket (native) |
| Report Export | html2pdf.js |
| Animation | Framer Motion |

### 4.2 Component Structure

```
src/
├── components/
│   ├── graph/
│   │   ├── AttackGraph.tsx          # React Flow canvas
│   │   ├── NodeCard.tsx             # Custom node component
│   │   ├── BlastRadiusOverlay.tsx   # Blast radius animation
│   │   └── EdgeTooltip.tsx          # Exploit info on edge hover
│   ├── dashboard/
│   │   ├── RiskSummaryPanel.tsx     # Top-level stats
│   │   ├── AttackPathList.tsx       # Ranked attack paths
│   │   ├── FinancialRiskChart.tsx   # $ risk heatmap (Recharts)
│   │   └── ExecutiveSummary.tsx     # AI-generated plain English
│   ├── remediation/
│   │   ├── FixItPanel.tsx           # Remediation drawer
│   │   ├── ScriptViewer.tsx         # Syntax-highlighted script
│   │   └── RemediationTimeline.tsx  # Prioritized fix roadmap
│   └── report/
│       └── ReportExporter.tsx       # PDF generation
├── hooks/
│   ├── useScanWebSocket.ts          # Live scan data stream
│   ├── useGraphData.ts              # Graph state management
│   └── useRemediation.ts            # Fix-It API calls
├── store/
│   └── scanStore.ts                 # Zustand global state
└── types/
    └── bhishon.types.ts             # TypeScript interfaces
```

### 4.3 React Flow Graph Implementation

```tsx
// AttackGraph.tsx
import ReactFlow, { 
  Node, Edge, Background, Controls, MiniMap 
} from 'reactflow';

const RISK_ZONE_COLORS = {
  INTERNET_FACING: '#ef4444',   // red-500
  DMZ: '#f97316',               // orange-500
  INTERNAL: '#eab308',          // yellow-500
  CRITICAL: '#7c3aed',          // purple-600
  SAFE: '#22c55e',              // green-500
};

export function AttackGraph({ scanData, onNodeClick }) {
  const { nodes, edges } = useGraphData(scanData);
  const [blastRadiusNodes, setBlastRadiusNodes] = useState<Set<string>>(new Set());

  const handleNodeClick = (_, node: Node) => {
    // Trigger blast radius animation
    const reachable = getReachableNodes(node.id, scanData.attack_paths);
    setBlastRadiusNodes(new Set(reachable));
    onNodeClick(node);
  };

  const styledNodes = nodes.map(node => ({
    ...node,
    style: {
      background: RISK_ZONE_COLORS[node.data.risk_zone],
      border: blastRadiusNodes.has(node.id) 
        ? '3px solid #ff0000' 
        : '1px solid rgba(255,255,255,0.2)',
      animation: blastRadiusNodes.has(node.id) 
        ? 'pulse 1s ease-in-out infinite' 
        : 'none',
    }
  }));

  return (
    <ReactFlow
      nodes={styledNodes}
      edges={edges}
      onNodeClick={handleNodeClick}
      fitView
    >
      <Background variant="dots" gap={20} color="#1f2937" />
      <Controls />
      <MiniMap 
        nodeColor={n => RISK_ZONE_COLORS[n.data?.risk_zone] || '#gray'}
      />
    </ReactFlow>
  );
}
```

### 4.4 WebSocket Live Updates

```ts
// useScanWebSocket.ts
export function useScanWebSocket(sessionId: string) {
  const { addNode, updatePath, setStatus } = useScanStore();

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/scan/${sessionId}`);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      switch(msg.type) {
        case 'NODE_DISCOVERED':
          addNode(msg.payload);
          break;
        case 'ATTACK_PATH_FOUND':
          updatePath(msg.payload);
          break;
        case 'SCAN_COMPLETE':
          setStatus('complete');
          break;
      }
    };

    return () => ws.close();
  }, [sessionId]);
}
```

---

## 5. AI Remediation Engine

*See AI Interaction Specification document for full prompt design and flow.*

### 5.1 Trigger Points

```python
# Remediation triggered from server after attack path scoring
async def generate_remediation(
    vulnerability: Vulnerability, 
    node: NetworkNode,
    attack_path: AttackPath
) -> RemediationScript:
    
    prompt = build_remediation_prompt(vulnerability, node, attack_path)
    
    response = await anthropic_client.messages.create(
        model="claude-opus-4-5",
        max_tokens=2000,
        system=REMEDIATION_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return parse_remediation_response(response)
```

---

## 6. Database / Storage

For hackathon scope, all data is **in-memory** with optional JSON file persistence.

```python
# In-memory stores (FastAPI app state)
class AppState:
    scan_sessions: Dict[str, ScanSession] = {}
    network_graphs: Dict[str, nx.DiGraph] = {}
    attack_paths: Dict[str, List[AttackPath]] = {}
    remediation_scripts: Dict[str, List[RemediationScript]] = {}
```

**Post-hackathon DB migration path:** PostgreSQL + SQLAlchemy for sessions, TimescaleDB for scan time-series, Neo4j for graph persistence.

---

## 7. Security Considerations

- Edge agents authenticate with HMAC-signed API keys
- All scan data transmitted over HTTPS/WSS in production
- Demo network MUST be isolated lab environment — no production scanning
- AI-generated scripts presented with disclaimer: "Review before running in production"
- CVE data sourced from NVD (public domain) — no proprietary threat intel required

---

## 8. Performance Requirements

| Requirement | Target |
|---|---|
| Agent scan time (/24 network) | < 60 seconds |
| Graph render (500 nodes) | < 3 seconds |
| Attack path calculation | < 5 seconds |
| AI remediation generation | < 10 seconds per vuln |
| WebSocket latency | < 200ms |
| Blast radius animation | < 500ms |

---

## 9. Development Setup

```bash
# Backend
cd backend/
pip install fastapi uvicorn networkx anthropic httpx python-nmap pydantic

# Run server
uvicorn main:app --reload --port 8000

# Edge Agent (on target machine)
pip install python-nmap httpx
python bhishon_agent.py --server http://YOUR_SERVER_IP:8000 --target 192.168.1.0/24

# Frontend
cd frontend/
npm install
npm run dev    # Vite dev server on :5173
```

---

*Document ends. For AI prompt engineering details, see AI Interaction Specification.*
