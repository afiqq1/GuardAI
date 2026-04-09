'use client'

import { useEffect, useState } from 'react'
import { Flag, Ban, Share2, Brain, Zap, Heart, ExternalLink, Phone, FileText, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScanResult } from '@/lib/sample-data'

interface ScanResultDisplayProps {
  result: ScanResult
  onClear: () => void
}

const verdictConfig = {
  HIGH_RISK: {
    emoji: '🚨',
    label: 'HIGH RISK',
    bgColor: 'bg-cyber-red/10',
    borderColor: 'border-cyber-red',
    textColor: 'text-cyber-red',
    glowClass: 'glow-red',
    ringColor: '#ff4060'
  },
  SUSPICIOUS: {
    emoji: '⚠️',
    label: 'SUSPICIOUS',
    bgColor: 'bg-cyber-amber/10',
    borderColor: 'border-cyber-amber',
    textColor: 'text-cyber-amber',
    glowClass: 'glow-amber',
    ringColor: '#ffaa00'
  },
  SAFE: {
    emoji: '✅',
    label: 'SAFE',
    bgColor: 'bg-cyber-green/10',
    borderColor: 'border-cyber-green',
    textColor: 'text-cyber-green',
    glowClass: 'glow-green',
    ringColor: '#00e67a'
  }
}

const componentScores = [
  { key: 'nlp' as const, label: 'NLP Classifier', color: '#9d78ff' },
  { key: 'url' as const, label: 'URL Risk Scorer', color: '#00d4ff' },
  { key: 'pattern' as const, label: 'Pattern Matcher', color: '#ffaa00' },
  { key: 'context' as const, label: 'Malaysian Context Engine', color: '#00e67a' }
]

// Helper function to check if text contains a URL
function containsUrl(text: string): boolean {
  const urlPattern = /https?:\/\/|www\.|bit\.ly|tinyurl|goo\.gl|\.com\/|\.net\/|\.org\//i
  return urlPattern.test(text)
}

// Psychological manipulation tactics
const manipulationTactics = [
  { id: 'authority', label: 'Authority Impersonation', icon: '👮', description: 'Claims to be from government/police/bank' },
  { id: 'urgency', label: 'False Urgency', icon: '⏰', description: 'Creates artificial time pressure' },
  { id: 'fear', label: 'Fear Tactics', icon: '😨', description: 'Threatens arrest, fines, or loss' },
  { id: 'greed', label: 'Greed Appeal', icon: '💰', description: 'Promises unrealistic rewards' },
  { id: 'trust', label: 'Trust Exploitation', icon: '🤝', description: 'Mimics known brands/people' },
  { id: 'isolation', label: 'Isolation Pressure', icon: '🔒', description: 'Discourages verification with others' },
]

// ============================================
// ENHANCED SCAM TYPE DETECTION (Works for ALL tabs - SMS, Email, URL, Screenshot)
// ============================================

