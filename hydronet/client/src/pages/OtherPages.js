import React, { useState, useEffect } from 'react';
import { useNavigate }  from 'react-router-dom';
import api from '../utils/api';
import { timeAgo, severityColor } from '../utils/helpers';
import { useToast } from '../components/Common/Toast';
import ImageUploader from '../components/Common/ImageUploader';

export function MyReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/reports', { params: { limit: 50 } })
      .then(({ data }) => setReports(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const validationBadge = {
    pending:   { class: 'badge-pending',   label: '⏳ Pending' },
    verified:  { class: 'badge-verified',  label: '✅ Verified' },
    rejected:  { class: 'badge-rejected',  label: '❌ Rejected' },
    duplicate: { class: 'badge-repair',    label: '🔄 Duplicate' },
  };

  const totalPoints = reports.filter(r => r.validationStatus === 'verified').reduce((acc, r) => acc + (r.pointsAwarded || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>📌 My Reports</h1>
            <p>Your citizen reporting history</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/report')}>+ New Report</button>
        </div>
      </div>

      <div className="page-content">
        {/* Summary row */}
        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          <div className="metric-card" style={{ '--accent-color': 'var(--color-teal)' }}>
            <div className="metric-value">{reports.length}</div>
            <div className="metric-label">Total Reports</div>
          </div>
          <div className="metric-card" style={{ '--accent-color': 'var(--color-emerald)' }}>
            <div className="metric-value">{reports.filter(r => r.validationStatus === 'verified').length}</div>
            <div className="metric-label">Verified</div>
          </div>
          <div className="metric-card" style={{ '--accent-color': 'var(--color-amber)' }}>
            <div className="metric-value">{totalPoints}</div>
            <div className="metric-label">Points Earned</div>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h3>No reports yet</h3>
            <p style={{ marginBottom: '1.5rem' }}>Be the first to report a structure in your area!</p>
            <button className="btn btn-primary" onClick={() => navigate('/report')}>Submit First Report</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reports.map(r => {
              const vb = validationBadge[r.validationStatus] || validationBadge.pending;
              return (
                <div key={r._id} className="card" style={{ padding: '1rem 1.25rem' }}>
                  <div className="flex-between">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{r.structure?.name || 'Unknown Structure'}</span>
                        <span className={`badge ${vb.class}`}>{vb.label}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        <span style={{ textTransform: 'capitalize', color: severityColor[r.severity] }}>● {r.severity}</span>
                        {' · '}
                        <span style={{ textTransform: 'capitalize' }}>{r.conditionObserved?.replace(/_/g, ' ')}</span>
                        {' · '}{timeAgo(r.createdAt)}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        "{r.description?.substring(0, 100)}{r.description?.length > 100 ? '...' : ''}"
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', paddingLeft: '1rem' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-teal)' }}>
                        +{r.pointsAwarded}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>eco pts</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function AddStructurePage() {
  const [form, setForm] = useState({
    name: '', type: 'rooftop_tank', status: 'functional',
    lat: '', lng: '', address: '', district: '', city: '', pincode: '',
    capacityLitres: '', catchmentAreaSqM: '', yearInstalled: '', notes: '', tags: '',
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const { show } = useToast();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lat || !form.lng) return show('Coordinates are required', 'error');
    setLoading(true);
    try {
      const payload = {
        name: form.name, type: form.type, status: form.status, notes: form.notes,
        location: {
          type: 'Point',
          coordinates: [parseFloat(form.lng), parseFloat(form.lat)],
          address: form.address, district: form.district, city: form.city, pincode: form.pincode,
        },
        capacityLitres:    form.capacityLitres    ? parseInt(form.capacityLitres)    : 0,
        catchmentAreaSqM:  form.catchmentAreaSqM  ? parseInt(form.catchmentAreaSqM)  : 0,
        yearInstalled:     form.yearInstalled      ? parseInt(form.yearInstalled)      : undefined,
        tags:    form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        images:  form.images.map(url => ({ url, uploadedAt: new Date() })),
      };
      await api.post('/structures', payload);
      show('Structure added successfully! 🏗️', 'success');
      navigate('/structures');
    } catch (err) {
      show(err.response?.data?.message || 'Failed to add structure', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>➕ Add Structure</h1>
        <p>Register a new rainwater harvesting structure to the network</p>
      </div>
      <div className="page-content">
        <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Basic Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Structure Name *</label>
                <input value={form.name} onChange={set('name')} placeholder="E.g. Jubilee Hills Rooftop Tank" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select value={form.type} onChange={set('type')}>
                    <option value="rooftop_tank">Rooftop Tank</option>
                    <option value="check_dam">Check Dam</option>
                    <option value="percolation_pit">Percolation Pit</option>
                    <option value="recharge_well">Recharge Well</option>
                    <option value="pond">Pond</option>
                    <option value="sump">Sump</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Current Status</label>
                  <select value={form.status} onChange={set('status')}>
                    <option value="functional">Functional</option>
                    <option value="needs_repair">Needs Repair</option>
                    <option value="non_functional">Non-Functional</option>
                    <option value="under_maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Location</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude *</label>
                  <input type="number" step="any" value={form.lat} onChange={set('lat')} placeholder="17.4319" required />
                </div>
                <div className="form-group">
                  <label>Longitude *</label>
                  <input type="number" step="any" value={form.lng} onChange={set('lng')} placeholder="78.4082" required />
                </div>
              </div>
              <div className="form-group">
                <label>Street Address</label>
                <input value={form.address} onChange={set('address')} placeholder="Road No. 36, near lake..." />
              </div>
              <div className="form-row">
                <div className="form-group"><label>District</label><input value={form.district} onChange={set('district')} placeholder="Jubilee Hills" /></div>
                <div className="form-group"><label>City</label><input value={form.city} onChange={set('city')} placeholder="Hyderabad" /></div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Technical Specs</h3>
            <div className="form-row" style={{ gap: '1rem' }}>
              <div className="form-group"><label>Capacity (Litres)</label><input type="number" value={form.capacityLitres} onChange={set('capacityLitres')} placeholder="50000" /></div>
              <div className="form-group"><label>Catchment Area (m²)</label><input type="number" value={form.catchmentAreaSqM} onChange={set('catchmentAreaSqM')} placeholder="400" /></div>
              <div className="form-group"><label>Year Installed</label><input type="number" value={form.yearInstalled} onChange={set('yearInstalled')} placeholder="2020" /></div>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Tags (comma separated)</label>
              <input value={form.tags} onChange={set('tags')} placeholder="residential, rooftop, govt" />
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Notes</label>
              <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Any additional information about this structure..." />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <ImageUploader
                onUpload={(urls) => setForm(prev => ({ ...prev, images: urls }))}
                maxFiles={4}
                label="Structure Photos"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/structures')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Adding...' : '➕ Add Structure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
