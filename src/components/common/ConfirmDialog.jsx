import { useEffect } from 'react';
import '@/styles/common/crud.css';

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass = variant === 'danger' ? 'crud-btn crud-btn-danger' : 'crud-btn crud-btn-primary';

  return (
    <div className="crud-modal-backdrop" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="crud-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="crud-modal-actions">
          <button type="button" className="crud-btn crud-btn-ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm} disabled={loading}>
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
