import { useMemo, useState } from 'react';
import { PageHeader, StatusLine } from '@/modules/resident/components/ResidentShell';
import { ResidentNote } from '@/modules/resident/components/ResidentConfirm';
import { useLoad } from '@/modules/resident/components/useLoad';
import VisitorPhoto from '@/modules/resident/components/VisitorPhoto';
import { listMyVisits, sendVisitorInvite } from '@/modules/resident/services/residentPortal.service';
import '@/modules/resident/styles/visitor/visitor.css';

const EMPTY = { name: '', phone: '', purpose: '', type: 'guest', expectedAt: '', persons: 1, vehicle: '' };

const TYPES = [
  { value: 'guest', label: 'Guest', hint: 'Friends & family' },
  { value: 'delivery', label: 'Delivery', hint: 'Parcels & food' },
  { value: 'vendor', label: 'Staff', hint: 'Maid, driver, technician' },
  { value: 'other', label: 'Other', hint: 'Anyone else' },
];

function whenLabel(value) {
  if (!value) return 'Any time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Any time';
  return date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function nowLocal() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function InvitePage() {
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const visits = useLoad(listMyVisits, []);

  const upcoming = useMemo(
    () => (Array.isArray(visits.data) ? visits.data : [])
      .filter((visit) => visit.status === 'scheduled')
      .sort((a, b) => String(a.expectedAt || '').localeCompare(String(b.expectedAt || ''))),
    [visits.data],
  );

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changePersons(step) {
    set('persons', Math.max(1, Math.min(20, (Number(form.persons) || 1) + step)));
  }

  function reset() {
    setForm(EMPTY);
    setError('');
    setMessage('');
  }

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await sendVisitorInvite(form);
      setMessage('Invitation sent. Guard can allow this guest without waiting for you.');
      setForm(EMPTY);
      visits.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Invite guest" />

      <div className="res-invite">
        <form className="res-card res-invite-form" onSubmit={onSubmit}>
          <div className="res-card-head">
            <div>
              <h2>New invitation</h2>
            </div>
            <span className="res-badge res-badge--approved">Pre-approved entry</span>
          </div>

          <div className="res-card-body">
            <section className="res-fieldset">
              <div className="res-fieldset-head">
                <span className="res-fieldset-num">1</span>
                <h3>Who is coming?</h3>
              </div>
              <div className="res-form">
                <label>Full name *
                  <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Rahul Mehta" autoComplete="off" />
                </label>
                <label>Mobile number *
                  <span className="res-input-group">
                    <span className="res-input-prefix">+91</span>
                    <input
                      required
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      title="Enter a 10 digit mobile number"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
                      placeholder="10 digit number"
                    />
                  </span>
                </label>
              </div>
            </section>

            <section className="res-fieldset">
              <div className="res-fieldset-head">
                <span className="res-fieldset-num">2</span>
                <h3>Visitor type</h3>
              </div>
              <div className="res-type-picker" role="radiogroup" aria-label="Visitor type">
                {TYPES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    role="radio"
                    aria-checked={form.type === item.value}
                    className={`res-type-option${form.type === item.value ? ' is-on' : ''}`}
                    onClick={() => set('type', item.value)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.hint}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="res-fieldset">
              <div className="res-fieldset-head">
                <span className="res-fieldset-num">3</span>
                <h3>Visit details</h3>
              </div>
              <div className="res-form">
                <label className="res-span">Purpose of visit *
                  <input required value={form.purpose} onChange={(e) => set('purpose', e.target.value)} placeholder="e.g. Family dinner" />
                </label>
                <label>Expected arrival
                  <input type="datetime-local" min={nowLocal()} value={form.expectedAt} onChange={(e) => set('expectedAt', e.target.value)} />
                </label>
                <label>Number of persons
                  <span className="res-stepper">
                    <button type="button" aria-label="Fewer persons" onClick={() => changePersons(-1)} disabled={Number(form.persons) <= 1}>−</button>
                    <input type="number" min="1" max="20" value={form.persons} onChange={(e) => set('persons', e.target.value)} />
                    <button type="button" aria-label="More persons" onClick={() => changePersons(1)}>+</button>
                  </span>
                </label>
                <label className="res-span">Vehicle number (optional)
                  <input className="res-mono" value={form.vehicle} onChange={(e) => set('vehicle', e.target.value.toUpperCase())} placeholder="e.g. MH01AB1234" />
                </label>
              </div>
            </section>

            <ResidentNote tone="err">{error}</ResidentNote>
            <ResidentNote>{message}</ResidentNote>
          </div>

          <div className="res-form-foot">
            <div className="res-actions">
              <button type="button" className="res-btn res-btn--ghost" onClick={reset} disabled={busy}>Clear</button>
              <button type="submit" className="res-btn res-btn--primary" disabled={busy}>{busy ? 'Sending…' : 'Send Invitation'}</button>
            </div>
          </div>
        </form>

        <aside className="res-invite-side">
          <section className="res-card">
            <div className="res-card-head">
              <div>
                <h2>Upcoming invites</h2>
              </div>
              {upcoming.length ? <span className="res-tab-count">{upcoming.length}</span> : null}
            </div>
            <div className="res-card-body">
              <StatusLine loading={visits.loading} error={visits.error} onRetry={visits.reload}>
                {upcoming.length ? (
                  <ul className="res-invite-list">
                    {upcoming.map((visit) => (
                      <li key={visit.id}>
                        <VisitorPhoto visit={visit} size={36} />
                        <div className="res-visitor-text">
                          <strong>{visit.name}</strong>
                          <span className="res-meta">{visit.purpose} · {visit.persons || 1} {Number(visit.persons) > 1 ? 'persons' : 'person'}</span>
                        </div>
                        <span className="res-invite-when">{whenLabel(visit.expectedAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="res-empty">
                    <strong>No upcoming invites</strong>
                    <p>Guests you invite will appear here.</p>
                  </div>
                )}
              </StatusLine>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
