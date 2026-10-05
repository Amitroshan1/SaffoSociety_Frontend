import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import GatePhotoCapture from '@/modules/guard/components/shared/GatePhotoCapture';
import { normalizePhone } from '@/modules/guard/services/core/http';

const RELATIONS = [
  { value: 'self', label: 'Resident (self)' },
  { value: 'family', label: 'Family member' },
  { value: 'domestic_help', label: 'Domestic help' },
  { value: 'neighbour', label: 'Neighbour' },
  { value: 'other', label: 'Other' },
];

const ID_PROOFS = [
  { value: '', label: 'Not checked' },
  { value: 'society_id', label: 'Society ID card' },
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'driving_licence', label: 'Driving licence' },
  { value: 'other', label: 'Other ID' },
];

const CONDITIONS = [
  { value: 'sealed', label: 'Sealed / good' },
  { value: 'damaged', label: 'Damaged / opened' },
];

const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value || '—';

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function useEscape(onClose) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
}

function HandoverPortal({ children }) {
  return createPortal(
    <div className="vp-root dho-host" data-theme="light">
      {children}
    </div>,
    document.body,
  );
}

function ParcelSummary({ delivery }) {
  return (
    <div className="dho-parcel">
      <div className="dho-parcel-item">
        <span>Flat</span>
        <strong>{delivery.flat || '—'}</strong>
      </div>
      <div className="dho-parcel-item">
        <span>Company</span>
        <strong className="dho-cap">{delivery.company || '—'}</strong>
      </div>
      <div className="dho-parcel-item">
        <span>Tracking ID</span>
        <strong className="dho-mono">{delivery.trackingId || '—'}</strong>
      </div>
      <div className="dho-parcel-item">
        <span>Courier</span>
        <strong>{delivery.courierName || '—'}</strong>
      </div>
    </div>
  );
}