function detectScamType(text: string, keywords: { high: string[]; medium: string[]; low: string[] }): { 
  type: string; 
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  indicators: string[];
} {
  const lowerText = text.toLowerCase()
  
  // ============================================
  // 1. URL PHISHING DETECTIONS (For URL tab and URLs in any content)
  // ============================================
  
  // Suspicious TLD URLs (.tk, .xyz, .top, .icu, etc.)
  if (/\.(tk|xyz|top|ml|ga|cf|icu|pw|online|site|club|click|download|stream|gq|bid|review|loan|date|win|men|work|rest|trade|science|party|racing|accountant|website|space|tech|host|press|solutions|services|support|systems|training|video|wiki|zone)/i.test(lowerText) &&
      /(paypal|bank|login|secure|verify|confirm|account|update|verify|maybank|cimb|public|rhb|bnm|shopee|lazada|grab|tng|amazon|netflix|apple|microsoft|google|facebook|instagram|whatsapp)/i.test(lowerText)) {
    return {
      type: '🌐 Phishing URL (Suspicious TLD)',
      confidence: 'HIGH',
      explanation: 'URL uses a suspicious top-level domain commonly associated with phishing attacks',
      indicators: ['Suspicious domain extension', 'Brand impersonation in URL', 'Fake login page', 'Deceptive link']
    }
  }
  
  // IP Address URL
  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(lowerText) &&
      /(paypal|bank|login|secure|verify|confirm|account|update|maybank|cimb|public|rhb)/i.test(lowerText)) {
    return {
      type: '🖥️ IP Address Phishing URL',
      confidence: 'HIGH',
      explanation: 'URL uses an IP address instead of a domain name, often used in phishing attacks to bypass domain filters',
      indicators: ['IP address instead of domain', 'Brand name in path', 'Fake login page', 'Direct server access']
    }
  }
  
  // Shortened URL (bit.ly, tinyurl, goo.gl, etc.)
  if (/bit\.ly|tinyurl|goo\.gl|ow\.ly|short\.link|rebrand\.ly|is\.gd|buff\.ly|clicky\.link|short\.link|tiny\.cc|shorte\.st|adf\.ly|bc\.vc|t\.co|fb\.me|qr\.co|rb\.gy|soo\.gd|u\.to|v\.gd|x\.co|y\.t|zip\.ly|cur\.lv|alt\.url|snip\.ly/i.test(lowerText)) {
    return {
      type: '🔗 Suspicious Shortened URL',
      confidence: 'MEDIUM',
      explanation: 'Shortened URL that could hide a malicious destination. The final destination is unknown.',
      indicators: ['URL shortener service', 'Destination hidden', 'Potential redirect to phishing site', 'Cannot preview link']
    }
  }
  
  // Typosquatting / Misspelled Domain
  if (/paypa1|paypaI|paypaI\.|paypa1\.|rnaybank|rnaybank2u|rnaybank2u\.|faceb00k|facebo0k|faceboook|twittter|twitteer|instagrarn|instagraam|whatsappp|whatsappp\.|te1egram|teIegram/i.test(lowerText)) {
    return {
      type: '🔀 Typosquatting Domain',
      confidence: 'HIGH',
      explanation: 'Domain name uses misspelling of legitimate brand to trick users',
      indicators: ['Misspelled brand name', 'Character substitution (0 for O, 1 for l)', 'Lookalike domain', 'Brand impersonation']
    }
  }
  
  // ============================================
  // 2. EMAIL PHISHING DETECTIONS (For Email tab)
  // ============================================
  
  // Netflix Phishing
  if (/netflix.*?(verify|update|payment|expired|membership|account|billing|subscription)/i.test(lowerText) &&
      (/\.(xyz|top|tk|ml|ga|cf|icu|pw|online|site|club)/i.test(lowerText) || /verify|update|payment|expired|suspended|locked/i.test(lowerText))) {
    return {
      type: '🎬 Netflix Phishing',
      confidence: 'HIGH',
      explanation: 'Fake Netflix email attempting to steal payment information or login credentials',
      indicators: ['Netflix brand impersonation', 'Fake payment update request', 'Suspicious link', 'Account expiration threat']
    }
  }
  
  // PayPal Phishing
  if (/paypal.*?(verify|confirm|limited|restrict|account|login|security|alert|dispute|unauthorized)/i.test(lowerText) &&
      (/\.(xyz|top|tk|ml|ga|cf|icu|pw)/i.test(lowerText) || /confirm|verify|limited|restricted|unauthorized/i.test(lowerText))) {
    return {
      type: '💳 PayPal Phishing',
      confidence: 'HIGH',
      explanation: 'Fake PayPal email attempting to steal account credentials',
      indicators: ['PayPal brand impersonation', 'Account limitation threat', 'Fake verification link', 'Urgent action required']
    }
  }
  
  // Apple ID Phishing
  if (/apple.*?(verify|locked|suspended|id|account|security|icloud|itunes)/i.test(lowerText) &&
      (/\.(xyz|top|tk|ml|ga|cf|icu|pw)/i.test(lowerText) || /verify|locked|suspended|security alert/i.test(lowerText))) {
    return {
      type: '🍎 Apple ID Phishing',
      confidence: 'HIGH',
      explanation: 'Fake Apple email attempting to steal Apple ID credentials',
      indicators: ['Apple brand impersonation', 'Account locked threat', 'Fake verification link', 'iCloud scam']
    }
  }
  
  // Amazon Phishing
  if (/amazon.*?(order|account|verify|confirm|payment|prime|subscription|delivery|package)/i.test(lowerText) &&
      (/\.(xyz|top|tk|ml|ga|cf|icu|pw)/i.test(lowerText) || /verify|confirm|cancel|order|suspended|delivery/i.test(lowerText))) {
    return {
      type: '📦 Amazon Phishing',
      confidence: 'HIGH',
      explanation: 'Fake Amazon email attempting to steal account or payment information',
      indicators: ['Amazon brand impersonation', 'Fake order confirmation', 'Suspicious tracking link', 'Cancel order scam']
    }
  }
  
  // Microsoft / Outlook Phishing
  if (/microsoft|outlook|hotmail|msn|office365|teams|onedrive/i.test(lowerText) &&
      /(verify|compromised|security|account|locked|password|alert|suspended)/i.test(lowerText) &&
      (/\.(xyz|top|tk|ml|ga|cf|icu|pw)/i.test(lowerText) || /verify|compromised|security|password reset|alert/i.test(lowerText))) {
    return {
      type: '🪟 Microsoft Phishing',
      confidence: 'HIGH',
      explanation: 'Fake Microsoft email attempting to steal account credentials',
      indicators: ['Microsoft brand impersonation', 'Account compromised threat', 'Fake verification link', 'Password reset scam']
    }
  }
  
  // Google / Gmail Phishing
  if (/google|gmail|youtube|drive|docs|photos|calendar|meet/i.test(lowerText) &&
      /(verify|security|account|suspended|password|alert|recovery)/i.test(lowerText) &&
      (/\.(xyz|top|tk|ml|ga|cf|icu|pw)/i.test(lowerText) || /verify|security alert|suspended|password|recovery/i.test(lowerText))) {
    return {
      type: '🔐 Google Phishing',
      confidence: 'HIGH',
      explanation: 'Fake Google email attempting to steal Gmail or Google account credentials',
      indicators: ['Google brand impersonation', 'Security alert scam', 'Fake verification link', 'Account recovery scam']
    }
  }
  
  // Facebook / Instagram Phishing
  if (/facebook|fb|instagram|ig|meta|threads|whatsapp/i.test(lowerText) &&
      /(verify|security|account|suspended|login|alert|hacked)/i.test(lowerText) &&
      (/\.(xyz|top|tk|ml|ga|cf|icu|pw)/i.test(lowerText) || /verify|security|suspended|login alert|hacked/i.test(lowerText))) {
    return {
      type: '📘 Social Media Phishing',
      confidence: 'HIGH',
      explanation: 'Fake Facebook/Instagram email attempting to steal social media credentials',
      indicators: ['Social media brand impersonation', 'Security alert scam', 'Fake verification link', 'Account recovery scam']
    }
  }
  
  // LinkedIn Phishing
  if (/linkedin.*?(verify|security|account|profile|connection|message|job|recruiter)/i.test(lowerText) &&
      (/\.(xyz|top|tk|ml|ga|cf|icu|pw)/i.test(lowerText) || /verify|security|profile view|connection request|job offer/i.test(lowerText))) {
    return {
      type: '💼 LinkedIn Phishing',
      confidence: 'HIGH',
      explanation: 'Fake LinkedIn email attempting to steal professional account credentials',
      indicators: ['LinkedIn brand impersonation', 'Fake profile view notification', 'Connection request scam', 'Account verification scam']
    }
  }
  
  // ============================================
  // 3. MALAYSIAN SCAM DETECTIONS (For SMS/WhatsApp/Email)
  // ============================================
  
  // Macau Scam (PDRM/Police impersonation)
  if (/pdrm|polis|bantuan|mahkamah|arrested|ditangkap|inspektor|bukit aman|ccid|police|inspector|police report|warrant|ic number/i.test(lowerText) &&
      (/account frozen|akaun dibekukan|money laundering|pengubahan wang haram|legal action|tindakan undang-undang|warrant|arrest|investigation|suspect/i.test(lowerText))) {
    return {
      type: '👮 Macau Scam (PDRM Impersonation)',
      confidence: 'HIGH',
      explanation: 'Impersonates PDRM or court officials, threatens legal action, demands money transfer to "safe account"',
      indicators: ['Police impersonation', 'Legal threats', 'Money laundering claims', 'Urgent call to action', '"Safe account" request']
    }
  }
  
  // Bank Negara Malaysia (BNM) Scam
  if (/bank negara|bnm|bank negara malaysia/i.test(lowerText) &&
      (/verify|confirm|update|account suspended|dibekukan|security alert|account freezing|flagged for suspicious|fraud department|compromised/i.test(lowerText))) {
    return {
      type: '🏦 Bank Negara Scam',
      confidence: 'HIGH',
      explanation: 'Impersonates Bank Negara Malaysia to create false urgency about account issues',
      indicators: ['BNM impersonation', 'Account freezing threat', 'Fake fraud alert', 'Urgent verification required']
    }
  }
  
  // Maybank Scam
  if (/maybank|maybank2u|m2u|maybank2u\.com/i.test(lowerText) &&
      (/suspended|locked|verify|confirm|update|security alert|account alert|unauthorized|fraud/i.test(lowerText))) {
    return {
      type: '🏦 Maybank Impersonation',
      confidence: 'HIGH',
      explanation: 'Impersonates Maybank to steal online banking credentials',
      indicators: ['Maybank brand spoofing', 'Account suspension threat', 'Fake verification link', 'Phishing login page']
    }
  }
  
  // CIMB Scam
  if (/cimb|cimb clicks|cimb bank|cimb\.com/i.test(lowerText) &&
      (/suspended|locked|verify|confirm|unauthorized|deducted|alert|fraud|security/i.test(lowerText))) {
    return {
      type: '🏦 CIMB Impersonation',
      confidence: 'HIGH',
      explanation: 'Impersonates CIMB Bank to steal online banking credentials',
      indicators: ['CIMB brand spoofing', 'Unauthorized transaction alert', 'Account suspension threat', 'Phishing link']
    }
  }
  
  // Public Bank Scam
  if (/public bank|pb bank|pbb|public bank berhad|pb engage|pbe/i.test(lowerText) &&
      (/suspended|locked|verify|confirm|security alert|account alert|unauthorized/i.test(lowerText))) {
    return {
      type: '🏦 Public Bank Impersonation',
      confidence: 'HIGH',
      explanation: 'Impersonates Public Bank to steal online banking credentials',
      indicators: ['Public Bank brand spoofing', 'Account alert', 'Verification request', 'Phishing attempt']
    }
  }
  
  // RHB Scam
  if (/rhb|rhb bank|rhb now|rhb banking/i.test(lowerText) &&
      (/suspended|locked|verify|confirm|security alert|account alert|unauthorized/i.test(lowerText))) {
    return {
      type: '🏦 RHB Impersonation',
      confidence: 'HIGH',
      explanation: 'Impersonates RHB Bank to steal online banking credentials',
      indicators: ['RHB brand spoofing', 'Account alert', 'Verification request', 'Phishing attempt']
    }
  }
  
  // ============================================
  // 4. E-COMMERCE FRAUD DETECTIONS (For SMS/WhatsApp/Email)
  // ============================================
  
  // Shopee Fraud
  if (/shopee/i.test(lowerText) &&
      (/winner|menang|hadiah|prize|free|percuma|giveaway|lucky draw|grand prize|raffle|sweepstakes|reward|gift/i.test(lowerText))) {
    return {
      type: '🛍️ Shopee Fraud (Fake Prize)',
      confidence: 'HIGH',
      explanation: 'Fake prize winnings from Shopee requiring upfront payment or personal information',
      indicators: ['Shopee brand impersonation', 'Fake contest win', 'Processing fee request', 'Limited time claim', 'Too good to be true']
    }
  }
  
  // Lazada Fraud
  if (/lazada/i.test(lowerText) &&
      (/winner|menang|hadiah|prize|free|percuma|giveaway|lucky draw|grand prize|raffle|sweepstakes/i.test(lowerText))) {
    return {
      type: '🛍️ Lazada Fraud (Fake Prize)',
      confidence: 'HIGH',
      explanation: 'Fake prize winnings from Lazada requiring upfront payment or personal information',
      indicators: ['Lazada brand impersonation', 'Fake contest win', 'Processing fee request', 'Limited time claim']
    }
  }
  
  // Touch 'n Go (TNG) Scam
  if (/touch n go|tng|touchngo|tng ewallet|tng digital/i.test(lowerText) &&
      (/locked|suspended|verify|update|security|alert|frozen|fraud|unauthorized/i.test(lowerText))) {
    return {
      type: '💳 Touch \'n Go Scam',
      confidence: 'HIGH',
      explanation: 'Fake Touch \'n Go eWallet alert attempting to steal account access',
      indicators: ['TNG brand impersonation', 'Wallet locked threat', 'Fake verification link', 'Security alert scam']
    }
  }
  
  // GrabPay Scam
  if (/grab|grabpay|grab pay|grab driver|grab rider/i.test(lowerText) &&
      (/locked|suspended|verify|update|security|alert|suspicious login|unauthorized|fraud/i.test(lowerText))) {
    return {
      type: '🚗 GrabPay Scam',
      confidence: 'HIGH',
      explanation: 'Fake GrabPay alert attempting to steal eWallet credentials',
      indicators: ['Grab brand impersonation', 'Suspicious login alert', 'Account verification scam', 'Fake security alert']
    }
  }
  
  // ============================================
  // 5. OTHER SCAM DETECTIONS (For all tabs)
  // ============================================
  
  // Parcel / Customs Scam
  if (/parcel|pos|kastam|customs|dhl|fedex|poslaju|shipment|bungkusan|pakej|delivery|courier|jnt|ninja van/i.test(lowerText) &&
      (/duty|duti|payment|bayar|on hold|ditahan|release fee|customs fee|clearing fee|processing fee|admin fee/i.test(lowerText))) {
    return {
      type: '📦 Parcel / Customs Scam',
      confidence: 'HIGH',
      explanation: 'Claims package is stuck at customs requiring payment for release',
      indicators: ['Fake customs hold', 'Urgent payment required', 'Tracking number spoofing', 'Small fee request', 'Delivery notification scam']
    }
  }
  
  // LHDN / Tax Refund Scam
  if (/lhdn|hasil|tax refund|income tax|refund cukai|hasil negeri|inland revenue|irs/i.test(lowerText) &&
      (/refund|pending|update|verify|bank info|payment|transfer|overpayment|credit/i.test(lowerText))) {
    return {
      type: '💰 LHDN Tax Refund Scam',
      confidence: 'HIGH',
      explanation: 'Fake tax refund notification attempting to steal bank information',
      indicators: ['LHDN impersonation', 'Tax refund lure', 'Bank info request', 'Urgent update required', 'Too good to be true']
    }
  }
  
  // Job Scam
  if (/kerja|part time|kerja kosong|job vacancy|work from home|wfh|side hustle|data entry|online job|freelance|remote job/i.test(lowerText) &&
      (/bayaran tinggi|high salary|rm\d{3}|daily payment|komisen|commission|easy money|rich fast|income opportunity|financial freedom/i.test(lowerText))) {
    return {
      type: '💼 Job Scam',
      confidence: 'MEDIUM',
      explanation: 'Fake job offers promising high pay for minimal work, often leads to money laundering or fee payment',
      indicators: ['Unrealistic salary', 'No interview required', 'Upfront payment request', 'Vague job description', '"Easy money" promises']
    }
  }
  
  // Investment / Crypto Scam
  if (/pelaburan|investasi|double|gandakan|return|profit|guaranteed|jamin pulangan|pakej pelaburan|investment opportunity/i.test(lowerText) &&
      (/cryptocurrency|forex|saham|stock|trading|bitcoin|ethereum|usdt|investment opportunity|crypto|blockchain|mining/i.test(lowerText))) {
    return {
      type: '📈 Investment / Crypto Scam',
      confidence: 'MEDIUM',
      explanation: 'Promises unrealistic returns with "guaranteed" profits, often pyramid schemes or fake trading platforms',
      indicators: ['Guaranteed returns', 'Get rich quick', 'Limited slots', 'Celebrity endorsement claims', '"Too good to be true"']
    }
  }
  
  // Romance / Love Scam
  if (/sayang|love|dear|sweetie|baby|rindu|miss you|cinta|darling|honey|my love|babe/i.test(lowerText) &&
      (/money|wang|transfer|help|bantuan|emergency|kecemasan|gift|hadiah|bitcoin|crypto|western union|remittance|funds/i.test(lowerText))) {
    return {
      type: '💔 Romance / Love Scam',
      confidence: 'MEDIUM',
      explanation: 'Builds fake emotional connection to eventually request money for emergencies',
      indicators: ['Rapid emotional attachment', 'Foreign location claims', 'Emergency money request', 'Unable to meet in person', 'Military/doctor persona']
    }
  }
  
  // Fake Invoice / Bill Scam
  if (/invoice|bill|statement|receipt|purchase order|order confirmation|subscription renewal/i.test(lowerText) &&
      (/payment|transfer|due|overdue|outstanding|settlement|collection|immediate payment/i.test(lowerText)) &&
      (/\.(xyz|top|tk|ml|ga|cf|icu|pw)/i.test(lowerText) || /click here|download|view invoice|open attachment/i.test(lowerText))) {
    return {
      type: '📄 Fake Invoice Scam',
      confidence: 'HIGH',
      explanation: 'Fake invoice or bill demanding payment for services not rendered',
      indicators: ['Fake invoice', 'Urgent payment request', 'Suspicious attachment', 'Unknown vendor', 'Overdue threat']
    }
  }
  
  // Tech Support Scam
  if (/tech support|microsoft support|apple support|virus detected|computer infected|security warning|malware alert|pc infected|device compromised/i.test(lowerText) &&
      (/call now|contact support|toll-free|1-800|remote access|install software|download tool|fix now/i.test(lowerText))) {
    return {
      type: '🖥️ Tech Support Scam',
      confidence: 'HIGH',
      explanation: 'Fake tech support warning to trick users into calling scammers for remote access',
      indicators: ['Fake virus alert', 'Urgent call to action', 'Toll-free number', 'Remote access request', 'Payment for "support"']
    }
  }
  
  // Lottery / Sweepstakes Scam
  if (/lottery|sweepstakes|powerball|megamillion|euro million|international lottery|uk lottery|canadian lottery|australian lottery/i.test(lowerText) &&
      (/winner|won|prize|congratulations|claim|jackpot|payout|winnings|selected|qualified/i.test(lowerText))) {
    return {
      type: '🎰 Lottery / Sweepstakes Scam',
      confidence: 'HIGH',
      explanation: 'Fake lottery win notification requiring fees to claim non-existent prize',
      indicators: ['Foreign lottery', 'Unexpected win', 'Processing fee request', 'Tax payment required', 'Too good to be true']
    }
  }
  
  // Charity / Donation Scam
  if (/donation|charity|fundraiser|help victims|emergency fund|relief fund|natural disaster|gofundme|donate now/i.test(lowerText) &&
      (/urgent|immediate|transfer|send money|bitcoin|crypto|donate now|paypal|credit card|bank transfer/i.test(lowerText))) {
    return {
      type: '🤝 Charity / Donation Scam',
      confidence: 'MEDIUM',
      explanation: 'Fake charity soliciting donations for fake emergencies or causes',
      indicators: ['Emotional appeal', 'Urgent request', 'Fake charity name', 'Cryptocurrency payment', 'No registration info']
    }
  }
  
  // Credential Harvesting (Generic)
  if (/(verify your account|confirm your identity|update your information|security verification|account verification|identity verification)/i.test(lowerText) &&
      /(click here|login|sign in|enter password|credentials|username|password|ssn|ic number|kad pengenalan|bank account)/i.test(lowerText) &&
      /https?:\/\//i.test(lowerText)) {
    return {
      type: '🔐 Credential Harvesting',
      confidence: 'HIGH',
      explanation: 'Attempt to steal login credentials through fake verification page',
      indicators: ['Verification request', 'Login page link', 'Password request', 'Identity confirmation', 'Urgent action']
    }
  }
  
  // Fake Bank Alert (Generic)
  if (/(security alert|fraud alert|suspicious activity|unauthorized transaction|account alert|bank alert)/i.test(lowerText) &&
      /(verify|confirm|update|click here|login|secure your account)/i.test(lowerText) &&
      /https?:\/\//i.test(lowerText)) {
    return {
      type: '⚠️ Fake Bank Alert',
      confidence: 'HIGH',
      explanation: 'Fake bank security alert attempting to steal banking credentials',
      indicators: ['Bank security alert', 'Fake fraud notification', 'Verification request', 'Phishing link']
    }
  }
  
  // ============================================
  // 6. SMS-SPECIFIC SCAMS
  // ============================================
  
  // SMS Spam (Generic)
  if (/free|win|won|prize|congratulations|sms|txt|text|reply|send|stop|unsubscribe/i.test(lowerText) &&
      /(credit|loan|money|cash|reward|gift|offer|promo)/i.test(lowerText) &&
      !/meeting|appointment|reminder/i.test(lowerText)) {
    return {
      type: '📱 SMS Spam',
      confidence: 'MEDIUM',
      explanation: 'Unsolicited SMS message offering prizes, loans, or rewards',
      indicators: ['Unsolicited message', 'Prize/offer lure', 'Reply to claim', 'Too good to be true']
    }
  }
  
  // ============================================
  // 7. DEFAULT - Check for remaining suspicious patterns
  // ============================================
  
  // Check for suspicious URL without specific pattern
  if (/\.(xyz|top|tk|ml|ga|cf|icu|pw|online|site|club|click|download|stream|gq|bid|review|loan|date|win|men|work|rest|trade|science|party|racing|accountant|website|space|tech|host|press|solutions|services|support|systems|training|video|wiki|zone)/i.test(lowerText)) {
    return {
      type: '⚠️ Suspicious URL',
      confidence: 'MEDIUM',
      explanation: 'URL contains a suspicious domain extension commonly used in phishing attacks',
      indicators: ['Suspicious TLD', 'Unknown domain', 'Potential phishing link']
    }
  }
  
  // Generic scam pattern detection
  if (/(verify|confirm|update|suspended|locked|deactivated|compromised|security alert|fraud alert)/i.test(lowerText) &&
      /(account|payment|subscription|membership|billing|card|wallet|ewallet)/i.test(lowerText) &&
      /https?:\/\//i.test(lowerText)) {
    return {
      type: '⚠️ Generic Phishing Attempt',
      confidence: 'MEDIUM',
      explanation: 'Suspicious message requesting verification or payment update',
      indicators: ['Verification request', 'Account threat', 'Suspicious link', 'Urgent action required']
    }
  }
  
  // Default return
  return {
    type: '❓ Suspicious Message',
    confidence: 'LOW',
    explanation: 'Contains scam indicators but does not match a specific known pattern',
    indicators: keywords.high.slice(0, 3)
  }
}

