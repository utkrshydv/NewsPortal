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
            Do not include any conversational text, quotes, or prefaces. Only output the pure search query string.
            CRITICAL: If the text is pure gibberish, conversational, an opinion, or lacks any factual news claim to verify, return exactly the string "INVALID_CLAIM".

            Article:
            {article_text[:1000]}
            """
            response = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant", 
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=20,
                temperature=0.1
            )
            claim = response.choices[0].message.content.strip()
            if claim.startswith('"') and claim.endswith('"'):
                claim = claim[1:-1]
                
            if "INVALID_CLAIM" in claim:
                return {
                    "score": 0,
                    "sources": [],
                    "warning": "Text lacks verifiable factual claims."
                }
        except Exception as e:
            print(f"Groq LLM Claim Extraction failed: {e}. Falling back to simple extract.")
            
    if not claim:
        # Simple fallback
        sentences = [s.strip() for s in article_text.split('.') if len(s.strip()) > 10]
        claim = sentences[0] if sentences else article_text[:100]

    tier_1 = ['apnews.com', 'reuters.com', 'bbc.com', 'bbc.co.uk', 'npr.org', 'aljazeera.com', 'pbs.org', 'ft.com'] 
    tier_2 = ['nytimes.com', 'washingtonpost.com', 'wsj.com', 'thehindu.com', 'theguardian.com', 'bloomberg.com', 'economist.com', 'telegraph.co.uk', 'independent.co.uk', 'abcnews.go.com', 'cbsnews.com', 'nbcnews.com'] 
    tier_3 = ['factcheck.org', 'snopes.com', 'politifact.com', 'fullfact.org', 'afp.com', 'leadstories.com'] 
    tier_4 = ['cnn.com', 'foxnews.com', 'usatoday.com', 'time.com', 'newsweek.com', 'theatlantic.com', 'politico.com', 'axios.com', 'forbes.com', 'businessinsider.com', 'cnbc.com', 'ndtv.com', 'indiatoday.in', 'thequint.com', 'thewire.in', 'theprint.in', 'theweek.in', 'thetimes.co.uk', 'smh.com.au', 'theglobeandmail.com', 'cbc.ca'] 
    
    trusted_sources = tier_1 + tier_2 + tier_3 + tier_4
    
    api_key = os.environ.get('SERPER_API_KEY')
    if not api_key:
        print("SERPER_API_KEY NOT FOUND. USING MOCK.")
        if len(article_text) % 2 != 0 or len(article_text) > 50:
            return {
                "score": 85,
                "sources": [{
                    "name": "Reuters.com",
                    "title": "Mock Data Report",
                    "url": "https://www.reuters.com"
                }],
                "warning": "Mock Data: SERPER_API_KEY not found."
            }
        else:
            return {
                "score": 0,
                "sources": [],
                "warning": "Mock Data: No reputable cross-references found."
            }

    url = "https://google.serper.dev/search"
    payload = {"q": claim, "gl": "us", "hl": "en", "tbs": "qdr:m"}
    headers = {'X-API-KEY': api_key, 'Content-Type': 'application/json'}

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        results = response.json().get('organic', [])
        
        matches = []
        total_score = 0
        
        for res in results:
            link = res.get('link', '')
            title = res.get('title', '')
            try:
                # Extract clean domain name (e.g. 'bbc.co.uk' or 'apnews.com')
                parsed_domain = urlparse(link).netloc.replace('www.', '').lower()
                
                # We need to check if the clean domain ends with any of our trusted domains
                # e.g., 'news.bbc.co.uk' -> ends with 'bbc.co.uk'
                matched_tier = 0
                
                for t_domain in tier_3:
                    if parsed_domain.endswith(t_domain): matched_tier = 3; break
                if matched_tier == 0:
                    for t_domain in tier_1:
                        if parsed_domain.endswith(t_domain): matched_tier = 1; break
                if matched_tier == 0:
                    for t_domain in tier_2:
                        if parsed_domain.endswith(t_domain): matched_tier = 2; break
                if matched_tier == 0:
                    for t_domain in tier_4:
                        if parsed_domain.endswith(t_domain): matched_tier = 4; break
                
                if matched_tier > 0:
                    matches.append(res)
                    if matched_tier == 3: total_score += 85
                    elif matched_tier == 1: total_score += 75
                    elif matched_tier == 2: total_score += 55
                    elif matched_tier == 4: total_score += 35
            except Exception:
                pass
                
        if not matches:
             return {"score": 0, "sources": [], "warning": "No reputable cross-references found in real-time search."}
             
        score = min(100, total_score)
        
        # Sort matches by tier (we appended them in order of search rank, but let's just take the first 3)
        sources = []
        for m in matches[:3]:
            parsed = urlparse(m['link']).netloc.replace('www.', '').title()
            sources.append({
                "name": parsed,
                "title": m.get('title', 'Verified Source'),
                "url": m['link']
            })
        
        return {
            "score": max(score, 33), 
            "sources": sources
        }
    except Exception as e:
        print(f"Web verification error: {e}")
        return {"score": 0, "top_source": None, "top_url": None, "warning": f"Search API error: {e}"}

def generate_reasoning(article_text, consensus):
    if not groq_client:
        return ["Unable to connect to AI reasoning engine.", "Verify API keys are configured."]
    
    try:
        prompt = f"""
        You are an expert fact-checker and journalism analyst.
        The following news article has been classified as mostly "{consensus}" by a machine learning ensemble.
        Provide exactly 3 concise bullet points explaining WHY this text exhibits traits of being "{consensus}".
        Focus on linguistic markers, presence or lack of verifiable sources, emotional tone, text formatting, and logical consistency.
        Do not use conversational filler. Return exactly 3 bullet points starting with a hyphen.

        Article text:
        {article_text[:1000]}
        """
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant", 
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.3
        )
        content = response.choices[0].message.content.strip()
        
        points = [line.strip().lstrip('-').lstrip('*').strip() for line in content.split('\n') if line.strip().startswith('-') or line.strip().startswith('*')]
        
        if len(points) == 0:
            points = [line.strip() for line in content.split('\n') if line.strip()][:3]
            
        return points[:3]
    except Exception as e:
        print(f"Groq reasoning failed: {e}")
        return ["AI reasoning engine temporarily unavailable.", "Could not generate analysis points."]

# Paths
# MODELS_DIR = os.path.join(os.path.dirname(__file__), '../../new_models')
# LIAR_MODELS_DIR = os.path.join(os.path.dirname(__file__), '../../liar_ml_models')


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
MODELS_DIR = os.path.join(BASE_DIR, "new_models")
LIAR_MODELS_DIR = os.path.join(BASE_DIR, "liar_ml_models")


# Global variables to hold models
models = {
    'welfake': {},
    'liar': {}
}
vectorizers = {
    'welfake': None,
    'liar': None
}

# Weighted Consensus Configuration
model_weights = {
    'xgboost': 20.0,
    'lightgbm': 20.0,
    'randomforest': 15.0,
    'svm': 10.0,
    'logistic': 8.0,
    'sgd': 7.0,
    'web_search': 20.0, # Used for scaling adjustment
    'naive_bayes': 0.0 # Excluded from weighted vote
}

@app.on_event("startup")
def load_models():
    global vectorizers, models
    
    # --- Load WELFake Models ---
    tfidf_welfake_path = os.path.join(MODELS_DIR, 'tfidf.pkl')
    try:
        vectorizers['welfake'] = joblib.load(tfidf_welfake_path)
        print("WELFake TF-IDF vectorizer loaded successfully.")
    except Exception as e:
        print(f"Error loading WELFake TF-IDF vectorizer: {e}")
        
    model_names = [
        'lightgbm', 'logistic', 'naive_bayes', 
        'randomforest', 'sgd', 'svm', 'xgboost'
    ]
    
    for name in model_names:
        model_path = os.path.join(MODELS_DIR, f'{name}.pkl')
        try:
            models['welfake'][name] = joblib.load(model_path)
            print(f"WELFake Model {name} loaded successfully.")
        except Exception as e:
            print(f"Error loading WELFake model {name}: {e}")

    # --- Load LIAR Models ---
    tfidf_liar_path = os.path.join(LIAR_MODELS_DIR, 'liar_tfidf.pkl')
    try:
        vectorizers['liar'] = joblib.load(tfidf_liar_path)
        print("LIAR TF-IDF vectorizer loaded successfully.")
    except Exception as e:
        print(f"Error loading LIAR TF-IDF vectorizer: {e}")

    for name in model_names:
        if name == 'lightgbm': 
            continue # LIAR may not have lightgbm trained, skip if missing or adjust if it does exist. Let's assume the names match but with _liar suffix.
        model_path = os.path.join(LIAR_MODELS_DIR, f'{name}_liar.pkl')
        if os.path.exists(model_path):
            try:
                models['liar'][name] = joblib.load(model_path)
                print(f"LIAR Model {name} loaded successfully.")
            except Exception as e:
                print(f"Error loading LIAR model {name}: {e}")
        else:
            print(f"LIAR Model {name}_liar.pkl not found. Skipping.")

class PredictRequest(BaseModel):
    text: str
    dataset: str = "welfake"

@app.post("/predict")
def predict_news(request: PredictRequest):
    if not request.text or request.text.strip() == "":
        raise HTTPException(status_code=400, detail="Text is required")
        
    dataset = request.dataset.lower()
    if dataset not in vectorizers or not vectorizers[dataset]:
        raise HTTPException(status_code=500, detail=f"TF-IDF vectorizer not loaded for dataset: {dataset}")
        
    active_models = models.get(dataset, {})
    if not active_models:
        raise HTTPException(status_code=500, detail=f"No models found for dataset: {dataset}")

    try:
        # Transform the text
        X = vectorizers[dataset].transform([request.text])
        
        results = {}
        for name, model in active_models.items():
            # Get prediction
            pred = model.predict(X)[0]
            
            # Map prediction to label
            # Based on standard fake news datasets (like WELFake): 0=Fake, 1=Real
            label = "Real" if pred == 1 else "Fake"
            
            # Get confidence if possible
            confidence = 0.0
            if hasattr(model, 'predict_proba'):
                try:
                    proba = model.predict_proba(X)[0]
                    confidence = float(np.max(proba))
                except Exception:
                    pass
            elif hasattr(model, 'decision_function'):
                try:
                    decision = model.decision_function(X)[0]
                    # Map distance to a pseudo-probability between 0.5 and 1.0
                    if decision >= 0:
                        confidence = float(1 / (1 + np.exp(-decision)))
                    else:
                        confidence = float(1 - (1 / (1 + np.exp(-decision))))
                except Exception:
                    pass
                    
            if confidence == 0.0:
                confidence = 1.0 # fallback if probability is unavailable
                
            results[name] = {
                "prediction": label,
                "confidence": round(confidence * 100, 2),
                "raw_prediction": int(pred)
            }
            
        web_verification = verify_with_web(request.text)
        
        # Calculate Weighted Consensus
        
        # Step A - ML Ensemble Score
        total_ml_weight = 0.0
        weighted_fake_prob_sum = 0.0
        
        for name, res in results.items():
            if name == 'naive_bayes':
                continue
                
            weight = model_weights.get(name, 0.0)
            total_ml_weight += weight
            
            # Extract probability of being fake
            confidence = res['confidence'] / 100.0 # Convert 0-100 to 0.0-1.0
            if res['prediction'] == 'Fake':
                fake_prob = confidence
            else:
                fake_prob = 1.0 - confidence
                
            weighted_fake_prob_sum += (fake_prob * weight)
            
        ml_score = weighted_fake_prob_sum / total_ml_weight if total_ml_weight > 0 else 0.0
        
        # Step B - Web Search Adjustment
        web_score = web_verification.get('score', 0)
        
        # If we have strong corroboration from trusted sites (e.g. >= 70 score), 
        # it strongly implies the news is Real. Override the ML consensus.
        if web_score >= 70:
            web_adjustment = -1.0 # Forces final_score to 0.0 (Real)
        elif web_score >= 50:
            # Medium trust - lean slightly towards real
            web_adjustment = -0.15
        else:
            # Normal adjustment based on low web score mapping (+0.15 to 0.0)
            # Formula: adjustment = 0.15 - (web_score / 100.0) * 0.30
            web_adjustment = 0.15 - (web_score / 100.0) * 0.30
        
        # Step C - Final Score
        final_score = ml_score + web_adjustment
        
        # Clamp between 0 and 1
        final_score = max(0.0, min(1.0, final_score))
        
        consensus_label = "Fake" if final_score >= 0.5 else "Real"
        
        weighted_consensus = {
            "prediction": consensus_label,
            "ml_score": round(ml_score, 4),
            "web_adjustment": round(web_adjustment, 4),
            "final_score": round(final_score, 4),
            "weights_used": model_weights
        }

        analysis_points = generate_reasoning(request.text, consensus_label)
            
        return {
            "status": "success", 
            "results": results, 
            "web_verification": web_verification,
            "weighted_consensus": weighted_consensus,
            "analysis": analysis_points
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
