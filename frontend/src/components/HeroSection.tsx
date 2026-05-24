import React, { Suspense, useState, useEffect } from "react"

// Lazy load Spline 3D background component (desktop only)
const Spline = React.lazy(() => import("@splinetool/react-spline"))

interface HeroSectionProps {
  onStartScan: (target: string) => void
  onLoadDemo: () => void
  loading: boolean
}

function useIsMobile() {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  )
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  return mobile
}

export default function HeroSection({ onStartScan, onLoadDemo, loading }: HeroSectionProps) {
  const [target, setTarget] = useState("")
  const isMobile = useIsMobile()

  const handleScan = () => {
    if (target.trim() && !loading) onStartScan(target.trim())
  }
  return (
    <section className="relative min-h-screen flex items-end bg-hero-bg overflow-hidden">
      {/* Spline 3D Background — desktop only; mobile gets static gradient */}
      <div className="absolute inset-0">
        {isMobile ? (
          <div className="absolute inset-0 bg-gradient-to-b from-hero-bg via-background to-hero-bg" />
        ) : (
          <Suspense fallback={<div className="absolute inset-0 bg-hero-bg" />}>
            <Spline
              scene="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode"
              className="w-full h-full"
            />
          </Suspense>
        )}
      </div>

      {/* Dark overlay — lighter on mobile since no 3D to dim */}
      <div className={`absolute inset-0 z-[1] pointer-events-none ${isMobile ? "bg-black/10" : "bg-black/30"}`} />

      {/* Content container */}
      <div className="relative z-10 pointer-events-none w-full max-w-[95%] sm:max-w-md lg:max-w-2xl px-4 sm:px-6 md:px-10 pb-8 sm:pb-10 pt-24 sm:pt-32">
        {/* Heading */}
        <h1
          className="text-[clamp(2.25rem,8vw,6rem)] font-bold leading-[1.05] tracking-[-0.05em] text-foreground mb-2 md:mb-4 uppercase opacity-0 animate-fade-up"
          style={{ animationDelay: "0.15s" }}
        >
          DRISHTI<span className="text-primary"> AI</span>
        </h1>

        {/* Subheading */}
        <p
          className="text-foreground/80 text-[clamp(1rem,2.5vw,1.875rem)] font-light mb-3 md:mb-6 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.25s" }}
        >
          See every attack path before they do.
        </p>

        {/* Description */}
        <p
          className="text-muted-foreground text-[clamp(0.8125rem,1.5vw,1.25rem)] font-light mb-4 md:mb-8 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.35s" }}
        >
          AI-powered network risk intelligence. Discover attack paths, score
          financial blast radius, and ship AI-generated remediation — from one
          scan to a board-ready report in minutes.
        </p>

        {/* Scan input + CTAs */}
        <div
          className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 font-bold opacity-0 animate-fade-up"
          style={{ animationDelay: "0.45s" }}
        >
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder="192.168.1.0/24"
            disabled={loading}
            className="pointer-events-auto bg-secondary/80 text-foreground placeholder:text-muted-foreground px-4 py-3.5 sm:py-3 md:py-4 text-sm rounded-sm border border-border outline-none focus:border-primary transition-colors font-mono font-normal w-full sm:w-56 md:w-64 disabled:opacity-50"
          />
          <button
            onClick={handleScan}
            disabled={!target.trim() || loading}
            className="pointer-events-auto bg-primary text-primary-foreground px-6 py-3.5 sm:py-3 md:px-8 md:py-4 text-sm rounded-sm cursor-pointer hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {loading ? "Scanning…" : "Start Scan"}
          </button>
          <button
            onClick={onLoadDemo}
            disabled={loading}
            className="pointer-events-auto bg-white text-background px-6 py-3.5 sm:py-3 md:px-8 md:py-4 text-sm rounded-sm cursor-pointer hover:brightness-90 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            Load Demo
          </button>
        </div>

        {/* Trust line */}
        <p
          className="text-muted-foreground/60 text-xs font-light mt-4 md:mt-6 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.55s" }}
        >
          Attack-path discovery · Financial risk scoring · AI remediation.
        </p>
      </div>
    </section>
  )
}
