import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../utils/api';
import { formatNumber } from '../utils/helpers';

export default function ImpactPage() {
  const [impact,  setImpact]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/water-impact')
      .then(({ data }) => setImpact(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  if (!impact)  return null;

  const radialData = [
    { name: 'Harvest',  value: impact.totalHarvestM3,  fill: 'var(--color-teal)' },
    { name: 'Recharge', value: impact.totalRechargeM3,  fill: 'var(--color-emerald)' },
  ];

  // Simulated 12-month rainfall vs harvest data
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const rainfallPattern = [10,8,12,15,30,90,140,120,100,40,20,12];
  const monthlyData = months.map((m, i) => ({
    month: m,
    rainfall: rainfallPattern[i],
    harvest:  Math.round(rainfallPattern[i] * (impact.totalHarvestM3 / rainfallPattern.reduce((a,b)=>a+b,0))),
    recharge: Math.round(rainfallPattern[i] * (impact.totalRechargeM3 / rainfallPattern.reduce((a,b)=>a+b,0))),
  }));

  return (
    <div>
      <div className="page-header">
        <h1>🌍 Water Impact</h1>
        <p>Predictive analytics — groundwater recharge and conservation outcomes</p>
      </div>

      <div className="page-content">
        {/* Hero impact numbers */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(16,185,129,0.08))',
          border: '1px solid rgba(14,165,233,0.2)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-teal)', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Estimated Annual Impact
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', maxWidth: 700, margin: '0 auto' }}>
            {[
              { label: 'Water Harvested', value: `${formatNumber(impact.totalHarvestM3)} m³`, icon: '💧', color: 'var(--color-teal)' },
              { label: 'Groundwater Recharged', value: `${formatNumber(impact.totalRechargeM3)} m³`, icon: '⬇️', color: 'var(--color-emerald)' },
              { label: 'Families Supported', value: formatNumber(impact.familiesSupported), icon: '👨‍👩‍👧', color: 'var(--color-violet)' },
            ].map(({ label, value, icon, color }) => (
              <div key={label}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color, marginBottom: '0.25rem' }}>{value}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Monthly chart */}
          <div className="card">
            <div className="section-title">Monthly Harvest & Recharge Estimate</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="gradHarvest"  x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRecharge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.08)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                <Area type="monotone" dataKey="harvest"  stroke="#0ea5e9" fill="url(#gradHarvest)"  name="Harvest m³" strokeWidth={2} />
                <Area type="monotone" dataKey="recharge" stroke="#10b981" fill="url(#gradRecharge)" name="Recharge m³" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 12, height: 3, background: '#0ea5e9', borderRadius: 2 }} /> Water Harvest
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 12, height: 3, background: '#10b981', borderRadius: 2 }} /> Groundwater Recharge
              </div>
            </div>
          </div>

          {/* Environmental equivalents */}
          <div className="card">
            <div className="section-title">Environmental Equivalents</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: '🌲', label: 'Trees equivalent', value: formatNumber(impact.treesEquivalent), desc: 'in CO₂ absorption', color: 'var(--color-emerald)' },
                { icon: '🏭', label: 'CO₂ Offset',       value: `${formatNumber(impact.co2SavedKg)} kg`, desc: 'avoided emissions', color: 'var(--color-teal)' },
                { icon: '🚿', label: 'Showers saved',     value: formatNumber(Math.round(impact.totalHarvestM3 * 1000 / 60)), desc: 'at 60L per shower', color: 'var(--color-violet)' },
                { icon: '🏊', label: 'Olympic pools',     value: (impact.totalHarvestM3 / 2500).toFixed(1), desc: '2500 m³ per pool', color: 'var(--color-amber)' },
              ].map(({ icon, label, value, desc, color }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem',
                }}>
                  <span style={{ fontSize: '1.75rem' }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color }}>{value}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label} · {desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Methodology note */}
        <div className="card" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>📐</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-violet)' }}>
                Predictive Model Methodology
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Estimates use average annual rainfall of <strong>600mm</strong> for Hyderabad, 
                with <strong>80% runoff efficiency</strong> for rooftop systems and <strong>60% groundwater conversion rate</strong>. 
                CO₂ offsets calculated at 0.35 kg per m³ of water saved from extraction. 
                These are conservative estimates — actual impact may be higher with proper maintenance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
