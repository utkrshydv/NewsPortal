import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import NewsCard from '../components/NewsCard';
import TrendingSection from '../components/TrendingSection';
import { AuthContext } from '../context/AuthContext';
import userService from '../services/userService';

const CATEGORIES = ['For You', 'General', 'Business', 'Technology', 'Science', 'Health', 'Sports', 'Entertainment', 'KIIT'];

// Global cache outside component to persist across navigation
const categoryCache = {};
const globalNewsCache = new Map(); // Store all fetched articles

const HomePage = () => {
  const { user, setUser } = useContext(AuthContext);
  
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return sessionStorage.getItem('homeCategory') || 'For You';
  });

  const [news, setNews] = useState(() => {
    const initialCategory = sessionStorage.getItem('homeCategory') || 'For You';
    return categoryCache[initialCategory]?.articles || [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextPage, setNextPage] = useState(() => {
    const initialCategory = sessionStorage.getItem('homeCategory') || 'For You';
    return categoryCache[initialCategory]?.nextPage || null;
  });

  const observerTarget = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('homeCategory', selectedCategory);
  }, [selectedCategory]);

  const fetchNewsForCategory = async (category, pageToken = null) => {
    setLoading(true);
    setError(null);
    try {
      if (category === 'For You') {
        // Must have user to fetch recommendations
        if (!user || (!user._id && !user.id)) {
          setLoading(false);
          return { articles: [], nextPage: null };
        }
        
        const userId = user._id || user.id;
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        let url = `${baseUrl}/api/recommendations/${userId}`;
        if (pageToken) {
          url += `?page=${pageToken}`;
        }
        
        try {
          const response = await axios.get(url);
          let rawArticles = response.data.articles || [];
          let newNextPage = response.data.nextPage || null;
          
          const normalizedArticles = rawArticles.map(article => {
            const normalized = {
              ...article,
              sourceUrl: article.sourceUrl || article.sourceURL || article.url || article.link || article.url_link,
              id: article.id || article._id,
            };
            globalNewsCache.set(String(normalized.id), normalized);
            return normalized;
          });
          
          return { articles: normalizedArticles, nextPage: newNextPage };
        } catch (err) {
          console.error("Failed to fetch recommendations:", err);
          return { articles: [], nextPage: null };
        }
      }

      let url;
      if (category === 'KIIT') {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        url = `${baseUrl}/api/news/search?q=${encodeURIComponent('Kalinga Institute of Industrial Technology Bhubaneswar')}`;
      } else {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        url = `${baseUrl}/api/news?category=${category}`;
      }

      if (pageToken) {
        url += (url.includes('?') ? '&' : '?') + `page=${pageToken}`;
      }

      const response = await axios.get(url);
      
      let rawArticles = [];
      let newNextPage = null;
      
      if (Array.isArray(response.data)) {
        rawArticles = response.data;
      } else if (response.data && response.data.articles) {
        rawArticles = response.data.articles;
        newNextPage = response.data.nextPage;
      }

      /**
       * FIX: NORMALIZATION STEP
       * This maps the incoming data to a consistent format so NewsCard 
       * doesn't fall back to mock URLs.
       */
      const normalizedArticles = rawArticles.map(article => {
        const normalized = {
          ...article,
          // Ensure sourceUrl exists (checks common API field names)
          sourceUrl: article.sourceUrl || article.sourceURL || article.url || article.link || article.url_link,
          // Ensure ID is consistent (converts Mongo _id to id if needed)
          id: article.id || article._id,
        };
        // Add to global cache
        globalNewsCache.set(normalized.id, normalized);
        return normalized;
      });

      return { articles: normalizedArticles, nextPage: newNextPage };

    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news articles. Please ensure the backend server is running.');
      return { articles: [], nextPage: null };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialCategoryNews = async () => {
      // For "For You", we always want fresh recommendations to update well.
      // For other categories, we can use the cache.
      if (selectedCategory !== 'For You' && categoryCache[selectedCategory] && categoryCache[selectedCategory].articles.length > 0) {
        setNews(categoryCache[selectedCategory].articles);
        setNextPage(categoryCache[selectedCategory].nextPage);
        return;
      }

      setNews([]); 
      const result = await fetchNewsForCategory(selectedCategory, null);
      
      setNews(result.articles);
      setNextPage(result.nextPage);
      
      categoryCache[selectedCategory] = {
        articles: result.articles,
        nextPage: result.nextPage
      };
    };

    loadInitialCategoryNews();
  }, [selectedCategory, user?._id]);

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && nextPage && !loading) {
      loadMoreNews();
    }
  }, [nextPage, loading, selectedCategory, news]); // Added news to dependencies for correct closure

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 0.1
    });

    if (observerTarget.current) observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [handleObserver]);

  const loadMoreNews = async () => {
    const result = await fetchNewsForCategory(selectedCategory, nextPage);
    
    if (result.articles.length > 0) {
      const updatedNews = [...news, ...result.articles];
      setNews(updatedNews);
      setNextPage(result.nextPage);
      
      categoryCache[selectedCategory] = {
        articles: updatedNews,
        nextPage: result.nextPage
      };
    } else {
      setNextPage(null);
      if (categoryCache[selectedCategory]) {
          categoryCache[selectedCategory].nextPage = null;
      }
    }
  };

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
        
        setNews([...news]);
        
        if (categoryCache[selectedCategory]) {
           categoryCache[selectedCategory].articles = [...news];
        }
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const getCardVariant = (index) => {
    // Dynamic masonry pattern that perfectly fills a 12-column grid
    const pattern = [
      'featured', 'featured',             // Row 1: 6, 6 = 12
      'standard', 'standard', 'standard', // Row 2: 4, 4, 4 = 12
      'wide', 'standard',                 // Row 3: 8, 4 = 12
      'compact', 'compact', 'compact', 'compact', // Row 4: 3, 3, 3, 3 = 12
      'standard', 'wide'                  // Row 5: 4, 8 = 12
    ];
    return pattern[index % pattern.length];
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Your Briefing</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Top stories tailored for you today.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {/* Hide scrollbar internally */}
          <style dangerouslySetInnerHTML={{__html: `div::-webkit-scrollbar { display: none; }`}} />
          {CATEGORIES.map(category => (
            <button
              key={category}
              className={`filter-pill ${selectedCategory === category ? (category === 'For You' ? 'active-sparkle' : 'active') : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'For You' && <Sparkles size={16} />}
              {category}
            </button>
          ))}
        </div>
      </div>

      {loading && news.length === 0 ? (
        <div className="loading" style={{ minHeight: '300px' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
          <p>{selectedCategory === 'For You' ? 'Curating your personal feed...' : `Loading ${selectedCategory} news...`}</p>
        </div>
      ) : error ? (
        <div className="error">
          <AlertCircle size={48} />
          <p>{error}</p>
        </div>
      ) : news.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-secondary)' }}>
          {selectedCategory === 'For You' ? (
            <div className="glass-panel" style={{ display: 'inline-block', padding: '3rem', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ background: 'var(--border-color)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Sparkles size={40} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--secondary)' }}>No personalized stories yet</h3>
              <p style={{ maxWidth: '400px', margin: '0 auto' }}>Explore other categories to build your reading history. We use your interests to curate this list instantly.</p>
            </div>
          ) : (
            <div className="glass-panel" style={{ display: 'inline-block', padding: '3rem', borderRadius: 'var(--radius-xl)' }}>
              <p style={{ fontSize: '1.25rem' }}>No news articles found for this category.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Hero Section - Top Story */}
          {news.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <div className="news-grid" style={{ display: 'block' }}>
                <NewsCard 
                  news={news[0]}
                  variant="hero"
                  isBookmarked={user?.bookmarkedArticles?.includes(String(news[0].id))}
                  onToggleBookmark={handleToggleBookmark}
                />
              </div>
            </div>
          )}

          {/* Live Trends (Between Hero and the rest of the grid) */}
          <TrendingSection />

          {/* Remaining News Grid */}
          {news.length > 1 && (
            <div className="news-grid">
              {news.slice(1).map((item, index) => (
                 <NewsCard 
                    key={`news-${item.id}`}  
                    news={item}
                    variant={getCardVariant(index)}
                    isBookmarked={user?.bookmarkedArticles?.includes(String(item.id))}
                    onToggleBookmark={handleToggleBookmark} 
                 />
              ))}
            </div>
          )}
          
          <div ref={observerTarget} style={{ height: '80px', margin: '3rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
            {loading && news.length > 0 && (
              <span className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: 600 }}>
                <Loader2 className="animate-spin" size={20} color="var(--primary)" /> Loading more stories...
              </span>
            )}
            {!loading && !nextPage && news.length > 0 && (
              <span style={{ fontWeight: 500, opacity: 0.7 }}>You've caught up on all the stories!</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;