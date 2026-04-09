"""
Load sms_spam_pipeline.joblib and classify one message from stdin JSON: {"text":"..."}
Prints one JSON line to stdout for the Next.js API route.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
import re
from sklearn.base import BaseEstimator, TransformerMixin

import joblib

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "data" / "sms_spam_pipeline.joblib"


# This class MUST match the one used during training
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
        return [self._extract_pattern_features(text) for text in X]


def main() -> int:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        print(json.dumps({"ok": False, "error": "invalid json"}))
        return 1

    text = payload.get("text")
    if text is None:
        print(json.dumps({"ok": False, "error": "missing text"}))
        return 1
    text = str(text).strip()
    if not text:
        print(json.dumps({"ok": False, "error": "empty text"}))
        return 1
    if len(text) > 16000:
        print(json.dumps({"ok": False, "error": "text too long"}))
        return 1

    if not MODEL.is_file():
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": "model not found; run: python training/train_uci_sms_baseline.py",
                }
            )
        )
        return 1

    pipe = joblib.load(MODEL)
    proba = pipe.predict_proba([text])[0]
    ham_p = float(proba[0])
    spam_p = float(proba[1])
    label = "spam" if spam_p >= 0.5 else "ham"

    explanation_data = _get_sms_explanation(text, label == "spam")
    output = {
        "ok": True,
        "label": label,
        "spamProbability": spam_p,
        "hamProbability": ham_p,
        "explanation": explanation_data["explanation"],
        "highlights": explanation_data["highlights"],
        "keywords": explanation_data["keywords"],
    }
    print(json.dumps(output))
    return 0


def _get_sms_explanation(text: str, is_spam: bool) -> dict:
    if not is_spam:
        return {
            "explanation": "Message appears legitimate.",
            "highlights": [],
            "keywords": [],
        }

    highlights = []
    keywords = []
    lower = text.lower()

    patterns = [
        (r"\b(urgent|immediately|now|important|alert|verify|confirm|account)\b", "Urgent language", "urgent"),
        (r"\b(payment|invoice|transfer|fee|due|credit|paypal|bank)\b", "Payment-related", "payment"),
        (r"\b(free|win|winner|prize|congratulations|offer)\b", "Free/prize offer", "free_offer"),
        (r"\b(suspend|locked|deactivate|fraud|arrest|fine|legal)\b", "Threat language", "threat"),
        (r"https?://|www\.|\.com|\.net|\.org|bit\.ly|tinyurl\.|goo\.gl", "URL presence", "url"),
        (r"\b\d{7,}\b", "Phone number", "phone_number"),
    ]

    for pattern, desc, keyword in patterns:
        match = re.search(pattern, lower)
        if match:
            start = match.start()
            end = match.end()
            highlights.append({"text": desc, "start": start, "end": end})
            keywords.append(keyword)

    if not highlights:
        explanation = "Message was classified as spam, but no strong rule-based patterns were found."
    else:
        explanation = f"Message flagged as spam due to {len(highlights)} suspicious patterns."

    return {"explanation": explanation, "highlights": highlights, "keywords": keywords}


if __name__ == "__main__":
    raise SystemExit(main())