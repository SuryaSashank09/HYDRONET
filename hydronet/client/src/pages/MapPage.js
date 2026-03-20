import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import { STATUS_LABELS, TYPE_ICONS, TYPE_LABELS, STATUS_DOT, formatNumber, timeAgo } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = STATUS_DOT;

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 13); }, [center, map]);
  return null;
}

function MapStats({ structures }) {
  const counts = structures.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});
  return (
    <div style={{
      position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000,
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
      backdropFilter: 'blur(12px)', minWidth: 180,
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
        Live Overview
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[key], flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: STATUS_COLORS[key] }}>
              {counts[key] || 0}
            </span>
          </div>
        ))}
        <div className="divider" style={{ margin: '0.25rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-teal)' }}>
            {structures.length}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ status: '', type: '' });
  const [selected, setSelected]     = useState(null);
  const [center]                    = useState([17.44, 78.39]); // Hyderabad
  const navigate                    = useNavigate();

  useEffect(() => { loadStructures(); }, [filters]);

  const loadStructures = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.type)   params.type   = filters.type;
      const { data } = await api.get('/structures', { params });
      setStructures(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = structures.filter(s => {
    const [lng, lat] = s.location.coordinates;
    return lat && lng;
  });

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>🗺️ Live Rainwater Map</h1>
            <p>Real-time monitoring of {structures.length} harvesting structures across Hyderabad</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              style={{ width: 160, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select
              value={filters.type}
              onChange={e => setFilters({ ...filters, type: e.target.value })}
              style={{ width: 160, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
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
        </div>
      </div>

      <div style={{ position: 'relative', height: 'calc(100vh - 140px)' }}>
        <MapContainer
          center={[center[0], center[1]]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <RecenterMap center={center} />

          {filtered.map(s => {
            const [lng, lat] = s.location.coordinates;
            const color = STATUS_COLORS[s.status] || '#94a3b8';
            return (
              <CircleMarker
                key={s._id}
                center={[lat, lng]}
                radius={s.capacityLitres > 100000 ? 14 : s.capacityLitres > 10000 ? 10 : 7}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.8,
                  weight: 2,
                  opacity: 1,
                }}
                eventHandlers={{ click: () => setSelected(s) }}
              >
                <Popup>
                  <div style={{ minWidth: 220, fontFamily: 'var(--font-body)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{TYPE_ICONS[s.type]}</span>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{TYPE_LABELS[s.type]}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span className={`badge badge-${s.status === 'functional' ? 'functional' : s.status === 'needs_repair' ? 'repair' : s.status === 'non_functional' ? 'nonfunctional' : 'maintenance'}`}>
                        {STATUS_LABELS[s.status]}
                      </span>
                      {s.isVerified && <span style={{ fontSize: '0.75rem', color: 'var(--color-emerald)' }}>✓ Verified</span>}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      📍 {s.location.address || s.location.district}
                    </div>
                    {s.capacityLitres > 0 && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        💧 Capacity: {formatNumber(s.capacityLitres)}L
                      </div>
                    )}
                    <button
                      className="btn btn-primary btn-sm btn-full"
                      onClick={() => navigate(`/structures/${s._id}`)}
                    >
                      View Details →
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Overlay stats */}
        <MapStats structures={filtered} />

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: '1.5rem', left: '1rem', zIndex: 1000,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
          display: 'flex', gap: '1rem', fontSize: '0.78rem',
        }}>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[k] }} />
              <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
            </div>
          ))}
        </div>

        {loading && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 999, background: 'var(--color-surface)', padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="spinner" />
              <span>Loading structures...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
