// lib/scan-heuristics.ts

/** Deterministic URL / pattern / context scores (no randomness). */

function normalizeLinkText(message: string) {
  return message
    .replace(/\[\.]/g, '.')
    .replace(/\bhxxps?:\/\//gi, 'http://')
    .replace(/\bdot\s+com\b/gi, '.com')
    .replace(/\bdot\s+net\b/gi, '.net')
}

// Check if message is just a URL (no scam context)
function isJustUrl(message: string): boolean {
  const trimmed = message.trim()
  const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}([/?#][^\s]*)?$/i
  return urlPattern.test(trimmed)
}

// Check if URL is from a trusted domain
function isTrustedDomain(url: string): boolean {
  const trustedDomains = [
    'wikipedia.org', 'google.com', 'github.com', 'stackoverflow.com', 
    'python.org', 'docs.microsoft.com', 'reddit.com', 'amazon.com',
    'shopee.com.my', 'lazada.com.my', 'grab.com', 'touchngo.com.my',
    'maybank2u.com.my', 'cimb.com.my', 'publicbank.com.my', 'netflix.com',
    'spotify.com', 'airasia.com', 'foodpanda.com', 'tnb.com.my'
  ]
  const lowerUrl = url.toLowerCase()
  return trustedDomains.some(domain => lowerUrl.includes(domain))
}

// Check for legitimate email patterns
function hasLegitimateEmailPatterns(message: string): { matched: boolean; count: number; types: string[] } {
  const lower = message.toLowerCase()
  const patterns = [
    { pattern: /subscription will renew|renew on|thank you for being a member/i, type: 'subscription' },
    { pattern: /discover weekly|playlist|freshly updated|music recommendations/i, type: 'playlist' },
    { pattern: /tnb bill|utility bill|due date|pay online|mytnb app/i, type: 'bill' },
    { pattern: /foodpanda|order is on its way|estimated delivery|picked up by the rider/i, type: 'delivery' },
    { pattern: /grab.*20% off|promo code|discount|dapatkan.*percuma/i, type: 'promo' },
    { pattern: /flight confirmation|booking confirmation|check in online/i, type: 'confirmation' },
    { pattern: /weekly update|team meeting|sprint planning|agenda|deliverables/i, type: 'team' },
    { pattern: /order confirmation|your order has been shipped|track your package/i, type: 'order' },
    { pattern: /receipt from|thank you for your purchase/i, type: 'receipt' },
    { pattern: /meeting reminder|appointment|calendar invite/i, type: 'calendar' },
  ]
  
  const matchedTypes: string[] = []
  for (const { pattern, type } of patterns) {
    if (pattern.test(lower)) {
      matchedTypes.push(type)
    }
  }
  
  return {
    matched: matchedTypes.length > 0,
    count: matchedTypes.length,
    types: matchedTypes
  }
}

export function computeHeuristicScores(message: string) {
  const m = message
  const normalized = normalizeLinkText(m)
  const justUrl = isJustUrl(m)
  const trusted = isTrustedDomain(m)
  const legitPatterns = hasLegitimateEmailPatterns(m)
  
  // Specific patterns to avoid false positives
  const hasUrgent = /\b(urgent|segera|immediately|sekarang|act now|verify now|security alert|please verify your account)\b/i.test(m)
  const hasSuspiciousUrl =
    /\.xyz\b|\.tk\b|\.ml\b|\.ga\b|\.cf\b|\.gq\b|\.bid\b|\.top\b|\.site\b|\.online\b|bit\.ly\b|tinyurl\.com\b|goo\.gl\b|ow\.ly\b/i.test(normalized)
  const hasObfuscatedUrl = /\bhxxps?:\/\//i.test(m) || /\[\.]/i.test(m) || /\bdot\s+(?:com|net|org)\b/i.test(m)
  
  // Only flag if specific payment/transfer requests
  const hasMoneyRequest = /\b(transfer|bayar|deposit|invoice|payment|yuran|fee|charges?|due|bil|duit|ringgit|RM\s*\d+|credit card|debit card|send money|wire transfer)\b/i.test(m)
  
  // Only flag specific legal/threat language
  const hasThreats = /\b(ditangkap|arrest|suspend(ed)?|legal action|undang-undang|locked|deactivate(d)?|unauthorized|unauthorised|taken down|blacklist|fine|jail|penalty|will be closed|will be terminated|legal consequences|account freezing|flagged for suspicious)\b/i.test(m)
  
  // Prize detection (common scam trigger)
  const hasPrize = /\b(won|winner|congratulations|prize|gift card|free reward|claim your|you are selected|lucky draw)\b/i.test(m)
  
  // Only flag if it looks like impersonation with suspicious intent
  const hasBrandImpersonation = /\b(paypal|amazon|apple|microsoft|google|facebook|bank|bnm|maybank|cimb|shopee|lazada|grab|touch n go)\b/i.test(m)
  
  const hasHttp = /https?:\/\//i.test(normalized)
  
  // Check for legitimate context to reduce false positives
  const hasLegitimateContext = /\b(meeting|reminder|appointment|order|shipped|delivered|confirmed|team sync|lunch|dinner|coffee|breakfast)\b/i.test(m)
  const hasCalendarReference = /\b(tomorrow|today|monday|tuesday|wednesday|thursday|friday|at \d{1,2}:\d{2}|at \d{1,2}(?:am|pm))\b/i.test(m)
  
  let urlScore = 0
  let patternScore = 5
  let contextScore = 5
  
  if (justUrl && trusted) {
    // Legitimate URL alone - no scam risk
    urlScore = 0
    patternScore = 0
    contextScore = 0
  } else {
    // URL SCORING - More nuanced approach
    if (hasSuspiciousUrl || hasObfuscatedUrl) {
      // Check if it's just a shortened URL without other scam indicators
      const isJustShortenedUrl = /^(https?:\/\/)?(bit\.ly|goo\.gl|tinyurl|ow\.ly)\//i.test(normalized)
      const hasScamContext = hasMoneyRequest || hasThreats || hasUrgent || hasBrandImpersonation
      
      if (isJustShortenedUrl && !hasScamContext) {
        // Shortened URL alone - suspicious but not high risk without context
        urlScore = 45
      } else {
        urlScore = 88
      }
    } else if (hasHttp) {
      urlScore = hasBrandImpersonation ? 65 : 25
    } else {
      urlScore = 0
    }
    
    // Pattern scoring - lower base, more specific
    patternScore = 5
    if (hasUrgent && !hasLegitimateContext && !legitPatterns.matched) patternScore += 25
    if (hasMoneyRequest && !legitPatterns.matched) patternScore += 30
    if (hasThreats && !legitPatterns.matched) patternScore += 25
    if (hasPrize && !legitPatterns.matched) patternScore += 20
    if (hasBrandImpersonation && hasHttp && !hasLegitimateContext && !legitPatterns.matched) patternScore += 15
    patternScore = Math.min(100, patternScore)
    
    // Context scoring with legitimate context detection
    contextScore = 5
    if (hasThreats && !hasLegitimateContext && !legitPatterns.matched) contextScore += 40
    if (hasUrgent && !hasLegitimateContext && !legitPatterns.matched) contextScore += 20
    if (hasBrandImpersonation && hasMoneyRequest && !legitPatterns.matched) contextScore += 20
    if (hasMoneyRequest && !hasLegitimateContext && !legitPatterns.matched) contextScore += 15
    
    // Reduce score for legitimate messages
    if (hasLegitimateContext && hasCalendarReference && !hasMoneyRequest && !hasThreats) {
      contextScore = Math.max(0, contextScore - 30)
      patternScore = Math.max(0, patternScore - 20)
    }
    
    // Significantly reduce score for legitimate email patterns
    if (legitPatterns.matched) {
      const reduction = Math.min(50, legitPatterns.count * 15)
      patternScore = Math.max(0, patternScore - reduction)
      contextScore = Math.max(0, contextScore - reduction)
      urlScore = Math.max(0, urlScore - 20)
    }
    
    contextScore = Math.min(100, Math.max(0, contextScore))
  }

  return {
    urlScore,
    patternScore,
    contextScore,
    hasUrgent,
    hasSuspiciousUrl: hasSuspiciousUrl || hasObfuscatedUrl,
    hasObfuscatedUrl,
    hasMoneyRequest,
    hasThreats,
    hasPrize,
    hasBrandImpersonation,
    hasLegitimateContext,
    legitPatterns: legitPatterns.matched,
    legitPatternsCount: legitPatterns.count,
    legitPatternsTypes: legitPatterns.types,
  }
}

export function heuristicNlpFallback(message: string): number {
  const m = message
  const justUrl = isJustUrl(m)
  const trusted = isTrustedDomain(m)
  const legitPatterns = hasLegitimateEmailPatterns(m)
  
  // If it's just a trusted URL, return low score
  if (justUrl && trusted) {
    return 0
  }
  
  let s = 8
  
  if (/free\s*msg|txt:|congratulations|you\s*won|prize|lucky\s*draw|offer|promo|special offer|gift card/i.test(m)) s += 35
  if (/urgent|verify\s*your|verify\s*now|confirm\s*details|account.*suspend|click\s*here|immediately|security alert|login|account.*locked/i.test(m)) s += 30
  if (/RM\d|transfer|bank|otp|pin|password|payment|invoice|fee|bil|deposit|update.*account|billing/i.test(m)) s += 25
  
  // Reduce score for legitimate context
  if (/meeting|reminder|appointment|lunch|dinner|coffee|team sync/i.test(m)) {
    s = Math.max(0, s - 20)
  }
  
  // Reduce score for legitimate email patterns
  if (legitPatterns.matched) {
    s = Math.max(0, s - (legitPatterns.count * 15))
  }
  
  // If it's just a URL (even unknown), reduce score
  if (justUrl) {
    s = Math.max(0, s - 30)
  }
  
  return Math.min(100, s)
}

export function mergeRiskScore(
  nlpScore: number,
  urlScore: number,
  patternScore: number,
  contextScore: number
): number {
  // Primary weight on NLP (most reliable for text)
  let weightedScore = 
    (nlpScore * 0.55) +      // 55% - ML classifier (most important)
    (urlScore * 0.25) +      // 25% - URL analysis
    (patternScore * 0.12) +  // 12% - Pattern matching
    (contextScore * 0.08);   // 8% - Context specific
  
  // Confidence boosts (only if not a legitimate URL)
  if (nlpScore >= 75 && nlpScore < 85) {
    weightedScore += 8
  }
  if (urlScore >= 65) {
    weightedScore += 5
  }
  if (patternScore >= 50) {
    weightedScore += 5
  }
  
  // Reduce score for legitimate URLs
  if (nlpScore < 20 && urlScore < 20) {
    weightedScore = Math.max(0, weightedScore - 15)
  }
  
  return Math.min(95, Math.max(0, Math.round(weightedScore)))
}

export function mergeRiskScoreUrlTab(
  nlpScore: number,
  urlScore: number,
  patternScore: number,
  contextScore: number
): number {
  let weightedScore = 
    (urlScore * 0.50) +      // 50% - URL is main focus
    (nlpScore * 0.30) +      // 30% - NLP from page content
    (patternScore * 0.12) +  // 12% - Pattern matching
    (contextScore * 0.08)    // 8% - Context
  
  if (urlScore >= 70) weightedScore += 10
  if (nlpScore >= 70) weightedScore += 5
  if (urlScore >= 80) weightedScore += 5
  
  return Math.min(95, Math.max(0, Math.round(weightedScore)))
}

export function heuristicUrlFallback(message: string): number {
  const normalized = normalizeLinkText(message).toLowerCase()
  const justUrl = isJustUrl(message)
  const trusted = isTrustedDomain(message)
  
  // Trusted domains are safe
  if (justUrl && trusted) {
    return 0
  }
  
  let s = 8
  if (
    /\.xyz\b|\.tk\b|\.ml\b|\.ga\b|\.cf\b|\.gq\b|\.bid\b|\.top\b|\.site\b|\.online\b|bit\.ly\b|tinyurl\.com\b|goo\.gl\b|ow\.ly\b/i.test(normalized) ||
    /hxxps?:\/\//i.test(message) ||
    /\[\.]/i.test(message)
  )
    s += 58
  if (/paypal|bank|verify|login|secure|update.*account|account.*verify|billing|invoice|payment|unauthoriz|password/i.test(normalized))
    s += 22
  if (/https?:\/\//i.test(normalized)) s += 8
  
  // Reduce for legitimate-looking URLs
  if (justUrl && !trusted) {
    s = Math.max(0, s - 20)
  }
  
  return Math.min(100, s)
}

export function verdictFromScore(avg: number): 'HIGH_RISK' | 'SUSPICIOUS' | 'SAFE' {
  if (avg >= 65) return 'HIGH_RISK'
  if (avg >= 30) return 'SUSPICIOUS'
  return 'SAFE'
}

export function heuristicKeywords(h: ReturnType<typeof computeHeuristicScores>): {
  high: string[]
  medium: string[]
  low: string[]
} {
  const high: string[] = []
  const medium: string[] = []
  const low: string[] = []
  
  if (h.hasSuspiciousUrl) high.push('suspicious TLD or obfuscated link')
  if (h.hasObfuscatedUrl) high.push('obfuscated link / dot notation')
  if (h.hasThreats && !h.legitPatterns) high.push('threat / legal pressure')
  if (h.hasPrize && !h.legitPatterns) high.push('prize / reward lure')
  if (h.hasMoneyRequest && !h.hasLegitimateContext && !h.legitPatterns) medium.push('payment / transfer request')
  if (h.hasUrgent && !h.hasLegitimateContext && !h.legitPatterns) medium.push('urgency / pressure tactics')
  if (h.hasBrandImpersonation && !h.hasSuspiciousUrl && !h.hasLegitimateContext && !h.legitPatterns) medium.push('brand reference')
  
  return { high, medium, low }
}