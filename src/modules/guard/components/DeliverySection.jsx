import '@/modules/guard/styles/core/guard-main.css';

const MAX_VISIBLE_ROWS = 8;

function bodyRowSlots(count) {
  return Math.min(MAX_VISIBLE_ROWS, Math.max(1, count + 1));
}

function statusLabel(d) {
  const raw = String(d.status || '').toLowerCase();
  if (!raw || raw === 'pending') return 'Waiting';
  return d.status;
}

export default function DeliverySection({
  data = [],
  loading = false,
  onViewAll,
  onOpen,
  title = 'Deliveries Waiting',
  sub,
  columns = ['Delivery Partner', 'Flat', 'Time', 'Status'],
  emptyText = 'No deliveries waiting',
  badge,
}) {
  const deliveries = data;
  const rowSlots = bodyRowSlots(loading ? 0 : deliveries.length);

  return (
    <div className="gm-panel">
      <div className="gm-panel-header">
        <div className="gm-panel-title-wrap">
          <span className="gm-panel-title">{title}</span>
          {!loading && !badge ? (
            <span className="gm-panel-sub">
              {sub || (deliveries.length === 1 ? '1 at gate' : `${deliveries.length} at gate`)}
            </span>
          ) : null}
        </div>
        <div className="gm-panel-header-right">
          {!loading && badge ? <span className="gm-badge gm-badge-warning">{badge}</span> : null}
          <button type="button" className="gm-view-all" onClick={onViewAll}>
            View all
          </button>
        </div>
      </div>

      <div className="gm-table-header gm-delivery-grid">
        <span>{columns[0]}</span>
        <span>{columns[1]}</span>
        <span>{columns[2]}</span>
        <span>{columns[3]}</span>
      </div>

      <div
        className="gm-table-body gm-delivery-body"
        style={{ '--gm-panel-visible-rows': rowSlots }}
      >
        {loading && <div className="gm-table-empty">Loading…</div>}
        {!loading && deliveries.length === 0 && (
          <div className="gm-table-empty">{emptyText}</div>
        )}
        {!loading &&
          deliveries.map((d) => (
            <div
              key={d.id}
              className="gm-table-row gm-delivery-grid"
              onClick={onOpen ? () => onOpen(d) : undefined}
              style={onOpen ? { cursor: 'pointer' } : undefined}
            >
              <span className="gm-visitor-name">
                {d.person || d.courier || d.company || '—'}
              </span>
              <span className="gm-cell-center" data-label="Flat">{d.flat}</span>
              <span className="gm-cell-sm" data-label={columns[2]}>{d.company || d.time || '—'}</span>
              <span data-label="Status">
                <span className="gm-status-pill">{statusLabel(d)}</span>
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
