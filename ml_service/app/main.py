import os
import joblib
import requests
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Fake News Detection API - Multi-Model")


@app.get("/")
def health():
    return {"status": "ML service running"}


# ================================
# HuggingFace Model Download Setup
# ================================

BASE_MODEL_URL = "https://huggingface.co/utkrshydv/newsPortal-Models/resolve/main"

MODEL_FILES = [
    "new_models/tfidf.pkl",
    "new_models/lightgbm.pkl",
    "new_models/logistic.pkl",
    "new_models/naive_bayes.pkl",
    "new_models/randomforest.pkl",
    "new_models/sgd.pkl",
    "new_models/svm.pkl",
    "new_models/xgboost.pkl",

    "liar_ml_models/liar_tfidf.pkl",
    "liar_ml_models/logistic_liar.pkl",
    "liar_ml_models/naive_bayes_liar.pkl",
    "liar_ml_models/randomforest_liar.pkl",
    "liar_ml_models/sgd_liar.pkl",
    "liar_ml_models/svm_liar.pkl",
    "liar_ml_models/xgboost_liar.pkl"
]


def download_models():

    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

    for file in MODEL_FILES:

        local_path = os.path.join(BASE_DIR, file)

        if not os.path.exists(local_path):

            os.makedirs(os.path.dirname(local_path), exist_ok=True)

            url = f"{BASE_MODEL_URL}/{file}"

            print(f"Downloading {file} from HuggingFace...")

            r = requests.get(url, stream=True)
            r.raise_for_status()

            with open(local_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)

            print(f"Downloaded {file}")


# ================================
# GROQ CLIENT
# ================================

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

groq_client = None

if GROQ_API_KEY:
    try:
        groq_client = OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )
        print("Groq Client initialized successfully.")
    except Exception as e:
        print(f"Failed to initialize Groq client: {e}")


# ================================
# WEB VERIFICATION
# ================================

def verify_with_web(article_text):

    claim = ""

    if groq_client:
        try:

            prompt = f"""
You are a fact-checking assistant. Extract the single most verifiable, specific factual claim from the article below. Focus on names, places, events, and statistics. Output ONLY the search query, nothing else.

Article:
{article_text[:1500]}
"""

            response = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=30,
                temperature=0.0
            )

            claim = response.choices[0].message.content.strip().strip('"')
            print(f"Extracted fact-check query: '{claim}'")

        except Exception as e:
            print(f"Groq Claim Extraction failed: {e}")

    if not claim:
        # Fallback: use the first full sentence if extractoin fails
        sentences = [s.strip() for s in article_text.split('.') if len(s.strip()) > 15]
        claim = sentences[0] if sentences else article_text[:120]

    api_key = os.environ.get('SERPER_API_KEY')

    if not api_key:
        return {"score": 0, "sources": []}

    url = "https://google.serper.dev/search"

    payload = {"q": claim}

    headers = {
        'X-API-KEY': api_key,
        'Content-Type': 'application/json'
    }

    try:

        response = requests.post(url, headers=headers, json=payload, timeout=5)

        results = response.json().get('organic', [])

        sources = []
        snippets = []

        for r in results[:3]:
            # Google Serper API can sometimes return the image thumbnail under various keys
            # Try exploring `imageUrl`, `thumbnailUrl`, list items, or nested objects
            image_url = None
            if r.get("imageUrl"):
                image_url = r.get("imageUrl")
            elif r.get("thumbnailUrl"):
                image_url = r.get("thumbnailUrl")
            elif "image" in r and isinstance(r["image"], dict) and r["image"].get("url"):
                image_url = r["image"]["url"]
            elif r.get("thumbnail"):
                image_url = r.get("thumbnail")
                
            snippet = r.get("snippet", "")
            if snippet:
                snippets.append(snippet)

            sources.append({
                "title": r.get("title"),
                "url": r.get("link"),
                "name": urlparse(r.get("link")).netloc.replace("www.", ""),
                "imageUrl": image_url
            })

        # Base score based on finding sources at all
        score = min(len(sources) * 30, 90)
        
        # --- NLI INTEGRATION ---
        if groq_client and snippets and claim:
            try:
                nli_prompt = f"""
Analyze the relationship between the following CLAIM and the SEARCH SNIPPETS found online.

CLAIM: "{claim}"

SEARCH SNIPPETS:
{' | '.join(snippets)}

Does the information in the snippets SUPPORT the claim, CONTRADICT the claim, or is it UNRELATED/neutral?
Respond with exactly one word: SUPPORT, CONTRADICT, or UNRELATED.
"""
                nli_response = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": nli_prompt}],
                    max_tokens=10,
                    temperature=0.1
                )
                
                nli_result = nli_response.choices[0].message.content.strip().upper()
                
                if "SUPPORT" in nli_result:
                    score = 90  # High credibility
                elif "CONTRADICT" in nli_result:
                    score = 10  # Low credibility (debunked)
                else:
                    score = 50  # Neutral/Unrelated
                    
            except Exception as e:
                print(f"Groq NLI classification failed: {e}")
        # --- END NLI INTEGRATION ---

        return {
            "score": score,
            "sources": sources
        }

    except Exception as e:

        print(f"Search error: {e}")

        return {"score": 50, "sources": []}  # Default to 50 instead of 0 on error so it doesn't push to fake


