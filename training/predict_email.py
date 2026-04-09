"""
Load email_pipeline.joblib and classify one email from stdin JSON: {"text":"..."}
Prints one JSON line to stdout for the Next.js API route.

Usage:
    echo '{"text":"URGENT: Your PayPal account has been limited..."}' | python training/predict_email.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import joblib
from sklearn.base import BaseEstimator, TransformerMixin

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "data" / "email_pipeline.joblib"


# This class MUST match the one used during training
class EmailPatternFeatureExtractor(BaseEstimator, TransformerMixin):
    """Extract hand-crafted pattern features from email content"""
    
    def __init__(self):
        pass
    
    def _normalize_text(self, text: str) -> str:
        return str(text).strip().lower()
    
    def _extract_email_features(self, text: str) -> dict[str, int]:
        m = self._normalize_text(text)
        
        # Urgency indicators (common in phishing)
        has_urgency = int(bool(re.search(
            r"\b(urgent|immediately|now|today|limited|expires|deadline|"
            r"verify now|act now|confirm now|update now|immediate action|"
            r"within 24 hours|within 48 hours)\b", m
        )))
        
        # Threat/legal pressure
        has_threat = int(bool(re.search(
            r"\b(suspended|locked|deactivated|closed|terminated|"
            r"arrest|fine|penalty|legal action|will be deleted|"
            r"will be closed|account will be|legal consequences)\b", m
        )))
        
        # Money/payment requests
        has_payment = int(bool(re.search(
            r"\b(payment|transfer|invoice|fee|charge|bill|due|"
            r"pay|wire|deposit|credit card|bank account|"
            r"rm\d+|usd|dollar|refund|reimbursement)\b", m
        )))
        
        # Prize/lottery indicators
        has_prize = int(bool(re.search(
            r"\b(winner|won|congratulations|prize|reward|gift|"
            r"lucky draw|selected|qualified|eligible|"
            r"free gift|claim your|you have been chosen)\b", m
        )))
        
        # URL/suspicious link indicators
        url_count = len(re.findall(r"https?://|www\.|\.com|\.net|\.org|bit\.ly|tinyurl", m))
        has_url = int(url_count > 0)
        
        # Sender spoofing indicators
        has_sender_spoof = int(bool(re.search(
            r"(paypal|amazon|apple|microsoft|google|facebook|"
            r"bank|bnm|maybank|cimb|shopee|lazada|grab|netflix|"
            r"fedex|dhl|pos).*?(secure|verify|update|confirm|login)", m
        )))
        
        # Grammar/spelling errors (common in phishing)
        has_errors = int(bool(re.search(
            r"\b(recieved|acheive|adress|definately|"
            r"acount|verifiy|confirmacion|attached file)\b", m
        )))
        
        # Urgency with exclamation marks
        exclamation_count = min(m.count('!'), 5)
        
        # Message length features
        msg_length = min(len(m), 500)
        
        return {
            "has_urgency": has_urgency,
            "has_threat": has_threat,
            "has_payment": has_payment,
            "has_prize": has_prize,
            "has_url": has_url,
            "url_count": min(url_count, 5),
            "has_sender_spoof": has_sender_spoof,
            "has_errors": has_errors,
            "exclamation_count": exclamation_count,
            "message_length": msg_length // 50,
        }
    
    def fit(self, X, y=None):
        return self
    
    def transform(self, X):
        return [self._extract_email_features(text) for text in X]


def _get_email_explanation(text: str, is_phishing: bool) -> dict:
    """Generate explanation for email classification result"""
    if not is_phishing:
        return {
            "explanation": "Email appears legitimate. No phishing indicators detected.",
            "highlights": [],
            "keywords": [],
        }

    highlights = []
    keywords = []
    lower = text.lower()

    # Define patterns for different types of phishing indicators
    patterns = [
        (r"\b(urgent|immediately|now|verify now|act now|immediate action)\b", 
         "Urgent language - common phishing tactic", "urgent"),
        (r"\b(payment|transfer|invoice|fee|bill|due|wire|deposit)\b", 
         "Payment/transfer request - financial scam indicator", "payment"),
        (r"\b(suspended|locked|deactivated|closed|terminated|will be closed)\b", 
         "Account threat - creates false urgency", "threat"),
        (r"\b(winner|won|prize|congratulations|selected|qualified|lucky draw)\b", 
         "Prize/lottery lure - too good to be true", "prize"),
        (r"https?://|www\.|bit\.ly|tinyurl|goo\.gl", 
         "Suspicious URL - potential phishing link", "url"),
        (r"(paypal|amazon|apple|microsoft|google|facebook|bank|bnm|maybank|cimb|shopee|lazada|grab|netflix|fedex|dhl|pos).*?(verify|confirm|update|login|secure)", 
         "Brand impersonation - fake company communication", "spoofing"),
        (r"\b(recieved|acheive|adress|definately|acount|verifiy|confirmacion)\b", 
         "Spelling/grammar error - common in phishing emails", "error"),
        (r"click here|click the link|click below", 
         "Call to action - encourages clicking malicious link", "click_bait"),
    ]

    for pattern, desc, keyword in patterns:
        match = re.search(pattern, lower)
        if match:
            start = match.start()
            end = match.end()
            highlights.append({"text": desc, "start": start, "end": end})
            keywords.append(keyword)

    # Remove duplicate keywords
    keywords = list(dict.fromkeys(keywords))

    if not highlights:
        explanation = "Email was classified as phishing, but no strong rule-based patterns were found. Classification based on ML model."
    else:
        explanation = f"Email flagged as phishing due to {len(highlights)} suspicious pattern(s)."

    return {"explanation": explanation, "highlights": highlights, "keywords": keywords}


def predict_email(text: str) -> dict:
    """Predict if an email is phishing or safe"""
    # Validate input
    text = str(text).strip()
    if not text:
        return {"ok": False, "error": "empty text"}
    
    if len(text) > 50000:
        return {"ok": False, "error": "text too long (max 50000 chars)"}
    
    # Check if model exists
    if not MODEL.is_file():
        return {
            "ok": False,
            "error": "model not found; run: python training/train_email_baseline.py",
        }
    
    # Load model and predict
    pipe = joblib.load(MODEL)
    proba = pipe.predict_proba([text])[0]
    safe_p = float(proba[0])
    phish_p = float(proba[1])
    label = "phishing" if phish_p >= 0.5 else "safe"
    
    # Generate explanation
    explanation_data = _get_email_explanation(text, label == "phishing")
    
    return {
        "ok": True,
        "label": label,
        "phishingProbability": phish_p,
        "safeProbability": safe_p,
        "explanation": explanation_data["explanation"],
        "highlights": explanation_data["highlights"],
        "keywords": explanation_data["keywords"],
    }


def main() -> int:
    """Main entry point for command line usage"""
    raw = sys.stdin.read()
    
    # Try to parse JSON
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        # If not JSON, try to treat as plain text
        if raw.strip():
            result = predict_email(raw.strip())
            print(json.dumps(result))
            return 0 if result.get("ok") else 1
        else:
            print(json.dumps({"ok": False, "error": "invalid json or empty text"}))
            return 1
    
    # Extract text from JSON
    text = payload.get("text") or payload.get("email") or payload.get("content")
    if text is None:
        print(json.dumps({"ok": False, "error": "missing text field"}))
        return 1
    
    result = predict_email(text)
    print(json.dumps(result))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
