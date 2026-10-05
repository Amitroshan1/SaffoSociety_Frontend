import { useMemo, useState } from 'react';
import { PageHeader, StatusLine, statusLabel } from '@/modules/resident/components/ResidentShell';
import ResidentConfirm, { ResidentNote } from '@/modules/resident/components/ResidentConfirm';
import { useLoad } from '@/modules/resident/components/useLoad';
import { cancelMyBooking, listMyBookings } from '@/modules/resident/services/facility.service';
import '@/modules/resident/styles/facility/facility.css';

const CAN_CANCEL = ['pending', 'approved', 'confirmed'];
const UPCOMING = ['pending', 'approved', 'confirmed', 'checked_in'];

const TABS = [
  { key: 'upcoming', label: 'Upcoming', test: (row) => UPCOMING.includes(row.status) },
  { key: 'past', label: 'Past', test: (row) => !UPCOMING.includes(row.status) },
  { key: 'all', label: 'All', test: () => true },
];

const EMPTY = {
  upcoming: { title: 'No upcoming bookings', body: 'Book a facility and it will show up here.' },
  past: { title: 'No past bookings', body: 'Completed and cancelled bookings will show up here.' },
  all: { title: 'No bookings yet', body: 'Book a facility and it will show up here.' },
};

function parseDate(value) {
  const [y, m, d] = String(value || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatClock(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(value || '').trim();
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export default function BookingsPage() {
  const { loading, error, data, reload } = useLoad(() => listMyBookings(), []);
  const [tab, setTab] = useState('upcoming');
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [tone, setTone] = useState('ok');

  const all = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const counts = useMemo(
    () => Object.fromEntries(TABS.map((item) => [item.key, all.filter(item.test).length])),
    [all],
  );
  const rows = useMemo(() => {
    const test = TABS.find((item) => item.key === tab)?.test || (() => true);
    const list = all.filter(test);
    const key = (row) => `${row.date || ''} ${row.startTime || ''}`;
    return tab === 'upcoming'
      ? list.sort((a, b) => key(a).localeCompare(key(b)))
      : list.sort((a, b) => key(b).localeCompare(key(a)));
  }, [all, tab]);

  async function cancel() {
    if (!pending || busy) return;
    setBusy(true);
    setNote('');
    try {
      await cancelMyBooking(pending.id);
      setTone('ok');
      setNote(`${pending.code} cancelled.`);
      setPending(null);
      await reload();
    } catch (err) {
      setTone('err');
      setNote(err.message);
    } finally {
      setBusy(false);
    }
  }

  const empty = EMPTY[tab];

  return (
    <>
      <PageHeader title="My Bookings" />

      <section className="res-card">
        <div className="res-toolbar">
          <div className="res-tabs" role="tablist" aria-label="Filter bookings">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={tab === item.key}
                className={`res-tab${tab === item.key ? ' is-on' : ''}`}
                onClick={() => setTab(item.key)}
              >
                {item.label}
                <span className="res-tab-count">{counts[item.key] || 0}</span>
              </button>
            ))}
          </div>
        </div>

        {note ? <div className="res-card-note"><ResidentNote tone={tone}>{note}</ResidentNote></div> : null}

        <div className="res-card-body">
          <StatusLine loading={loading} error={error} onRetry={reload}>
            {rows.length ? (
              <ul className="res-booking-list">
                {rows.map((row) => {
                  const date = parseDate(row.date);
                  return (
                    <li key={row.id} className={`res-booking is-${row.status}`}>
                      <div className="res-booking-date" aria-hidden="true">
                        <span>{date ? date.toLocaleDateString([], { month: 'short' }) : '—'}</span>
                        <strong>{date ? date.getDate() : ''}</strong>
                      </div>

                      <div className="res-booking-main">
                        <div className="res-booking-title">
                          <strong>{row.amenity}</strong>
                          <span className="res-mono res-booking-code">{row.code}</span>
                        </div>
                        <div className="res-booking-meta">
                          <span>{date ? date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : row.date}</span>
                          <span>{formatClock(row.startTime)} – {formatClock(row.endTime)}</span>
                          {row.guests ? <span>{row.guests} {Number(row.guests) === 1 ? 'guest' : 'guests'}</span> : null}
                          {row.purpose ? <span>{row.purpose}</span> : null}
                        </div>
                      </div>

                      <div className="res-booking-side">
                        <span className={`res-badge res-badge--${row.status}`}>{statusLabel(row.status)}</span>
                        {CAN_CANCEL.includes(row.status) ? (
                          <button type="button" className="res-btn res-btn--danger" disabled={busy} onClick={() => setPending(row)}>Cancel</button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="res-empty">
                <strong>{empty.title}</strong>
                <p>{empty.body}</p>
              </div>
            )}
          </StatusLine>
        </div>
      </section>

      <ResidentConfirm
        open={Boolean(pending)}
        danger
        busy={busy}
        title="Cancel booking"
        message={pending ? `Cancel ${pending.amenity} on ${pending.date}, ${pending.startTime} – ${pending.endTime} (${pending.code})?` : ''}
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        onCancel={() => setPending(null)}
        onConfirm={cancel}
      />
    </>
  );
}
