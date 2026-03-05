import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import userService from '../services/userService';
import { User, Settings, Save, AlertCircle, BookOpen, TrendingUp, Flame, Image as ImageIcon, Trash2, Sparkles, Activity, Clock, Sun, Target, LayoutDashboard } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import MobileBackButton from '../components/MobileBackButton';

const CATEGORIES = ['Technology', 'Sports', 'Politics', 'Entertainment', 'Science', 'Health', 'Business'];

const AVATARS = [
  'https://api.dicebear.com/7.x/micah/svg?seed=Felix&backgroundColor=f8f9fa',
  'https://api.dicebear.com/7.x/micah/svg?seed=Aneka&backgroundColor=f8f9fa',
  'https://api.dicebear.com/7.x/micah/svg?seed=Leo&backgroundColor=f8f9fa',
  'https://api.dicebear.com/7.x/micah/svg?seed=Max&backgroundColor=f8f9fa',
  'https://api.dicebear.com/7.x/micah/svg?seed=Mia&backgroundColor=f8f9fa',
  'https://api.dicebear.com/7.x/micah/svg?seed=Tinkerbell&backgroundColor=f8f9fa'
];

const ProfilePage = () => {
  const { user, setUser } = useContext(AuthContext);
  const [preferences, setPreferences] = useState([]);
  const [stats, setStats] = useState({ totalArticlesRead: 0, topCategory: 'None', currentStreak: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarGrid, setShowAvatarGrid] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Growth Chart State
  const [growthData, setGrowthData] = useState([]);
  const [growthDays, setGrowthDays] = useState(7);
  const [isLoadingGrowth, setIsLoadingGrowth] = useState(false);

  // Reading Insights State
  const [insightsData, setInsightsData] = useState({
    mostActiveHour: 'N/A',
    articlesThisWeek: 0
  });
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Lock outer scrollbar on desktop only (mobile needs natural scroll for stacked layout)
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return; // let mobile scroll naturally
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  useEffect(() => {
    const syncProfile = async () => {
      if (!user) return;
      try {
        const freshUser = await userService.getProfile();
        // Update global context & storage if there are background changes
        if (JSON.stringify(freshUser.preferences) !== JSON.stringify(user.preferences) || freshUser.avatar !== user.avatar) {
          const mergedUser = { ...freshUser, token: user.token };
          localStorage.setItem('user', JSON.stringify(mergedUser));
          setUser(mergedUser);
        }
        setPreferences(freshUser.preferences);
        if (freshUser.stats) setStats(freshUser.stats);
      } catch (err) {
        console.error('Failed to sync profile on mount:', err);
        // Fallback to cache
        if (user && user.preferences) {
          setPreferences(user.preferences);
        }
      }
    };
    
    syncProfile();
  }, [user?._id]);

  useEffect(() => {
    const fetchGrowthAndInsights = async () => {
      if (!user) return;
      setIsLoadingGrowth(true);
      setIsLoadingInsights(true);
      try {
        const [growthRes, insightsRes] = await Promise.all([
          userService.getProfileGrowth(growthDays),
          userService.getReadingInsights()
        ]);
        setGrowthData(growthRes);
        setInsightsData(insightsRes);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setIsLoadingGrowth(false);
        setIsLoadingInsights(false);
      }
    };
    
    fetchGrowthAndInsights();
  }, [user?._id, growthDays]);

  const handleTogglePreference = (category) => {
    if (preferences.includes(category)) {
      setPreferences(preferences.filter(p => p !== category));
    } else {
      setPreferences([...preferences, category]);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const updatedUser = await userService.updatePreferences(preferences);
      setUser(updatedUser);
      setMessage('Preferences saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = async (avatarUrl) => {
    try {
      const updatedUser = await userService.updateAvatar(avatarUrl);
      setUser(updatedUser);
      setShowAvatarGrid(false);
      setMessage('Avatar updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Failed to update avatar');
    }
  };

  const handleResetProfile = async () => {
    setIsResetting(true);
    setError('');
    try {
      const updatedUser = await userService.resetProfile();
      setUser(updatedUser);
      setPreferences([]);
      setStats({ totalArticlesRead: 0, topCategory: 'None', currentStreak: 0 });
      setShowResetConfirm(false);
      setMessage('Profile data has been completely reset.');
      window.scrollTo(0, 0);
    } catch (err) {
      setError('Failed to reset profile.');
    } finally {
      setIsResetting(false);
    }
  };

  if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Please log in to view your profile.</div>;

  return (
    <div className="profile-dashboard-shell" style={{ display: 'flex', background: 'var(--bg-main)' }}>
      
      {/* FIXED SIDEBAR (LEFT) */}
      <div className="profile-sidebar" style={{ 
        flex: '0 0 400px', 
        borderRight: '1px solid var(--border-color)',
        background: 'rgba(255, 255, 255, 0.01)',
        display: 'flex', 
        flexDirection: 'column',
        maxHeight: '100vh',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        
        {/* 1. Profile Header */}
        <div style={{ padding: '1.25rem 2rem 0 2rem' }}>
          <MobileBackButton label="Back" />
        </div>
        <div style={{ padding: '1rem 2rem 2rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'left' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid white', boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)' }}>
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={40} color="white" />
              )}
            </div>
            <button 
              onClick={() => setShowAvatarGrid(!showAvatarGrid)}
              style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--primary-color)', color: 'white', border: '1px solid white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', transition: 'transform 0.2s', zIndex: 10 }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <ImageIcon size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
            <div style={{ opacity: 0.5, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signed in as</div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.04em', lineHeight: 1.1 }}>{user.name}</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', opacity: 0.7, wordBreak: 'break-all' }}>{user.email}</p>
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0 2rem', opacity: 0.5 }}></div>

        {/* 2. Avatar Drawer */}
        {showAvatarGrid && (
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800 }}>Choose an Avatar</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
               {AVATARS.map((url, i) => (
                  <img 
                    key={i} 
                    src={url} 
                    alt={`Avatar ${i}`} 
                    onClick={() => handleAvatarSelect(url)}
                    style={{ width: '100%', aspectRatio: '1/1', borderRadius: '50%', cursor: 'pointer', border: user.avatar === url ? '3px solid var(--primary-color)' : '3px solid transparent', transition: 'all 0.2s', padding: '1px', background: 'white' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
               ))}
            </div>
          </div>
        )}

        {/* 3. Core Stats */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: 'Total Reads', value: stats.totalArticlesRead, icon: <BookOpen size={24} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
            { label: 'Primary Domain', value: stats.topCategories && stats.topCategories.length > 0 ? stats.topCategories[0] : stats.topCategory, icon: <TrendingUp size={24} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
            { label: 'Momentum', value: `${stats.currentStreak}d Streak`, icon: <Flame size={24} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
          ].map((stat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: stat.bg, color: stat.color, width: '48px', height: '48px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ margin: '0 0 0.1rem 0', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'capitalize' }}>{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0 2rem', opacity: 0.5 }}></div>

        {/* 4. Intelligence Panel */}
        <div style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 800 }}>
            <LayoutDashboard size={20} color="var(--primary-color)" /> Intelligence
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Sun size={16} /> Peak Activity
              </div>
              <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{insightsData.mostActiveHour}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Activity size={16} /> Articles Read
              </div>
              <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{insightsData.articlesThisWeek} articles</span>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD WORKSPACE (RIGHT) */}
      <div className="profile-workspace" style={{ 
        flex: '1', 
        overflowY: 'auto', 
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '4rem'
      }}>
        
        {/* Growth Activity */}
        <section>
          <div className="profile-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
            <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.05em' }}>
              <Target size={40} color="var(--primary-color)" /> Reading Growth History
            </h2>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', padding: '0.4rem', borderRadius: '1.25rem', flexShrink: 0 }}>
              {[7, 14, 30].map(days => (
                <button
                  key={days}
                  onClick={() => setGrowthDays(days)}
                  style={{
                    padding: '0.6rem 1.75rem',
                    background: growthDays === days ? 'white' : 'transparent',
                    color: growthDays === days ? 'var(--primary-color)' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '1rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    transition: 'all 0.25s',
                    boxShadow: growthDays === days ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>

          <div className="profile-chart-container" style={{ height: '420px', width: '100%', opacity: isLoadingGrowth ? 0.5 : 1 }}>
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }} dy={20} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', padding: '1.5rem', background: 'white' }}
                    itemStyle={{ color: 'var(--primary-color)', fontWeight: 800, fontSize: '1.2rem' }}
                    labelStyle={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}
                    formatter={(value) => [`${value} Articles`, 'Processed']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reads" 
                    stroke="var(--primary-color)" 
                    strokeWidth={6} 
                    dot={{ r: 8, fill: 'var(--primary-color)', strokeWidth: 4, stroke: 'white' }} 
                    activeDot={{ r: 12, strokeWidth: 0, fill: 'var(--primary-color)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '1.5rem', background: 'rgba(0,0,0,0.015)', borderRadius: '2.5rem', border: '1px dashed var(--border-color)' }}>
                 <Activity size={56} opacity={0.25} />
                 <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>No telemetry data available for this range.</p>
              </div>
            )}
          </div>
        </section>

        {/* Narrative Discoveries */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              <Sparkles size={36} color="#f59e0b" /> Narrative Discoveries
            </h2>
            {message && <span style={{ color: '#166534', fontSize: '1rem', fontWeight: 800, background: '#dcfce7', padding: '0.4rem 1rem', borderRadius: '1rem' }}>{message}</span>}
          </div>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '3rem', opacity: 0.8, maxWidth: '800px' }}>
            These intelligence nodes are extracted automatically from your reading patterns. They represent the core domains of your specialized knowledge graph.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.75rem' }}>
            {stats.topCategories && stats.topCategories.length > 0 ? (
              stats.topCategories.map((category, index) => (
                <div
                  key={category}
                  style={{
                    padding: '2rem',
                    borderRadius: '2rem',
                    background: index === 0 ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
                    color: index === 0 ? 'white' : 'var(--text-main)',
                    fontWeight: 800,
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    boxShadow: index === 0 ? '0 20px 40px -10px rgba(92, 56, 235, 0.4)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                    if (index !== 0) e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    if (index !== 0) e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <span style={{ opacity: index === 0 ? 0.7 : 0.3, fontSize: '0.95rem' }}>0{index + 1}</span>
                    {category}
                  </span>
                  {index === 0 && <Flame size={24} fill="white" />}
                </div>
              ))
            ) : (
               <div style={{ gridColumn: '1 / -1', padding: '6rem 2rem', background: 'rgba(0,0,0,0.01)', borderRadius: '2.5rem', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 700 }}>
                 Analytical nodes pending... Continue exploring news to generate insights.
               </div>
            )}
          </div>
        </section>

        {/* System Administration */}
        <section style={{ marginTop: 'auto', background: 'white', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid #fee2e2', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
            <div style={{ background: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '0.75rem' }}>
              <AlertCircle size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.25rem 0', color: '#ef4444', fontSize: '1.1rem', fontWeight: 900 }}>Reset Data</h3>
              <p style={{ color: '#ef4444', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '1.25rem', opacity: 0.8, fontWeight: 500 }}>
                Permanently reset all your reading data and history.
              </p>
              
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '1rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 6px 18px rgba(239, 68, 68, 0.2)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Trash2 size={18} /> Reset Data
                </button>
              ) : (
                <div style={{ background: 'white', padding: '3rem', borderRadius: '2.5rem', border: '1px solid #fca5a5', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.2)' }}>
                  <p style={{ fontWeight: 900, marginBottom: '2.5rem', color: '#991b1b', fontSize: '1.5rem' }}>Confirm complete system erasure?</p>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    <button
                      onClick={handleResetProfile}
                      disabled={isResetting}
                      style={{ flex: 1, padding: '1.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '1.5rem', fontWeight: 900, cursor: isResetting ? 'not-allowed' : 'pointer' }}
                    >
                      {isResetting ? 'Erasure in progress...' : 'Execute Wipe'}
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      disabled={isResetting}
                      style={{ flex: 1, padding: '1.5rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '1.5rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Abort Mission
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
