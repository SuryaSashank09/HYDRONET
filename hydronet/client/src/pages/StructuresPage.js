import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { STATUS_LABELS, STATUS_BADGE, TYPE_ICONS, TYPE_LABELS, formatNumber, formatDate } from '../utils/helpers';

function StructureCard({ s, onClick }) {
  const [lng, lat] = s.location?.coordinates || [0, 0];
  const badgeClass = STATUS_BADGE[s.status] || 'badge-maintenance';

  return (
    <div
      className="card"
      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{TYPE_ICONS[s.type]}</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3 }}>
              {s.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{TYPE_LABELS[s.type]}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
          <span className={`badge ${badgeClass}`}>{STATUS_LABELS[s.status]}</span>
          {s.isVerified && <span style={{ fontSize: '0.7rem', color: 'var(--color-emerald)' }}>✓ Verified</span>}
        </div>
      </div>

      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
        📍 {s.location?.district ? `${s.location.district}, ` : ''}{s.location?.city || 'Location N/A'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {s.capacityLitres > 0 && (
          <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Capacity</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-teal)' }}>
              {formatNumber(s.capacityLitres)}L
            </div>
          </div>
        )}
        {s.annualRechargeEstimateLitres > 0 && (
          <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Annual Recharge</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-emerald)' }}>
              {formatNumber(s.annualRechargeEstimateLitres)}L
            </div>
          </div>
        )}
      </div>

      {s.reports?.length > 0 && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          📋 {s.reports.length} citizen report{s.reports.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default function StructuresPage() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ status: '', type: '', search: '' });
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await api.get('/structures', { params: { limit: 200 } });
      setStructures(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayed = structures.filter(s => {
    const matchStatus = !filters.status || s.status === filters.status;
    const matchType   = !filters.type   || s.type   === filters.type;
    const matchSearch = !filters.search ||
      s.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.location?.city?.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.location?.district?.toLowerCase().includes(filters.search.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  const statusCounts = structures.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {});

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>🏗️ Structures</h1>
            <p>{structures.length} harvesting structures indexed in the network</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/add-structure')}>
            + Add Structure
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Quick filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {['', ...Object.keys(STATUS_LABELS)].map(s => (
            <button
              key={s}
              onClick={() => setFilters({ ...filters, status: s })}
              className="btn btn-sm"
              style={{
                background: filters.status === s ? 'var(--color-teal-glow)' : 'var(--color-surface)',
                border: `1px solid ${filters.status === s ? 'var(--color-teal)' : 'var(--color-border)'}`,
                color: filters.status === s ? 'var(--color-teal)' : 'var(--text-secondary)',
              }}
            >
              {s ? STATUS_LABELS[s] : 'All'}
              <span style={{ marginLeft: '0.35rem', opacity: 0.7 }}>
                {s ? (statusCounts[s] || 0) : structures.length}
              </span>
            </button>
          ))}
        </div>

        {/* Search + type filter */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="🔍  Search by name, city, district..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            style={{ flex: 1 }}
          />
          <select
            value={filters.type}
            onChange={e => setFilters({ ...filters, type: e.target.value })}
            style={{ width: 180 }}
          >
            <option value="">All Types</option>
            <option value="rooftop_tank">Rooftop Tank</option>
            <option value="check_dam">Check Dam</option>
            <option value="percolation_pit">Percolation Pit</option>
            <option value="recharge_well">Recharge Well</option>
            <option value="pond">Pond</option>
            <option value="sump">Sump</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3>No structures found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid-3" style={{ gap: '1rem' }}>
            {displayed.map(s => (
              <StructureCard key={s._id} s={s} onClick={() => navigate(`/structures/${s._id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
