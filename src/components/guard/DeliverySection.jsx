// client/src/components/guard/DeliverySection.jsx

import '@/styles/guard/guard-main.css';

const MAX_VISIBLE_ROWS = 8;

/** Grow with data: 0→1, 1→2 … up to 8; scroll if more. */
function bodyRowSlots(count) {
  return Math.min(MAX_VISIBLE_ROWS, Math.max(1, count + 1));
}

export default function DeliverySection({
  data = [],
  loading = false,
  onViewAll,
}) {
  const deliveries = data;
  const rowSlots = bodyRowSlots(loading ? 0 : deliveries.length);

  return (
    <div className="gm-panel">
      <div className="gm-panel-header">
        <span className="gm-panel-title">Deliveries at Gate</span>
        <button
          type="button"
          className="gm-view-all"
          onClick={onViewAll}
          style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
        >
          View all
        </button>
      </div>

      <div className="gm-table-header gm-delivery-grid">
        <span>Delivery By</span>
        <span>Flat No.</span>
        <span>Company</span>
      </div>

      <div
        className="gm-table-body gm-delivery-body"
        style={{ '--gm-panel-visible-rows': rowSlots }}
      >
        {loading && <div className="gm-table-empty">Loading…</div>}
        {!loading && deliveries.length === 0 && (
          <div className="gm-table-empty">No deliveries at gate</div>
        )}
        {!loading &&
          deliveries.map((d) => (
            <div key={d.id} className="gm-table-row gm-delivery-grid">
              <span className="gm-visitor-name">{d.person || d.courier}</span>
              <span className="gm-cell-center" data-label="Flat">{d.flat}</span>
              <span className="gm-cell-center" data-label="Company">{d.company}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
