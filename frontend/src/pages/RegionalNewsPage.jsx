import React, { useState, useEffect, useContext } from "react";
import IndiaMap from "../components/IndiaMap";
import NewsCard from "../components/NewsCard";
import api from "../services/api";
import { MapPin, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import userService from "../services/userService";
import MobileBackButton from "../components/MobileBackButton";

const RegionalNewsPage = () => {
  const { user, setUser } = useContext(AuthContext);
  const [selectedState, setSelectedState] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Helper to map OpenStreetMap state names to our TopoJSON names
  const normalizeStateName = (osmState) => {
    if (!osmState) return null;
    const mapping = {
      'Delhi': 'Delhi',
      'National Capital Territory of Delhi': 'Delhi',
      'Arunachal Pradesh': 'Arunanchal Pradesh', // Match local typo
      'Dadra and Nagar Haveli and Daman and Diu': 'Dadara and Nagar Havelli',
      'Andaman and Nicobar Islands': 'Andaman and Nicobar',
      'Odisha': 'Odisha',
      'Orissa': 'Odisha'
    };
    return mapping[osmState] || osmState;
  };

  // 1. Detect location on mount
  useEffect(() => {
    const detectLocation = async () => {
      if (!navigator.geolocation) return;
      
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const state = data.address?.state;
            if (state) {
              const normalized = normalizeStateName(state);
              setSelectedState(normalized);
            }
          } catch (err) {
            console.error("Location resolution failed:", err);
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (err) => {
          console.warn("Geolocation denied:", err);
          setIsLoadingLocation(false);
        }
      );
    };

    detectLocation();
  }, []);

  // 2. Fetch news when state changes
  useEffect(() => {
    if (!selectedState) return;

    const fetchRegionalNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/news/region?state=${encodeURIComponent(selectedState)}`);
        setNews(response.data.articles || []);
      } catch (err) {
        console.error("Failed to fetch regional news:", err);
        setError("Failed to load news for " + selectedState);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRegionalNews();
  }, [selectedState]);

  const handleToggleBookmark = async (articleId) => {
    if (!user) {
      alert("Please log in to save articles.");
      return;
    }
    
    try {
      await userService.toggleBookmark(articleId);
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        if (!storedUser.bookmarkedArticles) storedUser.bookmarkedArticles = [];
        const stringId = String(articleId);
        if (storedUser.bookmarkedArticles.includes(stringId)) {
          storedUser.bookmarkedArticles = storedUser.bookmarkedArticles.filter(id => id !== stringId);
        } else {
          storedUser.bookmarkedArticles.push(stringId);
        }
        localStorage.setItem('user', JSON.stringify(storedUser));
        setUser(storedUser);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  return (
    <div className="regional-page-root" style={{ 
      minHeight: '100vh', 
      padding: '2rem',
      maxWidth: '1800px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '2.5rem'
    }}>
      
      {/* IMMERSIVE HERO HEADER */}
      <MobileBackButton label="Back" />
      <header className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="stat-badge">LIVE MONITOR</div>
          <div className="stat-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}>36 REGIONS</div>
        </div>
        
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 800, 
          letterSpacing: '-0.03em', 
          margin: '0 0 1rem 0',
          background: 'linear-gradient(to right, var(--primary), var(--secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Regional News Hub
        </h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: 'var(--text-muted)', 
          maxWidth: '700px', 
          margin: '0 auto',
          lineHeight: '1.7'
        }}>
          A real-time geospatial news engine. Navigate through India's diverse narrative by interacting with the map below.
        </p>
      </header>

      {/* MAIN COMMAND INTERFACE */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(400px, 0.8fr) 1fr', 
        gap: '2.5rem', 
        alignItems: 'start' 
      }} className="regional-main-grid">
        
        {/* LEFT COLUMN: THE MAP COMMAND CARD */}
        <div className="animate-fade-in-up regional-map-sticky" style={{ 
          position: 'sticky', 
          top: '6rem', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          width: '100%',
        }}>
          {/* Main Control Panel for Map */}
          <div className="command-card regional-map-card" style={{ 
            width: '100%',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'visible'
          }}>
            {/* State Indicator & Instruction - Top Bar */}
            <div className="regional-state-bar" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', minHeight: '32px', flexWrap: 'wrap', gap: '0.5rem' }}>
              <p style={{ 
                fontSize: '0.85rem', 
                color: 'var(--text-muted)', 
                margin: 0,
                fontWeight: 600,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                opacity: 0.8
              }}>
                Click a region to initialize data synthesis
              </p>
              
              {selectedState && (
                <div 
                  className="animate-fade-in-up regional-state-badge"
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    padding: '0.35rem 0.85rem', 
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(92, 56, 235, 0.3)',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', animation: 'pulse-soft 2s infinite', flexShrink: 0 }} />
                  {selectedState}
                </div>
              )}
            </div>

            <div style={{ 
              width: '100%',
              height: 'auto',
              maxHeight: '75vh',
              aspectRatio: '1 / 1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {/* Subtle ambient glow behind the map */}
              <div style={{ 
                position: 'absolute', width: '100%', height: '100%', 
                background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', 
                opacity: 0.05, pointerEvents: 'none' 
              }} />
              
              <IndiaMap selectedState={selectedState} onStateClick={setSelectedState} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DATA FEED */}
        <div className="feed-column animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animationDelay: '0.2s' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              {selectedState ? `Narratives in ${selectedState}` : 'Regional Feed'}
            </h2>
            {selectedState && news.length > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{news.length} Reports Found</span>}
          </div>

          {!selectedState && (
            <div style={{ 
              padding: '6rem 2rem', 
              textAlign: 'center', 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '2rem', 
              border: '2px dashed var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem'
            }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-lg)' }}>
                {isLoadingLocation ? (
                  <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                ) : (
                  <MapPin size={32} color="var(--primary)" />
                )}
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  {isLoadingLocation ? 'Locating your Region...' : 'Awaiting Designation'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  {isLoadingLocation ? 'Syncing geospatial coordinates to local narratives.' : 'Select a target region on the map to begin analysis.'}
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '6rem 0' }}>
              <Loader2 className="animate-spin" size={48} color="var(--primary)" />
              <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Decrypting regional data...</p>
            </div>
          )}

          {error && !loading && (
            <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle size={24} /> {error}
            </div>
          )}

          {!loading && !error && selectedState && news.length === 0 && (
             <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--card-bg)', borderRadius: '1.5rem', border: '1px solid var(--border-color)' }}>
               No verified narratives found for {selectedState} in this cycle.
             </div>
          )}

          {!loading && !error && selectedState && news.length > 0 && (
            <div className="regional-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '2rem' }}>
              {news.map((article, idx) => (
                <div key={article.id || article._id} className="animate-fade-in-up" style={{ animationDelay: `${0.1 * (idx + 1)}s` }}>
                  <NewsCard 
                    news={article} 
                    isBookmarked={user?.bookmarkedArticles?.includes(String(article.id || article._id))}
                    onToggleBookmark={handleToggleBookmark}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RegionalNewsPage;