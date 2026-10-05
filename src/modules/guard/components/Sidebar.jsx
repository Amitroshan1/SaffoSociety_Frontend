import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { roleTitle } from '@/auth/roles';
import { useTenant } from '@/hooks/useTenant';
import { GUARD_PROFILE_EVENT, getGuardProfile } from '@/modules/guard/services/guard/guard.service';
import { mediaUrl } from '@/modules/guard/services/core/http';
import { GUARD_ROUTES } from '@/modules/guard/constants/guardRoutes.js';
import {
  closeGuardMobileNav,
  isGuardMobileNavOpen,
  subscribeGuardMobileNav,
} from '@/modules/guard/utils/guardMobileNav.js';
import '@/modules/guard/styles/core/guard-main.css';

const COLLAPSE_KEY = 'guard-sidebar-collapsed';

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard', icon: 'dashboard' },
      {
        label: 'Gate Operations',
        icon: 'gate',
        children: [
          { key: 'Visitors', label: 'Visitors' },
          { key: 'Deliveries', label: 'Deliveries' },
          { key: 'Staff Entry', label: 'Staff Entry' },
          { key: 'Cab Entry', label: 'Cab Entry' },
        ],
      },
      { label: 'SOS Alerts', icon: 'shield' },
      { label: 'My Schedule', icon: 'door' },
    ],
  },
  {
    label: 'Modules',
    items: [
      { label: 'Bookings', icon: 'scroll' },
      { label: 'Parking', icon: 'car' },
      { label: 'Documents', icon: 'scroll' },
      { label: 'My Profile', icon: 'users' },
    ],
  },
];

