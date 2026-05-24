"""Report generation — styled HTML report for hackathon demo."""

from datetime import datetime
from models import ScanSession, NetworkNode, AttackPath


def generate_report_html(session: ScanSession) -> str:
    """Generate full HTML report for a scan session."""
    nodes_by_zone = _group_by_zone(session.nodes)
    total_financial = sum(
        v.financial_risk_usd or 0
        for n in session.nodes
        for v in n.vulnerabilities
    )
    top_paths = session.attack_paths[:5]

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Bhishon Security Report — Session {session.id}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Inter', -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px; }}
  .page {{ max-width: 900px; margin: 0 auto; }}
  .header {{ text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #ef4444; }}
  .header h1 {{ font-size: 28px; color: #fff; }}
  .header p {{ color: #94a3b8; margin-top: 8px; }}
  .section {{ margin-bottom: 32px; }}
  .section h2 {{ font-size: 20px; color: #ef4444; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #1e293b; }}
  .section h3 {{ font-size: 16px; color: #f97316; margin: 12px 0 8px; }}
  .stats-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }}
  .stat-card {{ background: #1e293b; border-radius: 8px; padding: 16px; text-align: center; }}
  .stat-value {{ font-size: 24px; font-weight: bold; }}
  .stat-label {{ font-size: 12px; color: #94a3b8; margin-top: 4px; }}
  .stat-red {{ color: #ef4444; }}
  .stat-orange {{ color: #f97316; }}
  .stat-yellow {{ color: #eab308; }}
  .stat-blue {{ color: #3b82f6; }}
  .stat-green {{ color: #22c55e; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
  th {{ background: #1e293b; color: #94a3b8; font-size: 12px; text-transform: uppercase; padding: 10px 12px; text-align: left; }}
  td {{ padding: 10px 12px; border-bottom: 1px solid #1e293b; font-size: 14px; }}
  .badge {{ display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }}
  .badge-critical {{ background: #dc2626; color: #fff; }}
  .badge-high {{ background: #ea580c; color: #fff; }}
  .badge-medium {{ background: #ca8a04; color: #000; }}
  .badge-zone {{ background: #334155; color: #cbd5e1; }}
  .path-card {{ background: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #ef4444; }}
  .path-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }}
  .path-steps {{ margin-top: 8px; }}
  .path-step {{ display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; }}
  .step-num {{ background: #ef4444; color: #fff; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; }}
  .financial {{ color: #ef4444; font-weight: bold; }}
  .exec-summary {{ background: #1e293b; border-radius: 8px; padding: 20px; line-height: 1.7; font-size: 15px; }}
  .footer {{ text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #1e293b; color: #64748b; font-size: 12px; }}
  @media print {{
    body {{ background: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
    .page {{ max-width: 100%; }}
  }}
</style>
</head>
<body>
<div class="page">

<div class="header">
  <h1>Bhishon Security — Risk Intelligence Report</h1>
  <p>Session: {session.id} | Generated: {datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")} | Status: {session.status.upper()}</p>
</div>

<div class="section">
  <h2>Executive Summary</h2>
  <div class="exec-summary">
    Network assessment identified <strong>{session.total_vuln_count} vulnerabilities</strong> across
    <strong>{len(session.nodes)} nodes</strong>, with <strong>{session.critical_vuln_count} rated critical</strong>.
    The top {len(top_paths)} attack paths represent a combined financial exposure of
    <strong class="financial">${total_financial:,.0f}</strong>.
    The most critical asset at risk is <strong>{session.most_critical_target or "N/A"}</strong>.
    {session.internet_facing_count} internet-facing nodes
    provide direct entry points for attackers.
    Immediate remediation of the highest-priority vulnerabilities would eliminate the majority of identified risk.
  </div>
</div>

<div class="section">
  <h2>Risk Overview</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value stat-blue">{len(session.nodes)}</div>
      <div class="stat-label">Nodes Scanned</div>
    </div>
    <div class="stat-card">
      <div class="stat-value stat-yellow">{session.total_vuln_count}</div>
      <div class="stat-label">Vulnerabilities</div>
    </div>
    <div class="stat-card">
      <div class="stat-value stat-red">{session.critical_vuln_count}</div>
      <div class="stat-label">Critical CVEs</div>
    </div>
    <div class="stat-card">
      <div class="stat-value stat-green">${total_financial:,.0f}</div>
      <div class="stat-label">Financial Exposure</div>
    </div>
  </div>
</div>

<div class="section">
  <h2>Top Attack Paths</h2>
  {_render_attack_paths(top_paths)}
</div>

<div class="section">
  <h2>Network Topology</h2>
  {_render_topology(nodes_by_zone)}
</div>

<div class="section">
  <h2>Vulnerability Inventory</h2>
  {_render_vuln_table(session.nodes)}
</div>

<div class="section">
  <h2>Remediation Roadmap</h2>
  {_render_remediation_roadmap(session.nodes, top_paths)}
</div>

<div class="footer">
  Bhishon Security — AI-Powered Network Risk Intelligence Platform<br/>
  Report generated for hackathon demonstration purposes.
</div>

</div>
</body>
</html>"""


def _group_by_zone(nodes: list[NetworkNode]) -> dict[str, list[NetworkNode]]:
    zones: dict[str, list[NetworkNode]] = {}
    for n in nodes:
        zone = n.risk_zone.value
        zones.setdefault(zone, []).append(n)
    return zones


def _cvss_badge(score: float) -> str:
    if score >= 9.0:
        cls = "badge-critical"
    elif score >= 7.0:
        cls = "badge-high"
    else:
        cls = "badge-medium"
    return f'<span class="badge {cls}">CVSS {score}</span>'


def _zone_badge(zone: str) -> str:
    return f'<span class="badge badge-zone">{zone}</span>'


def _render_attack_paths(paths: list[AttackPath]) -> str:
    if not paths:
        return "<p>No attack paths found.</p>"
    html = ""
    for i, p in enumerate(paths):
        steps_html = ""
        for j, s in enumerate(p.steps):
            steps_html += f"""
            <div class="path-step">
              <span class="step-num">{j + 1}</span>
              <span>{s.from_node} &rarr; {s.to_node}</span>
              <span style="color:#94a3b8;font-size:12px">({s.exploit_vector})</span>
            </div>"""
        tactics = " ".join(f'<span class="badge badge-zone">{t}</span>' for t in p.mitre_tactics)
        html += f"""
    <div class="path-card">
      <div class="path-header">
        <strong>Path #{i + 1}: {p.steps[0].from_node} &rarr; {p.steps[-1].to_node}</strong>
        <span class="financial">${p.financial_impact_usd:,.0f}</span>
      </div>
      <div style="font-size:12px;color:#94a3b8">Risk Score: {p.total_risk_score} | {len(p.steps)} hops | {tactics}</div>
      <div class="path-steps">{steps_html}</div>
    </div>"""
    return html


def _render_topology(nodes_by_zone: dict[str, list[NetworkNode]]) -> str:
    zone_order = ["INTERNET_FACING", "DMZ", "INTERNAL", "CRITICAL"]
    html = ""
    for zone in zone_order:
        nodes = nodes_by_zone.get(zone, [])
        if not nodes:
            continue
        html += f"<h3>{zone} ({len(nodes)} nodes)</h3><table><tr><th>IP</th><th>Hostname</th><th>OS</th><th>CVSS Max</th><th>Vulns</th></tr>"
        for n in nodes:
            html += f"<tr><td>{n.id}</td><td>{n.hostname or 'N/A'}</td><td>{n.os or 'N/A'}</td><td>{_cvss_badge(n.cvss_max)}</td><td>{len(n.vulnerabilities)}</td></tr>"
        html += "</table>"
    return html


def _render_vuln_table(nodes: list[NetworkNode]) -> str:
    vulns = []
    for n in nodes:
        for v in n.vulnerabilities:
            vulns.append((n, v))
    vulns.sort(key=lambda x: x[1].cvss_v3, reverse=True)

    html = "<table><tr><th>CVE</th><th>Node</th><th>Service</th><th>CVSS</th><th>EPSS</th><th>Financial Risk</th><th>Tactic</th></tr>"
    for n, v in vulns:
        html += f"""<tr>
          <td><strong>{v.cve_id}</strong></td>
          <td>{n.hostname or n.id}</td>
          <td>{v.affected_service}</td>
          <td>{_cvss_badge(v.cvss_v3)}</td>
          <td>{(v.epss_score * 100):.0f}%</td>
          <td class="financial">${(v.financial_risk_usd or 0):,.0f}</td>
          <td>{v.mitre_tactic or 'N/A'}</td>
        </tr>"""
    html += "</table>"
    return html


def _render_remediation_roadmap(nodes: list[NetworkNode], paths: list[AttackPath]) -> str:
    # Collect all vulns from attack path nodes, prioritize by CVSS * EPSS
    path_node_ids = set()
    for p in paths:
        for s in p.steps:
            path_node_ids.add(s.to_node)

    priority_vulns = []
    for n in nodes:
        for v in n.vulnerabilities:
            if n.id in path_node_ids:
                priority_vulns.append((n, v, v.cvss_v3 * v.epss_score))

    priority_vulns.sort(key=lambda x: x[2], reverse=True)

    html = "<p style='margin-bottom:12px;color:#94a3b8;font-size:14px'>Remediations ordered by attack path priority (CVSS x EPSS):</p>"
    html += "<table><tr><th>#</th><th>CVE</th><th>Node</th><th>Service</th><th>Action</th></tr>"
    for i, (n, v, _) in enumerate(priority_vulns[:10]):
        action = _suggested_action(v)
        html += f"""<tr>
          <td>{i + 1}</td>
          <td><strong>{v.cve_id}</strong></td>
          <td>{n.hostname or n.id}</td>
          <td>{v.affected_service}</td>
          <td>{action}</td>
        </tr>"""
    html += "</table>"
    return html


def _suggested_action(v) -> str:
    service = v.affected_service.lower()
    if "default" in v.cve_id.lower() or "cred" in v.description.lower():
        return "Rotate credentials"
    if "firewall" in service or "port" in v.description.lower():
        return "Block port / add firewall rule"
    if any(s in service for s in ["ssh", "openssh", "tomcat", "nginx", "redis", "mysql"]):
        return f"Patch {service} to latest"
    return "Apply vendor patch"
