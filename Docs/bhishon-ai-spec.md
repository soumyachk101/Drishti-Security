# AI Interaction Specification
## Bhishon Security — AI-Powered Network Risk Intelligence Platform
**Version:** 1.0.0  
**Author:** Soumya Chakraborty  
**Date:** May 2026  
**Status:** Hackathon Build

---

## 1. Overview

Bhishon Security uses AI (Claude API) in three distinct ways:

| Module | AI Role | Trigger |
|---|---|---|
| **Agentic Auto-Remediation** | Generate Ansible/AWS/firewall scripts for each vulnerability | After attack path scoring |
| **Business Impact Translation** | Translate CVEs into plain-English executive summaries | On demand / report generation |
| **Attack Path Narrative** | Describe the attacker's step-by-step kill chain in plain English | When attack path is highlighted |

All AI calls use **Claude claude-opus-4-5** (Anthropic API) via the Python SDK.

---

## 2. Module 1 — Agentic Auto-Remediation

### 2.1 Purpose
Given a specific vulnerability on a specific node in a specific attack path context, generate a ready-to-run remediation script that an engineer can execute immediately.

### 2.2 System Prompt

```
You are Bhishon Remediation Engine — an expert security engineer and DevOps specialist embedded in an automated vulnerability remediation system.

Your task is to generate precise, production-safe remediation scripts for network vulnerabilities.

RULES:
1. Always output a valid, runnable script — no pseudocode or placeholder comments.
2. Choose the most appropriate script type based on the vulnerability context:
   - Linux system CVE → Ansible playbook (YAML)
   - Cloud misconfiguration (AWS/GCP/Azure) → CLI commands or Terraform snippet
   - Network/firewall issue → iptables or firewalld commands (bash)
   - Web server misconfiguration → Nginx/Apache config patch (bash + config)
   - Default credentials → Password rotation script (bash)
3. Always include a ROLLBACK section — commented commands to undo the fix if needed.
4. Add a brief "WHY THIS IS PRIORITIZED" comment at the top explaining the remediation's business impact.
5. Keep scripts under 50 lines unless complexity demands more.
6. NEVER suggest rebooting a production server without explicit note.
7. Output ONLY the script — no prose before or after, no markdown fences.
8. For each script, embed a comment header in this exact format:
   # BHISHON_FIX | CVE: {cve_id} | NODE: {node_ip} | TYPE: {script_type} | RISK: {risk_score}
```

### 2.3 User Prompt Template

```python
def build_remediation_prompt(
    vuln: Vulnerability, 
    node: NetworkNode, 
    path: AttackPath
) -> str:
    return f"""
Generate a remediation script for the following vulnerability:

## VULNERABILITY
CVE ID: {vuln.cve_id}
CVSS v3 Score: {vuln.cvss_v3}
EPSS (exploitation probability): {vuln.epss_score:.1%}
Description: {vuln.description}
Affected Service: {vuln.affected_service} on port {vuln.port}
MITRE Tactic: {vuln.mitre_tactic or "Unknown"}

## AFFECTED NODE
IP Address: {node.id}
Hostname: {node.hostname or "Unknown"}
Operating System: {node.os or "Linux (assumed)"}
Risk Zone: {node.risk_zone.value}
Asset Criticality: {node.asset_criticality:.1%}

## ATTACK PATH CONTEXT
This vulnerability is step {path.step_index + 1} of {len(path.steps)} in a {len(path.steps)}-hop attack path.
Path leads to: {path.target_description}
Estimated financial impact if exploited: ${path.financial_impact_usd:,.0f}

## ENVIRONMENT HINTS
{_build_environment_hints(node)}

Generate the remediation script now.
"""

def _build_environment_hints(node: NetworkNode) -> str:
    hints = []
    if node.risk_zone == RiskZone.INTERNET_FACING:
        hints.append("- This node is publicly internet-accessible — treat with high urgency")
    if any("aws" in tag.lower() for tag in node.tags or []):
        hints.append("- AWS cloud node — prefer AWS CLI / Security Group fixes")
    if node.os and "windows" in node.os.lower():
        hints.append("- Windows node — use PowerShell or Windows-compatible Ansible modules")
    return "\n".join(hints) or "- Standard Linux environment assumed"
```

### 2.4 Expected Output Examples

