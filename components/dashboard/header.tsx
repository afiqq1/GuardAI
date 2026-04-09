'use client'

import { ShieldCheck } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-4 ml-10 lg:ml-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-cyber-cyan" />
          <span className="text-lg sm:text-xl font-bold">
            Guard<span className="text-cyber-cyan">AI</span>
          </span>
        </div>
        <div className="hidden md:block h-6 w-px bg-border" />
        <span className="hidden md:block text-sm text-muted-foreground">
          AI-Powered Scam & Fraud Detection
        </span>
      </div>
      
      {/* Live Badge */}
      <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-cyber-green/10 border border-cyber-green/30">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-cyber-green live-pulse" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyber-green animate-ping opacity-75" />
        </div>
        <span className="text-xs font-semibold text-cyber-green uppercase tracking-wider">Live</span>
      </div>
    </header>
  )
}
