import '@/modules/guard/styles/core/guard-main.css';

const MAX_VISIBLE_ROWS = 8;

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

export default function ApprovalList({
  data = [],
  onCall,
  onViewAll,
  onOpen,
  loading = false,
  title = 'Pending Approvals',
  showCall = true,
  totalCount,
}) {
  const approvals = data;
  const rowSlots = bodyRowSlots(loading ? 0 : approvals.length);
  const pendingTotal = totalCount ?? approvals.length;
  const awaitingLabel =
    pendingTotal === 1
      ? '1 awaiting response'
      : `${pendingTotal} awaiting response`;

  return (
    <div className="gm-panel gm-panel-priority">
      <div className="gm-panel-header">
        <div className="gm-panel-title-wrap">
          <span className="gm-panel-title">{title}</span>
          {!loading ? <span className="gm-panel-sub">{awaitingLabel}</span> : null}
        </div>
        <div className="gm-panel-header-right">
          <span className="gm-badge gm-badge-warning">{pendingTotal} Pending</span>
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
        {showCall ? <span>Call</span> : <span />}
      </div>

      <div
        className="gm-table-body gm-approvals-body"
        style={{ '--gm-approvals-visible-rows': rowSlots }}
      >
        {loading && <div className="gm-table-empty">Loading…</div>}
        {!loading && approvals.length === 0 && (
          <div className="gm-table-empty">No pending approvals</div>
        )}
        {!loading &&
          approvals.map((item) => (
            <div
              key={item.id}
              className="gm-table-row gm-approval-grid"
              onClick={onOpen ? () => onOpen(item) : undefined}
              style={onOpen ? { cursor: 'pointer' } : undefined}
            >
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
                {showCall ? (
                <button
                  type="button"
                  className="gm-phone-btn"
                  onClick={() => onCall?.(item)}
                  title={item.phone ? `Call ${item.phone}` : 'No phone'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                  </svg>
                  <span className="gm-phone-btn-text">Call</span>
                </button>
                ) : null}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