function Icon({ name }) {
  const icons = {
    dashboard: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
    users: (
      <>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </>
    ),
    car: (
      <>
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </>
    ),
    door: (
      <>
        <path d="M4 12h16" />
        <path d="M10 6l-6 6 6 6" />
        <path d="M14 18l6-6-6-6" />
      </>
    ),
    scroll: (
      <>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </>
    ),
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    gate: (
      <>
        <path d="M4 21V5" />
        <path d="M20 21V5" />
        <rect x="4" y="9" width="16" height="4" rx="1" />
        <path d="M2 21h20" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

function CollapseIcon({ collapsed }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {collapsed ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="M14 9l3 3-3 3" />
        </>
      ) : (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="M16 15l-3-3 3-3" />
        </>
      )}
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`gm-nav-chevron${open ? ' is-open' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function groupContains(item, key) {
  return Boolean(item.children?.some((c) => c.key === key));
}

function initials(name = '') {
  return (
    name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'G'
  );
}

export default function Sidebar({ activePage, onNavigate }) {
  const { user } = useAuth();
  const { societyName } = useTenant();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getGuardProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {});
    function onProfile() {
      getGuardProfile().then((p) => setProfile(p)).catch(() => {});
    }
    window.addEventListener(GUARD_PROFILE_EVENT, onProfile);
    return () => {
      cancelled = true;
      window.removeEventListener(GUARD_PROFILE_EVENT, onProfile);
    };
  }, []);
  const [localActive, setActive] = useState('Dashboard');
  const active = activePage || localActive;
  // Explicit user toggles; untouched groups follow whether they contain the active page.
  const [groupToggles, setGroupToggles] = useState({});
  const [mobileOpen, setMobileOpen] = useState(() => isGuardMobileNavOpen());
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => subscribeGuardMobileNav(setMobileOpen), []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') closeGuardMobileNav();
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Drawer always shows labels on phone/tablet
  const showLabels = !collapsed || mobileOpen;

  function handleClick(label) {
    setActive(label);
    closeGuardMobileNav();
    if (onNavigate) onNavigate(label);
  }

  return (
    <>
      <div
        className={`gm-sidebar-backdrop${mobileOpen ? ' gm-sidebar-backdrop--open' : ''}`}
        onClick={closeGuardMobileNav}
        aria-hidden={!mobileOpen}
      />
      <aside
        className={`gm-sidebar${collapsed && !mobileOpen ? ' gm-sidebar--collapsed' : ''}${
          mobileOpen ? ' gm-sidebar--mobile-open' : ''
        }`}
      >
        <div className="gm-sidebar-top">
          <div className="gm-sidebar-logo">
            <div className="gm-sidebar-logo-icon">
              <img
                src="/logo.png"
                alt="Saffo Society"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {showLabels ? (
              <div className="gm-sidebar-logo-text">
                <div className="gm-sidebar-society-name">{societyName || 'Saffo Society'}</div>
                <div className="gm-sidebar-society-sub">Guard Panel</div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="gm-sidebar-collapse-btn gm-sidebar-collapse-btn--desktop"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>

          <button
            type="button"
            className="gm-sidebar-close-mobile"
            onClick={closeGuardMobileNav}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="gm-sidebar-nav">
          {NAV_GROUPS.map((group) => {
            const items = group.items
              .map((item) => {
                if (!item.children) return item;
                return item.children.length ? item : null;
              })
              .filter(Boolean);
            if (!items.length) return null;
            return (
            <div key={group.label} className="gm-nav-group">
              {showLabels ? <div className="gm-nav-group-label">{group.label}</div> : null}
              {items.map((item) => {
                if (item.children) {
                  const inGroup = groupContains(item, active);
                  const expanded = groupToggles[item.label] ?? inGroup;
                  const open = expanded && showLabels;
                  const subId = `gm-subnav-${item.label.replace(/\s+/g, '-').toLowerCase()}`;
                  return (
                    <div key={item.label} className="gm-nav-parent-wrap">
                      <button
                        type="button"
                        className={`gm-nav-btn gm-nav-parent${
                          inGroup ? (showLabels ? ' gm-nav-parent--active' : ' active') : ''
                        }`}
                        onClick={() => {
                          if (!showLabels) {
                            handleClick(item.children[0].key);
                            return;
                          }
                          setGroupToggles((prev) => ({ ...prev, [item.label]: !expanded }));
                        }}
                        aria-expanded={showLabels ? open : undefined}
                        aria-controls={showLabels ? subId : undefined}
                        title={item.label}
                      >
                        <Icon name={item.icon} />
                        {showLabels ? (
                          <>
                            <span className="gm-nav-btn-label">{item.label}</span>
                            <ChevronIcon open={open} />
                          </>
                        ) : null}
                      </button>
                      {open ? (
                        <div id={subId} className="gm-subnav" role="group" aria-label={item.label}>
                          {item.children.map((child) => {
                            const wired = Boolean(GUARD_ROUTES[child.key]);
                            const isActive = active === child.key;
                            return (
                              <button
                                key={child.key}
                                type="button"
                                className={`gm-subnav-btn${isActive ? ' active' : ''}`}
                                onClick={() => wired && handleClick(child.key)}
                                disabled={!wired}
                                aria-current={isActive ? 'page' : undefined}
                              >
                                {child.label}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                }
                const wired = Boolean(GUARD_ROUTES[item.label]);
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`gm-nav-btn ${active === item.label ? 'active' : ''}`}
                    onClick={() => wired && handleClick(item.label)}
                    disabled={!wired}
                    title={item.label}
                  >
                    <Icon name={item.icon} />
                    {showLabels ? <span className="gm-nav-btn-label">{item.label}</span> : null}
                  </button>
                );
              })}
            </div>
            );
          })}
        </nav>

        <div className="gm-sidebar-profile">
          <div className="gm-sidebar-profile-inner" title={user?.name || profile?.name || 'Guard'}>
            <div className="gm-profile-avatar" style={{ overflow: 'hidden' }}>
              {mediaUrl(profile?.photoUrl) ? (
                <img src={mediaUrl(profile.photoUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials(user?.name || profile?.name)
              )}
            </div>
            {showLabels ? (
              <div className="gm-profile-meta">
                <div className="gm-profile-name">{user?.name || profile?.name || 'Guard'}</div>
                <div className="gm-profile-role">{roleTitle(user?.role) || 'Guard'}</div>
                <div className="gm-profile-status">
                  <span className="gm-status-dot" />
                  <span className="gm-status-label">Online</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
