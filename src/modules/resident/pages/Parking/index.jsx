import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader, StatusLine } from '@/modules/resident/components/ResidentShell';
import ResidentConfirm, { ResidentNote } from '@/modules/resident/components/ResidentConfirm';
import ResidentDialog from '@/modules/resident/components/ResidentDialog';
import { useLoad } from '@/modules/resident/components/useLoad';
import {
  deleteMyVehicle,
  getGuestParking,
  getMyParking,
  getMyVehicles,
  getParkingLogs,
  getVisitorSlots,
  requestGuestParking,
  saveMyVehicle,
} from '@/modules/resident/services/parking.service';
import '@/modules/resident/styles/parking/parking.css';

const TYPES = ['car', 'bike', 'scooter', 'ev', 'commercial', 'bicycle', 'other'];
const EMPTY_VEHICLE = { vehicleNumber: '', vehicleType: 'car', make: '', model: '', color: '', primary: false };
const EMPTY_VISITOR = { vehicleNumber: '', vehicleType: 'car', purpose: '', notes: '', slotId: '', expectedDate: '' };
const SLOT_TEXT = { available: 'Free', occupied: 'Occupied', reserved: 'Reserved' };

function todayInput() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const blankVisitor = () => ({ ...EMPTY_VISITOR, expectedDate: todayInput() });

const VISITOR_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'expected', label: 'Expected' },
  { key: 'inside', label: 'Inside' },
  { key: 'exited', label: 'Exited' },
];

const STATUS_TEXT = { expected: 'Expected', inside: 'Inside', exited: 'Exited', cancelled: 'Cancelled' };

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function stamp(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  let day = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  if (date.toDateString() === now.toDateString()) day = 'Today';
  else if (date.toDateString() === yesterday.toDateString()) day = 'Yesterday';
  return { time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), day };
}

