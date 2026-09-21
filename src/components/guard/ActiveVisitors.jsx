// client/src/components/guard/ActiveVisitors.jsx

import '@/styles/guard/guard-main.css';

const MAX_VISIBLE_ROWS = 8;

/** Grow with data: 0→1 … up to 8; scroll if more. */
function bodyRowSlots(count) {
  return Math.min(MAX_VISIBLE_ROWS, Math.max(1, count + 1));
}

export default function ActiveVisitors({ data = [], onMarkExit, onViewAll, loading = false }) {
  const visitors = data;
  const rowSlots = bodyRowSlots(loading ? 0 : visitors.length);

  return (
    <div className="gm-panel">
      <div className="gm-panel-header">
        <span className="gm-panel-title">Active Visitors</span>
        <div className="gm-panel-header-right">
          <span className="gm-badge gm-badge-success">{visitors.length} Inside</span>
          <button type="button" className="gm-view-all" onClick={onViewAll}>
            View All
          </button>
        </div>
      </div>

      <div className="gm-table-header gm-visitors-grid">
        <span>Visitor Name</span>
        <span>Total Persons</span>
        <span>Flat No.</span>
        <span>Entry Time</span>
        <span>Duration</span>
        <span>Action</span>
      </div>

      <div
        className="gm-table-body gm-visitors-body"
        style={{ '--gm-visitors-visible-rows': rowSlots }}
      >
        {loading && <div className="gm-table-empty">Loading…</div>}
        {!loading && visitors.length === 0 && (
          <div className="gm-table-empty">No active visitors</div>
        )}
        {!loading &&
          visitors.map((v) => (
            <div key={v.id} className="gm-table-row gm-visitors-grid">
              <span className="gm-visitor-name">{v.name}</span>
              <span className="gm-cell-center" data-label="Persons">{v.totalPersons}</span>
              <span className="gm-cell-center" data-label="Flat">{v.flat}</span>
              <span className="gm-cell-sm" data-label="Entry">{v.entryTime}</span>
              <span className="gm-cell-sm" data-label="Duration">{v.duration}</span>
              <div>
                <button type="button" className="gm-exit-btn" onClick={() => onMarkExit?.(v.id)}>
                  Mark Exit
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