**Example 1 — SSH Vulnerability (Ansible Playbook):**
```yaml
# BHISHON_FIX | CVE: CVE-2023-38408 | NODE: 192.168.1.45 | TYPE: ansible | RISK: 8.7
# WHY PRIORITIZED: This SSH agent forwarding exploit is Step 2 in your highest-risk 
# attack path, giving attackers lateral movement across your entire internal network.
# Estimated breach cost avoidance: $1,450,000

---
- name: Patch CVE-2023-38408 - OpenSSH Agent Forwarding RCE
  hosts: 192.168.1.45
  become: yes
  tasks:
    - name: Update OpenSSH to patched version
      package:
        name: openssh-server
        state: latest

    - name: Disable SSH agent forwarding
      lineinfile:
        path: /etc/ssh/sshd_config
        regexp: '^AllowAgentForwarding'
        line: 'AllowAgentForwarding no'
        backup: yes

    - name: Restart SSH service
      service:
        name: sshd
        state: restarted

# ROLLBACK:
# ansible-playbook rollback.yml  (restores /etc/ssh/sshd_config.bak)
# Or manually: sed -i 's/AllowAgentForwarding no/AllowAgentForwarding yes/' /etc/ssh/sshd_config
```

**Example 2 — Exposed Port (iptables):**
```bash
# BHISHON_FIX | CVE: OPEN-PORT-3306 | NODE: 192.168.1.12 | TYPE: firewall | RISK: 7.2
# WHY PRIORITIZED: MySQL port exposed directly to DMZ. Attackers can brute-force 
# or exploit unpatched MySQL from a compromised DMZ node.

#!/bin/bash

# Block external access to MySQL port
iptables -A INPUT -p tcp --dport 3306 -s 10.0.0.0/8 -j ACCEPT  # Allow internal only
iptables -A INPUT -p tcp --dport 3306 -j DROP                    # Block everything else

# Make persistent (Debian/Ubuntu)
apt-get install -y iptables-persistent
netfilter-persistent save

# ROLLBACK:
# iptables -D INPUT -p tcp --dport 3306 -s 10.0.0.0/8 -j ACCEPT
# iptables -D INPUT -p tcp --dport 3306 -j DROP
```

### 2.5 Response Parsing

```python
def parse_remediation_response(response) -> RemediationScript:
    raw_script = response.content[0].text.strip()
    
    # Extract header metadata
    header_line = next(
        (l for l in raw_script.split('\n') if 'BHISHON_FIX' in l), 
        None
    )
    
    script_type = "bash"  # default
    if header_line:
        match = re.search(r'TYPE: (\w+)', header_line)
        if match:
            script_type = match.group(1)
    
    return RemediationScript(
        content=raw_script,
        script_type=script_type,
        language="yaml" if script_type == "ansible" else "bash",
        generated_at=datetime.utcnow()
    )
```

---

## 3. Module 2 — Business Impact Translation

### 3.1 Purpose
Convert a list of attack paths and CVEs into a plain-English executive summary that non-technical judges or executives can immediately understand and act on.

### 3.2 System Prompt

```
You are Bhishon Business Intelligence Engine — a cybersecurity analyst who specializes in translating complex technical vulnerabilities into clear business risk language for C-suite executives and board members.

RULES:
1. Write in plain English. No CVE IDs, no jargon like "lateral movement" or "CVSS". Translate everything to business terms.
2. Structure: 3 paragraphs max — (1) The situation, (2) The biggest risks in dollar terms, (3) Recommended immediate actions.
3. Use concrete numbers: dollar amounts, percentages, timeframes.
4. Tone: Calm but urgent. Not alarmist, not dismissive.
5. Length: 150-200 words maximum.
6. End with a one-sentence "Bottom Line" summary in bold.
7. Output ONLY the summary text — no headers, no bullet points, no markdown.
```

### 3.3 User Prompt Template

```python
def build_executive_summary_prompt(
    scan_results: ScanSession
) -> str:
    top_paths = scan_results.attack_paths[:3]
    total_financial_risk = sum(p.financial_impact_usd for p in top_paths)
    highest_epss = max(
        v.epss_score 
        for node in scan_results.nodes 
        for v in node.vulnerabilities
    )
    
    paths_summary = "\n".join([
        f"- Path {i+1}: {p.step_count} steps from internet to {p.target_description}, "
        f"estimated impact ${p.financial_impact_usd:,.0f}"
        for i, p in enumerate(top_paths)
    ])
    
    return f"""
Generate an executive summary for this network security assessment:

## SCAN OVERVIEW
Total nodes scanned: {len(scan_results.nodes)}
Internet-facing nodes: {scan_results.internet_facing_count}
Total vulnerabilities found: {scan_results.total_vuln_count}
Critical vulnerabilities: {scan_results.critical_vuln_count}

## TOP ATTACK PATHS
{paths_summary}

## RISK SNAPSHOT
Combined estimated financial exposure: ${total_financial_risk:,.0f}
Highest exploitation probability (30-day): {highest_epss:.0%}
Most critical asset at risk: {scan_results.most_critical_target}

## CONTEXT
Industry: Technology/Software
Organization size: Mid-market
"""
```

