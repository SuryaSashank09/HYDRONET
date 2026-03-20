import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { RANK_ICONS, RANK_COLORS, formatNumber, formatDate, timeAgo } from '../utils/helpers';
import { useToast } from '../components/Common/Toast';

const RANK_ORDER  = ['Seedling', 'Sapling', 'Guardian', 'Champion', 'Legend'];
const RANK_THRESH = [0, 200, 800, 2000, 5000];

function RankProgressBar({ score, rank }) {
  const idx     = RANK_ORDER.indexOf(rank);
  const current = RANK_THRESH[idx] || 0;
  const next    = RANK_THRESH[idx + 1];
  const pct     = next ? Math.min(((score - current) / (next - current)) * 100, 100) : 100;
  const nextRank = RANK_ORDER[idx + 1];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
        <span style={{ color: RANK_COLORS[rank], fontWeight: 700 }}>
          {RANK_ICONS[rank]} {rank}
        </span>
        {nextRank ? (
          <span style={{ color: 'var(--text-muted)' }}>
            {next - score} pts to {RANK_ICONS[nextRank]} {nextRank}
          </span>
        ) : (
          <span style={{ color: 'var(--color-amber)' }}>⭐ Max Rank!</span>
        )}
      </div>
      <div style={{ height: 8, background: 'var(--color-surface-2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${RANK_COLORS[rank]}, ${RANK_COLORS[nextRank] || RANK_COLORS[rank]})`,
          borderRadius: 4, transition: 'width 1s ease',
        }} />
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
        {Math.round(pct)}% to next rank
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { show }         = useToast();
  const navigate         = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullUser, setFullUser] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/auth/me'),
      api.get('/reports', { params: { limit: 100 } }),
    ]).then(([me, rep]) => {
      setFullUser(me.data.user);
      setReports(rep.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const u = fullUser || user;
  if (!u) return null;

  const verifiedCount   = reports.filter(r => r.validationStatus === 'verified').length;
  const pendingCount    = reports.filter(r => r.validationStatus === 'pending').length;
  const totalPts        = reports.filter(r => r.validationStatus === 'verified').reduce((acc, r) => acc + (r.pointsAwarded || 0), 0);
  const initials        = u.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const rankColor       = RANK_COLORS[u.rank] || 'var(--color-teal)';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <div className="page-header">
        <h1>👤 My Profile</h1>
        <p>Your HydroNet contributor profile and impact stats</p>
      </div>

      <div className="page-content">
        <div className="grid-2" style={{ alignItems: 'start', gap: '1.5rem' }}>
          {/* Left — profile card + rank */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Hero card */}
            <div className="card" style={{
              background: `linear-gradient(135deg, ${rankColor}15, rgba(14,165,233,0.08))`,
              border: `1px solid ${rankColor}30`,
              padding: '2rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${rankColor}, #0ea5e9)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', fontWeight: 700, color: 'white',
                  boxShadow: `0 8px 24px ${rankColor}40`,
                  flexShrink: 0,
                }}>{initials}</div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>{u.name}</h2>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'capitalize', marginBottom: '0.35rem' }}>
                    {u.role?.replace('_', ' ')}
                    {u.location?.city && ` · ${u.location.city}`}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: rankColor, fontWeight: 700, fontSize: '0.88rem' }}>
                      {RANK_ICONS[u.rank]} {u.rank}
                    </span>
                  </div>
                </div>
              </div>

              {/* Eco score big display */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 800,
                  color: rankColor, lineHeight: 1,
                }}>
                  {formatNumber(u.ecoScore || 0)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  Total Eco Points
                </div>
              </div>

              {/* Rank progress */}
              <RankProgressBar score={u.ecoScore || 0} rank={u.rank || 'Seedling'} />
            </div>

            {/* Quick stats */}
            <div className="grid-2" style={{ gap: '0.75rem' }}>
              {[
                { label: 'Reports Submitted', value: u.reportsCount || reports.length, icon: '📋', accent: 'var(--color-teal)' },
                { label: 'Verified Reports',  value: verifiedCount,                   icon: '✅', accent: 'var(--color-emerald)' },
                { label: 'Pending Review',    value: pendingCount,                    icon: '⏳', accent: 'var(--color-amber)' },
                { label: 'Points Earned',     value: formatNumber(totalPts),          icon: '⭐', accent: 'var(--color-violet)' },
              ].map(({ label, value, icon, accent }) => (
                <div key={label} className="metric-card" style={{ '--accent-color': accent, padding: '1rem' }}>
                  <div style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>{icon}</div>
                  <div className="metric-value" style={{ fontSize: '1.5rem' }}>{value}</div>
                  <div className="metric-label" style={{ fontSize: '0.75rem' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Account info */}
            <div className="card">
              <div className="section-title">Account</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  ['Email',    u.email],
                  ['Role',     u.role?.replace('_', ' ')],
                  ['City',     u.location?.city    || '—'],
                  ['District', u.location?.district || '—'],
                  ['Member Since', formatDate(u.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0',
                    borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem',
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, textTransform: 'capitalize' }}>{value}</span>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleLogout}
                style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>

          {/* Right — badges + recent reports */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Badges */}
            <div className="card">
              <div className="section-title">Badges Earned</div>
              {!u.badges?.length ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏅</div>
                  <div style={{ fontSize: '0.85rem' }}>Submit reports to earn badges!</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {u.badges.map((badge, i) => (
                    <div key={i} style={{
                      textAlign: 'center', padding: '1rem 0.5rem',
                      background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{badge.icon}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                        {badge.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {formatDate(badge.awardedAt)}
                      </div>
                    </div>
                  ))}
                  {/* Locked badges */}
                  {[
                    { name: 'First Drop',     icon: '💧', threshold: 1  },
                    { name: 'Rain Watcher',   icon: '🌧️', threshold: 10 },
                    { name: 'Hydro Hero',     icon: '🏆', threshold: 50 },
                    { name: 'Water Champion', icon: '🌊', threshold: null },
                  ].filter(b => !u.badges.find(ub => ub.name === b.name)).map((badge, i) => (
                    <div key={`locked-${i}`} style={{
                      textAlign: 'center', padding: '1rem 0.5rem',
                      background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)', opacity: 0.4,
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.4rem', filter: 'grayscale(1)' }}>{badge.icon}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
                        {badge.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {badge.threshold ? `${badge.threshold} reports needed` : '1000 pts needed'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent reports */}
            <div className="card">
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <div className="section-title" style={{ marginBottom: 0 }}>Recent Reports</div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/my-reports')}>
                  View All →
                </button>
              </div>
              {loading ? (
                <div className="loading-center" style={{ minHeight: 100 }}><div className="spinner" /></div>
              ) : reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <div>No reports yet.</div>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/report')}>
                    Submit First Report
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {reports.slice(0, 5).map(r => {
                    const vColors = {
                      verified: 'var(--color-emerald)', pending: 'var(--color-amber)',
                      rejected: 'var(--color-rose)',    duplicate: 'var(--color-violet)',
                    };
                    return (
                      <div key={r._id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.65rem 0.85rem', background: 'var(--color-surface-2)',
                        borderRadius: 'var(--radius-md)', fontSize: '0.82rem',
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>
                            {r.structure?.name || 'Unknown'}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {timeAgo(r.createdAt)} · {r.conditionObserved?.replace(/_/g, ' ')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: vColors[r.validationStatus] || 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                            {r.validationStatus}
                          </div>
                          <div style={{ color: 'var(--color-teal)', fontWeight: 700 }}>+{r.pointsAwarded || 0}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rank roadmap */}
            <div className="card">
              <div className="section-title">Rank Roadmap</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {RANK_ORDER.map((rank, i) => {
                  const isCurrentRank = rank === u.rank;
                  const isPassed      = RANK_THRESH[i] <= (u.ecoScore || 0) && !isCurrentRank;
                  const color         = RANK_COLORS[rank];
                  return (
                    <div key={rank} style={{
                      display: 'flex', alignItems: 'center', gap: '0.85rem',
                      padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)',
                      background: isCurrentRank ? `${color}15` : 'transparent',
                      border: isCurrentRank ? `1px solid ${color}30` : '1px solid transparent',
                    }}>
                      <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{RANK_ICONS[rank]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem',
                          color: isCurrentRank ? color : isPassed ? 'var(--text-secondary)' : 'var(--text-muted)',
                        }}>
                          {rank}
                          {isCurrentRank && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color }}>← YOU ARE HERE</span>}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {RANK_THRESH[i].toLocaleString()} pts
                        </div>
                      </div>
                      {isPassed && <span style={{ color: 'var(--color-emerald)', fontSize: '0.8rem' }}>✅</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
