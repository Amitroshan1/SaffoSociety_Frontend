// client/src/components/guard/StaffSection.jsx

import '../../styles/guard/guard-main.css';

const MAX_VISIBLE_ROWS = 8;

/** Grow with data: 0→1, 1→2 … up to 8; scroll if more. */
function bodyRowSlots(count) {
  return Math.min(MAX_VISIBLE_ROWS, Math.max(1, count + 1));
}

export default function StaffSection({ data = [], loading = false, onViewAll }) {
  const staff = data;
  const rowSlots = bodyRowSlots(loading ? 0 : staff.length);

  return (
    <div className="gm-panel">
      <div className="gm-panel-header">
        <span className="gm-panel-title">Staff Inside</span>
        <button
          type="button"
          className="gm-view-all"
          onClick={onViewAll}
          style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
        >
          View all
        </button>
      </div>

      <div className="gm-table-header gm-staff-grid">
        <span>Staff Name</span>
        <span>Role</span>
        <span>Flat</span>
        <span>Since</span>
      </div>

      <div
        className="gm-table-body gm-staff-body"
        style={{ '--gm-panel-visible-rows': rowSlots }}
      >
        {loading && <div className="gm-table-empty">Loading…</div>}
        {!loading && staff.length === 0 && (
          <div className="gm-table-empty">No staff checked in</div>
        )}
        {!loading &&
          staff.map((s) => (
            <div key={s.id} className="gm-table-row gm-staff-grid">
              <span className="gm-visitor-name">{s.name}</span>
              <span className="gm-cell-center" data-label="Role">{s.role}</span>
              <span className="gm-cell-center" data-label="Flat">{s.flat}</span>
              <span className="gm-cell-sm" data-label="Since">{s.since}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
