import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Eye, EyeOff, Newspaper } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const useIsMobile = () => {
  const mq = window.matchMedia('(max-width: 768px)');
  const [m, setM] = useState(mq.matches);
  useEffect(() => {
    const h = (e) => setM(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return m;
};

const RegisterPage = () => {
  const [formData, setFormData]   = useState({ name: '', email: '', password: '', password2: '' });
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, googleLogin, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => { if (user) navigate('/'); }, [user, navigate]);

  const onChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    if (formData.password !== formData.password2) { setError('Passwords do not match'); return; }
    setIsLoading(true); setError('');
    try { await register({ name: formData.name, email: formData.email, password: formData.password }); navigate('/'); }
    catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setIsLoading(false); }
  };

  const handleGoogleSuccess = async cr => {
    setError('');
    try { await googleLogin(cr.credential); navigate('/'); }
    catch { setError('Google sign-up failed. Please try again.'); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#f1f5f9 0%,#e8edf5 100%)', padding:'24px', fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <style>{`
        .auth-input {
          width: 100%; padding: 12px 14px; font-size: 14px;
          border: 1.5px solid #e2e8f0; border-radius: 8px;
          background: #f8fafc; color: #0f172a; outline: none;
          transition: border-color .17s, background .17s; box-sizing: border-box;
          font-family: inherit;
        }
        .auth-input:focus { border-color: #4338ca; background: #fff; }
        .auth-input::placeholder { color: #94a3b8; }
        .auth-submit {
          width: 100%; padding: 13px; font-size: 15px; font-weight: 600;
          border: none; border-radius: 8px; cursor: pointer;
          background: #0f172a; color: #fff; letter-spacing: .01em;
          transition: opacity .17s, transform .17s; font-family: inherit;
        }
        .auth-submit:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
        .auth-submit:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>

      {/* CARD */}
      <div className="auth-card" style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', width:'100%', maxWidth: isMobile ? '100%' : 900, height: isMobile ? 'auto' : 620, minHeight: isMobile ? '100vh' : 'auto', borderRadius: isMobile ? 0 : 24, overflow:'hidden', boxShadow: isMobile ? 'none' : '0 8px 40px rgba(67,56,202,0.13), 0 2px 8px rgba(0,0,0,0.08)' }}>

        {/* ── LEFT PANEL ── */}
        <div className="auth-left-panel" style={{
          flex: isMobile ? 'none' : '0 0 42%',
          width: isMobile ? '100%' : undefined,
          height: isMobile ? 185 : undefined,
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg, #0d0221 0%, #1a0533 20%, #0f3460 40%, #16213e 55%, #6b21a8 75%, #c026d3 100%)',
          display: 'flex', flexDirection: 'column',
          justifyContent: isMobile ? 'flex-end' : 'space-between',
          padding: isMobile ? '24px 24px 20px' : '36px',
        }}>
        {/* Decorative orbs */}
        <div style={{ position:'absolute', top:'-60px', right:'-60px', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.45) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-80px', left:'-40px', width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'50%', left:'-30px', width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(236,72,153,0.4) 0%, transparent 70%)', pointerEvents:'none' }} />

        {/* Top spacer */}
        <div />

        {/* Bottom text */}
        <div style={{ position:'relative', zIndex:1 }}>
          <h2 style={{
            fontSize:'clamp(2.2rem,4vw,3.2rem)', fontWeight:800,
            color:'#fff', lineHeight:1.1, margin:'0 0 1rem',
            letterSpacing:'-1px',
          }}>
            Your News,<br />Your Way.
          </h2>
          <p className="auth-banner-hide" style={{ fontSize:14, color:'rgba(255,255,255,0.65)', lineHeight:1.7, margin:'0 0 2.5rem', maxWidth:340 }}>
            Join thousands of readers who trust NewsPortal to keep them informed, every single day.
          </p>
          <div className="auth-banner-hide" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:24, height:24, borderRadius:6, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Newspaper size={13} color="white" />
            </div>
            <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', letterSpacing:'.05em' }}>
              NewsPortal
            </span>
          </div>
        </div>
      </div>

        {/* ── RIGHT PANEL ── */}
        <div className="auth-right-panel" style={{
          flex: 1, display:'flex', flexDirection:'column',
          justifyContent: isMobile ? 'flex-start' : 'center',
          alignItems: isMobile ? 'stretch' : 'center',
          padding: isMobile ? '28px 20px 40px' : '36px 36px',
          overflowY:'auto', background:'#fff',
        }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:40 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Newspaper size={15} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize:15, fontWeight:700, color:'#0f172a', letterSpacing:'.02em' }}>NewsPortal</span>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize:28, fontWeight:700, color:'#0f172a', margin:'0 0 6px', letterSpacing:'-.4px' }}>
            Create an account
          </h1>
          <p style={{ fontSize:14, color:'#64748b', margin:'0 0 28px', lineHeight:1.5 }}>
            Sign up to start your personalised news experience
          </p>

          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 14px', borderRadius:8, marginBottom:20, fontSize:13, fontWeight:500 }}>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit}>
            {/* Name */}
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Full Name</label>
              <input className="auth-input" type="text" name="name" value={formData.name} onChange={onChange} placeholder="Your full name" required />
            </div>

            {/* Email */}
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Email</label>
              <input className="auth-input" type="email" name="email" value={formData.email} onChange={onChange} placeholder="Enter your email" required />
            </div>

            {/* Password */}
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input className="auth-input" type={showPass ? 'text' : 'password'} name="password" value={formData.password} onChange={onChange} placeholder="Create a password" required style={{ paddingRight:44 }} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Confirm Password</label>
              <input className="auth-input" type="password" name="password2" value={formData.password2} onChange={onChange} placeholder="Confirm your password" required />
            </div>

            {/* Submit */}
            <button className="auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Create Account'}
            </button>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
              <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
              <span style={{ fontSize:12, color:'#94a3b8', whiteSpace:'nowrap' }}>or</span>
              <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
            </div>

            {/* Google */}
            <div style={{ display:'flex', justifyContent:'center' }}>
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google sign-up failed.')} theme="outline" shape="rectangular" text="signup_with" width="400" />
            </div>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'#64748b', marginTop:28 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#4338ca', fontWeight:600, textDecoration:'none' }}
              onMouseEnter={e => e.target.style.textDecoration='underline'}
              onMouseLeave={e => e.target.style.textDecoration='none'}>
              Sign In
            </Link>
          </p>
        </div>
        </div>
      </div>{/* end card */}
    </div>
  );
};

export default RegisterPage;
