import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Archive,
  BarChart3,
  Bell,
  CalendarCheck,
  Car,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Dumbbell,
  DoorOpen,
  FileCheck,
  FolderOpen,
  Home,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Mail,
  MailOpen,
  Megaphone,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Search,
  Settings,
  SlidersHorizontal,
  User,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../../components/common/ThemeToggle';
import '../../styles/resident/resident.css';
import '../../styles/admin/AdminDashboard.css';
import '../../styles/common/crud.css';
import '../../styles/glassmorphism.css';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/resident/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/resident/profile', label: 'My Profile', icon: User },
      { to: '/resident/household', label: 'My Household', icon: Users },
      { to: '/resident/flat', label: 'My Flat', icon: Home },
    ],
  },
  {
    label: 'Visitors',
    items: [
      { to: '/resident/visitors', label: 'Visitors', icon: UserCheck },
      { to: '/resident/visitor-invitations', label: 'Invitations', icon: Mail },
      { to: '/resident/visitor-history', label: 'Visitor History', icon: ClipboardList },
    ],
  },
  {
    label: 'Notices',
    items: [
      { to: '/resident/notices', label: 'Notices', icon: Bell, end: true },
      { to: '/resident/notices/pinned', label: 'Pinned Notices', icon: Pin },
      { to: '/resident/notices/unread', label: 'Unread Notices', icon: MailOpen },
      { to: '/resident/notices/archive', label: 'Notice Archive', icon: Archive },
    ],
  },
  {
    label: 'Service',
    items: [{ to: '/resident/complaints', label: 'Complaints', icon: Wrench }],
  },
  {
    label: 'Billing',
    items: [
      { to: '/resident/bills', label: 'Bills', icon: IndianRupee },
      { to: '/resident/outstanding', label: 'Outstanding', icon: Wallet },
      { to: '/resident/payments', label: 'Payments', icon: CreditCard },
      { to: '/resident/receipts', label: 'Receipts', icon: FileCheck },
    ],
  },
  {
    label: 'Facilities',
    items: [
      { to: '/resident/facilities', label: 'Facilities', icon: Dumbbell },
      { to: '/resident/bookings', label: 'My Bookings', icon: CalendarCheck },
    ],
  },
  {
    label: 'Parking',
    items: [
      { to: '/resident/parking', label: 'My Parking', icon: Car },
      { to: '/resident/vehicles', label: 'My Vehicles', icon: DoorOpen },
      { to: '/resident/visitor-parking', label: 'Visitor Parking', icon: Car },
      { to: '/resident/parking-history', label: 'Parking History', icon: ClipboardList },
    ],
  },
  {
    label: 'More',
    items: [
      { to: '/resident/documents', label: 'Documents', icon: FolderOpen },
      { to: '/resident/notifications', label: 'Notifications', icon: Megaphone },
      { to: '/resident/notification-preferences', label: 'Preferences', icon: SlidersHorizontal },
      { to: '/resident/analytics', label: 'My Analytics', icon: BarChart3 },
      { to: '/resident/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label })),
);

const COLLAPSE_KEY = 'resident-sidebar-collapsed';

function matchesPath(item, pathname) {
  return item.end ? pathname === item.to : pathname.startsWith(item.to);
}

function activeGroupLabel(pathname) {
  let best = null;
  NAV_GROUPS.forEach((group) => {
    group.items.forEach((item) => {
      if (!matchesPath(item, pathname)) return;
      if (!best || item.to.length > best.to.length) best = { ...item, group: group.label };
    });
  });
  return best?.group || NAV_GROUPS[0].label;
}

export default function ResidentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === 'true',
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState(() => ({
    [activeGroupLabel(location.pathname)]: true,
  }));

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const group = activeGroupLabel(location.pathname);
    setOpenGroups((prev) => (prev[group] ? prev : { ...prev, [group]: true }));
  }, [location.pathname]);

  // Close mobile drawer on navigation / resize to desktop
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const activeItem = useMemo(() => {
    let best = null;
    ALL_ITEMS.forEach((item) => {
      if (!matchesPath(item, location.pathname)) return;
      if (!best || item.to.length > best.to.length) best = item;
    });
    return best;
  }, [location.pathname]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ALL_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q),
    );
  }, [query]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = (user?.name || 'R')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderLink = (item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        title={collapsed && !mobileOpen ? item.label : undefined}
        className={({ isActive }) => `resident-nav-link${isActive ? ' active' : ''}`}
        onClick={() => setMobileOpen(false)}
      >
        <Icon size={16} strokeWidth={2} className="resident-nav-icon" />
        <span className="resident-nav-text">{item.label}</span>
      </NavLink>
    );
  };

  const shellClass = [
    'resident-shell',
    collapsed ? 'resident-shell--collapsed' : '',
    mobileOpen ? 'resident-shell--mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shellClass}>
      <button
        type="button"
        className="resident-mobile-backdrop"
        aria-label="Close menu"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
      />

      <aside className="resident-sidebar" id="resident-sidebar">
        <div className="resident-sidebar-header">
          <div className="resident-brand">
            <img
              src="/logo.png"
              alt="Saffo Society"
              className="resident-brand-mark"
              style={{ objectFit: 'cover', padding: 0 }}
            />
            <div className="resident-brand-text">
              <h2>Saffo Society</h2>
              <p>{user?.name}</p>
            </div>
          </div>
          <button
            type="button"
            className="resident-collapse-btn resident-collapse-btn--desktop"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
          <button
            type="button"
            className="resident-collapse-btn resident-collapse-btn--mobile"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {(!collapsed || mobileOpen) && (
          <div className="resident-nav-search">
            <Search size={14} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a page…"
              aria-label="Filter navigation"
            />
          </div>
        )}

        <nav className="resident-sidebar-nav">
          {filtered ? (
            <div className="resident-nav-group">
              <span className="resident-nav-label">
                {filtered.length} result{filtered.length === 1 ? '' : 's'}
              </span>
              {filtered.map(renderLink)}
            </div>
          ) : (
            NAV_GROUPS.map((group) => {
              const isOpen = (!collapsed || mobileOpen) && (openGroups[group.label] || false);
              const showToggle = !collapsed || mobileOpen;
              return (
                <div key={group.label} className="resident-nav-group">
                  {showToggle ? (
                    <button
                      type="button"
                      className={`resident-nav-label resident-nav-toggle${isOpen ? ' is-open' : ''}`}
                      onClick={() =>
                        setOpenGroups((prev) => ({ ...prev, [group.label]: !prev[group.label] }))
                      }
                      aria-expanded={isOpen}
                    >
                      {group.label}
                      <ChevronDown size={13} className="resident-nav-chevron" />
                    </button>
                  ) : (
                    <span className="resident-nav-divider" aria-hidden="true" />
                  )}
                  {(collapsed && !mobileOpen) || isOpen
                    ? group.items.map(renderLink)
                    : null}
                </div>
              );
            })
          )}
        </nav>

        <div className="resident-sidebar-footer">
          <button
            type="button"
            className="resident-logout-btn"
            onClick={handleLogout}
            title={collapsed && !mobileOpen ? 'Logout' : undefined}
          >
            <LogOut size={15} />
            <span className="resident-nav-text">Logout</span>
          </button>
        </div>
      </aside>

      <main className="resident-main">
        <header className="resident-header">
          <div className="resident-header-left">
            <button
              type="button"
              className="resident-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-controls="resident-sidebar"
              aria-expanded={mobileOpen}
            >
              <Menu size={18} />
            </button>
            <div className="resident-header-copy">
              <h1 className="resident-header-title">{activeItem?.label || 'Resident Portal'}</h1>
              <p className="resident-header-subtitle">
                Manage your home services and society activities
              </p>
            </div>
          </div>
          <div className="resident-header-user">
            <ThemeToggle />
            <div className="resident-header-avatar" aria-hidden="true">
              {initials}
            </div>
            <div className="resident-header-meta">
              <div className="resident-header-name">{user?.name || 'Resident'}</div>
              <div className="resident-header-role">Resident</div>
            </div>
          </div>
        </header>
        <section className="resident-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
