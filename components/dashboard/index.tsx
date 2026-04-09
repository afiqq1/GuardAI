'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useDashboardStore } from '@/lib/dashboard-store'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { ScanPage } from './scan-page'
import { AnalyticsPage } from './analytics-page'
import { ThreatIntelPage } from './threat-intel-page'
import { SystemInfoPage } from './system-info-page'
import { NetworkGraphPage } from './network-graph-page'
import { LiveRadarPage } from './live-radar-page'
import { FamilyShieldPage } from './family-shield-page'
import { VoiceAnalyzerPage } from './voice-analyzer-page'
import { RecoveryPage } from './recovery-page'
import { CommunityPage } from './community-page'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const currentPage = useDashboardStore((state) => state.currentPage)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-cyber-card border border-border text-foreground"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 lg:translate-x-0',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 sm:p-6 overflow-auto pt-16 lg:pt-6">
          <div className="max-w-6xl mx-auto">
            {currentPage === 'scan' && <ScanPage />}
            {currentPage === 'analytics' && <AnalyticsPage />}
            {currentPage === 'threat-intel' && <ThreatIntelPage />}
            {currentPage === 'system-info' && <SystemInfoPage />}
            {currentPage === 'network-graph' && <NetworkGraphPage />}
            {currentPage === 'live-radar' && <LiveRadarPage />}
            {currentPage === 'family-shield' && <FamilyShieldPage />}
            {currentPage === 'voice-analyzer' && <VoiceAnalyzerPage />}
            {currentPage === 'recovery' && <RecoveryPage />}
            {currentPage === 'community' && <CommunityPage />}
          </div>
        </main>
      </div>
    </div>
  )
}
