export interface PortInfo {
  port: number
  protocol: string
  service: string
  version?: string
}

export interface Vulnerability {
  cve_id: string
  cvss_v3: number
  epss_score: number
  description: string
  affected_service: string
  mitre_tactic?: string
  financial_risk_usd?: number
}

export type RiskZone = 'INTERNET_FACING' | 'DMZ' | 'INTERNAL' | 'CRITICAL'

export interface NetworkNode {
  id: string
  hostname?: string
  os?: string
  risk_zone: RiskZone
  asset_criticality: number
  open_ports: PortInfo[]
  vulnerabilities: Vulnerability[]
  cvss_max: number
}

export interface AttackStep {
  from_node: string
  to_node: string
  exploit_vector: string
  cvss_score: number
}

export interface AttackPath {
  id: string
  steps: AttackStep[]
  total_risk_score: number
  blast_radius: string[]
  financial_impact_usd: number
  mitre_tactics: string[]
}

export interface ScanSession {
  id: string
  status: string
  nodes: NetworkNode[]
  attack_paths: AttackPath[]
  total_vuln_count: number
  critical_vuln_count: number
  internet_facing_count: number
  most_critical_target?: string
}

export interface RemediationScript {
  content: string
  script_type: string
  language: string
  generated_at?: string
  cve_id?: string
}

export interface KillChainNarrative {
  path_title: string
  steps: { step: number; title: string; narrative: string }[]
  endgame: string
}
