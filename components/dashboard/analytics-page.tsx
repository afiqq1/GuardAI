// components/dashboard/analytics-page.tsx
'use client'

import { Search, AlertTriangle, AlertCircle, CheckCircle, FileSearch, TrendingUp, Clock } from 'lucide-react'
import { useDashboardStore } from '@/lib/dashboard-store'
import { cn } from '@/lib/utils'

const verdictBadge = {
  HIGH_RISK: {
    bg: 'bg-cyber-red/20',
    text: 'text-cyber-red',
    border: 'border-cyber-red/30'
  },
  SUSPICIOUS: {
    bg: 'bg-cyber-amber/20',
    text: 'text-cyber-amber',
    border: 'border-cyber-amber/30'
  },
  SAFE: {
    bg: 'bg-cyber-green/20',
    text: 'text-cyber-green',
    border: 'border-cyber-green/30'
  }
}

export function AnalyticsPage() {
  const { scanHistory, totalScanned, threatsFound } = useDashboardStore()

  const safeCount = scanHistory.filter(s => s.verdict === 'SAFE').length
  const suspiciousCount = scanHistory.filter(s => s.verdict === 'SUSPICIOUS').length
  const highRiskCount = scanHistory.filter(s => s.verdict === 'HIGH_RISK').length

  const stats = [
    { label: 'Total Scanned', value: totalScanned, icon: Search, color: '#00d4ff', bgColor: 'bg-cyber-cyan/10', borderColor: 'border-cyber-cyan/30' },
    { label: 'High Risk', value: highRiskCount, icon: AlertTriangle, color: '#ff4060', bgColor: 'bg-cyber-red/10', borderColor: 'border-cyber-red/30' },
    { label: 'Suspicious', value: suspiciousCount, icon: AlertCircle, color: '#ffaa00', bgColor: 'bg-cyber-amber/10', borderColor: 'border-cyber-amber/30' },
    { label: 'Safe', value: safeCount, icon: CheckCircle, color: '#00e67a', bgColor: 'bg-cyber-green/10', borderColor: 'border-cyber-green/30' }
  ]

  // Calculate detection rate
  const detectionRate = totalScanned > 0 
    ? ((highRiskCount + suspiciousCount) / totalScanned * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Analytics Dashboard</h2>
        <p className="text-sm text-muted-foreground">Real-time scan statistics and history</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'p-5 rounded-xl border',
              stat.bgColor,
              stat.borderColor
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <span className="text-3xl font-bold font-mono tabular-nums" style={{ color: stat.color }}>
              {stat.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Additional Stats Row */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-cyber-card border border-border">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-cyber-cyan" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Detection Rate</span>
          </div>
          <span className="text-3xl font-bold font-mono text-cyber-cyan">{detectionRate}%</span>
          <p className="text-xs text-muted-foreground mt-1">
            {highRiskCount + suspiciousCount} threats detected out of {totalScanned} total scans
          </p>
        </div>
        <div className="p-5 rounded-xl bg-cyber-card border border-border">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-cyber-cyan" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Last Scan</span>
          </div>
          <span className="text-lg font-mono text-foreground">
            {scanHistory.length > 0 
              ? new Date(scanHistory[0].timestamp).toLocaleString()
              : 'No scans yet'}
          </span>
        </div>
      </div>

      {/* Scan History Table */}
      <div className="rounded-xl bg-cyber-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider">Scan History</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Showing last {scanHistory.length} scans
          </p>
        </div>

        {scanHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-cyber-surface flex items-center justify-center mb-4">
              <FileSearch className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium text-foreground mb-1">No scans yet</h4>
            <p className="text-sm text-muted-foreground max-w-xs">
              Run your first threat analysis to see results here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-cyber-surface/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message Preview</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verdict</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scam Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scanHistory.slice().reverse().map((scan) => {
                  const badge = verdictBadge[scan.verdict]
                  return (
                    <tr key={scan.id} className="hover:bg-cyber-surface/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-foreground max-w-xs truncate" title={scan.message}>
                        {scan.message.slice(0, 60)}...
                       </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-semibold border',
                          badge.bg,
                          badge.text,
                          badge.border
                        )}>
                          {scan.verdict.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'font-mono font-bold text-sm',
                          scan.verdict === 'HIGH_RISK' && 'text-cyber-red',
                          scan.verdict === 'SUSPICIOUS' && 'text-cyber-amber',
                          scan.verdict === 'SAFE' && 'text-cyber-green'
                        )}>
                          {scan.score}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {scan.scamType}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                        {new Date(scan.timestamp).toLocaleTimeString()}
                      </td>
                     </tr>
                  )
                })}
              </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  )
}