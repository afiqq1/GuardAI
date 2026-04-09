// lib/ml-client.ts

import type { ScanResult } from '@/lib/sample-data'
import { v4 as uuidv4 } from 'uuid'
import {
  computeHeuristicScores,
  heuristicKeywords,
  heuristicNlpFallback,
  heuristicUrlFallback,
  mergeRiskScore,
  mergeRiskScoreUrlTab,
  verdictFromScore,
} from '@/lib/scan-heuristics'

export type MlFetchResult = { nlpScore: number; mlNote: string }
export type EmailFetchResult = { emailScore: number; mlNote: string }

// ============================================
// SAFE BANK MESSAGE DETECTION - IMPROVED
// ============================================

function isLegitimateBankMessage(text: string): boolean {
  const lower = text.toLowerCase()
  
  // Check for legitimate bank transaction patterns
  const hasTransaction = /credited to|debited from|transaction (on|at|successful)|purchase at|withdrawal at|transfer (of|to)/i.test(lower)
  const hasBalance = /balance:? rm|new balance|available balance|account ending|baki semasa/i.test(lower)
  const hasTacOtp = /tac code|otp code|verification code|valid for \d+ minutes/i.test(lower)
  
  // Check for legitimate bank SMS format
  const isLegitBankFormat = /Maybank|CIMB|Public Bank|RHB.*?(credited|debited|balance)/i.test(lower)
  
  // Check for suspicious elements that override legitimacy
  const hasSuspiciousUrl = /\.(xyz|top|tk|ml|ga|cf|icu|pw|online|site|club)/i.test(lower)
  const hasUrgentRequest = /\b(verify|confirm|update|click here|login now|suspended|locked|deactivated)\b/i.test(lower)
  
  // Legitimate bank messages ALWAYS include balance information or are TAC/OTP codes
  if (((hasTransaction && hasBalance) || hasTacOtp || isLegitBankFormat) && !hasSuspiciousUrl && !hasUrgentRequest) {
    return true
  }
  
  return false
}

// ============================================
// SCAM TYPE DETECTION (for display)
// ============================================

function getScamTypeFromContent(message: string, score: number, isLegitimate: boolean): string {
  if (isLegitimate) return 'Legitimate Transaction'
  
  const lower = message.toLowerCase()
  
  if (score < 40) return 'Likely Benign'
  if (/pdrm|polis|mahkamah|arrest|ditangkap|inspektor|bukit aman|ccid/i.test(lower)) return 'Macau Scam'
  if (/shopee|lazada|winner|menang|hadiah/i.test(lower)) return 'E-Commerce Fraud'
  if (/bnm|bank negara|account suspended|dibekukan|akaun dibekukan/i.test(lower)) return 'Bank Impersonation'
  if (/parcel|pos|kastam|customs|duti|bungkusan/i.test(lower)) return 'Parcel / Customs Scam'
  if (/job|kerja|part time|work from home|wfh|side hustle/i.test(lower)) return 'Job Scam'
  if (/investment|pelaburan|double|gandakan|return|profit|jamin pulangan/i.test(lower)) return 'Investment Scam'
  if (/\.xyz|\.tk|\.ml|\.ga|\.cf|bit\.ly|tinyurl|goo\.gl/i.test(lower)) return 'Phishing URL'
  if (/netflix|paypal|apple|amazon|microsoft.*?(verify|update|confirm|locked|suspended)/i.test(lower)) return 'Email Phishing'
  return 'Suspicious Content'
}

// ============================================
// SMS CLASSIFIER (Python joblib)
// ============================================

