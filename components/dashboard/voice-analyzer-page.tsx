'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Upload, Play, Pause, Square, AlertTriangle, CheckCircle, Volume2, AudioWaveform, Zap, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

type AnalysisState = 'idle' | 'recording' | 'analyzing' | 'complete'

interface VoiceAnalysisResult {
  score: number
  verdict: 'HIGH_RISK' | 'SUSPICIOUS' | 'SAFE'
  flags: {
    label: string
    detected: boolean
    confidence: number
  }[]
  transcript: string
  emotionalManipulation: number
  urgencyScore: number
  deepfakeScore: number
}

const MOCK_RESULT: VoiceAnalysisResult = {
  score: 87,
  verdict: 'HIGH_RISK',
  flags: [
    { label: 'Authority Impersonation', detected: true, confidence: 94 },
    { label: 'Urgency Pressure', detected: true, confidence: 88 },
    { label: 'Financial Request', detected: true, confidence: 92 },
    { label: 'Threat/Fear Tactics', detected: true, confidence: 79 },
    { label: 'Personal Info Request', detected: true, confidence: 85 },
    { label: 'Suspicious Background Noise', detected: false, confidence: 23 },
  ],
  transcript: '"Ini adalah panggilan dari PDRM Bukit Aman. Akaun bank awak telah digunakan untuk penipuan wang. Awak kena transfer semua duit ke akaun selamat kami dalam 30 minit atau awak akan ditangkap..."',
  emotionalManipulation: 91,
  urgencyScore: 95,
  deepfakeScore: 12
}

