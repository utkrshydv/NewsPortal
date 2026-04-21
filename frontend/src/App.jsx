import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Header from './components/Header';
import OnboardingModal from './components/OnboardingModal';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import NewsDetailPage from './pages/NewsDetailPage';
import VerifyNewsPage from './pages/VerifyNewsPage';
import ProfilePage from './pages/ProfilePage';
import BookmarksPage from './pages/BookmarksPage';
import HistoryPage from './pages/HistoryPage';
import RegionalNewsPage from './pages/RegionalNewsPage';
import SearchPage from './pages/SearchPage';
import FloatingBackground from './components/FloatingBackground';
import './index.css';

function AppLayout() {
  const { pathname } = useLocation();
  const isAuth = pathname === '/login' || pathname === '/register';
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="app">
      <FloatingBackground />

      {showBanner && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(92,56,235,0.1), rgba(139,92,246,0.08))',
          borderBottom: '1px solid rgba(92,56,235,0.15)',
          padding: '0.45rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          position: 'relative',
          zIndex: 1000,
        }}>
          <span style={{ opacity: 0.7 }}>⚡</span>
          <span>
            <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}></strong> Backend hosted on a free service — initial requests may take <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>30–60s</strong> to wake up.
          </span>
          <button
            onClick={() => setShowBanner(false)}
            aria-label="Dismiss banner"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0 0.25rem',
              lineHeight: 1,
              opacity: 0.6,
              transition: 'opacity 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '1'}
            onMouseOut={e => e.currentTarget.style.opacity = '0.6'}
          >
            ✕
          </button>
        </div>
      )}

      <Header />

      <main className="container">
        <OnboardingModal />
        {/* AuthModal floats over everything on /login and /register */}
        <AuthModal />
        <Routes>
          {/* Auth routes render home page in background — modal does the UI */}
          <Route path="/login"    element={<HomePage />} />
          <Route path="/register" element={<HomePage />} />
          <Route path="/"         element={<HomePage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/verify"   element={<VerifyNewsPage />} />
          <Route path="/profile"  element={<ProfilePage />} />
          <Route path="/bookmarks"element={<BookmarksPage />} />
          <Route path="/history"  element={<HistoryPage />} />
          <Route path="/map"      element={<RegionalNewsPage />} />
          <Route path="/search"   element={<SearchPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;

