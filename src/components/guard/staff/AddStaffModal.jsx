import { useState } from 'react';
import '../../../styles/guard/visitor/visitors.css';
import { createStaff } from '../../../services/staff.service.js';
import { checkInAttendance } from '../../../services/attendance.service.js';
import { logVisitor } from '../../../services/guard.service.js';

const UI_ROLES = [
  { label: 'Maid', visitorType: 'maid', staffRole: 'housekeeping' },
  { label: 'Driver', visitorType: 'driver', staffRole: 'other' },
  { label: 'Technician', visitorType: 'technician', staffRole: 'electrician' },
];

/**
 * Add Staff card/modal — Regular (persist + optional check-in) or One-time (visit only).
 */
export default function AddStaffModal({ open, onClose, onDone, showToast }) {
  const [kind, setKind] = useState('regular'); // regular | onetime
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [flat, setFlat] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [note, setNote] = useState('');
  const [staffRoleUi, setStaffRoleUi] = useState(UI_ROLES[0].visitorType);
  const [checkInNow, setCheckInNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function reset() {
    setKind('regular');
    setName('');
    setPhone('');
    setFlat('');
    setAadhaar('');
    setVehicle('');
    setNote('');
    setStaffRoleUi(UI_ROLES[0].visitorType);
    setCheckInNow(true);
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
      if (kind === 'onetime') {
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
          preapprove: true,
          visitorType: roleMeta.visitorType,
          photoSrc: null,
        });
        showToast?.(
          'success',
          'One-time entry logged',
          `${name.trim()} — not added to staff list.`,
        );
      } else {
        const res = await createStaff({
          name: name.trim(),
          phone: phone.trim(),
          staffRole: roleMeta.staffRole,
          employmentType: 'contract',
          notes: note.trim() || null,
          metadata: {
            gateService: true,
            defaultFlat: flat.trim(),
            visitorType: roleMeta.visitorType,
            vehicle: vehicle.trim() || null,
            aadhaar: aadhaarDigits || null,
          },
        });
        const staff = res.data?.data?.staff || res.data?.data;
        if (checkInNow && staff?.id) {
          await checkInAttendance({ staffId: staff.id, notes: note.trim() || null });
        }
        showToast?.(
          'success',
          'Staff added',
          checkInNow
            ? `${name.trim()} saved and checked in.`
            : `${name.trim()} saved to staff list.`,
        );
      }
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

        <div className="gs-kind-toggle">
          <button
            type="button"
            className={`gs-kind-btn${kind === 'regular' ? ' gs-kind-btn--active' : ''}`}
            onClick={() => setKind('regular')}
          >
            Regular
            <span>Saved to staff list</span>
          </button>
          <button
            type="button"
            className={`gs-kind-btn${kind === 'onetime' ? ' gs-kind-btn--active' : ''}`}
            onClick={() => setKind('onetime')}
          >
            One-time
            <span>Gate entry only</span>
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
              onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="12-digit Aadhaar"
              inputMode="numeric"
              maxLength={12}
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

        {kind === 'regular' ? (
          <div className="avf-toggle-row" style={{ marginTop: 4, marginBottom: 8 }}>
            <div>
              <div className="avf-tr-title">Check in now</div>
              <div className="avf-tr-sub">Mark present after saving</div>
            </div>
            <button
              type="button"
              className={`avf-toggle${checkInNow ? ' avf-toggle--on' : ''}`}
              onClick={() => setCheckInNow((v) => !v)}
              aria-label="Toggle check in now"
            />
          </div>
        ) : (
          <p className="gs-onetime-hint">
            One-time entry is logged at the gate only — not added to the daily staff list.
          </p>
        )}

        <button
          type="button"
          className="avf-submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ marginTop: 8 }}
        >
          {submitting
            ? 'Saving…'
            : kind === 'regular'
              ? 'Save staff'
              : 'Log one-time entry'}
        </button>
      </div>
      </div>
    </div>
  );
}
