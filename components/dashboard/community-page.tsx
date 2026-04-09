'use client'

import { useState } from 'react'
import { Users, CheckCircle, MapPin, Clock, Plus, TrendingUp, AlertTriangle, MessageSquare, ThumbsUp, Share2, Filter, Flame, Zap } from 'lucide-react'
import { useDashboardStore } from '@/lib/dashboard-store'
import { cn } from '@/lib/utils'

export function CommunityPage() {
  const { communityReports, addCommunityReport, verifyReport } = useDashboardStore()
  const [showReportModal, setShowReportModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'verified' | 'new'>('all')
  const [newReport, setNewReport] = useState({ type: 'Macau Scam', content: '', location: '' })

  const handleSubmitReport = () => {
    if (newReport.content && newReport.location) {
      addCommunityReport({
        id: Date.now().toString(),
        type: newReport.type,
        content: newReport.content,
        reportedBy: 'Anonymous',
        timestamp: new Date(),
        verifications: 0,
        location: newReport.location
      })
      setNewReport({ type: 'Macau Scam', content: '', location: '' })
      setShowReportModal(false)
    }
  }

  const filteredReports = communityReports.filter(report => {
    if (filter === 'verified') return report.verifications >= 10
    if (filter === 'new') return Date.now() - report.timestamp.getTime() < 3600000
    return true
  })

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const scamTypes = ['Macau Scam', 'Phishing', 'E-Commerce Fraud', 'Job Scam', 'Investment Scam', 'Bank Impersonation', 'Parcel Scam', 'Love Scam']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-cyan/20">
              <Users className="w-6 h-6 text-cyber-cyan" />
            </div>
            Community Intel
          </h2>
          <p className="text-muted-foreground mt-1">
            Crowdsourced scam reports from Malaysian users
          </p>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-cyan text-background font-medium hover:bg-cyber-cyan/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Report Scam</span>
        </button>
      </div>

      {/* Unique Feature Badge */}
      <div className="bg-gradient-to-r from-cyber-cyan/20 to-cyber-purple/20 border border-cyber-cyan/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-cyan/30">
            <Zap className="w-5 h-5 text-cyber-cyan" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Community-Powered Protection</h4>
            <p className="text-sm text-muted-foreground">
              The first crowdsourced scam intelligence network in Malaysia. Reports are 
              verified by the community and fed into our AI to improve detection in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="bg-cyber-card border border-border rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-cyber-cyan" />
          </div>
          <p className="text-2xl font-mono font-bold text-cyber-cyan">
            {communityReports.length + 1247}
          </p>
          <p className="text-xs text-muted-foreground">Total Reports</p>
        </div>
        <div className="bg-cyber-card border border-border rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-cyber-green" />
          </div>
          <p className="text-2xl font-mono font-bold text-cyber-green">
            {communityReports.filter(r => r.verifications >= 10).length + 892}
          </p>
          <p className="text-xs text-muted-foreground">Verified</p>
        </div>
        <div className="bg-cyber-card border border-border rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-5 h-5 text-cyber-purple" />
          </div>
          <p className="text-2xl font-mono font-bold text-cyber-purple">
            {communityReports.reduce((acc, r) => acc + r.verifications, 0) + 5634}
          </p>
          <p className="text-xs text-muted-foreground">Verifications</p>
        </div>
        <div className="bg-cyber-card border border-border rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-cyber-red" />
          </div>
          <p className="text-2xl font-mono font-bold text-cyber-red">
            {communityReports.filter(r => Date.now() - r.timestamp.getTime() < 86400000).length + 23}
          </p>
          <p className="text-xs text-muted-foreground">Today&apos;s Reports</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Reports' },
            { id: 'verified', label: 'Verified Only' },
            { id: 'new', label: 'New (1h)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === tab.id
                  ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30'
                  : 'bg-cyber-card text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div 
            key={report.id}
            className="bg-cyber-card border border-border rounded-xl p-5 hover:border-cyber-cyan/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  report.type === 'Macau Scam' ? 'bg-cyber-red/20 text-cyber-red' :
                  report.type === 'Phishing' ? 'bg-cyber-amber/20 text-cyber-amber' :
                  report.type === 'Job Scam' ? 'bg-cyber-purple/20 text-cyber-purple' :
                  'bg-cyber-cyan/20 text-cyber-cyan'
                )}>
                  {report.type}
                </div>
                {report.verifications >= 10 && (
                  <div className="flex items-center gap-1 text-cyber-green text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(report.timestamp)}
              </div>
            </div>

            <p className="text-foreground mb-4">{report.content}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {report.location}
                </span>
                <span>by {report.reportedBy}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => verifyReport(report.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background/50 text-muted-foreground hover:text-cyber-green hover:bg-cyber-green/10 transition-colors text-sm"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{report.verifications}</span>
                </button>
                <button className="p-1.5 rounded-lg bg-background/50 text-muted-foreground hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trending Scam Types */}
      <div className="bg-cyber-card border border-border rounded-xl p-5">
        <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyber-cyan" />
          Trending This Week
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            { type: 'Macau Scam', count: 234, trend: 'up' },
            { type: 'Phishing', count: 189, trend: 'up' },
            { type: 'Job Scam', count: 156, trend: 'up' },
            { type: 'E-Commerce Fraud', count: 98, trend: 'down' },
            { type: 'Investment Scam', count: 67, trend: 'stable' },
          ].map((item) => (
            <div 
              key={item.type}
              className="flex items-center gap-2 px-3 py-2 bg-background/50 rounded-lg"
            >
              <AlertTriangle className={cn(
                'w-4 h-4',
                item.trend === 'up' ? 'text-cyber-red' :
                item.trend === 'down' ? 'text-cyber-green' : 'text-cyber-amber'
              )} />
              <span className="text-sm text-foreground">{item.type}</span>
              <span className="text-xs font-mono text-muted-foreground">({item.count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cyber-card border border-border rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-cyber-amber" />
              Report a Scam
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Scam Type</label>
                <select
                  value={newReport.type}
                  onChange={(e) => setNewReport(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-cyber-cyan"
                >
                  {scamTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Description</label>
                <textarea
                  value={newReport.content}
                  onChange={(e) => setNewReport(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Describe the scam you encountered... (phone number, message content, website, etc.)"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyber-cyan resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Location</label>
                <select
                  value={newReport.location}
                  onChange={(e) => setNewReport(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-cyber-cyan"
                >
                  <option value="">Select state...</option>
                  {['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Pahang', 'Sabah', 'Sarawak', 'Kedah', 'Kelantan', 'Terengganu', 'Melaka', 'Negeri Sembilan', 'Perlis', 'Labuan', 'Putrajaya'].map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div className="p-3 bg-cyber-amber/10 border border-cyber-amber/30 rounded-lg">
                <p className="text-xs text-cyber-amber">
                  Your report will be anonymous and help protect other Malaysians from this scam.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-3 rounded-lg bg-background border border-border text-foreground hover:bg-sidebar-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  className="flex-1 py-3 rounded-lg bg-cyber-cyan text-background font-medium hover:bg-cyber-cyan/90 transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
