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
Extract a short Google search query for fact checking.

Article:
{article_text[:1000]}
"""

            response = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=20,
                temperature=0.1
            )

            claim = response.choices[0].message.content.strip()

        except Exception as e:
            print(f"Groq Claim Extraction failed: {e}")

    if not claim:
        sentences = [s.strip() for s in article_text.split('.') if len(s.strip()) > 10]
        claim = sentences[0] if sentences else article_text[:100]

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

        for r in results[:3]:
            sources.append({
                "title": r.get("title"),
                "url": r.get("link"),
                "name": urlparse(r.get("link")).netloc.replace("www.", ""),
                "imageUrl": r.get("imageUrl") or r.get("thumbnail") or None
            })

        score = min(len(sources) * 30, 90)

        return {
            "score": score,
            "sources": sources
        }

    except Exception as e:

        print(f"Search error: {e}")

        return {"score": 0, "sources": []}


# ================================
# AI REASONING
# ================================

def generate_reasoning(article_text, consensus):

    if not groq_client:
        return ["AI reasoning unavailable"]

    try:

        prompt = f"""
Article classified as {consensus}.
Give 3 bullet point reasons.
"""

        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=120
        )

        content = response.choices[0].message.content

        lines = [l.strip("- ").strip() for l in content.split("\n") if l.strip()]

        return lines[:3]

    except Exception as e:

        print(e)

        return ["AI reasoning failed"]


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
            probs = model.predict_proba(X)[0]
            confidence = int(max(probs) * 100)
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

    # Calculate base ML score
    ml_score = ml_fake_weight / total_ml_weight if total_ml_weight > 0 else 0.5
    
    # Web verification adjustment
    web = verify_with_web(request.text)
    web_credibility = web.get("score", 0) / 100.0 # 0.0 to 0.9
    
    # Simple adjustment logic
    # If cred is high (>0.7), nudge towards the label supported by sources
    # Here we simplify: if high web cred, it supports "Real", so subtract from fake score
    web_adjustment = 0
    if web_credibility > 0.5:
        web_adjustment = -0.1 * (web_credibility - 0.5)
    elif web_credibility < 0.3:
        web_adjustment = 0.1 * (0.3 - web_credibility)
        
    final_score = max(0, min(1, ml_score + web_adjustment))
    
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
