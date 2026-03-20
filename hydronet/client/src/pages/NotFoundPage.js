import React from 'react';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
      background: 'var(--color-bg)',
    }}>
      {/* Animated water rings */}
      <div style={{ position: 'relative', width: 120, height: 120, marginBottom: '2rem' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            border: `2px solid rgba(14,165,233,${0.3 - i * 0.08})`,
            borderRadius: '50%',
            animation: `pulse-glow ${2 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
            transform: `scale(${1 + i * 0.3})`,
          }} />
        ))}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '3rem',
        }}>💧</div>
      </div>

      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: '5rem', fontWeight: 800,
        color: 'var(--color-teal)', lineHeight: 1, marginBottom: '0.5rem',
      }}>404</h1>
      <h2 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
        This well ran dry
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', maxWidth: 360 }}>
        The page you're looking for doesn't exist or has been moved. Let's get you back to the network.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Go Back</button>
        <button className="btn btn-primary" onClick={() => navigate('/map')}>🗺️ Open Map</button>
      </div>
    </div>
  );
}

export function LoadingScreen({ message = 'Loading HydroNet...' }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--color-bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, var(--color-teal), var(--color-emerald))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem', boxShadow: '0 8px 32px rgba(14,165,233,0.4)',
        animation: 'float 2s ease-in-out infinite',
      }}>💧</div>
      <div className="spinner" style={{ marginBottom: '1rem' }} />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        {message}
      </div>
    </div>
  );
}
