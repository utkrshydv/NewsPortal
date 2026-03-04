import React, { useState, useContext } from 'react';
import {
  Loader2, Check, BookOpen, Newspaper,
  Cpu, Briefcase, FlaskConical, HeartPulse,
  Trophy, Film, Landmark, Leaf, Globe2
} from 'lucide-react';
import userService from '../services/userService';
import { AuthContext } from '../context/AuthContext';

const TOPICS = [
  { name: 'Technology',    icon: Cpu,           color:'#6366f1', bg:'#eef2ff' },
  { name: 'Business',     icon: Briefcase,     color:'#0ea5e9', bg:'#e0f2fe' },
  { name: 'Science',      icon: FlaskConical,  color:'#8b5cf6', bg:'#f5f3ff' },
  { name: 'Health',       icon: HeartPulse,    color:'#f43f5e', bg:'#fff1f2' },
  { name: 'Sports',       icon: Trophy,        color:'#f59e0b', bg:'#fffbeb' },
  { name: 'Entertainment',icon: Film,          color:'#ef4444', bg:'#fef2f2' },
  { name: 'Politics',     icon: Landmark,      color:'#475569', bg:'#f1f5f9' },
  { name: 'Environment',  icon: Leaf,          color:'#10b981', bg:'#ecfdf5' },
  { name: 'World',        icon: Globe2,        color:'#0284c7', bg:'#f0f9ff' },
];

const MIN   = 3;
const P     = '#4338ca'; // brand indigo
const P_BG  = 'rgba(67,56,202,0.05)';
const P_BD  = 'rgba(67,56,202,0.35)';