function CircularProgress({ score, color }: { score: number; color: string }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score)
    }, 100)
    return () => clearTimeout(timer)
  }, [score])

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-cyber-surface"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-mono" style={{ color }}>
          {animatedScore}
        </span>
        <span className="text-xs text-muted-foreground uppercase">Risk</span>
      </div>
    </div>
  )
}

function AnimatedBar({ score, color, delay = 0 }: { score: number; color: string; delay?: number }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(score)
    }, delay)
    return () => clearTimeout(timer)
  }, [score, delay])

  return (
    <div className="w-full h-2.5 rounded-full bg-cyber-surface overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${width}%`,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}50`
        }}
      />
    </div>
  )
}

// Fixed highlightText function
function highlightText(text: string, keywords: { high: string[]; medium: string[]; low: string[] }) {
  if (!text) return text
  
  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
  
  let result = escapeHtml(text)
  
  const scamPatterns = {
    high: [
      'free', 'won', 'winner', 'win', 'prize', 'congratulations', 'gift', 'reward', 'selected',
      'urgent', 'immediately', 'now', 'today', 'limited', 'expires', 'deadline',
      'suspended', 'locked', 'deactivated', 'arrest', 'fine', 'penalty', 'legal',
      'payment', 'pay', 'transfer', 'invoice', 'fee', 'charges', 'due', 'bill',
      'click', 'claim', 'verify', 'confirm', 'update', 'validate'
    ],
    medium: [
      'account', 'bank', 'paypal', 'amazon', 'netflix', 'security', 'alert',
      'warning', 'important', 'attention', 'immediate', 'action required'
    ],
    low: [
      'please', 'kindly', 'dear', 'hello', 'thank', 'sorry'
    ]
  }
  
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  const allHigh = [...new Set([...keywords.high, ...scamPatterns.high])]
  const allMedium = [...new Set([...keywords.medium, ...scamPatterns.medium])]
  const allLow = [...new Set([...keywords.low, ...scamPatterns.low])]
  
  const sortedHigh = [...allHigh].sort((a, b) => b.length - a.length)
  const sortedMedium = [...allMedium].sort((a, b) => b.length - a.length)
  const sortedLow = [...allLow].sort((a, b) => b.length - a.length)
  
  interface Marker {
    start: number
    end: number
    className: string
  }
  const markers: Marker[] = []
  
  const findMatches = (keywordList: string[], className: string) => {
    keywordList.forEach(keyword => {
      const regex = new RegExp(`(?<![a-zA-Z0-9/])(${escapeRegex(keyword)})(?![a-zA-Z0-9])`, 'gi')
      let match
      while ((match = regex.exec(result)) !== null) {
        markers.push({
          start: match.index,
          end: match.index + match[0].length,
          className
        })
      }
    })
  }
  
  findMatches(sortedHigh, 'highlight-red')
  findMatches(sortedMedium, 'highlight-amber')
  findMatches(sortedLow, 'highlight-green')
  
  const urlPattern = /(https?:\/\/[^\s<>&]+)/gi
  let urlMatch
  while ((urlMatch = urlPattern.exec(result)) !== null) {
    const url = urlMatch[0]
    const isSuspicious = /bit\.ly|tinyurl|goo\.gl|ow\.ly|\.xyz|\.tk|\.ml|\.ga/.test(url)
    markers.push({
      start: urlMatch.index,
      end: urlMatch.index + url.length,
      className: isSuspicious ? 'highlight-red highlight-url' : 'highlight-amber highlight-url'
    })
  }
  
  markers.sort((a, b) => a.start - b.start)
  
  const nonOverlappingMarkers: Marker[] = []
  for (const marker of markers) {
    const lastMarker = nonOverlappingMarkers[nonOverlappingMarkers.length - 1]
    if (!lastMarker || marker.start >= lastMarker.end) {
      nonOverlappingMarkers.push(marker)
    } else if (marker.end > lastMarker.end) {
      nonOverlappingMarkers[nonOverlappingMarkers.length - 1] = marker
    }
  }
  
  let finalHtml = ''
  let lastIndex = 0
  
  for (const marker of nonOverlappingMarkers) {
    finalHtml += result.slice(lastIndex, marker.start)
    const matchedText = result.slice(marker.start, marker.end)
    finalHtml += `<span class="${marker.className}">${matchedText}</span>`
    lastIndex = marker.end
  }
  
  finalHtml += result.slice(lastIndex)
  
  if (nonOverlappingMarkers.length === 0) {
    return result
  }
  
  return finalHtml
}

