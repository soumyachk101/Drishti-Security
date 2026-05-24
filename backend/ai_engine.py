"""Groq API integration — remediation, executive summary, kill chain."""

import os
import re
import json
import logging
from datetime import datetime

from openai import AsyncOpenAI

from models import (
    Vulnerability, NetworkNode, AttackPath, ScanSession, RemediationScript,
)

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
MODEL = "llama-3.3-70b-versatile"

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
    return _client


REMEDIATION_SYSTEM_PROMPT = """You are Drishti Remediation Engine — an expert security engineer and DevOps specialist embedded in an automated vulnerability remediation system.

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
   # DRISHTI_FIX | CVE: {cve_id} | NODE: {node_ip} | TYPE: {script_type} | RISK: {risk_score}"""

EXECUTIVE_SYSTEM_PROMPT = """You are Drishti Business Intelligence Engine — a cybersecurity analyst who specializes in translating complex technical vulnerabilities into clear business risk language for C-suite executives and board members.

RULES:
1. Write in plain English. No CVE IDs, no jargon like "lateral movement" or "CVSS". Translate everything to business terms.
2. Structure: 3 paragraphs max — (1) The situation, (2) The biggest risks in dollar terms, (3) Recommended immediate actions.
3. Use concrete numbers: dollar amounts, percentages, timeframes.
4. Tone: Calm but urgent. Not alarmist, not dismissive.
5. Length: 150-200 words maximum.
6. End with a one-sentence "Bottom Line" summary in bold.
7. Output ONLY the summary text — no headers, no bullet points, no markdown."""

KILL_CHAIN_SYSTEM_PROMPT = """You are Drishti Threat Narrative Engine — an expert red team operator who explains attack chains from an attacker's perspective to help defenders understand exactly how they would be breached.

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
   }"""


def _build_remediation_prompt(
    vuln: Vulnerability,
    node: NetworkNode,
    path: AttackPath | None,
) -> str:
    path_context = ""
    if path:
        path_context = f"""
## ATTACK PATH CONTEXT
This vulnerability is step {len(path.steps)} of {len(path.steps)} in a {len(path.steps)}-hop attack path.
Path leads to: {path.blast_radius[-1] if path.blast_radius else 'critical asset'}
Estimated financial impact if exploited: ${path.financial_impact_usd:,.0f}
"""

    env_hints = "- Standard Linux environment assumed"
    if node.risk_zone.value == "INTERNET_FACING":
        env_hints = "- This node is publicly internet-accessible — treat with high urgency"

    return f"""Generate a remediation script for the following vulnerability:

## VULNERABILITY
CVE ID: {vuln.cve_id}
CVSS v3 Score: {vuln.cvss_v3}
EPSS (exploitation probability): {vuln.epss_score:.1%}
Description: {vuln.description}
Affected Service: {vuln.affected_service}

## AFFECTED NODE
IP Address: {node.id}
Hostname: {node.hostname or "Unknown"}
Operating System: {node.os or "Linux (assumed)"}
Risk Zone: {node.risk_zone.value}
Asset Criticality: {node.asset_criticality:.1%}

{path_context}

## ENVIRONMENT HINTS
{env_hints}

Generate the remediation script now."""