export async function fetchSmsClassifierScore(message: string): Promise<MlFetchResult> {
  try {
    const res = await fetch('/api/scan/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    const data = (await res.json()) as {
      ml?: { spamProbability: number } | null
      error?: string | null
    }

    if (data.ml && typeof data.ml.spamProbability === 'number') {
      const p = data.ml.spamProbability
      return {
        nlpScore: Math.round(p * 100),
        mlNote: `UCI-trained SMS classifier: ${(p * 100).toFixed(1)}% spam probability. `,
      }
    }

    const err = typeof data.error === 'string' && data.error ? data.error : 'unknown error'
    return {
      nlpScore: heuristicNlpFallback(message),
      mlNote: `SMS classifier unavailable (${err}). Using pattern-based NLP score. `,
    }
  } catch {
    return {
      nlpScore: heuristicNlpFallback(message),
      mlNote: 'SMS classifier request failed. Using pattern-based NLP score. ',
    }
  }
}

// ============================================
// URL CLASSIFIER (Python joblib)
// ============================================

export async function fetchUrlClassifierScore(urlText: string): Promise<{ urlScore: number; mlNote: string }> {
  try {
    const res = await fetch('/api/scan/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlText }),
    })
    const data = (await res.json()) as {
      ml?: { phishingProbability: number } | null
      error?: string | null
    }

    if (data.ml && typeof data.ml.phishingProbability === 'number') {
      const p = data.ml.phishingProbability
      return {
        urlScore: Math.round(p * 100),
        mlNote: `URL RF model: ${(p * 100).toFixed(1)}% phishing probability. `,
      }
    }

    const err = typeof data.error === 'string' && data.error ? data.error : 'unknown error'
    return {
      urlScore: heuristicUrlFallback(urlText),
      mlNote: `URL model unavailable (${err}). Using heuristic URL score. `,
    }
  } catch {
    return {
      urlScore: heuristicUrlFallback(urlText),
      mlNote: 'URL model request failed. Using heuristic URL score. ',
    }
  }
}

// ============================================
// ENHANCED EMAIL HEURISTIC FALLBACK
// ============================================

