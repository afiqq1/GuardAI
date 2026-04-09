// components/dashboard/threat-intel-page.tsx
'use client'

import { useEffect, useState } from 'react'
import { THREAT_INTEL_DATA, IOC_TAGS } from '@/lib/sample-data'
import { useDashboardStore } from '@/lib/dashboard-store'

function AnimatedBar({ prevalence, color, delay }: { prevalence: number; color: string; delay: number }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(prevalence)
    }, delay)
    return () => clearTimeout(timer)
  }, [prevalence, delay])

  return (
    <div className="w-full h-8 rounded bg-cyber-surface overflow-hidden">
      <div
        className="h-full rounded transition-all duration-1000 ease-out flex items-center justify-end px-3"
        style={{
          width: `${width}%`,
          backgroundColor: color,
          boxShadow: `0 0 15px ${color}40`
        }}
      >
        <span className="text-xs font-bold font-mono text-background">{prevalence}%</span>
      </div>
    </div>
  )
}

// Helper function to map scam types to categories
function mapScamTypeToCategory(scamType: string): string {
  const lowerType = scamType.toLowerCase()
  
  if (lowerType.includes('netflix') || lowerType.includes('paypal') || 
      lowerType.includes('apple') || lowerType.includes('amazon') || 
      lowerType.includes('microsoft') || lowerType.includes('google') ||
      lowerType.includes('email phishing')) {
    return 'Email Phishing'
  }
  if (lowerType.includes('macau') || lowerType.includes('pdrm') || lowerType.includes('polis')) {
    return 'Macau Scam'
  }
  if (lowerType.includes('shopee') || lowerType.includes('lazada') || lowerType.includes('e-commerce')) {
    return 'E-Commerce Fraud'
  }
  if (lowerType.includes('bank negara') || lowerType.includes('bnm') || 
      lowerType.includes('maybank') || lowerType.includes('cimb') || 
      lowerType.includes('public bank') || lowerType.includes('bank impersonation')) {
    return 'Bank Impersonation'
  }
  if (lowerType.includes('phishing url') || lowerType.includes('ip address') || 
      lowerType.includes('typosquatting') || lowerType.includes('suspicious url')) {
    return 'Phishing/URL'
  }
  if (lowerType.includes('parcel') || lowerType.includes('customs')) {
    return 'Parcel/Customs'
  }
  if (lowerType.includes('job')) {
    return 'Job Offer Scam'
  }
  if (lowerType.includes('investment') || lowerType.includes('crypto')) {
    return 'Investment Scam'
  }
  return 'Other'
}

