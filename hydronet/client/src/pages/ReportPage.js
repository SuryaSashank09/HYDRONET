import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/Common/Toast';
import { TYPE_ICONS, TYPE_LABELS } from '../utils/helpers';
import ImageUploader from '../components/Common/ImageUploader';

const CONDITIONS = [
  { value: 'functional',     label: '✅ Functional',     desc: 'System working properly',           points: 10 },
  { value: 'needs_repair',   label: '🔧 Needs Repair',   desc: 'Minor issues, still partially works', points: 25 },
  { value: 'non_functional', label: '❌ Non-Functional',  desc: 'System completely broken',           points: 30 },
  { value: 'blocked_inlet',  label: '🚫 Blocked Inlet',  desc: 'Inlet pipe blocked with debris',     points: 20 },
  { value: 'overflow',       label: '🌊 Overflow Issue', desc: 'System overflowing or not draining',  points: 20 },
  { value: 'contaminated',   label: '⚠️ Contaminated',   desc: 'Water quality concern',              points: 35 },
  { value: 'other',          label: '📝 Other',          desc: 'Something else (describe below)',    points: 10 },
];

const SEVERITIES = [
  { value: 'low',      label: 'Low',      color: '#10b981' },
  { value: 'medium',   label: 'Medium',   color: '#f59e0b' },
  { value: 'high',     label: 'High',     color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#f43f5e' },
];

export default function ReportPage() {
  const [searchParams]  = useSearchParams();
  const [structures, setStructures] = useState([]);
  const [form, setForm] = useState({
    structureId:       searchParams.get('structureId') || '',
    conditionObserved: '',
    severity:          'medium',
    description:       '',
    images:            [],
  });
  const [loading, setLoading]   = useState(false);
  const [loadingS, setLoadingS] = useState(true);
  const [submitted, setSubmitted] = useState(null);
  const { show }  = useToast();
  const navigate  = useNavigate();

  useEffect(() => {
    api.get('/structures', { params: { limit: 200 } })
      .then(({ data }) => setStructures(data.data || []))
      .finally(() => setLoadingS(false));
  }, []);

  const selectedCondition = CONDITIONS.find(c => c.value === form.conditionObserved);
  const selectedStructure = structures.find(s => s._id === form.structureId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.structureId)       return show('Please select a structure', 'error');
    if (!form.conditionObserved) return show('Please select a condition', 'error');
    if (!form.description.trim()) return show('Please add a description', 'error');

    setLoading(true);
    try {
      const { data } = await api.post('/reports', form);
      if (data.success) {
        setSubmitted(data);
        show(`Report submitted! +${data.pointsAwarded} eco points earned 🌱`, 'success');
      }
    } catch (err) {
      show(err.response?.data?.message || 'Failed to submit report', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div>
        <div className="page-header"><h1>📋 Submit Report</h1></div>
        <div className="page-content">
          <div style={{ maxWidth: 520, margin: '2rem auto', textAlign: 'center' }}>
            <div className="card" style={{ padding: '3rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'float 3s ease-in-out infinite' }}>💧</div>
              <h2 style={{ color: 'var(--color-emerald)', marginBottom: '0.5rem' }}>Report Submitted!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Thank you for contributing to HydroNet. Your report will be reviewed by a municipal officer.
              </p>
              <div style={{
                background: 'var(--color-teal-glow)', border: '1px solid rgba(14,165,233,0.2)',
                borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '2rem',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-teal)' }}>
                  +{submitted.pointsAwarded}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Eco Points Earned</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  New total: <strong style={{ color: 'var(--text-primary)' }}>{submitted.newEcoScore} pts</strong>
                  {' · '}<strong style={{ color: 'var(--color-teal)' }}>{submitted.newRank}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => { setSubmitted(null); setForm({ structureId: '', conditionObserved: '', severity: 'medium', description: '' }); }}>
                  Submit Another
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/my-reports')}>
                  View My Reports →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>📋 Submit a Report</h1>
        <p>Report the condition of a rainwater harvesting structure and earn eco points</p>
      </div>
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Step 1: Select structure */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'var(--color-teal)', color: 'white', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>1</span>
                Select Structure
              </h3>
              {loadingS ? (
                <div className="loading-center" style={{ minHeight: 80 }}><div className="spinner" /></div>
              ) : (
                <select value={form.structureId} onChange={e => setForm({ ...form, structureId: e.target.value })} required>
                  <option value="">-- Choose a harvesting structure --</option>
                  {structures.map(s => (
                    <option key={s._id} value={s._id}>
                      {TYPE_ICONS[s.type]} {s.name} ({s.location?.district || s.location?.city || 'Unknown location'})
                    </option>
                  ))}
                </select>
              )}
              {selectedStructure && (
                <div style={{
                  marginTop: '0.75rem', background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-md)', padding: '0.75rem',
                  fontSize: '0.85rem', color: 'var(--text-secondary)',
                }}>
                  📍 {selectedStructure.location?.address || selectedStructure.location?.district}
                  {' · '} {TYPE_LABELS[selectedStructure.type]}
                </div>
              )}
            </div>

            {/* Step 2: Condition */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'var(--color-teal)', color: 'white', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>2</span>
                What did you observe?
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {CONDITIONS.map(c => (
                  <div
                    key={c.value}
                    onClick={() => setForm({ ...form, conditionObserved: c.value })}
                    style={{
                      padding: '0.85rem',
                      border: `1px solid ${form.conditionObserved === c.value ? 'var(--color-teal)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: form.conditionObserved === c.value ? 'var(--color-teal-glow)' : 'var(--color-surface-2)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.2rem' }}>{c.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.desc}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-teal)', marginTop: '0.3rem', fontWeight: 600 }}>+{c.points} pts</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Severity */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'var(--color-teal)', color: 'white', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>3</span>
                Severity Level
              </h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {SEVERITIES.map(s => (
                  <button
                    key={s.value} type="button"
                    onClick={() => setForm({ ...form, severity: s.value })}
                    style={{
                      flex: 1, padding: '0.65rem',
                      border: `1px solid ${form.severity === s.value ? s.color : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: form.severity === s.value ? `${s.color}20` : 'var(--color-surface-2)',
                      color: form.severity === s.value ? s.color : 'var(--text-secondary)',
                      fontWeight: 600, fontSize: '0.85rem',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Description */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'var(--color-teal)', color: 'white', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>4</span>
                Describe what you saw
              </h3>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Be as specific as possible. E.g. 'The inlet pipe has a large crack and water is leaking. The storage tank appears empty despite recent rainfall.'"
                rows={4}
                required
                style={{ resize: 'vertical' }}
              />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                💡 More detail = more helpful for maintenance crews
              </div>
            </div>

            {/* Step 5: Photos */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'var(--color-teal)', color: 'white', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>5</span>
                Add Photos
              </h3>
              <ImageUploader
                onUpload={(urls) => setForm(prev => ({ ...prev, images: urls.map(url => ({ url })) }))}
                maxFiles={3}
                label="Attach up to 3 photos of the structure"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ padding: '1rem', fontSize: '1rem' }}>
              {loading ? '⏳ Submitting...' : '🌱 Submit Report & Earn Points'}
            </button>
          </form>

          {/* Sidebar info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedCondition && (
              <div className="card" style={{ '--accent-color': 'var(--color-teal)' }}>
                <div className="section-title">Points Preview</div>
                <div className="metric-card" style={{ '--accent-color': 'var(--color-teal)', padding: '1rem', background: 'var(--color-teal-glow)', border: '1px solid rgba(14,165,233,0.2)' }}>
                  <div className="metric-value">+{selectedCondition.points}</div>
                  <div className="metric-label">Eco Points for this report</div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="section-title">How it works</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  ['📍', 'Select a nearby structure'],
                  ['👁️', 'Report what you observe'],
                  ['🌱', 'Earn eco points instantly'],
                  ['✅', 'Officers verify your report'],
                  ['🔧', 'Maintenance is scheduled'],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ background: 'var(--color-emerald-dim)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-emerald)', fontWeight: 600, marginBottom: '0.5rem' }}>
                🏆 Ranking System
              </div>
              {[
                ['🌱 Seedling', '0–199 pts'],
                ['🌿 Sapling',  '200–799 pts'],
                ['🛡️ Guardian', '800–1999 pts'],
                ['🏆 Champion', '2000–4999 pts'],
                ['⭐ Legend',   '5000+ pts'],
              ].map(([rank, pts]) => (
                <div key={rank} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.2rem 0', color: 'var(--text-secondary)' }}>
                  <span>{rank}</span>
                  <span>{pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
