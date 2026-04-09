"""
Enhanced URL Phishing Classifier - Using darshan8950/phishing_url_classification dataset
Source: https://huggingface.co/datasets/darshan8950/phishing_url_classification
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse
from collections import Counter

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.feature_extraction import DictVectorizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score, confusion_matrix, classification_report
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.base import BaseEstimator, TransformerMixin

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
METRICS_OUT = DATA_DIR / "url_training_metrics.json"
MODEL_OUT = DATA_DIR / "url_pipeline.joblib"


class AdvancedURLFeatureExtractor(BaseEstimator, TransformerMixin):
    """Extract 40+ advanced features for better phishing detection"""
    
    def __init__(self):
        pass
    
    def fit(self, X, y=None):
        return self
    
    def transform(self, X):
        """Extract features from URLs"""
        features = []
        for url in X:
            url_str = str(url)
            url_lower = url_str.lower()
            parsed = urlparse(url_lower)
            host = parsed.netloc
            path = parsed.path
            query = parsed.query
            
            feature_dict = {}
            
            # Length-based features
            feature_dict['url_length'] = min(len(url_str), 500) / 500
            feature_dict['host_length'] = min(len(host), 100) / 100
            feature_dict['path_length'] = min(len(path), 200) / 200
            feature_dict['query_length'] = min(len(query), 100) / 100
            
            # Count-based features
            feature_dict['dot_count'] = min(url_str.count('.'), 10) / 10
            feature_dict['slash_count'] = min(url_str.count('/'), 15) / 15
            feature_dict['dash_count'] = min(url_str.count('-'), 10) / 10
            feature_dict['underscore_count'] = min(url_str.count('_'), 10) / 10
            feature_dict['question_count'] = min(url_str.count('?'), 5) / 5
            feature_dict['equal_count'] = min(url_str.count('='), 10) / 10
            feature_dict['at_count'] = min(url_str.count('@'), 3) / 3
            feature_dict['percent_count'] = min(url_str.count('%'), 10) / 10
            feature_dict['digit_count'] = min(sum(c.isdigit() for c in url_str), 20) / 20
            
            # Ratio features
            feature_dict['digit_ratio'] = sum(c.isdigit() for c in url_str) / max(1, len(url_str))
            feature_dict['letter_ratio'] = sum(c.isalpha() for c in url_str) / max(1, len(url_str))
            feature_dict['special_char_ratio'] = sum(not c.isalnum() for c in url_str) / max(1, len(url_str))
            
            # Security features
            feature_dict['has_https'] = 1 if url_lower.startswith('https://') else 0
            feature_dict['has_http'] = 1 if url_lower.startswith('http://') else 0
            
            # Suspicious patterns
            feature_dict['has_ip_address'] = 1 if bool(re.search(r'(?:\d{1,3}\.){3}\d{1,3}', host)) else 0
            
            # Suspicious TLDs
            suspicious_tlds = ['xyz', 'top', 'club', 'online', 'site', 'pw', 'link', 'icu', 'bid', 'review', 'tk', 'ml', 'ga', 'cf', 'gq']
            feature_dict['has_suspicious_tld'] = 1 if any(host.endswith(f'.{tld}') for tld in suspicious_tlds) else 0
            
            # Suspicious keywords in URL
            suspicious_keywords = ['login', 'secure', 'account', 'verify', 'confirm', 'update', 'pay', 'bank', 
                                   'signin', 'support', 'auth', 'webscr', 'password', 'credential', 'validate']
            feature_dict['suspicious_keyword_count'] = min(sum(1 for kw in suspicious_keywords if kw in url_lower), 10) / 10
            
            # Brand impersonation detection
            brands = ['paypal', 'amazon', 'apple', 'microsoft', 'google', 'facebook', 'bank', 'chase', 
                      'wellsfargo', 'citibank', 'ebay', 'netflix', 'fedex', 'ups', 'dhl', 'maybank', 
                      'cimb', 'publicbank', 'rhb', 'shopee', 'lazada', 'grab']
            feature_dict['brand_mention'] = 1 if any(brand in url_lower for brand in brands) else 0
            
            # Multiple subdomains
            subdomain_count = host.count('.') if host else 0
            feature_dict['subdomain_count'] = min(subdomain_count, 5) / 5
            
            # Path depth
            path_depth = path.count('/') if path else 0
            feature_dict['path_depth'] = min(path_depth, 10) / 10
            
            # URL entropy
            if len(url_str) > 0:
                char_freq = Counter(url_str)
                entropy = -sum((freq/len(url_str)) * np.log2(freq/len(url_str)) for freq in char_freq.values())
                feature_dict['entropy'] = min(entropy / 8, 1)
            else:
                feature_dict['entropy'] = 0
            
            # Check for redirects and special chars
            feature_dict['has_double_slash'] = 1 if '//' in url_str[8:] else 0
            feature_dict['has_port'] = 1 if ':' in host else 0
            
            # Query parameter count
            feature_dict['query_param_count'] = min(query.count('='), 10) / 10
            
            features.append(feature_dict)
        
        return features


def load_url_dataset() -> tuple[list[str], list[int]]:
    """Load URL dataset from HuggingFace"""
    
    print("=" * 70)
    print("📥 LOADING URL PHISHING DATASET")
    print("=" * 70)
    
    try:
        print("\n📚 Loading: darshan8950/phishing_url_classification")
        df = pd.read_csv("hf://datasets/darshan8950/phishing_url_classification/phishing_dataset.csv")
        
        print(f"   Shape: {df.shape}")
        print(f"   Columns: {df.columns.tolist()}")
        
        # Check label distribution
        if 'label' in df.columns:
            print(f"   Label distribution:\n{df['label'].value_counts()}")
        
        # Identify URL column (usually 'url' or 'text')
        url_col = 'url' if 'url' in df.columns else 'text' if 'text' in df.columns else df.columns[0]
        label_col = 'label' if 'label' in df.columns else 'is_phishing' if 'is_phishing' in df.columns else df.columns[1]
        
        # Normalize URLs
        def normalize_url(url):
            url = str(url).strip()
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            return url
        
        X = df[url_col].dropna().astype(str).apply(normalize_url).tolist()
        y = df[label_col].astype(int).tolist()
        
        print(f"   ✅ Loaded {len(X)} URLs")
        print(f"   Phishing: {sum(y)}")
        print(f"   Benign: {len(y) - sum(y)}")
        
        return X, y
        
    except Exception as e:
        print(f"   ❌ Failed to load dataset: {e}")
        return [], []


def add_malicious_examples() -> tuple[list[str], list[int]]:
    """Add additional malicious URL examples"""
    
    malicious_urls = [
        "http://paypal-verify.xyz/login",
        "https://maybank-security.top/confirm/account",
        "http://www.maybank2u.com-secure.icu/login",
        "https://face-book-verify.tk/security",
        "http://192.168.1.100/paypal/secure/login.php",
        "https://shopee-promo.xyz/winner/claim-rm5000",
        "http://cimb-click.xyz/account-verification",
        "https://netflix-update.tk/payment",
        "http://lazada-giveaway.top/prize",
        "https://bankrakyat-secure.pw/alert",
        "http://amazon-verify.tk/account",
        "https://appleid-secure.icu/verify",
        "http://microsoft-login.xyz/secure",
        "https://dhl-delivery.top/tracking",
        "http://poslaju-customs.xyz/payment",
    ]
    
    benign_urls = [
        "https://www.maybank2u.com.my",
        "https://shopee.com.my/shop/12345",
        "https://chat.openai.com",
        "https://github.com/your-repo",
        "https://www.google.com",
        "https://www.netflix.com/my-en/",
        "https://www.spotify.com",
        "https://www.airasia.com",
        "https://www.grab.com/my/",
        "https://www.tngdigital.com.my",
    ]
    
    X = []
    y = []
    
    for url in malicious_urls:
        X.append(url)
        y.append(1)
    
    for url in benign_urls:
        X.append(url)
        y.append(0)
    
    print(f"   ✅ Added {len(malicious_urls)} malicious examples")
    print(f"   ✅ Added {len(benign_urls)} benign examples")
    
    return X, y


def main() -> int:
    print("=" * 70)
    print("🚀 URL PHISHING DETECTOR - TRAINING")
    print("=" * 70)
    
    # Load main dataset
    X_raw, y_raw = load_url_dataset()
    
    if not X_raw:
        print("❌ Could not load dataset!")
        return 1
    
    # Add additional examples
    X_extra, y_extra = add_malicious_examples()
    X_raw.extend(X_extra)
    y_raw.extend(y_extra)
    
    print(f"\n📊 TOTAL DATASET: {len(X_raw)} URLs")
    print(f"   Phishing: {sum(y_raw)}")
    print(f"   Benign: {len(y_raw) - sum(y_raw)}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_raw, y_raw, test_size=0.2, random_state=42, stratify=y_raw,
    )
    
    print(f"\n📊 Data split:")
    print(f"   Training: {len(X_train)} URLs")
    print(f"   Testing: {len(X_test)} URLs")
    
    # Build pipeline
    print("\n🔧 Building ML pipeline...")
    pipeline = Pipeline([
        ("features", FeatureUnion([
            ("char_ngrams", TfidfVectorizer(
                analyzer="char_wb",
                ngram_range=(3, 6),
                max_features=20000,
                min_df=2,
                sublinear_tf=True,
            )),
            ("word_ngrams", TfidfVectorizer(
                analyzer="word",
                ngram_range=(1, 3),
                max_features=8000,
                min_df=2,
                sublinear_tf=True,
            )),
            ("advanced_features", Pipeline([
                ("extract", AdvancedURLFeatureExtractor()),
                ("vectorize", DictVectorizer())
            ]))
        ])),
        ("scaler", StandardScaler(with_mean=False)),
        ("classifier", GradientBoostingClassifier(
            n_estimators=300,
            max_depth=7,
            learning_rate=0.1,
            subsample=0.8,
            random_state=42,
            verbose=0
        ))
    ])
    
    print("🏋️ Training model...")
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    print("📈 Evaluating on test set...")
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted", zero_division=0)
    auc = roc_auc_score(y_test, y_proba) if len(np.unique(y_test)) > 1 else 0.0
    
    cm = confusion_matrix(y_test, y_pred)
    
    print(f"\n{'='*70}")
    print("📊 MODEL PERFORMANCE RESULTS")
    print(f"{'='*70}")
    print(f"✅ Accuracy: {acc:.4f} ({acc*100:.2f}%)")
    print(f"🎯 Precision (weighted): {prec:.4f}")
    print(f"📞 Recall (weighted): {rec:.4f}")
    print(f"⚖️  F1-Score (weighted): {f1:.4f}")
    print(f"📈 ROC AUC: {auc:.4f}")
    
    print(f"\n📋 Confusion Matrix:")
    print(f"   True Negatives (Benign correct):     {cm[0][0]}")
    print(f"   False Positives (Benign as phishing): {cm[0][1]}")
    print(f"   False Negatives (Phishing missed):   {cm[1][0]}")
    print(f"   True Positives (Phishing correct):   {cm[1][1]}")
    
    # Test specific URLs
    print(f"\n{'='*70}")
    print("🧪 TESTING ON SPECIFIC URLS")
    print(f"{'='*70}")
    
    test_urls = [
        ("IP Address URL", "http://192.168.1.100/paypal/secure/login.php"),
        (".tk Domain", "https://face-book-verify.tk/security"),
        ("PayPal Phishing", "http://paypal-verify.xyz/login"),
        ("Safe Maybank", "https://www.maybank2u.com.my"),
        ("Safe Google", "https://www.google.com"),
    ]
    
    for name, url in test_urls:
        proba = pipeline.predict_proba([url])[0][1]
        status = "🔴 PHISHING" if proba >= 0.7 else "🟢 SAFE" if proba < 0.3 else "🟡 SUSPICIOUS"
        print(f"   {name}: {proba*100:.1f}% - {status}")
    
    # Save model
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_OUT, compress=3)
    print(f"\n💾 Saved model to: {MODEL_OUT}")
    
    # Save metrics
    metrics = {
        "dataset": {
            "name": "darshan8950/phishing_url_classification + custom examples",
            "n_samples": len(X_raw),
            "n_train": len(X_train),
            "n_test": len(X_test),
        },
        "model": {
            "type": "GradientBoosting + TF-IDF + Advanced Features",
        },
        "metrics": {
            "accuracy": acc,
            "precisionWeighted": prec,
            "recallWeighted": rec,
            "f1Weighted": f1,
            "aucRoc": auc,
        },
        "confusionMatrix": {
            "trueNegative": int(cm[0][0]),
            "falsePositive": int(cm[0][1]),
            "falseNegative": int(cm[1][0]),
            "truePositive": int(cm[1][1]),
        }
    }
    
    METRICS_OUT.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"💾 Saved metrics to: {METRICS_OUT}")
    
    print("\n" + "=" * 70)
    print("✅ URL TRAINING COMPLETE!")
    print("=" * 70)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())