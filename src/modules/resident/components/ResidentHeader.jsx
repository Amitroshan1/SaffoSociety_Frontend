import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { titleForPath } from '@/modules/resident/components/residentSections';
import { useResidentPageTitle } from '@/modules/resident/components/residentPageTitle';
import { getGateUnreadCount } from '@/modules/resident/services/notification.service';

export default function ResidentHeader({ onMenu, name }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout: signOut } = useAuth();
  const { title } = useResidentPageTitle();
  const pageTitle = title || titleForPath(pathname);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let live = true;
    getGateUnreadCount().then((count) => {
      if (live) setUnread(count);
    });
    function refresh() {
      getGateUnreadCount().then((count) => setUnread(count));
    }
    window.addEventListener('resident-notes-changed', refresh);
    return () => {
      live = false;
      window.removeEventListener('resident-notes-changed', refresh);
    };
  }, []);

  async function logout() {
    try {
      await signOut();
    } catch {
      /* still leave the panel */
    }
    navigate('/login', { replace: true });
  }

  const initials = String(name || 'R').slice(0, 2).toUpperCase();

  return (
    <header className="gm-header">
      <div className="gm-header-left">
        <button type="button" className="gm-menu-btn" onClick={onMenu} aria-label="Open menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
        <h1 className="res-header-title">{pageTitle}</h1>
      </div>
      <div className="gm-header-right res-header-tools">
        <button
          type="button"
          className={`res-icon-btn${pathname.startsWith('/resident/notifications') ? ' is-on' : ''}`}
          onClick={() => navigate('/resident/notifications')}
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          aria-current={pathname.startsWith('/resident/notifications') ? 'page' : undefined}
          title="Notifications"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16h12l-1-2V10a5 5 0 0 0-10 0v4zM10 18a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
          {unread ? <span className="res-count">{unread}</span> : null}
        </button>
        <div className="gm-profile-dropdown-wrap">
          <button
            type="button"
            className="gm-header-profile-btn res-identity"
            onClick={() => setOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`Account menu for ${name || 'Resident'}`}
          >
            <div className="res-identity-text">
              <div className="gm-header-guard-name">{name || 'Resident'}</div>
              <div className="gm-header-guard-shift">A-101</div>
            </div>
            <div className="gm-header-avatar">{initials}</div>
          </button>
          {open ? (
            <div className="gm-profile-dropdown">
              <button
                type="button"
                className="gm-dropdown-item"
                onClick={() => {
                  setOpen(false);
                  navigate('/resident/profile');
                }}
              >
                My Profile
              </button>
              <button type="button" className="gm-dropdown-item" onClick={logout}>
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
