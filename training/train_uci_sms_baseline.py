"""
Train a reproducible text baseline on the UCI SMS Spam Collection + Additional Malaysian Scam Data.
Dataset: https://archive.ics.uci.edu/ml/datasets/SMS+Spam+Collection (CC BY 4.0)
Additional data: training/data/malay_spam.csv

Writes ../data/training_metrics.json for the Next.js dashboard (hackathon validation evidence).
"""
from __future__ import annotations

import io
import json
import re
import sys
import zipfile
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import requests
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction import DictVectorizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    auc,
    confusion_matrix,
    precision_recall_fscore_support,
    roc_curve,
)
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.pipeline import FeatureUnion, Pipeline

ZIP_URL = "https://archive.ics.uci.edu/static/public/228/sms+spam+collection.zip"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
OUT = DATA_DIR / "training_metrics.json"
MODEL_OUT = DATA_DIR / "sms_spam_pipeline.joblib"


# Custom transformer class instead of FunctionTransformer (fixes pickling issue)
class PatternFeatureExtractor(BaseEstimator, TransformerMixin):
    """Extract hand-crafted pattern features from text messages"""
    
    def __init__(self):
        pass
    
    def _normalize_text(self, text: str) -> str:
        return str(text).strip().lower()
    
    def _extract_pattern_features(self, text: str) -> dict[str, int]:
        m = self._normalize_text(text)
        url_count = len(re.findall(r"https?://|www\.|\.com|\.net|\.org|bit\.ly|tinyurl\.|goo\.gl", m))
        digit_ratio = sum(ch.isdigit() for ch in m) / max(1, len(m))
        upper_ratio = sum(ch.isupper() for ch in text) / max(1, len(text))
        return {
            "has_urgent": int(bool(re.search(r"\b(urgent|immediately|now|important|alert|verify|confirm|account)\b", m))),
            "has_payment": int(bool(re.search(r"\b(payment|invoice|transfer|fee|due|credit|paypal|bank)\b", m))),
            "has_free": int(bool(re.search(r"\b(free|win|winner|prize|congratulations|offer)\b", m))),
            "has_threat": int(bool(re.search(r"\b(suspend|locked|deactivate|fraud|arrest|fine|legal)\b", m))),
            "has_url": int(url_count > 0),
            "url_count": min(url_count, 5),
            "digit_ratio_high": int(digit_ratio > 0.15),
            "upper_ratio_high": int(upper_ratio > 0.25),
            "has_exclamation": int("!" in m),
            "has_phone": int(bool(re.search(r"\b\d{7,}\b", m))),
            "message_length": min(len(m), 200),
        }
    
    def fit(self, X, y=None):
        return self
    
    def transform(self, X):
        """Transform text messages into feature dictionaries"""
        return [self._extract_pattern_features(text) for text in X]


def load_uci_sms() -> tuple[list[str], list[int]]:
    """Load UCI SMS Spam Collection - direct download, no authentication needed"""
    print("📥 Downloading UCI SMS Spam Collection...")
    
    r = requests.get(ZIP_URL, timeout=30)
    r.raise_for_status()
    
    zf = zipfile.ZipFile(io.BytesIO(r.content))
    # Read the SMS file
    with zf.open("SMSSpamCollection") as f:
        content = f.read().decode("utf-8", errors="replace")
    
    messages = []
    labels = []
    
    for line in content.strip().split('\n'):
        if '\t' not in line:
            continue
        label, message = line.split('\t', 1)
        messages.append(message.strip())
        labels.append(1 if label.lower() == 'spam' else 0)
    
    print(f"✅ Loaded {len(messages)} messages ({sum(labels)} spam, {len(labels)-sum(labels)} ham)")
    return messages, labels


