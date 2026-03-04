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

    for file in MODEL_FILES:

        if not os.path.exists(file):

            os.makedirs(os.path.dirname(file), exist_ok=True)

            url = f"{BASE_MODEL_URL}/{file}"

            print(f"Downloading {file} from HuggingFace...")

            r = requests.get(url, stream=True)
            r.raise_for_status()

            with open(file, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)

            print(f"Downloaded {file}")


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



def verify_with_web(article_text):

    claim = ""

    if groq_client:
        try:
            prompt = f"""
            You are a master at writing Google search queries for fact-checking.
            Given the following news article text, extract the main verifiable claim and format it as a highly specific 5-7 word search query.
            Only output the pure search query string.

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
                "url": r.get("link")
            })

        score = min(len(sources) * 30, 90)

        return {
            "score": score,
            "sources": sources
        }

    except Exception as e:
        print(f"Search error: {e}")
        return {"score": 0, "sources": []}


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



@app.on_event("startup")
def load_models():

    print("Checking ML models...")

    download_models()   # <-- ADDED HERE

    global vectorizers, models

    tfidf_welfake_path = os.path.join(MODELS_DIR, 'tfidf.pkl')

    try:

        vectorizers['welfake'] = joblib.load(tfidf_welfake_path)

        print("WELFake TF-IDF loaded")

    except Exception as e:

        print(e)

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

        vectorizers['liar'] = joblib.load(os.path.join(LIAR_MODELS_DIR, 'liar_tfidf.pkl'))

        print("LIAR TFIDF loaded")

    except Exception as e:

        print(e)


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


class PredictRequest(BaseModel):

    text: str

    dataset: str = "welfake"


@app.post("/predict")

def predict_news(request: PredictRequest):

    dataset = request.dataset

    X = vectorizers[dataset].transform([request.text])

    results = {}

    for name, model in models[dataset].items():

        pred = model.predict(X)[0]

        label = "Real" if pred == 1 else "Fake"

        results[name] = {
            "prediction": label
        }

    web = verify_with_web(request.text)

    analysis = generate_reasoning(request.text, "Fake")

    return {

        "results": results,

        "web_verification": web,

        "analysis": analysis

    }