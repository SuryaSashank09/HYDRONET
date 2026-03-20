import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../components/Common/Toast';
import { timeAgo, TYPE_ICONS, severityColor } from '../utils/helpers';

export default function ValidationPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('pending');
  const [acting,  setActing]  = useState(null);
  const { show } = useToast();

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/reports', { params: { status: filter, limit: 50 } });
      setReports(data.data || []);
    } catch (err) {
      show('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validate = async (reportId, status, notes = '') => {
    setActing(reportId);
    try {
      await api.patch(`/reports/${reportId}/validate`, { validationStatus: status, adminNotes: notes });
      show(
        status === 'verified' ? '✅ Report verified & structure updated!' : '❌ Report rejected',
        status === 'verified' ? 'success' : 'info'
      );
      setReports(prev => prev.filter(r => r._id !== reportId));
    } catch (err) {
      show('Action failed', 'error');
    } finally {
      setActing(null);
    }
  };

  const conditionIcon = {
    functional:     '✅', needs_repair: '🔧', non_functional: '❌',
    blocked_inlet:  '🚫', overflow: '🌊',    contaminated:   '⚠️', other: '📝',
  };

  return (
    <div>
      <div className="page-header">
        <h1>✅ Report Validation</h1>
        <p>Review and verify citizen reports to update structure statuses</p>
      </div>

      <div className="page-content">
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['pending', 'verified', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="btn btn-sm"
              style={{
                background: filter === s ? 'var(--color-teal-glow)' : 'var(--color-surface)',
                border: `1px solid ${filter === s ? 'var(--color-teal)' : 'var(--color-border)'}`,
                color: filter === s ? 'var(--color-teal)' : 'var(--text-secondary)',
                textTransform: 'capitalize',
              }}
            >
              {s === 'pending' && '⏳ '}
              {s === 'verified' && '✅ '}
              {s === 'rejected' && '❌ '}
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {filter === 'pending' ? '🎉' : '📭'}
            </div>
            <h3>{filter === 'pending' ? 'All caught up!' : 'No reports here'}</h3>
            <p>{filter === 'pending' ? 'No pending reports to review.' : `No ${filter} reports found.`}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.map(r => (
              <div key={r._id} className="card animate-fade-up">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.6rem' }}>{conditionIcon[r.conditionObserved]}</span>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
                          {r.structure?.name || 'Unknown Structure'}
                          {' '}
                          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                            {TYPE_ICONS[r.structure?.type]} {r.structure?.location?.district}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Reported by <strong style={{ color: 'var(--text-primary)' }}>{r.reporter?.name}</strong>
                          {' '}<span style={{ color: 'var(--text-muted)' }}>{r.reporter?.rank}</span>
                          {' · '}{timeAgo(r.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.75rem',
                        borderRadius: '100px', background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)', color: 'var(--text-secondary)',
                        textTransform: 'capitalize',
                      }}>
                        {r.conditionObserved?.replace(/_/g, ' ')}
                      </span>
                      <span style={{
                        fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.75rem',
                        borderRadius: '100px',
                        background: `${severityColor[r.severity]}20`,
                        color: severityColor[r.severity],
                        border: `1px solid ${severityColor[r.severity]}40`,
                      }}>
                        {r.severity} severity
                      </span>
                    </div>

                    {/* Description */}
                    <div style={{
                      background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem', fontSize: '0.88rem', color: 'var(--text-secondary)',
                      borderLeft: `3px solid ${severityColor[r.severity]}`,
                    }}>
                      "{r.description}"
                    </div>

                    {r.adminNotes && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Admin note: {r.adminNotes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {filter === 'pending' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 140 }}>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => validate(r._id, 'verified')}
                        disabled={acting === r._id}
                        style={{ justifyContent: 'center' }}
                      >
                        {acting === r._id ? '⏳' : '✅ Verify'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => validate(r._id, 'rejected', 'Does not match on-ground conditions')}
                        disabled={acting === r._id}
                        style={{ justifyContent: 'center' }}
                      >
                        ❌ Reject
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => validate(r._id, 'duplicate')}
                        disabled={acting === r._id}
                        style={{ justifyContent: 'center' }}
                      >
                        🔄 Duplicate
                      </button>
                    </div>
                  )}
                  {filter !== 'pending' && (
                    <span className={`badge ${r.validationStatus === 'verified' ? 'badge-verified' : 'badge-rejected'}`}>
                      {r.validationStatus}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
