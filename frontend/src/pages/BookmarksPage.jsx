import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import userService from '../services/userService';
import NewsCard from '../components/NewsCard';
import { Bookmark, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import MobileBackButton from '../components/MobileBackButton';

const BookmarksPage = () => {
  const { user } = useContext(AuthContext);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        if (!user) return;
        const data = await userService.getBookmarks();
        setBookmarks(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch bookmarked articles.');
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Login Required</h2>
        <p>You need to be logged in to view your bookmarks.</p>
        <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>Go to login page</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--primary-color)' }}>
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '4rem', color: '#dc2626' }}>
        <AlertCircle size={32} />
        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <div className="bookmarks-container" style={{ padding: '2rem 0' }}>
      <MobileBackButton label="Back" />
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--primary-color)', padding: '0.75rem', borderRadius: '0.75rem', color: 'white' }}>
          <Bookmark size={32} />
        </div>
        <div>
          <h1 style={{ margin: 0 }}>Saved Articles</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>Your personal collection of bookmarked news.</p>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', borderRadius: '1rem', borderStyle: 'dashed' }}>
          <Bookmark size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No bookmarks found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Articles you bookmark will appear here.</p>
          <Link to="/" className="glass-button" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold' }}>
            Browse News
          </Link>
        </div>
      ) : (
        <div className="news-card-grid">
          {bookmarks.map(article => (
            <NewsCard 
              key={article.id} 
              news={article} 
              isBookmarked={true}
              onToggleBookmark={async (id) => {
                try {
                  await userService.toggleBookmark(id);
                  setBookmarks(bookmarks.filter(b => (b.id || b._id) !== id));
                  
                  // Update local storage so Context knows about the updated bookmarks
                  const storedUser = JSON.parse(localStorage.getItem('user'));
                  if (storedUser) {
                    storedUser.bookmarkedArticles = storedUser.bookmarkedArticles.filter(bid => bid !== id);
                    localStorage.setItem('user', JSON.stringify(storedUser));
                    setUser(storedUser);
                  }
                } catch (err) {
                  console.error('Error toggling bookmark:', err);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
