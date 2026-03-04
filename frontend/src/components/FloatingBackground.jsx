import React from 'react';

const FloatingBackground = () => {
  return (
      <div className="floating-background-container" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1,
      overflow: 'hidden',
      pointerEvents: 'none',
      background: 'transparent',
    }}>
      {/* Grain Overlay */}
      <div style={{
        position: 'absolute',
        inset: '-200%',
        zIndex: 10,
        opacity: 0.03,
        pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      <style>{`
        @keyframes b1 { 
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(15%, 10%) rotate(10deg) scale(1.1); }
          66% { transform: translate(-5%, 20%) rotate(-10deg) scale(0.9); }
        }
        @keyframes b2 { 
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(-20%, -15%) rotate(-12deg) scale(1.05); }
          66% { transform: translate(10%, -5%) rotate(8deg) scale(1.15); }
        }
        @keyframes b3 { 
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(-10%, 25%) rotate(15deg) scale(1.1); }
          66% { transform: translate(15%, -10%) rotate(-15deg) scale(0.95); }
        }
        @keyframes b4 { 
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(25%, -20%) rotate(-8deg) scale(1.2); }
          66% { transform: translate(-15%, 15%) rotate(12deg) scale(1); }
        }
        @keyframes m1 { 0%,100%{border-radius:62% 38% 55% 45% / 48% 58% 42% 52%} 50%{border-radius:40% 60% 70% 30% / 55% 35% 65% 45%} }
        @keyframes m2 { 0%,100%{border-radius:45% 55% 38% 62% / 58% 42% 58% 42%} 50%{border-radius:70% 30% 50% 50% / 30% 70% 40% 60%} }
        @keyframes m3 { 0%,100%{border-radius:55% 45% 62% 38% / 42% 62% 38% 58%} 50%{border-radius:30% 70% 40% 60% / 65% 35% 55% 45%} }
        @keyframes m4 { 0%,100%{border-radius:38% 62% 45% 55% / 62% 38% 62% 38%} 50%{border-radius:60% 40% 30% 70% / 45% 55% 35% 65%} }

        .dark .floating-blob {
          filter: blur(80px) saturate(1.5);
        }
      `}</style>

      {/* Purple Blob */}
      <div className="floating-blob" style={{ 
        position:'absolute', top:'-10%', left:'5%', width:'45vw', height:'45vw', 
        background:'radial-gradient(circle, var(--blob-purple) 0%, transparent 75%)', 
        animation:'b1 16s ease-in-out infinite, m1 10s ease-in-out infinite', 
        pointerEvents:'none' 
      }} />
      
      {/* Green Blob */}
      <div className="floating-blob" style={{ 
        position:'absolute', bottom:'-10%', right:'10%', width:'40vw', height:'40vw', 
        background:'radial-gradient(circle, var(--blob-green) 0%, transparent 75%)', 
        animation:'b2 20s ease-in-out infinite, m2 14s ease-in-out infinite', 
        pointerEvents:'none' 
      }} />
      
      {/* Blue Blob */}
      <div className="floating-blob" style={{ 
        position:'absolute', top:'20%', right:'-5%', width:'35vw', height:'35vw', 
        background:'radial-gradient(circle, var(--blob-blue) 0%, transparent 75%)', 
        animation:'b3 18s ease-in-out infinite, m3 12s ease-in-out infinite', 
        pointerEvents:'none' 
      }} />
      
      {/* Pink Blob */}
      <div className="floating-blob" style={{ 
        position:'absolute', top:'40%', left:'-5%', width:'38vw', height:'38vw', 
        background:'radial-gradient(circle, var(--blob-pink) 0%, transparent 75%)', 
        animation:'b4 15s ease-in-out infinite, m4 14s ease-in-out infinite', 
        pointerEvents:'none' 
      }} />
    </div>


  );
};

export default FloatingBackground;
