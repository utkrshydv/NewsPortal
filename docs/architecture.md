<div align="center">

# NewsPortal Architecture

### Runtime boundaries, dependency flow, persistence, and service responsibilities

</div>

---

## Architectural goals visible in the implementation

The repository separates product-domain logic from model-runtime logic instead of treating the application as one monolith. That separation is the most important architectural choice in the codebase.

The system has three execution environments:

1. **Browser:** React renders the product and manages user interaction.
2. **Application API:** Express owns product state, authentication, external news access, and recommendation logic.
3. **Inference API:** FastAPI owns Python ML dependencies, model artifacts, web evidence retrieval, and verification score fusion.

MongoDB is shared by the application domains that require persistence.

---

## Container view



```mermaid
flowchart TB
    subgraph Browser
        FE[React + Vite]
    end

    subgraph Application
        API[Express API]
        DB[(MongoDB)]
    end

    subgraph Intelligence
        ML[FastAPI verification service]
        ART[(Model artifacts)]
    end

    FE --> API
    API --> DB
    API --> ML
    ML --> ART

    API --> N[NewsData.io]
    API --> T[Google Trends]
    API --> R[Serper News]

    ML --> S[Serper Search]
    ML --> F[Google Fact Check]
    ML --> G[Groq]
```

---

## Backend domain map

```mermaid
flowchart LR
    SERVER[server.js] --> NR[newsRoutes]
    SERVER --> AR[authRoutes]
    SERVER --> UR[userRoutes]
    SERVER --> HR[historyRoutes]
    SERVER --> RR[recommendationRoutes]
    SERVER --> VR[verifyRoutes]

    NR --> NC[newsController]
    AR --> AC[authController]
    UR --> UC[userController]
    HR --> HC[historyController]
    RR --> RC[recommendationController]
    VR --> VC[verifyController]

    AC --> USER[(User)]
    UC --> USER
    UC --> HIST[(History)]
    UC --> ARTICLE[(Article)]
    HC --> HIST
    RC --> USER
    RC --> HIST
    RC --> ARTICLE
    NC --> ARTICLE
    VC --> ML[FastAPI /predict]
```

### Why this matters

The backend is not only a proxy. It owns several domain rules:

- News response normalization and de-duplication.
- Persistence of external news into a stable local schema.
- JWT authentication and Google identity handling.
- Bookmark/history/profile behavior.
- Recommendation candidate selection and ranking.
- Error translation when the ML service is unavailable.

This means moving the entire backend into the frontend would lose a meaningful application boundary.

---

## Persistence model

```mermaid
erDiagram
    USER ||--o{ HISTORY : has
    USER ||--o{ INTERACTION : produces

    USER {
        ObjectId _id PK
        string name
        string email UK
        string password
        string googleId
        string[] preferences
        string[] explicitPreferences
        string[] bookmarkedArticles
        map categoryWeights
        number interactionCount
        boolean onboardingCompleted
    }

    ARTICLE {
        ObjectId _id PK
        string articleId UK
        string title
        string category
        string content
        string imageUrl
        string sourceUrl
        date date
        number globalViews
        number trendingScore
    }

    HISTORY {
        ObjectId _id PK
        ObjectId user FK
        string articleId
        string category
        date timestamp
    }

    INTERACTION {
        ObjectId _id PK
        ObjectId userId FK
        string articleId
        string category
        string actionType
        number weight
    }
```

### Article caching strategy

When the live news API returns an article, the backend normalizes it and asynchronously upserts it into the `Article` collection. This turns an ephemeral third-party response into an object that later flows can resolve for:

- Article details.
- Bookmarks.
- Recommendation candidate pools.
- User history-related views.

The strategy is simple, but it addresses a common integration problem: external IDs and article payloads may not remain available through the same feed call later.

---

## Runtime sequence: feed request

```mermaid
sequenceDiagram
    participant UI as React
    participant API as Express
    participant EXT as NewsData.io
    participant DB as MongoDB
    participant LOCAL as Local fallback pool

    UI->>API: GET /api/news?category=...
    API->>EXT: GET live news

    alt Live response succeeds
        EXT-->>API: Articles + next page token
        API->>API: Normalize, categorize, deduplicate
        API-->>DB: Upsert each normalized article
        API-->>UI: Feed + nextPage
    else Live request fails
        API->>LOCAL: Read static fallback data
        LOCAL-->>API: Articles
        API->>API: Filter + paginate
        API-->>UI: Fallback feed + nextPage
    end
```

---

## Runtime sequence: verification request

```mermaid
sequenceDiagram
    participant UI as React
    participant API as Express
    participant ML as FastAPI
    participant MOD as Model ensemble
    participant WEB as Search / Fact Check
    participant LLM as Groq

    UI->>API: POST /api/verify-news {text, dataset}
    API->>API: Validate non-empty text
    API->>ML: POST /predict

    ML->>MOD: Transform text + run dataset-specific models
    MOD-->>ML: Per-model labels/confidence

    ML->>LLM: Extract factual claim
    LLM-->>ML: Searchable claim
    ML->>WEB: Fact-check lookup + web evidence search
    WEB-->>ML: Evidence

    ML->>ML: Compute weighted ML score
    ML->>ML: Fuse web evidence or apply fact-check override
    ML->>LLM: Generate verdict reasoning
    LLM-->>ML: Explanation

    ML-->>API: Structured result
    API-->>UI: Forward response
```

---

## Reliability boundaries

### Existing resilience mechanisms

- External news failures route to local data.
- Article details can resolve from persisted live articles.
- ML startup checks attempt to load/download artifacts.
- DistilBERT can be skipped if its runtime is unavailable.
- Claim extraction has a sentence-based fallback.
- Missing professional fact checks do not stop classification.
- Express converts upstream ML refusal/5xx behavior into a user-facing service-unavailable response.

### Gaps for a production architecture

- No distributed tracing across the three services.
- No queue or bulkhead around expensive verification calls.
- No explicit API rate-limiting layer.
- No startup schema validating all required environment variables.
- Recommendation endpoints are not consistently authorized by authenticated identity.
- No automated dependency health checks beyond simple root health routes.
- No test harness visible in `backend/package.json`.

---

## Deployment topology

The code supports independent deployment of the three runtime components.

```mermaid
flowchart LR
    CDN[Static / edge frontend host] --> API[Node API host]
    API --> MDB[(MongoDB Atlas)]
    API --> HF[Python ML host]
    HF --> EXT[External evidence APIs]
```

This is a sensible topology for a portfolio project because the Python model runtime can scale and cold-start independently from the product API. The tradeoff is additional network latency and operational complexity.

---

## Architecture review summary

**Strongest design choice:** separating Python inference from the Node product API.

**Most important data design choice:** persisting normalized live articles so downstream reader features do not depend on re-fetching the exact third-party object.

**Most important production gap:** security and observability around expensive public verification calls.

**Most important ML-systems gap:** no checked-in experiment/evaluation artifact that demonstrates calibration or end-to-end accuracy of the score-fusion strategy.