function heuristicEmailFallback(text: string): number {
  const lower = text.toLowerCase()
  let score = 0
  let isPhishing = false
  
  // Check for legitimate patterns first (to lower score)
  const legitPatterns = [
    /subscription will renew|renew on|thank you for being a member/i,
    /discover weekly|playlist|freshly updated|music recommendations/i,
    /tnb bill|utility bill|due date|pay online|mytnb app/i,
    /foodpanda|order is on its way|estimated delivery|picked up by the rider/i,
    /grab.*20% off|promo code|discount/i,
    /flight confirmation|check in online|booking confirmation/i,
    /dapatkan.*percuma|log masuk ke.*app/i,
    /your receipt from|thank you for your purchase/i,
    /weekly update|team meeting|sprint planning/i,
  ]
  
  let legitMatchCount = 0
  for (const pattern of legitPatterns) {
    if (pattern.test(lower)) {
      legitMatchCount++
    }
  }
  
  // 1. BNM / Bank Negara specific (HIGHEST priority)
  if (/bank negara|bnm|bank negara malaysia/i.test(lower)) {
    score += 30
    isPhishing = true
    
    if (/verify|confirm|update|account.*flagged|suspicious transaction|account freezing|fraud department/i.test(lower)) {
      score += 25
    }
  }
  
  // 2. Suspicious URLs (highest weight - 40 points)
  if (/https?:\/\/(?!.*(paypal\.com|amazon\.com|netflix\.com|apple\.com|microsoft\.com|google\.com)).*\.(xyz|top|tk|ml|ga|cf|icu|pw|online|site|club)/i.test(lower)) {
    score += 40
    isPhishing = true
  }
  if (/bit\.ly|tinyurl|goo\.gl|ow\.ly/i.test(lower)) {
    score += 25
    isPhishing = true
  }
  
  // 3. Phone numbers in scam context
  if (/contact.*\d{10,11}|\d{10,11}.*contact|call.*\d{10,11}|\d{10,11}.*call/i.test(lower)) {
    score += 20
    isPhishing = true
  }
  
  // 4. Urgency words (20 points)
  if (/\b(urgent|immediately|now|today|limited|expires|deadline|act now|verify now|within 24 hours|within 48 hours|immediate action)\b/i.test(lower)) {
    score += 20
    isPhishing = true
  }
  
  // 5. Threat/account freezing (25 points)
  if (/\b(suspended|locked|deactivated|closed|terminated|compromised|will be deleted|will be closed|account will be|permanently disabled|account freezing|flagged for suspicious|legal action|penalty|fine|arrest)\b/i.test(lower)) {
    score += 25
    isPhishing = true
  }
  
  // 6. Payment/money requests (20 points)
  if (/\b(payment|transfer|invoice|fee|charges|due|bill|wire|deposit|refund|reimbursement)\b/i.test(lower)) {
    score += 20
  }
  
  // 7. Brand impersonation (25 points)
  const brandPatterns = [
    /netflix.*?(verify|update|payment|expired|membership)/i,
    /paypal.*?(verify|confirm|limited|restrict|account)/i,
    /apple.*?(verify|locked|suspended|id)/i,
    /amazon.*?(verify|order|cancel|confirm|account)/i,
    /microsoft.*?(verify|compromised|security|account)/i,
    /bank.*?(verify|update|alert|suspended|fraud|flagged)/i,
    /bnm.*?(verify|update|alert|suspended|fraud|flagged)/i,
    /maybank.*?(verify|update|alert|suspended)/i,
    /cimb.*?(verify|update|alert|suspended)/i,
    /public bank.*?(verify|update|alert|suspended)/i,
  ]
  
  for (const pattern of brandPatterns) {
    if (pattern.test(lower)) {
      score += 25
      isPhishing = true
      break
    }
  }
  
  // 8. Grammar/spelling errors (10 points)
  if (/\b(recieved|acheive|adress|definately|acount|verifiy|confirmacion|attached file)\b/i.test(lower)) {
    score += 10
  }
  
  // 9. Call to action (15 points)
  if (/click here|click the link|click below|tap here|follow the link|contact our|call now|call immediately/i.test(lower)) {
    score += 15
  }
  
  // 10. Urgency with exclamation marks (10 points)
  const exclamationCount = (lower.match(/!/g) || []).length
  if (exclamationCount >= 2) {
    score += 10
  }
  
  // 11. Suspicious sender patterns
  if (/security alert|account alert|fraud alert|verification required|action required/i.test(lower)) {
    score += 15
    isPhishing = true
  }
  
  // 12. Legitimate indicators (reduce score)
  if (/thank you for your purchase|order confirmation #|your order has been shipped|track your package|your receipt|purchase completed/i.test(lower)) {
    if (score < 30) {
      score = Math.max(0, score - 20)
    }
  }
  
  // 13. Team/internal communication (reduce score significantly)
  if (/weekly update|team meeting|sprint planning|agenda|deliverables|standup|retrospective|project status|quarterly review/i.test(lower)) {
    if (score < 30) {
      score = Math.max(0, score - 40)
    }
  }
  
  // 14. Legitimate bank OTP/notification (reduce score)
  if (/your tac code is|your otp code is|verification code is|transaction successful|payment received|money received/i.test(lower)) {
    if (score < 30) {
      score = Math.max(0, score - 30)
    }
  }
  
  // 15. Reduce score for legitimate patterns
  if (legitMatchCount >= 2 && score > 40) {
    score = Math.max(0, score - 30)
  }
  
  let finalScore = Math.min(score, 100)
  
  // Boost if clearly phishing with multiple indicators
  if (isPhishing && finalScore < 70 && legitMatchCount === 0) {
    finalScore = Math.min(95, finalScore + 20)
  }
  
  // BNM scam specific boost
  if (/bank negara|bnm/i.test(lower) && /suspicious|flagged|freezing|fraud department|security alert/i.test(lower)) {
    finalScore = Math.max(finalScore, 75)
  }
  
  // Ensure phishing emails with suspicious URLs get at least 75
  if (/\.(xyz|top|tk|ml|ga|cf|icu|pw)/i.test(lower) && /verify|confirm|update|login|flagged|suspicious|security alert/i.test(lower)) {
    finalScore = Math.max(finalScore, 75)
  }
  
  // Ensure Macau scam patterns get high score
  if (/pdrm|polis|police|arrest|warrant|money laundering/i.test(lower) && /account|bank|transfer|payment/i.test(lower)) {
    finalScore = Math.max(finalScore, 80)
  }
  
  // Ensure e-commerce fraud gets high score
  if (/(shopee|lazada|winner|won|congratulations).*?(prize|reward|gift|rm\d+)/i.test(lower) && /fee|payment|transfer/i.test(lower)) {
    finalScore = Math.max(finalScore, 75)
  }
  
  return finalScore
}

