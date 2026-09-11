// client/src/components/guard/DeliverySection.jsx

import '../../styles/guard/guard-main.css';

export default function DeliverySection({
  data = [],
  loading = false,
  onCollect,
  onViewAll,
}) {
  const deliveries = data;

  return (
    <div className="gm-panel">
      <div className="gm-panel-header">
        <span className="gm-panel-title">Deliveries at Gate</span>
        <span className="gm-badge gm-badge-warning">{deliveries.length} At gate</span>
      </div>

      <div className="gm-table-header gm-delivery-grid">
        <span>Delivery By</span>
        <span>Flat No.</span>
        <span>Company</span>
        <span>Status</span>
        {onCollect ? <span>Action</span> : null}
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
              <span className="gm-badge gm-badge-warning">{d.status || 'At Gate'}</span>
              {onCollect ? (
                <div>
                  <button
                    type="button"
                    className="gm-exit-btn"
                    onClick={() => onCollect(d.id)}
                    title="Resident confirmed they received the parcel"
                  >
                    Received
                  </button>
                </div>
              ) : null}
            </div>
          ))}
      </div>

      <div className="gm-panel-footer">
        <button
          type="button"
          className="gm-view-all"
          onClick={onViewAll}
          style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}
        >
          Open deliveries →
        </button>
      </div>
    </div>
  );
}
