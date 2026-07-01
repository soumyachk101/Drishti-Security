"""Bhishon Edge Agent - Lightweight Python scanner for edge nodes."""

import argparse
import datetime
import socket
import logging
import json
import httpx
import nmap
import ipaddress
import os

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Re-use the mocked CVE data for the hackathon demo since querying NVD live can be slow/rate-limited
SERVICE_CVE_MAP = {
    "ssh": [{"cve": "CVE-2024-6387", "cvss": 8.1, "epss": 0.12}],
    "http": [{"cve": "CVE-2023-44487", "cvss": 7.5, "epss": 0.35}],
    "https": [{"cve": "CVE-2023-44487", "cvss": 7.5, "epss": 0.35}],
    "ssl": [{"cve": "CVE-2022-3786", "cvss": 7.5, "epss": 0.08}],
    "mysql": [{"cve": "CVE-2023-21980", "cvss": 7.5, "epss": 0.04}],
    "postgresql": [{"cve": "CVE-2024-4317", "cvss": 8.8, "epss": 0.02}],
    "redis": [{"cve": "CVE-2023-45145", "cvss": 7.0, "epss": 0.06}],
    "mongodb": [{"cve": "CVE-2023-0436", "cvss": 7.5, "epss": 0.03}],
    "smb": [{"cve": "CVE-2023-23397", "cvss": 9.8, "epss": 0.18}],
    "rdp": [{"cve": "CVE-2024-49112", "cvss": 9.8, "epss": 0.22}],
    "ftp": [{"cve": "CVE-2024-1208", "cvss": 7.5, "epss": 0.05}],
    "tomcat": [{"cve": "CVE-2024-38286", "cvss": 7.5, "epss": 0.09}],
    "nginx": [{"cve": "CVE-2024-7342", "cvss": 6.5, "epss": 0.04}],
    "apache": [{"cve": "CVE-2024-38476", "cvss": 9.8, "epss": 0.11}],
}

class BhishonAgent:
    def __init__(self, server_url: str):
        self.server_url = server_url
        self.local_ip = self._get_local_ip()
        
        # Ensure common macOS binary paths are in environment PATH
        for p_dir in ["/opt/homebrew/bin", "/usr/local/bin"]:
            if p_dir not in os.environ.get("PATH", "").split(os.pathsep):
                os.environ["PATH"] = f"{p_dir}{os.pathsep}{os.environ.get('PATH', '')}"

    def _get_local_ip(self) -> str:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(('10.255.255.255', 1))
            ip = s.getsockname()[0]
        except Exception:
            ip = '127.0.0.1'
        finally:
            s.close()
        return ip

    def run_scan(self, target_network: str):
        logger.info(f"Starting edge scan on {target_network}")
        
        try:
            nm = nmap.PortScanner()
        except nmap.PortScannerError:
            logger.error("Nmap binary not found! Please install nmap.")
            return

        common_ports = "22,80,443,445,3389,3306,5432,6379,8080,21,53"
        try:
            nm.scan(hosts=target_network, arguments=f"-sV -T4 -p {common_ports} --open")
        except Exception as e:
            logger.error(f"Scan failed: {e}")
            return
            
        nodes = []
        for host in nm.all_hosts():
            host_info = nm[host]
            os_name = None
            if "osmatch" in host_info and host_info["osmatch"]:
                os_name = host_info["osmatch"][0].get("name")
                
            ports = []
            cves_for_node = []
            
            for proto in host_info.all_protocols():
                for port in host_info[proto]:
                    svc = host_info[proto][port]
                    service_name = svc.get("name", "unknown")
                    ports.append({
                        "port": port,
                        "protocol": proto,
                        "service": service_name,
                        "version": svc.get("version", "")
                    })
                    
                    # Local CVE Enrichment
                    for key, vulns in SERVICE_CVE_MAP.items():
                        if key in service_name.lower():
                            for v in vulns:
                                cves_for_node.append({
                                    "cve_id": v["cve"],
                                    "cvss_v3": v["cvss"],
                                    "epss_score": v["epss"],
                                    "affected_service": service_name,
                                    "description": f"Vulnerability in {service_name}"
                                })

            nodes.append({
                "ip": host,
                "hostname": host_info.hostname() or "",
                "os": os_name,
                "open_ports": ports,
                "cves": cves_for_node
            })

        # EDGE FILTERING
        metadata = self._filter_to_metadata(nodes)
        
        # Report to central server
        self._report_to_server(metadata)

    def _filter_to_metadata(self, nodes: list) -> dict:
        """Strips out heavy packet info, leaves only metadata."""
        return {
            "agent_ip": self.local_ip,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "nodes": nodes
        }

    def _report_to_server(self, payload: dict):
        endpoint = f"{self.server_url.rstrip('/')}/api/v1/agents/report"
        logger.info(f"Sending {len(payload['nodes'])} discovered nodes to {endpoint}")
        try:
            resp = httpx.post(endpoint, json=payload, timeout=10.0)
            resp.raise_for_status()
            logger.info(f"Server acknowledged: {resp.json()}")
        except Exception as e:
            logger.error(f"Failed to send report to server: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bhishon Security Edge Agent")
    parser.add_argument("--server", required=True, help="Central server URL")
    parser.add_argument("--target", required=False, help="Target network (e.g. 192.168.1.0/24)")
    args = parser.parse_args()
    
    agent = BhishonAgent(server_url=args.server)
    target = args.target or agent.local_ip
    agent.run_scan(target)
