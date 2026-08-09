import { useState } from 'react';
import {
  BookOpen,
  Newspaper,
  SlidersHorizontal,
  ShieldCheck,
  BrainCircuit,
  SearchCheck,
  Scale,
  Database,
  UserRound,
  MapPinned,
  ServerCog,
  GitBranch,
  ChevronRight,
} from 'lucide-react';
import './DocsPage.css';

const panels = [
  { id: 'overview', label: 'System overview', icon: BookOpen },
  { id: 'news', label: 'News discovery', icon: Newspaper },
  { id: 'recommendations', label: 'Recommendation engine', icon: SlidersHorizontal },
  { id: 'verification', label: 'Verification pipeline', icon: ShieldCheck },
  { id: 'engines', label: 'ML engines', icon: BrainCircuit },
  { id: 'evidence', label: 'Web evidence', icon: SearchCheck },
  { id: 'fusion', label: 'Decision fusion', icon: Scale },
  { id: 'data', label: 'Data and identity', icon: Database },
  { id: 'regional', label: 'Regional and trending', icon: MapPinned },
  { id: 'runtime', label: 'Runtime architecture', icon: ServerCog },
];

const modelRows = [
  {
    engine: 'WELFake',
    input: 'Long-form news articles',
    models: 'XGBoost, LightGBM, Random Forest, SVM, SGD, Logistic Regression, Naive Bayes',
    active: '6 weighted signals',
    mapping: '1 = Fake, 0 = Real',
  },
  {
    engine: 'LIAR',
    input: 'Short factual and political claims',
    models: 'XGBoost, Random Forest, SVM, SGD, Logistic Regression, Naive Bayes',
    active: '5 weighted signals',
    mapping: '1 = Real, 0 = Fake',
  },
  {
    engine: 'ISOT',
    input: 'Full news articles',
    models: 'DistilBERT, XGBoost, LightGBM, Random Forest, Logistic Regression',
    active: '5 weighted signals',
    mapping: '1 = Real, 0 = Fake',
  },
];

const weightRows = [
  ['WELFake', 'XGBoost 25%', 'LightGBM 25%', 'Random Forest 20%', 'SVM 15%', 'SGD 10%', 'Logistic 5%'],
  ['LIAR', 'XGBoost 30%', 'Random Forest 25%', 'SVM 20%', 'SGD 15%', 'Logistic 10%', ''],
  ['ISOT', 'DistilBERT 45%', 'XGBoost 20%', 'LightGBM 18%', 'Random Forest 12%', 'Logistic 5%', ''],
];

function Section({ id, title, intro, children }) {
  return (
    <section id={id} className="docs-section glass-panel">
      <div className="docs-section-heading">
        <h2>{title}</h2>
        {intro && <p>{intro}</p>}
      </div>
      {children}
    </section>
  );
}

