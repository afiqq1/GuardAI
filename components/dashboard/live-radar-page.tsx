'use client'

import { useState, useEffect } from 'react'
import { Radio, MapPin, AlertTriangle, Clock, TrendingUp, Zap } from 'lucide-react'
import { useDashboardStore } from '@/lib/dashboard-store'
import { cn } from '@/lib/utils'

const MALAYSIA_STATES = [
  { name: 'Kuala Lumpur', lat: 3.139, lng: 101.6869, threats: 234 },
  { name: 'Selangor', lat: 3.0738, lng: 101.5183, threats: 189 },
  { name: 'Penang', lat: 5.4164, lng: 100.3327, threats: 87 },
  { name: 'Johor', lat: 1.4927, lng: 103.7414, threats: 156 },
  { name: 'Pahang', lat: 4.2426, lng: 101.9731, threats: 43 },
  { name: 'Perak', lat: 4.5975, lng: 103.4324, threats: 65 },
  { name: 'Sabah', lat: 5.9804, lng: 116.0735, threats: 34 },
  { name: 'Sarawak', lat: 1.5533, lng: 110.3592, threats: 28 },
]

const THREAT_COLORS: Record<string, string> = {
  'Macau Scam': '#ff4060',
  'E-Commerce Fraud': '#ff6b35',
  'Phishing': '#ffaa00',
  'Bank Impersonation': '#9d78ff',
  'Job Scam': '#00d4ff',
  'Investment Scam': '#00e67a',
}

