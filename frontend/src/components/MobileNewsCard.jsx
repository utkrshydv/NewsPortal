import { ExternalLink } from 'lucide-react';
import api from '../services/api';
import userService from '../services/userService';

/**
 * MobileNewsCard — a compact card for horizontal scroll strips on mobile.
 * Shows a square thumbnail on the left, title + source on the right.
 */
const MobileNewsCard = ({ news }) => {
  const articleId = news.id || news._id;
  const targetUrl = news.sourceUrl || `/news/${articleId}`;
  const isExternal = !!news.sourceUrl || targetUrl.startsWith('http');

  const getSourceName = (url) => {
    if (!url) return null;
    try { return new URL(url).hostname.replace('www.', ''); } catch { return null; }
  };

  const getHighResImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=400&auto=format&fit=crop';
    try {
      if (url.includes('googleusercontent') || url.includes('encrypted-tbn0.gstatic.com')) {
        return url.replace(/w=\d+/g, 'w=400').replace(/h=\d+/g, 'h=400');
      }
      return url;
    } catch { return url; }
  };

  const handleClick = () => {
    api.post('/history', { articleId, category: news.category }).catch(console.error);
    userService.trackInteraction(articleId, news.category, 'click').catch(console.error);
  };

  const sourceName = getSourceName(news.sourceUrl);

  return (
    <a
      href={targetUrl}
      target={isExternal ? '_blank' : '_self'}
      rel="noreferrer"
      className="mobile-news-card-mini"
      onClick={handleClick}
    >
      <div className="mobile-mini-img-wrap">
        <img
          src={getHighResImageUrl(news.imageUrl)}
          alt={news.title}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=400&auto=format&fit=crop';
          }}
        />
      </div>
      <div className="mobile-mini-content">
        {sourceName && <span className="mobile-mini-source">{sourceName}</span>}
        <p className="mobile-mini-title">{news.title}</p>
        <span className="mobile-mini-date">
          {new Date(news.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </a>
  );
};

export default MobileNewsCard;
