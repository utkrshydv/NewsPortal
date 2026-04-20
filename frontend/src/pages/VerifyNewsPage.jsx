import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, ShieldCheck, AlertTriangle, Activity, Loader2, Sparkles, BrainCircuit, BarChart3, PieChart as PieChartIcon, Globe, ExternalLink, AlertCircle, Info, X } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import '../index.css';
import MobileBackButton from '../components/MobileBackButton';

const VerifyNewsPage = () => {
  const [text, setText] = useState('');
  const [dataset, setDataset] = useState('isot');
  const [engineData, setEngineData] = useState({
    welfake: null,
    liar: null,
    isot: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [sharedWebVerification, setSharedWebVerification] = useState(null);
  const resultsRef = useRef(null);

  // Derived Data (Must be before hooks that use them)
  const currentData = engineData[dataset];
  const results = currentData?.results;
  // webVerification is shared across all engines — use sharedWebVerification
  const webVerification = sharedWebVerification;
  const weightedConsensus = currentData?.weightedConsensus;
  const analysis = currentData?.analysis;

  const calculateOverallConsensus = () => {
    if (!results) return null;
    
    let fakeCount = 0;
    let realCount = 0;
    let totalConfidence = 0;
    
    const modelKeys = Object.keys(results);
    const totalModels = modelKeys.length;
    
    modelKeys.forEach(key => {
      const result = results[key];
      if (result.prediction.toLowerCase() === 'fake') {
        fakeCount++;
      } else {
        realCount++;
      }
      totalConfidence += result.confidence;
    });

    const isMostlyFake = fakeCount > realCount;
    const avgConfidence = totalConfidence / totalModels;
    const votePercentage = Math.round((Math.max(fakeCount, realCount) / totalModels) * 100);

    return {
      prediction: isMostlyFake ? 'Fake' : 'Real',
      votePercentage,
      fakeCount,
      realCount,
      totalModels,
      avgConfidence: Math.round(avgConfidence),
    };
  };

  const consensus = weightedConsensus || calculateOverallConsensus();

  // Auto-scroll to results when they become available
  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [results]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please enter some news text to verify.');
      return;
    }

    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 10) {
      setError('Text is too short for accurate analysis. Please provide at least 10 words of context.');
      return;
    }

    setLoading(true);
    setError('');
    // Clear all engine results and shared web verification
    setEngineData({ welfake: null, liar: null, isot: null });
    setSharedWebVerification(null);

    try {
      const fetchEngine = async (engineDataset) => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await axios.post(`${baseUrl}/api/verify-news`, { text, dataset: engineDataset });
        if (response.data && response.data.results) {
          return {
            results: response.data.results,
            webVerification: response.data.web_verification || null,
            weightedConsensus: response.data.weighted_consensus || null,
            analysis: response.data.analysis || null,
          };
        }
        throw new Error('Invalid response format from server');
      };

      // Execute both engines in parallel
      const [welfakeData, liarData, isotData] = await Promise.all([
        fetchEngine('welfake'),
        fetchEngine('liar'),
        fetchEngine('isot')
      ]);

      setEngineData({
        welfake: welfakeData,
        liar: liarData,
        isot: isotData
      });

      // Use the first non-null web_verification result as the shared one
      // (all 3 search the same text, so the result should be identical)
      const firstWebVerification =
        welfakeData.webVerification ||
        liarData.webVerification ||
        isotData.webVerification ||
        null;
      setSharedWebVerification(firstWebVerification);

    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'An error occurred during verification.'
      );
    } finally {
      setLoading(false);
    }
  };


  const formatModelName = (name) => {
    if (name === 'web_search') return 'Real-Time Web Search';
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };


  // Prepare Chart Data
  let pieData = [];
  if (weightedConsensus && weightedConsensus.ml_score !== undefined) {
    const fakeScore = Math.round(weightedConsensus.final_score * 100);
    const realScore = 100 - fakeScore;
    pieData = [
      { name: 'Fake Probability', value: fakeScore, color: '#ef4444' },
      { name: 'Real Probability', value: realScore, color: '#22c55e' },
    ];
  } else if (weightedConsensus && weightedConsensus.fake_weight_total !== undefined) {
    // Legacy support for older API response format
    pieData = [
      { name: 'Fake Weight', value: weightedConsensus.fake_weight_total, color: '#ef4444' },
      { name: 'Real Weight', value: weightedConsensus.real_weight_total, color: '#22c55e' },
    ];
  } else if (consensus) {
    pieData = [
      { name: 'Fake Predictions', value: consensus.fakeCount, color: '#ef4444' },
      { name: 'Real Predictions', value: consensus.realCount, color: '#22c55e' },
    ];
  }

  const barData = results ? Object.entries(results)
    .filter(([modelName]) => modelName !== 'naive_bayes')
    .map(([modelName, data]) => ({
      name: formatModelName(modelName).split(' ')[0], // Keep it short for X-axis
      fullName: formatModelName(modelName),
      confidence: data.confidence,
      prediction: data.prediction,
      fill: data.prediction.toLowerCase() === 'fake' ? '#ef4444' : '#22c55e'
  })) : [];

  const renderCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <p style={{ fontWeight: 600, margin: '0 0 4px 0', fontSize: '14px' }}>{data.fullName}</p>
          <p style={{ color: data.fill, margin: 0, fontWeight: 700 }}>
            {data.prediction}: {data.confidence}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderOverviewModal = () => {
    if (!showOverviewModal) return null;
    const steps = [
      {
        icon: '✍️',
        title: 'Step 1 — Paste Your Text',
        desc: 'You enter a news article, headline, or any text claim into the input box. The system requires at least 10 words for a meaningful analysis.'
      },
      {
        icon: '⚙️',
        title: 'Step 2 — Choose an Intelligence Engine',
        desc: 'Three engines are available, each trained on a different dataset. LIAR (political claims), ISOT (real vs. fake news corpus), and WELFake (large-scale fake news dataset). All three run in parallel so you can compare results.'
      },
      {
        icon: '🧠',
        title: 'Step 3 — 7 ML Models Analyze in Parallel',
        desc: 'Each engine runs up to 7 machine learning models simultaneously: DistilBERT (advanced transformer NLP), LightGBM, XGBoost, Random Forest, Logistic Regression, SVM, and SGD. Each model independently votes Real or Fake with a confidence score.'
      },
      {
        icon: '🌐',
        title: 'Step 4 — Real-Time Web Verification',
        desc: 'Simultaneously, the system performs a live web search to cross-reference the claim against trusted sources and fact-checkers. It computes a credibility score based on what reputable outlets say about the same topic.'
      },
      {
        icon: '⚖️',
        title: 'Step 5 — Weighted Consensus',
        desc: 'Each model is assigned a performance-based weight. A weighted fake probability score is computed from all model votes, then adjusted up or down by the real-time web verification result.'
      },
      {
        icon: '🏁',
        title: 'Step 6 — Final Verdict',
        desc: 'If the final combined score is ≥ 50%, the content is classified as FAKE. Below 50% = REAL. The AI Reasoning section then explains the key signals detected in the text.'
      },
    ];
    return (
      <div
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem', backdropFilter: 'blur(6px)' }}
        onClick={() => setShowOverviewModal(false)}
      >
        <div
          className="hide-scrollbar"
          style={{ padding: '2.5rem', borderRadius: '2rem', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.35)', position: 'relative', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)' }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setShowOverviewModal(false)}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', color: '#555', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.12)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(92,56,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BrainCircuit size={24} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e' }}>How It Works</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>AI-powered fake news detection pipeline</p>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(0,0,0,0.08)', margin: '1.5rem 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {steps.map((step, i) => (
              <div
                key={i}
                style={{ display: 'flex', gap: '1rem', padding: '1.1rem 1.25rem', background: 'rgba(255,255,255,0.6)', borderRadius: '1.1rem', border: '1px solid rgba(0,0,0,0.07)', alignItems: 'flex-start' }}
              >
                <div style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>{step.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1a1a2e', marginBottom: '0.3rem' }}>{step.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.25rem', padding: '0.9rem 1.1rem', background: 'rgba(92,56,235,0.07)', borderRadius: '1rem', border: '1px solid rgba(92,56,235,0.18)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Info size={17} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.85rem', color: '#444', lineHeight: 1.6 }}>
              After results appear, click <strong style={{ color: '#1a1a2e' }}>"How is this calculated?"</strong> next to the report heading for a detailed breakdown of each model's weight in the final score.
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderInfoModal = () => {
    if (!showInfoModal || !weightedConsensus || !weightedConsensus.weights_used) return null;
    
    // Sort weights highest to lowest
    const sortedWeights = Object.entries(weightedConsensus.weights_used)
      .sort(([, a], [, b]) => b - a)
      .filter(([, weight]) => weight > 0);

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }} onClick={() => setShowInfoModal(false)}>
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1.5rem', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowInfoModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={24} />
          </button>
          
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-color)' }}>
            <Activity size={24} color="var(--primary-color)" /> Ensemble Architecture
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            To provide the most accurate verdict, 7 ML models are aggregated into a primary confidence score. Real-time web search verification is then used to slightly adjust this score up or down.
          </p>
          
          <div style={{ background: 'var(--background-color)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            {sortedWeights.map(([name, weight], index) => (
               <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: index < sortedWeights.length - 1 ? '1px solid var(--border-color)' : 'none', alignItems: 'center' }}>
                 <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>{formatModelName(name)}</span>
                 <span style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.9rem' }}>
                   {weight}% Weight
                 </span>
               </div>
            ))}
          </div>
          
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '1rem', border: '1px solid rgba(79, 70, 229, 0.1)', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
             <Info size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary-color)' }} />
             <span>The final score is: <code>ML Score + Web Adjustment</code>. If the score is {'>='} 50%, it is ruled as Fake.</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="verify-page" style={{ padding: '1.5rem 1rem', maxWidth: '1600px', margin: '0 auto' }}>
      {renderOverviewModal()}
      {renderInfoModal()}
      <MobileBackButton label="Back" />

      {/* LANDSCAPE MAIN INTERFACE WRAPPED IN A COMMAND CARD */}
      <div className="command-card" style={{ padding: '3rem', marginBottom: '5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Soft decorative glow inside the card */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', opacity: 0.1, pointerEvents: 'none', filter: 'blur(60px)' }}></div>
        
        <div className="verify-main-grid verify-main-grid-mobile" style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1.2fr', 
          gap: '3rem', 
          alignItems: 'center', 
          position: 'relative',
          zIndex: 1
        }}>
          
          {/* LEFT COLUMN: HERO & CONTROLS */}
          <div className="animate-fade-in-up" style={{ textAlign: 'left' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'rgba(92, 56, 235, 0.1)', borderRadius: '18px', marginBottom: '2rem' }}>
              <BrainCircuit size={32} color="var(--primary)" />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <h1 className="verify-hero-title" style={{ 
                fontSize: '3.5rem', 
                fontWeight: 800, 
                letterSpacing: '-0.03em', 
                margin: 0, 
                lineHeight: 1.1,
                background: 'linear-gradient(to right, var(--primary), #8b5cf6)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}>
                AI Core <br/>Analyzer
              </h1>
              <button
                type="button"
                onClick={() => setShowOverviewModal(true)}
                title="How does this work?"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: 'rgba(92,56,235,0.08)', border: '1.5px solid rgba(92,56,235,0.25)',
                  color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '999px',
                  fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s', whiteSpace: 'nowrap', alignSelf: 'flex-start', marginTop: '0.5rem'
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(92,56,235,0.16)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(92,56,235,0.08)'; e.currentTarget.style.borderColor = 'rgba(92,56,235,0.25)'; }}
              >
                <Info size={16} /> How It Works
              </button>
            </div>
            
            <p style={{ 
              color: 'var(--text-muted)', 
              fontSize: '1.2rem', 
              maxWidth: '500px', 
              lineHeight: 1.6,
              marginBottom: '3rem'
            }}>
              Harness the power of 7 specialized machine learning models working in parallel to detect misinformation, bias, and fabricated news stories instantly.
            </p>

            {/* Engine Toggle - Integrated into Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '440px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Select Intelligence Core
              </span>
              <div className="glass-panel" style={{ padding: '0.4rem', borderRadius: '1.25rem', display: 'flex', gap: '0.4rem', background: 'rgba(255,255,255,0.03)', width: '100%' }}>
                <button 
                  type="button"
                  onClick={() => setDataset('isot')}
                  style={{ flex: 1, padding: '1rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: dataset === 'isot' ? 'var(--primary)' : 'transparent', color: dataset === 'isot' ? 'white' : 'var(--text-muted)', boxShadow: dataset === 'isot' ? '0 4px 12px rgba(92, 56, 235, 0.2)' : 'none' }}
                >
                  ISOT Engine
                </button>
                <button 
                  type="button"
                  onClick={() => setDataset('liar')}
                  style={{ flex: 1, padding: '1rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: dataset === 'liar' ? 'var(--primary)' : 'transparent', color: dataset === 'liar' ? 'white' : 'var(--text-muted)', boxShadow: dataset === 'liar' ? '0 4px 12px rgba(92, 56, 235, 0.2)' : 'none' }}
                >
                  LIAR Engine
                </button>
                <button 
                  type="button"
                  onClick={() => setDataset('welfake')}
                  style={{ flex: 1, padding: '1rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: dataset === 'welfake' ? 'var(--primary)' : 'transparent', color: dataset === 'welfake' ? 'white' : 'var(--text-muted)', boxShadow: dataset === 'welfake' ? '0 4px 12px rgba(92, 56, 235, 0.2)' : 'none' }}
                >
                  WELFake Engine
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: THE INPUT CARD (RE-STYLED AS SUB-PANEL) */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleVerify} style={{ 
              padding: '2.5rem', 
              borderRadius: '2rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              boxShadow: 'inset 0 0 40px rgba(255,255,255,0.01)'
            }}>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <label htmlFor="newsText" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Activity size={18} color="var(--primary)" />
                    Data Input Interface
                  </label>
                  <div style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem', borderRadius: '999px', background: 'rgba(92, 56, 235, 0.1)', color: 'var(--primary)', fontWeight: 700 }}>
                    SYSTEM READY
                  </div>
                </div>
                
                <textarea
                  id="newsText"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste article content or claim here for deep scan..."
                  rows="8"
                  className="glass-input"
                  style={{ 
                    width: '100%', 
                    padding: '1.5rem', 
                    borderRadius: '1.5rem', 
                    resize: 'none', 
                    fontSize: '1.1rem', 
                    minHeight: '260px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    boxShadow: 'none'
                  }}
                  required
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem' }}>
                  <AlertTriangle size={18} />
                  <span style={{ fontWeight: 600 }}>{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || !text.trim()} 
                style={{ 
                  width: '100%', 
                  padding: '1.25rem', 
                  background: 'var(--primary)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '1.25rem', 
                  fontSize: '1.1rem', 
                  fontWeight: 700, 
                  cursor: loading || !text.trim() ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 8px 25px rgba(92, 56, 235, 0.3)'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>SYNTHESIZING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Execute Neural Analysis</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* === LOADING STATE CARD === */}
      {loading && (
        <div className="glass-panel" style={{ borderRadius: '1.5rem', padding: '3rem 2rem', marginBottom: '2rem', textAlign: 'center', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          
          {/* Animated neural nodes */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {['LIAR', 'ISOT', 'WELFake', 'Web NLI', 'Fact Check'].map((label, i) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'rgba(92, 56, 235, 0.08)',
                  border: '2px solid var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: `neuralPulse 1.6s ease-in-out ${i * 0.28}s infinite`,
                  boxShadow: '0 0 20px rgba(92, 56, 235, 0.2)'
                }}>
                  <BrainCircuit size={22} color="var(--primary)" />
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Connecting line with moving dots */}
          <div style={{ position: 'relative', height: '4px', background: 'rgba(92, 56, 235, 0.1)', borderRadius: '999px', marginBottom: '2.5rem', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '40%', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', borderRadius: '999px', animation: 'scanLine 1.8s ease-in-out infinite' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-color)', fontWeight: 700, fontSize: '1.15rem' }}>
              <Loader2 size={20} className="spin" color="var(--primary)" />
              Running Neural Ensemble Analysis…
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              All 3 engines + real-time web verification are running in parallel. This typically takes 5–15 seconds.
            </p>
          </div>
        </div>
      )}

      {/* Analytics Dashboard Grid */}
      {results && (
        <div ref={resultsRef} style={{ animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)', paddingTop: '2rem' }}>
          {/* Results Header */}
          <div className="verify-results-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BarChart3 size={28} color="var(--primary-color)" />
              <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Individual Prediction Results</h2>
            </div>
            <button
              onClick={() => setShowInfoModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '2rem', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <Info size={18} /> Model Weights
            </button>
          </div>

          {/* Section 1: Web Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Globe size={20} color="var(--primary-color)" />
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Section 1 — Real-Time Web Search Prediction</span>
          </div>

          {/* Live Web Verification Card */}
          {webVerification ? (
            <div className="glass-panel" style={{ borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', marginBottom: '2.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '6px', background: webVerification.score > 50 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : webVerification.score > 0 ? 'linear-gradient(90deg, #eab308, #fde047)' : 'linear-gradient(90deg, #ef4444, #f87171)', width: '100%' }}></div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Globe size={22} color="var(--primary-color)" /> Real-Time Web Verification
              </h3>
              
              {/* Professional Fact-Check Badge */}
              {webVerification.fact_check?.found && (
                <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: webVerification.fact_check.fake_score >= 0.5 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${webVerification.fact_check.fake_score >= 0.5 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>{webVerification.fact_check.fake_score >= 0.5 ? '🚨' : '✅'}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: webVerification.fact_check.fake_score >= 0.5 ? '#b91c1c' : '#15803d', marginBottom: '0.25rem' }}>
                      Professionally Fact-Checked
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <strong>{webVerification.fact_check.publisher}</strong> rated this claim as: <strong style={{ color: 'var(--text-color)' }}>"{webVerification.fact_check.label}"</strong>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                   <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Credibility Score</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontSize: '3rem', fontWeight: 900, color: webVerification.score > 50 ? '#15803d' : webVerification.score > 0 ? '#ca8a04' : '#b91c1c', lineHeight: 1 }}>{webVerification.score}%</span>
                   </div>
                </div>
                
                <div style={{ flex: '2 1 300px' }}>
                  {webVerification.warning ? (
                    <div style={{ padding: '1rem', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', border: '1px solid #fef08a' }}>
                      <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontWeight: 500 }}>{webVerification.warning}</span>
                    </div>
                  ) : (
                    <React.Fragment>
                      {webVerification.sources && webVerification.sources.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Top Trusted Sources</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {webVerification.sources.map((src, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--background-color)', padding: '1rem 1.25rem', borderRadius: '1rem', border: '1px solid var(--border-color)', transition: 'transform 0.2s', '&:hover': {transform: 'translateY(-2px)'} }}>
                                 {src.imageUrl && (
                                   <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                                     <img src={src.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                   </div>
                                 )}
                                 <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                   <span style={{ fontSize: '1.25rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{src.name}</span>
                                   <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{src.title}</span>
                                 </div>
                                 <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600, padding: '0.5rem 1rem', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '0.5rem', transition: 'background 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.2)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)'}>
                                   View <ExternalLink size={16} />
                                 </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ borderRadius: '1.5rem', padding: '1.5rem 2rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.7 }}>
              <AlertCircle size={20} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Web search results were not available for this analysis.</span>
            </div>
          )}


          {/* AI Analysis Reasoning Card */}
          {analysis && analysis.length > 0 && (
            <div className="glass-panel" style={{ borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <BrainCircuit size={22} color="var(--primary-color)" /> AI Reasoning Analysis
              </h3>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {analysis.map((point, index) => (
                  <li key={index} style={{ padding: '1.25rem', background: 'var(--background-color)', borderRadius: '1rem', borderLeft: '4px solid var(--primary-color)', fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-color)', marginRight: '0.5rem' }}>Point {index + 1}:</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 2: DistilBERT Featured Card */}
          {results && results.distilbert && (() => {
            const db = results.distilbert;
            const isFake = db.prediction.toLowerCase() === 'fake';
            return (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  <BrainCircuit size={20} color="var(--primary-color)" />
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Section 2 — DistilBERT Transformer Model (Featured)</span>
                </div>
                <div style={{
                  borderRadius: '1.5rem', padding: '2rem', position: 'relative', overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(92,56,235,0.09) 0%, rgba(139,92,246,0.05) 100%)',
                  border: '2px solid rgba(92,56,235,0.35)',
                  boxShadow: '0 8px 32px rgba(92,56,235,0.12)',
                  marginBottom: '2rem'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: '5px', width: '100%', background: 'linear-gradient(90deg, var(--primary), #8b5cf6)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(92,56,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BrainCircuit size={26} color="var(--primary)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--primary)' }}>DistilBERT</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.2rem' }}>
                          <span style={{ background: 'var(--primary)', color: 'white', padding: '0.15rem 0.55rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.7rem' }}>Advanced NLP</span>
                          <span style={{ background: 'rgba(92,56,235,0.1)', color: 'var(--primary)', padding: '0.15rem 0.55rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.7rem' }}>Transformer</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1, color: isFake ? '#b91c1c' : '#15803d' }}>{db.prediction.toUpperCase()}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: isFake ? '#ef4444' : '#22c55e', marginTop: '0.25rem' }}>{db.confidence}% confidence</div>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', marginBottom: '1.25rem', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${db.confidence}%`, background: isFake ? 'linear-gradient(90deg,#ef4444,#f87171)' : 'linear-gradient(90deg,#22c55e,#4ade80)', borderRadius: '999px', transition: 'width 1s ease' }} />
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                    A distilled version of BERT, DistilBERT retains 97% of BERT's language understanding at 60% of the size. It uses bidirectional transformer attention to analyse full sentence context rather than individual keywords — making it the most linguistically sophisticated model in this ensemble.
                  </p>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                    <strong style={{ color: 'var(--text-color)' }}>Deep Analysis: </strong>
                    <span style={{ color: isFake ? '#ef4444' : '#22c55e' }}>
                      {isFake
                        ? 'Using contextual understanding of language, this model identified patterns of misinformation and detected untrustworthy content.'
                        : 'Using contextual understanding of language, this model identified characteristics consistent with factual, credible reporting.'}
                    </span>
                  </p>
                  <div style={{ padding: '1rem 1.25rem', background: isFake ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)', border: `1px solid ${isFake ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`, borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isFake ? <ShieldAlert size={20} color="#ef4444" /> : <ShieldCheck size={20} color="#22c55e" />}
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: isFake ? '#b91c1c' : '#15803d' }}>
                      DistilBERT Verdict: This article is likely <strong>{db.prediction.toUpperCase()}</strong> with {db.confidence}% confidence.
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Section 3: Traditional ML Models — each separately */}
          {results && (() => {
            const modelMeta = {
              lightgbm:     { name: 'LightGBM',            desc: 'A fast, gradient-boosting framework using tree-based learning algorithms.' },
              xgboost:      { name: 'XGBoost',              desc: 'An optimized gradient boosting library designed for high performance.' },
              randomforest: { name: 'Random Forest',        desc: 'An ensemble of decision trees trained on random subsets of data.' },
              logistic:     { name: 'Logistic Regression',  desc: 'A simple linear model for binary classification problems.' },
              svm:          { name: 'SVM',                  desc: 'Support Vector Machine that finds the optimal hyperplane to separate classes.' },
              sgd:          { name: 'SGD',                  desc: 'Stochastic Gradient Descent — fast linear classifier suited for large text data.' },
            };
            const fakeIndicators = ['Sensationalism', 'Exaggeration', 'Emotional language', 'Lack of sources'];
            const realIndicators = ['Factual language', 'Credible sources', 'Objective tone', 'Verified claims'];
            const otherEntries = Object.entries(results).filter(([k]) => k !== 'naive_bayes' && k !== 'distilbert');
            if (!otherEntries.length) return null;
            return (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  <Activity size={20} color="var(--primary-color)" />
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Section 3 — Traditional ML Model Predictions</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {otherEntries.map(([key, data], idx) => {
                    const meta = modelMeta[key] || { name: key.charAt(0).toUpperCase() + key.slice(1), desc: 'A machine learning classifier.' };
                    const isFake = data.prediction.toLowerCase() === 'fake';
                    const indicators = isFake ? fakeIndicators : realIndicators;
                    const highConf = data.confidence >= 85;
                    return (
                      <div key={key} style={{ borderRadius: '1.25rem', padding: '1.5rem', background: 'var(--background-color)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: isFake ? '#ef4444' : '#22c55e', borderRadius: '4px 0 0 4px' }} />
                        <div style={{ paddingLeft: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                            <div>
                              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-color)' }}>{`Model ${idx + 1}: `}</span>
                              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>{meta.name}</span>
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '999px', background: isFake ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: isFake ? '#ef4444' : '#22c55e', border: `1px solid ${isFake ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}` }}>
                              {data.prediction.toUpperCase()} — {data.confidence}% confidence
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', marginBottom: '0.75rem', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${data.confidence}%`, background: isFake ? '#ef4444' : '#22c55e', borderRadius: '999px', transition: 'width 1s ease' }} />
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>{meta.desc}</p>
                          <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.88rem', lineHeight: 1.5 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-color)' }}>Analysis: </span>
                            <span style={{ color: isFake ? '#ef4444' : '#22c55e' }}>
                              {`This model identified patterns typically found in ${isFake ? 'fabricated' : 'credible'} news sources${highConf ? ' with high certainty' : ''}.`}
                            </span>
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>Key indicators:</span>
                            {indicators.map(tag => (
                              <span key={tag} style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.18rem 0.6rem', borderRadius: '999px', background: isFake ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: isFake ? '#ef4444' : '#22c55e', border: `1px solid ${isFake ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Bar Chart - Confidence Breakdown */}
          <div className="glass-panel" style={{ borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '2rem', fontWeight: 700, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               Network Confidence Matrix
            </h3>
            <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <RechartsTooltip content={renderCustomTooltip} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Bar dataKey="confidence" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
      )}

      {/* Global Animation Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes neuralPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); box-shadow: 0 0 10px rgba(92, 56, 235, 0.1); }
          50% { opacity: 1; transform: scale(1.12); box-shadow: 0 0 28px rgba(92, 56, 235, 0.45); }
        }
        @keyframes scanLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}} />
    </div>
  );
};

export default VerifyNewsPage;
