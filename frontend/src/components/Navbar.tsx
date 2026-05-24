import React, { useState } from "react"
import { buttonVariants } from "./ui/button"
import { cn } from "../lib/utils"

const navLinks = ["Platform", "How it Works", "Attack Paths", "Pricing", "Docs"]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-hero-bg/80 backdrop-blur-md border-b border-border/30">
      <div className="flex items-center justify-between px-4 sm:px-8 lg:px-16 py-4">
        <a href="#" className="text-foreground text-lg sm:text-xl font-semibold tracking-tight uppercase">
          DRISHTI
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const href = "#" + link.toLowerCase().replace(/ /g, "-")
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

        <a
          href="#request-access"
          className={cn(
            buttonVariants({ variant: "navCta", size: "lg" }),
            "hidden md:inline-flex rounded-lg uppercase text-xs tracking-widest px-6"
          )}
        >
          Request Access
        </a>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
          aria-label="Toggle menu"
        >
          <span className={"block w-5 h-0.5 bg-foreground transition-all duration-200" + (open ? " rotate-45 translate-y-2" : "")} />
          <span className={"block w-5 h-0.5 bg-foreground transition-all duration-200" + (open ? " opacity-0" : "")} />
          <span className={"block w-5 h-0.5 bg-foreground transition-all duration-200" + (open ? " -rotate-45 -translate-y-2" : "")} />
        </button>
      </div>

      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          open ? "max-h-80 pb-4" : "max-h-0"
        )}
      >
        <div className="flex flex-col gap-1 px-4">
          {navLinks.map((link) => {
            const href = "#" + link.toLowerCase().replace(/ /g, "-")
            return (
              <a
                key={link}
                href={href}
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest py-3 px-2"
              >
                {link}
              </a>
            )
          })}
          <a
            href="#request-access"
            onClick={() => setOpen(false)}
            className={cn(
              buttonVariants({ variant: "navCta", size: "lg" }),
              "inline-flex justify-center rounded-lg uppercase text-xs tracking-widest mt-2"
            )}
          >
            Request Access
          </a>
        </div>
      </div>
    </nav>
  )
}
