"""Financial risk calculation and risk zone utilities."""

from models import NetworkNode, Vulnerability, RiskZone

BASE_BREACH_COST_USD = 2_180_000

ZONE_MULTIPLIERS = {
    RiskZone.INTERNET_FACING: 2.5,
    RiskZone.DMZ: 1.8,
    RiskZone.INTERNAL: 1.0,
    RiskZone.CRITICAL: 3.0,
}


def calculate_financial_risk(vuln: Vulnerability, node: NetworkNode) -> float:
    """Financial Risk = Avg_Breach_Cost × P(exploit) × criticality × zone_factor."""
    p_exploit = vuln.epss_score
    criticality = node.asset_criticality
    zone_factor = ZONE_MULTIPLIERS.get(node.risk_zone, 1.0)
    return round(BASE_BREACH_COST_USD * p_exploit * criticality * zone_factor, 0)


def enrich_vulnerabilities(nodes: list[NetworkNode]) -> list[NetworkNode]:
    """Add financial_risk_usd to each vulnerability."""
    for node in nodes:
        for vuln in node.vulnerabilities:
            vuln.financial_risk_usd = calculate_financial_risk(vuln, node)
    return nodes


def get_risk_summary(nodes: list[NetworkNode]) -> dict:
    """Generate risk summary stats."""
    total_vulns = sum(len(n.vulnerabilities) for n in nodes)
    critical_vulns = sum(
        1 for n in nodes
        for v in n.vulnerabilities
        if v.cvss_v3 >= 9.0
    )
    total_financial = sum(
        v.financial_risk_usd or 0
        for n in nodes
        for v in n.vulnerabilities
    )
    internet_facing = sum(
        1 for n in nodes
        if n.risk_zone == RiskZone.INTERNET_FACING
    )
    return {
        "total_nodes": len(nodes),
        "total_vulnerabilities": total_vulns,
        "critical_vulnerabilities": critical_vulns,
        "total_financial_risk_usd": total_financial,
        "internet_facing_nodes": internet_facing,
    }
