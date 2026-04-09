// components/dashboard/system-info-page.tsx
'use client'

import { useEffect, useState } from 'react'
import { 
  Code2, Gauge, Database, Scale, GitBranch, FileText, ExternalLink, 
  Server, Cpu, ChevronRight, CheckCircle2, BarChart3, Terminal, 
  AlertCircle, Mail, Link 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  SYSTEM_INFO, 
  DATASETS, 
  MODEL_METRICS, 
  PIPELINE_ARCHITECTURE,
  SMS_MODEL_METRICS,
  URL_MODEL_METRICS,
  EMAIL_MODEL_METRICS
} from '@/lib/sample-data'
import { IntegrationArchitecture } from '@/components/dashboard/integration-architecture'

function AnimatedWeightBar({ weight, color, delay }: { weight: number; color: string; delay: number }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(weight)
    }, delay)
    return () => clearTimeout(timer)
  }, [weight, delay])

  return (
    <div className="w-full h-3 rounded-full bg-cyber-surface overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${width}%`,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}50`
        }}
      />
    </div>
  )
}

function MetricCard({ label, value, color, subtitle }: { label: string; value: string | number; color: string; subtitle?: string }) {
  return (
    <div className="p-3 rounded-lg bg-cyber-surface border border-border">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-mono font-bold" style={{ color }}>{value}</div>
      {subtitle && <div className="text-[10px] text-muted-foreground mt-1">{subtitle}</div>}
    </div>
  )
}

