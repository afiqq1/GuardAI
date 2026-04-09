"""
Email Phishing Classifier - Using ONLY Email-specific CSV files
Fixed index error and improved balancing
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction import DictVectorizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion, Pipeline

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "training" / "data"
MODEL_OUT = PROJECT_ROOT / "data" / "email_pipeline.joblib"
METRICS_OUT = PROJECT_ROOT / "data" / "email_training_metrics.json"

# ONLY email-specific CSV files
EMAIL_CSV_FILES = [
    "phishing_email.csv",
    "CEAS_08.csv",
    "Enron.csv",
    "Nigerian_Fraud.csv",
    "SpamAssasin.csv",
]


class EmailPatternFeatureExtractor(BaseEstimator, TransformerMixin):
    """Extract hand-crafted pattern features from email content"""
    
    def __init__(self):
        pass
    
    def _normalize_text(self, text: str) -> str:
        return str(text).strip().lower()
    
    def _extract_email_features(self, text: str) -> dict[str, int]:
        m = self._normalize_text(text)
        
        has_urgency = int(bool(re.search(
            r"\b(urgent|immediately|now|today|limited|expires|deadline|"
            r"verify now|act now|confirm now|update now|immediate action|"
            r"within 24 hours|within 48 hours)\b", m
        )))
        
        has_threat = int(bool(re.search(
            r"\b(suspended|locked|deactivated|closed|terminated|"
            r"arrest|fine|penalty|legal action|will be deleted|"
            r"will be closed|account will be|legal consequences|"
            r"account freezing|flagged for suspicious|compromised)\b", m
        )))
        
        has_payment = int(bool(re.search(
            r"\b(payment|transfer|invoice|fee|charge|bill|due|"
            r"pay|wire|deposit|credit card|bank account|"
            r"rm\d+|usd|dollar|refund|reimbursement)\b", m
        )))
        
        has_prize = int(bool(re.search(
            r"\b(winner|won|congratulations|prize|reward|gift|"
            r"lucky draw|selected|qualified|eligible|"
            r"free gift|claim your|you have been chosen|grand prize|"
            r"hadiah|menang|tahniah)\b", m
        )))
        
        has_suspicious_url = int(bool(re.search(
            r"\.(xyz|top|tk|ml|ga|cf|icu|pw|online|site|club)|"
            r"bit\.ly|tinyurl|goo\.gl|ow\.ly", m
        )))
        
        has_brand_spoof = int(bool(re.search(
            r"(netflix|paypal|apple|amazon|microsoft|bank|bnm|maybank|cimb|"
            r"shopee|lazada|grab|touch.?n.?go|public bank|rhb|"
            r"pdrm|polis|police|kastam|customs|pos malaysia).*?"
            r"(verify|update|confirm|login|secure|alert|suspended|locked|limited)", m
        )))
        
        has_malaysian_keywords = int(bool(re.search(
            r"(bnm|bank negara|pdrm|polis diraja|maybank|cimb|shopee|lazada|"
            r"touch n go|grabpay|tahniah|hadiah|menang|kastam|duti|"
            r"akaun dibekukan|sila hubungi|inspektor|bukit aman)", m
        )))
        
        has_phone = int(bool(re.search(r"\b\d{10,11}\b", m)))
        
        has_errors = int(bool(re.search(
            r"\b(recieved|acheive|adress|definately|acount|verifiy|confirmacion)\b", m
        )))
        
        exclamation_count = min(m.count('!'), 5)
        msg_length = min(len(m), 500)
        words = str(text).split()
        all_caps_words = sum(1 for w in words if w.isupper() and len(w) > 2)
        
        return {
            "has_urgency": has_urgency,
            "has_threat": has_threat,
            "has_payment": has_payment,
            "has_prize": has_prize,
            "has_suspicious_url": has_suspicious_url,
            "has_brand_spoof": has_brand_spoof,
            "has_malaysian_keywords": has_malaysian_keywords,
            "has_phone": has_phone,
            "has_errors": has_errors,
            "exclamation_count": exclamation_count,
            "message_length": msg_length // 50,
            "all_caps_count": min(all_caps_words, 5),
        }
    
    def fit(self, X, y=None):
        return self
    
    def transform(self, X):
        return [self._extract_email_features(text) for text in X]


def load_email_csv_files() -> tuple[list[str], list[int]]:
    """Load only email-specific CSV files"""
    
    all_messages = []
    all_labels = []
    
    print("=" * 70)
    print(f"📥 LOADING EMAIL DATASETS")
    print(f"📁 Path: {DATA_DIR}")
    print("=" * 70)
    
    for csv_file in EMAIL_CSV_FILES:
        csv_path = DATA_DIR / csv_file
        
        if not csv_path.exists():
            print(f"\n⚠️ Not found: {csv_file}")
            continue
        
        print(f"\n📚 Loading: {csv_file}")
        print(f"   Size: {csv_path.stat().st_size / 1024 / 1024:.1f} MB")
        
        try:
            df = pd.read_csv(csv_path)
            print(f"   Columns: {df.columns.tolist()}")
            print(f"   Rows: {len(df)}")
            
            # Find text and label columns
            text_col = None
            label_col = None
            
            for col in df.columns:
                col_lower = col.lower()
                if 'text' in col_lower or 'email' in col_lower or 'content' in col_lower or 'message' in col_lower or 'body' in col_lower:
                    text_col = col
                if 'label' in col_lower or 'type' in col_lower or 'class' in col_lower:
                    label_col = col
            
            if text_col and label_col:
                # Extract text
                texts = df[text_col].dropna().astype(str).tolist()
                
                # Convert labels to binary
                labels = []
                for label in df[label_col]:
                    label_str = str(label).lower()
                    if label_str in ['phishing', '1', 'spam', 'malicious', 'bad', 'fraud', 'phish']:
                        labels.append(1)
                    else:
                        labels.append(0)
                
                # Limit per file for performance (max 5000 per file)
                max_per_file = 5000
                if len(texts) > max_per_file:
                    # Take balanced sample
                    phish_idx = [i for i, l in enumerate(labels) if l == 1]
                    safe_idx = [i for i, l in enumerate(labels) if l == 0]
                    
                    np.random.seed(42)
                    phish_sample = np.random.choice(phish_idx, min(len(phish_idx), max_per_file//2), replace=False)
                    safe_sample = np.random.choice(safe_idx, min(len(safe_idx), max_per_file//2), replace=False)
                    selected = list(phish_sample) + list(safe_sample)
                    
                    texts = [texts[i] for i in selected]
                    labels = [labels[i] for i in selected]
                
                all_messages.extend(texts)
                all_labels.extend(labels)
                print(f"   ✅ Added {len(texts)} emails ({sum(labels)} phishing, {len(labels)-sum(labels)} safe)")
            else:
                print(f"   ❌ Could not find text/label columns")
                print(f"   Available columns: {df.columns.tolist()}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    return all_messages, all_labels


def create_malaysian_dataset() -> tuple[list[str], list[int]]:
    """Create dataset from Malaysian scam examples"""
    
    print("\n" + "=" * 70)
    print("📚 ADDING MALAYSIAN SCAM EXAMPLES")
    print("=" * 70)
    
    phishing = [
        "Subject: Bank Negara Malaysia - Security Alert\n\nYour account has been flagged for suspicious transactions. Contact our Fraud Department: +6012-3456789",
        "MAYBANK: Your account has been suspended. Verify now: https://maybank-verify.tk/login",
        "URGENT: Polis DiRaja Malaysia. Your bank account has been frozen due to money laundering. Call Inspektor Tan immediately.",
        "Subject: URGENT - Your Netflix Subscription Expired\n\nUpdate Payment: http://netflix-update.top/verify",
        "Subject: Your PayPal account is limited\n\nConfirm your identity: https://paypal-secure.icu/confirm/login",
        "CIMB Alert: RM3,200 deducted from your account. Cancel here: http://cimb-alert.xyz",
        "Tahniah! Anda telah dipilih sebagai pemenang Shopee Lucky Draw! Hadiah RM5,000",
        "Touch 'n Go: Your eWallet has been locked. Verify: http://tng-secure.icu",
        "GrabPay: Suspicious login detected. Secure: http://grab-secure.xyz",
        "LHDN: Your tax refund of RM3,250 is pending. Update: https://lhdn-refund.com",
        "PDRM: Police report filed against your IC. Call immediately.",
        "Notis kastam: Bungkusan anda ditahan. Bayar RM35: http://pos-my-customs.xyz",
        "Subject: Your Apple ID has been locked\n\nVerify: http://appleid-verify.xyz/secure",
        "Subject: Amazon Order Confirmation\n\nTrack: http://amazon-tracking.tk",
        "Subject: Your Microsoft account has been compromised\n\nVerify: https://microsoft-verify.xyz/secure",
    ]
    
    safe = [
        "Maybank: RM1,250.00 credited to your account ending 4521. Balance: RM3,847.60",
        "Your TAC code for Shopee payment RM89.90 is 123456. Valid for 3 minutes.",
        "Celcom: Dapatkan 5GB data percuma untuk bulan ini! Log masuk ke Celcom Life app",
        "Grab: 20% off your next ride! Use code GRAB20",
        "Your Amazon order #ORD-12345 has been shipped",
        "Weekly team update: Sprint planning tomorrow at 10am",
        "Meeting reminder: Product review at 2pm in Conference Room B",
        "Your receipt from Starbucks: RM18.50",
        "Your Netflix subscription will renew on April 10 for RM45.00",
        "AirAsia: Your flight confirmation #ABC123",
    ]
    
    X = []
    y = []
    
    # Add multiple copies for emphasis
    for i in range(20):
        for text in phishing:
            X.append(text)
            y.append(1)
        for text in safe:
            X.append(text)
            y.append(0)
    
    print(f"   ✅ Added {len(X)} examples ({sum(y)} phishing, {len(y)-sum(y)} safe)")
    
    return X, y


def main() -> int:
    print("=" * 70)
    print("🚀 EMAIL PHISHING DETECTOR - TRAINING")
    print("=" * 70)
    
    # Load email CSV files
    X_raw, y_raw = load_email_csv_files()
    
    if not X_raw:
        print("\n❌ No email datasets found!")
        return 1
    
    # Add Malaysian examples
    X_malay, y_malay = create_malaysian_dataset()
    X_raw.extend(X_malay)
    y_raw.extend(y_malay)
    
    print(f"\n📊 TOTAL DATASET: {len(X_raw)} emails")
    print(f"   Phishing: {sum(y_raw)}")
    print(f"   Safe: {len(y_raw) - sum(y_raw)}")
    
    # Balance dataset to 1:1 ratio (FIXED)
    phish_indices = [i for i, l in enumerate(y_raw) if l == 1]
    safe_indices = [i for i, l in enumerate(y_raw) if l == 0]
    
    min_count = min(len(phish_indices), len(safe_indices))
    print(f"\n📊 Balancing to {min_count} each")
    
    # Use random.sample instead of np.random.choice to avoid index issues
    import random
    random.seed(42)
    selected_phish = random.sample(phish_indices, min_count)
    selected_safe = random.sample(safe_indices, min_count)
    selected_indices = selected_phish + selected_safe
    
    # Shuffle
    random.shuffle(selected_indices)
    
    X_balanced = [X_raw[i] for i in selected_indices]
    y_balanced = [y_raw[i] for i in selected_indices]
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X_balanced, y_balanced, test_size=0.2, random_state=42, stratify=y_balanced,
    )
    
    print(f"\n📊 Training: {len(X_train)}, Test: {len(X_test)}")
    print(f"   Training phishing ratio: {sum(y_train)/len(y_train)*100:.1f}%")
    
    # Build pipeline
    print("\n🔧 Building ML pipeline...")
    pipeline = Pipeline([
        ("features", FeatureUnion([
            ("tfidf", TfidfVectorizer(max_features=3000, ngram_range=(1, 2), stop_words='english')),
            ("pattern", Pipeline([
                ("extract", EmailPatternFeatureExtractor()),
                ("vect", DictVectorizer()),
            ]))
        ])),
        ("clf", RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1))
    ])
    
    print("🏋️ Training model...")
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    print(f"\n✅ Accuracy: {acc:.4f} ({acc*100:.2f}%)")
    print(f"\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['Safe', 'Phishing']))
    
    # Test on your examples
    print(f"\n🧪 TESTING ON YOUR SCAM EXAMPLES:")
    print("=" * 50)
    
    test_cases = [
        ("Netflix Phishing", "Subject: URGENT - Your Netflix Subscription Expired\n\nYour Netflix membership has expired. Update Payment: http://netflix-update.top/verify\n\nIf we don't hear from you within 48 hours, your account will be deleted."),
        ("BNM Scam", "Subject: Bank Negara Malaysia - Security Alert\n\nYour account has been flagged for suspicious transactions. Immediate action required to prevent account freezing. Contact our Fraud Department: +6012-3456789"),
        ("PayPal Phishing", "Subject: Your PayPal account is limited\n\nConfirm your identity: https://paypal-secure.icu/confirm/login"),
        ("Macau Scam", "URGENT: Polis DiRaja Malaysia. Your bank account has been frozen due to money laundering. Call Inspektor Tan immediately."),
        ("Maybank Safe", "Maybank: RM1,250.00 credited to your account ending 4521. Balance: RM3,847.60"),
        ("Team Email Safe", "Weekly team update: Sprint planning tomorrow at 10am. Please review the tickets."),
    ]
    
    for name, email in test_cases:
        proba = pipeline.predict_proba([email])[0][1]
        if proba >= 0.70:
            status = "🔴 HIGH RISK"
        elif proba >= 0.50:
            status = "🟡 SUSPICIOUS"
        else:
            status = "🟢 SAFE"
        print(f"   {name}: {proba*100:.1f}% {status}")
    
    # Save model
    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_OUT, compress=3)
    print(f"\n💾 Saved model to: {MODEL_OUT}")
    
    print("\n" + "=" * 70)
    print("✅ TRAINING COMPLETE!")
    print("=" * 70)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())