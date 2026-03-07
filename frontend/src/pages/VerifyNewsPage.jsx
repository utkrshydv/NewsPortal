import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, ShieldCheck, AlertTriangle, Activity, Loader2, Sparkles, BrainCircuit, BarChart3, PieChart as PieChartIcon, Globe, ExternalLink, AlertCircle, Info, X } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import '../index.css';
import MobileBackButton from '../components/MobileBackButton';

const VerifyNewsPage = () => {
  const [text, setText] = useState('');
  const [dataset, setDataset] = useState('liar');
  const [engineData, setEngineData] = useState({
    welfake: null,
    liar: null,
    isot: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const resultsRef = useRef(null);

  // Derived Data (Must be before hooks that use them)
  const currentData = engineData[dataset];
  const results = currentData?.results;
  const webVerification = currentData?.webVerification;
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
    // Clear both engine results
    setEngineData({ welfake: null, liar: null, isot: null });

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
            
            <h1 className="verify-hero-title" style={{ 
              fontSize: '3.5rem', 
              fontWeight: 800, 
              letterSpacing: '-0.03em', 
              marginBottom: '1.5rem', 
              lineHeight: 1.1,
              background: 'linear-gradient(to right, var(--primary), #8b5cf6)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>
              AI Core <br/>Analyzer
            </h1>
            
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
                  onClick={() => setDataset('liar')}
                  style={{ flex: 1, padding: '1rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: dataset === 'liar' ? 'var(--primary)' : 'transparent', color: dataset === 'liar' ? 'white' : 'var(--text-muted)', boxShadow: dataset === 'liar' ? '0 4px 12px rgba(92, 56, 235, 0.2)' : 'none' }}
                >
                  LIAR Engine
                </button>
                <button 
                  type="button"
                  onClick={() => setDataset('isot')}
                  style={{ flex: 1, padding: '1rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: dataset === 'isot' ? 'var(--primary)' : 'transparent', color: dataset === 'isot' ? 'white' : 'var(--text-muted)', boxShadow: dataset === 'isot' ? '0 4px 12px rgba(92, 56, 235, 0.2)' : 'none' }}
                >
                  ISOT Engine
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
      {results && consensus && (
        <div ref={resultsRef} style={{ animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)', paddingTop: '2rem' }}>
          <div className="verify-results-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BarChart3 size={28} color="var(--primary-color)" />
              <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Analysis Intelligence Report</h2>
            </div>
            
            <button 
              onClick={() => setShowInfoModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '2rem', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <Info size={18} /> How is this calculated?
            </button>
          </div>
          
          <div className="verify-results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            
            {/* Verdict Card */}
            <div className="glass-panel" style={{ borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '6px', background: consensus.prediction === 'Fake' ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #22c55e, #4ade80)', width: '100%' }}></div>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', fontWeight: 700 }}>Final Verdict</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: consensus.prediction === 'Fake' ? '#fee2e2' : '#dcfce7', padding: '1rem', borderRadius: '1rem' }}>
                    {consensus.prediction === 'Fake' ? <ShieldAlert size={48} color="#ef4444" /> : <ShieldCheck size={48} color="#22c55e" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, color: consensus.prediction === 'Fake' ? '#b91c1c' : '#15803d', letterSpacing: '-0.02em' }}>
                      {consensus.prediction.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>
                      {weightedConsensus && weightedConsensus.final_score !== undefined ? (
                        <><strong style={{ color: 'var(--text-color)' }}>{Math.round(weightedConsensus.final_score * 100)}%</strong> overall fake probability</>
                      ) : weightedConsensus ? (
                        <><strong style={{ color: 'var(--text-color)' }}>{Math.max(weightedConsensus.fake_weight_total, weightedConsensus.real_weight_total)}%</strong> network consensus</>
                      ) : (
                        <><strong style={{ color: 'var(--text-color)' }}>{consensus.votePercentage}%</strong> model consensus</>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'var(--background-color)', borderRadius: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Activity size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary-color)' }} />
                <span>
                  {weightedConsensus && weightedConsensus.ml_score !== undefined ? (
                    <>Base ML score determines a <strong>{Math.round(weightedConsensus.ml_score * 100)}% fake probability</strong>. Real-Time Web Search verifies this, providing a confidence adjustment of <strong>{weightedConsensus.web_adjustment > 0 ? '+' : ''}{Math.round(weightedConsensus.web_adjustment * 100)}%</strong> to the final consensus.</>
                  ) : (
                    <>The ensemble network concludes this text has a high probability of being <strong>{consensus.prediction.toLowerCase()}</strong> based on aggregate lexical and semantic scoring.</>
                  )}
                </span>
              </div>
            </div>

            {/* Pie Chart Card - Vote Distribution */}
            <div className="glass-panel" style={{ borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <PieChartIcon size={18} /> Final Probability Scoring
                </h3>
              </div>
              
              <div style={{ flex: 1, minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value, name) => [`${value}${weightedConsensus ? '%' : ' Models'}`, name]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }}></div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Real ({weightedConsensus && weightedConsensus.final_score !== undefined ? Math.round((1 - weightedConsensus.final_score) * 100) + '%' : weightedConsensus ? weightedConsensus.real_weight_total + '%' : consensus.realCount})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Fake ({weightedConsensus && weightedConsensus.final_score !== undefined ? Math.round(weightedConsensus.final_score * 100) + '%' : weightedConsensus ? weightedConsensus.fake_weight_total + '%' : consensus.fakeCount})</span>
                </div>
              </div>
            </div>

          </div>

          {/* Live Web Verification Card */}
          {webVerification && (
            <div className="glass-panel" style={{ borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
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
          )}

          {/* AI Analysis Reasoning Card */}
          {analysis && analysis.length > 0 && (
            <div className="glass-panel" style={{ borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <BrainCircuit size={22} color="var(--primary-color)" /> AI Reasoning Analysis
              </h3>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {analysis.map((point, index) => (
                  <li key={index} style={{ padding: '1.25rem', background: 'var(--background-color)', borderRadius: '1rem', borderLeft: consensus && consensus.prediction === 'Fake' ? '4px solid #ef4444' : '4px solid #22c55e', fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-color)', marginRight: '0.5rem' }}>Point {index + 1}:</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
