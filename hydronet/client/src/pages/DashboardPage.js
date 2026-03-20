import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '../utils/api';
import { STATUS_LABELS, formatNumber, timeAgo } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const COLORS = { functional: '#10b981', needs_repair: '#f59e0b', non_functional: '#f43f5e', under_maintenance: '#8b5cf6' };

function MetricCard({ label, value, unit = '', accent, icon, sub }) {
  return (
    <div className="metric-card" style={{ '--accent-color': accent }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <div>
          <div className="metric-value">{value}<span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '0.25rem' }}>{unit}</span></div>
          <div className="metric-label">{label}</div>
          {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
        </div>
        <span style={{ fontSize: '1.8rem', opacity: 0.6 }}>{icon}</span>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
      <div style={{ fontFamily: 'var(--font-display)', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontWeight: 700, fontSize: '0.9rem' }}>{p.value} reports</div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [impact,   setImpact]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/overview'),
      api.get('/dashboard/water-impact'),
    ]).then(([ov, im]) => {
      setOverview(ov.data.data);
      setImpact(im.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  if (!overview) return null;

  const { structures, reports, users, waterImpact, reportTrend } = overview;

  const statusPieData = [
    { name: 'Functional',    value: structures.functional,       color: COLORS.functional },
    { name: 'Needs Repair',  value: structures.needsRepair,      color: COLORS.needs_repair },
    { name: 'Non-Functional',value: structures.nonFunctional,    color: COLORS.non_functional },
    { name: 'Maintenance',   value: structures.underMaintenance, color: COLORS.under_maintenance },
  ].filter(d => d.value > 0);

  const trendData = reportTrend.map(r => ({
    date:  r._id.substring(5), // MM-DD
    count: r.count,
  }));

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>📊 Dashboard</h1>
            <p>Real-time water infrastructure intelligence</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/validation')}>
              {reports.pending > 0 && (
                <span style={{ background: 'var(--color-rose)', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', marginRight: '0.25rem' }}>
                  {reports.pending}
                </span>
              )}
              Validate Reports
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/add-structure')}>+ Add Structure</button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* KPI row */}
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          <MetricCard label="Total Structures"  value={structures.total}   accent="var(--color-teal)"    icon="🏗️"  sub={`${structures.coveragePercent}% coverage`} />
          <MetricCard label="Functional"         value={structures.functional}  accent="var(--color-emerald)" icon="✅" sub={`${Math.round(structures.functional/structures.total*100)||0}% of total`} />
          <MetricCard label="Pending Reports"    value={reports.pending}    accent="var(--color-amber)"   icon="📋" sub="Awaiting verification" />
          <MetricCard label="Eco-Contributors"   value={formatNumber(users.total)} accent="var(--color-violet)" icon="👥" sub="Registered users" />
        </div>

        {/* Water impact row */}
        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          <MetricCard label="Total Capacity"     value={formatNumber(Math.round(waterImpact.totalCapacityM3))}   unit="m³" accent="var(--color-teal)"    icon="💧" />
          <MetricCard label="Water Saved"        value={formatNumber(Math.round(waterImpact.totalWaterSavedM3))} unit="m³" accent="var(--color-emerald)" icon="🌊" />
          <MetricCard label="Ground Recharge"    value={formatNumber(Math.round(waterImpact.totalRechargeM3))}   unit="m³" accent="var(--color-violet)"  icon="⬇️" sub="Est. annual" />
        </div>

        {/* Charts row */}
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Report trend */}
          <div className="card">
            <div className="section-title">7-Day Report Activity</div>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.08)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="var(--color-teal)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No report activity in the last 7 days
              </div>
            )}
          </div>

          {/* Status breakdown pie */}
          <div className="card">
            <div className="section-title">Structure Status Breakdown</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {statusPieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pending reports table */}
        {reports.recentPending?.length > 0 && (
          <div className="card">
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Pending Verifications</div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/validation')}>View All →</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Structure</th>
                    <th>Reporter</th>
                    <th>Condition</th>
                    <th>Severity</th>
                    <th>Reported</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.recentPending.map(r => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.structure?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.structure?.location?.district}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.88rem' }}>{r.reporter?.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.reporter?.rank}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>
                          {r.conditionObserved?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '100px',
                          background: r.severity === 'critical' ? 'var(--color-rose-dim)' : r.severity === 'high' ? 'rgba(249,115,22,0.15)' : 'var(--color-amber-dim)',
                          color: r.severity === 'critical' ? 'var(--color-rose)' : r.severity === 'high' ? '#f97316' : 'var(--color-amber)',
                        }}>
                          {r.severity}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{timeAgo(r.createdAt)}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/validation')}>Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Impact stats from predictive engine */}
        {impact && (
          <div className="card" style={{ marginTop: '1.25rem', background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(16,185,129,0.08))', border: '1px solid rgba(14,165,233,0.2)' }}>
            <div className="section-title">🌍 Predictive Water Impact Engine</div>
            <div className="grid-4">
              {[
                { label: 'Annual Harvest Est.', value: `${formatNumber(impact.totalHarvestM3)} m³`, icon: '💧' },
                { label: 'Groundwater Recharge', value: `${formatNumber(impact.totalRechargeM3)} m³`, icon: '⬇️' },
                { label: 'CO₂ Offset', value: `${formatNumber(impact.co2SavedKg)} kg`, icon: '🌿' },
                { label: 'Families Supported', value: formatNumber(impact.familiesSupported), icon: '👨‍👩‍👧' },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-teal)', marginBottom: '0.2rem' }}>{value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
