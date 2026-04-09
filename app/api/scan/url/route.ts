import { runPythonJsonScript } from '../_python'

export const runtime = 'nodejs'

const MAX_URL_LEN = 8000

type UrlPy = {
  ok?: boolean
  label?: string
  phishingProbability?: number
  benignProbability?: number
  error?: string
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const raw =
    typeof b.url === 'string'
      ? b.url
      : typeof b.message === 'string'
        ? b.message
        : ''
  const url = raw.trim()

  if (!url) {
    return Response.json({ error: 'Field "url" or "message" is required' }, { status: 400 })
  }
  if (url.length > MAX_URL_LEN) {
    return Response.json({ error: `URL too long (max ${MAX_URL_LEN} characters)` }, { status: 400 })
  }

  const py = await runPythonJsonScript<UrlPy>('training/predict_url.py', { url })

  if (!py.success) {
    return Response.json({ ml: null, error: py.error }, { status: 503 })
  }

  const d = py.data
  if (d.ok === false || typeof d.phishingProbability !== 'number') {
    return Response.json({ ml: null, error: d.error ?? 'predictor failed' }, { status: 503 })
  }

  return Response.json({
    ml: {
      label: d.label ?? 'phishing',
      phishingProbability: d.phishingProbability,
      benignProbability:
        typeof d.benignProbability === 'number' ? d.benignProbability : 1 - d.phishingProbability,
    },
    error: null as string | null,
  })
}
