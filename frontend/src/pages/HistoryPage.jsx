import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import api from '../services/api';
import { History, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import MobileBackButton from '../components/MobileBackButton';

const HistoryPage = () => {
  const { user } = useContext(AuthContext);
  const [historyItems, setHistoryItems] = useState([]);
  const [newsCache, setNewsCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistoryAndArticles = async () => {
      if (!user) return;
      
      try {
        const res = await api.get('/history');
        setHistoryItems(res.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch history:', err);
        setError('Failed to load reading history. Please ensure backend is updated.');
        setLoading(false);
      }
    };

    fetchHistoryAndArticles();
  }, [user]);

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Login Required</h2>
        <p>You need to be logged in to view your reading history.</p>
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
    <div className="history-container" style={{ padding: '2rem 0' }}>
      <MobileBackButton label="Back" />
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--primary-color)', padding: '0.75rem', borderRadius: '0.75rem', color: 'white' }}>
          <History size={32} />
        </div>
        <div>
          <h1 style={{ margin: 0 }}>Reading History</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>Articles you have read recently.</p>
        </div>
      </div>

      {historyItems.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', borderRadius: '1rem', borderStyle: 'dashed' }}>
          <History size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No history found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Read some articles and they will appear here.</p>
          <Link to="/" className="glass-button" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold' }}>
            Start Reading
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {historyItems.map((record) => {
            const article = record.article;
            if (!article) return null;

            const targetUrl = article.sourceUrl || `/news/${article.id || article._id}`;
            const isExternal = !!article.sourceUrl || targetUrl.startsWith('http');

            return (
              <a href={targetUrl} target={isExternal ? "_blank" : "_self"} rel="noreferrer" key={record._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="glass-panel" style={{ display: 'flex', padding: '1rem', borderRadius: '0.75rem', transition: 'all 0.2s' }}>
                  {article.imageUrl && (
                    <img src={article.imageUrl} alt={article.title} style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '0.25rem', marginRight: '1rem' }} />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{article.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <span style={{ background: 'var(--background-color)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>{article.category}</span>
                      <span>Read on: {new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
