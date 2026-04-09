"""
stdin JSON: {\"url\": \"...\"} — classify URL string with url_pipeline.joblib.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse
from collections import Counter
from sklearn.base import BaseEstimator, TransformerMixin

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "data" / "url_pipeline.joblib"


# This class MUST match the one used during training
class AdvancedURLFeatureExtractor(BaseEstimator, TransformerMixin):
    """Extract 40+ advanced features for better phishing detection"""
    
    def __init__(self):
        pass
    
    def fit(self, X, y=None):
        return self
    
    def _safe_parse_url(self, url_str: str):
        """Safely parse URL with error handling"""
        try:
            # Ensure URL has scheme
            if not url_str.startswith(('http://', 'https://')):
                url_str = 'http://' + url_str
            
            parsed = urlparse(url_str)
            return parsed
        except Exception:
            return None
    
    def transform(self, X):
        """Extract features from URLs with robust error handling"""
        features = []
        for url in X:
            url_str = str(url).strip()
            
            # ✅ Validate URL before parsing
            if not url_str or len(url_str) < 5:
                # Return default features for invalid URLs
                features.append({
                    "url_length": 0,
                    "host_length": 0,
                    "path_length": 0,
                    "query_length": 0,
                    "dot_count": 0,
                    "slash_count": 0,
                    "dash_count": 0,
                    "underscore_count": 0,
                    "question_count": 0,
                    "equal_count": 0,
                    "at_count": 0,
                    "percent_count": 0,
                    "digit_count": 0,
                    "digit_ratio": 0,
                    "letter_ratio": 0,
                    "special_char_ratio": 0,
                    "has_https": 0,
                    "has_http": 0,
                    "has_ip_address": 0,
                    "has_suspicious_tld": 0,
                    "suspicious_keyword_count": 0,
                    "brand_mention": 0,
                    "subdomain_count": 0,
                    "path_depth": 0,
                    "entropy": 0,
                    "has_double_slash": 0,
                    "has_port": 0,
                    "query_param_count": 0,
                })
                continue
            
            # ✅ Try to parse URL safely
            parsed = self._safe_parse_url(url_str)
            if parsed is None:
                # Return default features for unparseable URLs
                features.append({
                    "url_length": min(len(url_str), 500) / 500,
                    "host_length": 0,
                    "path_length": 0,
                    "query_length": 0,
                    "dot_count": min(url_str.count('.'), 10) / 10,
                    "slash_count": min(url_str.count('/'), 15) / 15,
                    "dash_count": min(url_str.count('-'), 10) / 10,
                    "underscore_count": min(url_str.count('_'), 10) / 10,
                    "question_count": min(url_str.count('?'), 5) / 5,
                    "equal_count": min(url_str.count('='), 10) / 10,
                    "at_count": min(url_str.count('@'), 3) / 3,
                    "percent_count": min(url_str.count('%'), 10) / 10,
                    "digit_count": min(sum(c.isdigit() for c in url_str), 20) / 20,
                    "digit_ratio": sum(c.isdigit() for c in url_str) / max(1, len(url_str)),
                    "letter_ratio": sum(c.isalpha() for c in url_str) / max(1, len(url_str)),
                    "special_char_ratio": sum(not c.isalnum() for c in url_str) / max(1, len(url_str)),
                    "has_https": 1 if url_str.lower().startswith('https://') else 0,
                    "has_http": 1 if url_str.lower().startswith('http://') else 0,
                    "has_ip_address": 1 if bool(re.search(r'(?:\d{1,3}\.){3}\d{1,3}', url_str)) else 0,
                    "has_suspicious_tld": 0,
                    "suspicious_keyword_count": 0,
                    "brand_mention": 0,
                    "subdomain_count": 0,
                    "path_depth": 0,
                    "entropy": 0,
                    "has_double_slash": 1 if '//' in url_str[8:] else 0,
                    "has_port": 0,
                    "query_param_count": 0,
                })
                continue
            
            url_lower = url_str.lower()
            host = parsed.netloc
            path = parsed.path
            query = parsed.query
            
            feature_dict = {}
            
            # Length-based features
            feature_dict['url_length'] = min(len(url_str), 500) / 500
            feature_dict['host_length'] = min(len(host), 100) / 100 if host else 0
            feature_dict['path_length'] = min(len(path), 200) / 200 if path else 0
            feature_dict['query_length'] = min(len(query), 100) / 100 if query else 0
            
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
            feature_dict['query_param_count'] = min(query.count('='), 10) / 10 if query else 0
            
            features.append(feature_dict)
        
        return features


def _norm_url(s: str) -> str:
    """Normalize URL for classification"""
    s = str(s).strip()
    if not s:
        return ""
    
    # Remove any extra text that might be attached
    # If the string contains spaces, try to extract the first URL-like part
    if ' ' in s:
        # Look for URL pattern
        url_match = re.search(r'https?://[^\s]+', s, re.I)
        if url_match:
            s = url_match.group(0)
        else:
            # Try to find domain-like pattern
            domain_match = re.search(r'[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?', s)
            if domain_match:
                s = domain_match.group(0)
    
    # Add scheme if missing
    if not re.match(r"^https?://", s, re.I):
        s = "http://" + s
    
    return s


def _get_url_explanation(url: str, is_phishing: bool) -> dict:
    """Generate explanation for URL classification"""
    if not is_phishing:
        return {
            "explanation": "URL appears benign.",
            "highlights": [],
            "keywords": [],
        }

    highlights = []
    keywords = []
    lower = url.lower()
    
    # Safely parse URL
    try:
        parsed = urlparse(url)
        host = parsed.netloc
    except Exception:
        host = url
    
    # Check for IP address
    if re.search(r"(?:\d{1,3}\.){3}\d{1,3}", host):
        start = url.find(host) if host in url else 0
        end = start + len(host) if host in url else len(url)
        highlights.append(
            {"text": "IP address in host", "start": start, "end": end}
        )
        keywords.append("ip_address")

    # Check for suspicious TLD
    suspicious_tld = re.search(r"\.(xyz|top|club|online|site|pw|link|icu|bid|review|tk|ml|ga|cf)\b", host)
    if suspicious_tld:
        start = url.find(host) if host in url else 0
        end = start + len(host) if host in url else len(url)
        highlights.append(
            {"text": "Suspicious TLD", "start": start, "end": end}
        )
        keywords.append("suspicious_tld")

    # Check for suspicious keywords
    keyword_match = re.search(
        r"(login|secure|account|verify|confirm|update|pay|bank|signin|support|auth|webscr)",
        lower,
    )
    if keyword_match:
        start = keyword_match.start()
        end = keyword_match.end()
        highlights.append(
            {"text": "Suspicious keyword", "start": start, "end": end}
        )
        keywords.append("suspicious_keyword")

    # Check for @ symbol
    if "@" in url:
        start = url.find("@")
        highlights.append(
            {"text": "Unexpected '@' symbol", "start": start, "end": start + 1}
        )
        keywords.append("at_symbol")
    
    # Check for typosquatting
    typosquat_patterns = ['paypa1', 'rnaybank', 'faceb00k', 'rnicrosoft', 'go0gle', 'arnazon']
    for pattern in typosquat_patterns:
        if pattern in lower:
            start = lower.find(pattern)
            end = start + len(pattern)
            highlights.append(
                {"text": f"Typosquatting: '{pattern}'", "start": start, "end": end}
            )
            keywords.append("typosquatting")
            break

    explanation = (
        f"URL flagged as phishing due to {len(highlights)} suspicious patterns."
        if highlights
        else "URL was classified as phishing, but no clear heuristics were found."
    )
    return {"explanation": explanation, "highlights": highlights, "keywords": keywords}


def main() -> int:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        print(json.dumps({"ok": False, "error": "invalid json"}))
        return 1

    url = payload.get("url")
    if url is None or not str(url).strip():
        print(json.dumps({"ok": False, "error": "missing url"}))
        return 1
    
    # Normalize URL
    url = _norm_url(str(url))
    
    # Validate URL length
    if len(url) > 8000:
        print(json.dumps({"ok": False, "error": "url too long"}))
        return 1
    
    # Additional validation: check if it looks like a URL
    if not re.match(r'^https?://', url, re.I) and not re.search(r'\.[a-zA-Z]{2,}', url):
        print(json.dumps({"ok": False, "error": "invalid url format"}))
        return 1

    # Check if model exists
    if not MODEL.is_file():
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": "model not found; run: python training/train_url_baseline.py",
                }
            )
        )
        return 1

    try:
        # Load model and predict
        pipe = joblib.load(MODEL)
        proba = pipe.predict_proba([url])[0]
        benign_p = float(proba[0])
        phish_p = float(proba[1])
        label = "phishing" if phish_p >= 0.5 else "benign"

        explanation_data = _get_url_explanation(url, label == "phishing")
        output = {
            "ok": True,
            "label": label,
            "phishingProbability": phish_p,
            "benignProbability": benign_p,
            "explanation": explanation_data["explanation"],
            "highlights": explanation_data["highlights"],
            "keywords": explanation_data["keywords"],
        }
        print(json.dumps(output))
        return 0
        
    except Exception as e:
        # Catch any prediction errors
        error_output = {
            "ok": False,
            "error": f"Prediction error: {str(e)}",
        }
        print(json.dumps(error_output))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())