import React, { useState, useEffect } from 'react';
import { Flame, ArrowRight, Loader2, TrendingUp } from 'lucide-react';
import api from '../services/api';

const TrendingSection = () => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await api.get('/news/trending');
        if (response.data && response.data.trends) {
          setTrends(response.data.trends);
        }
      } catch (err) {
        console.error("Failed to fetch trending topics:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', opacity: 0.7 }}>
        <Loader2 className="animate-spin" size={16} color="var(--text-muted)" />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Scanning live national search trends...</span>
      </div>
    );
  }

  if (trends.length === 0) return null;

  return (
    <div style={{ 
      marginBottom: '2.5rem',
      padding: '2rem',
      background: 'var(--card-bg)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRadius: '24px',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-lg)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.75rem', paddingLeft: '0.5rem' }}>
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '46px', 
            height: '46px', 
            borderRadius: '50%', 
            background: 'rgba(236, 72, 153, 0.08)',
            border: '1px solid rgba(236, 72, 153, 0.2)',
            boxShadow: '0 0 20px rgba(236, 72, 153, 0.15)',
            position: 'relative'
        }}>
           <Flame size={24} color="var(--accent-pink)" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 2px 4px rgba(236, 72, 153, 0.3))' }} />
        </div>
        <div>
            <h2 style={{ 
                margin: 0, 
                fontSize: '1.6rem', 
                fontWeight: 800, 
                letterSpacing: '-0.02em',
                background: 'linear-gradient(90deg, var(--secondary), var(--primary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
            }}>
                Trending in India
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '-0.15rem' }}>
                Real-time national search trends
            </p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .trending-scroll-container::-webkit-scrollbar { display: none; }
      `}} />
      <div className="trending-scroll-container" style={{ 
        display: 'flex', 
        overflowX: 'auto', 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        padding: '0.5rem',
        margin: '-0.5rem'
      }}>
        <div style={{ display: 'flex', gap: '1.5rem', paddingRight: '1rem' }}>
          {trends.slice(0, 10).map((trend, idx) => (
            <a key={trend.id} href={trend.url} target="_blank" rel="noopener noreferrer" style={{ 
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              minWidth: '320px',
              maxWidth: '350px',
              padding: '1.5rem',
              gap: '0.875rem',
              transition: 'var(--transition-smooth)',
              cursor: 'pointer',
              background: 'var(--card-bg)',
              backdropFilter: 'blur(12px)',
              borderRadius: '18px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              e.currentTarget.style.background = 'var(--card-bg-hover)';
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.background = 'var(--card-bg)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    color: 'var(--primary)', 
                    fontSize: '1rem', 
                    fontWeight: 800,
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    #{idx + 1}
                  </span>
                  {(idx === 0 || idx === 1) && (
                    <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        background: 'rgba(236, 72, 153, 0.1)', 
                        color: 'var(--accent-pink)', 
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                    }}>
                      <Flame size={12} strokeWidth={2.5} /> HOT
                    </span>
                  )}
                </div>
                <ArrowRight size={16} color="var(--primary)" style={{ opacity: 0.5 }} />
              </div>
              <span style={{ 
                fontSize: '1.05rem', 
                color: 'var(--text-main)', 
                fontWeight: 700,
                lineHeight: '1.35'
              }}>
                {trend.title}
              </span>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                {trend.snippet.replace(/&#39;/g, "'").replace(/&quot;/g, '"')}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingSection;
