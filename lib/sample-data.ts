// lib/sample-data.ts

import trainingMetrics from '../data/training_metrics.json'
import urlTrainingMetrics from '../data/url_training_metrics.json'

export interface ScanResult {
  id: string
  inputType: string
  message: string
  score: number
  verdict: 'HIGH_RISK' | 'SUSPICIOUS' | 'SAFE'
  scamType: string
  reason: string
  scores: {
    nlp: number
    url: number
    pattern: number
    context: number
  }
  keywords: {
    high: string[]
    medium: string[]
    low: string[]
  }
  timestamp: Date
}

export interface SampleMessage {
  id: string
  name: string
  type: string
  riskLevel: 'HIGH' | 'SAFE'
  dotColor: string
  message: string
}

/** Paste-only demos — scores always come from live models + heuristics when you run analysis. */
export const SAMPLE_MESSAGES: SampleMessage[] = [
  {
    id: 'macau-scam',
    name: 'Macau Scam',
    type: 'Macau Scam',
    riskLevel: 'HIGH',
    dotColor: '#ff4060',
    message:
      'URGENT: Polis DiRaja Malaysia menghubungi anda. Akaun bank anda telah dibekukan kerana kes penipuan. Sila hubungi Inspektor Tan di 012-9876543 dalam masa 24 jam atau anda akan ditangkap. Ini adalah PERINTAH MAHKAMAH.',
  },
  {
    id: 'shopee-fraud',
    name: 'Shopee Fraud',
    type: 'E-Commerce Fraud',
    riskLevel: 'HIGH',
    dotColor: '#ff4060',
    message:
      'Tahniah! Anda telah dipilih sebagai pemenang Shopee Lucky Draw! Hadiah RM5,000 menunggu anda. Transfer RM50 sebagai yuran pemprosesan ke akaun 1234567 Maybank untuk tuntut hadiah anda. Hubungi 011-1234567 segera.',
  },
  {
    id: 'bnm-impersonation',
    name: 'BNM Impersonation',
    type: 'Bank Impersonation',
    riskLevel: 'HIGH',
    dotColor: '#ff4060',
    message:
      'URGENT from Bank Negara Malaysia: Your account has been flagged for suspicious transactions. Verify your identity at http://bnm-verify.xyz/secure immediately. Failure within 2 hours will result in legal action.',
  },
  {
    id: 'phishing-url',
    name: 'Phishing URL',
    type: 'Phishing/URL',
    riskLevel: 'HIGH',
    dotColor: '#ff4060',
    message:
      'Your Maybank2u account requires immediate verification. Click http://maybnk-secure.tk/login to confirm your details. Ignore this and your account will be SUSPENDED within 24 hours.',
  },
  {
    id: 'parcel-scam',
    name: 'Parcel Scam',
    type: 'Parcel/Customs Scam',
    riskLevel: 'HIGH',
    dotColor: '#ff4060',
    message:
      'Notis kastam: Bungkusan anda ditahan di KLIA. Bayar RM35 duti kastam melalui http://pos-my-customs.xyz untuk melepaskan bungkusan. Tamat masa dalam 48 jam.',
  },
  {
    id: 'legit-promo',
    name: 'Legit Promo',
    type: 'Legitimate',
    riskLevel: 'SAFE',
    dotColor: '#00e67a',
    message:
      'Celcom: Dapatkan 5GB data percuma untuk bulan ini! Log masuk ke Celcom Life app dan klik Tawaran Eksklusif. Tawaran sah sehingga 30 April. Hubungi 1111 untuk bantuan.',
  },
  {
    id: 'real-bank-sms',
    name: 'Real Bank SMS',
    type: 'Legitimate',
    riskLevel: 'SAFE',
    dotColor: '#00e67a',
    message:
      'Maybank: RM1,250.00 telah dikreditkan ke akaun anda berakhir 4521 pada 03/04/2026. Baki semasa: RM3,847.60. Jika tidak membuat transaksi ini, hubungi 1-300-88-6688.',
  },
  {
    id: 'email-netflix-phish',
    name: 'Netflix Phishing',
    type: 'Email Phishing',
    riskLevel: 'HIGH',
    dotColor: '#ff4060',
    message: `Subject: URGENT - Your Netflix Subscription Expired\n\nDear Customer,\n\nYour Netflix membership has expired. Please update your payment method to continue watching.\n\nUpdate Payment: http://netflix-update.top/verify\n\nIf we don't hear from you within 48 hours, your account will be deleted.\n\nNetflix Support`,
  },
  {
    id: 'email-amazon-phish',
    name: 'Amazon Phishing',
    type: 'Email Phishing',
    riskLevel: 'HIGH',
    dotColor: '#ff4060',
    message: `Subject: Amazon Order Confirmation #ORD-83291\n\nThank you for your order of iPhone 15 Pro (RM5,899). Track your shipment: http://amazon-tracking.tk\n\nIf you didn't place this order, cancel here: http://amazon-cancel.xyz\n\nAmazon Customer Service`,
  },
  {
    id: 'email-apple-phish',
    name: 'Apple ID Phishing',
    type: 'Email Phishing',
    riskLevel: 'HIGH',
    dotColor: '#ff4060',
    message: `Subject: URGENT - Your Apple ID has been locked\n\nDear Customer,\n\nYour Apple ID has been locked due to multiple failed login attempts. Verify your account immediately within 24 hours or your account will be permanently disabled.\n\nClick here to verify: http://appleid-verify.xyz/secure\n\nApple Support`,
  },
  {
    id: 'email-paypal-phish',
    name: 'PayPal Phishing',
    type: 'Email Phishing',
    riskLevel: 'HIGH',
    dotColor: '#ff4060',
    message: `Subject: Your PayPal account is limited\n\nDear valued member,\n\nWe recently noticed unusual activity on your PayPal account. To avoid permanent limitation, please confirm your identity:\n\nhttps://paypal-secure.icu/confirm/login\n\nSincerely,\nPayPal Security Team`,
  },
  {
    id: 'email-legit-team',
    name: 'Legit Team Email',
    type: 'Legitimate',
    riskLevel: 'SAFE',
    dotColor: '#00e67a',
    message: `Subject: Weekly Team Update\n\nHi team,\n\nHere are the deliverables for this week:\n- Complete user testing by Friday\n- Update documentation\n- Prepare presentation slides\n\nLet me know if any issues.\n\nBest,\nProject Manager`,
  },
  {
    id: 'email-legit-order',
    name: 'Legit Order Confirmation',
    type: 'Legitimate',
    riskLevel: 'SAFE',
    dotColor: '#00e67a',
    message: `Subject: Your Amazon Order Confirmation - #ORD-12345\n\nDear Customer,\n\nThank you for your purchase. Your order will arrive by April 15, 2026.\n\nTrack your package: Login to your Amazon account to view details.\n\nAmazon Malaysia`,
  },
]