def load_additional_data() -> tuple[list[str], list[int]]:
    """Load additional training messages from training/data/malay_spam.csv"""
    # Look in the training/data folder (same folder as script)
    training_data_dir = Path(__file__).resolve().parent / "data"
    additional_path = training_data_dir / "malay_spam.csv"
    
    if not additional_path.exists():
        print("⚠️ No malay_spam.csv found at", additional_path)
        print("   Continuing with UCI dataset only...")
        return [], []
    
    print("📥 Loading additional training messages from malay_spam.csv...")
    
    messages = []
    labels = []
    
    try:
        # Try normal pandas read first
        df = pd.read_csv(additional_path)
        if 'message' in df.columns and 'label' in df.columns:
            messages = df['message'].astype(str).tolist()
            labels = [1 if str(label).strip().lower() == 'spam' else 0 for label in df['label']]
        else:
            raise ValueError("CSV missing required columns")
            
    except (pd.errors.ParserError, ValueError) as e:
        print(f"   Parser error: {e}")
        print("   Trying manual line-by-line parsing...")
        
        # Manual parsing line by line
        with open(additional_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Check if first line is header
        start_line = 0
        if lines and 'message' in lines[0].lower() and 'label' in lines[0].lower():
            start_line = 1
        
        for line_num, line in enumerate(lines[start_line:], start=start_line + 1):
            line = line.strip()
            if not line:
                continue
            
            # Find the last comma to separate message and label
            # This handles messages that may contain commas
            parts = line.rsplit(',', 1)
            if len(parts) == 2:
                message = parts[0].strip()
                label = parts[1].strip()
                
                # Remove quotes if present
                if message.startswith('"') and message.endswith('"'):
                    message = message[1:-1]
                
                # Handle escaped quotes
                message = message.replace('""', '"')
                
                messages.append(message)
                labels.append(1 if label.lower() == 'spam' else 0)
            else:
                print(f"   Warning: Skipping malformed line {line_num}")
    
    if not messages:
        print("   No valid messages found in CSV")
        return [], []
    
    spam_count = sum(labels)
    ham_count = len(labels) - spam_count
    print(f"✅ Loaded {len(messages)} additional messages ({spam_count} spam, {ham_count} ham)")
    return messages, labels


def main() -> int:
    print("=" * 60)
    print("Training SMS Spam Detector with UCI Dataset + Malay Scam Data")
    print("=" * 60)
    
    # Load UCI dataset
    X_raw, y = load_uci_sms()
    
    # Load additional training data
    extra_messages, extra_labels = load_additional_data()
    if extra_messages:
        X_raw.extend(extra_messages)
        y.extend(extra_labels)
        print(f"\n📊 Combined dataset: {len(X_raw)} total messages")
        print(f"   Spam: {sum(y)}, Ham: {len(y) - sum(y)}")
        print(f"   Spam ratio: {sum(y)/len(y)*100:.1f}%")
    
    if len(X_raw) < 100:
        print("ERROR: Not enough data to train model!")
        return 1
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_raw,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )
    
    print(f"\n📊 Data split:")
    print(f"   Training samples: {len(X_train)}")
    print(f"   Test samples: {len(X_test)}")
    print(f"   Spam ratio: {sum(y)/len(y)*100:.1f}%")
    
    print("\n🔧 Building ML pipeline...")
    
    # Create pipeline with custom transformer class (pickle-friendly)
    pipeline = Pipeline(
        [
            (
                "features",
                FeatureUnion(
                    [
                        (
                            "tfidf_word",
                            TfidfVectorizer(
                                max_features=15000,
                                ngram_range=(1, 2),
                                min_df=3,
                                sublinear_tf=True,
                            ),
                        ),
                        (
                            "tfidf_char",
                            TfidfVectorizer(
                                analyzer="char_wb",
                                ngram_range=(3, 5),
                                max_features=5000,
                                min_df=3,
                            ),
                        ),
                        (
                            "pattern",
                            Pipeline(
                                [
                                    ("extract", PatternFeatureExtractor()),
                                    ("vect", DictVectorizer()),
                                ]
                            ),
                        ),
                    ],
                    n_jobs=-1,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=2000,
                    class_weight="balanced",
                    random_state=42,
                    solver="saga",
                    n_jobs=-1,
                ),
            ),
        ]
    )
    
    print("🏋️ Training model...")
    pipeline.fit(X_train, y_train)
    
    print("📈 Evaluating on test set...")
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    
    # Calculate metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec, rec, f1, support = precision_recall_fscore_support(
        y_test, y_pred, average=None, labels=[0, 1], zero_division=0
    )
    prec_w, rec_w, f1_w, _ = precision_recall_fscore_support(
        y_test, y_pred, average="weighted", zero_division=0
    )
    
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    roc_auc = float(auc(fpr, tpr))
    
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
    tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])
    
    # 5-fold cross validation (using same pipeline structure)
    print("🔄 Performing 5-fold cross validation...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores: list[float] = []
    X_arr = np.array(X_raw, dtype=object)
    y_arr = np.array(y)
    
    for train_idx, val_idx in skf.split(X_arr, y_arr):
        pipe = Pipeline(
            [
                (
                    "features",
                    FeatureUnion(
                        [
                            (
                                "tfidf",
                                TfidfVectorizer(
                                    max_features=15000,
                                    ngram_range=(1, 2),
                                    min_df=2,
                                    sublinear_tf=True,
                                ),
                            ),
                            (
                                "pattern",
                                Pipeline(
                                    [
                                        ("extract", PatternFeatureExtractor()),
                                        ("vect", DictVectorizer()),
                                    ]
                                ),
                            ),
                        ],
                        n_jobs=-1,
                    ),
                ),
                (
                    "clf",
                    LogisticRegression(
                        max_iter=2000,
                        class_weight="balanced",
                        random_state=42,
                        solver="lbfgs",
                    ),
                ),
            ]
        )
        pipe.fit(X_arr[train_idx].tolist(), y_arr[train_idx])
        cv_scores.append(
            float(accuracy_score(y_arr[val_idx], pipe.predict(X_arr[val_idx].tolist())))
        )
    
    # Display results
    print("\n" + "=" * 60)
    print("📊 MODEL PERFORMANCE RESULTS")
    print("=" * 60)
    print(f"✅ Accuracy:           {acc:.4f} ({acc*100:.2f}%)")
    print(f"🎯 Precision (spam):  {prec[1]:.4f}")
    print(f"📞 Recall (spam):     {rec[1]:.4f}")
    print(f"⚖️  F1-Score (spam):   {f1[1]:.4f}")
    print(f"📈 ROC AUC:           {roc_auc:.4f}")
    print(f"🔄 CV Accuracy:       {np.mean(cv_scores):.4f} ± {np.std(cv_scores):.4f}")
    print(f"\n📋 Confusion Matrix:")
    print(f"   True Negatives:  {tn:4d} (ham correctly identified)")
    print(f"   False Positives: {fp:4d} (ham marked as spam)")
    print(f"   False Negatives: {fn:4d} (spam missed)")
    print(f"   True Positives:  {tp:4d} (spam correctly caught)")
    
    # Prepare metrics JSON
    dataset_name = "UCI SMS Spam Collection"
    if extra_messages:
        dataset_name += " + Malay Scam Data"
    
    payload = {
        "dataset": {
            "name": dataset_name,
            "source": "https://archive.ics.uci.edu/dataset/228/sms+spam+collection + malay_spam.csv",
            "license": "CC BY 4.0",
            "n_samples": len(X_raw),
            "n_train": len(X_train),
            "n_test": len(X_test),
            "spam_count": sum(y),
            "ham_count": len(y) - sum(y),
        },
        "model": {
            "type": "TF-IDF (word+char) + Pattern Features + Logistic Regression",
            "trainTestSplit": "80/20 stratified",
            "randomState": 42,
            "crossValidation": "5-fold StratifiedKFold",
            "cvAccuracyMean": float(np.mean(cv_scores)),
            "cvAccuracyStd": float(np.std(cv_scores)),
        },
        "metrics": {
            "accuracy": acc,
            "precisionWeighted": float(prec_w),
            "recallWeighted": float(rec_w),
            "f1Weighted": float(f1_w),
            "aucRoc": roc_auc,
            "falsePositiveRate": fp / (fp + tn) if (fp + tn) else 0.0,
            "falseNegativeRate": fn / (fn + tp) if (fn + tp) else 0.0,
        },
        "perClass": [
            {
                "class": "ham",
                "precision": float(prec[0]),
                "recall": float(rec[0]),
                "f1": float(f1[0]),
                "support": int(support[0]),
            },
            {
                "class": "spam",
                "precision": float(prec[1]),
                "recall": float(rec[1]),
                "f1": float(f1[1]),
                "support": int(support[1]),
            },
        ],
        "confusionMatrix": {
            "trueNegative": tn,
            "falsePositive": fp,
            "falseNegative": fn,
            "truePositive": tp,
        },
    }
    
    # Save files
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"\n💾 Saved metrics to: {OUT}")
    
    # Save model (train on full dataset for production)
    print("🔧 Training final model on full dataset...")
    final_pipeline = Pipeline(
        [
            (
                "features",
                FeatureUnion(
                    [
                        (
                            "tfidf",
                            TfidfVectorizer(
                                max_features=15000,
                                ngram_range=(1, 2),
                                min_df=2,
                                sublinear_tf=True,
                            ),
                        ),
                        (
                            "pattern",
                            Pipeline(
                                [
                                    ("extract", PatternFeatureExtractor()),
                                    ("vect", DictVectorizer()),
                                ]
                            ),
                        ),
                    ],
                    n_jobs=-1,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=2000,
                    class_weight="balanced",
                    random_state=42,
                    solver="lbfgs",
                ),
            ),
        ]
    )
    final_pipeline.fit(X_raw, y)
    joblib.dump(final_pipeline, MODEL_OUT, compress=3)
    print(f"💾 Saved model to: {MODEL_OUT}")
    
    print("\n" + "=" * 60)
    print("✅ TRAINING COMPLETE! Model is ready for inference.")
    print("=" * 60)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())