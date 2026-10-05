// Header with live clock, notification bell, and profile dropdown.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { roleTitle } from '@/auth/roles';
import { useTenant } from '@/hooks/useTenant';
import {
  GUARD_PROFILE_EVENT,
  getGuardProfile,
  getUnreadNotificationCount,
} from '@/modules/guard/services/guard/guard.service';
import { mediaUrl } from '@/modules/guard/services/core/http';
import { toggleGuardMobileNav } from '@/modules/guard/utils/guardMobileNav.js';
import '@/modules/guard/styles/core/guard-main.css';

export default function DashboardHeader() {
  const [time, setTime] = useState(new Date());
  const [dropdownOpen, setDropdown] = useState(false);
  const [profile, setProfile] = useState(null);
  const [unread, setUnread] = useState(0);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { societyName } = useTenant();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, count] = await Promise.all([
          getGuardProfile(),
          getUnreadNotificationCount(),
        ]);
        if (!cancelled) {
          setProfile(p);
          setUnread(count);
        }
      } catch {
        if (!cancelled && user) {
          setProfile({
            name: user.name || 'Guard',
            initials: (user.name || 'G').slice(0, 2).toUpperCase(),
            role: roleTitle(user.role) || 'Guard',
            assignedGate: null,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    function onProfile() {
      getGuardProfile()
        .then((p) => setProfile(p))
        .catch(() => {});
    }
    window.addEventListener(GUARD_PROFILE_EVENT, onProfile);
    return () => window.removeEventListener(GUARD_PROFILE_EVENT, onProfile);
  }, []);

  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  async function handleLogout() {
    setDropdown(false);
    await logout();
    navigate('/login', { replace: true });
  }

  const displayName = user?.name || profile?.name || 'Guard';
  const initials = (user?.name || profile?.name || displayName).slice(0, 2).toUpperCase();
  const roleLabel = roleTitle(user?.role) || profile?.designation || profile?.role || 'Guard';
  const gateLabel = [societyName, profile?.gateName || profile?.assignedGate].filter(Boolean).join(' · ') || roleLabel;
  const photoSrc = mediaUrl(profile?.photoUrl);

  return (
    <header className="gm-header">
      <div className="gm-header-left">
        <button
          type="button"
          className="gm-menu-btn"
          onClick={toggleGuardMobileNav}
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
      </div>

      <div className="gm-clock">
        <div>
          <div className="gm-clock-time">
            {time.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
          <div className="gm-clock-date">
            {time.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>

      <div className="gm-header-right">
        <div className="gm-profile-dropdown-wrap" ref={dropdownRef}>
          <button
            className="gm-header-profile-btn"
            onClick={() => setDropdown((v) => !v)}
            aria-label="Profile menu"
          >
            <div style={{ textAlign: 'right' }}>
              <div className="gm-header-guard-name">{displayName}</div>
              <div className="gm-header-guard-shift">
                {gateLabel}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    width: 12,
                    height: 12,
                    transition: 'transform 0.2s',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            <div className="gm-header-avatar" style={{ overflow: 'hidden' }}>
              {photoSrc ? (
                <img src={photoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
          </button>

          {dropdownOpen && (
            <div className="gm-profile-dropdown">
              <div className="gm-dropdown-user">
                <div className="gm-dropdown-avatar" style={{ overflow: 'hidden' }}>
                  {photoSrc ? (
                    <img src={photoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <div className="gm-dropdown-name">{displayName}</div>
                  <div className="gm-dropdown-role">
                    {roleLabel}
                    {profile?.phone ? ` • ${profile.phone}` : ''}
                  </div>
                </div>
              </div>

              <div className="gm-dropdown-divider" />

              <button
                type="button"
                className="gm-dropdown-item"
                onClick={() => {
                  setDropdown(false);
                  navigate('/guard/profile');
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                My Profile
              </button>

              <button
                type="button"
                className="gm-dropdown-item"
                onClick={() => {
                  setDropdown(false);
                  navigate('/guard/schedule');
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                My Schedule
              </button>

              <div className="gm-dropdown-divider" />

              <button
                type="button"
                className="gm-dropdown-item gm-dropdown-item-danger"
                onClick={handleLogout}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="gm-bell-btn"
          aria-label="Notifications"
          onClick={() => navigate('/guard/notifications')}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {unread > 0 ? (
            <span className="gm-bell-badge">{unread > 9 ? '9+' : unread}</span>
          ) : null}
        </button>
      </div>
    </header>
  );
}