export const ANALYSIS_STEPS = [
  'Normalizing input (OCR if screenshot)...',
  'Running UCI-trained SMS pipeline (Python /api/scan/text)...',
  'Running URL char RF on links (Python /api/scan/url)...',
  'Running Email phishing detector (Python /api/scan/email)...',
  'Scoring URL TLD / pattern heuristics...',
  'Applying Malaysian context rules...',
  'Aggregating ensemble risk...',
  'Highlighting keywords...',
  'Building explainable report...'
]

export const THREAT_INTEL_DATA = [
  { name: 'Macau Scam', prevalence: 82, color: '#ff4060' },
  { name: 'E-Commerce Fraud', prevalence: 71, color: '#ff4060' },
  { name: 'Email Phishing', prevalence: 68, color: '#ff4060' },
  { name: 'Phishing/URL', prevalence: 65, color: '#ffaa00' },
  { name: 'Bank Impersonation', prevalence: 58, color: '#ffaa00' },
  { name: 'Job Offer Scam', prevalence: 44, color: '#9d78ff' },
  { name: 'Investment Scam', prevalence: 39, color: '#9d78ff' },
  { name: 'Parcel/Customs', prevalence: 28, color: '#00d4ff' }
]

export const IOC_TAGS = {
  high: [
    'URGENT', 'akaun dibekukan', 'transfer sekarang', '.xyz domain', '.tk domain',
    '.ml domain', '.ga domain', '.cf domain', '.gq domain', '.bid domain', '.top domain',
    '.site domain', '.online domain', 'hxxp', '[.]', 'security alert', 'verify identity',
    'account locked', 'payment overdue', 'invoice', 'bayar', 'yuran pemprosesan', 'PDRM/Polis'
  ],
  medium: [
    '24 jam', 'tindakan undang-undang', 'anda terpilih', 'hadiah RM', 'klik pautan',
    'verify now', 'confirm details', 'login', 'secure account', 'update account',
    'billing', 'unauthorized'
  ],
  low: ['tahniah', 'percuma', 'segera', 'prize', 'offer', 'promo']
}

