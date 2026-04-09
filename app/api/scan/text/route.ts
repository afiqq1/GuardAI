import { runPythonJsonScript } from '../_python'

export const runtime = 'nodejs'

const MAX_MESSAGE_LEN = 8000

type SmsPy = {
  ok?: boolean
  label?: string
  spamProbability?: number
  hamProbability?: number
  error?: string
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const message =
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof (body as { message: unknown }).message === 'string'
      ? (body as { message: string }).message.trim()
      : ''

  if (!message) {
    return Response.json({ error: 'Field "message" is required' }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return Response.json(
      { error: `Message too long (max ${MAX_MESSAGE_LEN} characters)` },
      { status: 400 }
    )
  }

  const py = await runPythonJsonScript<SmsPy>('training/predict_sms.py', { text: message })

  if (!py.success) {
    return Response.json({ ml: null, error: py.error }, { status: 503 })
  }

  const d = py.data
  if (d.ok === false || typeof d.spamProbability !== 'number') {
    return Response.json({ ml: null, error: d.error ?? 'predictor failed' }, { status: 503 })
  }

  return Response.json({
    ml: {
      label: d.label ?? 'spam',
      spamProbability: d.spamProbability,
      hamProbability: typeof d.hamProbability === 'number' ? d.hamProbability : 1 - d.spamProbability,
    },
    error: null as string | null,
  })
}
