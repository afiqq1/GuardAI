'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, CreditCard, Globe, Target, ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react'
import { useDashboardStore } from '@/lib/dashboard-store'
import { cn } from '@/lib/utils'

const nodeIcons = {
  phone: Phone,
  account: CreditCard,
  domain: Globe,
  campaign: Target
}

const nodeColors = {
  phone: '#ff4060',
  account: '#ffaa00',
  domain: '#9d78ff',
  campaign: '#00d4ff'
}

export function NetworkGraphPage() {
  const { scammerNetwork } = useDashboardStore()
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({})

  // Calculate node positions in a force-directed layout simulation
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    const centerX = 400
    const centerY = 300
    const radius = 180

    scammerNetwork.forEach((node, i) => {
      const angle = (i / scammerNetwork.length) * 2 * Math.PI
      const r = node.type === 'campaign' ? radius * 0.5 : radius
      positions[node.id] = {
        x: centerX + r * Math.cos(angle) + (Math.random() - 0.5) * 60,
        y: centerY + r * Math.sin(angle) + (Math.random() - 0.5) * 60
      }
    })
    setNodePositions(positions)
  }, [scammerNetwork])

  // Draw connections on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || Object.keys(nodePositions).length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(zoom, zoom)

    // Draw connections
    scammerNetwork.forEach(node => {
      const pos = nodePositions[node.id]
      if (!pos) return

      node.connections.forEach(connId => {
        const connPos = nodePositions[connId]
        if (!connPos) return

        const isHighlighted = selectedNode === node.id || selectedNode === connId
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
        ctx.lineTo(connPos.x, connPos.y)
        ctx.strokeStyle = isHighlighted ? '#00d4ff' : 'rgba(157, 120, 255, 0.3)'
        ctx.lineWidth = isHighlighted ? 2 : 1
        ctx.stroke()

        // Animated pulse effect for highlighted connections
        if (isHighlighted) {
          ctx.beginPath()
          ctx.arc((pos.x + connPos.x) / 2, (pos.y + connPos.y) / 2, 4, 0, Math.PI * 2)
          ctx.fillStyle = '#00d4ff'
          ctx.fill()
        }
      })
    })

    ctx.restore()
  }, [nodePositions, scammerNetwork, selectedNode, zoom])

  const selectedNodeData = scammerNetwork.find(n => n.id === selectedNode)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-purple/20">
              <Target className="w-6 h-6 text-cyber-purple" />
            </div>
            Scam Network Graph
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-powered connection mapping between scammers, accounts, and campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="p-2 rounded-lg bg-cyber-card border border-border hover:bg-sidebar-accent transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm font-mono text-muted-foreground w-16 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="p-2 rounded-lg bg-cyber-card border border-border hover:bg-sidebar-accent transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 rounded-lg bg-cyber-card border border-border hover:bg-sidebar-accent transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unique Feature Badge */}
      <div className="bg-gradient-to-r from-cyber-purple/20 to-cyber-cyan/20 border border-cyber-purple/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-purple/30">
            <Info className="w-5 h-5 text-cyber-purple" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Scam DNA Fingerprinting</h4>
            <p className="text-sm text-muted-foreground">
              GuardAI&apos;s proprietary algorithm links scam campaigns by analyzing phone patterns, 
              account networks, and domain infrastructure to expose criminal syndicates.
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(nodeColors).map(([type, color]) => {
          const Icon = nodeIcons[type as keyof typeof nodeIcons]
          return (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}20`, border: `1px solid ${color}50` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-sm text-muted-foreground capitalize">{type}</span>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Graph Visualization */}
        <div className="lg:col-span-2 bg-cyber-card border border-border rounded-xl p-4 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          />
          <div 
            className="relative h-[600px]"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            {scammerNetwork.map(node => {
              const pos = nodePositions[node.id]
              if (!pos) return null
              const Icon = nodeIcons[node.type]
              const isSelected = selectedNode === node.id
              const isHovered = hoveredNode === node.id
              const isConnected = selectedNode && scammerNetwork.find(n => n.id === selectedNode)?.connections.includes(node.id)

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(isSelected ? null : node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={cn(
                    'absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300',
                    'rounded-xl p-3 border-2',
                    isSelected && 'ring-2 ring-cyber-cyan ring-offset-2 ring-offset-background scale-110',
                    isHovered && !isSelected && 'scale-105',
                    isConnected && 'ring-1 ring-cyber-purple'
                  )}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    backgroundColor: `${nodeColors[node.type]}15`,
                    borderColor: isSelected ? '#00d4ff' : `${nodeColors[node.type]}50`
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: nodeColors[node.type] }} />
                  {(isHovered || isSelected) && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 z-10">
                      <p className="text-xs font-mono text-foreground">{node.value}</p>
                      <p className="text-[10px] text-muted-foreground">Risk: {node.riskScore}%</p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none scanline opacity-10" />
        </div>

        {/* Node Details Panel */}
        <div className="space-y-4">
          {selectedNodeData ? (
            <div className="bg-cyber-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = nodeIcons[selectedNodeData.type]
                  return (
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${nodeColors[selectedNodeData.type]}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: nodeColors[selectedNodeData.type] }} />
                    </div>
                  )
                })()}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{selectedNodeData.type}</p>
                  <p className="font-mono text-foreground">{selectedNodeData.value}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Risk Score</span>
                  <span className="font-mono font-bold" style={{ 
                    color: selectedNodeData.riskScore >= 80 ? '#ff4060' : 
                           selectedNodeData.riskScore >= 60 ? '#ffaa00' : '#00e67a'
                  }}>
                    {selectedNodeData.riskScore}%
                  </span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${selectedNodeData.riskScore}%`,
                      backgroundColor: selectedNodeData.riskScore >= 80 ? '#ff4060' : 
                                      selectedNodeData.riskScore >= 60 ? '#ffaa00' : '#00e67a'
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Connected Entities</p>
                <div className="space-y-2">
                  {selectedNodeData.connections.map(connId => {
                    const conn = scammerNetwork.find(n => n.id === connId)
                    if (!conn) return null
                    const ConnIcon = nodeIcons[conn.type]
                    return (
                      <button
                        key={connId}
                        onClick={() => setSelectedNode(connId)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background transition-colors text-left"
                      >
                        <ConnIcon className="w-4 h-4" style={{ color: nodeColors[conn.type] }} />
                        <span className="text-xs font-mono text-foreground truncate">{conn.value}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button className="w-full py-2 px-4 rounded-lg bg-cyber-red/20 border border-cyber-red/30 text-cyber-red text-sm font-medium hover:bg-cyber-red/30 transition-colors">
                Report to PDRM
              </button>
            </div>
          ) : (
            <div className="bg-cyber-card border border-border rounded-xl p-5 text-center">
              <div className="p-4 rounded-full bg-cyber-purple/20 w-fit mx-auto mb-3">
                <Target className="w-8 h-8 text-cyber-purple" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Select a Node</h4>
              <p className="text-sm text-muted-foreground">
                Click on any node to view details and connections
              </p>
            </div>
          )}

          {/* Network Statistics */}
          <div className="bg-cyber-card border border-border rounded-xl p-5 space-y-3">
            <h4 className="font-semibold text-foreground">Network Statistics</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-mono font-bold text-cyber-red">
                  {scammerNetwork.filter(n => n.type === 'phone').length}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Phone Numbers</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-mono font-bold text-cyber-amber">
                  {scammerNetwork.filter(n => n.type === 'account').length}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Mule Accounts</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-mono font-bold text-cyber-purple">
                  {scammerNetwork.filter(n => n.type === 'domain').length}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Phishing Domains</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-mono font-bold text-cyber-cyan">
                  {scammerNetwork.filter(n => n.type === 'campaign').length}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Linked Campaigns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