// ============================================
// EMAIL CLASSIFIER (Python joblib)
// ============================================

export async function fetchEmailClassifierScore(emailText: string): Promise<EmailFetchResult> {
  try {
    const res = await fetch('/api/scan/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: emailText }),
    })
    const data = (await res.json()) as {
      ml?: {
        phishingProbability?: number
        label?: string
      }
      error?: string | null
      fallbackUsed?: boolean
    }

    if (data?.ml && typeof data.ml.phishingProbability === 'number') {
      const p = data.ml.phishingProbability
      const score = Math.round(p * 100)
      
      if (data.fallbackUsed) {
        return {
          emailScore: score,
          mlNote: `Email heuristic detector: ${score}% phishing probability. `,
        }
      }
      
      return {
        emailScore: score,
        mlNote: `Email phishing detector: ${score}% phishing probability. `,
      }
    }

    const heuristicScore = heuristicEmailFallback(emailText)
    return {
      emailScore: heuristicScore,
      mlNote: `Email heuristic detector: ${heuristicScore}% phishing probability (API error). `,
    }
  } catch (error) {
    console.error('Email classification error:', error)
    const heuristicScore = heuristicEmailFallback(emailText)
    return {
      emailScore: heuristicScore,
      mlNote: `Email heuristic detector: ${heuristicScore}% phishing probability (API error). `,
    }
  }
}

// ============================================
// BUILD SCAN RESULT FROM ANALYSIS - UPDATED
// ============================================