### 3.4 Example Output

```
Your network assessment reveals three clear pathways an attacker could use to 
reach your core systems from the public internet, each requiring fewer than four 
steps and exploiting software that has not been updated in the past 18 months.

The highest-priority concern is your customer database, which could be reached 
through an unpatched web server. A breach of this system alone carries an estimated 
financial exposure of $1.85 million, based on current industry averages for companies 
of your size. Additionally, there is a 34% statistical probability that one of these 
vulnerabilities will be actively exploited within the next 30 days.

The three most critical fixes — patching two servers and closing one unnecessary 
network port — can be completed by your IT team in under four hours and would 
eliminate 78% of the identified financial risk immediately.

**Bottom line: Three targeted fixes this week would protect $2.1 million in potential 
breach exposure with approximately four hours of engineering effort.**
```

---

## 4. Module 3 — Attack Path Narrative (Kill Chain Storytelling)

### 4.1 Purpose
When a user clicks on an attack path in the UI, generate a compelling attacker's-eye-view narrative of each step — like a threat intelligence report or a red team writeup. Helps judges and security engineers immediately understand *why* a path is dangerous.

### 4.2 System Prompt

```
You are Bhishon Threat Narrative Engine — an expert red team operator who explains attack chains from an attacker's perspective to help defenders understand exactly how they would be breached.

RULES:
1. Write from the perspective of a skilled, patient attacker.
2. For each step in the path, explain: what the attacker sees, what they exploit, and what they gain.
3. Use the present tense ("The attacker scans... gains access... pivots to...").
4. Include realistic attacker tools where appropriate (nmap, Metasploit, ssh, curl, etc.).
5. End with "The Endgame" section describing the final impact.
6. Tone: Matter-of-fact technical thriller. Precise and chilling, not dramatic.
7. Length: 60-80 words per step, 40 words for Endgame. Total max 400 words.
8. Output in this JSON structure only:
   {
     "path_title": "string",
     "steps": [{"step": 1, "title": "string", "narrative": "string"}],
     "endgame": "string"
   }
```

### 4.3 User Prompt Template

```python
def build_kill_chain_prompt(path: AttackPath) -> str:
    steps_detail = "\n".join([
        f"Step {i+1}: {step.from_node} → {step.to_node}\n"
        f"  Exploit: {step.exploit_vector}\n"
        f"  CVSS: {step.cvss_score}\n"
        f"  What attacker gains: {step.access_gained}"
        for i, step in enumerate(path.steps)
    ])
    
    return f"""
Generate the attack path narrative for this kill chain:

## TARGET
Final target: {path.target_description}
Total steps: {len(path.steps)}
Financial impact: ${path.financial_impact_usd:,.0f}

## ATTACK STEPS
{steps_detail}

## CONTEXT
Entry point: Publicly accessible from internet
Attacker skill level: Intermediate (uses known CVEs + public exploits)
"""
```

### 4.4 Example Output

```json
{
  "path_title": "The Web-to-Database Express",
  "steps": [
    {
      "step": 1,
      "title": "Foothold via Exposed Admin Panel",
      "narrative": "The attacker runs a quick nmap scan and finds port 8080 open on 203.0.113.45 — an unpatched Apache Tomcat 9.0.36. They load CVE-2020-9484 in Metasploit. Within 90 seconds, they have a remote shell with the 'tomcat' service account. The server is their beach head — sitting directly in the DMZ with line-of-sight to your internal network."
    },
    {
      "step": 2,
      "title": "Pivot via Unpatched SSH",
      "narrative": "From the Tomcat shell, the attacker scans the internal /24 and spots 10.0.1.15 with SSH running OpenSSH 7.4 — vulnerable to CVE-2023-38408. They exploit the agent forwarding flaw and move laterally into the internal network segment, now authenticated as a trusted internal host. Firewall rules allow this because the DMZ server was trusted."
    },
    {
      "step": 3,
      "title": "Database Access — Game Over",
      "narrative": "MySQL is running on 10.0.1.40 with no password on the 'backup' account — the attacker found the credential in a .env file left in the Tomcat webroot. They connect directly, SELECT * FROM users, and begin exfiltrating 240,000 customer records via a slow, encrypted HTTPS tunnel to an external VPS. No alerts fire."
    }
  ],
  "endgame": "The attacker exits with 240,000 customer records, database credentials, and a persistent backdoor — all in under 45 minutes. Your team won't know until a threat intel feed flags the data on a dark web marketplace three weeks later."
}
```