function ChipGroup({ options, value, onChange, name }) {
  return (
    <div className="dho-chips" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`dho-chip${value === o.value ? ' is-active' : ''}${
            o.value === 'damaged' ? ' dho-chip--warn' : ''
          }`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Guard fills who is collecting a parcel kept at the gate before handing it over. */
export default function DeliveryHandoverModal({ delivery, onClose, onSubmit, showToast }) {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('self');
  const [phone, setPhone] = useState('');
  const [idProof, setIdProof] = useState('');
  const [condition, setCondition] = useState('sealed');
  const [remarks, setRemarks] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEscape(submitting ? undefined : onClose);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      showToast?.('error', 'Name required', 'Enter the name of the person collecting.');
      return;
    }
    if (normalizePhone(phone).length !== 10) {
      showToast?.('error', 'Invalid phone', 'Enter a valid 10-digit mobile number.');
      return;
    }
    if (relation !== 'self' && !idProof) {
      showToast?.('error', 'Check an ID', 'Anyone other than the resident must show an ID.');
      return;
    }
    if (condition === 'damaged' && !remarks.trim()) {
      showToast?.('error', 'Add a remark', 'Describe the damage before handing over.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        collectedByName: name.trim(),
        collectedByRelation: relation,
        collectedByPhone: normalizePhone(phone),
        idProof: idProof || null,
        parcelCondition: condition,
        remarks: remarks.trim() || null,
        photo,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <HandoverPortal>
    <div className="dho-overlay" role="presentation" onClick={submitting ? undefined : onClose}>
      <form
        className="dho-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dho-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="dho-header">
          <div>
            <h2 id="dho-title">Hand over parcel</h2>
            <p>Record who is collecting this parcel from the gate.</p>
          </div>
          <button type="button" className="dho-close" onClick={onClose} disabled={submitting} aria-label="Close">
            ×
          </button>
        </header>

        <div className="dho-body">
          <ParcelSummary delivery={delivery} />

          <section className="dho-section">
            <div className="dho-section-title">Collected by</div>
            <div className="dho-grid-2">
              <div className="avf-field">
                <label>
                  Full name <span className="avf-req">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Person collecting the parcel"
                  autoFocus
                />
              </div>
              <div className="avf-field">
                <label>
                  Mobile <span className="avf-req">*</span>
                </label>
                <div className="avf-phone-wrap">
                  <div className="avf-phone-cc">+91</div>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(normalizePhone(e.target.value))}
                    placeholder="10-digit mobile"
                    inputMode="numeric"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
            <div className="avf-field">
              <label>
                Relation to flat <span className="avf-req">*</span>
              </label>
              <ChipGroup options={RELATIONS} value={relation} onChange={setRelation} name="Relation to flat" />
            </div>
          </section>

          <section className="dho-section">
            <div className="dho-section-title">Security check</div>
            <div className="dho-grid-2">
              <div className="avf-field">
                <label>
                  ID verified {relation !== 'self' ? <span className="avf-req">*</span> : null}
                </label>
                <select value={idProof} onChange={(e) => setIdProof(e.target.value)}>
                  {ID_PROOFS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="avf-field">
                <label>Parcel condition</label>
                <ChipGroup options={CONDITIONS} value={condition} onChange={setCondition} name="Parcel condition" />
              </div>
            </div>
            <div className="avf-field">
              <label>
                Remarks {condition === 'damaged' ? <span className="avf-req">*</span> : null}
              </label>
              <input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={condition === 'damaged' ? 'Describe the damage' : 'Optional'}
              />
            </div>
          </section>

          <div className="dho-photo">
            <GatePhotoCapture
              value={photo}
              onChange={setPhoto}
              showToast={showToast}
              title="Collector photo"
              subject="person"
            />
          </div>
        </div>

        <footer className="dho-footer">
          <button type="button" className="dho-btn dho-btn--ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="dho-btn dho-btn--primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Confirm handover'}
          </button>
        </footer>
      </form>
    </div>
    </HandoverPortal>
  );
}

/** Read-only view of a saved handover. */
export function DeliveryHandoverRecord({ delivery, onClose }) {
  useEscape(onClose);
  const h = delivery.handover || {};
  const rows = [
    ['Collected by', h.collectedByName],
    ['Relation', labelOf(RELATIONS, h.collectedByRelation)],
    ['Mobile', h.collectedByPhone ? `+91 ${h.collectedByPhone}` : '—'],
    ['ID verified', labelOf(ID_PROOFS, h.idProof || '')],
    ['Parcel condition', labelOf(CONDITIONS, h.parcelCondition)],
    ['Remarks', h.remarks || '—'],
    ['Handed over', formatDateTime(h.handedAt || delivery.exitTime)],
    ['Kept at gate since', formatDateTime(delivery.heldAt)],
  ];

  return (
    <HandoverPortal>
    <div className="dho-overlay" role="presentation" onClick={onClose}>
      <section
        className="dho-modal dho-modal--narrow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dho-record-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="dho-header">
          <div>
            <h2 id="dho-record-title">Handover record</h2>
            <p>
              Handed to {h.collectedByName || 'the resident'}
              {h.handedAt || delivery.exitTime
                ? ` · ${formatDateTime(h.handedAt || delivery.exitTime)}`
                : ''}
            </p>
          </div>
          <button type="button" className="dho-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="dho-body">
          <ParcelSummary delivery={delivery} />
          <div className="dho-record">
            {h.photoDisplayUrl ? (
              <img className="dho-record-photo" src={h.photoDisplayUrl} alt="Collector" />
            ) : null}
            <dl className="dho-record-list">
              {rows.map(([k, v]) => (
                <div key={k} className={k === 'Parcel condition' && h.parcelCondition === 'damaged' ? 'is-warn' : undefined}>
                  <dt>{k}</dt>
                  <dd>{v || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <footer className="dho-footer">
          <button type="button" className="dho-btn dho-btn--primary" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
    </HandoverPortal>
  );
}
