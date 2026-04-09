'use client'

import { useState } from 'react'
import { Users, UserPlus, Shield, Bell, Phone, Clock, AlertTriangle, CheckCircle, Heart, Trash2, Send } from 'lucide-react'
import { useDashboardStore } from '@/lib/dashboard-store'
import { cn } from '@/lib/utils'

export function FamilyShieldPage() {
  const { familyMembers, addFamilyMember, removeFamilyMember } = useDashboardStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', relationship: '', phone: '' })
  const [alertSent, setAlertSent] = useState<string | null>(null)

  const handleAddMember = () => {
    if (newMember.name && newMember.relationship && newMember.phone) {
      addFamilyMember({
        id: Date.now().toString(),
        name: newMember.name,
        relationship: newMember.relationship,
        phone: newMember.phone,
        lastActive: new Date(),
        scamsBlocked: 0,
        riskLevel: 'safe'
      })
      setNewMember({ name: '', relationship: '', phone: '' })
      setShowAddModal(false)
    }
  }

  const handleSendAlert = (memberId: string) => {
    setAlertSent(memberId)
    setTimeout(() => setAlertSent(null), 3000)
  }

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / 3600000)
    if (hours < 1) return 'Active now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-green/20">
              <Users className="w-6 h-6 text-cyber-green" />
            </div>
            Family Shield
          </h2>
          <p className="text-muted-foreground mt-1">
            Protect your loved ones from scams with linked monitoring
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/30 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Unique Feature Badge */}
      <div className="bg-gradient-to-r from-cyber-green/20 to-cyber-cyan/20 border border-cyber-green/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-green/30">
            <Heart className="w-5 h-5 text-cyber-green" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Protecting Malaysia&apos;s Elderly</h4>
            <p className="text-sm text-muted-foreground">
              Over 60% of scam victims in Malaysia are aged 50+. Family Shield lets you monitor 
              and protect vulnerable family members by linking their devices to your GuardAI account.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-cyber-card border border-border rounded-xl p-5 text-center">
          <div className="p-3 rounded-full bg-cyber-green/20 w-fit mx-auto mb-3">
            <Shield className="w-6 h-6 text-cyber-green" />
          </div>
          <p className="text-3xl font-mono font-bold text-cyber-green">
            {familyMembers.reduce((acc, m) => acc + m.scamsBlocked, 0)}
          </p>
          <p className="text-sm text-muted-foreground">Scams Blocked</p>
        </div>
        <div className="bg-cyber-card border border-border rounded-xl p-5 text-center">
          <div className="p-3 rounded-full bg-cyber-cyan/20 w-fit mx-auto mb-3">
            <Users className="w-6 h-6 text-cyber-cyan" />
          </div>
          <p className="text-3xl font-mono font-bold text-cyber-cyan">
            {familyMembers.length}
          </p>
          <p className="text-sm text-muted-foreground">Protected Members</p>
        </div>
        <div className="bg-cyber-card border border-border rounded-xl p-5 text-center">
          <div className="p-3 rounded-full bg-cyber-amber/20 w-fit mx-auto mb-3">
            <Bell className="w-6 h-6 text-cyber-amber" />
          </div>
          <p className="text-3xl font-mono font-bold text-cyber-amber">
            {familyMembers.filter(m => m.riskLevel !== 'safe').length}
          </p>
          <p className="text-sm text-muted-foreground">Need Attention</p>
        </div>
      </div>

      {/* Family Members Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {familyMembers.map(member => (
          <div 
            key={member.id}
            className={cn(
              'bg-cyber-card border rounded-xl p-5 transition-all',
              member.riskLevel === 'high' ? 'border-cyber-red/50 bg-cyber-red/5' :
              member.riskLevel === 'medium' ? 'border-cyber-amber/50 bg-cyber-amber/5' :
              'border-border'
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold',
                  member.riskLevel === 'high' ? 'bg-cyber-red/20 text-cyber-red' :
                  member.riskLevel === 'medium' ? 'bg-cyber-amber/20 text-cyber-amber' :
                  'bg-cyber-green/20 text-cyber-green'
                )}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.relationship}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSendAlert(member.id)}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    alertSent === member.id 
                      ? 'bg-cyber-green/20 text-cyber-green' 
                      : 'bg-background/50 text-muted-foreground hover:text-cyber-cyan hover:bg-cyber-cyan/10'
                  )}
                  title="Send scam alert"
                >
                  {alertSent === member.id ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => removeFamilyMember(member.id)}
                  className="p-2 rounded-lg bg-background/50 text-muted-foreground hover:text-cyber-red hover:bg-cyber-red/10 transition-colors"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                </div>
                <p className="text-xs font-mono text-foreground">{member.phone}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                </div>
                <p className="text-xs font-mono text-foreground">{formatTimeAgo(member.lastActive)}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Shield className="w-3 h-3 text-cyber-green" />
                </div>
                <p className="text-xs font-mono text-cyber-green">{member.scamsBlocked} blocked</p>
              </div>
            </div>

            {/* Risk Level Indicator */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
              <span className="text-sm text-muted-foreground">Protection Status</span>
              <div className={cn(
                'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
                member.riskLevel === 'high' ? 'bg-cyber-red/20 text-cyber-red' :
                member.riskLevel === 'medium' ? 'bg-cyber-amber/20 text-cyber-amber' :
                'bg-cyber-green/20 text-cyber-green'
              )}>
                {member.riskLevel === 'safe' ? (
                  <><CheckCircle className="w-3 h-3" /> Protected</>
                ) : (
                  <><AlertTriangle className="w-3 h-3" /> {member.riskLevel === 'high' ? 'At Risk' : 'Caution'}</>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Add New Member Card */}
        <button
          onClick={() => setShowAddModal(true)}
          className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5 transition-all"
        >
          <div className="p-4 rounded-full bg-cyber-card">
            <UserPlus className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Add Family Member</p>
        </button>
      </div>

      {/* How It Works */}
      <div className="bg-cyber-card border border-border rounded-xl p-6">
        <h4 className="font-semibold text-foreground mb-4">How Family Shield Works</h4>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyber-cyan/20 text-cyber-cyan">
              <span className="font-mono font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Link Device</p>
              <p className="text-sm text-muted-foreground">Add family member&apos;s phone to your protection network</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyber-cyan/20 text-cyber-cyan">
              <span className="font-mono font-bold">2</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Auto-Scan</p>
              <p className="text-sm text-muted-foreground">Incoming SMS/WhatsApp are automatically analyzed</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyber-cyan/20 text-cyber-cyan">
              <span className="font-mono font-bold">3</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Alert Both</p>
              <p className="text-sm text-muted-foreground">Both you and your family member get warned instantly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cyber-card border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add Family Member</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Name</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Mak, Nenek"
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyber-cyan"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Relationship</label>
                <input
                  type="text"
                  value={newMember.relationship}
                  onChange={(e) => setNewMember(prev => ({ ...prev, relationship: e.target.value }))}
                  placeholder="e.g., Mother, Grandmother"
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyber-cyan"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newMember.phone}
                  onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g., 012-XXX-XXXX"
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyber-cyan"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-lg bg-background border border-border text-foreground hover:bg-sidebar-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  className="flex-1 py-3 rounded-lg bg-cyber-cyan text-background font-medium hover:bg-cyber-cyan/90 transition-colors"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
