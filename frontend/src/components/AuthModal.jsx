import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Eye, EyeOff, Newspaper, X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

/* ─────────────────────────────────
   Shared input / button styles
───────────────────────────────── */
const inputStyle = {
  width: '100%', padding: '11px 14px', fontSize: '14px',
  border: '1.5px solid #e2e8f0', borderRadius: '8px',
  background: '#f8fafc', color: '#0f172a', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color .15s, background .15s',
};
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' };

/* ─────────────────────────────────
   LOGIN FORM
───────────────────────────────── */
function LoginForm({ switchToRegister, onClose }) {
  const [fd, setFd]           = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const onChange = e => setFd(p => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try { await login(fd); onClose(); navigate('/'); }
    catch (err) { setError(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async cr => {
    setError('');
    try { await googleLogin(cr.credential); onClose(); navigate('/'); }
    catch { setError('Google sign-in failed.'); }
  };

  return (
    <>
      <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-.3px' }}>
        Welcome back
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b' }}>
        Sign in to access your personalised news feed
      </p>

      {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'9px 12px', borderRadius:'7px', marginBottom:'16px', fontSize:'13px' }}>{error}</div>}

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" name="email" value={fd.email} onChange={onChange} placeholder="Enter your email"
            onFocus={e => { e.target.style.borderColor='#4338ca'; e.target.style.background='#fff'; }}
            onBlur={e =>  { e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'; }}
            required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <input style={{ ...inputStyle, paddingRight: '42px' }} type={showPass ? 'text' : 'password'}
              name="password" value={fd.password} onChange={onChange} placeholder="Enter your password"
              onFocus={e => { e.target.style.borderColor='#4338ca'; e.target.style.background='#fff'; }}
              onBlur={e =>  { e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'; }}
              required />
            <button type="button" onClick={() => setShowPass(p => !p)}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex', padding:0 }}>
              {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
        </div>
        <div style={{ textAlign: 'right', marginBottom: '22px' }}>
          <a href="#" style={{ fontSize:'12px', color:'#4338ca', textDecoration:'none', fontWeight:500 }}>Forgot password?</a>
        </div>
        <button type="submit" disabled={loading} style={{
          width:'100%', padding:'12px', fontSize:'14px', fontWeight:600, border:'none', borderRadius:'8px',
          background:'#4338ca', color:'#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit',
          opacity: loading ? .7 : 1, transition:'opacity .15s, transform .15s',
        }}
        onMouseEnter={e => { if (!loading) e.target.style.opacity='.88'; }}
        onMouseLeave={e => { if (!loading) e.target.style.opacity='1'; }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:10, margin:'16px 0' }}>
          <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
          <span style={{ fontSize:11, color:'#94a3b8' }}>or continue with</span>
          <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
        </div>

        <div style={{ display:'flex', justifyContent:'center' }}>
          <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google sign-in failed.')}
            theme="outline" shape="rectangular" text="signin_with" width="340" />
        </div>
      </form>

      <p style={{ textAlign:'center', fontSize:'13px', color:'#64748b', marginTop:'20px' }}>
        Don't have an account?{' '}
        <button onClick={switchToRegister} style={{ background:'none', border:'none', color:'#4338ca', fontWeight:600, cursor:'pointer', fontSize:'13px', padding:0, fontFamily:'inherit' }}>
          Sign Up
        </button>
      </p>
    </>
  );
}

/* ─────────────────────────────────
   REGISTER FORM
───────────────────────────────── */
function RegisterForm({ switchToLogin, onClose }) {
  const [fd, setFd]             = useState({ name:'', email:'', password:'', password2:'' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { register, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const onChange = e => setFd(p => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    if (fd.password !== fd.password2) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try { await register({ name: fd.name, email: fd.email, password: fd.password }); onClose(); navigate('/'); }
    catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async cr => {
    setError('');
    try { await googleLogin(cr.credential); onClose(); navigate('/'); }
    catch { setError('Google sign-up failed.'); }
  };

  const inp = (name, type, placeholder, extraStyle = {}) => (
    <input style={{ ...inputStyle, ...extraStyle }} type={type} name={name} value={fd[name]} onChange={onChange} placeholder={placeholder}
      onFocus={e => { e.target.style.borderColor='#4338ca'; e.target.style.background='#fff'; }}
      onBlur={e =>  { e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'; }}
      required />
  );

  return (
    <>
      <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-.3px' }}>
        Create an account
      </h2>
      <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
        Sign up to start your personalised news experience
      </p>

      {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'9px 12px', borderRadius:'7px', marginBottom:'14px', fontSize:'13px' }}>{error}</div>}

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom:'12px' }}>
          <label style={labelStyle}>Full Name</label>
          {inp('name','text','Your full name')}
        </div>
        <div style={{ marginBottom:'12px' }}>
          <label style={labelStyle}>Email</label>
          {inp('email','email','Enter your email')}
        </div>
        <div style={{ marginBottom:'12px' }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position:'relative' }}>
            {inp('password', showPass ? 'text' : 'password', 'Create a password', { paddingRight:42 })}
            <button type="button" onClick={() => setShowPass(p => !p)}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex', padding:0 }}>
              {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
        </div>
        <div style={{ marginBottom:'20px' }}>
          <label style={labelStyle}>Confirm Password</label>
          {inp('password2','password','Confirm your password')}
        </div>

        <button type="submit" disabled={loading} style={{
          width:'100%', padding:'12px', fontSize:'14px', fontWeight:600, border:'none', borderRadius:'8px',
          background:'#4338ca', color:'#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit',
          opacity: loading ? .7 : 1, transition:'opacity .15s',
        }}
        onMouseEnter={e => { if (!loading) e.target.style.opacity='.88'; }}
        onMouseLeave={e => { if (!loading) e.target.style.opacity='1'; }}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:10, margin:'16px 0' }}>
          <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
          <span style={{ fontSize:11, color:'#94a3b8' }}>or</span>
          <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
        </div>

        <div style={{ display:'flex', justifyContent:'center' }}>
          <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google sign-up failed.')}
            theme="outline" shape="rectangular" text="signup_with" width="340" />
        </div>
      </form>

      <p style={{ textAlign:'center', fontSize:'13px', color:'#64748b', marginTop:'18px' }}>
        Already have an account?{' '}
        <button onClick={switchToLogin} style={{ background:'none', border:'none', color:'#4338ca', fontWeight:600, cursor:'pointer', fontSize:'13px', padding:0, fontFamily:'inherit' }}>
          Sign In
        </button>
      </p>
    </>
  );
}

/* ─────────────────────────────────
   AUTH MODAL  (main export)
───────────────────────────────── */
const AuthModal = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user }  = useContext(AuthContext);

  // Determine which view to show based on route
  const isLogin    = location.pathname === '/login';
  const isRegister = location.pathname === '/register';
  const isOpen     = isLogin || isRegister;

  // Lock body scroll while modal is open — must be before early return (Rules of Hooks)
  useEffect(() => {
    if (!isOpen || user) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, user]);

  if (!isOpen || user) return null;

  const onClose = () => navigate('/');
  const toLogin    = () => navigate('/login');
  const toRegister = () => navigate('/register');

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position:'fixed', inset:0, zIndex:9000,
        background:'rgba(15,23,42,0.55)',
        backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'20px', animation:'am-fade .2s ease',
        overflowY:'auto',
      }}
    >
      <style>{`
        @keyframes am-fade { from{opacity:0} to{opacity:1} }
        @keyframes am-rise { from{opacity:0;transform:translateY(14px) scale(.98)} to{opacity:1;transform:none} }
      `}</style>

      {/* ── CARD ── */}
      <div style={{ display:'flex', width:'100%', maxWidth:'980px', height:'660px',
        borderRadius:'20px', overflow:'hidden',
        boxShadow:'0 32px 80px rgba(0,0,0,0.35)',
        animation:'am-rise .3s cubic-bezier(.16,1,.3,1)',
        fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      }}>

        {/* LEFT — gradient hero panel */}
        <div style={{
          flex:'0 0 40%', position:'relative', overflow:'hidden',
          background:'linear-gradient(160deg,#0d0221 0%,#1e1050 25%,#4338ca 60%,#7c3aed 85%,#a855f7 100%)',
          display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'36px',
        }}>
          {/* Orbs */}
          <div style={{position:'absolute',top:'-60px',right:'-60px',width:240,height:240,borderRadius:'50%',background:'radial-gradient(circle,rgba(168,85,247,0.45) 0%,transparent 70%)',pointerEvents:'none'}} />
          <div style={{position:'absolute',bottom:'-50px',left:'-50px',width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.4) 0%,transparent 70%)',pointerEvents:'none'}} />
          <div style={{position:'absolute',top:'35%',left:'-30px',width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(236,72,153,0.3) 0%,transparent 70%)',pointerEvents:'none'}} />

          <div style={{position:'relative',zIndex:1}}>
            {/* Logo */}
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:'28px'}}>
              <div style={{width:26,height:26,borderRadius:7,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Newspaper size={14} color="white" strokeWidth={2.5}/>
              </div>
              <span style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.85)',letterSpacing:'.04em'}}>NewsPortal</span>
            </div>

            <h2 style={{margin:'0 0 12px',fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:800,color:'#fff',lineHeight:1.15,letterSpacing:'-1px'}}>
              {isLogin ? 'Welcome\nBack.' : 'Your News,\nYour Way.'}
            </h2>
            <p style={{margin:0,fontSize:'13px',color:'rgba(255,255,255,0.6)',lineHeight:1.65,maxWidth:240}}>
              {isLogin
                ? 'Stay informed with stories curated just for you.'
                : 'Join thousands of readers who trust NewsPortal to keep them informed, every day.'}
            </p>
          </div>
        </div>

        {/* RIGHT — form panel */}
        <div style={{
          flex:1, background:'#fff', display:'flex', flexDirection:'column',
          justifyContent:'center', padding:'36px 40px', overflowY:'auto', position:'relative',
        }}>
          {/* Close button */}
          <button onClick={onClose} style={{
            position:'absolute', top:16, right:16, width:30, height:30,
            borderRadius:'50%', border:'1px solid #e2e8f0', background:'#f8fafc',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color:'#64748b', padding:0,
          }}
          onMouseEnter={e => e.currentTarget.style.background='#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background='#f8fafc'}>
            <X size={14}/>
          </button>

          {isLogin
            ? <LoginForm    switchToRegister={toRegister} onClose={onClose} />
            : <RegisterForm switchToLogin={toLogin}       onClose={onClose} />}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
