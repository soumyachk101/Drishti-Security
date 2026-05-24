# Product Requirements Document (PRD)
## Bhishon Security — AI-Powered Network Risk Intelligence Platform
**Version:** 1.0.0  
**Author:** Soumya Chakraborty  
**Date:** May 2026  
**Status:** Hackathon Build

---

## 1. Executive Summary

Bhishon Security is an AI-driven network vulnerability intelligence platform that transforms raw network scan data into prioritized, actionable risk intelligence. Unlike traditional scanners that overwhelm security teams with raw CVE dumps, Bhishon maps attack paths, assigns business-impact dollar values, visualizes the "blast radius" of compromised nodes, and guides step-by-step remediation — all in real time.

**Tagline:** *From raw packets to boardroom-ready risk intelligence.*

---

## 2. Problem Statement

### 2.1 The Real Pain
Modern enterprise networks are vast, heterogeneous, and constantly changing. Security teams face three compounding problems:

| Problem | Impact |
|---|---|
| **Vulnerability Overload** | Tools like Nessus or OpenVAS output thousands of CVEs with no prioritization context |
| **No Attack Path Context** | A medium-severity vulnerability on a DMZ-facing node is far more dangerous than a critical one on an isolated internal server — but scanners don't model this |
| **Executive Communication Gap** | CISOs cannot translate "CVE-2024-XXXX on 47 nodes" into board-level business risk |
| **Remediation Paralysis** | Teams know *what* is vulnerable but not *in what order* to fix, or *how* |

### 2.2 Target Users

**Primary:** Security Engineers / Penetration Testers  
**Secondary:** IT Operations Managers  
**Tertiary:** CISOs / Non-technical executives (via report output)

---

## 3. Product Vision & Goals

### 3.1 Vision
Be the "co-pilot" for every network security team — scanning, reasoning, prioritizing, and remediating threats autonomously.

### 3.2 Hackathon Success Criteria
- [ ] Network scan runs end-to-end (discovery → vulnerability detection → risk scoring)
- [ ] Attack path graph rendered interactively in the UI
- [ ] At least one vulnerability remediation script auto-generated
- [ ] Dollar-value risk assigned to top 3 attack paths
- [ ] Edge-filtering agents reduce data sent to server by ≥70% vs raw packet dumps
- [ ] Single-page report exportable as PDF

---

## 4. Core Features

### Feature 1 — Network Discovery & Vulnerability Scanning
**Priority:** P0 (Must Have)

- Lightweight Python agent deployed on target machines
- Scans open ports, running services, OS fingerprinting via Nmap integration
- CVE correlation against NVD/OSV database
- Detects misconfigurations (open S3 buckets, default credentials, exposed APIs)
- **Edge Filtering:** Agent pre-filters data on-device; only threat metadata (not raw packets) forwarded to server

**Acceptance Criteria:**
- Agent discovers all nodes in /24 subnet within 60 seconds
- CVE data enriched with CVSS v3 scores
- ≤5% false positive rate on open port detection

---

### Feature 2 — Attack Path Mapping (NetworkX Engine)
**Priority:** P0 (Must Have)

- Models network topology as a directed graph using NetworkX
- Nodes = network assets (servers, routers, endpoints, cloud resources)
- Edges = exploitable connections (open ports, trust relationships, lateral movement vectors)
- Runs graph traversal algorithms to identify shortest + most impactful attack paths from internet-exposed nodes to crown jewels (databases, AD servers)
- Assigns "Risk Zone" labels: Internet-Facing, DMZ, Internal, Critical Assets

**Attack Path Scoring Formula:**
```
Path Risk Score = Σ (CVSSv3_score × reachability_weight × asset_criticality)
```

**Acceptance Criteria:**
- Graph renders within 3 seconds for networks up to 500 nodes
- Top 5 attack paths ranked and highlighted
- Each path shows "steps to compromise" chain

---

### Feature 3 — Dynamic Attack Visualization (React Flow / D3.js)
**Priority:** P0 (Must Have)

- Replace static Matplotlib output with interactive React Flow canvas
- Color-coded nodes by risk zone (red = critical, orange = high, yellow = medium, green = low)
- Click any node → see all CVEs, open ports, connected attack paths
- "Blast radius" animation — when a node is selected as "compromised", it highlights all nodes reachable from it in cascade
- Filter by: risk level, subnet, asset type
- Real-time updates as scan data streams in

