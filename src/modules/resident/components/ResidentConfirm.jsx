export default function ResidentConfirm({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, busy = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="res-modal-backdrop" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="res-modal" onClick={(event) => event.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="res-modal-actions">
          <button type="button" className="res-btn res-btn--secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button type="button" className={danger ? 'res-btn res-btn--danger' : 'res-btn res-btn--primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResidentNote({ tone = 'ok', children }) {
  if (!children) return null;
  return <div className={`res-note res-note--${tone}`}>{children}</div>;
}