async def generate_remediation(
    vuln: Vulnerability,
    node: NetworkNode,
    path: AttackPath | None = None,
) -> RemediationScript:
    """Generate remediation script via Groq API."""
    prompt = _build_remediation_prompt(vuln, node, path)

    if not GROQ_API_KEY:
        return _fallback_remediation(vuln, node)

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model=MODEL,
            max_tokens=2000,
            temperature=0.2,
            messages=[
                {"role": "system", "content": REMEDIATION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        raw = response.choices[0].message.content.strip()

        script_type = "bash"
        header = next((l for l in raw.split("\n") if "DRISHTI_FIX" in l), None)
        if header:
            match = re.search(r"TYPE: (\w+)", header)
            if match:
                script_type = match.group(1)

        return RemediationScript(
            content=raw,
            script_type=script_type,
            language="yaml" if script_type == "ansible" else "bash",
            generated_at=datetime.utcnow().isoformat(),
            cve_id=vuln.cve_id,
        )
    except Exception as e:
        logger.error(f"Groq API error (remediation): {e}")
        return _fallback_remediation(vuln, node)


def _fallback_remediation(vuln: Vulnerability, node: NetworkNode) -> RemediationScript:
    """Fallback remediation when API unavailable."""
    content = f"""# DRISHTI_FIX | CVE: {vuln.cve_id} | NODE: {node.id} | TYPE: bash | RISK: {vuln.cvss_v3}
# WHY PRIORITIZED: CVSS {vuln.cvss_v3}, EPSS {vuln.epss_score:.0%} exploitation probability.
# Financial risk: ${vuln.financial_risk_usd or 0:,.0f}

#!/bin/bash
# Remediation for {vuln.cve_id} on {node.hostname or node.id}
# Service: {vuln.affected_service}

# Step 1: Update affected package
apt-get update && apt-get upgrade -y {vuln.affected_service}

# Step 2: Verify fix
{vuln.affected_service} --version

# ROLLBACK:
# apt-get install {vuln.affected_service}=<previous-version>
"""
    return RemediationScript(
        content=content,
        script_type="bash",
        language="bash",
        generated_at=datetime.utcnow().isoformat(),
        cve_id=vuln.cve_id,
    )


async def generate_executive_summary(session: ScanSession) -> str:
    """Generate plain-English executive summary."""
    if not GROQ_API_KEY:
        return _fallback_executive(session)

    top_paths = session.attack_paths[:3]
    total_risk = sum(p.financial_impact_usd for p in top_paths)
    highest_epss = max(
        (v.epss_score for n in session.nodes for v in n.vulnerabilities),
        default=0,
    )

    paths_text = "\n".join(
        f"- Path {i+1}: {len(p.steps)} steps, estimated impact ${p.financial_impact_usd:,.0f}"
        for i, p in enumerate(top_paths)
    )

    prompt = f"""Generate an executive summary for this network security assessment:

## SCAN OVERVIEW
Total nodes scanned: {len(session.nodes)}
Internet-facing nodes: {session.internet_facing_count}
Total vulnerabilities found: {session.total_vuln_count}
Critical vulnerabilities: {session.critical_vuln_count}

## TOP ATTACK PATHS
{paths_text}

## RISK SNAPSHOT
Combined estimated financial exposure: ${total_risk:,.0f}
Highest exploitation probability (30-day): {highest_epss:.0%}
Most critical asset at risk: {session.most_critical_target}

## CONTEXT
Industry: Technology/Software
Organization size: Mid-market"""

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model=MODEL,
            max_tokens=2000,
            temperature=0.2,
            messages=[
                {"role": "system", "content": EXECUTIVE_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Executive summary error: {e}")
        return _fallback_executive(session)


def _fallback_executive(session: ScanSession) -> str:
    """Fallback executive summary."""
    top_paths = session.attack_paths[:3]
    total_risk = sum(p.financial_impact_usd for p in top_paths)
    return (
        f"Your network assessment identified {session.total_vuln_count} vulnerabilities "
        f"across {len(session.nodes)} nodes, with {session.critical_vuln_count} rated critical. "
        f"The top {len(top_paths)} attack paths represent a combined financial exposure of "
        f"${total_risk:,.0f}. The most critical asset at risk is {session.most_critical_target}. "
        f"Immediate action on the highest-priority vulnerabilities would eliminate the majority "
        f"of identified risk."
    )


async def generate_kill_chain(path: AttackPath) -> dict:
    """Generate attacker's-eye-view kill chain narrative."""
    if not GROQ_API_KEY:
        return _fallback_kill_chain(path)

    steps_text = "\n".join(
        f"Step {i+1}: {s.from_node} → {s.to_node}\n  Exploit: {s.exploit_vector}\n  CVSS: {s.cvss_score}"
        for i, s in enumerate(path.steps)
    )

    prompt = f"""Generate the attack path narrative for this kill chain:

## TARGET
Final target: {path.blast_radius[-1] if path.blast_radius else 'critical asset'}
Total steps: {len(path.steps)}
Financial impact: ${path.financial_impact_usd:,.0f}

## ATTACK STEPS
{steps_text}

## CONTEXT
Entry point: Publicly accessible from internet
Attacker skill level: Intermediate (uses known CVEs + public exploits)"""

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model=MODEL,
            max_tokens=2000,
            temperature=0.2,
            messages=[
                {"role": "system", "content": KILL_CHAIN_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Kill chain error: {e}")
        return _fallback_kill_chain(path)


def _fallback_kill_chain(path: AttackPath) -> dict:
    """Fallback kill chain narrative."""
    steps = []
    for i, s in enumerate(path.steps):
        steps.append({
            "step": i + 1,
            "title": f"Exploit via {s.from_node}",
            "narrative": (
                f"The attacker exploits {s.exploit_vector} to move from {s.from_node} "
                f"to {s.to_node} (CVSS: {s.cvss_score})."
            ),
        })
    return {
        "path_title": f"Attack Path {path.id}",
        "steps": steps,
        "endgame": (
            f"The attacker reaches the final target with ${path.financial_impact_usd:,.0f} "
            f"in potential financial impact."
        ),
    }
