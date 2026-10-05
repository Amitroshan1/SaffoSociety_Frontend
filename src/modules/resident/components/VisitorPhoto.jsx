import { useEffect, useState } from 'react';
import { typeLabel } from '@/modules/resident/components/ResidentShell';

export default function VisitorPhoto({ visit, size = 36 }) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  const src = visit?.photoDisplayUrl;
  const initial = String(visit?.name || 'V').slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!src || broken) {
    return (
      <div className="res-avatar" style={{ width: size, height: size }} title="No photo from the gate">
        {initial}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="res-photo-thumb"
        style={{ width: size, height: size }}
        onClick={() => setOpen(true)}
        aria-label={`View photo of ${visit.name}`}
      >
        <img src={src} alt="" onError={() => setBroken(true)} />
      </button>
      {open ? (
        <div className="res-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Photo of ${visit.name}`} onClick={() => setOpen(false)}>
          <div className="res-photo-viewer" onClick={(event) => event.stopPropagation()}>
            <img src={src} alt={`Photo of ${visit.name}`} />
            <div className="res-photo-caption">
              <div>
                <strong>{visit.name}</strong>
                <div className="res-meta">
                  {[typeLabel(visit.type), visit.purpose, visit.vehicle].filter(Boolean).join(' · ')}
                </div>
              </div>
              <button type="button" className="res-btn res-btn--secondary" onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