# ================================
# GOOGLE FACT CHECK TOOLS API
# ================================

# Rating keywords mapped to a fake_score (0.0=Real, 1.0=Fake)
_FAKE_RATINGS = {
    "false", "pants on fire", "pants-on-fire", "mostly false", "incorrect",
    "misleading", "misinformation", "fabricated", "debunked", "inaccurate",
    "not true", "no evidence", "wrong", "fake"
}
_REAL_RATINGS = {
    "true", "mostly true", "correct", "accurate", "verified", "confirmed",
    "supported", "legitimate", "real"
}

def check_fact_check_api(claim: str):
    """
    Queries the Google Fact Check Tools API for the given claim.
    Returns a dict with:
      - 'found': bool (True if a relevant professional fact-check was found)
      - 'fake_score': float 0.0-1.0 (0.0=Real, 1.0=Fake) if found
      - 'label': str (e.g. "False", "Mostly True")
      - 'publisher': str (e.g. "PolitiFact")
    """
    api_key = os.environ.get("GOOGLE_FACT_CHECK_API_KEY")
    if not api_key or not claim:
        return {"found": False}

    try:
        url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
        params = {"query": claim, "key": api_key, "languageCode": "en"}
        response = requests.get(url, params=params, timeout=5)
        data = response.json()

        claims = data.get("claims", [])
        if not claims:
            return {"found": False}

        # Collect all ratings from the top results
        fake_votes = 0
        real_votes = 0
        labels = []
        publishers = []

        for claim_item in claims[:3]:
            for review in claim_item.get("claimReview", []):
                rating = review.get("textualRating", "").lower().strip()
                publisher = review.get("publisher", {}).get("name", "Unknown")
                labels.append(review.get("textualRating", ""))
                publishers.append(publisher)

                if any(r in rating for r in _FAKE_RATINGS):
                    fake_votes += 1
                elif any(r in rating for r in _REAL_RATINGS):
                    real_votes += 1

        total_votes = fake_votes + real_votes
        if total_votes == 0:
            return {"found": False}  # Found fact-checks but ratings are ambiguous/unclear

        fake_score = fake_votes / total_votes
        label = labels[0] if labels else "Unknown"
        publisher = publishers[0] if publishers else "Unknown"

        print(f"Fact Check API: '{claim}' -> {label} ({publisher}), fake_score={fake_score:.2f}")

        return {
            "found": True,
            "fake_score": fake_score,
            "label": label,
            "publisher": publisher
        }

    except Exception as e:
        print(f"Google Fact Check API error: {e}")
        return {"found": False}


# ================================
# AI REASONING
# ================================

