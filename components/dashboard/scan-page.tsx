'use client'

import { useState, useCallback, useRef } from 'react'
import { MessageSquare, Mail, Link2, Camera, Zap, ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SAMPLE_MESSAGES, ANALYSIS_STEPS, type ScanResult, type SampleMessage } from '@/lib/sample-data'
import {
  buildScanResultFromAnalysis,
  fetchSmsClassifierScore,
  fetchUrlClassifierScore,
  fetchEmailClassifierScore,
} from '@/lib/ml-client'
import { heuristicNlpFallback } from '@/lib/scan-heuristics'
import { useDashboardStore } from '@/lib/dashboard-store'
import { ScanResultDisplay } from './scan-result'

const inputTabs = [
  { id: 'sms', label: 'SMS/WhatsApp', icon: MessageSquare },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'url', label: 'URL/Link', icon: Link2 },
  { id: 'screenshot', label: 'Screenshot OCR', icon: Camera },
]

async function runOcrOnFile(file: File): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  try {
    const {
      data: { text },
    } = await worker.recognize(file)
    return text.trim()
  } finally {
    await worker.terminate()
  }
}

// Helper function to check if text contains a URL
function containsUrl(text: string): boolean {
  const urlPattern = /https?:\/\/|www\.|bit\.ly|tinyurl|goo\.gl|\.com\/|\.net\/|\.org\//i
  return urlPattern.test(text)
}

// ✅ NEW: Extract URLs from text
function extractUrlsFromText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>&"']+)/gi
  const matches = text.match(urlRegex)
  return matches || []
}

// ✅ NEW: Get the first/main URL for classification
function getMainUrlFromText(text: string): string | null {
  const urls = extractUrlsFromText(text)
  if (urls.length === 0) return null
  
  // Clean up the URL (remove trailing punctuation)
  let url = urls[0]
  url = url.replace(/[.,;:!?)$]+$/, '')
  return url
}

