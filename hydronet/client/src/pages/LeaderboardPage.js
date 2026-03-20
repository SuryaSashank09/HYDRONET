import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { RANK_ICONS, RANK_COLORS, formatNumber } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/leaderboard', { params: { limit: 50 } })
      .then(({ data }) => setLeaders(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const topThree = leaders.slice(0, 3);
  const rest     = leaders.slice(3);
  const podiumOrder = topThree.length >= 3 ? [topThree[1], topThree[0], topThree[2]] : topThree;

  return (
    <div>
      <div className="page-header">
        <h1>🏆 Eco-Contributors Leaderboard</h1>
        <p>Top citizens driving water conservation through community reporting</p>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            {/* Podium */}
            {topThree.length >= 3 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginBottom: '2.5rem', padding: '2rem 0' }}>
                {podiumOrder.map((leader, idx) => {
                  const rank = leader === topThree[0] ? 1 : leader === topThree[1] ? 2 : 3;
                  const heights = { 1: 140, 2: 110, 3: 90 };
                  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
                  const initials = leader.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

                  return (
                    <div key={leader._id} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontSize: '1.75rem' }}>{medals[rank]}</div>
                      <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${RANK_COLORS[leader.rank] || '#0ea5e9'}, #0ea5e9)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', fontWeight: 700, color: 'white',
                        boxShadow: `0 4px 20px ${RANK_COLORS[leader.rank]}60`,
                        animation: rank === 1 ? 'float 3s ease-in-out infinite' : 'none',
                        border: `2px solid ${RANK_COLORS[leader.rank] || '#0ea5e9'}`,
                      }}>{initials}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>{leader.name}</div>
                      <div style={{ fontSize: '0.75rem', color: RANK_COLORS[leader.rank] }}>
                        {RANK_ICONS[leader.rank]} {leader.rank}
                      </div>
                      <div style={{
                        width: 100, height: heights[rank],
                        background: `linear-gradient(180deg, ${RANK_COLORS[leader.rank]}30, ${RANK_COLORS[leader.rank]}10)`,
                        border: `1px solid ${RANK_COLORS[leader.rank]}40`,
                        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                        padding: '0.5rem',
                      }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: RANK_COLORS[leader.rank] }}>
                          {formatNumber(leader.ecoScore)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full table */}
            <div className="card">
              <div className="section-title">Full Rankings</div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Contributor</th>
                    <th>Rank</th>
                    <th>Eco Score</th>
                    <th>Reports</th>
                    <th>Badges</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((leader, i) => {
                    const isMe = user?._id === leader._id?.toString();
                    const initials = leader.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                    return (
                      <tr key={leader._id} style={{ background: isMe ? 'var(--color-teal-glow)' : 'transparent' }}>
                        <td>
                          <span style={{
                            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem',
                            color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : 'var(--text-muted)',
                          }}>
                            {i < 3 ? ['🥇','🥈','🥉'][i] : `${i + 1}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                              background: `linear-gradient(135deg, ${RANK_COLORS[leader.rank] || '#0ea5e9'}, #0ea5e9)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.78rem', fontWeight: 700, color: 'white',
                            }}>{initials}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                {leader.name}
                                {isMe && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: 'var(--color-teal)', fontWeight: 700 }}>YOU</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: RANK_COLORS[leader.rank], fontSize: '0.85rem', fontWeight: 600 }}>
                            {RANK_ICONS[leader.rank]} {leader.rank}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--color-teal)' }}>
                            {formatNumber(leader.ecoScore)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                          📋 {leader.reportsCount}
                        </td>
                        <td style={{ fontSize: '1rem', letterSpacing: '0.05em' }}>
                          {leader.badges?.slice(0, 3).map(b => b.icon).join(' ') || '—'}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {leader.location?.city || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