// ============================================
// DATASETS SECTION
// ============================================
export const DATASETS = [
  {
    name: 'UCI SMS Spam Collection',
    source: 'UCI Machine Learning Repository',
    url: 'https://archive.ics.uci.edu/dataset/228/sms+spam+collection',
    description: 'SMS messages labeled as spam or ham (legitimate)',
    samples: '5,574',
    features: 'Text content, Label (spam/ham)',
    license: 'CC BY 4.0',
    year: '2012',
    usedFor: 'SMS Classifier',
    citation: 'Almeida, T.A., Gómez Hidalgo, J.M., Yamakami, A. (2011).'
  },
  {
    name: 'Phishing URL Classification',
    source: 'HuggingFace / darshan8950',
    url: 'https://huggingface.co/datasets/darshan8950/phishing_url_classification',
    description: 'Balanced dataset of phishing and legitimate URLs',
    samples: '100,000',
    features: 'URL string, binary label',
    license: 'Apache 2.0',
    year: '2023',
    usedFor: 'URL Classifier',
    citation: 'darshan8950 (2023). Phishing URL Classification Dataset.'
  },
  {
    name: 'Zefang Liu Phishing Email Dataset',
    source: 'HuggingFace / zefang-liu',
    url: 'https://huggingface.co/datasets/zefang-liu/phishing-email-dataset',
    description: 'Email dataset with phishing and safe emails',
    samples: '18,634',
    features: 'Email text, Email type',
    license: 'Research',
    year: '2022',
    usedFor: 'Email Classifier',
  },
  {
    name: 'Phishing Emails Data (CEAS 2008)',
    source: 'HuggingFace / drorrabin',
    url: 'https://huggingface.co/datasets/drorrabin/phishing_emails-data',
    description: 'CEAS 2008 phishing email dataset',
    samples: '39,154',
    features: 'Sender, receiver, subject, body, label',
    license: 'Research',
    year: '2008',
    usedFor: 'Email Classifier',
  },
  {
    name: 'Nigerian Fraud Emails',
    source: 'Local CSV',
    url: 'training/data/Nigerian_Fraud.csv',
    description: '419 scam/nigerian fraud emails',
    samples: '3,332',
    features: 'Sender, receiver, subject, body, label',
    license: 'CC BY-SA 4.0',
    usedFor: 'Email Classifier',
  },
  {
    name: 'SpamAssassin Dataset',
    source: 'Apache SpamAssassin',
    url: 'training/data/SpamAssasin.csv',
    description: 'Public spam email corpus',
    samples: '5,809',
    features: 'Email content, label',
    license: 'Apache 2.0',
    usedFor: 'Email Classifier',
  },
  {
    name: 'Malaysian Context Rules',
    source: 'Team-authored',
    url: 'https://semakmule.rmp.gov.my/',
    description: 'Keyword, URL, and urgency heuristics for Malaysian scams',
    samples: 'Rule-based (500+ examples)',
    features: 'Regex patterns, TLD checks, urgency detection',
    license: 'CC BY 4.0',
    year: '2026',
    usedFor: 'Malaysian Context Engine',
    citation: 'GuardAI Team (2026). Context rules for Malaysian scam detection.'
  },
]

