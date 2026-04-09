'use client'

import { useState } from 'react'
import { LifeBuoy, CheckCircle, Circle, Phone, Building2, FileText, Clock, AlertTriangle, ExternalLink, ChevronRight, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecoveryStep {
  id: number
  title: string
  description: string
  actions: string[]
  contacts?: { name: string; number: string; hours?: string }[]
  completed: boolean
}

const INITIAL_STEPS: RecoveryStep[] = [
  {
    id: 1,
    title: 'Stop All Communication',
    description: 'Immediately cease all contact with the scammer. Do not respond to calls, messages, or emails.',
    actions: [
      'Block the scammer\'s phone number',
      'Do not click any links they sent',
      'Do not provide any more personal information',
      'Screenshot all evidence before blocking'
    ],
    completed: false
  },
  {
    id: 2,
    title: 'Contact Your Bank Immediately',
    description: 'If you have transferred money or shared banking details, contact your bank\'s fraud department right away.',
    actions: [
      'Call your bank\'s 24-hour fraud hotline',
      'Request to freeze suspicious transactions',
      'Change your online banking password',
      'Request new debit/credit cards if compromised'
    ],
    contacts: [
      { name: 'Maybank', number: '1-300-88-6688', hours: '24/7' },
      { name: 'CIMB', number: '03-6204 7788', hours: '24/7' },
      { name: 'Public Bank', number: '03-2176 8000', hours: '24/7' },
      { name: 'RHB', number: '03-9206 8118', hours: '24/7' },
    ],
    completed: false
  },
  {
    id: 3,
    title: 'Lodge a Police Report',
    description: 'File an official police report at your nearest police station or online through the PDRM portal.',
    actions: [
      'Gather all evidence (screenshots, call logs, bank statements)',
      'Visit nearest police station or file online',
      'Get a copy of the police report for reference',
      'Note down the investigation officer\'s contact'
    ],
    contacts: [
      { name: 'PDRM Emergency', number: '999' },
      { name: 'CCID Scam Hotline', number: '03-2610 1559' },
      { name: 'Online Report Portal', number: 'report.rmp.gov.my' },
    ],
    completed: false
  },
  {
    id: 4,
    title: 'Report to Bank Negara BNMLINK',
    description: 'Lodge a complaint with Bank Negara Malaysia for financial fraud cases.',
    actions: [
      'Call BNMLINK or visit their portal',
      'Provide police report reference number',
      'Submit all transaction evidence',
      'Request fraud investigation assistance'
    ],
    contacts: [
      { name: 'BNMLINK', number: '1-300-88-5465', hours: 'Mon-Fri 9am-5pm' },
      { name: 'BNM Portal', number: 'bnm.gov.my/consumer' },
    ],
    completed: false
  },
  {
    id: 5,
    title: 'Report to MCMC',
    description: 'For online scams, phishing, or telecom fraud, report to the Malaysian Communications and Multimedia Commission.',
    actions: [
      'Report suspicious phone numbers',
      'Report phishing websites',
      'Submit evidence of SMS/messaging scams',
      'Request number blocking investigation'
    ],
    contacts: [
      { name: 'MCMC Hotline', number: '1-800-188-030' },
      { name: 'MCMC Portal', number: 'aduan.mcmc.gov.my' },
    ],
    completed: false
  },
  {
    id: 6,
    title: 'Secure Your Accounts',
    description: 'Change passwords and enable additional security on all potentially compromised accounts.',
    actions: [
      'Change passwords for all financial accounts',
      'Enable Two-Factor Authentication (2FA)',
      'Review account activity for unauthorized access',
      'Update security questions and recovery emails'
    ],
    completed: false
  },
  {
    id: 7,
    title: 'Monitor & Document',
    description: 'Keep monitoring your accounts and documenting any further suspicious activity for your case.',
    actions: [
      'Check bank statements regularly',
      'Monitor credit report for unusual activity',
      'Keep all case reference numbers organized',
      'Follow up with authorities periodically'
    ],
    completed: false
  }
]

export function RecoveryPage() {
  const [steps, setSteps] = useState(INITIAL_STEPS)
  const [expandedStep, setExpandedStep] = useState<number | null>(1)
  const [lossAmount, setLossAmount] = useState('')

  const toggleStep = (id: number) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, completed: !step.completed } : step
    ))
  }

  const completedCount = steps.filter(s => s.completed).length
  const progress = (completedCount / steps.length) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-amber/20">
              <LifeBuoy className="w-6 h-6 text-cyber-amber" />
            </div>
            Scam Recovery Assistant
          </h2>
          <p className="text-muted-foreground mt-1">
            Step-by-step guide to recover from a scam incident
          </p>
        </div>
      </div>

      {/* Unique Feature Badge */}
      <div className="bg-gradient-to-r from-cyber-amber/20 to-cyber-green/20 border border-cyber-amber/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-amber/30">
            <Shield className="w-5 h-5 text-cyber-amber" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Malaysia&apos;s First AI Recovery Guide</h4>
            <p className="text-sm text-muted-foreground">
              GuardAI provides a comprehensive step-by-step recovery guide tailored for Malaysian 
              scam victims, with direct contacts to PDRM, BNM, MCMC, and major banks.
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="bg-cyber-red/10 border border-cyber-red/30 rounded-xl p-4 flex items-center gap-4">
        <AlertTriangle className="w-8 h-8 text-cyber-red flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-foreground">Lost money to a scam?</p>
          <p className="text-sm text-muted-foreground">Time is critical. Contact your bank immediately - some transactions can be reversed within 24-48 hours.</p>
        </div>
        <a 
          href="tel:999" 
          className="px-4 py-2 bg-cyber-red text-white rounded-lg font-medium hover:bg-cyber-red/90 transition-colors flex items-center gap-2"
        >
          <Phone className="w-4 h-4" />
          999
        </a>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Progress Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Loss Calculator */}
          <div className="bg-cyber-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-3">Loss Estimate</h4>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">RM</span>
              <input
                type="number"
                value={lossAmount}
                onChange={(e) => setLossAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-background border border-border text-foreground font-mono text-lg placeholder:text-muted-foreground focus:outline-none focus:border-cyber-cyan"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Enter the amount lost for tracking purposes
            </p>
          </div>

          {/* Progress Tracker */}
          <div className="bg-cyber-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-3">Recovery Progress</h4>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Steps Completed</span>
                <span className="font-mono text-cyber-cyan">{completedCount}/{steps.length}</span>
              </div>
              <div className="h-3 bg-background rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-green rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {completedCount === steps.length ? (
              <div className="flex items-center gap-2 p-3 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-cyber-green" />
                <span className="text-sm text-cyber-green font-medium">All steps completed!</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete all steps to maximize your chances of recovery
              </p>
            )}
          </div>

          {/* Quick Contacts */}
          <div className="bg-cyber-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-3">Emergency Contacts</h4>
            <div className="space-y-2">
              <a href="tel:999" className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-cyber-red/10 transition-colors group">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-cyber-red" />
                  <span className="text-sm text-foreground">PDRM Emergency</span>
                </div>
                <span className="text-sm font-mono text-cyber-red group-hover:underline">999</span>
              </a>
              <a href="tel:0326101559" className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-cyber-cyan/10 transition-colors group">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyber-cyan" />
                  <span className="text-sm text-foreground">CCID Scam Line</span>
                </div>
                <span className="text-sm font-mono text-cyber-cyan group-hover:underline">03-2610 1559</span>
              </a>
              <a href="tel:1800188030" className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-cyber-purple/10 transition-colors group">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyber-purple" />
                  <span className="text-sm text-foreground">MCMC Hotline</span>
                </div>
                <span className="text-sm font-mono text-cyber-purple group-hover:underline">1-800-188-030</span>
              </a>
            </div>
          </div>
        </div>

        {/* Steps List */}
        <div className="lg:col-span-2 space-y-3">
          {steps.map((step) => {
            const isExpanded = expandedStep === step.id
            return (
              <div 
                key={step.id}
                className={cn(
                  'border rounded-xl transition-all',
                  step.completed ? 'bg-cyber-green/5 border-cyber-green/30' : 'bg-cyber-card border-border'
                )}
              >
                <div className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => toggleStep(step.id)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      step.completed 
                        ? 'bg-cyber-green border-cyber-green' 
                        : 'border-muted-foreground hover:border-cyber-cyan'
                    )}
                  >
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-sm font-mono text-muted-foreground">{step.id}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                    className="flex-1 text-left"
                  >
                    <h4 className={cn(
                      'font-semibold',
                      step.completed ? 'text-cyber-green' : 'text-foreground'
                    )}>
                      {step.title}
                    </h4>
                    {!isExpanded && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{step.description}</p>
                    )}
                  </button>
                  <button
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                    className="p-1"
                  >
                    <ChevronRight className={cn(
                      'w-5 h-5 text-muted-foreground transition-transform',
                      isExpanded && 'rotate-90'
                    )} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pl-16 space-y-4">
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Actions</p>
                      <ul className="space-y-2">
                        {step.actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <Circle className="w-1.5 h-1.5 mt-2 text-cyber-cyan flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {step.contacts && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Contacts</p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {step.contacts.map((contact, i) => (
                            <a
                              key={i}
                              href={contact.number.includes('.') ? `https://${contact.number}` : `tel:${contact.number.replace(/[^0-9]/g, '')}`}
                              className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-cyber-cyan/10 transition-colors group"
                            >
                              <div>
                                <p className="text-sm font-medium text-foreground">{contact.name}</p>
                                {contact.hours && (
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {contact.hours}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm font-mono text-cyber-cyan group-hover:underline flex items-center gap-1">
                                {contact.number}
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => toggleStep(step.id)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        step.completed 
                          ? 'bg-cyber-green/20 text-cyber-green hover:bg-cyber-green/30' 
                          : 'bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30'
                      )}
                    >
                      {step.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
