// components/dashboard/integration-architecture.tsx
'use client'

export function IntegrationArchitecture() {
  const box = 'rounded-lg border px-3 py-2 text-xs sm:text-sm bg-cyber-surface border-border'
  const arrow = 'text-cyber-cyan text-lg px-1'

  return (
    <div className="p-5 rounded-xl bg-cyber-card border border-border">
      <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider mb-4">
        Integration Architecture (for judges)
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Next.js serves the UI. Classification runs in <strong className="text-foreground">Python</strong> subprocesses
        launched from <code className="text-cyber-cyan">app/api/scan/*</code> — not Flask; the same pattern works in Docker
        on Render/AWS.
      </p>

      <div className="space-y-4 font-mono text-[11px] sm:text-xs leading-relaxed">
        {/* SMS Pipeline */}
        <div className="flex flex-wrap items-center gap-1">
          <span className={box}>Next.js 16 (React)</span>
          <span className={arrow}>→</span>
          <span className={box}>POST /api/scan/text</span>
          <span className={arrow}>→</span>
          <span className={box}>python training/predict_sms.py</span>
          <span className={arrow}>→</span>
          <span className={box}>data/sms_spam_pipeline.joblib</span>
        </div>

        {/* URL Pipeline */}
        <div className="flex flex-wrap items-center gap-1">
          <span className={box}>Next.js</span>
          <span className={arrow}>→</span>
          <span className={box}>POST /api/scan/url</span>
          <span className={arrow}>→</span>
          <span className={box}>python training/predict_url.py</span>
          <span className={arrow}>→</span>
          <span className={box}>data/url_pipeline.joblib</span>
        </div>

        {/* Email Pipeline */}
        <div className="flex flex-wrap items-center gap-1">
          <span className={box}>Next.js</span>
          <span className={arrow}>→</span>
          <span className={box}>POST /api/scan/email</span>
          <span className={arrow}>→</span>
          <span className={box}>python training/predict_email.py</span>
          <span className={arrow}>→</span>
          <span className={box}>data/email_pipeline.joblib</span>
        </div>

        {/* Screenshot Pipeline */}
        <div className="flex flex-wrap items-center gap-1">
          <span className={box}>Screenshot tab</span>
          <span className={arrow}>→</span>
          <span className={box}>Tesseract.js (browser OCR)</span>
          <span className={arrow}>→</span>
          <span className={box}>POST /api/scan/text</span>
          <span className={arrow}>→</span>
          <span className={box}>sms_spam_pipeline.joblib</span>
        </div>

        {/* Shared Python Utility */}
        <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-border">
          <span className="rounded-lg border border-cyber-purple/50 px-3 py-2 text-xs bg-cyber-purple/5">
            🔧 Shared Utility: _python.ts (spawn, JSON stdio, venv detection)
          </span>
        </div>
      </div>

      {/* Architecture Notes */}
      <div className="mt-4 p-3 rounded-lg bg-cyber-surface/50 border border-border text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">🔍 Key Architecture Decisions:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>No Flask/FastAPI - Python runs as subprocesses from Next.js API routes</li>
          <li>JSON over stdin/stdout for type-safe communication</li>
          <li>Automatic .venv Python detection for local development</li>
          <li>Fallback to heuristics when Python unavailable (graceful degradation)</li>
          <li>Tesseract.js runs entirely in browser - no server load for OCR</li>
          <li>Ensemble scoring combines ML models with heuristic patterns</li>
        </ul>
      </div>
    </div>
  )
}