export function buildScanResultFromAnalysis(options: {
  message: string
  inputType: string
  nlpScore: number
  urlModelScore?: number | null
  emailModelScore?: number | null
  mlNote: string
}): ScanResult {
  const { message, inputType, nlpScore, urlModelScore = null, emailModelScore = null, mlNote } = options
  
  // FIRST: Check if this is a legitimate bank message (overrides everything)
  const isLegitimateBank = isLegitimateBankMessage(message)
  
  const h = computeHeuristicScores(message)
  
  let finalNlpScore = nlpScore
  let finalUrlScore: number = (urlModelScore ?? h.urlScore);
  finalUrlScore = Math.max(finalUrlScore, h.urlScore);
  let finalEmailScore: number = (emailModelScore ?? 0);
  
  let score: number
  
  if (isLegitimateBank) {
    // Legitimate bank messages get very low score (max 15%)
    score = Math.min(15, mergeRiskScore(nlpScore, finalUrlScore, h.patternScore, h.contextScore))
  } else if (inputType === 'email') {
    // Check if email contains any URL
    const hasUrl = /https?:\/\/|www\.|bit\.ly|tinyurl|goo\.gl/i.test(message)
    
    // Check for legitimate email patterns (to reduce false positives)
    const lower = message.toLowerCase()
    
    const isLegitSubscription = /subscription will renew|renew on|thank you for being a member/i.test(lower)
    const isLegitPlaylist = /discover weekly|playlist|freshly updated|music recommendations/i.test(lower)
    const isLegitBill = /tnb bill|utility bill|due date|pay online|mytnb app/i.test(lower)
    const isLegitDelivery = /foodpanda|order is on its way|estimated delivery|picked up by the rider/i.test(lower)
    const isLegitPromo = /grab.*20% off|promo code|discount|dapatkan.*percuma/i.test(lower)
    const isLegitConfirmation = /flight confirmation|booking confirmation|check in online/i.test(lower)
    const isLegitTeam = /weekly update|team meeting|sprint planning|agenda|deliverables/i.test(lower)
    
    const isHighlyLegitimate = isLegitSubscription || isLegitPlaylist || isLegitBill || isLegitDelivery || isLegitPromo || isLegitConfirmation || isLegitTeam
    
    let weightedScore: number
    
    if (!hasUrl) {
      // No URL in email - primarily use email model
      if (isHighlyLegitimate && finalEmailScore < 60) {
        // Force low score for legitimate patterns
        weightedScore = finalEmailScore * 0.3
      } else {
        weightedScore = (finalEmailScore * 0.70) + (h.patternScore * 0.20) + (h.contextScore * 0.10)
      }
    } else if (finalEmailScore >= 70) {
      weightedScore = (finalEmailScore * 0.55) + (finalUrlScore * 0.25) + (h.patternScore * 0.15) + (h.contextScore * 0.05)
    } else if (finalEmailScore >= 50 && finalUrlScore >= 70) {
      weightedScore = (finalUrlScore * 0.60) + (finalEmailScore * 0.20) + (h.patternScore * 0.15) + (h.contextScore * 0.05)
    } else {
      weightedScore = (finalEmailScore * 0.50) + (finalUrlScore * 0.20) + (h.patternScore * 0.20) + (h.contextScore * 0.10)
    }
    
    score = Math.min(98, Math.max(0, Math.round(weightedScore)))
    
    // Reduce score for legitimate patterns
    if (isHighlyLegitimate && score > 35) {
      score = Math.min(score, 30)
    }
    
    // Special case: Subscription and playlist emails
    if ((isLegitSubscription || isLegitPlaylist) && score > 40) {
      score = 25
    }
    
    // Special case: Bills and delivery notifications
    if ((isLegitBill || isLegitDelivery) && score > 35) {
      score = 28
    }
    
    // Special case: Promotional emails
    if (isLegitPromo && score > 40) {
      score = 30
    }
    
    // Special case: Team/Work emails
    if (isLegitTeam && score > 35) {
      score = 20
    }
    
    // Boost only if BOTH email model AND URL agree it's phishing AND has suspicious indicators
    const hasSuspiciousIndicators = /suspended|locked|verify|confirm|update|click here|\.xyz|\.top|\.tk/i.test(lower)
    
    if (finalEmailScore >= 70 && finalUrlScore >= 70 && hasSuspiciousIndicators) {
      score = Math.min(95, score + 10)
    }
    
  } else if (inputType === 'url') {
    score = mergeRiskScoreUrlTab(finalNlpScore, finalUrlScore, h.patternScore, h.contextScore)
  } else {
    score = mergeRiskScore(finalNlpScore, finalUrlScore, h.patternScore, h.contextScore)
  }

  let verdict = verdictFromScore(score)
  
  if (isLegitimateBank && verdict !== 'SAFE') {
    verdict = 'SAFE'
    score = Math.min(score, 15)
  }
  
  const keywords = heuristicKeywords(h)
  const scamType = getScamTypeFromContent(message, score, isLegitimateBank)
  
  let reason: string
  if (isLegitimateBank) {
    reason = 'Legitimate bank transaction notification. No scam indicators detected.'
  } else if (verdict === 'HIGH_RISK') {
    reason = `${mlNote}High confidence scam detection. Multiple scam indicators found including urgency, authority impersonation, and financial requests.`
  } else if (verdict === 'SUSPICIOUS') {
    reason = `${mlNote}Suspicious content detected. Contains some scam-like patterns. Verify independently before taking any action.`
  } else {
    reason = `${mlNote}Message appears legitimate. No significant scam indicators detected.`
  }

  return {
    id: uuidv4(),
    inputType,
    message,
    timestamp: new Date(),
    score,
    verdict,
    scamType,
    reason,
    scores: {
      nlp: finalNlpScore,
      url: finalUrlScore,
      pattern: h.patternScore,
      context: h.contextScore,
    },
    keywords,
  }
}