import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { typeLabel, statusLabel } from '@/modules/resident/components/ResidentShell';
import ResidentConfirm, { ResidentNote } from '@/modules/resident/components/ResidentConfirm';
import { useLoad } from '@/modules/resident/components/useLoad';
import VisitorPhoto from '@/modules/resident/components/VisitorPhoto';
import { getGateDashboard, getMyFlat, submitVisitorApproval } from '@/modules/resident/services/residentPortal.service';
import '@/modules/resident/styles/dashboard/dashboard.css';

function when(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function Svg({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function DashCard({ title, badge, action, className = '', children }) {
  return (
    <section className={`res-card res-dcard ${className}`} aria-label={title}>
      <header className="res-dcard-head">
        <div className="res-dcard-title">
          <h2>{title}</h2>
          {badge}
        </div>
        {action}
      </header>
      <div className="res-dcard-body">{children}</div>
    </section>
  );
}

function CardLink({ label, onClick }) {
  return (
    <button type="button" className="res-dcard-link" onClick={onClick}>
      {label}
      <Svg><path d="M9 6l6 6-6 6" /></Svg>
    </button>
  );
}

function Empty({ children }) {
  return <p className="res-dcard-empty">{children}</p>;
}

function DashboardSkeleton() {
  return (
    <div className="res-dash" aria-busy="true" aria-label="Loading dashboard">
      <div className="res-welcome">
        <div className="res-card res-skel-card"><span className="res-skel w-30" /><span className="res-skel h-28 w-50" /><span className="res-skel w-70" /></div>
        <div className="res-card res-skel-card"><span className="res-skel w-40" /><span className="res-skel h-28 w-60" /><span className="res-skel w-40" /></div>
      </div>
      <div className="res-quick">
        {[0, 1, 2].map((i) => <div key={i} className="res-card res-skel-card res-skel-quick"><span className="res-skel w-60" /><span className="res-skel w-80" /></div>)}
      </div>
      <div className="res-dash-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="res-card res-skel-card res-skel-panel">
            <span className="res-skel w-40" />
            <span className="res-skel w-90" />
            <span className="res-skel w-70" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { loading, error, data, reload } = useLoad(() => getGateDashboard(), []);
  const flat = useLoad(() => getMyFlat(), []);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState({ tone: 'ok', text: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!note.text) return undefined;
    const timer = setTimeout(() => setNote({ tone: 'ok', text: '' }), 3500);
    return () => clearTimeout(timer);
  }, [note]);

  async function decide(visitId, action) {
    setBusy(true);
    setNote({ tone: 'ok', text: '' });
    try {
      await submitVisitorApproval({ visitId, action });
      setPending(null);
      setNote({ tone: 'ok', text: action === 'approve' ? 'Visitor approved.' : 'Visitor rejected.' });
      await reload();
    } catch (err) {
      setNote({ tone: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!data?.parkingCode) return;
    try {
      await navigator.clipboard.writeText(data.parkingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      setNote({ tone: 'ok', text: `Copied ${data.parkingCode}` });
    } catch {
      setNote({ tone: 'ok', text: data.parkingCode });
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const quickActions = (
    <nav className="res-quick" aria-label="Quick actions">
      <button type="button" className="res-quick-btn res-quick-btn--primary" onClick={() => navigate('/resident/visitor-invitations')}>
        <span className="res-quick-icon"><Svg><circle cx="10" cy="8" r="4" /><path d="M3 20a7 7 0 0 1 14 0M19 8v6M16 11h6" /></Svg></span>
        <span className="res-quick-text">
          <strong>Invite Guest</strong>
          <span>Pre-approve for the gate</span>
        </span>
        <span className="res-quick-chevron"><Svg><path d="M9 6l6 6-6 6" /></Svg></span>
      </button>
      <button type="button" className="res-quick-btn res-quick-btn--alert" onClick={() => navigate('/resident/sos')}>
        <span className="res-quick-icon"><Svg><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17v.01" /></Svg></span>
        <span className="res-quick-text">
          <strong>Raise SOS</strong>
          <span>Alert the guard</span>
        </span>
        <span className="res-quick-chevron"><Svg><path d="M9 6l6 6-6 6" /></Svg></span>
      </button>
      <button type="button" className="res-quick-btn" onClick={() => navigate('/resident/parking', { state: { open: 'visitor' } })}>
        <span className="res-quick-icon"><Svg><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3" /></Svg></span>
        <span className="res-quick-text">
          <strong>Visitor Parking</strong>
          <span>Get a guest code</span>
        </span>
        <span className="res-quick-chevron"><Svg><path d="M9 6l6 6-6 6" /></Svg></span>
      </button>
    </nav>
  );

  if (loading && !data) return <DashboardSkeleton />;

  if (!data) {
    return (
      <div className="res-dash">
        <div className="res-card res-dash-error" role="alert">
          <div>
            <strong>Could not load your dashboard</strong>
            <p>{error || 'Something went wrong.'}</p>
          </div>
          <button type="button" className="res-btn res-btn--secondary" onClick={reload}>Retry</button>
        </div>
        {quickActions}
      </div>
    );
  }

  const gate = data.pendingAtGate || [];
  const invites = data.upcomingInvites || [];
  const sos = data.activeSos || [];
  const bookings = data.todaysBookings || [];
  const flatInfo = flat.data;
  const flatMeta = flatInfo
    ? [flatInfo.society, flatInfo.building, flatInfo.wing ? `Wing ${flatInfo.wing}` : '', flatInfo.occupancyRole].filter(Boolean)
    : [];

  return (
    <>
      <div className="res-dash">
        <div className="res-welcome">
          <section className="res-card res-welcome-main" aria-label="My flat">
            <p className="res-kicker">{greeting}</p>
            <p className="res-welcome-name">{data.resident?.name}</p>
            <p className="res-welcome-line">
              <span className="res-welcome-flatno">{flatInfo?.flatNo || data.resident?.flatNo}</span>
              {flatMeta.map((item) => (
                <span key={item} className="res-welcome-meta">{item}</span>
              ))}
            </p>
          </section>

          <section className="res-card res-code-card" aria-label="Parking code">
            <span className="res-kicker">Parking code</span>
            <strong className="res-code-value">{data.parkingCode || '—'}</strong>
            <button
              type="button"
              className={`res-btn res-btn--secondary res-btn--sm res-code-copy${copied ? ' is-done' : ''}`}
              onClick={copyCode}
              disabled={!data.parkingCode}
              aria-label={data.parkingCode ? `Copy parking code ${data.parkingCode}` : 'No parking code'}
            >
              {copied ? (
                <><Svg><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>Copied</>
              ) : (
                <><Svg><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></Svg>Copy code</>
              )}
            </button>
          </section>
        </div>

        {quickActions}

        <div className="res-dash-grid">
          <DashCard
            title="Pending at gate"
            className="res-dcard--gate"
            badge={<span className={`res-dcount${gate.length ? ' is-warn' : ''}`}>{gate.length} waiting</span>}
          >
            {gate.length === 0 ? <Empty>No visitors waiting at the gate.</Empty> : (
              <ul className="res-dlist">
                {gate.map((visit) => {
                  const type = typeLabel(visit.type);
                  const showPurpose = visit.purpose && visit.purpose.toLowerCase() !== String(type).toLowerCase();
                  return (
                    <li key={visit.id} className="res-drow">
                      <VisitorPhoto visit={visit} size={40} />
                      <div className="res-drow-main">
                        <strong>{visit.name}</strong>
                        <span className="res-drow-meta">
                          <span className="res-dtype">{type}</span>
                          {showPurpose ? <span>{visit.purpose}</span> : null}
                          {visit.vehicle ? <span className="res-dplate">{visit.vehicle}</span> : null}
                          <span>{when(visit.createdAt)}</span>
                        </span>
                      </div>
                      <div className="res-drow-actions">
                        <button
                          type="button"
                          className="res-btn res-btn--success res-btn--sm"
                          disabled={busy}
                          onClick={() => decide(visit.id, 'approve')}
                          aria-label={`Approve ${visit.name}`}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="res-btn res-btn--danger res-btn--sm"
                          disabled={busy}
                          onClick={() => setPending(visit)}
                          aria-label={`Reject ${visit.name}`}
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </DashCard>

          <DashCard
            title="Upcoming invites"
            className="res-dcard--invites"
            action={<CardLink label="View" onClick={() => navigate('/resident/visitor-history')} />}
          >
            {invites.length === 0 ? <Empty>No upcoming invites.</Empty> : (
              <ul className="res-dlist">
                {invites.map((visit) => (
                  <li key={visit.id} className="res-drow">
                    <span className="res-dinitial" aria-hidden="true">{String(visit.name || 'G').slice(0, 1)}</span>
                    <div className="res-drow-main">
                      <strong>{visit.name}</strong>
                      <span className="res-drow-meta">
                        {visit.purpose ? <span>{visit.purpose}</span> : null}
                        <span>{when(visit.expectedAt || visit.createdAt)}</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DashCard>

          <DashCard
            title="Active SOS"
            className={`res-dcard--sos${sos.length ? ' is-active' : ''}`}
            badge={sos.length ? <span className="res-dcount is-danger">{sos.length} active</span> : null}
            action={<CardLink label="Open SOS" onClick={() => navigate('/resident/sos')} />}
          >
            {sos.length === 0 ? <Empty>No active SOS.</Empty> : (
              <ul className="res-dlist">
                {sos.map((item) => (
                  <li key={item.id} className="res-dsos">
                    <span className="res-dsos-dot" aria-hidden="true" />
                    <div className="res-drow-main">
                      <strong>{item.title}</strong>
                      <span className="res-drow-meta">
                        <span>{item.flatNo}</span>
                        <span>{when(item.createdAt)}</span>
                      </span>
                      <span className="res-dsos-state">Active emergency request</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DashCard>

          <DashCard
            title="Today’s bookings"
            className="res-dcard--bookings"
            action={<CardLink label="My Bookings" onClick={() => navigate('/resident/bookings')} />}
          >
            {bookings.length === 0 ? <Empty>No bookings for today.</Empty> : (
              <ul className="res-dlist">
                {bookings.map((item) => (
                  <li key={item.id} className="res-drow">
                    <div className="res-drow-main">
                      <strong>{item.code}</strong>
                      <span className="res-drow-meta">
                        <span>{item.amenity}</span>
                        <span>{item.startTime} – {item.endTime}</span>
                      </span>
                    </div>
                    <span className={`res-badge res-badge--${item.status}`}>{statusLabel(item.status)}</span>
                  </li>
                ))}
              </ul>
            )}
          </DashCard>
        </div>
      </div>

      {note.text ? (
        <div className="res-dash-toast" role="status" aria-live="polite">
          <ResidentNote tone={note.tone}>{note.text}</ResidentNote>
        </div>
      ) : null}

      <ResidentConfirm
        open={Boolean(pending)}
        danger
        title="Reject visitor"
        message={pending ? `Reject ${pending.name} at the gate?` : ''}
        confirmLabel="Reject"
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => decide(pending.id, 'reject')}
      />
    </>
  );
}
