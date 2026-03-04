import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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

  return (
    <div className="app">
      <FloatingBackground />
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

