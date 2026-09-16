import '../../styles/guard/guard-main.css';

const MAX_VISIBLE_ROWS = 8;

/** Grow with data: 0→1, 1→2 … up to 8; scroll if more. */
function bodyRowSlots(count) {
  return Math.min(MAX_VISIBLE_ROWS, Math.max(1, count + 1));
}

const ICONS = {
  visitor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  delivery: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  exit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  staff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18a1 1 0 001 1h18a1 1 0 001-1v-2a1 1 0 00-1-1H3a1 1 0 00-1 1v2z"/>
      <path d="M10 10V5a1 1 0 011-1h2a1 1 0 011 1v5"/>
      <path d="M4 15v-3a8 8 0 0116 0v3"/>
    </svg>
  ),
  cab: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/>
      <rect x="9" y="11" width="14" height="10" rx="2"/>
      <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    </svg>
  ),
};

export default function RecentActivity({ data = [], loading = false }) {
  const activities = data;
  const rowSlots = bodyRowSlots(loading ? 0 : activities.length);

  return (
    <div className="gm-panel">
      <div className="gm-panel-header">
        <span className="gm-panel-title">Recent Activity</span>
      </div>

      <div
        className="gm-table-body gm-activity-body"
        style={{ '--gm-panel-visible-rows': rowSlots }}
      >
        {loading && <div className="gm-table-empty">Loading…</div>}
        {!loading && activities.length === 0 && (
          <div className="gm-table-empty">No activity today</div>
        )}
        {!loading &&
          activities.map((a) => (
            <div key={a.id} className="gm-activity-item">
              <div className={`gm-activity-icon ${a.type}`}>
                {ICONS[a.type] || ICONS.visitor}
              </div>
              <div className="gm-activity-msg" title={a.message}>
                {a.message}
              </div>
              <span className="gm-activity-time">{a.time}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
