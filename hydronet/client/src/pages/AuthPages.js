import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Common/Toast';

function WaterBg() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 60% at 50% 120%, rgba(14,165,233,0.18) 0%, transparent 70%), var(--color-bg)',
    }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${200 + i * 120}px`, height: `${200 + i * 120}px`,
          border: `1px solid rgba(14,165,233,${0.04 + i * 0.01})`,
          borderRadius: '50%',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: `pulse-glow ${3 + i * 0.8}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
        }} />
      ))}
    </div>
  );
}

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { show }  = useToast();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data.success) {
        show('Welcome back to HydroNet! 💧', 'success');
        navigate('/map');
      }
    } catch (err) {
      show(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <WaterBg />
      <div className="card animate-fade-up" style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1, padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--color-teal), var(--color-emerald))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', margin: '0 auto 1rem',
            boxShadow: '0 8px 32px rgba(14,165,233,0.4)',
          }}>💧</div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: '0.25rem' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in to HydroNet</p>
        </div>

        {/* Demo hint */}
        <div style={{
          background: 'var(--color-teal-glow)', border: '1px solid rgba(14,165,233,0.2)',
          borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.82rem',
        }}>
          <strong style={{ color: 'var(--color-teal)' }}>Demo:</strong>
          <span style={{ color: 'var(--text-secondary)' }}> admin@hydronet.com / admin123!</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.85rem' }}>
            {loading ? '⏳ Signing in...' : '→ Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          New to HydroNet?{' '}
          <Link to="/register" style={{ color: 'var(--color-teal)', fontWeight: 600 }}>Create account</Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'citizen', city: '', district: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { show }     = useToast();
  const navigate     = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await register({
        name: form.name, email: form.email, password: form.password, role: form.role,
        location: { city: form.city, district: form.district },
      });
      if (data.success) {
        show('Welcome to HydroNet! 🌊 Start earning eco points!', 'success');
        navigate('/map');
      }
    } catch (err) {
      show(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '2rem 1rem' }}>
      <WaterBg />
      <div className="card animate-fade-up" style={{ width: '100%', maxWidth: 500, position: 'relative', zIndex: 1, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌊</div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: '0.25rem' }}>Join HydroNet</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Be part of the water conservation community</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="Your name" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          <div className="form-group">
            <label>I am a...</label>
            <select value={form.role} onChange={set('role')}>
              <option value="citizen">Urban Resident / Citizen</option>
              <option value="ngo">NGO / Environmental Organisation</option>
              <option value="municipal_officer">Municipal Officer</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input type="text" placeholder="Hyderabad" value={form.city} onChange={set('city')} />
            </div>
            <div className="form-group">
              <label>District</label>
              <input type="text" placeholder="Madhapur" value={form.district} onChange={set('district')} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.85rem' }}>
            {loading ? '⏳ Creating account...' : '🌱 Join HydroNet'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already a member? <Link to="/login" style={{ color: 'var(--color-teal)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
