'use client'

import { Shield, Activity, AlertTriangle, Info, ShieldCheck, Search, Radio, Users, Mic, LifeBuoy, MessageSquare, Network } from 'lucide-react'
import { useDashboardStore } from '@/lib/dashboard-store'
import { cn } from '@/lib/utils'

const navItems = [
  { id: 'scan' as const, label: 'Scan Message', icon: Shield, badge: null },
  { id: 'recovery' as const, label: 'Recovery Guide', icon: LifeBuoy, badge: null },
  { id: 'analytics' as const, label: 'Analytics', icon: Activity, badge: null },
  { id: 'threat-intel' as const, label: 'Threat Intel', icon: AlertTriangle, badge: null },
  { id: 'system-info' as const, label: 'Architecture & ML', icon: Info, badge: 'DOCS' },
]

export function Sidebar() {
  const { currentPage, setCurrentPage, totalScanned, threatsFound } = useDashboardStore()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[280px] flex flex-col border-r border-border bg-sidebar">
      {/* Logo Section */}
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <div className="relative">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyber-cyan/10 glow-cyan-sm">
            <ShieldCheck className="w-6 h-6 text-cyber-cyan" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            Guard<span className="text-cyber-cyan">AI</span>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Scam Detection System
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-4 mb-2">Detection</p>
        {navItems.slice(0, 1).map((item) => {
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-cyber-cyan/10 text-cyber-cyan glow-cyan-sm border border-cyber-cyan/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className={cn('w-4 h-4', isActive && 'drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]')} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[9px] font-bold',
                  item.badge === 'LIVE' ? 'bg-cyber-red/20 text-cyber-red animate-pulse' :
                  item.badge === 'NEW' ? 'bg-cyber-green/20 text-cyber-green' :
                  item.badge === 'DOCS' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                  'bg-cyber-purple/20 text-cyber-purple'
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}

        <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-4 mb-2 mt-4">Protection</p>
        {navItems.slice(1, 2).map((item) => {
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-cyber-cyan/10 text-cyber-cyan glow-cyan-sm border border-cyber-cyan/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className={cn('w-4 h-4', isActive && 'drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]')} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          )
        })}

        <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-4 mb-2 mt-4">Insights</p>
        {navItems.slice(2,5).map((item) => {
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-cyber-cyan/10 text-cyber-cyan glow-cyan-sm border border-cyber-cyan/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className={cn('w-4 h-4', isActive && 'drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]')} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Live Stats */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-cyber-card">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-cyber-cyan" />
            <span className="text-xs text-muted-foreground">Total Scanned</span>
          </div>
          <span className="text-lg font-mono font-bold text-cyber-cyan tabular-nums">
            {totalScanned.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-cyber-card">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-cyber-red" />
            <span className="text-xs text-muted-foreground">Threats Found</span>
          </div>
          <span className="text-lg font-mono font-bold text-cyber-red tabular-nums">
            {threatsFound.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Version */}
      <div className="p-4 text-center">
        <span className="text-[10px] text-muted-foreground font-mono">v2.4.1 | Malaysia Edition</span>
      </div>
    </aside>
  )
}