def generate_reasoning(article_text, consensus):

    if not groq_client:
        return ["AI reasoning unavailable"]

    try:

        prompt = f"""
Analyze the following article text:
{article_text[:1500]}

This article has been classified by a machine learning ensemble as: {consensus.upper()}.
Provide exactly 3 concise factual reasons explaining why this classification is appropriate based on the text.
Output ONLY the 3 bullet points, starting each line with a dash (-). Do not include any introductory or concluding sentences.
"""

        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3
        )

        content = response.choices[0].message.content

        # Extract only the actual reasons, strip dashes/bullets and numbers at the start of the line
        lines = []
        for l in content.split("\n"):
            line = l.lstrip("-*•1234567890. ").strip()
            if len(line) > 10:  # Ensure it is a valid sentence/reason and not just whitespace or short header
                lines.append(line)

        return lines[:3] if len(lines) >= 3 else (lines + ["Additional reasoning points unavailable.", "Insufficient content."])[:3]

    except Exception as e:

        print(f"AI Reasoning Error: {e}")

        return ["AI reasoning failed due to an error"]


# ================================
# MODEL PATHS
# ================================

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

MODELS_DIR = os.path.join(BASE_DIR, "new_models")

LIAR_MODELS_DIR = os.path.join(BASE_DIR, "liar_ml_models")


models = {
    'welfake': {},
    'liar': {}
}

vectorizers = {
    'welfake': None,
    'liar': None
}


# ================================
# MODEL WEIGHTS
# ================================

model_weights = {
    'xgboost': 20.0,
    'lightgbm': 20.0,
    'randomforest': 15.0,
    'svm': 10.0,
    'logistic': 8.0,
    'sgd': 7.0,
    'web_search': 20.0,
    'naive_bayes': 0.0
}


# ================================
# LOAD MODELS AT STARTUP
# ================================

@app.on_event("startup")
def load_models():

    print("Checking ML models...")

    download_models()

    global vectorizers, models

    try:

        vectorizers['welfake'] = joblib.load(os.path.join(MODELS_DIR, 'tfidf.pkl'))

        print("WELFake TF-IDF loaded")

    except Exception as e:

        print("Failed loading WELFake TFIDF", e)

    model_names = [
        'lightgbm',
        'logistic',
        'naive_bayes',
        'randomforest',
        'sgd',
        'svm',
        'xgboost'
    ]

    for name in model_names:

        try:

            model_path = os.path.join(MODELS_DIR, f'{name}.pkl')

            models['welfake'][name] = joblib.load(model_path)

            print(f"WELFake {name} loaded")

        except Exception as e:

            print(e)

    try:

        vectorizers['liar'] = joblib.load(
            os.path.join(LIAR_MODELS_DIR, 'liar_tfidf.pkl')
        )

        print("LIAR TFIDF loaded")

    except Exception as e:

        print("Failed loading LIAR TFIDF", e)

    for name in model_names:

        if name == "lightgbm":
            continue

        try:

            path = os.path.join(LIAR_MODELS_DIR, f"{name}_liar.pkl")

            if os.path.exists(path):

                models["liar"][name] = joblib.load(path)

                print(f"LIAR {name} loaded")

        except Exception as e:

            print(e)


# ================================
# REQUEST SCHEMA
# ================================

class PredictRequest(BaseModel):

    text: str

    dataset: str = "welfake"


# ================================
# PREDICT ENDPOINT
# ================================

