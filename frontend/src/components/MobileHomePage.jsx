import { useState, useEffect } from 'react';
import { Flame, ArrowUpRight } from 'lucide-react';
import MobileCategorySection from './MobileCategorySection';
import WeatherWidget from './WeatherWidget';
import api from '../services/api';

const MOBILE_CATEGORIES = [
  'For You',
  'General',
  'Technology',
  'Sports',
  'Business',
  'Entertainment',
  'Health',
  'Science',
];

/* ── Trending mini-strip rendered inside the spotlight box ── */
function TrendingSpotlight() {
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    api.get('/news/trending')
      .then(r => { if (r.data?.trends) setTrends(r.data.trends.slice(0, 8)); })
      .catch(() => {});
  }, []);

  if (trends.length === 0) return (
    <div style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
      Loading trends…
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      padding: '0.75rem 0.75rem',
      gap: '0.6rem',
    }}>
      {trends.map((trend, idx) => (
        <a
          key={trend.id || idx}
          href={trend.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            width: '160px',
            minHeight: '130px',
            padding: '0.75rem 0.75rem',
            borderRadius: '12px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            textDecoration: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)' }}>
              #{idx + 1}
            </span>
            {idx < 2 && (
              <span style={{
                fontSize: '0.6rem', fontWeight: 700,
                background: 'rgba(236,72,153,0.1)', color: 'var(--accent-pink)',
                padding: '0.1rem 0.4rem', borderRadius: '9999px',
              }}>🔥 HOT</span>
            )}
            <ArrowUpRight size={12} color="var(--text-muted)" />
          </div>
          <span style={{
            fontSize: '0.78rem', fontWeight: 700,
            color: 'var(--text-main)', lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {trend.title}
          </span>
        </a>
      ))}
      <style>{`.trending-spotlight-strip::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

/**
 * MobileHomePage — Google News / BBC-style mobile homepage.
 */
const MobileHomePage = ({ user }) => {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = user?.name?.split(' ')[0] || null;

  return (
    <div className="mobile-homepage">
      {/* ── Top greeting bar ── */}
      <div className="mobile-greeting-bar">
        <div>
          <p className="mobile-greeting-text">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </p>
          <h1 className="mobile-greeting-heading">Today's Briefing</h1>
        </div>
        <div className="homepage-mobile-weather" style={{ display: 'flex' }}>
          <WeatherWidget />
        </div>
      </div>

      {/* ── Category sections with trending breaks ── */}
      {MOBILE_CATEGORIES.map((category, index) => (
        <div key={category}>
          <MobileCategorySection category={category} user={user} />

          {/* Trending spotlight box — appears once, after section 2 */}
          {index === 1 && (
            <div className="mobile-spotlight-break">
              {/* Label row */}
              <div className="mobile-spotlight-label">
                <Flame size={14} className="mobile-spotlight-icon" />
                <span>Trending across all topics</span>
              </div>
              {/* Trending mini-cards strip */}
              <TrendingSpotlight />
            </div>
          )}
        </div>
      ))}

      {/* ── Bottom padding ── */}
      <div style={{ height: '2rem' }} />
    </div>
  );
};

export default MobileHomePage;