function DocsPage() {
  const [active, setActive] = useState('overview');

  const jumpTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="docs-page">
      <div className="docs-hero glass-panel">
        <div className="docs-hero-copy">
          <div className="docs-kicker"><GitBranch size={16} /> Technical documentation</div>
          <h1>How NewsPortal works</h1>
          <p>
            A system-level guide to news ingestion, personalization, misinformation verification,
            evidence retrieval, score fusion, persistence, and the service boundaries behind the application.
          </p>
        </div>
        <div className="docs-hero-stats" aria-label="Architecture summary">
          <div><strong>3</strong><span>runtime services</span></div>
          <div><strong>3</strong><span>ML engines</span></div>
          <div><strong>18</strong><span>model artifacts</span></div>
          <div><strong>3-tier</strong><span>verification flow</span></div>
        </div>
      </div>

      <div className="docs-layout">
        <aside className="docs-sidebar glass-panel" aria-label="Documentation sections">
          <div className="docs-sidebar-title">Contents</div>
          <nav>
            {panels.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={active === id ? 'active' : ''}
                onClick={() => jumpTo(id)}
              >
                <Icon size={17} />
                <span>{label}</span>
                <ChevronRight size={15} className="docs-nav-chevron" />
              </button>
            ))}
          </nav>
        </aside>

        <div className="docs-content">
          <Section
            id="overview"
            title="System overview"
            intro="NewsPortal separates product delivery from model inference so each layer can evolve independently."
          >
            <div className="docs-flow-grid">
              <div className="docs-flow-node">
                <span>Client</span>
                <strong>React + Vite</strong>
                <p>Routing, search, reader interactions, verification UI, auth state, bookmarks, history, regional views.</p>
              </div>
              <div className="docs-flow-node">
                <span>Application API</span>
                <strong>Node.js + Express</strong>
                <p>News orchestration, user domain, persistence, recommendation scoring, external API access, ML gateway.</p>
              </div>
              <div className="docs-flow-node">
                <span>Inference API</span>
                <strong>FastAPI + Python</strong>
                <p>Dataset-specific model loading, ensemble inference, live evidence retrieval, score fusion, reasoning.</p>
              </div>
              <div className="docs-flow-node">
                <span>Persistence</span>
                <strong>MongoDB</strong>
                <p>Users, normalized articles, bookmarks, reading history, interactions, preferences, personalization state.</p>
              </div>
            </div>
            <div className="docs-callout">
              <strong>Primary design principle</strong>
              <p>
                The browser never needs to know where model artifacts live or how a classifier is loaded. It talks to the Express API,
                while the Express verification gateway communicates with the FastAPI inference service.
              </p>
            </div>
          </Section>

          <Section
            id="news"
            title="News discovery pipeline"
            intro="The news layer normalizes third-party feed data into a stable application model before it reaches the reader."
          >
            <ol className="docs-steps">
              <li><strong>Request.</strong> The client requests a category, search result, article, regional feed, or trending view through the Express API.</li>
              <li><strong>Fetch.</strong> The backend queries the appropriate upstream source, including NewsData.io, Serper news search, or Google Trends integration.</li>
              <li><strong>Normalize.</strong> External objects are converted into the NewsPortal article shape so the frontend does not depend on vendor-specific fields.</li>
              <li><strong>Deduplicate and persist.</strong> Normalized articles can be upserted into MongoDB, giving reader features a stable article record.</li>
              <li><strong>Deliver.</strong> The API returns a predictable payload for cards, detail views, search, history, and bookmarks.</li>
            </ol>
            <div className="docs-two-col">
              <div className="docs-subpanel"><h3>Why persistence matters</h3><p>A live feed item can later be opened from history or bookmarks even after the original upstream request has ended.</p></div>
              <div className="docs-subpanel"><h3>Fallback behavior</h3><p>If the primary news fetch fails, the backend can return a local fallback pool instead of making the whole home experience dependent on one provider.</p></div>
            </div>
          </Section>

          <Section
            id="recommendations"
            title="Recommendation engine"
            intro="Personalization combines explicit interests with observed behavior, article popularity, freshness, and controlled exploration."
          >
            <div className="docs-formula">
              <code>finalScore = alpha × personalization + beta × popularity + gamma × recency</code>
            </div>
            <div className="docs-three-col">
              <div className="docs-subpanel"><h3>Personalization</h3><p>Category weights learned from reader interactions are preferred. Explicit onboarding preferences act as the cold-start fallback.</p></div>
              <div className="docs-subpanel"><h3>Popularity</h3><p>Trending score and global views are normalized into a bounded popularity signal instead of ranking solely on raw view count.</p></div>
              <div className="docs-subpanel"><h3>Recency</h3><p>Freshness follows exponential decay using <code>exp(-0.05 × hoursOld)</code>, so older stories gradually lose ranking strength.</p></div>
            </div>
            <h3 className="docs-inner-title">Exploration and exploitation</h3>
            <p className="docs-body-copy">
              Candidates are split between categories the reader already prefers and categories outside that strongest preference set.
              The final feed interleaves both pools. As interaction history grows, exploration can increase so personalization does not reduce the feed to a narrow loop.
            </p>
          </Section>

          <Section
            id="verification"
            title="Verification pipeline"
            intro="Verification is a staged decision process. Model inference creates the text-based prior, live evidence adds current context, and indexed professional fact checks receive the highest authority when available."
          >
            <div className="docs-pipeline">
              <div><span>1</span><strong>Dataset engine</strong><p>Run the selected WELFake, LIAR, or ISOT model family.</p></div>
              <div><span>2</span><strong>ML consensus</strong><p>Convert model votes into a normalized fake-probability score.</p></div>
              <div><span>3</span><strong>Claim extraction</strong><p>Extract a concise factual claim for evidence lookup, with a deterministic sentence fallback.</p></div>
              <div><span>4</span><strong>Live evidence</strong><p>Search the web and interpret support, neutrality, or contradiction.</p></div>
              <div><span>5</span><strong>Fact-check lookup</strong><p>Query Google Fact Check data for an existing professional verdict.</p></div>
              <div><span>6</span><strong>Final verdict</strong><p>Fuse the available signals, classify at the 0.5 threshold, then generate the explanation.</p></div>
            </div>
            <div className="docs-callout">
              <strong>Important separation</strong>
              <p>The generated explanation is downstream of the numerical verdict. LLM prose does not directly cast a model vote in the ensemble.</p>
            </div>
          </Section>

          <Section
            id="engines"
            title="ML engines and methodology"
            intro="Each dataset has its own model inventory and label convention. The service normalizes those differences into one fake-probability direction before fusion."
          >
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead><tr><th>Engine</th><th>Best suited input</th><th>Configured models</th><th>Active vote set</th><th>Stored label convention</th></tr></thead>
                <tbody>{modelRows.map((row) => <tr key={row.engine}><td><strong>{row.engine}</strong></td><td>{row.input}</td><td>{row.models}</td><td>{row.active}</td><td><code>{row.mapping}</code></td></tr>)}</tbody>
              </table>
            </div>

            <h3 className="docs-inner-title">Configured ensemble weights</h3>
            <p className="docs-body-copy">Weights express relative voting influence inside an engine. They are not displayed as model accuracy values.</p>
            <div className="docs-weight-list">
              {weightRows.map((row) => (
                <div className="docs-weight-row" key={row[0]}>
                  <strong>{row[0]}</strong>
                  <div>{row.slice(1).filter(Boolean).map((item) => <span key={item}>{item}</span>)}</div>
                </div>
              ))}
            </div>

            <div className="docs-two-col">
              <div className="docs-subpanel"><h3>TF-IDF classical path</h3><p>WELFake, LIAR, and the classical ISOT models transform submitted text through their dataset-specific vectorizer before inference.</p></div>
              <div className="docs-subpanel"><h3>Transformer path</h3><p>ISOT additionally runs a fine-tuned DistilBERT sequence classifier. Its configured 45% weight makes it the dominant model signal in that engine.</p></div>
            </div>
          </Section>

          <Section
            id="evidence"
            title="Live web evidence"
            intro="Static classifiers identify patterns learned from training data. The evidence layer adds information that can exist after those models were trained."
          >
            <div className="docs-three-col">
              <div className="docs-subpanel"><h3>Claim extraction</h3><p>Groq is used to extract a single specific, searchable claim. If that call is unavailable, the first sufficiently informative sentence becomes the query.</p></div>
              <div className="docs-subpanel"><h3>Search evidence</h3><p>Serper-backed search results provide current external context. The service reduces the evidence to support, neutral, or contradiction behavior and a credibility score.</p></div>
              <div className="docs-subpanel"><h3>Professional fact checks</h3><p>The Google Fact Check Tools API is queried separately. A matched verdict is treated as a higher-authority signal than the model and general web blend.</p></div>
            </div>
          </Section>

          <Section
            id="fusion"
            title="Decision fusion"
            intro="All internal scoring is normalized so 0.0 means Real and 1.0 means Fake before the final threshold is applied."
          >
            <div className="docs-decision-grid">
              <div className="docs-decision-card"><span>ML prior</span><strong>Weighted model vote</strong><p>Only models with non-zero configured weight contribute to <code>ml_score</code>.</p></div>
              <div className="docs-decision-card"><span>Web influence</span><strong>Up to 70% when decisive</strong><p>The farther web evidence moves from neutral, the more influence it receives in the blended score.</p></div>
              <div className="docs-decision-card"><span>Fact-check tier</span><strong>Highest priority</strong><p>If a professional fact-check match is found, its normalized fake score becomes the final score.</p></div>
              <div className="docs-decision-card"><span>Classification</span><strong>0.5 threshold</strong><p><code>final_score &gt;= 0.5</code> returns Fake. Scores below 0.5 return Real.</p></div>
            </div>
            <div className="docs-formula docs-formula-small">
              <code>nliFinal = webWeight × webFakeScore + mlWeight × mlScore</code>
            </div>
            <p className="docs-body-copy">
              Web weight is computed from evidence decisiveness: <code>0.7 × neutrality</code>, where neutrality is the distance of the normalized web score from 0.5. Neutral evidence therefore leaves more responsibility with the ML prior, while decisive evidence receives more influence.
            </p>
          </Section>

          <Section
            id="data"
            title="Data, identity, and reader state"
            intro="MongoDB connects live content to durable reader features while JWT-backed routes protect authenticated profile operations."
          >
            <div className="docs-two-col">
              <div className="docs-subpanel">
                <h3>User state</h3>
                <ul><li>Profile and authentication identity</li><li>Explicit category preferences</li><li>Learned category weights</li><li>Bookmarks</li><li>Reading history</li><li>Interaction events and reader statistics</li></ul>
              </div>
              <div className="docs-subpanel">
                <h3>Article state</h3>
                <ul><li>Normalized article metadata</li><li>Stable article identifiers</li><li>Categories and source data</li><li>Global views and trending signals</li><li>Records reusable by detail, history, bookmark, and recommendation flows</li></ul>
              </div>
            </div>
            <div className="docs-callout"><UserRound size={20} /><div><strong>Cold start</strong><p>A new reader can receive relevant content from explicit onboarding preferences before enough behavioral data exists for learned category weights.</p></div></div>
          </Section>

          <Section
            id="regional"
            title="Regional news and trending intelligence"
            intro="NewsPortal treats geographic discovery and trend discovery as separate signals from the standard category feed."
          >
            <div className="docs-two-col">
              <div className="docs-subpanel"><h3>Regional news</h3><p>The India map selects a state, the backend performs a state-specific news search through Serper, and normalized results are returned to the regional view.</p></div>
              <div className="docs-subpanel"><h3>Trending topics</h3><p>Google Trends integration supplies topic momentum used by the product layer and supports a broader view of what readers are currently searching for.</p></div>
            </div>
          </Section>

          <Section
            id="runtime"
            title="Runtime architecture"
            intro="Three independently started services keep browser delivery, product-domain logic, and Python inference responsibilities distinct."
          >
            <div className="docs-runtime">
              <div><strong>Frontend</strong><code>Vite / React</code><p>Serves the interactive application and sends REST requests to the backend.</p></div>
              <div><strong>Backend</strong><code>Express</code><p>Owns application routes, MongoDB access, upstream news APIs, user logic, recommendations, and verification proxying.</p></div>
              <div><strong>ML service</strong><code>FastAPI</code><p>Downloads or loads configured model artifacts, performs inference, retrieves evidence, and returns the verification report.</p></div>
            </div>
            <h3 className="docs-inner-title">Verification request path</h3>
            <ol className="docs-steps compact">
              <li>React submits text and the selected engine to <code>POST /api/verify-news</code>.</li>
              <li>Express validates the request and forwards it to the configured FastAPI <code>/predict</code> endpoint.</li>
              <li>FastAPI executes the selected model family and evidence workflow.</li>
              <li>The response returns per-model predictions, web verification, generated analysis, and weighted consensus.</li>
              <li>The frontend renders model signals, credibility evidence, final probability, and explanation as separate report panels.</li>
            </ol>
          </Section>
        </div>
      </div>
    </div>
  );
}

export default DocsPage;
