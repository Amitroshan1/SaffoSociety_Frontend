import { useState } from 'react';
import '../../../styles/guard/visitor/visitors.css';

const COURIER_COMPANIES = [
  'Amazon',
  'Flipkart',
  'Blinkit',
  'Zepto',
  'Swiggy Instamart',
  'Dunzo',
  'Delhivery',
  'Blue Dart',
  'India Post',
  'Other',
];

/**
 * Delivery-only gate form — courier + parcel fields (no vehicle/persons clutter).
 */
export default function DeliveryEntryForm({
  title = 'Log Delivery',
  submitLabel = 'Log delivery',
  onSubmit,
  showToast,
}) {
  const [courierName, setCourierName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState(COURIER_COMPANIES[0]);
  const [trackingId, setTrackingId] = useState('');
  const [flat, setFlat] = useState('');
  const [parcelNote, setParcelNote] = useState('');
  const [leaveAtGate, setLeaveAtGate] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!courierName.trim() || !phone.trim() || !flat.trim()) {
      showToast?.('error', 'Missing fields', 'Courier name, phone and flat are required.');
      return;
    }
    if (phone.trim().length !== 10) {
      showToast?.('error', 'Invalid phone', 'Enter a valid 10-digit number.');
      return;
    }

    const noteParts = [
      company ? `Company: ${company}` : '',
      trackingId.trim() ? `Tracking: ${trackingId.trim()}` : '',
      parcelNote.trim() || '',
    ].filter(Boolean);

    setSubmitting(true);
    try {
      await onSubmit({
        name: courierName.trim(),
        phone: phone.trim(),
        flat: flat.trim(),
        purpose: 'Delivery',
        persons: 1,
        vehicle: '',
        vtype: '',
        note: noteParts.join(' | '),
        notify: true,
        preapprove: leaveAtGate,
        visitorType: 'delivery',
        photoSrc: null,
      });
      setCourierName('');
      setPhone('');
      setCompany(COURIER_COMPANIES[0]);
      setTrackingId('');
      setFlat('');
      setParcelNote('');
      setLeaveAtGate(true);
    } catch (err) {
      showToast?.(
        'error',
        'Delivery log failed',
        err?.response?.data?.message || err.message || 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

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
          <div className="avf-card-title">Courier</div>
          <div className="avf-grid-2">
            <div className="avf-field">
              <label>
                Courier name <span className="avf-req">*</span>
              </label>
              <input
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                placeholder="Delivery person name"
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
              <label>Company</label>
              <select value={company} onChange={(e) => setCompany(e.target.value)}>
                {COURIER_COMPANIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="avf-field">
              <label>Tracking / order ID</label>
              <input
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        <div className="avf-card">
          <div className="avf-card-title">Parcel</div>
          <div className="avf-field">
            <label>
              Deliver to flat <span className="avf-req">*</span>
            </label>
            <input
              value={flat}
              onChange={(e) => setFlat(e.target.value)}
              placeholder="e.g. A-101 or 101"
            />
          </div>
          <div className="avf-field">
            <label>Parcel note</label>
            <input
              value={parcelNote}
              onChange={(e) => setParcelNote(e.target.value)}
              placeholder="e.g. Grocery bag, documents, fragile"
            />
          </div>
          <div className="avf-toggle-row" style={{ marginTop: 8 }}>
            <div>
              <div className="avf-tr-title">Leave at gate</div>
              <div className="avf-tr-sub">No resident wait — ready to hand over at gate</div>
            </div>
            <button
              type="button"
              className={`avf-toggle${leaveAtGate ? ' avf-toggle--on' : ''}`}
              onClick={() => setLeaveAtGate((v) => !v)}
              aria-label="Toggle leave at gate"
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