export function VoiceAnalyzerPage() {
  const [state, setState] = useState<AnalysisState>('idle')
  const [result, setResult] = useState<VoiceAnalysisResult | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>(Array(50).fill(0.1))
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Simulate audio level visualization
  useEffect(() => {
    if (state === 'recording') {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.2)
        setWaveformData(prev => [...prev.slice(1), Math.random() * 0.8 + 0.2])
        setRecordingTime(t => t + 1)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [state])

  const handleStartRecording = () => {
    setState('recording')
    setRecordingTime(0)
    setWaveformData(Array(50).fill(0.1))
  }

  const handleStopRecording = () => {
    setState('analyzing')
    // Simulate analysis
    setTimeout(() => {
      setResult(MOCK_RESULT)
      setState('complete')
    }, 3000)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setState('analyzing')
      setTimeout(() => {
        setResult(MOCK_RESULT)
        setState('complete')
      }, 3000)
    }
  }

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setRecordingTime(0)
    setWaveformData(Array(50).fill(0.1))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 600)
    const secs = Math.floor((seconds % 600) / 10)
    const ms = seconds % 10
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-purple/20">
              <Mic className="w-6 h-6 text-cyber-purple" />
            </div>
            Voice Scam Analyzer
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-powered phone call analysis for detecting scam patterns
          </p>
        </div>
      </div>

      {/* Unique Feature Badge */}
      <div className="bg-gradient-to-r from-cyber-purple/20 to-cyber-cyan/20 border border-cyber-purple/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-purple/30">
            <Brain className="w-5 h-5 text-cyber-purple" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Malaysia&apos;s First Voice Scam AI</h4>
            <p className="text-sm text-muted-foreground">
              Analyzes phone call recordings for Macau scam patterns, authority impersonation, 
              emotional manipulation tactics, and even AI-generated deepfake voices.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recording/Upload Panel */}
        <div className="bg-cyber-card border border-border rounded-xl p-6">
          {state === 'idle' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-cyber-purple/20 animate-pulse" />
                  <div className="absolute inset-4 rounded-full bg-cyber-purple/30" />
                  <button
                    onClick={handleStartRecording}
                    className="absolute inset-8 rounded-full bg-cyber-purple hover:bg-cyber-purple/90 transition-colors flex items-center justify-center"
                  >
                    <Mic className="w-8 h-8 text-white" />
                  </button>
                </div>
                <p className="text-foreground font-medium">Tap to Start Recording</p>
                <p className="text-sm text-muted-foreground">Record the suspicious call audio</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-cyber-card px-4 text-sm text-muted-foreground">or</span>
                </div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-border rounded-xl hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5 transition-all flex items-center justify-center gap-3"
              >
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">Upload Audio File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {state === 'recording' && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div 
                    className="absolute inset-0 rounded-full bg-cyber-red/20 transition-transform"
                    style={{ transform: `scale(${1 + audioLevel * 0.3})` }}
                  />
                  <div className="absolute inset-4 rounded-full bg-cyber-red/30" />
                  <div className="absolute inset-8 rounded-full bg-cyber-red flex items-center justify-center">
                    <Mic className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
                <p className="text-3xl font-mono font-bold text-cyber-red mb-2">
                  {formatTime(recordingTime)}
                </p>
                <p className="text-sm text-muted-foreground">Recording...</p>
              </div>

              {/* Waveform visualization */}
              <div className="flex items-center justify-center gap-0.5 h-16">
                {waveformData.map((level, i) => (
                  <div
                    key={i}
                    className="w-1 bg-cyber-red rounded-full transition-all duration-100"
                    style={{ height: `${level * 100}%` }}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-lg bg-background border border-border text-foreground hover:bg-sidebar-accent transition-colors flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleStopRecording}
                  className="flex-1 py-3 rounded-lg bg-cyber-red text-white font-medium hover:bg-cyber-red/90 transition-colors flex items-center justify-center gap-2"
                >
                  <MicOff className="w-4 h-4" />
                  Stop & Analyze
                </button>
              </div>
            </div>
          )}

          {state === 'analyzing' && (
            <div className="py-12 text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-cyber-purple/30" />
                <div className="absolute inset-0 rounded-full border-4 border-cyber-purple border-t-transparent animate-spin" />
                <div className="absolute inset-4 rounded-full bg-cyber-purple/20 flex items-center justify-center">
                  <AudioWaveform className="w-8 h-8 text-cyber-purple" />
                </div>
              </div>
              <div>
                <p className="text-foreground font-medium mb-2">Analyzing Audio...</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="animate-pulse">Converting speech to text...</p>
                  <p className="animate-pulse delay-150">Detecting emotional patterns...</p>
                  <p className="animate-pulse delay-300">Checking deepfake signatures...</p>
                </div>
              </div>
            </div>
          )}

          {state === 'complete' && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">Audio Analyzed</h4>
                <button
                  onClick={handleReset}
                  className="text-sm text-cyber-cyan hover:underline"
                >
                  Analyze New
                </button>
              </div>

              {/* Playback controls */}
              <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 rounded-full bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple/30 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <div className="flex-1 h-2 bg-cyber-card rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-cyber-purple rounded-full" />
                </div>
                <span className="text-sm font-mono text-muted-foreground">0:45 / 2:15</span>
              </div>

              {/* Transcript */}
              <div className="p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Transcript</p>
                <p className="text-sm text-foreground italic">{result.transcript}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Verdict */}
              <div className={cn(
                'border rounded-xl p-5',
                result.verdict === 'HIGH_RISK' ? 'bg-cyber-red/10 border-cyber-red/30' :
                result.verdict === 'SUSPICIOUS' ? 'bg-cyber-amber/10 border-cyber-amber/30' :
                'bg-cyber-green/10 border-cyber-green/30'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result.verdict === 'HIGH_RISK' ? (
                      <AlertTriangle className="w-8 h-8 text-cyber-red" />
                    ) : result.verdict === 'SUSPICIOUS' ? (
                      <AlertTriangle className="w-8 h-8 text-cyber-amber" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-cyber-green" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Verdict</p>
                      <p className={cn(
                        'text-xl font-bold',
                        result.verdict === 'HIGH_RISK' ? 'text-cyber-red' :
                        result.verdict === 'SUSPICIOUS' ? 'text-cyber-amber' : 'text-cyber-green'
                      )}>
                        {result.verdict.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-mono font-bold" style={{
                      color: result.score >= 70 ? '#ff4060' : result.score >= 40 ? '#ffaa00' : '#00e67a'
                    }}>
                      {result.score}
                    </p>
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                  </div>
                </div>
              </div>

              {/* Special Scores */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-cyber-card border border-border rounded-xl p-4 text-center">
                  <Volume2 className="w-5 h-5 text-cyber-amber mx-auto mb-2" />
                  <p className="text-2xl font-mono font-bold text-cyber-amber">{result.emotionalManipulation}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Manipulation</p>
                </div>
                <div className="bg-cyber-card border border-border rounded-xl p-4 text-center">
                  <Zap className="w-5 h-5 text-cyber-red mx-auto mb-2" />
                  <p className="text-2xl font-mono font-bold text-cyber-red">{result.urgencyScore}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Urgency</p>
                </div>
                <div className="bg-cyber-card border border-border rounded-xl p-4 text-center">
                  <Brain className="w-5 h-5 text-cyber-purple mx-auto mb-2" />
                  <p className="text-2xl font-mono font-bold text-cyber-green">{result.deepfakeScore}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Deepfake</p>
                </div>
              </div>

              {/* Detection Flags */}
              <div className="bg-cyber-card border border-border rounded-xl p-5">
                <h4 className="font-semibold text-foreground mb-4">Detection Flags</h4>
                <div className="space-y-3">
                  {result.flags.map((flag, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {flag.detected ? (
                          <AlertTriangle className="w-4 h-4 text-cyber-red" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-cyber-green" />
                        )}
                        <span className={cn(
                          'text-sm',
                          flag.detected ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {flag.label}
                        </span>
                      </div>
                      <span className={cn(
                        'text-sm font-mono',
                        flag.detected ? 'text-cyber-red' : 'text-cyber-green'
                      )}>
                        {flag.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-lg bg-cyber-red/20 border border-cyber-red/30 text-cyber-red font-medium hover:bg-cyber-red/30 transition-colors">
                  Report to PDRM
                </button>
                <button className="flex-1 py-3 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/30 text-cyber-cyan font-medium hover:bg-cyber-cyan/30 transition-colors">
                  Share Warning
                </button>
              </div>
            </>
          ) : (
            <div className="bg-cyber-card border border-border rounded-xl p-8 text-center">
              <div className="p-4 rounded-full bg-cyber-purple/20 w-fit mx-auto mb-4">
                <Mic className="w-8 h-8 text-cyber-purple" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Record or Upload Audio</h4>
              <p className="text-sm text-muted-foreground">
                Record a suspicious phone call or upload an audio file to analyze for scam patterns
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
