import { create } from 'zustand'
import type { ScanResult } from './sample-data'

type Page = 'scan' | 'analytics' | 'threat-intel' | 'system-info' | 'network-graph' | 'live-radar' | 'family-shield' | 'voice-analyzer' | 'recovery' | 'community'

interface FamilyMember {
  id: string
  name: string
  relationship: string
  phone: string
  lastActive: Date
  scamsBlocked: number
  riskLevel: 'safe' | 'medium' | 'high'
}

interface CommunityReport {
  id: string
  type: string
  content: string
  reportedBy: string
  timestamp: Date
  verifications: number
  location: string
}

interface ScammerNode {
  id: string
  type: 'phone' | 'account' | 'domain' | 'campaign'
  value: string
  connections: string[]
  riskScore: number
}

interface DashboardState {
  currentPage: Page
  setCurrentPage: (page: Page) => void
  scanHistory: ScanResult[]
  addScanResult: (result: ScanResult) => void
  totalScanned: number
  threatsFound: number
  familyMembers: FamilyMember[]
  addFamilyMember: (member: FamilyMember) => void
  removeFamilyMember: (id: string) => void
  communityReports: CommunityReport[]
  addCommunityReport: (report: CommunityReport) => void
  verifyReport: (id: string) => void
  scammerNetwork: ScammerNode[]
  liveThreats: { lat: number; lng: number; type: string; time: Date }[]
}

export const useDashboardStore = create<DashboardState>((set) => ({
  currentPage: 'scan',
  setCurrentPage: (page) => set({ currentPage: page }),
  scanHistory: [],
  addScanResult: (result) => set((state) => ({
    scanHistory: [result, ...state.scanHistory],
    totalScanned: state.totalScanned + 1,
    threatsFound: result.verdict !== 'SAFE' ? state.threatsFound + 1 : state.threatsFound
  })),
  totalScanned: 0,
  threatsFound: 0,
  familyMembers: [
    { id: '1', name: 'Mak', relationship: 'Mother', phone: '012-XXX-4567', lastActive: new Date(), scamsBlocked: 3, riskLevel: 'safe' },
    { id: '2', name: 'Ayah', relationship: 'Father', phone: '012-XXX-7890', lastActive: new Date(Date.now() - 86400000), scamsBlocked: 1, riskLevel: 'medium' },
  ],
  addFamilyMember: (member) => set((state) => ({
    familyMembers: [...state.familyMembers, member]
  })),
  removeFamilyMember: (id) => set((state) => ({
    familyMembers: state.familyMembers.filter(m => m.id !== id)
  })),
  communityReports: [
    { id: '1', type: 'Macau Scam', content: 'Received call from 03-1234567 claiming to be from LHDN...', reportedBy: 'Anonymous', timestamp: new Date(Date.now() - 3600000), verifications: 42, location: 'Kuala Lumpur' },
    { id: '2', type: 'Phishing', content: 'maybank-secure.xyz website looks exactly like real Maybank...', reportedBy: 'User_KL', timestamp: new Date(Date.now() - 7200000), verifications: 89, location: 'Selangor' },
    { id: '3', type: 'Job Scam', content: 'WhatsApp job offer promising RM500/day for product reviews...', reportedBy: 'Concerned_Parent', timestamp: new Date(Date.now() - 10800000), verifications: 156, location: 'Penang' },
  ],
  addCommunityReport: (report) => set((state) => ({
    communityReports: [report, ...state.communityReports]
  })),
  verifyReport: (id) => set((state) => ({
    communityReports: state.communityReports.map(r => 
      r.id === id ? { ...r, verifications: r.verifications + 1 } : r
    )
  })),
  scammerNetwork: [
    { id: 'phone-1', type: 'phone', value: '012-9876543', connections: ['account-1', 'campaign-1'], riskScore: 94 },
    { id: 'phone-2', type: 'phone', value: '011-1234567', connections: ['account-2', 'campaign-1'], riskScore: 88 },
    { id: 'account-1', type: 'account', value: 'Maybank 1234567', connections: ['phone-1', 'phone-3'], riskScore: 92 },
    { id: 'account-2', type: 'account', value: 'CIMB 9876543', connections: ['phone-2', 'domain-1'], riskScore: 76 },
    { id: 'domain-1', type: 'domain', value: 'bnm-verify.xyz', connections: ['campaign-2', 'account-2'], riskScore: 97 },
    { id: 'domain-2', type: 'domain', value: 'maybnk-secure.tk', connections: ['campaign-2'], riskScore: 91 },
    { id: 'campaign-1', type: 'campaign', value: 'Macau Scam Wave Q1', connections: ['phone-1', 'phone-2', 'account-1'], riskScore: 96 },
    { id: 'campaign-2', type: 'campaign', value: 'BNM Phishing Ring', connections: ['domain-1', 'domain-2'], riskScore: 98 },
  ],
  liveThreats: [
    { lat: 3.139, lng: 101.6869, type: 'Macau Scam', time: new Date(Date.now() - 120000) },
    { lat: 3.0738, lng: 101.5183, type: 'E-Commerce Fraud', time: new Date(Date.now() - 300000) },
    { lat: 5.4164, lng: 100.3327, type: 'Phishing', time: new Date(Date.now() - 480000) },
    { lat: 1.4927, lng: 103.7414, type: 'Bank Impersonation', time: new Date(Date.now() - 600000) },
    { lat: 4.5975, lng: 103.4324, type: 'Job Scam', time: new Date(Date.now() - 900000) },
  ]
}))