function duration(from, to) {
  if (!from) return '—';
  const ms = (to ? new Date(to) : new Date()) - new Date(from);
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function Stamp({ value, empty = '—' }) {
  const s = stamp(value);
  if (!s) return <span className="res-muted-dash">{empty}</span>;
  return (
    <span className="res-time">
      <strong>{s.time}</strong>
      <span className="res-meta">{s.day}</span>
    </span>
  );
}

function Svg({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const CarIcon = () => (
  <Svg>
    <path d="M5 17h14v-4.5l-1.8-4.6A2 2 0 0 0 15.3 6.6H8.7a2 2 0 0 0-1.9 1.3L5 12.5Z" />
    <path d="M5 12.5h14" />
    <circle cx="8" cy="17" r="1.6" />
    <circle cx="16" cy="17" r="1.6" />
  </Svg>
);

const BikeIcon = () => (
  <Svg>
    <circle cx="6" cy="16" r="3.5" />
    <circle cx="18" cy="16" r="3.5" />
    <path d="M6 16l4-7h5l3 7" />
    <path d="M14 6h2" />
  </Svg>
);

function VehicleIcon({ type }) {
  return ['bike', 'scooter', 'bicycle'].includes(type) ? <BikeIcon /> : <CarIcon />;
}

function CopyButton({ value, compact = false }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      setDone(false);
    }
  }
  if (compact) {
    return (
      <button
        type="button"
        className={`res-icon-copy${done ? ' is-done' : ''}`}
        onClick={copy}
        aria-label={done ? 'Copied' : `Copy ${value}`}
        title={done ? 'Copied' : 'Copy'}
      >
        {done ? (
          <Svg><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
        ) : (
          <Svg><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></Svg>
        )}
      </button>
    );
  }
  return (
    <button type="button" className="res-btn res-btn--secondary res-copy-btn" onClick={copy}>
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

function Stat({ tone, label, value, sub, icon }) {
  return (
    <div className="res-stat">
      <div className="res-stat-top">
        <span className="res-stat-label">{label}</span>
        <span className={`res-stat-icon res-stat-icon--${tone}`}>{icon}</span>
      </div>
      <strong className="res-stat-value">{value}</strong>
      {sub ? <span className="res-stat-sub">{sub}</span> : null}
    </div>
  );
}

export default function ParkingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const parking = useLoad(() => getMyParking(), []);
  const vehicles = useLoad(() => getMyVehicles(), []);
  const guests = useLoad(() => getGuestParking(), []);
  const logs = useLoad(() => getParkingLogs(), []);
  const vslots = useLoad(() => getVisitorSlots(), []);

  const [view, setView] = useState('visitors');
  const [filter, setFilter] = useState('all');

  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(EMPTY_VEHICLE);
  const [editing, setEditing] = useState(null);
  const [vehicleError, setVehicleError] = useState('');
  const [vehicleNote, setVehicleNote] = useState('');
  const [removeRow, setRemoveRow] = useState(null);

  const [visitorOpen, setVisitorOpen] = useState(false);
  const [visitorForm, setVisitorForm] = useState(blankVisitor);
  const [visitorError, setVisitorError] = useState('');
  const [visitorResult, setVisitorResult] = useState(null);

  const [busy, setBusy] = useState(false);

  const slots = Array.isArray(parking.data) ? parking.data : [];
  const myVehicles = Array.isArray(vehicles.data) ? vehicles.data : [];
  const guestRows = useMemo(() => (Array.isArray(guests.data) ? guests.data : []), [guests.data]);
  const logRows = useMemo(() => (Array.isArray(logs.data) ? logs.data : []), [logs.data]);
  const primarySlot = slots[0] || null;
  const visitorSlots = Array.isArray(vslots.data) ? vslots.data : [];
  const freeSlots = visitorSlots.filter((slot) => slot.status === 'available').length;
  const slotsFull = !vslots.loading && !vslots.error && visitorSlots.length > 0 && freeSlots === 0;

  const guestCounts = useMemo(() => {
    const counts = { all: guestRows.length, expected: 0, inside: 0, exited: 0 };
    guestRows.forEach((row) => {
      if (counts[row.status] !== undefined) counts[row.status] += 1;
    });
    return counts;
  }, [guestRows]);

  const shownGuests = filter === 'all' ? guestRows : guestRows.filter((row) => row.status === filter);
  const movesToday = logRows.filter((row) => isToday(row.entryTime) || isToday(row.exitTime)).length
    + guestRows.filter((row) => isToday(row.entryTime) || isToday(row.exitTime)).length;
  const slotInside = primarySlot && ['inside', 'parked', 'occupied'].includes(String(primarySlot.status).toLowerCase());

  useEffect(() => {
    if (location.state?.open === 'visitor') {
      setVisitorOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  function openAddVehicle() {
    setEditing(null);
    setVehicleForm(EMPTY_VEHICLE);
    setVehicleError('');
    setVehicleOpen(true);
  }

  function openEditVehicle(row) {
    setEditing(row.id);
    setVehicleForm({ ...EMPTY_VEHICLE, ...row });
    setVehicleError('');
    setVehicleOpen(true);
  }

  function openVisitor() {
    setVisitorForm(blankVisitor());
    setVisitorError('');
    setVisitorResult(null);
    setVisitorOpen(true);
    vslots.reload();
  }

  async function saveVehicle(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setVehicleError('');
    try {
      const row = await saveMyVehicle(vehicleForm, editing);
      setVehicleNote(`${row.vehicleNumber} saved${row.parkingCode ? ` · Parking code ${row.parkingCode}` : ''}.`);
      setVehicleOpen(false);
      setEditing(null);
      setVehicleForm(EMPTY_VEHICLE);
      await Promise.all([vehicles.reload(), parking.reload()]);
    } catch (err) {
      setVehicleError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeVehicle() {
    if (!removeRow || busy) return;
    setBusy(true);
    try {
      await deleteMyVehicle(removeRow.id);
      setVehicleNote(`${removeRow.vehicleNumber} removed.`);
      setRemoveRow(null);
      await Promise.all([vehicles.reload(), parking.reload()]);
    } catch (err) {
      setVehicleNote(err.message);
      setRemoveRow(null);
    } finally {
      setBusy(false);
    }
  }

  async function requestVisitor(event) {
    event.preventDefault();
    if (busy) return;
    if (visitorSlots.length > 0 && !visitorForm.slotId) {
      setVisitorError(slotsFull ? 'All visitor slots are full.' : 'Select a free visitor slot.');
      return;
    }
    if (!visitorForm.expectedDate || visitorForm.expectedDate < todayInput()) {
      setVisitorError('Pick today or a future date.');
      return;
    }
    setBusy(true);
    setVisitorError('');
    try {
      setVisitorResult(await requestGuestParking(visitorForm));
      setVisitorForm(blankVisitor());
      setView('visitors');
      setFilter('all');
      await Promise.all([guests.reload(), vslots.reload()]);
    } catch (err) {
      setVisitorError(err.message);
      setG('slotId', '');
      vslots.reload();
    } finally {
      setBusy(false);
    }
  }

  const setV = (key, value) => setVehicleForm((current) => ({ ...current, [key]: value }));
  const setG = (key, value) => setVisitorForm((current) => ({ ...current, [key]: value }));

  return (
    <>
      <PageHeader
        title="Parking"
        action={(
          <button type="button" className="res-btn res-btn--primary" onClick={openVisitor}>
            Register visitor vehicle
          </button>
        )}
      />

      <div className="res-park-top">
        <section className="res-park-assigned" aria-label="Your parking">
          <StatusLine loading={parking.loading} error={parking.error} onRetry={parking.reload}>
            {primarySlot ? (
              <div className="res-park-assigned-inner">
                <div className="res-park-assigned-slot">
                  <span className="res-park-eyebrow">Your parking</span>
                  <div className="res-park-value-row">
                    <strong className="res-park-slotcode">{primarySlot.slotCode}</strong>
                    <span className={`res-pstatus res-pstatus--${slotInside ? 'inside' : 'exited'}`}>
                      {slotInside ? 'Parked' : 'Outside'}
                    </span>
                  </div>
                  <span className="res-park-assigned-meta">
                    Assigned parking slot
                    {slots.length > 1 ? ` · +${slots.length - 1} more` : ''}
                  </span>
                </div>
                <div className="res-park-assigned-code">
                  <span className="res-park-eyebrow">Parking code</span>
                  <div className="res-park-value-row">
                    <strong className="res-park-passcode res-mono">{primarySlot.parkingCode || '—'}</strong>
                    {primarySlot.parkingCode ? <CopyButton value={primarySlot.parkingCode} compact /> : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="res-empty">
                <strong>No slot allocated</strong>
                <p>Contact your society office.</p>
              </div>
            )}
          </StatusLine>
        </section>
        <Stat
          tone="green"
          label="Visitors inside"
          value={guestCounts.inside}
          sub="Right now"
          icon={<CarIcon />}
        />
        <Stat
          tone="amber"
          label="Expected visitors"
          value={guestCounts.expected}
          sub="Pass issued, not arrived"
          icon={<Svg><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>}
        />
        <Stat
          tone={slotsFull ? 'red' : 'blue'}
          label="Free visitor slots"
          value={vslots.loading ? '—' : `${freeSlots} / ${visitorSlots.length}`}
          sub={slotsFull ? 'All slots are full' : `${movesToday} movements today`}
          icon={<Svg><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M9 10v10" /><path d="M15 10v10" /></Svg>}
        />
      </div>

      <section className="res-card res-park-activity">
        <div className="res-park-activity-head">
          <h2>Parking activity</h2>
          <div className="res-segmented" role="tablist" aria-label="Activity view">
            <button type="button" role="tab" aria-selected={view === 'visitors'} className={`res-segment${view === 'visitors' ? ' is-on' : ''}`} onClick={() => setView('visitors')}>
              Visitor parking <span className="res-segment-count">{guestCounts.all}</span>
            </button>
            <button type="button" role="tab" aria-selected={view === 'mine'} className={`res-segment${view === 'mine' ? ' is-on' : ''}`} onClick={() => setView('mine')}>
              My vehicles <span className="res-segment-count">{logRows.length}</span>
            </button>
          </div>
        </div>

        {view === 'visitors' ? (
          <>
            <div className="res-park-filters" role="group" aria-label="Filter by status">
              {VISITOR_FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={filter === item.key}
                  className={`res-subfilter${filter === item.key ? ' is-on' : ''}`}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                  <span>{guestCounts[item.key]}</span>
                </button>
              ))}
            </div>
            <div className="res-card-body res-dtable-wrap">
              <StatusLine loading={guests.loading} error={guests.error} onRetry={guests.reload}>
                <div className="res-dtable res-dtable--guests" role="table" aria-label="Visitor parking">
                  <div className="res-dtable-row res-dtable-head" role="row">
                    <span role="columnheader">Vehicle</span>
                    <span role="columnheader">Pass</span>
                    <span role="columnheader">Entered</span>
                    <span role="columnheader">Exited</span>
                    <span role="columnheader">Duration</span>
                    <span role="columnheader">Status</span>
                  </div>
                  {shownGuests.length ? shownGuests.map((row) => (
                      <div key={row.id} className={`res-dtable-row is-${row.status}`} role="row">
                        <span role="cell" className="res-dtable-vehicle">
                          <span className="res-vehicle-icon res-vehicle-icon--sm"><VehicleIcon type={row.vehicleType} /></span>
                          <span className="res-visitor-text">
                            <span className="res-plate">{row.vehicleNumber}</span>
                            <span className="res-meta">{row.purpose || row.vehicleType}</span>
                          </span>
                        </span>
                        <span role="cell" data-label="Pass" className="res-time">
                          <strong className="res-mono">{row.parkingCode}</strong>
                          <span className="res-meta">{row.slotCode ? `Slot ${row.slotCode}` : '—'}</span>
                        </span>
                        <span role="cell" data-label="Entered"><Stamp value={row.entryTime} empty="Not arrived" /></span>
                        <span role="cell" data-label="Exited"><Stamp value={row.exitTime} empty={row.status === 'inside' ? 'Still inside' : '—'} /></span>
                        <span role="cell" data-label="Duration" className="res-mono">
                          {row.entryTime ? duration(row.entryTime, row.exitTime) : '—'}
                        </span>
                        <span role="cell" data-label="Status">
                          <span className={`res-pstatus res-pstatus--${row.status}`}>{STATUS_TEXT[row.status] || row.status}</span>
                        </span>
                      </div>
                  )) : (
                    <div className="res-empty">
                      <strong>{filter === 'all' ? 'No visitor parking yet' : `No ${STATUS_TEXT[filter]?.toLowerCase()} visitors`}</strong>
                      <p>Register a visitor vehicle to issue a parking code.</p>
                    </div>
                  )}
                </div>
              </StatusLine>
            </div>
          </>
        ) : (
          <div className="res-card-body res-dtable-wrap">
            <StatusLine loading={logs.loading} error={logs.error} onRetry={logs.reload}>
              <div className="res-dtable res-dtable--logs" role="table" aria-label="My vehicle activity">
                <div className="res-dtable-row res-dtable-head" role="row">
                  <span role="columnheader">Vehicle</span>
                  <span role="columnheader">Slot</span>
                  <span role="columnheader">Entered</span>
                  <span role="columnheader">Exited</span>
                  <span role="columnheader">Duration</span>
                  <span role="columnheader">Status</span>
                </div>
                {logRows.length ? logRows.map((row) => {
                    const status = row.exitTime ? 'exited' : 'inside';
                    return (
                      <div key={row.id} className={`res-dtable-row is-${status}`} role="row">
                        <span role="cell" className="res-dtable-vehicle">
                          <span className="res-vehicle-icon res-vehicle-icon--sm"><CarIcon /></span>
                          <span className="res-plate">{row.vehicleNumber}</span>
                        </span>
                        <span role="cell" data-label="Slot" className="res-mono">{row.slotCode || '—'}</span>
                        <span role="cell" data-label="Entered"><Stamp value={row.entryTime} /></span>
                        <span role="cell" data-label="Exited"><Stamp value={row.exitTime} empty="Still inside" /></span>
                        <span role="cell" data-label="Duration" className="res-mono">{duration(row.entryTime, row.exitTime)}</span>
                        <span role="cell" data-label="Status">
                          <span className={`res-pstatus res-pstatus--${status}`}>{STATUS_TEXT[status]}</span>
                        </span>
                      </div>
                    );
                }) : (
                  <div className="res-empty">
                    <strong>No activity yet</strong>
                    <p>Entries and exits of your vehicles will show up here.</p>
                  </div>
                )}
              </div>
            </StatusLine>
          </div>
        )}
      </section>

      <section className="res-card res-park-vehicles">
        <div className="res-park-section-head">
          <h2>
            My vehicles
            {myVehicles.length ? <span className="res-segment-count">{myVehicles.length}</span> : null}
          </h2>
          <button type="button" className="res-btn res-btn--secondary res-btn--sm" onClick={openAddVehicle}>+ Add vehicle</button>
        </div>
        <div className="res-park-vehicles-body">
          {vehicleNote ? <ResidentNote>{vehicleNote}</ResidentNote> : null}
          <StatusLine loading={vehicles.loading} error={vehicles.error} onRetry={vehicles.reload}>
            {myVehicles.length ? (
              <ul className="res-vehicle-grid">
                {myVehicles.map((row) => (
                  <li key={row.id} className="res-vehicle-item">
                    <span className="res-vehicle-icon res-vehicle-icon--sm"><VehicleIcon type={row.vehicleType} /></span>
                    <div className="res-vehicle-main">
                      <div className="res-vehicle-title">
                        <span className="res-plate">{row.vehicleNumber}</span>
                        {row.primary ? <span className="res-pstatus res-pstatus--inside">Primary</span> : null}
                      </div>
                      <span className="res-meta">
                        {[`${row.make || ''} ${row.model || ''}`.trim(), row.color].filter(Boolean).join(' · ') || row.vehicleType}
                      </span>
                    </div>
                    <div className="res-vehicle-links">
                      <button type="button" className="res-link" onClick={() => openEditVehicle(row)}>Edit</button>
                      <button type="button" className="res-link res-link--danger" disabled={busy} onClick={() => setRemoveRow(row)}>Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="res-empty">
                <strong>No vehicles added</strong>
                <p>Add your vehicle so the guard can match it.</p>
              </div>
            )}
          </StatusLine>
        </div>
      </section>

      <ResidentDialog
        open={vehicleOpen}
        busy={busy}
        title={editing ? 'Edit vehicle' : 'Add vehicle'}
        onClose={() => setVehicleOpen(false)}
        footer={(
          <>
            <button type="button" className="res-btn res-btn--secondary" onClick={() => setVehicleOpen(false)} disabled={busy}>Cancel</button>
            <button type="submit" form="res-vehicle-form" className="res-btn res-btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save vehicle'}</button>
          </>
        )}
      >
        <form id="res-vehicle-form" className="res-form" onSubmit={saveVehicle}>
          <label>Vehicle number *
            <input required className="res-mono" value={vehicleForm.vehicleNumber} onChange={(e) => setV('vehicleNumber', e.target.value.toUpperCase())} placeholder="e.g. MH12AB1234" />
          </label>
          <label>Type
            <select value={vehicleForm.vehicleType} onChange={(e) => setV('vehicleType', e.target.value)}>
              {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label>Make<input value={vehicleForm.make} onChange={(e) => setV('make', e.target.value)} placeholder="e.g. Honda" /></label>
          <label>Model<input value={vehicleForm.model} onChange={(e) => setV('model', e.target.value)} placeholder="e.g. City" /></label>
          <label>Color<input value={vehicleForm.color} onChange={(e) => setV('color', e.target.value)} placeholder="e.g. White" /></label>
          <label className="res-check res-span">
            <input type="checkbox" checked={Boolean(vehicleForm.primary)} onChange={(e) => setV('primary', e.target.checked)} /> Primary vehicle
          </label>
          {vehicleError ? <div className="res-span"><ResidentNote tone="err">{vehicleError}</ResidentNote></div> : null}
        </form>
      </ResidentDialog>

      <ResidentDialog
        open={visitorOpen}
        busy={busy}
        title="Register visitor vehicle"
        onClose={() => setVisitorOpen(false)}
        footer={visitorResult ? (
          <>
            <button type="button" className="res-btn res-btn--secondary" onClick={() => setVisitorResult(null)}>Register another</button>
            <button type="button" className="res-btn res-btn--primary" onClick={() => setVisitorOpen(false)}>Done</button>
          </>
        ) : (
          <>
            <button type="button" className="res-btn res-btn--secondary" onClick={() => setVisitorOpen(false)} disabled={busy}>Cancel</button>
            <button
              type="submit"
              form="res-visitor-form"
              className="res-btn res-btn--primary"
              disabled={busy || vslots.loading || slotsFull || !visitorForm.slotId}
            >
              {busy ? 'Requesting…' : slotsFull ? 'Slots full' : 'Get parking code'}
            </button>
          </>
        )}
      >
        {visitorResult ? (
          <div className="res-pass-result">
            <span className="res-park-label">Visitor parking code</span>
            <strong className="res-mono">{visitorResult.parkingCode}</strong>
            <span className="res-meta">
              {[
                visitorResult.slotCode ? `Slot ${visitorResult.slotCode}` : '',
                visitorResult.expectedDate
                  ? new Date(`${visitorResult.expectedDate}T00:00`).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
                  : '',
              ].filter(Boolean).join(' · ')}
            </span>
            <CopyButton value={visitorResult.parkingCode} />
            <p>Share this code with your guest. The guard checks it at the gate.</p>
          </div>
        ) : (
          <form id="res-visitor-form" className="res-form" onSubmit={requestVisitor}>
            {slotsFull ? (
              <div className="res-span res-vslot-full" role="alert">
                <strong>All visitor slots are full</strong>
                <p>A slot frees up when a visitor vehicle leaves. Try again in a while.</p>
                <button type="button" className="res-btn res-btn--secondary res-copy-btn" onClick={vslots.reload}>Check again</button>
              </div>
            ) : null}
            <label>
              <span className="res-vslot-head">
                Visitor slot *
                {!vslots.loading && !vslots.error && visitorSlots.length ? (
                  <span className={`res-vslot-count${slotsFull ? ' is-full' : ''}`}>
                    {freeSlots} of {visitorSlots.length} free
                  </span>
                ) : null}
              </span>
              <select
                required
                value={visitorForm.slotId}
                onChange={(e) => setG('slotId', e.target.value)}
                disabled={vslots.loading || Boolean(vslots.error) || slotsFull || !visitorSlots.length}
              >
                <option value="">
                  {vslots.loading ? 'Loading slots…' : vslots.error ? 'Could not load slots' : slotsFull ? 'All slots full' : visitorSlots.length ? 'Select a slot' : 'No visitor slots'}
                </option>
                {visitorSlots.map((slot) => (
                  <option key={slot.id} value={slot.id} disabled={slot.status !== 'available'}>
                    {slot.slotCode}{slot.status === 'available' ? '' : ` · ${SLOT_TEXT[slot.status] || slot.status}`}
                  </option>
                ))}
              </select>
            </label>
            <label>Expected date *
              <input
                required
                type="date"
                min={todayInput()}
                value={visitorForm.expectedDate}
                onChange={(e) => setG('expectedDate', e.target.value)}
              />
            </label>
            {vslots.error ? (
              <div className="res-span"><StatusLine error={vslots.error} onRetry={vslots.reload} /></div>
            ) : null}
            <label>Guest vehicle number *
              <input required className="res-mono" value={visitorForm.vehicleNumber} onChange={(e) => setG('vehicleNumber', e.target.value.toUpperCase())} placeholder="e.g. MH01AB1234" />
            </label>
            <label>Type
              <select value={visitorForm.vehicleType} onChange={(e) => setG('vehicleType', e.target.value)}>
                {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="res-span">Purpose<input value={visitorForm.purpose} onChange={(e) => setG('purpose', e.target.value)} placeholder="e.g. Family visit" /></label>
            <label className="res-span">Notes<input value={visitorForm.notes} onChange={(e) => setG('notes', e.target.value)} placeholder="Anything the guard should know" /></label>
            {visitorError ? <div className="res-span"><ResidentNote tone="err">{visitorError}</ResidentNote></div> : null}
          </form>
        )}
      </ResidentDialog>

      <ResidentConfirm
        open={Boolean(removeRow)}
        danger
        busy={busy}
        title="Remove vehicle"
        message={removeRow ? `Remove ${removeRow.vehicleNumber} from your flat?` : ''}
        confirmLabel="Remove"
        cancelLabel="Keep vehicle"
        onCancel={() => setRemoveRow(null)}
        onConfirm={removeVehicle}
      />
    </>
  );
}
