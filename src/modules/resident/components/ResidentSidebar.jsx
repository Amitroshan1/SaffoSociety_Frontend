import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SECTIONS, sectionFor } from '@/modules/resident/components/residentSections';

const ICONS = {
  dashboard: 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z',
  pending: 'M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01',
  invite: 'M4 6h16v12H4zM4 7l8 6 8-6',
  history: 'M12 7v5l3 2M12 21a9 9 0 1 0-9-9',
  sos: 'M12 4 3 19h18zM12 9v5M12 17h.01',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3zM5 4v16',
  bookings: 'M7 3v3M17 3v3M4 8h16M5 5h14v15H5z',
  parking: 'M6 20V4h7a5 5 0 0 1 0 10H6',
  vehicles: 'M4 15h16l-1.5-5h-13zM6 15v2M18 15v2M7 10h.01M17 10h.01',
  visitor: 'M16 11V7a4 4 0 0 0-8 0v4M5 11h14v9H5z',
  clearance: 'M8 3h6l4 4v14H8zM14 3v4h4M10 13h6M10 17h4',
  profile: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM5 20a7 7 0 0 1 14 0',
};

function NavIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV = [
  { label: 'Dashboard', to: '/resident/dashboard', icon: 'dashboard' },
  { label: 'Visitors', section: 'visitors', icon: 'pending' },
  { label: 'SOS', to: '/resident/sos', icon: 'sos' },
  { label: 'Facilities', section: 'facilities', icon: 'book' },
  { label: 'Parking', to: '/resident/parking', icon: 'parking' },
  { label: 'Move-out Clearance', to: '/resident/clearance', icon: 'clearance' },
  { label: 'My Profile', to: '/resident/profile', icon: 'profile' },
];

export default function ResidentSidebar({ open, onClose, name, societyName }) {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const showLabels = !collapsed || open;
  const currentSection = sectionFor(pathname);
  const initials = String(name || 'R').slice(0, 2).toUpperCase();
  const nav = NAV;

  return (
    <>
      <div
        className={`gm-sidebar-backdrop${open ? ' gm-sidebar-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`gm-sidebar${collapsed && !open ? ' gm-sidebar--collapsed' : ''}${open ? ' gm-sidebar--mobile-open' : ''}`}
      >
        <div className="gm-sidebar-top">
          <div className="gm-sidebar-logo">
            <div className="gm-sidebar-logo-icon">
              <img src="/logo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {showLabels ? (
              <div className="gm-sidebar-logo-text">
                <div className="gm-sidebar-society-name">{societyName || 'Saffo Society'}</div>
                <div className="gm-sidebar-society-sub">Resident Panel</div>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="gm-sidebar-collapse-btn gm-sidebar-collapse-btn--desktop"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '›' : '‹'}
          </button>
          <button type="button" className="gm-sidebar-close-mobile" onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        </div>
        <nav className="gm-sidebar-nav">
          {nav.map((item) => {
            const to = item.section ? SECTIONS[item.section][0].to : item.to;
            const sectionActive = item.section && currentSection === item.section;
            return (
              <NavLink
                key={item.label}
                to={to}
                end={item.to === '/resident/dashboard'}
                className={({ isActive }) => `gm-nav-btn${isActive || sectionActive ? ' active' : ''}`}
                title={item.label}
                onClick={onClose}
                style={{ textDecoration: 'none' }}
              >
                <NavIcon name={item.icon} />
                {showLabels ? <span className="gm-nav-btn-label">{item.label}</span> : null}
              </NavLink>
            );
          })}
        </nav>
        <div className="gm-sidebar-profile res-account">
          <div className="gm-sidebar-profile-inner">
            <div className="gm-profile-avatar">{initials}</div>
            {showLabels ? (
              <div className="gm-profile-meta">
                <div className="gm-profile-name">{name || 'Resident'}</div>
                <div className="gm-profile-role">{societyName || 'Resident'}</div>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
