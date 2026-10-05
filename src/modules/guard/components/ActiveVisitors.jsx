import { useState } from 'react';
import ConfirmDialog from '@/modules/guard/common/ConfirmDialog.jsx';
import '@/modules/guard/styles/core/guard-main.css';

const MAX_VISIBLE_ROWS = 8;

function bodyRowSlots(count) {
  return Math.min(MAX_VISIBLE_ROWS, Math.max(1, count + 1));
}

export default function ActiveVisitors({
  data = [],
  onMarkExit,
  onViewAll,
  onOpen,
  loading = false,
  title = 'Visitors Inside',
  totalCount,
}) {
  const visitors = data;
  const rowSlots = bodyRowSlots(loading ? 0 : visitors.length);
  const insideTotal = totalCount ?? visitors.length;
  const [exitTarget, setExitTarget] = useState(null);

  function confirmExit() {
    if (!exitTarget || !onMarkExit) {
      setExitTarget(null);
      return;
    }
    const id = exitTarget.id;
    setExitTarget(null);
    onMarkExit(id);
  }

  return (
    <div className="gm-panel">
      <div className="gm-panel-header">
        <div className="gm-panel-title-wrap">
          <span className="gm-panel-title">{title}</span>
          {!loading ? (
            <span className="gm-panel-sub">
              {insideTotal === 1 ? '1 currently inside' : `${insideTotal} currently inside`}
            </span>
          ) : null}
        </div>
        <div className="gm-panel-header-right">
          <span className="gm-badge gm-badge-success">{insideTotal} Inside</span>
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
          <div className="gm-table-empty">No visitors inside</div>
        )}
        {!loading &&
          visitors.map((v) => (
            <div
              key={v.id}
              className="gm-table-row gm-visitors-grid"
              onClick={onOpen ? () => onOpen(v) : undefined}
              style={onOpen ? { cursor: 'pointer' } : undefined}
            >
              <span className="gm-visitor-name">{v.name}</span>
              <span className="gm-cell-center" data-label="Persons">{v.totalPersons}</span>
              <span className="gm-cell-center" data-label="Flat">{v.flat}</span>
              <span className="gm-cell-sm" data-label="Entry">{v.entryTime}</span>
              <span data-label="Duration">
                <span className="gm-duration">{v.duration || '—'}</span>
              </span>
              <div>
                {onMarkExit ? (
                <button
                  type="button"
                  className="gm-exit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExitTarget(v);
                  }}
                >
                  Mark Exit
                </button>
                ) : null}
              </div>
            </div>
          ))}
      </div>

      <ConfirmDialog
        open={Boolean(exitTarget)}
        title="Mark visitor exit"
        message={
          exitTarget
            ? `Mark ${exitTarget.name} (Flat ${exitTarget.flat}) as exited?`
            : ''
        }
        confirmLabel="Mark Exit"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmExit}
        onCancel={() => setExitTarget(null)}
      />
    </div>
  );
}
