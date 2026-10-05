import { useState } from 'react';
import '@/modules/guard/styles/delivery/delivery.css';
import GatePhotoCapture from '@/modules/guard/components/shared/GatePhotoCapture';
import { normalizePhone } from '@/modules/guard/services/core/http';

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
 * Delivery create form — fields match backend PDF (FormData via delivery.service).
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
  const [photoSrc, setPhotoSrc] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!courierName.trim() || !phone.trim() || !flat.trim() || !company.trim()) {
      showToast?.('error', 'Missing fields', 'Courier name, phone, company and flat are required.');
      return;
    }
    const phoneDigits = normalizePhone(phone);
    if (phoneDigits.length !== 10) {
      showToast?.('error', 'Invalid phone', 'Enter a valid 10-digit number.');
      return;
    }
    if (company.trim().length > 50) {
      showToast?.('error', 'Company too long', 'Company must be 50 characters or fewer.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        courierName: courierName.trim(),
        phone: phoneDigits,
        company: company.trim().slice(0, 50),
        flat: flat.trim(),
        trackingId: trackingId.trim() || undefined,
        parcelNote: parcelNote.trim() || undefined,
        photo: photoSrc || null,
      });
      setCourierName('');
      setPhone('');
      setCompany(COURIER_COMPANIES[0]);
      setTrackingId('');
      setFlat('');
      setParcelNote('');
      setPhotoSrc(null);
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
        <GatePhotoCapture
          value={photoSrc}
          onChange={setPhotoSrc}
          showToast={showToast}
          title="Courier photo"
          subject="courier"
        />

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
          <div className="avf-grid-2">
            <div className="avf-field">
              <label>
                Company <span className="avf-req">*</span>
              </label>
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
