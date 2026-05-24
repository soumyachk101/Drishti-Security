# Drishti — AI-Powered Network Risk Intelligence

**Drishti** turns raw network vulnerability data into prioritized, dollar-scored, actionable risk intelligence. It maps attack paths, visualizes blast radius, and ships AI-generated remediation — all behind a 3D Spline landing page and a real-time React dashboard.

> *"Drishti" means "vision" or "sight" in Sanskrit — the platform gives security teams clear visibility into their network risk landscape.*

---

## What It Does

1. **Scans** your network (or loads demo data) to discover nodes, open ports, and vulnerabilities.
2. **Builds an interactive attack graph** showing how an attacker can pivot through your environment.
3. **Ranks attack paths** by financial blast radius, EPSS, CVSS, and zone multipliers.
4. **Generates AI remediation** (Ansible / bash / Terraform / iptables) per vulnerability with rollback steps.
5. **Writes executive summaries and kill-chain narratives** in plain business English via Claude.
6. **Exports HTML reports** with the full vulnerability inventory and a remediation roadmap.

---

## Landing Experience

The public-facing landing page is a single-page, scroll-anchored site with a Spline 3D hero and a fixed dark navbar. Each navbar link jumps to a real, fully-built section:

| Nav link | Anchor | Content |
|---|---|---|
| `Platform` | `#platform` | 6 capability cards (Discovery, Attack-Path Graph, Financial Blast Radius, AI Remediation, Zero-Trust Posture, Board-Ready Reports). |
| `How it Works` | `#how-it-works` | 4-step explainer: CIDR → asset map → attack-paths → AI fix. |
| `Attack Paths` | `#attack-paths` | Sample paths with severity chips, hop chains, and dollar blast radius. |
| `Pricing` | `#pricing` | Starter / Team / Enterprise tiers. |
| `Docs` | `#docs` | Quickstart, API reference, scoring model, integrations, self-hosting, trust. |
| `Request Access` (CTA) | `#request-access` | Live target input wired to `POST /api/v1/scan/start` and **Load Demo** button. |

Submitting from either the hero or the request-access section creates a session and routes the user into the full Drishti dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+ · FastAPI · Uvicorn |
| Graph engine | NetworkX (directed graph + shortest-path attack discovery) |
| AI | Anthropic Claude (`claude-opus-4-5`) for remediation, exec summaries, kill chains |
| Data models | Pydantic v2 |
| Frontend | React 18 · TypeScript · Vite |
| Styling | Tailwind CSS · `tailwindcss-animate` · `class-variance-authority` · `tailwind-merge` |
| UI primitives | shadcn-style `Button` with custom variants (`navCta`, `hero`, `heroOutline`) |
| 3D hero | `@splinetool/react-spline` + `@splinetool/runtime` (lazy-loaded) |
| Visualization | `@xyflow/react` (attack graph) · Recharts (dashboard charts) · Framer Motion |
| State | Zustand |
| HTTP | Axios |
| Typography | Google Fonts **Sora** (300 / 400 / 500 / 600 / 700) |

---

## Getting Started

### Prerequisites

- **Python 3.11+** with pip
- **Node.js 18+** with npm
- *(Optional)* an **Anthropic API key** — the app falls back to safe defaults without one

### 1. Clone

```bash
git clone https://github.com/soumyachk101/Drishti-Security.git
cd Drishti-Security
```

### 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Frontend

```bash
cd ../frontend
npm install
```

### 4. Run (two terminals)

**Terminal 1 — Backend** (port `8000`):
```bash
cd backend
python main.py
```

**Terminal 2 — Frontend** (port `5173`):
```bash
cd frontend
npm run dev
```

Vite proxies `/api` and `/ws` to `http://localhost:8000`, so the frontend can call the API without CORS gymnastics.

### 5. Open

Visit **http://localhost:5173**, scroll the landing page, then click **Load Demo** (in the hero or in the *Request Access* section) to enter the dashboard.

### Optional: enable AI features

```bash
export ANTHROPIC_API_KEY=sk-ant-...
python backend/main.py
```

