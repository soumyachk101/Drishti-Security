"""NetworkX-based attack path discovery and graph construction."""

import networkx as nx

from models import (
    NetworkNode, AttackPath, AttackStep, RiskZone,
)

# Zone multipliers for risk scoring
ZONE_MULTIPLIERS = {
    RiskZone.INTERNET_FACING: 2.5,
    RiskZone.DMZ: 1.8,
    RiskZone.INTERNAL: 1.0,
    RiskZone.CRITICAL: 3.0,
}

# IBM Cost of Data Breach 2024 (India average)
BASE_BREACH_COST_USD = 2_180_000


def build_network_graph(nodes: list[NetworkNode]) -> nx.DiGraph:
    """Build directed graph from scan nodes."""
    G = nx.DiGraph()

    for node in nodes:
        G.add_node(
            node.id,
            hostname=node.hostname,
            risk_zone=node.risk_zone,
            cvss_max=node.cvss_max,
            asset_criticality=node.asset_criticality,
            os=node.os,
        )

    # Add edges between nodes based on network proximity and open ports
    # Nodes in same subnet can reach each other
    for i, n1 in enumerate(nodes):
        for j, n2 in enumerate(nodes):
            if i >= j:
                continue
            # Determine if exploitable connection exists
            if _can_reach(n1, n2):
                weight = _edge_weight(n1, n2)
                G.add_edge(n1.id, n2.id, weight=weight, exploit=_best_exploit(n1, n2))
            if _can_reach(n2, n1):
                weight = _edge_weight(n2, n1)
                G.add_edge(n2.id, n1.id, weight=weight, exploit=_best_exploit(n2, n1))

    return G


def _can_reach(source: NetworkNode, target: NetworkNode) -> bool:
    """Check if source can reach target (simplified for demo)."""
    zone_order = {
        RiskZone.INTERNET_FACING: 0,
        RiskZone.DMZ: 1,
        RiskZone.INTERNAL: 2,
        RiskZone.CRITICAL: 3,
    }
    return zone_order.get(source.risk_zone, 0) < zone_order.get(target.risk_zone, 0)


def _edge_weight(_source: NetworkNode, target: NetworkNode) -> float:
    """Lower weight = easier to exploit = higher priority path."""
    max_vuln = max(
        (v.cvss_v3 for v in target.vulnerabilities),
        default=5.0,
    )
    # Invert so shortest path = most dangerous
    return 10.0 - max_vuln


def _best_exploit(_source: NetworkNode, target: NetworkNode) -> str:
    """Find best exploit vector from source to target."""
    if not target.vulnerabilities:
        return "unknown"
    best = max(target.vulnerabilities, key=lambda v: v.cvss_v3 * v.epss_score)
    port = target.open_ports[0].port if target.open_ports else 0
    return f"{best.cve_id} via port {port}"


def discover_attack_paths(
    nodes: list[NetworkNode],
    G: nx.DiGraph,
) -> list[AttackPath]:
    """Find attack paths from internet-facing nodes to critical assets."""
    entry_points = [
        n.id for n in nodes
        if n.risk_zone == RiskZone.INTERNET_FACING
    ]
    crown_jewels = [
        n.id for n in nodes
        if n.risk_zone == RiskZone.CRITICAL
    ]

    node_map = {n.id: n for n in nodes}
    paths = []

    for entry in entry_points:
        for target in crown_jewels:
            try:
                raw_path = nx.shortest_path(G, entry, target, weight="weight")
                if len(raw_path) < 2:
                    continue

                steps = []
                mitre_tactics = []
                blast_radius = list(raw_path[1:])  # all nodes after entry

                for i in range(len(raw_path) - 1):
                    edge_data = G[raw_path[i]][raw_path[i + 1]]
                    target_node = node_map.get(raw_path[i + 1])
                    cvss = target_node.cvss_max if target_node else 5.0

                    steps.append(AttackStep(
                        from_node=raw_path[i],
                        to_node=raw_path[i + 1],
                        exploit_vector=edge_data.get("exploit", "unknown"),
                        cvss_score=cvss,
                    ))

                    if target_node:
                        for v in target_node.vulnerabilities:
                            if v.mitre_tactic and v.mitre_tactic not in mitre_tactics:
                                mitre_tactics.append(v.mitre_tactic)

                total_risk = _score_path(raw_path, G, node_map)
                financial = _calculate_financial_impact(steps, node_map)

                paths.append(AttackPath(
                    id=f"path-{len(paths) + 1:03d}",
                    steps=steps,
                    total_risk_score=total_risk,
                    blast_radius=blast_radius,
                    financial_impact_usd=financial,
                    mitre_tactics=mitre_tactics,
                ))
            except nx.NetworkXNoPath:
                continue

    # Sort by risk score descending
    paths.sort(key=lambda p: p.total_risk_score, reverse=True)
    return paths


def _score_path(
    path: list[str],
    G: nx.DiGraph,
    node_map: dict[str, NetworkNode],
) -> float:
    """Score attack path: CVSS × reachability × asset criticality."""
    score = 0.0
    for i in range(len(path) - 1):
        node = node_map.get(path[i + 1])
        if not node:
            continue
        zone_mult = ZONE_MULTIPLIERS.get(node.risk_zone, 1.0)
        score += node.cvss_max * zone_mult * node.asset_criticality
    return round(score, 1)


def _calculate_financial_impact(
    steps: list[AttackStep],
    node_map: dict[str, NetworkNode],
) -> float:
    """Calculate financial risk: breach_cost × EPSS × criticality × zone."""
    max_risk = 0.0
    for step in steps:
        node = node_map.get(step.to_node)
        if not node:
            continue
        for vuln in node.vulnerabilities:
            zone_factor = ZONE_MULTIPLIERS.get(node.risk_zone, 1.0)
            risk = BASE_BREACH_COST_USD * vuln.epss_score * node.asset_criticality * zone_factor
            max_risk = max(max_risk, risk)
    return round(max_risk, 0)


def get_reachable_nodes(
    node_id: str,
    G: nx.DiGraph,
) -> list[str]:
    """Get all nodes reachable from given node (blast radius)."""
    if node_id not in G:
        return []
    reachable = nx.descendants(G, node_id)
    return list(reachable)
