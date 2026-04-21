<div align="center">

# 📰 NewsPortal — AI-Powered Fake News Detection Platform

A full-stack news aggregation and AI-powered fake news verification platform that combines **7 machine learning models**, **real-time web verification**, and **NLI-based reasoning** to detect misinformation.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

</div>

---

## 🌟 Features

### 📰 News Aggregation
- **Real-time news** fetched from NewsData.io API across 8 categories (General, Business, Technology, Science, Health, Sports, Entertainment, KIIT)
- **Personalized "For You" feed** powered by a recommendation engine based on user reading history
- **Infinite scroll** with smart category-level caching for instant navigation
- **Interactive India Map** for state-wise regional news browsing
- **Live trending topics** via Google Trends API
- **Weather widget** with location-based forecasts

### 🧠 AI Fake News Verification (Core Feature)
- **3 Intelligence Engines** trained on different datasets:
  - **ISOT Engine** — Real vs. Fake news corpus with DistilBERT transformer
  - **LIAR Engine** — Political claims dataset
  - **WELFake Engine** — Large-scale fake news dataset
- **7 ML Models** running in parallel per engine:
  - DistilBERT (fine-tuned transformer — ISOT only)
  - LightGBM, XGBoost, Random Forest, Logistic Regression, SVM, SGD
- **Real-time Web Verification** — live search + NLI (Natural Language Inference) via Groq/LLaMA
- **Google Fact Check API** integration for professional fact-checker verdicts
- **Weighted Ensemble Consensus** with per-model accuracy-based weights
- **AI Reasoning** — LLM-generated explanations for each verdict

### 👤 User Features
- **Google OAuth** authentication
- **Bookmarks** — save articles for later
- **Reading History** tracking
- **User Profiles** with preference management

### 📱 Responsive Design
- Fully responsive with dedicated **mobile layouts**
- Mobile-optimized home page with horizontal category sections
- Glassmorphism UI with smooth animations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                   │
│         News Feed │ Verify Page │ Maps │ Profiles           │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────────┐
│                  Node.js/Express Backend                    │
│    News API │ Auth │ History │ Recommendations │ Verify     │
└──────┬──────────────────┬──────────────────────┬────────────┘
       │                  │                      │
       ▼                  ▼                      ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐
│  MongoDB     │  │  External    │  │  Python ML Microservice │
│  Atlas       │  │  APIs        │  │  (FastAPI)              │
│              │  │              │  │                         │
│ • Users      │  │ • NewsData   │  │ • 3 Engines (ISOT,      │
│ • Articles   │  │ • Google     │  │   LIAR, WELFake)        │
│ • History    │  │   Trends     │  │ • DistilBERT Transformer│
│ • Interaction│  │ • Serper     │  │ • 6 sklearn Models      │
│              │  │ • Groq LLM   │  │ • Web Verification (NLI)│
│              │  │ • Fact Check │  │ • AI Reasoning (Groq)   │
└──────────────┘  └──────────────┘  └─────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Recharts, Lucide Icons |
| **Backend** | Node.js, Express 5, Mongoose |
| **ML Service** | Python, FastAPI, scikit-learn, XGBoost, LightGBM, PyTorch, HuggingFace Transformers |
| **Database** | MongoDB Atlas |
| **Auth** | Google OAuth 2.0, JWT |
| **APIs** | NewsData.io, Google Trends, Serper (web search), Groq (LLaMA 3.1), Google Fact Check Tools |
| **Deployment** | Render (backend), Vercel/Netlify (frontend), HuggingFace Spaces (ML service) |

---

## 📁 Project Structure