---

## 5. AI API Configuration

### 5.1 Client Setup

```python
import anthropic

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

# Async client for FastAPI
async_client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
```

### 5.2 Model Selection

| Module | Model | Reasoning |
|---|---|---|
| Remediation Engine | `claude-opus-4-5` | Needs precise, syntactically valid code generation |
| Business Impact | `claude-opus-4-5` | Nuanced writing quality matters for exec audience |
| Kill Chain Narrative | `claude-opus-4-5` | Structured JSON + compelling prose |

### 5.3 Common Parameters

```python
COMMON_PARAMS = {
    "model": "claude-opus-4-5",
    "max_tokens": 2000,         # Enough for a full Ansible playbook
    "temperature": 0.2,          # Low temp = consistent, precise output
}
```

### 5.4 Error Handling & Fallbacks

```python
async def safe_ai_call(prompt_fn, *args) -> Optional[str]:
    try:
        response = await async_client.messages.create(
            **COMMON_PARAMS,
            messages=[{"role": "user", "content": prompt_fn(*args)}]
        )
        return response.content[0].text
    
    except anthropic.RateLimitError:
        logger.warning("Claude rate limit hit, using fallback template")
        return get_fallback_template(args)
    
    except anthropic.APIError as e:
        logger.error(f"Claude API error: {e}")
        return None
```

### 5.5 Prompt Caching Strategy (Performance)

For hackathon demo: cache system prompts as `cache_control: {"type": "ephemeral"}` to reduce token usage and latency on repeated calls:

```python
messages=[
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": REMEDIATION_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"}  # Cache for 5 min
            },
            {
                "type": "text", 
                "text": user_prompt
            }
        ]
    }
]
```

---

## 6. AI Output Quality Checks

Before displaying AI output in the UI, run these validation checks:

```python
def validate_remediation_script(script: str, script_type: str) -> ValidationResult:
    checks = []
    
    # Check 1: Contains BHISHON_FIX header
    checks.append(('header_present', 'BHISHON_FIX' in script))
    
    # Check 2: YAML validity for Ansible
    if script_type == 'ansible':
        try:
            yaml.safe_load(script)
            checks.append(('yaml_valid', True))
        except yaml.YAMLError:
            checks.append(('yaml_valid', False))
    
    # Check 3: Contains rollback section
    checks.append(('rollback_present', 'ROLLBACK' in script.upper()))
    
    # Check 4: No dangerous commands without warnings
    dangerous = ['rm -rf /', 'DROP TABLE', 'format c:']
    has_dangerous = any(d in script for d in dangerous)
    checks.append(('no_dangerous_commands', not has_dangerous))
    
    passed = all(v for _, v in checks)
    return ValidationResult(passed=passed, checks=dict(checks))
```

---

## 7. UI/UX AI Integration Points

### 7.1 Fix-It Panel Flow

```
User clicks node on graph
         │
         ▼
NodeDetailDrawer opens
  - Shows all CVEs for this node
  - "Generate Fix" button per CVE
         │
         ▼ (button click)
Loading state: "Bhishon AI is generating your remediation script..."
         │
         ▼ POST /api/v1/remediate
         │
         ▼ (response)
ScriptViewer component
  - Syntax-highlighted code
  - Copy to clipboard button
  - Download as .sh / .yml button
  - "Why this fix?" accordion (AI explanation)
  - ⚠️ "Review before running in production" disclaimer
```

### 7.2 Executive Summary Placement

Located in: `Dashboard → "Executive View" tab`

- Generated once per scan session
- Regenerate button if scan data updates
- "Copy as Email" button → pastes into clipboard formatted for email
- Estimated reading time shown: "~45 seconds"

### 7.3 Kill Chain Narrative Placement

Located in: `Attack Path List → click any path → "Story Mode" toggle`

- Default: Technical step-by-step table
- Story Mode: AI-generated narrative with step-by-step storytelling
- Judges/executive demo mode toggle

---

*Document ends. Cross-reference: PRD for feature requirements, TRD for technical implementation.*
