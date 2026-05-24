import React, { Suspense, useState } from "react"

// Lazy load Spline 3D background component
const Spline = React.lazy(() => import("@splinetool/react-spline"))

interface HeroSectionProps {
  onStartScan: (target: string) => void
  onLoadDemo: () => void
  loading: boolean
}

export default function HeroSection({ onStartScan, onLoadDemo, loading }: HeroSectionProps) {
  const [target, setTarget] = useState("")

  const handleScan = () => {
    if (target.trim() && !loading) onStartScan(target.trim())
  }
  return (
    <section className="relative min-h-screen flex items-end bg-hero-bg overflow-hidden">
      {/* Spline 3D Background */}
      <div className="absolute inset-0">
        <Suspense fallback={<div className="absolute inset-0 bg-hero-bg" />}>
          <Spline
            scene="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode"
            className="w-full h-full"
          />
        </Suspense>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30 z-[1] pointer-events-none" />

      {/* Content container */}
      <div className="relative z-10 pointer-events-none w-full max-w-[90%] sm:max-w-md lg:max-w-2xl px-6 md:px-10 pb-10 md:pb-10 pt-32">
        {/* Heading */}
        <h1
          className="text-[clamp(3rem,8vw,6rem)] font-bold leading-[1.05] tracking-[-0.05em] text-foreground mb-2 md:mb-4 uppercase opacity-0 animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          DRISHTI<span className="text-primary"> AI</span>
        </h1>

        {/* Subheading */}
        <p
          className="text-foreground/80 text-[clamp(1.125rem,2.5vw,1.875rem)] font-light mb-3 md:mb-6 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.4s" }}
        >
          See every attack path before they do.
        </p>

        {/* Description */}
        <p
          className="text-muted-foreground text-[clamp(0.875rem,1.5vw,1.25rem)] font-light mb-4 md:mb-8 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.55s" }}
        >
          AI-powered network risk intelligence. Discover attack paths, score
          financial blast radius, and ship AI-generated remediation — from one
          scan to a board-ready report in minutes.
        </p>

        {/* Scan input + CTAs */}
        <div
          className="flex flex-col sm:flex-row flex-wrap gap-3 font-bold opacity-0 animate-fade-up"
          style={{ animationDelay: "0.7s" }}
        >
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder="192.168.1.0/24"
            disabled={loading}
            className="pointer-events-auto bg-secondary/80 backdrop-blur-sm text-foreground placeholder:text-muted-foreground px-4 py-3 md:py-4 text-sm rounded-sm border border-border outline-none focus:border-primary transition-colors font-mono font-normal w-full sm:w-64 disabled:opacity-50"
          />
          <button
            onClick={handleScan}
            disabled={!target.trim() || loading}
            className="pointer-events-auto bg-primary text-primary-foreground px-6 py-3 md:px-8 md:py-4 text-sm rounded-sm cursor-pointer hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Scanning…" : "Start Scan"}
          </button>
          <button
            onClick={onLoadDemo}
            disabled={loading}
            className="pointer-events-auto bg-white text-background px-6 py-3 md:px-8 md:py-4 text-sm rounded-sm cursor-pointer hover:brightness-90 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Load Demo
          </button>
        </div>

        {/* Trust line */}
        <p
          className="text-muted-foreground/60 text-xs font-light mt-4 md:mt-6 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.85s" }}
        >
          Attack-path discovery · Financial risk scoring · AI remediation.
        </p>
      </div>
    </section>
  )
}