function calculateManipulationScore(result: ScanResult) {
  const baseScore = result.score
  const urgencyKeywords = ['URGENT', 'segera', '24 jam', '48 jam', 'immediately', 'sekarang']
  const fearKeywords = ['ditangkap', 'arrested', 'dibekukan', 'suspended', 'legal action', 'tindakan undang-undang']
  const authorityKeywords = ['Polis', 'PDRM', 'BNM', 'Bank Negara', 'LHDN', 'Kastam']
  
  let score = 0
  const allKeywords = [...result.keywords.high, ...result.keywords.medium]
  
  urgencyKeywords.forEach(k => { if (allKeywords.some(kw => kw.toLowerCase().includes(k.toLowerCase()))) score += 15 })
  fearKeywords.forEach(k => { if (allKeywords.some(kw => kw.toLowerCase().includes(k.toLowerCase()))) score += 20 })
  authorityKeywords.forEach(k => { if (allKeywords.some(kw => kw.toLowerCase().includes(k.toLowerCase()))) score += 15 })
  
  return Math.min(Math.round((score + baseScore * 0.5) / 1.5), 100)
}

function detectTactics(result: ScanResult): string[] {
  const detected: string[] = []
  const text = result.message.toLowerCase() + ' ' + result.keywords.high.join(' ').toLowerCase()
  
  if (/polis|pdrm|bnm|bank negara|lhdn|kastam|mahkamah|authority|official|government|bank|police|inspector|pejabat|jabatan/i.test(text)) detected.push('authority')
  if (/urgent|segera|24 jam|48 jam|immediately|sekarang|cepat|act now|time sensitive|expires today|limited time|hurry|asap|as soon as possible/i.test(text)) detected.push('urgency')
  if (/ditangkap|arrested|dibekukan|suspended|legal|undang|ancam|threat|penalty|fine|jail|legal action|will be closed|will be deleted|account frozen|warrant|arrest|investigation/i.test(text)) detected.push('fear')
  if (/hadiah|winner|menang|rm\s*\d|percuma|free|bonus|gift|reward|prize|jackpot|lottery|congratulations you won/i.test(text)) detected.push('greed')
  if (/maybank|cimb|shopee|lazada|grab|tng|touch.?n.?go|paypal|amazon|netflix|apple|microsoft|google|facebook|instagram|official|legitimate|trusted|verified|authorized/i.test(text)) detected.push('trust')
  if (/jangan beritahu|don't tell|rahsia|secret|private|confidential|do not share|keep this between us|don't inform anyone|for your eyes only/i.test(text)) detected.push('isolation')
  
  return detected
}