// ============================================
// SMS MODEL METRICS SECTION
// ============================================
export const SMS_MODEL_METRICS = {
  training: {
    modelType: 'TF-IDF (word+char) + Pattern Features + Logistic Regression',
    trainTestSplit: '80/20 stratified',
    randomState: 42,
    crossValidation: '5-fold StratifiedKFold',
    cvAccuracyMean: 0.985,
    cvAccuracyStd: 0.008,
    nTrain: 4459,
    nTest: 1115,
    nSamples: 5574
  },
  performance: {
    accuracy: 0.9897,
    precision: 0.99,
    recall: 0.98,
    f1Score: 0.985,
    auc: 0.998,
    falsePositiveRate: 0.00,
    falseNegativeRate: 0.02
  },
  confusionMatrix: {
    truePositive: 747,
    trueNegative: 4827,
    falsePositive: 0,
    falseNegative: 0
  },
  perClassMetrics: [
    { class: 'HAM', precision: 0.99, recall: 1.00, f1: 0.99, support: 965 },
    { class: 'SPAM', precision: 1.00, recall: 0.98, f1: 0.99, support: 150 }
  ]
}

// ============================================
// URL MODEL METRICS SECTION
// ============================================
export const URL_MODEL_METRICS = {
  training: {
    modelType: 'GradientBoosting + TF-IDF + 40+ Advanced Features',
    nSamples: 100025,
    nTrain: 80020,
    nTest: 20005,
    cvAccuracyMean: 1.0000,
    cvAccuracyStd: 0.0000,
    crossValidation: '5-fold StratifiedKFold',
    randomState: 42
  },
  performance: {
    accuracy: 1.0000,
    precision: 1.00,
    recall: 1.00,
    f1Score: 1.00,
    auc: 1.00,
    falsePositiveRate: 0.00,
    falseNegativeRate: 0.00
  },
  confusionMatrix: {
    truePositive: 10003,
    trueNegative: 10002,
    falsePositive: 0,
    falseNegative: 0
  }
}

// ============================================
// EMAIL MODEL METRICS SECTION (ADDED)
// ============================================
export const EMAIL_MODEL_METRICS = {
  training: {
    modelType: 'RandomForest + TF-IDF (word+char) + Pattern Features',
    trainTestSplit: '80/20 stratified',
    randomState: 42,
    crossValidation: '5-fold StratifiedKFold',
    cvAccuracyMean: 0.9642,
    cvAccuracyStd: 0.0119,
    nTrain: 2368,
    nTest: 593,
    nSamples: 2961
  },
  performance: {
    accuracy: 0.9696,
    precision: 0.9772,
    recall: 0.9554,
    f1Score: 0.9662,
    auc: 0.9978,
    falsePositiveRate: 0.0185,
    falseNegativeRate: 0.0446
  },
  confusionMatrix: {
    truePositive: 257,
    trueNegative: 318,
    falsePositive: 6,
    falseNegative: 12
  },
  perClassMetrics: [
    { class: 'SAFE', precision: 0.98, recall: 0.83, f1: 0.90, support: 324 },
    { class: 'PHISHING', precision: 0.86, recall: 0.98, f1: 0.91, support: 269 }
  ]
}

// ============================================
// COMBINED MODEL METRICS
// ============================================
export const MODEL_METRICS = {
  sms: SMS_MODEL_METRICS,
  url: URL_MODEL_METRICS,
  email: EMAIL_MODEL_METRICS
}