**Acceptance Criteria:**
- Drag-and-drop node repositioning
- Zoom/pan on graph canvas
- Blast radius animation renders in <500ms

---

### Feature 4 — Agentic Auto-Remediation
**Priority:** P1 (Should Have)

- AI analyzes each vulnerability in context of the attack graph
- Generates ready-to-run remediation scripts:
  - **Ansible playbooks** for Linux/Windows patch management
  - **AWS CLI / Terraform snippets** for cloud misconfigurations
  - **iptables/firewall rules** for unnecessary open ports
  - **Nginx/Apache config patches** for web server misconfigs
- "Fix-It Button" in UI — one click to copy or download the script for a selected vulnerability
- AI explains *why* this remediation is prioritized above others

**Acceptance Criteria:**
- Generated Ansible playbook is syntactically valid YAML
- Remediation covers top 3 attack paths automatically
- Scripts include rollback comments

---

### Feature 5 — Business Impact Translation
**Priority:** P1 (Should Have)

- Maps CVEs and attack paths to MITRE ATT&CK tactics (Initial Access, Lateral Movement, Exfiltration, etc.)
- Assigns estimated financial risk using:
  - IBM Cost of Data Breach Report averages by industry/region
  - Asset criticality weighting
  - Probability of exploitation (EPSS score)
- **Formula:**
```
Financial Risk ($) = Avg_Breach_Cost × P(exploitation) × Asset_Criticality_Weight
```
- Generates executive summary paragraph: plain English, no jargon
- Visual: Risk heatmap sorted by dollar exposure

**Acceptance Criteria:**
- Dollar value shown for all P0/P1 vulnerabilities
- Executive summary readable by non-technical judges in <2 minutes
- MITRE tactic mapped for each attack path step

---

### Feature 6 — Comprehensive Risk Report
**Priority:** P1 (Should Have)

- One-click PDF/HTML report generation
- Sections: Executive Summary, Network Topology Overview, Top Attack Paths, Vulnerability Inventory, Remediation Roadmap, Financial Risk Summary
- Includes screenshots of the attack graph
- Styled for presentation (hackathon judges / CISO audience)

---

## 5. Technical Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BHISHON SECURITY                         │
├────────────────┬────────────────────┬───────────────────────┤
│  EDGE AGENTS   │   CENTRAL SERVER   │      FRONTEND UI      │
│  (Python)      │   (Python/FastAPI) │  (React + React Flow) │
│                │                    │                        │
│ • Port scan    │ • Risk scoring     │ • Attack graph viz    │
│ • CVE match    │ • Graph engine     │ • Blast radius anim   │
│ • Pre-filter   │ • AI remediation   │ • Dashboard           │
│ • Metadata     │ • Report gen       │ • Fix-It panel        │
│   only →       │                    │                        │
└────────────────┴────────────────────┴───────────────────────┘
```

---

## 6. Out of Scope (Hackathon Build)

- Real-time packet capture / deep packet inspection (DPI)
- Agent deployment automation (manual install for demo)
- Authentication/RBAC system
- Multi-tenant SaaS architecture
- Integration with SIEM platforms (Splunk, Elastic SIEM)
- Mobile app

---

## 7. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Network scan too slow on demo hardware | Medium | Limit demo to /24 subnet, use pre-captured scan data as fallback |
| AI remediation scripts contain bugs | High | Validate against ansible-lint; add disclaimer in UI |
| React Flow performance on large graphs | Medium | Implement node clustering for 100+ nodes |
| Legal/ethical issues scanning live networks | Low | Demo only on controlled lab network / local VMs |

---

## 8. Success Metrics (Hackathon Demo)

| Metric | Target |
|---|---|
| Scan-to-graph render time | < 30 seconds end-to-end |
| Attack paths identified | ≥ 3 demonstrable paths |
| Remediation scripts generated | ≥ 3 (one per attack path) |
| Financial risk figures shown | ≥ 5 vulnerabilities with $ value |
| Report export | Working PDF download |
| Judge "wow" moment | Blast radius animation on node click |

---

*Document ends. For technical implementation details, see TRD. For AI system design, see AI Interaction Specification.*
