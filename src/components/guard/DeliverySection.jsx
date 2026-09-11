// client/src/components/guard/DeliverySection.jsx

import '../../styles/guard/guard-main.css';

export default function DeliverySection({
  data = [],
  loading = false,
  onViewAll,
}) {
  const deliveries = data;

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

      <div className="gm-table-body">
        {loading && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--gm-text-tertiary)', fontSize: 13 }}>
            Loading…
          </div>
        )}
        {!loading && deliveries.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--gm-text-tertiary)', fontSize: 13 }}>
            No deliveries at gate
          </div>
        )}
        {!loading &&
          deliveries.map((d) => (
            <div key={d.id} className="gm-table-row gm-delivery-grid">
              <span className="gm-visitor-name">{d.person || d.courier}</span>
              <span className="gm-cell-center">{d.flat}</span>
              <span className="gm-cell-center">{d.company}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
