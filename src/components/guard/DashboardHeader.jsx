// client/src/components/guard/DashboardHeader.jsx
// Header with live clock, search, notification bell,
// theme toggle (dark ↔ light), and profile dropdown.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import {
  getGuardProfile,
  getUnreadNotificationCount,
} from '../../services/guard.service';
import '../../styles/guard/guard-main.css';

export default function DashboardHeader() {
  const [time, setTime]             = useState(new Date());
  const [dropdownOpen, setDropdown] = useState(false);
  const [spinning, setSpinning]     = useState(false);
  const [profile, setProfile]       = useState(null);
  const [unread, setUnread]         = useState(0);
  const { isDark, toggleTheme }     = useTheme();

  const dropdownRef = useRef(null);
  const navigate    = useNavigate();
  const { user, logout } = useAuth();

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
            role: 'Security Guard',
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
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const handleThemeToggle = useCallback(() => {
    setSpinning(true);
    toggleTheme();
    setTimeout(() => setSpinning(false), 420);
  }, [toggleTheme]);

  async function handleLogout() {
    setDropdown(false);
    await logout();
    navigate('/login');
  }

  const displayName = profile?.name || user?.name || 'Guard';
  const initials = profile?.initials || displayName.slice(0, 2).toUpperCase();
  const roleLabel = profile?.role || 'Security Guard';
  const gateLabel = profile?.assignedGate
    ? `Gate ${String(profile.assignedGate).slice(0, 8)}`
    : roleLabel;

  return (
    <header className="gm-header">

      <div className="gm-search-wrap">
        <svg className="gm-search-icon" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          className="gm-search-input"
          placeholder="Search by name, phone, or vehicle number..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              navigate(`/guard/visitors?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
            }
          }}
        />
      </div>

      <div className="gm-clock">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <div>
          <div className="gm-clock-time">
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="gm-clock-date">
            {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="gm-header-right">

        <button
          className={`gm-theme-btn${spinning ? ' spinning' : ''}`}
          onClick={handleThemeToggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <svg
            className="gm-theme-icon-sun"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1"  x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1"  y1="12" x2="3"  y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
          </svg>

          <svg
            className="gm-theme-icon-moon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

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
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{
                    width: 12, height: 12,
                    transition: 'transform 0.2s',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            <div className="gm-header-avatar">{initials}</div>
          </button>

          {dropdownOpen && (
            <div className="gm-profile-dropdown">

              <div className="gm-dropdown-user">
                <div className="gm-dropdown-avatar">{initials}</div>
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
                  navigate('/guard/attendance');
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Clock In / Out
              </button>

              <div className="gm-dropdown-divider" />

              <button type="button" className="gm-dropdown-item gm-dropdown-item-danger" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          {unread > 0 ? <span className="gm-bell-badge">{unread > 9 ? '9+' : unread}</span> : null}
        </button>

      </div>
    </header>
  );
}
