import '@/modules/guard/styles/core/guard-main.css';

const MAX_VISIBLE_ROWS = 8;

function bodyRowSlots(count) {
  return Math.min(MAX_VISIBLE_ROWS, Math.max(1, count + 1));
}

export default function StaffSection({
  data = [],
  loading = false,
  onViewAll,
  onOpen,
  title = 'Staff Inside',
  sub,
  nameLabel = 'Staff',
  sinceLabel = 'Since',
  mark = 'Inside',
  emptyText = 'No staff checked in',
  badge,
}) {
  const staff = data;
  const rowSlots = bodyRowSlots(loading ? 0 : staff.length);

  return (
    <div className="gm-panel">
      <div className="gm-panel-header">
        <div className="gm-panel-title-wrap">
          <span className="gm-panel-title">{title}</span>
          {!loading && !badge ? (
            <span className="gm-panel-sub">
              {sub || (staff.length === 1 ? '1 checked in' : `${staff.length} checked in`)}
            </span>
          ) : null}
        </div>
        <div className="gm-panel-header-right">
          {!loading && badge ? <span className="gm-badge gm-badge-staff">{badge}</span> : null}
          <button type="button" className="gm-view-all" onClick={onViewAll}>
            View all
          </button>
        </div>
      </div>

      <div className="gm-table-header gm-staff-grid">
        <span>Staff Name</span>
        <span>Role</span>
        <span>Flat</span>
        <span>{sinceLabel}</span>
      </div>

      <div
        className="gm-table-body gm-staff-body"
        style={{ '--gm-panel-visible-rows': rowSlots }}
      >
        {loading && <div className="gm-table-empty">Loading…</div>}
        {!loading && staff.length === 0 && (
          <div className="gm-table-empty">{emptyText}</div>
        )}
        {!loading &&
          staff.map((s) => (
            <div
              key={s.id}
              className="gm-table-row gm-staff-grid"
              onClick={onOpen ? () => onOpen(s) : undefined}
              style={onOpen ? { cursor: 'pointer' } : undefined}
            >
              <span className="gm-visitor-name">{s.name}</span>
              <span className="gm-cell-center" data-label="Role">{s.role || '—'}</span>
              <span className="gm-cell-center" data-label="Flat">{s.flat || '—'}</span>
              <span className="gm-cell-sm" data-label="Since">{s.since || '—'}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
