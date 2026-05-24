import React from "react"
import { buttonVariants } from "./ui/button"
import { cn } from "../lib/utils"

export default function Navbar() {
  const navLinks = ["Platform", "How it Works", "Attack Paths", "Pricing", "Docs"]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 lg:px-16 py-5 bg-transparent">
      {/* Left Logo */}
      <div className="text-foreground text-xl font-semibold tracking-tight uppercase">
        DRISHTI
      </div>

      {/* Center Links */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => {
          const href = `#${link.toLowerCase().replace(/ /g, "-")}`
          return (
            <a
              key={link}
              href={href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
            >
              {link}
            </a>
          )
        })}
      </div>

      {/* Right Action Button */}
      <a
        href="#request-access"
        className={cn(
          buttonVariants({ variant: "navCta", size: "lg" }),
          "hidden md:inline-flex rounded-lg uppercase text-xs tracking-widest px-6"
        )}
      >
        Request Access
      </a>
    </nav>
  )
}