export function LiveRadarPage() {
  const { liveThreats } = useDashboardStore()
  const [pulsePhase, setPulsePhase] = useState(0)
  const [realtimeThreats, setRealtimeThreats] = useState(liveThreats)
  const [selectedState, setSelectedState] = useState<string | null>(null)

  // Simulate real-time threat updates
  useEffect(() => {
    const interval = setInterval(() => {
      const types = Object.keys(THREAT_COLORS)
      const states = MALAYSIA_STATES
      const randomState = states[Math.floor(Math.random() * states.length)]
      const randomType = types[Math.floor(Math.random() * types.length)]
      
      setRealtimeThreats(prev => [{
        lat: randomState.lat + (Math.random() - 0.5) * 0.5,
        lng: randomState.lng + (Math.random() - 0.5) * 0.5,
        type: randomType,
        time: new Date()
      }, ...prev.slice(0, 19)])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Radar pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(p => (p + 1) % 4)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-red/20 relative">
              <Radio className="w-6 h-6 text-cyber-red" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-cyber-red rounded-full animate-pulse" />
            </div>
            Live Threat Radar
          </h2>
          <p className="text-muted-foreground mt-1">
            Real-time scam activity monitoring across Malaysia
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-red/10 border border-cyber-red/30">
          <span className="w-2 h-2 bg-cyber-red rounded-full animate-pulse" />
          <span className="text-sm font-mono text-cyber-red">LIVE</span>
        </div>
      </div>

      {/* Unique Feature Badge */}
      <div className="bg-gradient-to-r from-cyber-red/20 to-cyber-amber/20 border border-cyber-red/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-red/30">
            <Zap className="w-5 h-5 text-cyber-red" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">First-of-its-kind in Malaysia</h4>
            <p className="text-sm text-muted-foreground">
              GuardAI aggregates crowdsourced reports, honeypot data, and ML predictions to visualize 
              scam hotspots in real-time. Protecting 32 million Malaysians.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Visualization */}
        <div className="lg:col-span-2 bg-cyber-card border border-border rounded-xl p-6 relative overflow-hidden">
          {/* Simplified Malaysia Map SVG */}
          <svg 
            viewBox="0 0 600 400" 
            className="w-full h-[500px]"
            style={{ filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.1))' }}
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(157, 120, 255, 0.1)" strokeWidth="0.5"/>
              </pattern>
              <radialGradient id="pulseGradient">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="#00d4ff" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <rect width="600" height="400" fill="url(#grid)"/>
            
            {/* Peninsular Malaysia - simplified shape */}
            <path 
              d="M 180 80 L 220 60 L 260 70 L 280 100 L 290 150 L 280 200 L 260 250 L 240 300 L 220 340 L 200 360 L 180 340 L 170 300 L 175 250 L 185 200 L 190 150 L 185 100 Z"
              fill="rgba(0, 212, 255, 0.1)"
              stroke="rgba(0, 212, 255, 0.5)"
              strokeWidth="2"
            />
            
            {/* East Malaysia - Sabah & Sarawak simplified */}
            <path 
              d="M 350 150 L 400 120 L 450 100 L 500 110 L 540 130 L 560 160 L 550 200 L 520 220 L 480 230 L 420 220 L 380 200 L 350 180 Z"
              fill="rgba(0, 212, 255, 0.1)"
              stroke="rgba(0, 212, 255, 0.5)"
              strokeWidth="2"
            />

            {/* Radar pulse rings */}
            {[0, 1, 2, 3].map((i) => (
              <circle
                key={i}
                cx="300"
                cy="200"
                r={50 + i * 60}
                fill="none"
                stroke={`rgba(0, 212, 255, ${0.3 - i * 0.07})`}
                strokeWidth="1"
                opacity={(i === pulsePhase) ? 1 : 0.3}
                className="transition-opacity duration-500"
              />
            ))}

            {/* State markers */}
            {MALAYSIA_STATES.map((state, i) => {
              const x = 100 + (state.lng - 100) * 8
              const y = 400 - (state.lat) * 50
              const isSelected = selectedState === state.name
              
              return (
                <g key={state.name}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 20 : 15}
                    fill={isSelected ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 64, 96, 0.2)'}
                    stroke={isSelected ? '#00d4ff' : '#ff4060'}
                    strokeWidth="2"
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => setSelectedState(isSelected ? null : state.name)}
                  />
                  <text
                    x={x}
                    y={y - 25}
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.7)"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {state.name}
                  </text>
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fill="#ff4060"
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {state.threats}
                  </text>
                </g>
              )
            })}

            {/* Live threat pings */}
            {realtimeThreats.slice(0, 10).map((threat, i) => {
              const x = 100 + (threat.lng - 100) * 8
              const y = 400 - (threat.lat) * 50
              const color = THREAT_COLORS[threat.type] || '#ff4060'
              
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill={color}
                    opacity={1 - i * 0.08}
                  >
                    <animate
                      attributeName="r"
                      from="4"
                      to="12"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="1"
                      to="0"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill={color}
                  />
                </g>
              )
            })}
          </svg>

          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none scanline opacity-10" />
        </div>

        {/* Live Feed Panel */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-cyber-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-cyber-cyan" />
              Today&apos;s Statistics
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-mono font-bold text-cyber-red">847</p>
                <p className="text-[10px] text-muted-foreground uppercase">Scams Detected</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-mono font-bold text-cyber-green">RM 2.3M</p>
                <p className="text-[10px] text-muted-foreground uppercase">Est. Saved</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-mono font-bold text-cyber-amber">156</p>
                <p className="text-[10px] text-muted-foreground uppercase">New Domains</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-mono font-bold text-cyber-purple">23</p>
                <p className="text-[10px] text-muted-foreground uppercase">Campaigns</p>
              </div>
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="bg-cyber-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-cyber-cyan" />
              Live Activity
            </h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {realtimeThreats.slice(0, 8).map((threat, i) => (
                <div 
                  key={i}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg bg-background/50 border-l-2 transition-all',
                    i === 0 && 'animate-pulse-once'
                  )}
                  style={{ borderLeftColor: THREAT_COLORS[threat.type] }}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: THREAT_COLORS[threat.type] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{threat.type}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {MALAYSIA_STATES.find(s => 
                        Math.abs(s.lat - threat.lat) < 1 && Math.abs(s.lng - threat.lng) < 1
                      )?.name || 'Malaysia'}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formatTimeAgo(threat.time)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Threat Type Legend */}
          <div className="bg-cyber-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-3">Threat Types</h4>
            <div className="space-y-2">
              {Object.entries(THREAT_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm text-muted-foreground">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
