// client/src/components/guard/ApprovalList.jsx

import '../../styles/guard/guard-main.css';

const MAX_VISIBLE_ROWS = 8;

/** Grow with data: 0→1 … up to 8; scroll if more. */
function bodyRowSlots(count) {
  return Math.min(MAX_VISIBLE_ROWS, Math.max(1, count + 1));
}

function initials(name) {
  return String(name || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ApprovalList({ data = [], onCall, onViewAll, loading = false }) {
  const approvals = data;
  const rowSlots = bodyRowSlots(loading ? 0 : approvals.length);

  return (
    <div className="gm-panel">
      <div className="gm-panel-header">
        <span className="gm-panel-title">Live Approvals</span>
        <div className="gm-panel-header-right">
          <span className="gm-badge gm-badge-warning">{approvals.length} Pending</span>
          <button type="button" className="gm-view-all" onClick={onViewAll}>
            View All
          </button>
        </div>
      </div>

      <div className="gm-table-header gm-approval-grid">
        <span>Visitor Name</span>
        <span>Flat No.</span>
        <span>Purpose</span>
        <span>Time</span>
        <span>Call</span>
      </div>

      <div
        className="gm-table-body gm-approvals-body"
        style={{ '--gm-approvals-visible-rows': rowSlots }}
      >
        {loading && (
          <div className="gm-table-empty">Loading…</div>
        )}
        {!loading && approvals.length === 0 && (
          <div className="gm-table-empty">No pending approvals</div>
        )}
        {!loading &&
          approvals.map((item) => (
            <div key={item.id} className="gm-table-row gm-approval-grid">
              <div className="gm-visitor-cell">
                <div className="gm-visitor-initials">{initials(item.name)}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="gm-visitor-name">{item.name}</div>
                  <div className="gm-visitor-phone">{item.phone}</div>
                </div>
              </div>

              <span className="gm-cell-center" data-label="Flat">{item.flat}</span>
              <span className="gm-cell-center" data-label="Purpose">{item.purpose}</span>
              <span className="gm-cell-sm" data-label="Time">{item.time}</span>

              <div>
                <button
                  type="button"
                  className="gm-phone-btn"
                  onClick={() => onCall && onCall(item)}
                  title={item.phone ? `Call ${item.phone}` : 'No phone'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                  </svg>
                  <span className="gm-phone-btn-text">Call</span>
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}