function ModelMetricsCard({ title, icon: Icon, metrics, color }: { 
  title: string; 
  icon: React.ElementType; 
  metrics: {
    training: any;
    performance: any;
    confusionMatrix: any;
    perClassMetrics?: any[];
  };
  color: string;
}) {
  return (
    <div className="p-5 rounded-xl bg-cyber-card border border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color }}>
          {title}
        </h3>
      </div>

      {/* Training Configuration */}
      <div className="mb-4">
        <h4 className="text-xs text-muted-foreground mb-2">Training Configuration</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MetricCard 
            label="Model" 
            value={metrics.training.modelType.split(' + ')[0]} 
            color={color}
            subtitle={metrics.training.modelType.split(' + ')[1]}
          />
          <MetricCard label="Samples" value={metrics.training.nSamples.toLocaleString()} color={color} />
          <MetricCard label="Train/Test" value={`${metrics.training.nTrain}/${metrics.training.nTest}`} color={color} />
          <MetricCard 
            label="5-fold CV" 
            value={`${(metrics.training.cvAccuracyMean * 100).toFixed(1)}%`} 
            color={color}
            subtitle={`±${(metrics.training.cvAccuracyStd * 100).toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-4">
        <h4 className="text-xs text-muted-foreground mb-2">Performance Metrics</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MetricCard label="Accuracy" value={`${(metrics.performance.accuracy * 100).toFixed(2)}%`} color="#00e67a" />
          <MetricCard label="Precision" value={`${(metrics.performance.precision * 100).toFixed(2)}%`} color="#00e67a" />
          <MetricCard label="Recall" value={`${(metrics.performance.recall * 100).toFixed(2)}%`} color="#00e67a" />
          <MetricCard label="F1 Score" value={metrics.performance.f1Score.toFixed(4)} color="#00e67a" />
          <MetricCard label="AUC-ROC" value={metrics.performance.auc.toFixed(4)} color="#00d4ff" />
          <MetricCard 
            label="False Positive" 
            value={`${(metrics.performance.falsePositiveRate * 100).toFixed(2)}%`} 
            color="#ffaa00" 
          />
          <MetricCard 
            label="False Negative" 
            value={`${(metrics.performance.falseNegativeRate * 100).toFixed(2)}%`} 
            color="#ff4060" 
          />
        </div>
      </div>

      {/* Confusion Matrix */}
      <div>
        <h4 className="text-xs text-muted-foreground mb-2">Confusion Matrix</h4>
        <div className="max-w-sm mx-auto">
          <div className="grid grid-cols-3 gap-1 text-center">
            <div></div>
            <div className="text-[10px] text-muted-foreground py-1">Predicted+</div>
            <div className="text-[10px] text-muted-foreground py-1">Predicted-</div>
            
            <div className="text-[10px] text-muted-foreground py-1 text-right pr-1">Actual+</div>
            <div className="p-2 rounded-lg bg-cyber-green/20 border border-cyber-green/40">
              <div className="text-[10px] text-muted-foreground">TP</div>
              <div className="text-sm font-mono font-bold text-cyber-green">{metrics.confusionMatrix.truePositive}</div>
            </div>
            <div className="p-2 rounded-lg bg-cyber-red/20 border border-cyber-red/40">
              <div className="text-[10px] text-muted-foreground">FN</div>
              <div className="text-sm font-mono font-bold text-cyber-red">{metrics.confusionMatrix.falseNegative}</div>
            </div>
            
            <div className="text-[10px] text-muted-foreground py-1 text-right pr-1">Actual-</div>
            <div className="p-2 rounded-lg bg-cyber-amber/20 border border-cyber-amber/40">
              <div className="text-[10px] text-muted-foreground">FP</div>
              <div className="text-sm font-mono font-bold text-cyber-amber">{metrics.confusionMatrix.falsePositive}</div>
            </div>
            <div className="p-2 rounded-lg bg-cyber-green/20 border border-cyber-green/40">
              <div className="text-[10px] text-muted-foreground">TN</div>
              <div className="text-sm font-mono font-bold text-cyber-green">{metrics.confusionMatrix.trueNegative}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Class Metrics */}
      {metrics.perClassMetrics && metrics.perClassMetrics.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs text-muted-foreground mb-2">Per-Class Performance</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1 px-2">Class</th>
                  <th className="text-right py-1 px-2">Precision</th>
                  <th className="text-right py-1 px-2">Recall</th>
                  <th className="text-right py-1 px-2">F1</th>
                  <th className="text-right py-1 px-2">Support</th>
                </tr>
              </thead>
              <tbody>
                {metrics.perClassMetrics.map((metric: any, i: number) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        metric.class === 'SPAM' || metric.class === 'PHISHING' 
                          ? 'bg-cyber-red/20 text-cyber-red' 
                          : 'bg-cyber-green/20 text-cyber-green'
                      }`}>
                        {metric.class}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-right font-mono">{(metric.precision * 100).toFixed(1)}%</td>
                    <td className="py-1 px-2 text-right font-mono">{(metric.recall * 100).toFixed(1)}%</td>
                    <td className="py-1 px-2 text-right font-mono" style={{ color }}>{metric.f1.toFixed(3)}</td>
                    <td className="py-1 px-2 text-right font-mono text-muted-foreground">{metric.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export function SystemInfoPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'datasets' | 'metrics' | 'api'>('overview')
  const [selectedModel, setSelectedModel] = useState<'sms' | 'url' | 'email'>('sms')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">System Architecture</h2>
        <p className="text-sm text-muted-foreground">Technical specifications, datasets, and model performance</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Cpu },
          { id: 'datasets', label: 'Datasets', icon: Database },
          { id: 'metrics', label: 'Model Metrics', icon: BarChart3 },
          { id: 'api', label: 'API Endpoints', icon: Server }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-cyber-cyan/10 text-cyber-cyan border-b-2 border-cyber-cyan'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <IntegrationArchitecture />

          {/* Pipeline Architecture Diagram */}
          <div className="p-5 rounded-xl bg-cyber-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-cyber-cyan/10">
                <GitBranch className="w-5 h-5 text-cyber-cyan" />
              </div>
              <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider">End-to-End Pipeline Architecture</h3>
            </div>
            
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-4 py-4">
                {PIPELINE_ARCHITECTURE.stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center gap-2">
                    <div 
                      className="p-4 rounded-xl border-2 min-w-[140px]"
                      style={{ 
                        borderColor: `${stage.color}40`,
                        backgroundColor: `${stage.color}08`
                      }}
                    >
                      <div className="text-xs font-mono font-bold mb-1" style={{ color: stage.color }}>
                        {stage.name}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {stage.description}
                      </div>
                      <div className="space-y-1">
                        {stage.components.map((comp, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs">
                            <CheckCircle2 className="w-3 h-3" style={{ color: stage.color }} />
                            <span className="text-foreground/80">{comp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {index < PIPELINE_ARCHITECTURE.stages.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 hidden lg:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Tech Stack */}
            <div className="p-5 rounded-xl bg-cyber-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyber-cyan/10">
                  <Code2 className="w-5 h-5 text-cyber-cyan" />
                </div>
                <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider">Tech Stack</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {SYSTEM_INFO.techStack.map((tech, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono bg-cyber-surface text-foreground border border-border"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Model Performance Summary */}
            <div className="p-5 rounded-xl bg-cyber-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyber-green/10">
                  <Gauge className="w-5 h-5 text-cyber-green" />
                </div>
                <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider">Performance Summary</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {SYSTEM_INFO.performance.map((metric, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium border"
                    style={{
                      backgroundColor: `${metric.color}15`,
                      borderColor: `${metric.color}40`,
                      color: metric.color
                    }}
                  >
                    {metric.label}: {metric.value}
                  </span>
                ))}
              </div>
            </div>

            {/* Datasets Summary */}
            <div className="p-5 rounded-xl bg-cyber-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyber-purple/10">
                  <Database className="w-5 h-5 text-cyber-purple" />
                </div>
                <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider">Training Data</h3>
              </div>
              <div className="space-y-2">
                {SYSTEM_INFO.datasets.map((dataset, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <span className="text-sm text-foreground">{dataset.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({dataset.source})</span>
                    </div>
                    <span className="text-xs font-mono text-cyber-cyan">{dataset.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scoring Weights */}
            <div className="p-5 rounded-xl bg-cyber-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyber-amber/10">
                  <Scale className="w-5 h-5 text-cyber-amber" />
                </div>
                <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider">Ensemble Weights</h3>
              </div>
              <div className="space-y-4">
                {SYSTEM_INFO.weights.map((item, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-mono font-bold" style={{ color: item.color }}>{item.weight}</span>
                    </div>
                    <AnimatedWeightBar weight={parseInt(item.weight)} color={item.color} delay={i * 150} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Datasets Tab */}
      {activeTab === 'datasets' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cyber-amber/10 border border-cyber-amber/30">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-cyber-amber flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-cyber-amber mb-1">Dataset Citation Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  All datasets are from public sources (UCI ML Repository, HuggingFace). 
                  Proper attribution is included below for each dataset as per hackathon rules.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {DATASETS.map((dataset, i) => (
              <div key={i} className="p-5 rounded-xl bg-cyber-card border border-border">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground">{dataset.name}</h4>
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyber-purple/20 text-cyber-purple">
                        {dataset.source}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{dataset.description}</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Samples</div>
                        <div className="text-sm font-mono text-cyber-cyan">{dataset.samples}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Year</div>
                        <div className="text-sm font-mono text-foreground">{dataset.year}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">License</div>
                        <div className="text-sm font-mono text-cyber-green">{dataset.license}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Features</div>
                        <div className="text-sm text-foreground">{dataset.features}</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-cyber-surface border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Citation:</div>
                      <p className="text-xs font-mono text-foreground/80">{dataset.citation}</p>
                    </div>
                  </div>
                  
                  <a
                    href={dataset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-cyan/10 text-cyber-cyan text-sm hover:bg-cyber-cyan/20 transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Source
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Model Selector Tabs - Added Email */}
          <div className="flex gap-2 border-b border-border pb-2 flex-wrap">
            <button
              onClick={() => setSelectedModel('sms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                selectedModel === 'sms'
                  ? 'bg-cyber-cyan/10 text-cyber-cyan border-b-2 border-cyber-cyan'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="w-4 h-4" />
              SMS Spam Classifier
            </button>
            <button
              onClick={() => setSelectedModel('url')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                selectedModel === 'url'
                  ? 'bg-cyber-cyan/10 text-cyber-cyan border-b-2 border-cyber-cyan'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Link className="w-4 h-4" />
              URL Phishing Detector
            </button>
            {/* NEW: Email Model Button */}
            <button
              onClick={() => setSelectedModel('email')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                selectedModel === 'email'
                  ? 'bg-cyber-cyan/10 text-cyber-cyan border-b-2 border-cyber-cyan'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email Phishing Detector
            </button>
          </div>

          {/* Validation Notice */}
          <div className="p-4 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-cyber-cyan flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-cyber-cyan">Validated baseline:</span> figures below are from reproducible
                  Scikit-learn pipelines on public datasets. Re-run 
                  <code className="text-xs bg-cyber-surface px-1 rounded mx-1">python training/train_uci_sms_baseline.py</code>,
                  <code className="text-xs bg-cyber-surface px-1 rounded mx-1">python training/train_url_baseline.py</code>
                  and
                  <code className="text-xs bg-cyber-surface px-1 rounded mx-1">python training/train_email_baseline.py</code>
                  to regenerate metrics.
                </p>
              </div>
            </div>
          </div>

          {/* SMS Model Metrics */}
          {selectedModel === 'sms' && (
            <ModelMetricsCard 
              title="SMS Spam Classifier"
              icon={Mail}
              metrics={SMS_MODEL_METRICS}
              color="#9d78ff"
            />
          )}

          {/* URL Model Metrics */}
          {selectedModel === 'url' && (
            <ModelMetricsCard 
              title="URL Phishing Detector"
              icon={Link}
              metrics={URL_MODEL_METRICS}
              color="#00d4ff"
            />
          )}

          {/* NEW: Email Model Metrics */}
          {selectedModel === 'email' && (
            <ModelMetricsCard 
              title="Email Phishing Detector"
              icon={Mail}
              metrics={EMAIL_MODEL_METRICS}
              color="#00e67a"
            />
          )}

          {/* Model Comparison Summary - Updated with Email */}
          <div className="p-5 rounded-xl bg-cyber-card border border-border">
            <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider mb-4">Model Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Metric</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">SMS Model</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">URL Model</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Email Model</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3">Accuracy</td>
                    <td className="py-2 px-3 text-right font-mono text-cyber-green">
                      {(SMS_MODEL_METRICS.performance.accuracy * 100).toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-cyber-green">
                      {(URL_MODEL_METRICS.performance.accuracy * 100).toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-cyber-green">
                      {(EMAIL_MODEL_METRICS.performance.accuracy * 100).toFixed(2)}%
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3">Precision (weighted)</td>
                    <td className="py-2 px-3 text-right font-mono">{(SMS_MODEL_METRICS.performance.precision * 100).toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right font-mono">{(URL_MODEL_METRICS.performance.precision * 100).toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right font-mono">{(EMAIL_MODEL_METRICS.performance.precision * 100).toFixed(2)}%</td>
                   </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3">Recall (weighted)</td>
                    <td className="py-2 px-3 text-right font-mono">{(SMS_MODEL_METRICS.performance.recall * 100).toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right font-mono">{(URL_MODEL_METRICS.performance.recall * 100).toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right font-mono">{(EMAIL_MODEL_METRICS.performance.recall * 100).toFixed(2)}%</td>
                   </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3">F1 Score (weighted)</td>
                    <td className="py-2 px-3 text-right font-mono">{SMS_MODEL_METRICS.performance.f1Score.toFixed(4)}</td>
                    <td className="py-2 px-3 text-right font-mono">{URL_MODEL_METRICS.performance.f1Score.toFixed(4)}</td>
                    <td className="py-2 px-3 text-right font-mono">{EMAIL_MODEL_METRICS.performance.f1Score.toFixed(4)}</td>
                   </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3">AUC-ROC</td>
                    <td className="py-2 px-3 text-right font-mono text-cyber-cyan">{SMS_MODEL_METRICS.performance.auc.toFixed(4)}</td>
                    <td className="py-2 px-3 text-right font-mono text-cyber-cyan">{URL_MODEL_METRICS.performance.auc.toFixed(4)}</td>
                    <td className="py-2 px-3 text-right font-mono text-cyber-cyan">{EMAIL_MODEL_METRICS.performance.auc.toFixed(4)}</td>
                   </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3">Training Samples</td>
                    <td className="py-2 px-3 text-right font-mono">{SMS_MODEL_METRICS.training.nSamples.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono">{URL_MODEL_METRICS.training.nSamples.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono">{EMAIL_MODEL_METRICS.training.nSamples.toLocaleString()}</td>
                   </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* API Endpoints Tab */}
      {activeTab === 'api' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-cyber-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-cyber-cyan/10">
                <Server className="w-5 h-5 text-cyber-cyan" />
              </div>
              <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider">Local API Routes (Next.js)</h3>
            </div>
            
            <div className="space-y-3">
              {PIPELINE_ARCHITECTURE.apiEndpoints.map((endpoint, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-cyber-surface border border-border">
                  <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                    endpoint.method === 'GET'
                      ? 'bg-cyber-green/20 text-cyber-green'
                      : endpoint.method === 'CLIENT'
                        ? 'bg-cyber-purple/20 text-cyber-purple'
                        : 'bg-cyber-cyan/20 text-cyber-cyan'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="font-mono text-sm text-foreground flex-1">{endpoint.path}</code>
                  <span className="text-sm text-muted-foreground hidden sm:block">{endpoint.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Example Request */}
          <div className="p-5 rounded-xl bg-cyber-card border border-border">
            <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider mb-4">Example Request (Local Dev)</h3>
            <div className="p-4 rounded-lg bg-[#0d1117] border border-border overflow-x-auto">
              <pre className="text-sm font-mono text-foreground">
{`# Start Next.js dev server
npm run dev

# SMS Classification
curl -X POST http://localhost:3000/api/scan/text \\
  -H "Content-Type: application/json" \\
  -d '{"text": "URGENT: Your bank account has been frozen. Call 03-12345678 immediately."}'

# URL Classification
curl -X POST http://localhost:3000/api/scan/url \\
  -H "Content-Type: application/json" \\
  -d '{"url": "http://maybnk-secure.tk/login"}'

# Email Classification
curl -X POST http://localhost:3000/api/scan/email \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Subject: URGENT - Your Netflix Subscription Expired"}'`}
              </pre>
            </div>
          </div>

          {/* Example Response */}
          <div className="p-5 rounded-xl bg-cyber-card border border-border">
            <h3 className="text-sm font-semibold text-cyber-cyan uppercase tracking-wider mb-4">Example Response</h3>
            <div className="p-4 rounded-lg bg-[#0d1117] border border-border overflow-x-auto">
              <pre className="text-sm font-mono text-foreground">
{`# SMS Response
{
  "ok": true,
  "label": "spam",
  "spamProbability": 0.994,
  "hamProbability": 0.006,
  "explanation": "Message flagged as spam due to 3 suspicious patterns.",
  "highlights": [...],
  "keywords": ["urgent", "payment", "phone_number"]
}

# URL Response
{
  "ok": true,
  "label": "phishing",
  "phishingProbability": 0.962,
  "benignProbability": 0.038,
  "explanation": "URL flagged as phishing due to suspicious patterns.",
  "highlights": [...],
  "keywords": ["suspicious_tld", "suspicious_keyword"]
}

# Email Response
{
  "ok": true,
  "label": "phishing",
  "phishingProbability": 0.9696,
  "safeProbability": 0.0304,
  "explanation": "Email flagged as phishing due to suspicious patterns.",
  "highlights": [...],
  "keywords": ["urgent", "payment", "suspicious_link"]
}`}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              <span className="font-semibold text-cyber-cyan">Note:</span> All inference runs locally via Python subprocesses spawned from Next.js API routes.
            </p>
          </div>

          {/* Deployment Note */}
          <div className="p-4 rounded-xl bg-cyber-amber/10 border border-cyber-amber/30">
            <div className="flex items-start gap-3">
              <Terminal className="w-5 h-5 text-cyber-amber flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-cyber-amber mb-1">Deployment Note</h4>
                <p className="text-sm text-muted-foreground">
                  For production deployment on Render/AWS, the Python subprocess pattern works inside Docker containers. 
                  The same <code className="text-xs">predict_sms.py</code>, <code className="text-xs">predict_url.py</code>, and 
                  <code className="text-xs">predict_email.py</code> scripts are called via <code className="text-xs">child_process.spawn()</code> 
                  from Next.js API routes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Built for Malaysia - Protecting citizens from digital fraud
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          GuardAI - Research Project for Hackathon 2026
        </p>
      </div>
    </div>
  )
}