```
NewsPortal/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Header.jsx
│   │   │   ├── NewsCard.jsx
│   │   │   ├── WeatherWidget.jsx
│   │   │   ├── TrendingSection.jsx
│   │   │   ├── IndiaMap.jsx
│   │   │   ├── AuthModal.jsx
│   │   │   ├── OnboardingModal.jsx
│   │   │   └── MobileHomePage.jsx
│   │   ├── pages/               # Route pages
│   │   │   ├── HomePage.jsx
│   │   │   ├── VerifyNewsPage.jsx
│   │   │   ├── NewsDetailPage.jsx
│   │   │   ├── RegionalNewsPage.jsx
│   │   │   ├── SearchPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── BookmarksPage.jsx
│   │   │   └── HistoryPage.jsx
│   │   ├── context/             # Auth context provider
│   │   ├── services/            # API service layer
│   │   └── App.jsx
│   └── .env                     # VITE_API_BASE_URL, Google Client ID
│
├── backend/                     # Node.js + Express API server
│   ├── config/
│   │   ├── db.js                # MongoDB connection
│   │   └── corsOptions.js       # CORS configuration
│   ├── controllers/
│   │   ├── newsController.js    # News fetching & search logic
│   │   ├── verifyController.js  # ML service forwarder
│   │   ├── authController.js    # Google OAuth handler
│   │   ├── userController.js    # User profile & bookmarks
│   │   ├── historyController.js # Reading history
│   │   └── recommendationController.js
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Article.js
│   │   ├── History.js
│   │   └── Interaction.js
│   ├── routes/                  # Express route definitions
│   ├── server.js                # Entry point
│   └── .env                     # MongoDB URI, API keys
│
├── ml_service/                  # Python FastAPI ML microservice
│   ├── app/
│   │   └── main.py              # All ML logic, endpoints, web verification
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env                     # Groq API key, Serper key
│
├── new_models/                  # WELFake trained model files (.pkl)
├── liar_ml_models/              # LIAR trained model files (.pkl)
├── isot_models/                 # ISOT models + DistilBERT weights
├── start_all.bat                # Windows: start all services
└── start_all.sh                 # Linux/Mac: start all services
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Python** 3.9+
- **MongoDB** (local or Atlas)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/utkrshydv/NewsPortal.git
cd NewsPortal
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?appName=Cluster0
NEWSDATA_API_KEY=your_newsdata_api_key
GEMINI_API_KEY=your_gemini_api_key
SERPER_API_KEY=your_serper_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 3. ML Service Setup

```bash
cd ml_service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `ml_service/.env`:
```env
GROQ_API_KEY=your_groq_api_key
SERPER_API_KEY=your_serper_api_key
GOOGLE_FACT_CHECK_API_KEY=your_google_fact_check_key
```

> **Note:** ML model files (.pkl, .safetensors) are auto-downloaded from [HuggingFace](https://huggingface.co/utkrshydv/newsPortal-Models) on first startup.

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 5. Run Everything

**Option A — Use the start script:**
```bash
# Windows
./start_all.bat

# Linux/Mac
./start_all.sh
```

**Option B — Run manually (3 terminals):**
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: ML Service
cd ml_service && uvicorn app.main:app --reload --port 8000

# Terminal 3: Frontend
cd frontend && npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔌 API Endpoints

### News
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/news` | Fetch news articles (supports `?category=` filter) |
| `GET` | `/api/news/search?q=` | Search news articles |
| `GET` | `/api/news/region?state=` | Get regional news by Indian state |
| `GET` | `/api/news/trending` | Get live trending topics |
| `GET` | `/api/news/:id` | Get single article by ID |

### Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/verify-news` | Verify news text (forwards to ML service) |

### Auth & Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/google` | Google OAuth login/register |
| `GET` | `/api/users/profile` | Get user profile |
| `PUT` | `/api/users/bookmarks/:id` | Toggle article bookmark |
| `GET` | `/api/history` | Get reading history |
| `GET` | `/api/recommendations/:userId` | Get personalized recommendations |

### ML Service (Internal)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict` | Run ensemble prediction (text + dataset) |

---

## 🧪 ML Model Performance

### ISOT Engine (with DistilBERT)
| Model | Accuracy | Weight |
|-------|----------|--------|
| DistilBERT | ~92% | 45% |
| XGBoost | ~95% | 20% |
| LightGBM | ~94% | 18% |
| Random Forest | ~93% | 12% |
| Logistic Regression | ~90% | 5% |

### WELFake Engine
| Model | Weight |
|-------|--------|
| XGBoost | 25% |
| LightGBM | 25% |
| Random Forest | 20% |
| SVM | 15% |
| SGD | 10% |
| Logistic Regression | 5% |

### LIAR Engine
| Model | Weight |
|-------|--------|
| XGBoost | 30% |
| Random Forest | 25% |
| SVM | 20% |
| SGD | 15% |
| Logistic Regression | 10% |

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `NEWSDATA_API_KEY` | NewsData.io API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `SERPER_API_KEY` | Serper.dev search API key |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `ML_SERVICE_URL` | ML microservice URL |

### ML Service (`ml_service/.env`)
| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key (for LLaMA inference) |
| `SERPER_API_KEY` | Serper.dev search API key |
| `GOOGLE_FACT_CHECK_API_KEY` | Google Fact Check Tools API key |

### Frontend (`frontend/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request




---

<div align="center">

**Built with ❤️ by [Utkarsh Yadav](https://github.com/utkrshydv)**

</div>