This activates Claude-powered remediation scripts, executive summaries, and kill-chain narratives.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    LANDING (single page)                       │
│                                                                │
│  Navbar (fixed, transparent)                                   │
│  ├─ Platform / How it Works / Attack Paths / Pricing / Docs    │
│  └─ Request Access ───────────────┐                            │
│                                    │                            │
│  HeroSection                       │                            │
│  ├─ Spline 3D scene (lazy)         │                            │
│  ├─ Target input + Start Scan ─────┼──> POST /api/v1/scan/start │
│  └─ Load Demo ─────────────────────┼──> GET  /api/v1/demo       │
│                                    │                            │
│  LandingSections (scroll anchors)  │                            │
│  ├─ Platform / HowItWorks / ...    │                            │
│  └─ Request Access (duplicate CTA) ┘                            │
└────────────────────────────────────────────────────────────────┘
                       │  sessionId set
                       ▼
┌────────────────────────────────────────────────────────────────┐
│                         DASHBOARD                              │
│                                                                │
│  ┌──────────────────────────┬───────────────────────────────┐  │
│  │   AttackGraph            │   Dashboard                   │  │
│  │   (xyflow nodes/edges,   │   ├─ Risk summary stats       │  │
│  │    blast-radius pulse)   │   ├─ AttackPathList           │  │
│  │                          │   │   └─ Story Mode +         │  │
│  │                          │   │       Kill-Chain narrative│  │
│  │                          │   └─ Executive Summary (AI)   │  │
│  └──────────────────────────┴───────────────────────────────┘  │
│                                                                │
│  FixItPanel (slide-in: vuln details + AI remediation)          │
└────────────────────────────────────────────────────────────────┘
```

The backend builds a directed graph (NetworkX) from the topology, then walks shortest paths from internet-facing entry points to crown-jewel assets. Each path is scored using a weighted formula combining CVSS, EPSS, asset criticality, and zone multipliers.

---

## Project Structure

```
Drishti/
├── backend/
│   ├── main.py              # FastAPI app, all REST endpoints + WebSocket
│   ├── models.py            # Pydantic data models
│   ├── graph_engine.py      # NetworkX construction + attack-path discovery
│   ├── risk_scoring.py      # Financial risk formula + vuln enrichment
│   ├── ai_engine.py         # Claude integration (remediation / summary / kill chain)
│   ├── demo_data.py         # 5-node demo topology with realistic CVEs
│   ├── report_gen.py        # Styled HTML risk-report generator
│   └── requirements.txt
│
├── frontend/
│   ├── index.html           # Sora font preload, dark body classes
│   ├── tailwind.config.js   # Sora font, HSL color tokens, fade-up/fade-in keyframes
│   ├── vite.config.ts       # Dev proxy: /api + /ws → :8000
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                    # Routes: landing ↔ dashboard via sessionId
│   │   ├── index.css                  # Tailwind layers, HSL theme vars, smooth scroll
│   │   ├── declarations.d.ts
│   │   ├── lib/
│   │   │   └── utils.ts               # cn() helper (clsx + tailwind-merge)
│   │   ├── store/
│   │   │   └── scanStore.ts           # Zustand: scan, graph, paths, AI calls
│   │   ├── types/
│   │   │   └── drishti.types.ts       # Mirrors backend Pydantic models
│   │   └── components/
│   │       ├── LandingPage.tsx        # Composes Navbar + Hero + Sections
│   │       ├── Navbar.tsx             # Fixed transparent nav, anchor links
│   │       ├── HeroSection.tsx        # Spline 3D bg + target input + CTAs
│   │       ├── LandingSections.tsx    # Platform / HowItWorks / AttackPaths /
│   │       │                          #   Pricing / Docs / RequestAccess / Footer
│   │       ├── AttackGraph.tsx        # xyflow interactive network graph
│   │       ├── Dashboard.tsx          # Stats, charts, exec summary
│   │       ├── AttackPathList.tsx     # Ranked paths + Story Mode
│   │       ├── FixItPanel.tsx         # Slide-in: vulns + AI remediation
│   │       └── ui/
│   │           └── button.tsx         # cva button (default / navCta / hero / ...)
│   └── package.json
│
└── Docs/
    ├── bhishon-prd.md        # Product Requirements Document
    ├── bhishon-trd.md        # Technical Requirements Document
    └── bhishon-ai-spec.md    # AI Interaction Specification
