// client/src/components/guard/StatsCards.jsx

import '../../styles/guard/guard-main.css';

const ICONS = {
  blue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  yellow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  green: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  orange: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  purple: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18a1 1 0 001 1h18a1 1 0 001-1v-2a1 1 0 00-1-1H3a1 1 0 00-1 1v2z"/>
      <path d="M10 10V5a1 1 0 011-1h2a1 1 0 011 1v5"/>
      <path d="M4 15v-3a8 8 0 0116 0v3"/>
    </svg>
  ),
};

export default function StatsCards({ stats, loading = false }) {
  const data = stats || [];

  if (!data.length && loading) {
    return (
      <div className="gm-stats-row">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="gm-stat-card" style={{ opacity: 0.5 }}>
            <div className="gm-stat-value">—</div>
            <div className="gm-stat-label">Loading</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="gm-stats-row">
      {data.map((s, i) => (
        <div
          key={s.label}
          className="gm-stat-card"
          style={{ animationDelay: `${0.1 + i * 0.04}s`, cursor: s.onClick ? 'pointer' : undefined }}
          onClick={s.onClick}
          role={s.onClick ? 'button' : undefined}
          tabIndex={s.onClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (s.onClick && (e.key === 'Enter' || e.key === ' ')) s.onClick();
          }}
        >
          <div className={`gm-stat-icon-wrap ${s.colorClass}`}>
            {s.icon || ICONS[s.colorClass] || ICONS.blue}
          </div>
          <div>
            <div className="gm-stat-value">{loading ? '…' : s.value}</div>
            <div className="gm-stat-label">{s.label}</div>
            <div className={`gm-stat-sub ${s.subClass || ''}`}>{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
