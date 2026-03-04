import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import MobileNewsCard from './MobileNewsCard';
import api from '../services/api';
import userService from '../services/userService';

const CATEGORY_ICONS = {
  General: '🌐',
  Technology: '⚡',
  Sports: '🏆',
  Business: '📈',
  Entertainment: '🎬',
  Health: '❤️',
  Science: '🔬',
  'For You': '✨',
};

/**
 * MobileCategorySection — renders a single category section:
 *   1. Section header (icon + name + "See all →")
 *   2. Lead card — big portrait card (first article)
 *   3. Horizontal scroll strip of compact mini-cards (rest of articles)
 *
 * Fetches lazily via IntersectionObserver (only loads when scrolled into view).
 */
const MobileCategorySection = ({ category, user }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const sectionRef = useRef(null);

  // Lazy-fetch when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasFetched) {
          fetchNews();
        }
      },
      { rootMargin: '200px', threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasFetched]);

  const fetchNews = async () => {
    if (hasFetched) return;
    setLoading(true);
    setHasFetched(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      let url;

      if (category === 'For You' && user?._id) {
        url = `${baseUrl}/api/recommendations/${user._id}`;
      } else {
        url = `${baseUrl}/api/news?category=${encodeURIComponent(category)}`;
      }

      const response = await axios.get(url);
      let raw = [];
      if (Array.isArray(response.data)) raw = response.data;
      else if (response.data?.articles) raw = response.data.articles;

      const normalized = raw.map(a => ({
        ...a,
        sourceUrl: a.sourceUrl || a.sourceURL || a.url || a.link,
        id: a.id || a._id,
      })).slice(0, 9); // max 9 articles per section

      setArticles(normalized);
    } catch (err) {
      console.error(`[MobileCategorySection] Failed to fetch ${category}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadClick = (article) => {
    const articleId = article.id || article._id;
    api.post('/history', { articleId, category: article.category }).catch(console.error);
    userService.trackInteraction(articleId, article.category, 'click').catch(console.error);
  };

  const getHighResImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop';
    return url;
  };

  const icon = CATEGORY_ICONS[category] || '📰';
  const lead = articles[0];
  const strips = articles.slice(1);
  const leadUrl = lead ? (lead.sourceUrl || `/news/${lead.id}`) : '#';
  const isLeadExternal = lead ? (!!lead.sourceUrl || leadUrl.startsWith('http')) : false;

  return (
    <section ref={sectionRef} className="mobile-cat-section">
      {/* ── Section Header ── */}
      <div className="mobile-section-header">
        <span className="mobile-section-title">
          <span className="mobile-section-icon">{icon}</span>
          {category}
        </span>
        <Link
          to={category === 'For You' ? '/' : `/search?q=${encodeURIComponent(category)}`}
          className="mobile-section-see-all"
        >
          See all <ChevronRight size={14} />
        </Link>
      </div>

      {/* ── Loading State ── */}
      {loading && (
        <div className="mobile-section-loading">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <span>Loading {category}...</span>
        </div>
      )}

      {/* ── Lead Card ── */}
      {!loading && lead && (
        <a
          href={leadUrl}
          target={isLeadExternal ? '_blank' : '_self'}
          rel="noreferrer"
          className="mobile-lead-card"
          onClick={() => handleLeadClick(lead)}
        >
          <div className="mobile-lead-img-wrap">
            <img
              src={getHighResImageUrl(lead.imageUrl)}
              alt={lead.title}
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=800&auto=format&fit=crop';
              }}
            />
            {/* Gradient overlay */}
            <div className="mobile-lead-overlay" />
            <div className="mobile-lead-badge">
              {icon} {category}
            </div>
          </div>
          <div className="mobile-lead-content">
            <h3 className="mobile-lead-title">{lead.title}</h3>
            {lead.shortDescription && (
              <p className="mobile-lead-desc">{lead.shortDescription}</p>
            )}
            <div className="mobile-lead-meta">
              {lead.sourceUrl && (
                <span className="mobile-lead-source">
                  {(() => { try { return new URL(lead.sourceUrl).hostname.replace('www.', ''); } catch { return ''; } })()}
                </span>
              )}
              <span className="mobile-lead-date">
                {new Date(lead.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              {isLeadExternal && <ExternalLink size={11} style={{ color: 'var(--text-light)', marginLeft: 'auto' }} />}
            </div>
          </div>
        </a>
      )}

      {/* ── Horizontal Scroll Strip ── */}
      {!loading && strips.length > 0 && (
        <div className="mobile-card-strip-wrap">
          <div className="mobile-card-strip">
            {strips.map((article) => (
              <MobileNewsCard key={article.id} news={article} />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && articles.length === 0 && hasFetched && (
        <div className="mobile-section-empty">
          No stories available right now.
        </div>
      )}
    </section>
  );
};

export default MobileCategorySection;
