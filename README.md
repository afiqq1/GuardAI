# 🛡️ GuardAI - AI-Powered Scam & Fraud Detection Assistant

[![Hackathon](https://img.shields.io/badge/Hackathon-Malaysia_2026-red)](https://github.com/afiqq1/GuardAI)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-green?logo=python)](https://python.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 📌 Table of Contents
- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Key Features](#-key-features)
- [Scam Types Detected](#-scam-types-detected)
- [Model Performance](#-model-performance)
- [Quick Start](#-quick-start)
- [Usage Guide](#-usage-guide)
- [Test Samples](#-test-samples)
- [Project Structure](#-project-structure)
- [Dataset Sources](#-dataset-sources)
- [Team](#-team)
- [Future Improvements](#-future-improvements)
- [Acknowledgments](#-acknowledgments)

## 🎯 Problem Statement

**Malaysians lost over RM1.2 billion to scams in 2025** (Source: MCMC/Bukit Aman). Common scams include:
- ❌ Macau Scams (PDRM/court impersonation)
- ❌ Bank Phishing (Maybank, CIMB, Public Bank)
- ❌ E-commerce Fraud (Shopee, Lazada)
- ❌ Investment/Crypto Scams
- ❌ Love/Romance Scams
- ❌ Parcel/Customs Scams

**GuardAI** is an intelligent system that protects users by analyzing messages, emails, and links in real-time, providing clear risk scores and actionable insights.

## 💡 Solution Overview

GuardAI uses **3 specialized Machine Learning models** (SMS, Email, URL) trained on real-world scam data to detect threats with **85-95% accuracy**. The system provides:

- ⚡ **Real-time analysis** (<5 seconds)
- 🎯 **Scam type identification** with confidence scores
- 🧠 **Psychological manipulation detection** (urgency, fear, authority)
- 📊 **SHAP-style explanations** for transparency
- 🇲🇾 **Malaysia-specific patterns** (BNM, PDRM, local banks)
- 🔔 **One-click reporting** to authorities (PDRM, MCMC, BNM)

## ✨ Key Features

| Feature | Description | Example |
|---------|-------------|---------|
| 📱 **SMS/WhatsApp Scanner** | Analyzes text messages for scam patterns | "MAYBANK: Your account is suspended. Verify here: [link]" |
| 📧 **Email Phishing Detector** | Identifies fake brand emails | Netflix, PayPal, Amazon, LinkedIn impersonation |
| 🔗 **URL Risk Analyzer** | Checks links for phishing indicators | Suspicious TLDs (.xyz, .top, .icu), IP addresses |
| 📸 **Screenshot OCR** | Extracts text from images using Tesseract.js | Screenshots of scam messages |
| 🇲🇾 **Malaysia-First Detection** | Local scam patterns | BNM, PDRM, Maybank, CIMB, Touch 'n Go, Shopee |
| 🧠 **Psychological Analysis** | Detects manipulation tactics | Urgency, fear, authority, greed, isolation |
| 📊 **Risk Scoring (0-100)** | Clear threat level indicator | 0-30: Safe, 31-69: Suspicious, 70-100: High Risk |
| 🔔 **Quick Report** | One-click reporting to authorities | PDRM, MCMC, BNM report buttons |

## 🛡️ Scam Types Detected

| Scam Type | Confidence | Detection Method | Malaysian Context |
|-----------|------------|-----------------|-------------------|
| 👮 **Macau Scam** | HIGH | PDRM/Police keywords | "Polis Diraja Malaysia", "Bukit Aman", "Inspektor" |
| 🏦 **Bank Negara Scam** | HIGH | BNM impersonation | "Bank Negara Malaysia", "account freezing" |
| 🏦 **Maybank Phishing** | HIGH | Bank name + urgency | "Maybank2u", "account suspended" |
| 🏦 **CIMB Phishing** | HIGH | Bank name + verification | "CIMB Clicks", "unauthorized transaction" |
| 🏦 **Public Bank Phishing** | HIGH | Bank name + alert | "Public Bank", "PB Engage" |
| 🏦 **RHB Phishing** | HIGH | Bank name + security | "RHB Now", "security alert" |
| 🛍️ **Shopee Fraud** | HIGH | Fake prize detection | "Shopee Lucky Draw", "menang hadiah" |
| 🛍️ **Lazada Fraud** | HIGH | Fake contest detection | "Lazada Winner", "percuma" |
| 💳 **Touch 'n Go Scam** | HIGH | E-wallet impersonation | "TNG eWallet locked", "verify now" |
| 💳 **GrabPay Scam** | HIGH | Grab impersonation | "GrabPay suspicious login" |
| 📦 **Parcel/Customs Scam** | HIGH | Fake delivery fee | "Pos Malaysia", "kastam", "duti" |
| 💼 **Job Scam** | MEDIUM | Fake job offers | "kerja kosong", "work from home", "high salary" |
| 📈 **Investment Scam** | MEDIUM | Crypto/Forex promises | "pelaburan", "guaranteed return" |
| 💔 **Romance Scam** | MEDIUM | Emotional manipulation | "sayang", "emergency money" |
| 🔐 **Credential Harvesting** | HIGH | Fake login pages | "verify your account", "confirm identity" |
| 🎰 **Lottery Scam** | HIGH | Fake winnings | "you won", "international lottery" |
| 💰 **LHDN Tax Scam** | HIGH | Tax refund fraud | "LHDN", "refund cukai", "bank info" |
| 🖥️ **Tech Support Scam** | HIGH | Fake virus alerts | "Microsoft support", "virus detected" |
| 📄 **Fake Invoice Scam** | HIGH | Fake billing | "invoice attached", "payment due" |


## 📊 Model Performance

### SMS Spam Classifier (UCI Dataset + Malay Scams)
| Metric | Score |
|--------|-------|
| Accuracy | **95.2%** |
| Precision (Spam) | 0.94 |
| Recall (Spam) | 0.96 |
| F1-Score (Spam) | 0.95 |
| ROC-AUC | 0.98 |
| Cross-Validation (5-fold) | 94.8% ± 0.3% |

### Email Phishing Classifier (5 datasets combined)
| Metric | Score |
|--------|-------|
| Accuracy | **92.8%** |
| Precision (Phishing) | 0.91 |
| Recall (Phishing) | 0.93 |
| F1-Score (Phishing) | 0.92 |
| ROC-AUC | 0.97 |

### URL Phishing Classifier (HuggingFace dataset)
| Metric | Score |
|--------|-------|
| Accuracy | **94.1%** |
| Precision (Weighted) | 0.93 |
| Recall (Weighted) | 0.94 |
| F1-Score (Weighted) | 0.93 |
| ROC-AUC | 0.96 |


## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (comes with Node.js)
- **Python** 3.11+ ([Download](https://python.org)) - optional for retraining

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/afiqq1/GuardAI.git
cd GuardAI

# 2. Install frontend dependencies
npm install

# 3. (Optional) Install Python dependencies for retraining
pip install -r training/requirements.txt

# 4. Run the development server
npm run dev

Access the Application
Open your browser and navigate to: http://localhost:3000

```


## 📖 Usage Guide

### 1. Scan an SMS/WhatsApp Message

- **Select "SMS/WhatsApp" tab**
- **Paste suspicious message**
- **Click "Run Threat Analysis"**
- **View risk score and scam type**

### 2. Scan an Email

- **Select "Email" tab**
- **Paste full email content (including subject)**
- **Click "Run Threat Analysis"**
- **Review phishing indicators**

### 3. Scan a URL

- **Select "URL/Link" tab**
- **Paste suspicious link**
- **Click "Run Threat Analysis"**
- **Check for phishing URLs**

4. Scan a Screenshot
   
- **Select "Screenshot OCR" tab**
- **Upload image file (PNG, JPG)**
- **Click "Run Threat Analysis"**
- **Text is automatically extracted and analyzed**


## 🧪 Test Samples

### SMS Scam Examples

| Scam Type | Example |
|--------|-------|
| Maybank Phishing | "MAYBANK: Your account has been suspended due to unusual activity. Verify now: https://maybank-verify.tk/login or your account will be closed." |
| Macau Scam | "POLIS DIRAJA MALAYSIA: Your IC number found involved in money laundering. Call Inspektor Tan at 03-12345678 immediately." |
|  Touch 'n Go Scam | Touch 'n Go: Your eWallet has been locked due to suspicious login. Verify now: http://tng-secure.icu/verify" |


### Email Phishing Examples

| Scam Type | Example |
|--------|-------|
| Netflix Phishing | Subject: URGENT - Your Netflix Subscription Expired.Your Netflix membership has expired. Update Payment: http://netflix-update.top/verify |
| PayPal Security Alert | Subject: Your PayPal account is limited.Confirm your identity: https://paypal-secure.icu/confirm/login |
|  Bank Negara Scam |Subject: Bank Negara Malaysia - Security Alert.Your account has been flagged for suspicious transactions. Contact our Fraud Department: +6012-3456789 |


### Malicious URL Examples

| Example |
|-------|
| https://maybank-verify.xyz/login |
| http://paypal-secure.top/confirm | 
| https://appleid-verify.icu/secure |
| http://192.168.1.100/paypal/login.php |
| https://bit.ly/3x7Kp9L |

### Safe Examples (Should Pass)

| Type | Example |
|--------|-------|
| SMS | "Maybank: RM1,250.00 credited to your account ending 4521" |
| Email | "Weekly team meeting at 3pm in Conference Room B" |
|  URL | "https://www.maybank2u.com.my" |


## 📁 Project Structure

```bash
GuardAI/
├── app/                          # Next.js App Router
│   ├── api/scan/                 # API routes for ML inference
│   │   ├── email/route.ts        # Email classifier endpoint
│   │   ├── text/route.ts         # SMS classifier endpoint
│   │   └── url/route.ts          # URL classifier endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main dashboard page
│
├── components/                   # React components
│   ├── dashboard/                # Dashboard pages
│   │   ├── scan-page.tsx         # Main scanner UI
│   │   ├── scan-result.tsx       # Results display
│   │   └── ...
│   ├── ui/                       # shadcn/ui components
│   └── theme-provider.tsx        # Dark/light theme
│
├── data/                         # Trained ML models
│   ├── sms_spam_pipeline.joblib  # SMS classifier (95.2% acc)
│   ├── email_pipeline.joblib     # Email classifier (92.8% acc)
│   └── url_pipeline.joblib       # URL classifier (94.1% acc)
│
├── lib/                          # Utilities
│   ├── ml-client.ts              # API client for ML models
│   ├── sample-data.ts            # Test samples
│   └── utils.ts                  # Helper functions
│
├── training/                     # Python ML training
│   ├── train_*.py                # Training scripts
│   ├── predict_*.py              # Inference scripts
│   └── requirements.txt          # Python dependencies
│
└── package.json                  # Node dependencies
```

### 📚 Dataset Sources

| Dataset	Source | License	Size |
|--------|-------|
| UCI SMS Spam Collection	UC Irvine	CC BY 4.0 | 5,574 msgs |
| Phishing Email Dataset	Kaggle	CC0 | 10,000+ emails |
|  CEAS_08 Phishing Corpus	CEAS	Academic | 2,500 emails |
|  Enron Email Dataset	CMU	Public	CEAS	Academic | 500,000 emails |
|  URL Phishing Dataset	HuggingFace	Apache 2.0 | 50,000 URLs |
	
	
### 👥 Team

| Role | Name | Name	Responsibilities |
|--------|-------|-------|
| a | Norazlin Binti Hassana | ML models, training pipelines |
| a | Afiq Aiman Bin Abd Rasid | UI/UX, React components |
| a | Nur Amanina Binti Mokhriz | API routes, deployment |

##🔮 Future Improvements

### Short-term (1-3 months)

- **WhatsApp Business API integration**
- **Browser extension for real-time protection**
- **SMS forwarding number (15888)**
- **Mobile app with push notifications**

### Long-term (6-12 months)

- **Real-time threat intelligence feed**
- **Community reporting system**
- **Deep learning models (BERT/Transformer)**
- **Multi-language support**

## 🙏 Acknowledgments

- **UCI Machine Learning Repository - SMS dataset**
- **HuggingFace - URL phishing dataset**
- **MCMC - Scam pattern insights**
- **Bukit Aman - Scam classification guidance**
- **shadcn/ui - UI components**
- **Tesseract.js - OCR capabilities**

## 📄 License
- **MIT License - Copyright (c) 2026 GuardAI Team**



<div align="center">
⭐ If this project helped you, please give it a star! ⭐

Built with ❤️ for Malaysia Hackathon 2026

Protecting Malaysians from digital threats, one message at a time.

</div> 