export function ThreatIntelPage() {
  const scanHistory = useDashboardStore((state) => state.scanHistory)
  
  const [stats, setStats] = useState({
    totalScans: 0,
    highRiskCount: 0,
    suspiciousCount: 0,
    safeCount: 0,
    scamTypeCounts: {} as Record<string, number>,
    lastUpdated: new Date(),
  })

  useEffect(() => {
    if (!scanHistory || scanHistory.length === 0) {
      return
    }

    const total = scanHistory.length
    const highRisk = scanHistory.filter(s => s.verdict === 'HIGH_RISK').length
    const suspicious = scanHistory.filter(s => s.verdict === 'SUSPICIOUS').length
    const safe = scanHistory.filter(s => s.verdict === 'SAFE').length
    
    // Count scam types from history - mapped to categories
    const scamTypeCounts: Record<string, number> = {}
    scanHistory.forEach(scan => {
      if (scan.verdict !== 'SAFE' && scan.scamType) {
        const category = mapScamTypeToCategory(scan.scamType)
        scamTypeCounts[category] = (scamTypeCounts[category] || 0) + 1
      }
    })

    setStats({
      totalScans: total,
      highRiskCount: highRisk,
      suspiciousCount: suspicious,
      safeCount: safe,
      scamTypeCounts,
      lastUpdated: new Date(),
    })
  }, [scanHistory])

  // Calculate prevalence percentages based on actual scan history
  const getPrevalenceData = () => {
    if (stats.totalScans === 0 || Object.keys(stats.scamTypeCounts).length === 0) {
      return THREAT_INTEL_DATA
    }

    const totalScams = stats.highRiskCount + stats.suspiciousCount
    if (totalScams === 0) return THREAT_INTEL_DATA

    // Update prevalence based on actual detections
    return THREAT_INTEL_DATA.map(item => {
      const actualCount = stats.scamTypeCounts[item.name] || 0
      const prevalence = Math.round((actualCount / totalScams) * 100)
      return {
        ...item,
        prevalence: Math.min(100, Math.max(0, prevalence))
      }
    })
  }

  const prevalenceData = getPrevalenceData()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Malaysian Scam Threat Intelligence</h2>
        <p className="text-sm text-muted-foreground">
          Real-time analysis based on {stats.totalScans} scanned messages • Last updated {stats.lastUpdated.toLocaleTimeString()}
        </p>
      </div>

      {/* Scam Prevalence Chart */}
      <div className="p-6 rounded-xl bg-cyber-card border border-border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider">
            Scam Type Prevalence
          </h3>
          <div className="text-xs text-muted-foreground">
            Based on {stats.highRiskCount + stats.suspiciousCount} scam detections
          </div>
        </div>
        
        {stats.totalScans === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No scan data available yet.</p>
            <p className="text-sm mt-2">Run some analyses to see scam prevalence statistics.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prevalenceData.map((item, index) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">{item.name}</span>
                  <span className="text-muted-foreground font-mono">{item.prevalence}%</span>
                </div>
                <AnimatedBar prevalence={item.prevalence} color={item.color} delay={index * 100} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scan Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-cyber-card border border-border">
          <div className="text-3xl font-bold font-mono text-cyber-red mb-1">{stats.highRiskCount}</div>
          <div className="text-sm text-muted-foreground">High Risk Detections</div>
          {stats.totalScans > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {((stats.highRiskCount / stats.totalScans) * 100).toFixed(1)}% of total scans
            </div>
          )}
        </div>
        <div className="p-5 rounded-xl bg-cyber-card border border-border">
          <div className="text-3xl font-bold font-mono text-cyber-amber mb-1">{stats.suspiciousCount}</div>
          <div className="text-sm text-muted-foreground">Suspicious Detections</div>
          {stats.totalScans > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {((stats.suspiciousCount / stats.totalScans) * 100).toFixed(1)}% of total scans
            </div>
          )}
        </div>
        <div className="p-5 rounded-xl bg-cyber-card border border-border">
          <div className="text-3xl font-bold font-mono text-cyber-green mb-1">{stats.safeCount}</div>
          <div className="text-sm text-muted-foreground">Safe Messages</div>
          {stats.totalScans > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {((stats.safeCount / stats.totalScans) * 100).toFixed(1)}% of total scans
            </div>
          )}
        </div>
      </div>

      {/* Indicators of Compromise */}
      <div className="p-6 rounded-xl bg-cyber-card border border-border">
        <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider mb-4">
          Known Indicators of Compromise (IOC)
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Common keywords and patterns detected in analyzed scam messages
        </p>

        <div className="space-y-6">
          {/* High Risk */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyber-red" />
              <span className="text-xs font-semibold text-cyber-red uppercase tracking-wider">High Risk Indicators</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {IOC_TAGS.high.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-cyber-red/15 text-cyber-red border border-cyber-red/30 hover:bg-cyber-red/25 transition-colors cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Medium Risk */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyber-amber" />
              <span className="text-xs font-semibold text-cyber-amber uppercase tracking-wider">Medium Risk Indicators</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {IOC_TAGS.medium.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-cyber-amber/15 text-cyber-amber border border-cyber-amber/30 hover:bg-cyber-amber/25 transition-colors cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Low Risk */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Low Risk Indicators</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {IOC_TAGS.low.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50 transition-colors cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State Notice */}
      {stats.totalScans === 0 && (
        <div className="p-4 rounded-xl bg-cyber-amber/10 border border-cyber-amber/30">
          <p className="text-sm text-muted-foreground text-center">
            ℹ️ No scan history available. Use the Scan page to analyze messages and build threat intelligence data.
          </p>
        </div>
      )}
    </div>
  )
}