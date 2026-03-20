import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import {
  STATUS_LABELS, STATUS_BADGE, STATUS_DOT,
  TYPE_ICONS, TYPE_LABELS,
  formatNumber, formatDate, timeAgo, severityColor,
} from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Common/Toast';

function InfoRow({ label, value, accent }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.65rem 0', borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: accent || 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export default function StructureDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { isOfficer, isAdmin } = useAuth();
  const { show }  = useToast();

  const [structure, setStructure] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [updating,  setUpdating]  = useState(false);
  const [tab,       setTab]       = useState('overview'); // overview | reports | map

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const { data } = await api.get(`/structures/${id}`);
      setStructure(data.data);
    } catch {
      show('Structure not found', 'error');
      navigate('/structures');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.put(`/structures/${id}`, { status: newStatus });
      setStructure(prev => ({ ...prev, status: newStatus }));
      show(`Status updated to "${STATUS_LABELS[newStatus]}"`, 'success');
    } catch {
      show('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleVerify = async () => {
    setUpdating(true);
    try {
      await api.patch(`/structures/${id}/verify`);
      setStructure(prev => ({ ...prev, isVerified: true }));
      show('Structure verified ✅', 'success');
    } catch {
      show('Failed to verify', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="loading-center" style={{ minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );
  if (!structure) return null;

  const [lng, lat] = structure.location?.coordinates || [78.39, 17.44];
  const badgeClass = STATUS_BADGE[structure.status] || 'badge-maintenance';
  const statusColor = STATUS_DOT[structure.status];

  const reports = structure.reports || [];
  const verifiedReports = reports.filter(r => r.validationStatus === 'verified');

  const TABS = ['overview', 'reports', 'map'];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(-1)}
          style={{ marginBottom: '0.75rem' }}
        >
          ← Back
        </button>

        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 'var(--radius-md)',
              background: `${statusColor}20`, border: `2px solid ${statusColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
              flexShrink: 0,
            }}>
              {TYPE_ICONS[structure.type]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: 0 }}>{structure.name}</h1>
                {structure.isVerified && (
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem',
                    borderRadius: '100px', background: 'var(--color-emerald-dim)',
                    color: 'var(--color-emerald)', border: '1px solid rgba(16,185,129,0.25)',
                  }}>✓ VERIFIED</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                <span className={`badge ${badgeClass}`}>{STATUS_LABELS[structure.status]}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {TYPE_LABELS[structure.type]}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  📍 {structure.location?.district}{structure.location?.city ? `, ${structure.location.city}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/report?structureId=${structure._id}`)}
            >
              📋 Report Issue
            </button>
            {isOfficer && (
              <>
                {!structure.isVerified && (
                  <button className="btn btn-success btn-sm" onClick={handleVerify} disabled={updating}>
                    ✅ Verify
                  </button>
                )}
                <select
                  value={structure.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  disabled={updating}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', width: 'auto' }}
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginTop: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '0.6rem 1.25rem', border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize',
                color: tab === t ? 'var(--color-teal)' : 'var(--text-muted)',
                borderBottom: tab === t ? '2px solid var(--color-teal)' : '2px solid transparent',
                marginBottom: '-1px', transition: 'color 0.15s',
              }}
            >
              {t === 'overview' ? '📊 Overview' : t === 'reports' ? `📋 Reports (${reports.length})` : '🗺️ Map'}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Key metrics */}
              <div className="grid-2" style={{ gap: '0.75rem' }}>
                {[
                  { label: 'Storage Capacity', value: structure.capacityLitres ? `${formatNumber(structure.capacityLitres)} L` : '—', accent: 'var(--color-teal)', icon: '💧' },
                  { label: 'Catchment Area', value: structure.catchmentAreaSqM ? `${formatNumber(structure.catchmentAreaSqM)} m²` : '—', accent: 'var(--color-violet)', icon: '📐' },
                  { label: 'Annual Recharge Est.', value: structure.annualRechargeEstimateLitres ? `${formatNumber(structure.annualRechargeEstimateLitres)} L` : '—', accent: 'var(--color-emerald)', icon: '⬇️' },
                  { label: 'Water Saved', value: structure.waterSavedLitres ? `${formatNumber(structure.waterSavedLitres)} L` : '—', accent: 'var(--color-amber)', icon: '🌊' },
                ].map(({ label, value, accent, icon }) => (
                  <div key={label} className="metric-card" style={{ '--accent-color': accent, padding: '1rem' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{icon}</div>
                    <div className="metric-value" style={{ fontSize: '1.4rem' }}>{value}</div>
                    <div className="metric-label">{label}</div>
                  </div>
                ))}
              </div>

              {/* Details */}
              <div className="card">
                <div className="section-title">Structure Details</div>
                <InfoRow label="Type"             value={TYPE_LABELS[structure.type]} />
                <InfoRow label="Status"           value={STATUS_LABELS[structure.status]} accent={statusColor} />
                <InfoRow label="Year Installed"   value={structure.yearInstalled || '—'} />
                <InfoRow label="Last Maintenance" value={formatDate(structure.lastMaintenanceDate)} />
                <InfoRow label="Next Maintenance" value={formatDate(structure.nextMaintenanceDate)} />
                <InfoRow label="Added By"         value={structure.addedBy?.name || '—'} />
                <InfoRow label="Added On"         value={formatDate(structure.createdAt)} />
                <InfoRow label="Verified"         value={structure.isVerified ? '✅ Yes' : '⏳ Pending'} accent={structure.isVerified ? 'var(--color-emerald)' : 'var(--color-amber)'} />
                <InfoRow label="Total Reports"    value={reports.length} />
                <InfoRow label="Verified Reports" value={verifiedReports.length} />
              </div>

              {/* Location */}
              <div className="card">
                <div className="section-title">Location</div>
                <InfoRow label="Address"  value={structure.location?.address  || '—'} />
                <InfoRow label="District" value={structure.location?.district || '—'} />
                <InfoRow label="City"     value={structure.location?.city     || '—'} />
                <InfoRow label="Pincode"  value={structure.location?.pincode  || '—'} />
                <InfoRow label="Lat/Lng"  value={`${lat.toFixed(5)}, ${lng.toFixed(5)}`} />
              </div>

              {/* Tags */}
              {structure.tags?.length > 0 && (
                <div className="card">
                  <div className="section-title">Tags</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {structure.tags.map(tag => (
                      <span key={tag} style={{
                        padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.78rem',
                        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                        color: 'var(--text-secondary)',
                      }}>#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {structure.notes && (
                <div className="card">
                  <div className="section-title">Notes</div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {structure.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Right column — mini map + recent activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Mini map */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <MapContainer
                  center={[lat, lng]}
                  zoom={15}
                  style={{ height: 240, width: '100%' }}
                  zoomControl={false}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                  />
                  <CircleMarker
                    center={[lat, lng]}
                    radius={14}
                    pathOptions={{ color: statusColor, fillColor: statusColor, fillOpacity: 0.85, weight: 3 }}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
                        <strong>{structure.name}</strong>
                        <br />{TYPE_LABELS[structure.type]}
                      </div>
                    </Popup>
                  </CircleMarker>
                </MapContainer>
                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)' }}>
                  <button className="btn btn-secondary btn-sm btn-full" onClick={() => setTab('map')}>
                    🗺️ Open Full Map View
                  </button>
                </div>
              </div>

              {/* Health snapshot */}
              <div className="card">
                <div className="section-title">Health Snapshot</div>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '1rem 0', gap: '0.5rem',
                }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    border: `4px solid ${statusColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem',
                    background: `${statusColor}15`,
                    boxShadow: `0 0 24px ${statusColor}30`,
                  }}>
                    {structure.status === 'functional' ? '✅' :
                     structure.status === 'needs_repair' ? '🔧' :
                     structure.status === 'non_functional' ? '❌' : '🔄'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: statusColor }}>
                    {STATUS_LABELS[structure.status]}
                  </div>
                  {reports.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Based on {reports.length} citizen report{reports.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Progress bars for report types */}
                {reports.length > 0 && (() => {
                  const breakdown = reports.reduce((acc, r) => {
                    acc[r.conditionObserved] = (acc[r.conditionObserved] || 0) + 1;
                    return acc;
                  }, {});
                  return (
                    <div style={{ marginTop: '0.5rem' }}>
                      {Object.entries(breakdown).map(([cond, count]) => (
                        <div key={cond} style={{ marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                            <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{cond.replace(/_/g, ' ')}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{count}</span>
                          </div>
                          <div style={{ height: 4, background: 'var(--color-surface-2)', borderRadius: 2 }}>
                            <div style={{
                              height: '100%', borderRadius: 2,
                              width: `${(count / reports.length) * 100}%`,
                              background: 'var(--color-teal)',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Quick action */}
              <div className="card" style={{
                background: 'linear-gradient(135deg, var(--color-teal-glow), var(--color-emerald-dim))',
                border: '1px solid rgba(14,165,233,0.2)',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💧</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Spotted something?
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Report the current condition of this structure and earn eco points.
                </div>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => navigate(`/report?structureId=${structure._id}`)}
                >
                  📋 Submit Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {tab === 'reports' && (
          <div>
            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h3>No reports yet</h3>
                <p style={{ marginBottom: '1.5rem' }}>Be the first to report on this structure.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/report?structureId=${structure._id}`)}
                >
                  Submit First Report
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reports.map(r => {
                  const condIcon = {
                    functional: '✅', needs_repair: '🔧', non_functional: '❌',
                    blocked_inlet: '🚫', overflow: '🌊', contaminated: '⚠️', other: '📝',
                  };
                  const vStatus = r.validationStatus || 'pending';
                  const vBadge  = {
                    pending:   { class: 'badge-pending',   label: '⏳ Pending' },
                    verified:  { class: 'badge-verified',  label: '✅ Verified' },
                    rejected:  { class: 'badge-rejected',  label: '❌ Rejected' },
                    duplicate: { class: 'badge-repair',    label: '🔄 Duplicate' },
                  }[vStatus];

                  return (
                    <div key={r._id} className="card animate-fade-up" style={{ padding: '1rem 1.25rem' }}>
                      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>
                            {condIcon[r.conditionObserved] || '📝'}
                          </span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize' }}>
                                {r.conditionObserved?.replace(/_/g, ' ')}
                              </span>
                              <span className={`badge ${vBadge?.class}`} style={{ fontSize: '0.7rem' }}>
                                {vBadge?.label}
                              </span>
                              <span style={{
                                fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '100px',
                                background: `${severityColor[r.severity]}20`, color: severityColor[r.severity],
                                fontWeight: 600,
                              }}>
                                {r.severity}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                              By <strong style={{ color: 'var(--text-primary)' }}>{r.reporter?.name || 'Anonymous'}</strong>
                              {r.reporter?.rank && (
                                <span style={{ color: 'var(--text-muted)' }}> · {r.reporter.rank}</span>
                              )}
                              {' · '}<span style={{ color: 'var(--text-muted)' }}>{timeAgo(r.createdAt)}</span>
                            </div>
                            {r.description && (
                              <div style={{
                                fontSize: '0.82rem', color: 'var(--text-muted)',
                                fontStyle: 'italic', lineHeight: 1.5,
                              }}>
                                "{r.description}"
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--color-teal)' }}>
                            +{r.pointsAwarded || 0}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>pts</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MAP TAB ── */}
        {tab === 'map' && (
          <div style={{ height: 'calc(100vh - 280px)', minHeight: 400, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <MapContainer
              center={[lat, lng]}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; CARTO'
              />
              <CircleMarker
                center={[lat, lng]}
                radius={18}
                pathOptions={{ color: statusColor, fillColor: statusColor, fillOpacity: 0.85, weight: 3 }}
              >
                <Popup>
                  <div style={{ fontFamily: 'var(--font-body)', minWidth: 180 }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>{TYPE_ICONS[structure.type]}</div>
                    <strong style={{ fontSize: '0.95rem' }}>{structure.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                      {TYPE_LABELS[structure.type]}
                    </div>
                    <div style={{ marginTop: '0.4rem' }}>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem' }}>
                        {STATUS_LABELS[structure.status]}
                      </span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}