export default function OnboardingModal() {
  const { user, setUser } = useContext(AuthContext);
  const [sel,     setSel]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  if (!user || user.onboardingCompleted) return null;

  const toggle = n => setSel(p => p.includes(n) ? p.filter(c => c !== n) : [...p, n]);

  const finish = async () => {
    if (sel.length < MIN) { setError(`Select ${MIN - sel.length} more topic${MIN - sel.length === 1 ? '' : 's'}.`); return; }
    setLoading(true); setError('');
    try {
      await userService.submitOnboarding(sel);
      setUser({ ...user, onboardingCompleted: true, explicitPreferences: sel });
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  const ready = sel.length >= MIN;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(2, 6, 23, 0.50)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '24px',
      animation: 'ob_in .2s ease',
    }}>
      <style>{`
        @keyframes ob_in   { from { opacity:0 } to { opacity:1 } }
        @keyframes ob_up   { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes ob_spin { to { transform:rotate(360deg) } }
        @keyframes ob_b1 { 0%,100%{transform:translate(0,0)   scale(1)}   50%{transform:translate(260px, 180px) scale(1.1)} }
        @keyframes ob_b2 { 0%,100%{transform:translate(0,0)   scale(1)}   50%{transform:translate(-240px,-160px) scale(1.08)} }
        @keyframes ob_b3 { 0%,100%{transform:translate(0,0)   scale(1)}   50%{transform:translate(-180px, 140px) scale(1.1)} }
        @keyframes ob_b4 { 0%,100%{transform:translate(0,0)   scale(1)}   50%{transform:translate(160px,-120px) scale(1.06)} }
        @keyframes ob_m1 { 0%,100%{border-radius:62% 38% 55% 45% / 48% 58% 42% 52%} 50%{border-radius:40% 60% 70% 30% / 55% 35% 65% 45%} }
        @keyframes ob_m2 { 0%,100%{border-radius:45% 55% 38% 62% / 58% 42% 58% 42%} 50%{border-radius:70% 30% 50% 50% / 30% 70% 40% 60%} }
        @keyframes ob_m3 { 0%,100%{border-radius:55% 45% 62% 38% / 42% 62% 38% 58%} 50%{border-radius:30% 70% 40% 60% / 65% 35% 55% 45%} }
        @keyframes ob_m4 { 0%,100%{border-radius:38% 62% 45% 55% / 62% 38% 62% 38%} 50%{border-radius:60% 40% 30% 70% / 45% 55% 35% 65%} }
        .ob-wrap { animation: ob_up .3s cubic-bezier(.16,1,.3,1) both; }
        .ob-card {
          display:flex; flex-direction:column; align-items:center; gap:8px;
          padding:28px 12px; border-radius:16px; cursor:pointer; min-height:110px;
          border:1px solid #e2e8f0; background:#fff;
          transition: border-color .15s, background .15s, box-shadow .15s, transform .12s;
          font-family:inherit; outline:none; position:relative;
          box-shadow: 0 1px 3px rgba(0,0,0,.06);
        }
        .ob-card:hover  { border-color:#c7d2fe; box-shadow:0 4px 10px rgba(0,0,0,.08); transform:translateY(-2px); }
        .ob-card:active { transform:scale(.975); }
        .ob-card.on     { border-color:${P_BD}; background:${P_BG}; box-shadow:none; }
        .ob-btn {
          display:inline-flex; align-items:center; gap:8px;
          padding:10px 24px; border-radius:8px; border:none; cursor:pointer;
          background:${P}; color:#fff; font-size:14px; font-weight:600;
          font-family:inherit; letter-spacing:.01em;
          transition: opacity .15s, transform .15s;
          box-shadow: 0 1px 2px rgba(0,0,0,.06);
        }
        .ob-btn:hover:not(:disabled)  { opacity:.88; transform:translateY(-1px); }
        .ob-btn:active:not(:disabled) { transform:scale(.98); }
        .ob-btn:disabled { background:#e2e8f0; color:#94a3b8; cursor:not-allowed; box-shadow:none; }
      `}</style>

      {/* ── SHEET ── */}
      <div className="ob-wrap" style={{
        width:'100%', maxWidth:'900px',
        background:'#F8FAFC',
        borderRadius:'24px',
        border:'1px solid #E2E8F0',
        boxShadow:'0 4px 6px rgba(0,0,0,.04), 0 20px 40px rgba(0,0,0,.12)',
        fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        overflow:'hidden',
        position:'relative',
      }}>
        {/* ── Floating abstract colour shapes ── */}
        <div style={{ position:'absolute', top:'-60px', left:'10%', width:340, height:320, borderRadius:'62% 38% 55% 45% / 48% 58% 42% 52%', background:'radial-gradient(circle, rgba(139,92,246,0.30) 0%, transparent 70%)', animation:'ob_b1 9s ease-in-out infinite, ob_m1 12s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'absolute', bottom:'-60px', right:'15%', width:300, height:320, borderRadius:'45% 55% 38% 62% / 58% 42% 58% 42%', background:'radial-gradient(circle, rgba(16,185,129,0.27) 0%, transparent 70%)', animation:'ob_b2 11s ease-in-out infinite, ob_m2 14s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'absolute', top:'30%', right:'-50px', width:280, height:300, borderRadius:'55% 45% 62% 38% / 42% 62% 38% 58%', background:'radial-gradient(circle, rgba(59,130,246,0.26) 0%, transparent 70%)', animation:'ob_b3 13s ease-in-out infinite, ob_m3 10s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'absolute', top:'45%', left:'-40px', width:260, height:280, borderRadius:'38% 62% 45% 55% / 62% 38% 62% 38%', background:'radial-gradient(circle, rgba(236,72,153,0.24) 0%, transparent 70%)', animation:'ob_b4 15s ease-in-out infinite, ob_m4 11s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />

        {/* HEADER */}
        <div style={{ padding:'32px 40px 24px' }}>
          {/* Logo chip */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'4px 10px 4px 6px', borderRadius:8, marginBottom:24,
            background:'#fff', border:'1px solid #E2E8F0',
            boxShadow:'0 1px 2px rgba(0,0,0,.05)',
          }}>
            <div style={{
              width:22, height:22, borderRadius:5, background:P,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Newspaper size={13} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize:12, fontWeight:600, color:'#475569', letterSpacing:'.02em' }}>
              NewsPortal
            </span>
          </div>

          <h1 style={{
            margin:'0 0 6px', fontSize:'22px', fontWeight:600,
            color:'#0F172A', letterSpacing:'-.3px', lineHeight:1.3,
          }}>
            What are you interested in?
          </h1>
          <p style={{ margin:0, fontSize:'14px', color:'#64748B', lineHeight:1.6 }}>
            Pick at least {MIN} topics — we'll personalise your feed around them.
          </p>
        </div>

        {/* GRID */}
        <div style={{ padding:'0 40px 24px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
            {TOPICS.map(({ name, icon: Icon, color, bg }) => {
              const on = sel.includes(name);
              return (
                <button key={name} className={`ob-card${on ? ' on' : ''}`} onClick={() => toggle(name)}>
                  {on && (
                    <div style={{
                      position:'absolute', top:8, right:8,
                      width:18, height:18, borderRadius:'50%', background:P,
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <Check size={10} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                  <div style={{
                    width:38, height:38, borderRadius:9,
                    background: on ? bg : bg,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: color,
                    transition:'all .15s',
                  }}>
                    <Icon size={19} strokeWidth={1.9} />
                  </div>
                  <span style={{
                    fontSize:'13px', fontWeight:500,
                    color: on ? P : '#374151',
                    transition:'color .15s',
                  }}>
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          padding:'16px 40px 28px',
          display:'flex', alignItems:'center',
          justifyContent:'space-between', gap:16, flexWrap:'wrap',
        }}>
          {/* Progress */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', gap:4 }}>
              {Array.from({ length: MIN }).map((_, i) => (
                <div key={i} style={{
                  width:6, height:6, borderRadius:'50%',
                  background: i < sel.length ? P : '#CBD5E1',
                  transition:'background .2s',
                }} />
              ))}
            </div>
            <span style={{
              fontSize:'13px', fontWeight:500,
              color: ready ? P : '#94A3B8',
              transition:'color .2s',
            }}>
              {ready
                ? `${sel.length} topics selected`
                : `${sel.length} of ${MIN} selected`}
            </span>
            {error && (
              <span style={{ fontSize:'13px', color:'#DC2626', fontWeight:500 }}>
                · {error}
              </span>
            )}
          </div>

          {/* CTA */}
          <button className="ob-btn" onClick={finish} disabled={loading || !ready} style={{ minWidth:150 }}>
            {loading
              ? <Loader2 size={14} style={{ animation:'ob_spin .9s linear infinite' }} />
              : <BookOpen size={14} />}
            {loading ? 'Setting up…' : 'Start Reading'}
          </button>
        </div>
      </div>
    </div>
  );
}
