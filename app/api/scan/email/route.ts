// app/api/scan/email/route.ts
import { runPythonJsonScript } from '../_python'

export const runtime = 'nodejs'

const MAX_EMAIL_LEN = 50000

type EmailPy = {
  ok?: boolean
  label?: string
  phishingProbability?: number
  safeProbability?: number
  error?: string
}

// Server-side heuristic fallback (only used if Python fails)
function getHeuristicEmailScore(text: string): number {
  const lower = text.toLowerCase()
  let score = 0
  
  if (/\.(xyz|top|tk|ml|ga|cf|icu|pw|online|site|club)/i.test(lower)) score += 0.4
  if (/bit\.ly|tinyurl|goo\.gl/i.test(lower)) score += 0.25
  if (/\b(urgent|immediately|now|within 24 hours|within 48 hours|immediate action)\b/i.test(lower)) score += 0.2
  if (/\b(suspended|locked|deactivated|closed|terminated|compromised|account freezing|will be deleted)\b/i.test(lower)) score += 0.25
  if (/(netflix|paypal|apple|amazon|microsoft|bank|bnm|maybank|cimb).*?(verify|update|confirm|locked|suspended)/i.test(lower)) score += 0.25
  if (/contact.*\d{10,11}|call.*\d{10,11}/i.test(lower)) score += 0.15
  
  return Math.min(0.95, score)
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const text =
    typeof body === 'object' &&
    body !== null &&
    'text' in body &&
    typeof (body as { text: unknown }).text === 'string'
      ? (body as { text: string }).text.trim()
      : ''

  if (!text) {
    return Response.json({ error: 'Field "text" is required' }, { status: 400 })
  }
  if (text.length > MAX_EMAIL_LEN) {
    return Response.json(
      { error: `Email too long (max ${MAX_EMAIL_LEN} characters)` },
      { status: 400 }
    )
  }

  // Use the SAME Python utility as SMS and URL!
  const pyResult = await runPythonJsonScript<EmailPy>('training/predict_email.py', { text })

  // Check if Python succeeded and returned valid data
  if (pyResult.success && pyResult.data && typeof pyResult.data.phishingProbability === 'number') {
    const d = pyResult.data as EmailPy & { phishingProbability: number }
    return Response.json({
      ml: {
        label: d.label ?? (d.phishingProbability >= 0.5 ? 'phishing' : 'safe'),
        phishingProbability: d.phishingProbability,
        safeProbability: typeof d.safeProbability === 'number' ? d.safeProbability : 1 - d.phishingProbability,
      },
      error: null as string | null,
    })
  }

  // Fallback to heuristic when Python fails
  const errorMsg = !pyResult.success ? pyResult.error : 'Invalid response from Python'
  console.warn('Email Python failed, using heuristic fallback:', errorMsg)
  const heuristicScore = getHeuristicEmailScore(text)
  
  return Response.json({
    ml: {
      label: heuristicScore >= 0.7 ? 'phishing' : 'safe',
      phishingProbability: heuristicScore,
      safeProbability: 1 - heuristicScore,
    },
    error: null as string | null,
    fallbackUsed: true,
  })
}