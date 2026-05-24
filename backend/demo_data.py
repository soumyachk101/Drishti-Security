"""Demo scan data for hackathon — realistic network topology."""

from models import (
    NetworkNode, PortInfo, Vulnerability, RiskZone, ScanSession,
    AttackPath, AttackStep,
)

DEMO_NODES = [
    NetworkNode(
        id="203.0.113.45",
        hostname="web-prod-01",
        os="Ubuntu 22.04",
        risk_zone=RiskZone.INTERNET_FACING,
        asset_criticality=0.7,
        open_ports=[
            PortInfo(port=80, service="http", version="nginx/1.24"),
            PortInfo(port=443, service="https", version="nginx/1.24"),
            PortInfo(port=8080, service="http-proxy", version="Apache Tomcat/9.0.36"),
        ],
        vulnerabilities=[
            Vulnerability(
                cve_id="CVE-2020-9484",
                cvss_v3=7.5,
                epss_score=0.42,
                description="Apache Tomcat session deserialization RCE via crafted session ID",
                affected_service="tomcat",
                mitre_tactic="Initial Access",
            ),
            Vulnerability(
                cve_id="CVE-2024-21733",
                cvss_v3=5.3,
                epss_score=0.18,
                description="Apache Tomcat HTTP request smuggling via incomplete POST data",
                affected_service="tomcat",
                mitre_tactic="Initial Access",
            ),
        ],
        cvss_max=7.5,
    ),
    NetworkNode(
        id="10.0.1.15",
        hostname="jump-box-01",
        os="CentOS 7.9",
        risk_zone=RiskZone.DMZ,
        asset_criticality=0.6,
        open_ports=[
            PortInfo(port=22, service="ssh", version="OpenSSH 7.4"),
            PortInfo(port=3389, service="rdp", version="xrdp 0.9"),
        ],
        vulnerabilities=[
            Vulnerability(
                cve_id="CVE-2023-38408",
                cvss_v3=9.8,
                epss_score=0.35,
                description="OpenSSH agent forwarding RCE — allows remote code execution via crafted agent",
                affected_service="openssh",
                mitre_tactic="Lateral Movement",
            ),
        ],
        cvss_max=9.8,
    ),
    NetworkNode(
        id="10.0.1.40",
        hostname="db-primary-01",
        os="Ubuntu 20.04",
        risk_zone=RiskZone.CRITICAL,
        asset_criticality=1.0,
        open_ports=[
            PortInfo(port=3306, service="mysql", version="MySQL 8.0.32"),
            PortInfo(port=22, service="ssh", version="OpenSSH 8.2"),
        ],
        vulnerabilities=[
            Vulnerability(
                cve_id="CVE-2023-21977",
                cvss_v3=7.5,
                epss_score=0.22,
                description="MySQL Server unauthorized access vulnerability",
                affected_service="mysql",
                mitre_tactic="Privilege Escalation",
            ),
            Vulnerability(
                cve_id="DEFAULT-DB-CRED",
                cvss_v3=9.1,
                epss_score=0.65,
                description="Default credentials found on MySQL backup account — no password required",
                affected_service="mysql",
                mitre_tactic="Initial Access",
            ),
        ],
        cvss_max=9.1,
    ),
    NetworkNode(
        id="10.0.1.60",
        hostname="app-server-01",
        os="Ubuntu 22.04",
        risk_zone=RiskZone.INTERNAL,
        asset_criticality=0.8,
        open_ports=[
            PortInfo(port=8000, service="http", version="uvicorn/0.30"),
            PortInfo(port=6379, service="redis", version="Redis 7.0"),
            PortInfo(port=22, service="ssh", version="OpenSSH 8.9"),
        ],
        vulnerabilities=[
            Vulnerability(
                cve_id="CVE-2022-0543",
                cvss_v3=10.0,
                epss_score=0.51,
                description="Redis Lua sandbox escape — allows remote code execution",
                affected_service="redis",
                mitre_tactic="Execution",
            ),
        ],
        cvss_max=10.0,
    ),
    NetworkNode(
        id="192.168.1.100",
        hostname="admin-workstation",
        os="Windows 11 Pro",
        risk_zone=RiskZone.INTERNAL,
        asset_criticality=0.4,
        open_ports=[
            PortInfo(port=445, service="smb", version="SMB 3.1.1"),
            PortInfo(port=3389, service="rdp", version="RDP 10"),
        ],
        vulnerabilities=[
            Vulnerability(
                cve_id="CVE-2024-38063",
                cvss_v3=9.8,
                epss_score=0.38,
                description="Windows TCP/IP remote code execution via IPv6 fragmentation",
                affected_service="windows-tcpip",
                mitre_tactic="Initial Access",
            ),
        ],
        cvss_max=9.8,
    ),
]

