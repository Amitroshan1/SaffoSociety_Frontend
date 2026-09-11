import { useState } from 'react';
import '../../../styles/guard/visitor/visitors.css';

const STAFF_ROLES = [
  { label: 'Maid', visitorType: 'maid' },
  { label: 'Driver', visitorType: 'driver' },
  { label: 'Technician', visitorType: 'technician' },
];

/**
 * Gate quick-entry form — Delivery / Staff / Cab.
 * Layout matches Add Visitor: section cards + horizontal field rows.
 */
export default function QuickGateEntryForm({
  mode = 'delivery',
  title,
  lockedPurpose,
  defaultVisitorType,
  defaultPreapprove = true,
  requireVehicle = false,
  showStaffRole = false,
  submitLabel = 'Submit entry',
  onSubmit,
  showToast,
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [flat, setFlat] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [note, setNote] = useState('');
  const [persons, setPersons] = useState(1);
  const [preapprove, setPreapprove] = useState(defaultPreapprove);
  const [staffRole, setStaffRole] = useState(STAFF_ROLES[0].visitorType);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !phone.trim() || !flat.trim()) {
      showToast?.('error', 'Missing fields', 'Name, phone and flat are required.');
      return;
    }
    if (phone.trim().length !== 10) {
      showToast?.('error', 'Invalid phone', 'Enter a valid 10-digit number.');
      return;
    }
    if (requireVehicle && !vehicle.trim()) {
      showToast?.('error', 'Vehicle required', 'Enter cab / vehicle number.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        flat: flat.trim(),
        purpose: lockedPurpose,
        persons,
        vehicle: vehicle.trim(),
        vtype: mode === 'cab' ? 'cab' : '',
        note,
        notify: true,
        preapprove,
        visitorType: showStaffRole ? staffRole : defaultVisitorType,
        photoSrc: null,
      });
      setName('');
      setPhone('');
      setFlat('');
      setVehicle('');
      setNote('');
      setPersons(1);
      setPreapprove(defaultPreapprove);
      setStaffRole(STAFF_ROLES[0].visitorType);
    } catch (err) {
      showToast?.(
        'error',
        'Entry failed',
        err?.response?.data?.message || err.message || 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const namePlaceholder =
    mode === 'delivery' ? 'Courier / delivery person' : mode === 'cab' ? 'Driver name' : 'Full name';

  return (
    <div className="avf-root">
      {title ? (
        <div className="vp-header avf-form-heading">
          <div className="vp-header-titles">
            <h2 className="vp-page-title" style={{ fontSize: 17 }}>
              {title}
            </h2>
          </div>
        </div>
      ) : null}

      <div className="avf-form-grid">
        <div className="avf-card">
          <div className="avf-card-title">Personal details</div>
          <div className="avf-grid-2">
            <div className="avf-field">
              <label>
                Name <span className="avf-req">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={namePlaceholder}
              />
            </div>
            <div className="avf-field">
              <label>
                Phone <span className="avf-req">*</span>
              </label>
              <div className="avf-phone-wrap">
                <div className="avf-phone-cc">🇮🇳 +91</div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          <div className="avf-grid-2">
            <div className="avf-field">
              <label>
                Vehicle number {requireVehicle ? <span className="avf-req">*</span> : null}
              </label>
              <input
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value.toUpperCase())}
                placeholder={mode === 'cab' ? 'MH12AB1234' : 'Optional'}
                style={{ fontFamily: 'var(--vp-mono)', letterSpacing: '0.05em' }}
              />
            </div>
            <div className="avf-field">
              <label>Vehicle type</label>
              <input
                value={mode === 'cab' ? 'Cab / Taxi' : mode === 'delivery' ? 'Optional' : '—'}
                disabled
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="avf-card">
          <div className="avf-card-title">Entry details</div>
          <div className="avf-grid-2">
            <div className="avf-field">
              <label>
                Flat <span className="avf-req">*</span>
              </label>
              <input
                value={flat}
                onChange={(e) => setFlat(e.target.value)}
                placeholder="e.g. A-101 or 101"
              />
            </div>
            <div className="avf-field">
              <label>Purpose</label>
              <input value={lockedPurpose} disabled readOnly />
            </div>
          </div>

          <div className="avf-grid-2">
            {showStaffRole ? (
              <div className="avf-field">
                <label>Staff role</label>
                <select value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                  {STAFF_ROLES.map((r) => (
                    <option key={r.visitorType} value={r.visitorType}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="avf-field">
              <label>No. of persons</label>
              <div className="avf-count-row">
                <button
                  type="button"
                  className="avf-cnt-btn"
                  onClick={() => setPersons((p) => Math.max(1, p - 1))}
                >
                  −
                </button>
                <div className="avf-cnt-val">{persons}</div>
                <button
                  type="button"
                  className="avf-cnt-btn"
                  onClick={() => setPersons((p) => Math.min(20, p + 1))}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="avf-card avf-card--full">
          <div className="avf-card-title">
            Notes <span className="avf-optional-tag">optional</span>
          </div>
          <div className="avf-field">
            <label>Remarks</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional remarks"
              rows={2}
              className="avf-notes-compact"
            />
          </div>
          <div className="avf-toggle-row" style={{ marginTop: 4 }}>
            <div>
              <div className="avf-tr-title">Pre-approved entry</div>
              <div className="avf-tr-sub">Skip resident wait — ready for check-in</div>
            </div>
            <button
              type="button"
              className={`avf-toggle${preapprove ? ' avf-toggle--on' : ''}`}
              onClick={() => setPreapprove((v) => !v)}
              aria-label="Toggle pre-approved"
            />
          </div>
        </div>

        <button
          type="button"
          className="avf-submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </div>
  );
}
