import { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AlertCircle, Search } from 'lucide-react';
import NewsCard from '../components/NewsCard';
import { AuthContext } from '../context/AuthContext';
import userService from '../services/userService';

// Helper hook to get query parameters
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchPage = () => {
  const { user, setUser } = useContext(AuthContext);
  const query = useQuery();
  const searchQuery = query.get('q') || '';
  
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`http://localhost:5000/api/news/search?q=${encodeURIComponent(searchQuery)}`);
        
        let rawArticles = [];
        if (Array.isArray(response.data)) {
          rawArticles = response.data;
        } else if (response.data && response.data.articles) {
          rawArticles = response.data.articles;
        }

        const normalizedArticles = rawArticles.map(article => ({
          ...article,
          sourceUrl: article.sourceUrl || article.sourceURL || article.url || article.link || article.url_link,
          id: article.id || article._id,
        }));

        setNews(normalizedArticles);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('Failed to load search results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery]);

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
        
        setNews([...news]); // Re-render to update bookmark UI
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
      <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Search size={32} color="var(--primary)" />
          Search Results
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Showing results for: <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>"{searchQuery}"</span>
        </p>
      </div>

      {loading ? (
        <div className="loading" style={{ minHeight: '300px' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
          <p>Scouring the web for "{searchQuery}"...</p>
        </div>
      ) : error ? (
        <div className="error">
          <AlertCircle size={48} />
          <p>{error}</p>
        </div>
      ) : news.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-secondary)' }}>
          <div className="glass-panel" style={{ display: 'inline-block', padding: '3rem', borderRadius: 'var(--radius-xl)' }}>
             <Search size={48} color="var(--text-light)" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
             <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>No results found</h3>
             <p style={{ maxWidth: '400px', margin: '0 auto' }}>We couldn't find any news articles matching "{searchQuery}". Try using different keywords or broader topics.</p>
          </div>
        </div>
      ) : (
        <div className="news-grid">
          {news.map((item, index) => (
             <NewsCard 
                key={`search-${item.id}`}  
                news={item}
                variant={getCardVariant(index)}
                isBookmarked={user?.bookmarkedArticles?.includes(String(item.id))}
                onToggleBookmark={handleToggleBookmark} 
             />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
