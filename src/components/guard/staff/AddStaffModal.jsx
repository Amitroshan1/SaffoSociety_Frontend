import { useState } from 'react';
import '../../../styles/guard/visitor/visitors.css';
import { logVisitor } from '../../../services/guard.service.js';

const UI_ROLES = [
  { label: 'Maid', visitorType: 'maid', staffRole: 'housekeeping' },
  { label: 'Driver', visitorType: 'driver', staffRole: 'other' },
  { label: 'Technician', visitorType: 'technician', staffRole: 'electrician' },
];

/** Format as XXXX XXXX XXXX while typing. */
function formatAadhaarInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

/**
 * Add Staff modal — one-time gate entry only.
 * Entry stays pending until guard calls resident and allows.
 */
export default function AddStaffModal({ open, onClose, onDone, showToast }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [flat, setFlat] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [note, setNote] = useState('');
  const [staffRoleUi, setStaffRoleUi] = useState(UI_ROLES[0].visitorType);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function reset() {
    setName('');
    setPhone('');
    setFlat('');
    setAadhaar('');
    setVehicle('');
    setNote('');
    setStaffRoleUi(UI_ROLES[0].visitorType);
  }

  function close() {
    reset();
    onClose?.();
  }

  const roleMeta = UI_ROLES.find((r) => r.visitorType === staffRoleUi) || UI_ROLES[0];

  async function handleSubmit() {
    if (!name.trim() || !phone.trim() || !flat.trim()) {
      showToast?.('error', 'Missing fields', 'Name, phone and flat are required.');
      return;
    }
    if (phone.trim().length !== 10) {
      showToast?.('error', 'Invalid phone', 'Enter a valid 10-digit number.');
      return;
    }
    const aadhaarDigits = aadhaar.replace(/\D/g, '');
    if (aadhaarDigits && aadhaarDigits.length !== 12) {
      showToast?.('error', 'Invalid Aadhaar', 'Enter a valid 12-digit Aadhaar number.');
      return;
    }

    setSubmitting(true);
    try {
      await logVisitor({
        name: name.trim(),
        phone: phone.trim(),
        flat: flat.trim(),
        purpose: 'Work / Service',
        persons: 1,
        vehicle: vehicle.trim(),
        vtype: '',
        note: [note.trim(), aadhaarDigits ? `Aadhaar: ${aadhaarDigits}` : '']
          .filter(Boolean)
          .join(' | '),
        notify: true,
        preapprove: false,
        visitorType: roleMeta.visitorType,
        photoSrc: null,
      });
      showToast?.(
        'success',
        'Entry logged',
        `${name.trim()} is waiting — call the resident, then allow.`,
      );
      reset();
      onDone?.();
      onClose?.();
    } catch (err) {
      showToast?.(
        'error',
        'Failed',
        err?.response?.data?.message || err.message || 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="gm-park-modal-backdrop gs-add-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Add Staff"
      onClick={close}
    >
      <div className="vp-root gs-add-modal-host" onClick={(e) => e.stopPropagation()}>
        <div className="avf-card gs-add-modal">
          <div className="gs-add-modal-head">
            <h3 className="gs-add-modal-title">Add Staff</h3>
            <button type="button" className="gs-add-modal-close" onClick={close} aria-label="Close">
              ×
            </button>
          </div>

          <div className="avf-grid-2">
            <div className="avf-field">
              <label>
                Name <span className="avf-req">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="avf-field">
              <label>
                Phone <span className="avf-req">*</span>
              </label>
              <div className="avf-phone-wrap">
                <div className="avf-phone-cc">+91</div>
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
                Flat (works at) <span className="avf-req">*</span>
              </label>
              <input
                value={flat}
                onChange={(e) => setFlat(e.target.value)}
                placeholder="e.g. A-101"
              />
            </div>
            <div className="avf-field">
              <label>Staff role</label>
              <select value={staffRoleUi} onChange={(e) => setStaffRoleUi(e.target.value)}>
                {UI_ROLES.map((r) => (
                  <option key={r.visitorType} value={r.visitorType}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="avf-grid-2">
            <div className="avf-field">
              <label>Aadhaar number</label>
              <input
                value={aadhaar}
                onChange={(e) => setAadhaar(formatAadhaarInput(e.target.value))}
                placeholder="XXXX XXXX XXXX"
                inputMode="numeric"
                maxLength={14}
                style={{ fontFamily: 'var(--vp-mono)', letterSpacing: '0.06em' }}
              />
            </div>
            <div className="avf-field">
              <label>Vehicle number</label>
              <input
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value.toUpperCase())}
                placeholder="Optional"
                style={{ fontFamily: 'var(--vp-mono)', letterSpacing: '0.05em' }}
              />
            </div>
          </div>

          <div className="avf-field">
            <label>Note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <button
            type="button"
            className="avf-submit-btn"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ marginTop: 8 }}
          >
            {submitting ? 'Logging…' : 'Log entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
