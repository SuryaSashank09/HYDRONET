import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RANK_ICONS, RANK_COLORS } from '../../utils/helpers';

const NavItem = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
  >
    <span className="nav-icon">{icon}</span>
    <span className="nav-label">{label}</span>
  </NavLink>
);

export default function Sidebar() {
  const { user, logout, isAdmin, isOfficer } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const close = () => setOpen(false);

  const initials = user?.name
    ?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', top: '1rem', left: '1rem', zIndex: 300,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '0.5rem 0.65rem', cursor: 'pointer',
          color: 'var(--text-primary)', fontSize: '1.1rem',
          display: 'none',
        }}
        className="hamburger-btn"
      >
        {open ? '✕' : '☰'}
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          onClick={close}
          className="sidebar-backdrop"
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.65)', zIndex: 99,
            backdropFilter: 'blur(3px)', display: 'none',
          }}
        />
      )}

      <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">💧</div>
          <div>
            <h2>HydroNet</h2>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '-2px' }}>BitBusters</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div className="nav-section">Explore</div>
          <NavItem to="/map"         icon="🗺️"  label="Live Map"     onClick={close} />
          <NavItem to="/structures"  icon="🏗️"  label="Structures"   onClick={close} />
          <NavItem to="/leaderboard" icon="🏆"  label="Leaderboard"  onClick={close} />
          <NavItem to="/impact"      icon="🌍"  label="Water Impact"  onClick={close} />

          <div className="nav-section">Actions</div>
          <NavItem to="/report"      icon="📋"  label="Submit Report" onClick={close} />
          <NavItem to="/my-reports"  icon="📌"  label="My Reports"    onClick={close} />
          <NavItem to="/profile"     icon="👤"  label="My Profile"    onClick={close} />

          {isOfficer && (
            <>
              <div className="nav-section">Management</div>
              <NavItem to="/dashboard"    icon="📊" label="Dashboard"        onClick={close} />
              <NavItem to="/validation"   icon="✅" label="Validate Reports"  onClick={close} />
              {isAdmin && <NavItem to="/add-structure" icon="➕" label="Add Structure" onClick={close} />}
            </>
          )}
        </div>

        {/* User footer */}
        <div className="sidebar-bottom">
          {user && (
            <NavLink to="/profile" onClick={close} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="user-chip">
                <div className="avatar"
                  style={{ background: `linear-gradient(135deg, ${RANK_COLORS[user.rank] || '#0ea5e9'}, #0ea5e9)` }}
                >
                  {initials}
                </div>
                <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </div>
                  <div className="role">{RANK_ICONS[user.rank]} {user.rank} · {user.ecoScore} pts</div>
                </div>
              </div>
            </NavLink>
          )}
          <button onClick={handleLogout} className="btn btn-secondary btn-full btn-sm" style={{ marginTop: '0.5rem' }}>
            🚪 Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