@app.post("/predict")
def predict_news(request: PredictRequest):

    dataset = request.dataset.lower()

    if dataset not in vectorizers:
        raise HTTPException(status_code=400, detail="Invalid dataset")

    if vectorizers[dataset] is None:
        raise HTTPException(status_code=500, detail="Vectorizer not loaded")

    X = vectorizers[dataset].transform([request.text])

    results = {}
    ml_fake_weight = 0
    total_ml_weight = 0

    for name, model in models[dataset].items():
        # Get prediction and probability if possible
        pred = model.predict(X)[0]
        label = "Real" if pred == 1 else "Fake"
        
        confidence = 100
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X)
            # Some models (like LightGBM for binary) return a 1D array of shape (n_samples,) or just (1,)
            # Others return (n_samples, n_classes) e.g., (1, 2)
            if len(probs.shape) == 1:
                prob = probs[0]
                confidence = int((prob if prob > 0.5 else 1 - prob) * 100)
            else:
                confidence = int(max(probs[0]) * 100)
        elif hasattr(model, "decision_function"):
            conf = model.decision_function(X)[0]
            confidence = int(min(abs(conf) * 100, 100))

        results[name] = {
            "prediction": label,
            "confidence": confidence
        }

        # Weighted calculation for ML consensus
        weight = model_weights.get(name, 0)
        if weight > 0:
            total_ml_weight += weight
            if label == "Fake":
                ml_fake_weight += weight

    # Calculate base ML score (always 0.0=Real to 1.0=Fake)
    ml_score = ml_fake_weight / total_ml_weight if total_ml_weight > 0 else 0.5
    
    # -------------------------------------------------------
    # TIER 1: Google Fact Check Tools API (Highest Priority)
    # If a professional debunk/confirmation is found, use it
    # as the authoritative final verdict, bypassing ML + NLI.
    # -------------------------------------------------------
    # Extract claim first (re-using Groq logic inline for fact-check API)
    fact_claim = ""
    if groq_client:
        try:
            fc_prompt = f"""
You are a fact-checking assistant. Extract the single most verifiable, specific factual claim from the article below. Focus on names, places, events, and statistics. Output ONLY the search query, nothing else.

Article:
{request.text[:1500]}
"""
            fc_resp = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": fc_prompt}],
                max_tokens=30,
                temperature=0.0
            )
            fact_claim = fc_resp.choices[0].message.content.strip().strip('"')
        except Exception as e:
            print(f"Claim extraction for fact-check failed: {e}")
    if not fact_claim:
        sentences = [s.strip() for s in request.text.split('.') if len(s.strip()) > 15]
        fact_claim = sentences[0] if sentences else request.text[:120]

    fact_check_result = check_fact_check_api(fact_claim)
    
    if fact_check_result["found"]:
        # Professional fact-check found — this is our authoritative answer.
        final_score = fact_check_result["fake_score"]
        consensus_label = "Fake" if final_score >= 0.5 else "Real"
        web_adjustment = final_score - ml_score
        web = {"score": int((1.0 - final_score) * 100),
               "sources": [],
               "fact_check": fact_check_result}  # Pass fact-check data to UI
        analysis = generate_reasoning(request.text, consensus_label)
        return {
            "results": results,
            "web_verification": web,
            "analysis": analysis,
            "weighted_consensus": {
                "prediction": consensus_label,
                "ml_score": ml_score,
                "web_adjustment": web_adjustment,
                "final_score": final_score,
                "weights_used": {k: v for k, v in model_weights.items() if k in results or k == 'web_search'}
            }
        }
    
    # -------------------------------------------------------
    # TIER 2: NLI Web Search (when no professional fact-check)
    # -------------------------------------------------------
    web = verify_with_web(request.text)
    web_raw_score = web.get("score", 50)  # 10=Contradict, 50=Neutral, 90=Support
    
    # Convert NLI web score to a 0.0-1.0 "fake probability" score:
    #   - NLI=SUPPORT (score=90) -> web_fake_score = 0.05 (very likely Real)
    #   - NLI=UNRELATED (score=50) -> web_fake_score = 0.5 (neutral, don't know)
    #   - NLI=CONTRADICT (score=10) -> web_fake_score = 0.95 (very likely Fake)
    web_fake_score = 1.0 - (web_raw_score / 100.0)
    
    # Blending strategy: weighted average with web as the dominant signal
    # When web is decisive: 70% web, 30% ML
    # When web is neutral (score=50, i.e., UNRELATED): fall back entirely to ML
    neutrality = abs(web_fake_score - 0.5) * 2  # 0.0=neutral, 1.0=decisive
    web_weight = 0.7 * neutrality  # web only gets weight when it has a clear signal
    ml_weight = 1.0 - web_weight
    
    final_score = max(0.0, min(1.0, (web_weight * web_fake_score) + (ml_weight * ml_score)))
    
    # For reporting the "adjustment" value for the UI
    web_adjustment = final_score - ml_score
    
    consensus_label = "Fake" if final_score >= 0.5 else "Real"
    
    analysis = generate_reasoning(request.text, consensus_label)

    return {
        "results": results,
        "web_verification": web,
        "analysis": analysis,
        "weighted_consensus": {
            "prediction": consensus_label,
            "ml_score": ml_score,
            "web_adjustment": web_adjustment,
            "final_score": final_score,
            "weights_used": {k: v for k, v in model_weights.items() if k in results or k == 'web_search'}
        }
    }
