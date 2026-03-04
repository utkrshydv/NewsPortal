import { Bookmark, ExternalLink, Sparkles, ArrowRight } from 'lucide-react';
import api from '../services/api';
import userService from '../services/userService';

const NewsCard = ({ news, isBookmarked = false, onToggleBookmark, variant = 'standard' }) => {
  const articleId = news.id || news._id;
  const targetUrl = news.sourceUrl || `/news/${articleId}`;
  const isExternal = !!news.sourceUrl || targetUrl.startsWith('http');

  const handleCardClick = () => {
    // Silently track history since we bypass the detail page now
    api.post('/history', {
      articleId: articleId,
      category: news.category
    }).catch(console.error);
    
    userService.trackInteraction(articleId, news.category, 'click').catch(console.error);
  };
  const getSourceName = (url) => {
    if (!url) return null;
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch (e) {
      return null;
    }
  };
  
  const sourceName = getSourceName(news.sourceUrl);

  // Helper to force high-res images from search engines and CDNs
  const getHighResImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop';
    
    try {
      // If it's a Google encrypted thumbnail URL (used by Serper), replace the low-res dimensional crop strings.
      // E.g., .../images?q=...&w=200&h=150 -> .../images?q=...&w=1200
      let upscaledUrl = url;
      
      // Handle Google User Content and Encrypted TBN patterns
      if (upscaledUrl.includes('googleusercontent') || upscaledUrl.includes('encrypted-tbn0.gstatic.com')) {
         // Replace standard tiny width/height bounds with high-res bounds
         upscaledUrl = upscaledUrl.replace(/w=\d+/g, 'w=1200').replace(/h=\d+/g, 'h=800');
         
         // Sometimes they use a single suffix like =s200 or -s200, replace with =s1200
         upscaledUrl = upscaledUrl.replace(/[=|-]s\d+([-c])?/g, (match, crop) => {
           return match.startsWith('=') ? `=s1200${crop || ''}` : `-s1200${crop || ''}`;
         });

         // Handle 'cb' parameter which can sometimes lock resolution
         upscaledUrl = upscaledUrl.replace(/&cb=\d+/g, '');
      }
      
      // Handle standard CDN low-res patterns
      if (upscaledUrl.includes('unsplash.com')) {
        upscaledUrl = upscaledUrl.replace(/q=\d+/g, 'q=90').replace(/w=\d+/g, 'w=1200');
      }

      return upscaledUrl;
    } catch (e) {
      return url;
    }
  };

  return (
    <a 
      href={targetUrl} 
      target={isExternal ? "_blank" : "_self"} 
      rel="noreferrer" 
      className={`news-card card-${variant}`} 
      onClick={handleCardClick}
    >
      <div className="news-card-image-wrapper">
        <img 
          src={getHighResImageUrl(news.imageUrl)} 
          alt={news.title} 
          className="news-card-image" 
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null; // prevents infinite loops if fallback also fails
            e.target.src = 'https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=2072&auto=format&fit=crop';
          }}
        />
      </div>
      <div className="news-card-content">
        <div className="news-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span className="news-card-category">{news.category}</span>
            {sourceName && (
              <span className="ai-badge" style={{ textTransform: 'lowercase' }}>
                {sourceName}
              </span>
            )}
          </div>
          <span className="news-card-date">{new Date(news.date).toLocaleDateString()}</span>
        </div>
        
        <h3 className="news-card-title">{news.title}</h3>
        
        <p className="news-card-desc">{news.shortDescription}</p>
        
        <div className="news-card-footer">
          <span className="read-more-text">
            {isExternal ? (
              <>Read Source <ExternalLink size={14} /></>
            ) : (
              <>Read Article <ArrowRight size={14} /></>
            )}
          </span>
          <button 
            type="button"
            className={isBookmarked ? 'glass-button' : "glass-input"}
            onClick={(e) => {
              e.preventDefault(); // Prevent default link behavior
              e.stopPropagation(); // Stop bubbling up to the Link component
              if (onToggleBookmark) {
                onToggleBookmark(articleId);
              }
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              padding: '0.35rem 0.85rem', 
              color: isBookmarked ? 'white' : 'var(--text-main)', 
              borderRadius: '9999px', /* Fully rounded pills */
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              boxShadow: isBookmarked ? 'var(--shadow-glow)' : 'none',
              background: isBookmarked ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
              border: '1px solid',
              borderColor: isBookmarked ? 'var(--primary)' : 'var(--border-color)',
            }}
            onMouseEnter={(e) => {
              if (!isBookmarked) e.currentTarget.style.background = 'white';
            }}
            onMouseLeave={(e) => {
              if (!isBookmarked) e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
            }}
          >
            <Bookmark size={14} fill={isBookmarked ? 'white' : 'none'} color={isBookmarked ? 'white' : 'currentColor'} />
            {isBookmarked ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </a>
  );
};

export default NewsCard;
