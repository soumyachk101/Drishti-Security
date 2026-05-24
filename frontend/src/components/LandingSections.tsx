import { useState } from "react"

/**
 * Scrollable content sections rendered below the Spline hero on the landing page.
 * Each section's id matches an entry in Navbar's `navLinks` so the anchor links work.
 */
export default function LandingSections({
  onStartScan,
  onLoadDemo,
  loading,
}: {
  onStartScan: (target: string) => void
  onLoadDemo: () => void
  loading: boolean
}) {
  return (
    <>
      <PlatformSection />
      <HowItWorksSection />
      <AttackPathsSection />
      <PricingSection />
      <DocsSection />
      <RequestAccessSection
        onStartScan={onStartScan}
        onLoadDemo={onLoadDemo}
        loading={loading}
      />
      <Footer />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Reusable bits                                                       */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: React.ReactNode
  description?: string
}) {
  return (
    <div className="max-w-3xl mb-12 md:mb-16">
      <p className="text-primary text-xs uppercase tracking-[0.25em] font-medium mb-4">
        {eyebrow}
      </p>
      <h2 className="text-foreground text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground text-base md:text-lg font-light leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: string
  title: string
  body: string
}) {
  return (
    <div className="group relative bg-secondary/40 border border-border rounded-lg p-6 md:p-8 hover:border-primary/40 transition-colors">
      <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono text-sm mb-5">
        {icon}
      </div>
      <h3 className="text-foreground text-lg font-semibold mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm font-light leading-relaxed">
        {body}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Platform                                                            */
/* ------------------------------------------------------------------ */

function PlatformSection() {
  const features = [
    {
      icon: "01",
      title: "Network Discovery",
      body: "Agentless scanning across CIDR ranges, cloud VPCs, and on-prem segments. Maps every reachable asset, port, and service.",
    },
    {
      icon: "02",
      title: "Attack-Path Graph",
      body: "Builds a live graph of how an attacker pivots from internet-facing edges to your crown jewels — visualised in real time.",
    },
    {
      icon: "03",
      title: "Financial Blast Radius",
      body: "Each path is scored in dollars, not CVSS. Know which CVE actually puts the business at risk.",
    },
    {
      icon: "04",
      title: "AI Remediation",
      body: "Generates copy-pasteable fixes — firewall rules, IAM patches, terraform diffs — tailored to your stack.",
    },
    {
      icon: "05",
      title: "Zero-Trust Posture",
      body: "Continuous reachability checks against zero-trust policy. Flags drift the moment it appears.",
    },
    {
      icon: "06",
      title: "Board-Ready Reports",
      body: "One click to a CFO-friendly PDF: risk in dollars, MTTR trends, and progress against last quarter.",
    },
  ]

  return (
    <section id="platform" className="relative py-24 md:py-32 px-6 md:px-10 lg:px-16 bg-hero-bg scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="Platform"
          title={
            <>
              The full stack for{" "}
              <span className="text-primary">network risk intelligence</span>.
            </>
          }
          description="Drishti unifies discovery, attack-path analysis, financial scoring, and AI-driven remediation into a single workflow. No agents. No spreadsheets."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* How it Works                                                        */
/* ------------------------------------------------------------------ */

function HowItWorksSection() {
  const steps = [
    {
      step: "Step 01",
      title: "Point Drishti at a range",
      body: "Drop in a CIDR, a cloud account, or upload a list. Scans start instantly — no agents to install, no firewall rules to open.",
    },
    {
      step: "Step 02",
      title: "We map every reachable asset",
      body: "Drishti enumerates hosts, ports, services and software versions, then enriches them with live CVE intelligence and exploit data.",
    },
    {
      step: "Step 03",
      title: "Attack paths surface automatically",
      body: "A graph engine chains misconfigurations and CVEs into end-to-end paths from the internet to your most valuable assets.",
    },
    {
      step: "Step 04",
      title: "AI ships the fix",
      body: "For each path, Drishti produces remediation steps, copy-pasteable code, and a CFO-ready summary of avoided loss.",
    },
  ]

  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-32 px-6 md:px-10 lg:px-16 bg-background scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="How it Works"
          title={
            <>
              From CIDR to <span className="text-primary">board report</span>{" "}
              in minutes.
            </>
          }
          description="Four steps. Zero agents. A clear chain of evidence for every recommendation Drishti makes."
        />

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden border border-border">
          {steps.map((s) => (
            <div
              key={s.step}
              className="bg-hero-bg p-8 md:p-10 hover:bg-secondary/40 transition-colors"
            >
              <p className="text-primary text-xs uppercase tracking-[0.25em] font-medium mb-3">
                {s.step}
              </p>
              <h3 className="text-foreground text-2xl font-semibold tracking-tight mb-3">
                {s.title}
              </h3>
              <p className="text-muted-foreground text-sm font-light leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Attack Paths                                                        */
/* ------------------------------------------------------------------ */

function AttackPathsSection() {
  const paths = [
    {
      severity: "CRITICAL",
      color: "text-destructive border-destructive/40 bg-destructive/10",
      title: "Internet → DMZ → Domain Controller",
      hops: ["edge-fw-01", "web-prod-04", "ad-primary"],
      blastRadius: "$2.4M",
      cve: "CVE-2024-1709 + AD trust misconfiguration",
    },
    {
      severity: "HIGH",
      color: "text-primary border-primary/40 bg-primary/10",
      title: "Public S3 → Lateral → Payments DB",
      hops: ["s3-public-logs", "ec2-internal-12", "rds-payments"],
      blastRadius: "$890K",
      cve: "Misconfigured IAM role + SQLi in legacy API",
    },
    {
      severity: "MEDIUM",
      color: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
      title: "VPN User → Jumpbox → HR System",
      hops: ["vpn-gateway", "bastion-02", "hr-app-prod"],
      blastRadius: "$310K",
      cve: "Stale credentials, MFA not enforced",
    },
  ]

  return (
    <section
      id="attack-paths"
      className="relative py-24 md:py-32 px-6 md:px-10 lg:px-16 bg-hero-bg scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="Attack Paths"
          title={
            <>
              See exactly how an attacker would{" "}
              <span className="text-primary">reach the crown jewels</span>.
            </>
          }
          description="Drishti doesn't just hand you a list of CVEs. It chains them into real paths an attacker can execute today — each one scored in dollars."
        />

        <div className="space-y-4">
          {paths.map((p) => (
            <div
              key={p.title}
              className="group border border-border rounded-lg bg-secondary/30 hover:border-primary/40 transition-colors p-6 md:p-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-sm border ${p.color}`}
                  >
                    {p.severity}
                  </span>
                  <h3 className="text-foreground text-lg md:text-xl font-semibold tracking-tight">
                    {p.title}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">
                    Blast radius
                  </p>
                  <p className="text-primary text-2xl font-bold tracking-tight font-mono">
                    {p.blastRadius}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4 font-mono text-xs">
                {p.hops.map((h, i) => (
                  <span key={h} className="flex items-center gap-2">
                    <span className="bg-background border border-border px-3 py-1.5 rounded-sm text-foreground/90">
                      {h}
                    </span>
                    {i < p.hops.length - 1 && (
                      <span className="text-primary">→</span>
                    )}
                  </span>
                ))}
              </div>

              <p className="text-muted-foreground text-sm font-light">
                <span className="text-foreground/70">Root cause:</span> {p.cve}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

function PricingSection() {
  const tiers = [
    {
      name: "Starter",
      price: "$0",
      cadence: "/ forever",
      blurb: "For solo engineers and small homelabs exploring Drishti.",
      cta: "Start free",
      featured: false,
      features: [
        "1 scan target",
        "Up to 256 hosts per scan",
        "Attack-path graph",
        "Community support",
      ],
    },
    {
      name: "Team",
      price: "$499",
      cadence: "/ month",
      blurb: "For security teams that need continuous, dollar-scored coverage.",
      cta: "Start 14-day trial",
      featured: true,
      features: [
        "Unlimited scan targets",
        "Up to 10,000 hosts",
        "Financial blast-radius scoring",
        "AI remediation playbooks",
        "Slack + email alerts",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      cadence: "",
      blurb: "For regulated orgs needing SSO, audit logs and dedicated infra.",
      cta: "Talk to sales",
      featured: false,
      features: [
        "Everything in Team",
        "SSO / SAML / SCIM",
        "On-prem or private cloud",
        "Custom integrations",
        "Dedicated CSM",
        "99.9% SLA",
      ],
    },
  ]

  return (
    <section
      id="pricing"
      className="relative py-24 md:py-32 px-6 md:px-10 lg:px-16 bg-background scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Simple pricing. <span className="text-primary">Real outcomes.</span>
            </>
          }
          description="Pay for the assets you protect — not per seat, scanner, or vulnerability. Cancel anytime."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-lg p-8 flex flex-col ${
                t.featured
                  ? "bg-secondary/60 border border-primary/40"
                  : "bg-secondary/30 border border-border"
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-8 bg-primary text-primary-foreground text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-sm">
                  Most popular
                </span>
              )}
              <h3 className="text-foreground text-xl font-semibold tracking-tight mb-2">
                {t.name}
              </h3>
              <p className="text-muted-foreground text-sm font-light mb-6">
                {t.blurb}
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-foreground text-4xl font-bold tracking-tight">
                  {t.price}
                </span>
                {t.cadence && (
                  <span className="text-muted-foreground text-sm">
                    {t.cadence}
                  </span>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-sm text-foreground/80 font-light"
                  >
                    <span className="text-primary mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#request-access"
                className={`text-center text-sm font-semibold uppercase tracking-widest py-3 rounded-sm transition-all active:scale-[0.97] ${
                  t.featured
                    ? "bg-primary text-primary-foreground hover:brightness-110"
                    : "bg-nav-button text-foreground hover:bg-nav-button/80"
                }`}
              >
                {t.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Docs                                                                */
/* ------------------------------------------------------------------ */

function DocsSection() {
  const docs = [
    {
      title: "Quickstart",
      body: "Run your first Drishti scan in under 3 minutes.",
      kind: "Guide",
    },
    {
      title: "REST API Reference",
      body: "Every endpoint, parameter and response schema.",
      kind: "API",
    },
    {
      title: "Attack-path scoring model",
      body: "How blast-radius dollars are computed end-to-end.",
      kind: "Concept",
    },
    {
      title: "Integrations",
      body: "Slack, Jira, ServiceNow, PagerDuty, Splunk and more.",
      kind: "How-to",
    },
    {
      title: "Self-hosting Drishti",
      body: "Deploy Drishti in your own VPC or on bare metal.",
      kind: "Ops",
    },
    {
      title: "Security & compliance",
      body: "SOC 2, encryption, data residency and audit logs.",
      kind: "Trust",
    },
  ]

  return (
    <section
      id="docs"
      className="relative py-24 md:py-32 px-6 md:px-10 lg:px-16 bg-hero-bg scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="Docs"
          title={
            <>
              Everything you need to{" "}
              <span className="text-primary">go live</span>.
            </>
          }
          description="Engineer-first documentation. Curl examples, terraform modules and runbooks — not marketing copy."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((d) => (
            <a
              key={d.title}
              href="#"
              className="group block bg-secondary/30 border border-border hover:border-primary/40 rounded-lg p-6 transition-colors"
            >
              <p className="text-primary text-[10px] uppercase tracking-[0.25em] font-medium mb-3">
                {d.kind}
              </p>
              <h3 className="text-foreground text-lg font-semibold tracking-tight mb-2 group-hover:text-primary transition-colors">
                {d.title}
              </h3>
              <p className="text-muted-foreground text-sm font-light leading-relaxed">
                {d.body}
              </p>
              <span className="inline-block mt-4 text-xs text-foreground/70 uppercase tracking-widest">
                Read →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Request Access / Final CTA                                          */
/* ------------------------------------------------------------------ */

function RequestAccessSection({
  onStartScan,
  onLoadDemo,
  loading,
}: {
  onStartScan: (target: string) => void
  onLoadDemo: () => void
  loading: boolean
}) {
  const [target, setTarget] = useState("")

  const handleScan = () => {
    if (target.trim() && !loading) onStartScan(target.trim())
  }

  return (
    <section
      id="request-access"
      className="relative py-24 md:py-32 px-6 md:px-10 lg:px-16 bg-background scroll-mt-20"
    >
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-primary text-xs uppercase tracking-[0.25em] font-medium mb-4">
          Request Access
        </p>
        <h2 className="text-foreground text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
          See your network the way an{" "}
          <span className="text-primary">attacker does</span>.
        </h2>
        <p className="text-muted-foreground text-base md:text-lg font-light max-w-2xl mx-auto mb-10">
          Drop in a CIDR range or load demo data. Drishti renders the full
          attack graph and blast-radius report in under a minute.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xl mx-auto">
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder="192.168.1.0/24"
            disabled={loading}
            className="flex-1 bg-secondary/80 text-foreground placeholder:text-muted-foreground px-4 py-3 md:py-4 text-sm rounded-sm border border-border outline-none focus:border-primary transition-colors font-mono disabled:opacity-50"
          />
          <button
            onClick={handleScan}
            disabled={!target.trim() || loading}
            className="bg-primary text-primary-foreground px-6 py-3 md:px-8 md:py-4 text-sm font-bold rounded-sm cursor-pointer hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Scanning…" : "Start Scan"}
          </button>
          <button
            onClick={onLoadDemo}
            disabled={loading}
            className="bg-white text-background px-6 py-3 md:px-8 md:py-4 text-sm font-bold rounded-sm cursor-pointer hover:brightness-90 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Load Demo
          </button>
        </div>

        <p className="text-muted-foreground/60 text-xs font-light mt-6">
          No credit card required · SOC 2 Type II · Data never leaves your tenant
        </p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-border bg-hero-bg px-6 md:px-10 lg:px-16 py-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p className="text-foreground text-lg font-semibold tracking-tight uppercase">
            Drishti
          </p>
          <p className="text-muted-foreground text-xs font-light mt-1">
            AI-powered network risk intelligence. © {new Date().getFullYear()} Drishti Security.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground uppercase tracking-widest">
          <a href="#platform" className="hover:text-foreground transition-colors">Platform</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
          <a href="#attack-paths" className="hover:text-foreground transition-colors">Attack Paths</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#docs" className="hover:text-foreground transition-colors">Docs</a>
        </div>
      </div>
    </footer>
  )
}