export function ScanPage() {
  const [inputType, setInputType] = useState('sms')
  const [message, setMessage] = useState('')
  const [selectedSample, setSelectedSample] = useState<SampleMessage | null>(null)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<ScanResult | null>(null)
  const addScanResult = useDashboardStore((state) => state.addScanResult)

  const handleSampleClick = useCallback((sample: SampleMessage) => {
    setMessage(sample.message)
    setSelectedSample(sample)
    setResult(null)
  }, [])

  const canAnalyze =
    message.trim().length > 0 || (inputType === 'screenshot' && screenshotFile !== null)

  const runAnalysis = useCallback(async () => {
    if (!canAnalyze) return

    setIsAnalyzing(true)
    setResult(null)
    setCurrentStep(0)

    let textForAnalysis = message.trim()

    if (inputType === 'screenshot' && screenshotFile) {
      textForAnalysis = await runOcrOnFile(screenshotFile)
      setMessage(textForAnalysis)
    }

    if (!textForAnalysis) {
      setIsAnalyzing(false)
      return
    }

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setCurrentStep(i)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    let nlpScore = 0
    let urlModelScore: number | null = null
    let emailModelScore: number | null = null
    let mlNote = ''

    // Check if text contains a URL
    const hasUrl = containsUrl(textForAnalysis)
    const extractedUrl = hasUrl ? getMainUrlFromText(textForAnalysis) : null

    // ✅ FIXED: SMS Tab - Extract URL if present
    if (inputType === 'sms') {
      if (hasUrl && extractedUrl) {
        const [sms, url] = await Promise.all([
          fetchSmsClassifierScore(textForAnalysis),
          fetchUrlClassifierScore(extractedUrl),
        ])
        nlpScore = sms.nlpScore
        urlModelScore = url.urlScore
        mlNote = sms.mlNote + ' ' + url.mlNote
      } else {
        const sms = await fetchSmsClassifierScore(textForAnalysis)
        nlpScore = sms.nlpScore
        mlNote = sms.mlNote
      }
      
    // ✅ FIXED: Email Tab - Extract URL if present
    } else if (inputType === 'email') {
      if (hasUrl && extractedUrl) {
        const [email, url] = await Promise.all([
          fetchEmailClassifierScore(textForAnalysis),
          fetchUrlClassifierScore(extractedUrl),
        ])
        emailModelScore = email.emailScore
        urlModelScore = url.urlScore
        mlNote = email.mlNote + ' ' + url.mlNote
      } else {
        const email = await fetchEmailClassifierScore(textForAnalysis)
        emailModelScore = email.emailScore
        mlNote = email.mlNote
      }
      
    // ✅ FIXED: URL Tab - ONLY use URL classifier on the URL itself
    } else if (inputType === 'url') {
      // For URL tab, the textForAnalysis should already be a URL
      // But just in case, extract URL if the user pasted extra text
      const urlToAnalyze = extractedUrl || textForAnalysis
      const url = await fetchUrlClassifierScore(urlToAnalyze)
      urlModelScore = url.urlScore
      mlNote = url.mlNote
      // nlpScore stays 0 - no SMS/email classifier for URLs
      
    // ✅ FIXED: Screenshot Tab - Extract URL if present in OCR text
    } else if (inputType === 'screenshot') {
      if (hasUrl && extractedUrl) {
        const [sms, url] = await Promise.all([
          fetchSmsClassifierScore(textForAnalysis),
          fetchUrlClassifierScore(extractedUrl),
        ])
        nlpScore = sms.nlpScore
        urlModelScore = url.urlScore
        mlNote = (screenshotFile ? 'OCR (Tesseract.js). ' : '') + sms.mlNote + ' ' + url.mlNote
      } else {
        const sms = await fetchSmsClassifierScore(textForAnalysis)
        nlpScore = sms.nlpScore
        mlNote = (screenshotFile ? 'OCR (Tesseract.js). ' : '') + sms.mlNote
      }
      
    } else {
      nlpScore = heuristicNlpFallback(textForAnalysis)
      mlNote = 'Heuristic NLP only. '
    }

    const scanResult = buildScanResultFromAnalysis({
      message: textForAnalysis,
      inputType,
      nlpScore,
      urlModelScore,
      emailModelScore,
      mlNote,
    })

    setResult(scanResult)
    addScanResult(scanResult)
    setIsAnalyzing(false)
  }, [canAnalyze, message, inputType, screenshotFile, addScanResult])

  const clearResult = useCallback(() => {
    setResult(null)
    setMessage('')
    setSelectedSample(null)
    setScreenshotFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {inputTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setInputType(tab.id)
              setResult(null)
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              inputType === tab.id
                ? 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 glow-cyan-sm'
                : 'bg-cyber-card text-muted-foreground hover:text-foreground border border-transparent hover:border-border'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {inputType === 'screenshot' && (
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                setScreenshotFile(f)
                setSelectedSample(null)
                setResult(null)
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-card border border-border text-sm hover:border-cyber-cyan/40"
            >
              <ImagePlus className="w-4 h-4" />
              {screenshotFile ? screenshotFile.name : 'Choose screenshot image'}
            </button>
            {screenshotFile && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={() => {
                  setScreenshotFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                Clear image
              </button>
            )}
          </div>
        )}
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            setSelectedSample(null)
            setResult(null)
          }}
          placeholder={
            inputType === 'screenshot'
              ? 'Optional: paste any extra text, or rely on OCR from the image above…'
              : inputType === 'email'
              ? 'Paste suspicious email content here (including subject line) for analysis...'
              : inputType === 'url'
              ? 'Paste a suspicious URL or link here for analysis...'
              : 'Paste suspicious message here for analysis...'
          }
          className="w-full h-40 px-4 py-3 rounded-lg bg-cyber-surface border border-border text-foreground font-mono text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-cyber-cyan/50 focus:border-cyber-cyan/50 transition-all"
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Quick Samples</span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_MESSAGES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSampleClick(sample)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border',
                selectedSample?.id === sample.id
                  ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan'
                  : 'bg-cyber-card border-border text-muted-foreground hover:text-foreground hover:border-cyber-cyan/30'
              )}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sample.dotColor }} />
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={runAnalysis}
        disabled={isAnalyzing || !canAnalyze}
        className={cn(
          'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg text-base font-bold uppercase tracking-wider transition-all duration-200 border-2',
          isAnalyzing
            ? 'bg-cyber-cyan/10 border-cyber-cyan/50 text-cyber-cyan cursor-wait'
            : canAnalyze
              ? 'bg-transparent border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10 glow-cyan cursor-pointer'
              : 'bg-cyber-card border-border text-muted-foreground cursor-not-allowed'
        )}
      >
        <Zap className={cn('w-5 h-5', isAnalyzing && 'animate-pulse')} />
        {isAnalyzing ? 'Analyzing...' : 'Run Threat Analysis'}
      </button>

      {isAnalyzing && (
        <div className="space-y-3 p-4 rounded-lg bg-cyber-card border border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-cyber-cyan border-t-transparent animate-spin" />
            <span className="text-sm font-mono text-cyber-cyan">{ANALYSIS_STEPS[currentStep]}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-cyber-surface overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan transition-all duration-300 ease-out"
              style={{ width: `${((currentStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>
              Step {currentStep + 1}/{ANALYSIS_STEPS.length}
            </span>
            <span>{Math.round(((currentStep + 1) / ANALYSIS_STEPS.length) * 100)}%</span>
          </div>
        </div>
      )}

      {result && !isAnalyzing && <ScanResultDisplay result={result} onClear={clearResult} />}
    </div>
  )
}