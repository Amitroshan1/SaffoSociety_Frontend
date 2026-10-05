import { useEffect } from 'react';

export default function ResidentDialog({ open, title, onClose, children, footer, busy = false }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape' && !busy) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;
  return (
    <div className="res-modal-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={() => !busy && onClose()}>
      <div className="res-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="res-dialog-head">
          <h3>{title}</h3>
          <button type="button" className="res-dialog-close" aria-label="Close" onClick={onClose} disabled={busy}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="res-dialog-body">{children}</div>
        {footer ? <div className="res-dialog-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