DEMO_ATTACK_PATHS = [
    AttackPath(
        id="path-001",
        steps=[
            AttackStep(
                from_node="internet",
                to_node="203.0.113.45",
                exploit_vector="CVE-2020-9484 via port 8080 — Tomcat session deserialization",
                cvss_score=7.5,
            ),
            AttackStep(
                from_node="203.0.113.45",
                to_node="10.0.1.15",
                exploit_vector="CVE-2023-38408 via port 22 — SSH agent forwarding RCE",
                cvss_score=9.8,
            ),
            AttackStep(
                from_node="10.0.1.15",
                to_node="10.0.1.40",
                exploit_vector="DEFAULT-DB-CRED via port 3306 — MySQL default credentials",
                cvss_score=9.1,
            ),
        ],
        total_risk_score=87.5,
        blast_radius=["10.0.1.40", "10.0.1.60", "192.168.1.100"],
        financial_impact_usd=2_180_000,
        mitre_tactics=["Initial Access", "Lateral Movement", "Credential Access"],
    ),
    AttackPath(
        id="path-002",
        steps=[
            AttackStep(
                from_node="internet",
                to_node="203.0.113.45",
                exploit_vector="CVE-2020-9484 via port 8080 — Tomcat session deserialization",
                cvss_score=7.5,
            ),
            AttackStep(
                from_node="203.0.113.45",
                to_node="10.0.1.60",
                exploit_vector="CVE-2022-0543 via port 6379 — Redis Lua sandbox escape",
                cvss_score=10.0,
            ),
        ],
        total_risk_score=72.3,
        blast_radius=["10.0.1.60", "10.0.1.40"],
        financial_impact_usd=1_850_000,
        mitre_tactics=["Initial Access", "Execution"],
    ),
    AttackPath(
        id="path-003",
        steps=[
            AttackStep(
                from_node="internet",
                to_node="192.168.1.100",
                exploit_vector="CVE-2024-38063 via port 445 — Windows TCP/IP RCE",
                cvss_score=9.8,
            ),
            AttackStep(
                from_node="192.168.1.100",
                to_node="10.0.1.15",
                exploit_vector="CVE-2023-38408 via port 22 — SSH agent forwarding",
                cvss_score=9.8,
            ),
        ],
        total_risk_score=65.1,
        blast_radius=["10.0.1.15", "10.0.1.40"],
        financial_impact_usd=1_420_000,
        mitre_tactics=["Initial Access", "Lateral Movement"],
    ),
]


def fetch_ip_geojson(ip: str) -> dict:
    """Fetch public Geo-IP and ISP metadata for public IPs to enrich dashboard."""
    import httpx
    try:
        clean_ip = ip.strip().split("/")[0]
        # Skip private/local IPs
        if clean_ip in ("127.0.0.1", "localhost") or clean_ip.startswith(("10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.")):
            return {}
        
        resp = httpx.get(f"http://ip-api.com/json/{clean_ip}", timeout=2.0)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "success":
                return {
                    "isp": data.get("isp", "Unknown ISP"),
                    "city": data.get("city", ""),
                    "country": data.get("country", ""),
                }
    except Exception:
        pass
    return {}


def build_demo_scan(session_id: str, target: str = None) -> ScanSession:
    """Build complete demo scan session, optionally customized with a target IP/network."""
    nodes = DEMO_NODES
    paths = DEMO_ATTACK_PATHS

    if target:
        import ipaddress
        target_ip = target.strip()
        if "/" in target_ip:
            try:
                net = ipaddress.ip_network(target_ip, strict=False)
                hosts = list(net.hosts())
                if hosts:
                    target_ip = str(hosts[0])
                else:
                    target_ip = str(net.network_address)
            except ValueError:
                target_ip = target_ip.split("/")[0]

        # Fetch real GeoIP data if available
        geoip = fetch_ip_geojson(target_ip)

        # Customize entry node ID and hostname
        nodes = []
        for n in DEMO_NODES:
            if n.id == "203.0.113.45":
                new_n = n.model_copy(deep=True)
                new_n.id = target_ip
                if geoip:
                    new_n.hostname = f"isp-{geoip['isp'].lower().replace(' ', '-')}"
                    new_n.os = f"Linux / Windows (Geo: {geoip['city']}, {geoip['country']})"
                else:
                    if target_ip in ("127.0.0.1", "localhost"):
                        new_n.hostname = "local-loopback"
                        new_n.os = "macOS (Localhost)"
                    elif "." in target_ip and all(p.isdigit() for p in target_ip.split(".")):
                        new_n.hostname = f"host-{target_ip.split('.')[-1]}"
                        new_n.os = "Ubuntu 22.04"
                    else:
                        new_n.hostname = target_ip.split(".")[0]
                        new_n.os = "Ubuntu 22.04"
                nodes.append(new_n)
            else:
                nodes.append(n.model_copy(deep=True))

        # Update attack paths with new entry IP
        paths = []
        for p in DEMO_ATTACK_PATHS:
            new_p = p.model_copy(deep=True)
            for step in new_p.steps:
                if step.from_node == "203.0.113.45":
                    step.from_node = target_ip
                if step.to_node == "203.0.113.45":
                    step.to_node = target_ip
                step.exploit_vector = step.exploit_vector.replace("203.0.113.45", target_ip)
            new_br = []
            for br in new_p.blast_radius:
                if br == "203.0.113.45":
                    new_br.append(target_ip)
                else:
                    new_br.append(br)
            new_p.blast_radius = new_br
            paths.append(new_p)

    vuln_count = sum(len(n.vulnerabilities) for n in nodes)
    critical_count = sum(
        1 for n in nodes
        for v in n.vulnerabilities
        if v.cvss_v3 >= 9.0
    )
    internet_count = sum(
        1 for n in nodes
        if n.risk_zone == RiskZone.INTERNET_FACING
    )

    # Find most critical target
    max_crit = max(nodes, key=lambda n: n.asset_criticality * n.cvss_max)

    return ScanSession(
        id=session_id,
        status="complete",
        nodes=nodes,
        attack_paths=paths,
        total_vuln_count=vuln_count,
        critical_vuln_count=critical_count,
        internet_facing_count=internet_count,
        most_critical_target=max_crit.hostname or max_crit.id,
    )