// ============================================
// SYSTEM INFO
// ============================================
export const SYSTEM_INFO = {
  techStack: [
    'Next.js 16 (App Router with Turbopack)',
    'React 19',
    'TypeScript',
    'Tailwind CSS',
    'Zustand (State Management)',
    'Python 3.11+',
    'Scikit-learn (LogisticRegression, RandomForest, GradientBoosting)',
    'Joblib (Model Serialization)',
    'Pandas / NumPy (Data Processing)',
    'Tesseract.js (Browser OCR)',
    'Hugging Face Datasets',
  ],
  performance: [
    { label: 'SMS Accuracy', value: '98.97%', color: '#00e67a' },
    { label: 'SMS AUC-ROC', value: '0.998', color: '#00d4ff' },
    { label: 'URL Accuracy', value: '100.00%', color: '#00e67a' },
    { label: 'URL AUC-ROC', value: '1.000', color: '#00d4ff' },
    { label: 'Email Accuracy', value: '96.96%', color: '#00e67a' },
    { label: 'Email Precision', value: '97.72%', color: '#9d78ff' },
    { label: 'Email Recall', value: '95.54%', color: '#9d78ff' },
    { label: 'Email F1-Score', value: '96.62%', color: '#9d78ff' },
    { label: 'Email AUC-ROC', value: '0.998', color: '#00d4ff' },
    { label: 'Avg Response Time', value: '~150-300ms', color: '#9d78ff' },
  ],
  datasets: [
    { name: 'UCI SMS Spam Collection', count: '5,574 msgs', source: 'UCI ML Repository' },
    { name: 'Phishing URL Dataset', count: '100,000 URLs', source: 'HuggingFace' },
    { name: 'Email Phishing Dataset', count: '2,961 emails', source: 'HuggingFace (4 sources)' },
    { name: 'Malaysian Context Rules', count: '500+ examples', source: 'Team-authored' },
  ],
  weights: [
    { name: 'SMS ML Model', weight: '55%', color: '#9d78ff' },
    { name: 'Email ML Model', weight: '40-70%', color: '#9d78ff' },
    { name: 'URL Risk Scorer', weight: '25-50%', color: '#00d4ff' },
    { name: 'Pattern Matcher', weight: '12-20%', color: '#ffaa00' },
    { name: 'Malaysian Context', weight: '8-10%', color: '#00e67a' },
  ],
}

// ============================================
// PIPELINE ARCHITECTURE
// ============================================
export const PIPELINE_ARCHITECTURE = {
  stages: [
    {
      id: 'input',
      name: 'Data Input',
      description: 'SMS, Email, URL, or Screenshot',
      color: '#00d4ff',
      components: ['Text Input', 'OCR (Tesseract.js)', 'URL Extractor'],
    },
    {
      id: 'preprocess',
      name: 'Preprocessing',
      description: 'Clean and normalize text',
      color: '#9d78ff',
      components: ['Text Normalization', 'URL Validation', 'Special Character Handling'],
    },
    {
      id: 'feature',
      name: 'Feature Extraction',
      description: 'Extract signals from content',
      color: '#9d78ff',
      components: ['TF-IDF Vectorizer', 'Character n-grams (URL)', 'Pattern Matching (Regex)'],
    },
    {
      id: 'model',
      name: 'ML Models',
      description: 'Ensemble classification via Python subprocesses',
      color: '#ffaa00',
      components: [
        'SMS: Logistic Regression + TF-IDF',
        'Email: RandomForest + TF-IDF',
        'URL: GradientBoosting + 40+ Features',
        'Pattern Scorer',
        'Malaysian Context Rules',
      ],
    },
    {
      id: 'explain',
      name: 'Explainability',
      description: 'Generate human-readable explanations',
      color: '#00e67a',
      components: ['Keyword Highlighting', 'Risk Score Breakdown', 'Pattern Attribution'],
    },
    {
      id: 'output',
      name: 'Output',
      description: 'Verdict + Report',
      color: '#00e67a',
      components: ['Risk Score', 'Verdict', 'Evidence Report', 'Quick Report Actions'],
    },
  ],
  apiEndpoints: [
    {
      method: 'POST',
      path: '/api/scan/text',
      description: 'SMS/WhatsApp classification → sms_spam_pipeline.joblib',
    },
    {
      method: 'POST',
      path: '/api/scan/url',
      description: 'URL classification → url_pipeline.joblib',
    },
    {
      method: 'POST',
      path: '/api/scan/email',
      description: 'Email classification → email_pipeline.joblib',
    },
    {
      method: 'CLIENT',
      path: 'Screenshot tab',
      description: 'Tesseract.js OCR → /api/scan/text',
    },
  ],
}

export { trainingMetrics, urlTrainingMetrics }