```

---

## Design System

All UI tokens are HSL CSS custom properties defined in `frontend/src/index.css` and consumed via `hsl(var(--token))` in `tailwind.config.js`.

| Token | Value | Usage |
|---|---|---|
| `--background` | `0 0% 10%` | Default page background |
| `--foreground` | `0 0% 96%` | Primary text |
| `--primary` | `119 99% 46%` | Accent green (CTAs, highlights) |
| `--primary-foreground` | `0 0% 4%` | Text on primary |
| `--secondary` | `0 0% 18%` | Card surfaces |
| `--muted` / `--muted-foreground` | `0 0% 16%` / `0 0% 60%` | Subdued surfaces / text |
| `--border` / `--input` / `--ring` | `0 0% 20%` / `0 0% 20%` / `119 99% 46%` | Outlines |
| `--nav-button` | `0 0% 18%` | Nav CTA background |
| `--hero-bg` | `0 0% 8%` | Spline-section background |
| `--destructive` | `0 84% 60%` | Critical severity |
| `--radius` | `0.5rem` | Base border radius |

Custom keyframes (Tailwind `animate-fade-up`, `animate-fade-in`) drive the staggered hero copy reveal.

---

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/demo` | Load pre-built demo session |
| `POST` | `/api/v1/scan/start` | Start a network scan (returns demo session in hackathon mode) |
| `GET` | `/api/v1/scan/{session_id}` | Session + risk summary |
| `GET` | `/api/v1/graph/{session_id}` | Nodes + edges shaped for xyflow |
| `GET` | `/api/v1/paths/{session_id}` | Ranked attack paths |
| `GET` | `/api/v1/graph/{session_id}/blast-radius/{node_id}` | Reachable nodes from a compromised asset |
| `POST` | `/api/v1/remediate` | Claude-generated fix script for a vuln |
| `GET` | `/api/v1/executive-summary/{session_id}` | Plain-English exec summary |
| `GET` | `/api/v1/kill-chain/{session_id}/{path_id}` | Attacker-perspective narrative for a path |
| `GET` | `/api/v1/report/{session_id}` | Full HTML risk report |
| `GET` | `/api/v1/nodes/{session_id}` | Node inventory with vulnerability details |
| `WS`  | `/ws/scan/{session_id}` | Live scan progress stream |

---

## Demo Network Topology

The demo simulates a realistic corporate network with **5 nodes** and **3 attack paths**:

| Node | Zone | Key Vulnerability |
|---|---|---|
| `web-prod-01` (203.0.113.45) | Internet-Facing | Apache Tomcat RCE (CVSS 7.5) |
| `jump-box-01` (10.0.1.15) | DMZ | OpenSSH RCE (CVSS 9.8) |
| `app-server-01` (10.0.1.60) | Internal | Redis Sandbox Escape (CVSS 10.0) |
| `db-primary-01` (10.0.1.40) | Critical | Default MySQL Credentials (CVSS 9.1) |
| `admin-workstation` (192.168.1.100) | Internal | Windows TCP/IP RCE (CVSS 9.8) |

The most critical attack path chains 3 hops from the internet-facing web server, through the jump box, to the crown-jewel database — estimated financial impact **~$2.18M**.

---

## Risk Scoring Formula

```
Financial Risk  =  $2,180,000              # IBM India avg breach cost baseline
                ×  EPSS                    # 0–1 exploitation probability
                ×  Asset Criticality       # 0–1
                ×  Zone Multiplier
```

**Zone multipliers:** Internet-Facing `2.5×` · DMZ `1.8×` · Internal `1.0×` · Critical `3.0×`

---

## Development Notes

- **Sora** font is loaded in `frontend/index.html` via Google Fonts and applied as the body font.
- The Spline scene (`https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode`) is lazy-loaded with `React.lazy` + `Suspense` to keep the initial bundle small.
- The hero content uses `pointer-events-none` so the Spline scene stays fully interactive; CTAs re-enable input with `pointer-events-auto`.
- Smooth scrolling is enabled globally (`html { scroll-behavior: smooth }`); each section uses `scroll-mt-20` so anchor jumps clear the fixed navbar.
- Without `ANTHROPIC_API_KEY`, AI endpoints return deterministic fallbacks so the demo still works end-to-end.

---

## License

MIT — built for the hackathon.
