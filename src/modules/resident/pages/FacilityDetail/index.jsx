import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AmenityIcon from '@/modules/resident/components/AmenityIcon';
import { PageHeader, StatusLine } from '@/modules/resident/components/ResidentShell';
import { ResidentNote } from '@/modules/resident/components/ResidentConfirm';
import { useLoad } from '@/modules/resident/components/useLoad';
import { bookFacility, getBookableFacility } from '@/modules/resident/services/facility.service';
import '@/modules/resident/styles/facility/facility.css';

const EMPTY = { date: '', slotId: '', guests: 1, purpose: '' };

function todayLocal() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function prettyDate(value) {
  const [y, m, d] = String(value || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FacilityDetailPage() {
  const { id } = useParams();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('ok');
  const date = form.date || todayLocal();
  const { loading, error, data, reload } = useLoad(() => getBookableFacility(id, date), [id, date]);
  const slots = Array.isArray(data?.slots) ? data.slots : [];
  const slot = slots.find((item) => item.id === form.slotId);
  const fee = Number(data?.fee) || 0;
  const ready = Boolean(form.date && form.slotId);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeGuests(step) {
    set('guests', Math.max(1, Math.min(50, (Number(form.guests) || 1) + step)));
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (busy || !ready) return;
    setBusy(true);
    setMessage('');
    try {
      const booking = await bookFacility({ ...form, facilityId: id });
      setTone('ok');
      setMessage(`Booked ${booking.code}. Status ${booking.status}.`);
      setForm(EMPTY);
    } catch (err) {
      setTone('err');
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link to="/resident/facilities" className="res-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        All facilities
      </Link>
      <PageHeader title={data?.name || 'Facility'} />

      <StatusLine loading={loading} error={error} onRetry={reload}>
        <form className="res-book" onSubmit={onSubmit}>
          <section className="res-card">
            <div className="res-card-head">
              <div>
                <h2>Booking details</h2>
              </div>
            </div>

            <div className="res-card-body res-book-body">
              <section className="res-fieldset">
                <div className="res-fieldset-head">
                  <span className="res-fieldset-num">1</span>
                  <h3>Pick a date</h3>
                </div>
                <label className="res-book-date">Date *
                  <input type="date" required min={todayLocal()} value={form.date} onChange={(e) => set('date', e.target.value)} />
                </label>
              </section>

              <section className="res-fieldset">
                <div className="res-fieldset-head">
                  <span className="res-fieldset-num">2</span>
                  <h3>Choose a slot</h3>
                </div>
                {slots.length ? (
                  <div className="res-timeslots" role="radiogroup" aria-label="Available slots">
                    {slots.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={form.slotId === item.id}
                        className={`res-timeslot${form.slotId === item.id ? ' is-on' : ''}`}
                        onClick={() => set('slotId', item.id)}
                      >
                        <strong>{item.label || `${item.startTime} – ${item.endTime}`}</strong>
                        <span>{fee ? `₹${fee}` : 'Free'}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="res-meta">No slots are open for this facility right now.</p>
                )}
              </section>

              <section className="res-fieldset">
                <div className="res-fieldset-head">
                  <span className="res-fieldset-num">3</span>
                  <h3>Guests & purpose</h3>
                </div>
                <div className="res-form">
                  <label>Number of guests
                    <span className="res-stepper">
                      <button type="button" aria-label="Fewer guests" onClick={() => changeGuests(-1)} disabled={Number(form.guests) <= 1}>−</button>
                      <input type="number" min="1" max="50" value={form.guests} onChange={(e) => set('guests', e.target.value)} />
                      <button type="button" aria-label="More guests" onClick={() => changeGuests(1)}>+</button>
                    </span>
                  </label>
                  <label>Purpose (optional)
                    <input value={form.purpose} onChange={(e) => set('purpose', e.target.value)} placeholder="e.g. Birthday party" />
                  </label>
                </div>
              </section>
            </div>
          </section>

          <aside className="res-card res-book-summary">
            <div className="res-book-summary-head">
              <AmenityIcon name={data?.name} />
              <div>
                <strong>{data?.name}</strong>
                <span className="res-meta">{data?.hours}</span>
              </div>
            </div>

            <dl className="res-book-lines">
              <div>
                <dt>Date</dt>
                <dd>{form.date ? prettyDate(form.date) : <span className="res-book-missing">Not selected</span>}</dd>
              </div>
              <div>
                <dt>Slot</dt>
                <dd>{slot ? (slot.label || `${slot.startTime} – ${slot.endTime}`) : <span className="res-book-missing">Not selected</span>}</dd>
              </div>
              <div>
                <dt>Guests</dt>
                <dd>{form.guests || 1}</dd>
              </div>
            </dl>

            <div className="res-book-total">
              <span>Total</span>
              <strong>{fee ? `₹${fee}` : 'Free'}</strong>
            </div>

            <div className="res-book-actions">
              {message ? (
                <ResidentNote tone={tone}>
                  {message}
                  {tone === 'ok' ? <> <Link to="/resident/bookings">View My Bookings</Link></> : null}
                </ResidentNote>
              ) : null}
              <button type="submit" className="res-btn res-btn--primary res-btn--block" disabled={busy || !ready}>
                {busy ? 'Booking…' : 'Confirm booking'}
              </button>
            </div>
          </aside>
        </form>
      </StatusLine>
    </>
  );
}
