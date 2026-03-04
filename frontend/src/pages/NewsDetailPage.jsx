import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader2, AlertCircle, Bookmark } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import userService from '../services/userService';

const NewsDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);


  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/news/${id}`);
        setArticle(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load the article. It may not exist.');
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const hasTracked = useRef(false);

  // Track history carefully on unmount or navigate away to prevent duplicate firing
  useEffect(() => {
    if (!article || !user) return;

    const trackFinalHistory = () => {
      if (hasTracked.current) return;
      hasTracked.current = true;
      
      try {
        const payload = JSON.stringify({
          articleId: article.id || article._id,
          category: article.category
        });

        fetch('http://localhost:5000/api/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: payload,
          keepalive: true
        });
      } catch (err) {
        console.error('Failed to record final reading history:', err);
      }
    };

    window.addEventListener('beforeunload', trackFinalHistory);
    
    return () => {
      window.removeEventListener('beforeunload', trackFinalHistory);
      trackFinalHistory();
    };
  }, [article, user]);

  useEffect(() => {
    if (!article || !user) return;
    
    // Register a solid 'read' after 10 seconds of staying on the page
    const timer = setTimeout(() => {
       userService.trackInteraction(article.id || article._id, article.category, 'read')
         .catch(console.error);
    }, 10000); 
    
    return () => clearTimeout(timer);
  }, [article, user]);

  useEffect(() => {
    if (user && user.bookmarkedArticles && article) {
      setIsBookmarked(user.bookmarkedArticles.includes(article.id));
    }
  }, [user, article]);

  const handleBookmark = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setIsTogglingBookmark(true);
    try {
      await userService.toggleBookmark(article.id);
      
      // Track interaction if they are saving it
      if (!isBookmarked) {
         userService.trackInteraction(article.id, article.category, 'bookmark').catch(console.error);
      }
      
      setIsBookmarked(!isBookmarked);
      
      // Update local storage so Context knows about the updated bookmarks
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        if (!isBookmarked) {
          storedUser.bookmarkedArticles.push(article.id);
        } else {
          storedUser.bookmarkedArticles = storedUser.bookmarkedArticles.filter(id => id !== article.id);
        }
        localStorage.setItem('user', JSON.stringify(storedUser));
        setUser(storedUser);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    } finally {
      setIsTogglingBookmark(false);
    }
  };


  if (loading) {
    return (
      <div className="loading">
        <Loader2 className="animate-spin" size={48} color="#4F46E5" />
        <p>Loading article...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <AlertCircle size={48} />
        <p>{error}</p>
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="detail-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back to News
        </button>
        
        {article && (
          <button 
            onClick={handleBookmark} 
            disabled={isTogglingBookmark}
            className={isBookmarked ? "glass-button" : "glass-input"}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.5rem 1rem', 
              color: isBookmarked ? 'white' : 'var(--text-color)', 
              borderRadius: '0.5rem', 
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: isTogglingBookmark ? 0.7 : 1
            }}
          >
            <Bookmark size={20} fill={isBookmarked ? 'white' : 'none'} color={isBookmarked ? 'white' : 'currentColor'} />
            {isBookmarked ? 'Saved' : 'Save Article'}
          </button>
        )}
      </div>

      {article && (
        <article className="glass-panel" style={{ padding: '2rem', paddingBottom: '3rem', margin: '2rem 0' }}>
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="detail-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=2072&auto=format&fit=crop';
            }}
          />
          <div className="detail-header">
            <div className="detail-meta">
              <span className="news-card-category">{article.category}</span>
              <span className="news-card-date">
                {new Date(article.date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <h1 className="detail-title">{article.title}</h1>
          </div>

          <div className="detail-content">
            {article.content.split('\n').map((paragraph, index) => (
              <p key={index} style={{ marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: 1.8 }}>{paragraph}</p>
            ))}
          </div>
        </article>
      )}
    </div>
  );
};

export default NewsDetailPage;