export function ScanResultDisplay({ result, onClear }: ScanResultDisplayProps) {
  const config = verdictConfig[result.verdict]
  const manipulationScore = calculateManipulationScore(result)
  const detectedTactics = detectTactics(result)
  const [reportSent, setReportSent] = useState<string | null>(null)
  const scamType = detectScamType(result.message, result.keywords)
  
  // Determine if we should show URL score (only if content contains a URL)
  const showUrlScore = containsUrl(result.message) || result.inputType === 'url'
  
  // Filter component scores based on whether URL score should be shown
  const filteredComponentScores = componentScores.filter(comp => 
    showUrlScore || comp.key !== 'url'
  )

  const handleQuickReport = (agency: string) => {
    setReportSent(agency)
    setTimeout(() => setReportSent(null), 3000)
  }

  const highlightedHtml = highlightText(result.message, result.keywords)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Verdict Banner */}
      <div className={cn(
        'p-6 rounded-xl border-2',
        config.bgColor,
        config.borderColor,
        config.glowClass
      )}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{config.emoji}</span>
            <div>
              <h2 className={cn('text-2xl font-bold uppercase tracking-wider', config.textColor)}>
                {config.label}
              </h2>
              <p className="text-sm text-muted-foreground font-mono">
                {scamType.type} • Analyzed {new Date(result.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <CircularProgress score={result.score} color={config.ringColor} />
        </div>
      </div>

      {/* Quick Report Actions */}
      {result.verdict !== 'SAFE' && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyber-red/10 to-cyber-amber/10 border border-cyber-red/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-cyber-red" />
            <h3 className="font-semibold text-foreground">Quick Report Actions</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyber-green/20 text-cyber-green">MALAYSIA FIRST</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            One-click reporting to Malaysian authorities. Help protect others from this scam.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickReport('PDRM')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                reportSent === 'PDRM' 
                  ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30' 
                  : 'bg-cyber-card border border-border hover:border-cyber-cyan/50'
              )}
            >
              <Phone className="w-4 h-4" />
              {reportSent === 'PDRM' ? 'Reported!' : 'Report to PDRM'}
            </button>
            <button
              onClick={() => handleQuickReport('MCMC')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                reportSent === 'MCMC' 
                  ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30' 
                  : 'bg-cyber-card border border-border hover:border-cyber-cyan/50'
              )}
            >
              <FileText className="w-4 h-4" />
              {reportSent === 'MCMC' ? 'Reported!' : 'Report to MCMC'}
            </button>
            <button
              onClick={() => handleQuickReport('BNM')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                reportSent === 'BNM' 
                  ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30' 
                  : 'bg-cyber-card border border-border hover:border-cyber-cyan/50'
              )}
            >
              <ExternalLink className="w-4 h-4" />
              {reportSent === 'BNM' ? 'Reported!' : 'Report to BNM'}
            </button>
          </div>
        </div>
      )}

      {/* Emotional Manipulation Analysis */}
      {result.verdict !== 'SAFE' && (
        <div className="p-5 rounded-xl bg-cyber-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-cyber-purple" />
            <h3 className="text-sm font-semibold text-cyber-purple uppercase tracking-wider">
              Psychological Manipulation Analysis
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyber-purple/20 text-cyber-purple">AI-POWERED</span>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-background/50 text-center">
              <Heart className="w-5 h-5 text-cyber-red mx-auto mb-1" />
              <p className="text-2xl font-mono font-bold text-cyber-red">{manipulationScore}%</p>
              <p className="text-[10px] text-muted-foreground uppercase">Manipulation Score</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50 text-center">
              <Zap className="w-5 h-5 text-cyber-amber mx-auto mb-1" />
              <p className="text-2xl font-mono font-bold text-cyber-amber">{detectedTactics.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Tactics Detected</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50 text-center">
              <AlertTriangle className="w-5 h-5 text-cyber-cyan mx-auto mb-1" />
              <p className="text-2xl font-mono font-bold text-cyber-cyan">
                {manipulationScore >= 70 ? 'HIGH' : manipulationScore >= 40 ? 'MED' : 'LOW'}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">Risk Level</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Tactics Detected</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {manipulationTactics.map((tactic) => {
                const isDetected = detectedTactics.includes(tactic.id)
                return (
                  <div 
                    key={tactic.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-colors',
                      isDetected ? 'bg-cyber-red/10 border border-cyber-red/30' : 'bg-background/30 border border-transparent'
                    )}
                  >
                    <span className="text-xl">{tactic.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', isDetected ? 'text-cyber-red' : 'text-muted-foreground')}>
                        {tactic.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{tactic.description}</p>
                    </div>
                    {isDetected && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyber-red/20 text-cyber-red">
                        DETECTED
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Scam Type Identification Box */}
      {result.verdict !== 'SAFE' && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-cyber-purple/10 to-cyber-cyan/10 border border-cyber-purple/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyber-purple/20 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-cyber-purple" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-sm font-semibold text-cyber-purple uppercase tracking-wider">
                  Scam Type Identified
                </h3>
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-bold',
                  scamType.confidence === 'HIGH' ? 'bg-cyber-red/20 text-cyber-red' :
                  scamType.confidence === 'MEDIUM' ? 'bg-cyber-amber/20 text-cyber-amber' :
                  'bg-cyber-yellow/20 text-cyber-yellow'
                )}>
                  {scamType.confidence} CONFIDENCE
                </span>
              </div>
              
              <p className="text-xl font-bold text-foreground mb-2">
                {scamType.type}
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                {scamType.explanation}
              </p>
              <div className="flex flex-wrap gap-2">
                {scamType.indicators.map((indicator, i) => (
                  <span 
                    key={i}
                    className="px-2 py-1 rounded-lg text-xs bg-background/50 text-foreground border border-border"
                  >
                    🔍 {indicator}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* AI Explanation Card */}
        <div className="p-5 rounded-xl bg-cyber-card border border-border">
          <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider mb-3">
            AI Explanation
          </h3>
          <p className="text-sm text-foreground leading-relaxed mb-4">
            {result.reason}
          </p>
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground uppercase">SHAP Attribution Keywords</span>
            <div className="flex flex-wrap gap-2">
              {result.keywords.high.map((kw, i) => (
                <span key={i} className="px-2 py-1 rounded text-xs font-mono bg-cyber-red/20 text-cyber-red border border-cyber-red/30">
                  {kw}
                </span>
              ))}
              {result.keywords.medium.map((kw, i) => (
                <span key={i} className="px-2 py-1 rounded text-xs font-mono bg-cyber-amber/20 text-cyber-amber border border-cyber-amber/30">
                  {kw}
                </span>
              ))}
              {result.keywords.low.map((kw, i) => (
                <span key={i} className="px-2 py-1 rounded text-xs font-mono bg-muted/20 text-muted-foreground border border-border">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Component Scores Card */}
        <div className="p-5 rounded-xl bg-cyber-card border border-border">
          <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider mb-4">
            Component Scores
          </h3>
          <div className="space-y-4">
            {filteredComponentScores.map((comp, i) => (
              <div key={comp.key} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{comp.label}</span>
                  <span className="font-mono font-bold" style={{ color: comp.color }}>
                    {result.scores[comp.key]}%
                  </span>
                </div>
                <AnimatedBar score={result.scores[comp.key]} color={comp.color} delay={i * 150} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence Highlight */}
      <div className="p-5 rounded-xl bg-cyber-card border border-border">
        <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider mb-3">
          Evidence Highlight
        </h3>
        <div
          className="p-4 rounded-lg bg-cyber-surface font-mono text-sm leading-relaxed whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => alert('Report submitted!')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyber-red/10 border border-cyber-red text-cyber-red font-medium text-sm hover:bg-cyber-red/20 transition-all"
        >
          <Flag className="w-4 h-4" />
          Report Scam
        </button>
        <button
          onClick={() => alert('Sender blocked!')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyber-card border border-border text-foreground font-medium text-sm hover:border-cyber-cyan/50 transition-all"
        >
          <Ban className="w-4 h-4" />
          Block Sender
        </button>
        <button
          onClick={() => alert('Share link copied!')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyber-card border border-border text-foreground font-medium text-sm hover:border-cyber-cyan/50 transition-all"
        >
          <Share2 className="w-4 h-4" />
          Share Alert
        </button>
        <button
          onClick={onClear}
          className="ml-auto px-5 py-2.5 rounded-lg bg-cyber-surface border border-border text-muted-foreground font-medium text-sm hover:text-foreground transition-all"
        >
          Clear & Scan New
        </button>
      </div>
    </div>
  )
}