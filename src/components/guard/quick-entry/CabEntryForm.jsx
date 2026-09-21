import { useCallback, useEffect, useRef, useState } from 'react';
import '@/styles/guard/visitor/visitors.css';
import { searchGuardFlats } from '@/services/guard.service';
import GatePhotoCapture from '@/components/guard/shared/GatePhotoCapture';

const CAB_SERVICES = ['Uber', 'Ola', 'Rapido', 'Local / Other'];
const TRIP_PURPOSES = ['Pickup', 'Drop', 'Guest'];

function flatLabel(f) {
  return (
    f.flat_number ||
    f.flatNoLabel ||
    (f.wingCode && f.flatNo ? `${f.wingCode}-${f.flatNo}` : null) ||
    f.flatNo ||
    ''
  );
}

/**
 * Minimal Add Cab form — vehicle + flat required; entry time is server-side.
 * Optional driver face capture (same as visitor / delivery).
 */
export default function CabEntryForm({ onSubmit, showToast }) {
  const [vehicle, setVehicle] = useState('');
  const [driverName, setDriverName] = useState('');
  const [service, setService] = useState(CAB_SERVICES[0]);
  const [flat, setFlat] = useState('');
  const [tripPurpose, setTripPurpose] = useState(TRIP_PURPOSES[0]);
  const [photoSrc, setPhotoSrc] = useState(null);
  const [flatHits, setFlatHits] = useState([]);
  const [flatOpen, setFlatOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setFlatOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const searchFlats = useCallback((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!q || q.trim().length < 1) {
        setFlatHits([]);
        return;
      }
      try {
        const rows = await searchGuardFlats(q.trim(), 12);
        setFlatHits(rows || []);
        setFlatOpen(true);
      } catch {
        setFlatHits([]);
      }
    }, 220);
  }, []);

  async function handleSubmit() {
    if (!vehicle.trim()) {
      showToast?.('error', 'Vehicle required', 'Enter the cab vehicle number.');
      return;
    }
    if (!flat.trim()) {
      showToast?.('error', 'Flat required', 'Select who the cab is coming for.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        vehicle: vehicle.trim().toUpperCase(),
        driverName: driverName.trim(),
        service,
        flat: flat.trim(),
        tripPurpose,
        photoSrc: photoSrc || null,
      });
      setVehicle('');
      setDriverName('');
      setService(CAB_SERVICES[0]);
      setFlat('');
      setTripPurpose(TRIP_PURPOSES[0]);
      setPhotoSrc(null);
      setFlatHits([]);
    } catch (err) {
      showToast?.(
        'error',
        'Cab log failed',
        err?.response?.data?.message || err.message || 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="avf-root">
      <div className="vp-header avf-form-heading">
        <div className="vp-header-titles">
          <h2 className="vp-page-title" style={{ fontSize: 17 }}>
            Add Cab
          </h2>
        </div>
      </div>

      <div className="avf-form-grid">
        <GatePhotoCapture
          value={photoSrc}
          onChange={setPhotoSrc}
          showToast={showToast}
          title="Driver photo"
          subject="driver"
        />

        <div className="avf-card">
          <div className="avf-card-title">Cab details</div>
          <div className="avf-grid-2">
            <div className="avf-field">
              <label>
                Vehicle Number <span className="avf-req">*</span>
              </label>
              <input
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value.toUpperCase())}
                placeholder="MH12AB1234"
                style={{ fontFamily: 'var(--vp-mono)', letterSpacing: '0.05em' }}
                autoFocus
              />
            </div>
            <div className="avf-field">
              <label>Driver Name</label>
              <input
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="avf-field">
            <label>Cab Service</label>
            <select value={service} onChange={(e) => setService(e.target.value)}>
              {CAB_SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="avf-card">
          <div className="avf-card-title">Coming for</div>
          <div className="avf-field" ref={wrapRef} style={{ position: 'relative' }}>
            <label>
              Resident / Flat <span className="avf-req">*</span>
            </label>
            <input
              value={flat}
              onChange={(e) => {
                setFlat(e.target.value);
                searchFlats(e.target.value);
              }}
              onFocus={() => flatHits.length && setFlatOpen(true)}
              placeholder="Search flat or resident…"
              autoComplete="off"
            />
            {flatOpen && flatHits.length > 0 ? (
              <ul className="cab-flat-dropdown">
                {flatHits.map((f) => {
                  const label = flatLabel(f);
                  return (
                    <li key={f.flatId || f.id || label}>
                      <button
                        type="button"
                        onClick={() => {
                          setFlat(label);
                          setFlatOpen(false);
                          setFlatHits([]);
                        }}
                      >
                        <span className="cab-flat-label">{label}</span>
                        {f.residentName ? (
                          <span className="cab-flat-res">{f.residentName}</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
          <div className="avf-field">
            <label>Purpose</label>
            <select value={tripPurpose} onChange={(e) => setTripPurpose(e.target.value)}>
              {TRIP_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          className="avf-submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving…' : 'Save cab entry'}
        </button>
      </div>
    </div>
  );
}
