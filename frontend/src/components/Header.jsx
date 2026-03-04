import { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Newspaper, ShieldCheck, User, LogOut, Bookmark, History, MapPin, Search, Moon, Sun } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import WeatherWidget from './WeatherWidget';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '2rem' }}>
      {/* LEFT: Logo & Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
        <Link to="/" className="header-logo" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <Newspaper size={24} color="var(--primary)" />
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--secondary)' }}>NewsPortal</span>
        </Link>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
          <input
            type="text"
            placeholder="Search news, topics, sources..."
            className="glass-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 3rem 0.85rem 1.5rem', // Padding swapped: more on right for icon
              fontSize: '0.95rem',
              borderRadius: '50%',
              border: 'none', // Removed border for that seamless pill look
              background: 'var(--bg-color)', // Solid background
              boxShadow: 'var(--shadow-md)', // Soft outer shadow like the reference
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = 'var(--shadow-md), 0 0 0 2px var(--primary)';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'var(--shadow-md)';
            }}
          />
          <button type="submit" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', transition: 'transform 0.2s', borderRadius: '50%' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}>
            <Search size={20} strokeWidth={2.5} />
          </button>
        </form>
      </div>

      {/* RIGHT: Navigation, Weather & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'flex-end', flexShrink: 0 }}>
        <nav style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link to="/" style={{ fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none', transition: 'color 0.2s', fontSize: '0.95rem' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-main)'}>Home</Link>
          <Link to="/map" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s', fontSize: '0.95rem' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
            <MapPin size={16} /> Regional
          </Link>
          <Link to="/verify" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--primary)', padding: '0.4rem 0.8rem', backgroundColor: 'rgba(92, 56, 235, 0.08)', borderRadius: '9999px', textDecoration: 'none', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(92, 56, 235, 0.15)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(92, 56, 235, 0.08)'}>
            <ShieldCheck size={16} /> Fake Checker
          </Link>
        </nav>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>
        
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', padding: '0.4rem', borderRadius: '50%', transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--card-bg-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <WeatherWidget />
        
        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>

        {user ? (
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <Link to="/history" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} title="History" onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
              <History size={18} />
            </Link>
            <Link to="/bookmarks" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} title="Bookmarks" onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
              <Bookmark size={18} />
            </Link>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)', 
                  fontWeight: 600, fontSize: '0.9rem', padding: '0.35rem 1rem 0.35rem 0.35rem', 
                  background: showDropdown ? 'var(--card-bg-hover)' : 'var(--card-bg)', 
                  borderRadius: '9999px', border: '1px solid var(--border-color)', 
                  transition: 'var(--transition-fast)', cursor: 'pointer',
                  boxShadow: showDropdown ? 'var(--shadow-md)' : 'none'
                }} 
                className="glass-panel" 
                title="Profile Menu"
              >
                {user.avatar ? (
                   <img src={user.avatar} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                   <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(92, 56, 235, 0.3)' }}>
                     <User size={18} strokeWidth={2.5} />
                   </div>
                )}
                <span>{user.name?.split(' ')[0] || 'User'}</span>
              </button>

              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  right: 0,
                  width: '200px',
                  background: 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg), 0 0 0 1px var(--border-color) inset',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  zIndex: 1000,
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.25rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Signed in as</p>
                    <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email || user.name}</p>
                  </div>
                  
                  <Link 
                    to="/profile" 
                    onClick={() => setShowDropdown(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', color: 'var(--text-main)', textDecoration: 'none', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', fontSize: '0.9rem', fontWeight: 500 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(92, 56, 235, 0.08)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-main)'; }}
                  >
                    <User size={16} /> Profile Settings
                  </Link>
                  
                  <button 
                    onClick={() => { setShowDropdown(false); handleLogout(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', color: '#ef4444', textDecoration: 'none', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', fontSize: '0.9rem', fontWeight: 500, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem' }}>Log In</Link>
            <Link to="/register" className="glass-button" style={{ fontWeight: 600, padding: '0.5rem 1.25rem', borderRadius: '9999px', textDecoration: 'none', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
