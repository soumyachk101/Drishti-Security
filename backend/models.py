from enum import Enum
from typing import Optional
from pydantic import BaseModel


class RiskZone(str, Enum):
    INTERNET_FACING = "INTERNET_FACING"
    DMZ = "DMZ"
    INTERNAL = "INTERNAL"
    CRITICAL = "CRITICAL"


class PortInfo(BaseModel):
    port: int
    protocol: str = "tcp"
    service: str
    version: Optional[str] = None


class Vulnerability(BaseModel):
    cve_id: str
    cvss_v3: float
    epss_score: float
    description: str
    affected_service: str
    mitre_tactic: Optional[str] = None
    financial_risk_usd: Optional[float] = None


class NetworkNode(BaseModel):
    id: str
    hostname: Optional[str] = None
    os: Optional[str] = None
    risk_zone: RiskZone
    asset_criticality: float = 0.5
    open_ports: list[PortInfo] = []
    vulnerabilities: list[Vulnerability] = []
    cvss_max: float = 0.0


class AttackStep(BaseModel):
    from_node: str
    to_node: str
    exploit_vector: str
    cvss_score: float


class AttackPath(BaseModel):
    id: str
    steps: list[AttackStep]
    total_risk_score: float
    blast_radius: list[str]
    financial_impact_usd: float
    mitre_tactics: list[str]


class RemediationScript(BaseModel):
    content: str
    script_type: str = "bash"
    language: str = "bash"
    generated_at: Optional[str] = None
    cve_id: Optional[str] = None


class ScanSession(BaseModel):
    id: str
    status: str = "pending"
    nodes: list[NetworkNode] = []
    attack_paths: list[AttackPath] = []
    total_vuln_count: int = 0
    critical_vuln_count: int = 0
    internet_facing_count: int = 0
    most_critical_target: Optional[str] = None


class ScanStartRequest(BaseModel):
    target_network: str = "192.168.1.0/24"


class RemediateRequest(BaseModel):
    session_id: str
    cve_id: str
    node_id: str
