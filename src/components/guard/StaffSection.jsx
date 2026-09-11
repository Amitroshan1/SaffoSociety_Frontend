// client/src/components/guard/StaffSection.jsx

import '../../styles/guard/guard-main.css';

export default function StaffSection({ data = [], loading = false }) {
  const staff = data;

  return (
    <div className="gm-panel">
      <div className="gm-panel-header">
        <span className="gm-panel-title">Staff Inside</span>
        <span className="gm-badge gm-badge-staff">{staff.length} Inside</span>
      </div>

      <div className="gm-table-header gm-staff-grid">
        <span>Staff Name</span>
        <span>Role</span>
        <span>Flat</span>
        <span>Since</span>
      </div>

      <div className="gm-table-body">
        {loading && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--gm-text-tertiary)', fontSize: 13 }}>
            Loading…
          </div>
        )}
        {!loading && staff.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--gm-text-tertiary)', fontSize: 13 }}>
            No staff checked in
          </div>
        )}
        {!loading &&
          staff.map((s) => (
            <div key={s.id} className="gm-table-row gm-staff-grid">
              <span className="gm-visitor-name">{s.name}</span>
              <span className="gm-cell-center">{s.role}</span>
              <span className="gm-cell-center">{s.flat}</span>
              <span className="gm-cell-sm">{s.since}</span>
            </div>
          ))}
      </div>

      <div className="gm-panel-footer">
        <span className="gm-view-all" style={{ cursor: 'default', opacity: 0.7 }}>
          Maid / driver visits currently inside
        </span>
      </div>
    </div>
  );
}
