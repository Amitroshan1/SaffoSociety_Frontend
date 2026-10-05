import { useMemo, useState } from 'react';
import { PageHeader, StatusLine, statusLabel, typeLabel } from '@/modules/resident/components/ResidentShell';
import ResidentConfirm, { ResidentNote } from '@/modules/resident/components/ResidentConfirm';
import { useLoad } from '@/modules/resident/components/useLoad';
import VisitorPhoto from '@/modules/resident/components/VisitorPhoto';
import { listMyVisits, submitVisitorApproval } from '@/modules/resident/services/residentPortal.service';
import '@/modules/resident/styles/visitor/visitor.css';

const TABS = [
  { id: 'pending', label: 'At gate', test: (row) => row.status === 'waiting' },
  { id: 'inside', label: 'Inside', test: (row) => row.status === 'approved' || row.status === 'checked_in' },
  { id: 'all', label: 'All', test: () => true },
];

const EMPTY = {
  pending: { title: 'No one is waiting at the gate.', body: 'When the guard logs a visitor for your flat, they will appear here for approval.' },
  inside: { title: 'No visitors inside right now.', body: 'Approved and checked-in visitors show here until they leave.' },
  all: { title: 'No visits yet.', body: 'Guests, deliveries, cabs and staff visits for your flat will appear here.' },
};

function day(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function clock(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function VisitorsPage() {
  const [tab, setTab] = useState('pending');
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [tone, setTone] = useState('ok');
  const { loading, error, data, reload } = useLoad(() => listMyVisits(), []);

  const counts = useMemo(() => {
    const list = data || [];
    return Object.fromEntries(TABS.map((item) => [item.id, list.filter(item.test).length]));
  }, [data]);

  const rows = useMemo(() => {
    const active = TABS.find((item) => item.id === tab);
    const needle = query.trim().toLowerCase();
    return (data || []).filter(active.test).filter((row) => {
      if (!needle) return true;
      return [row.name, row.purpose, row.type, row.vehicle, row.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [data, tab, query]);

  async function decide(visit, action) {
    setBusy(true);
    setNote('');
    try {
      await submitVisitorApproval({ visitId: visit.id, action });
      setPending(null);
      setTone('ok');
      setNote(
        action === 'approve'
          ? `${visit.name} approved. The guard can let them in.`
          : action === 'reject'
            ? `${visit.name} rejected at the gate.`
            : `Invitation for ${visit.name} cancelled.`,
      );
      await reload();
    } catch (err) {
      setTone('err');
      setNote(err.message);
    } finally {
      setBusy(false);
    }
  }

  const activeLabel = TABS.find((item) => item.id === tab)?.label;
  const empty = query.trim()
    ? { title: 'No matching visitors.', body: 'Try a different name, purpose or vehicle number.' }
    : EMPTY[tab];

  return (
    <>
      <PageHeader title="Visitors" />

      {counts.pending > 0 && tab !== 'pending' ? (
        <button type="button" className="res-alert" onClick={() => setTab('pending')}>
          <span className="res-alert-dot" aria-hidden="true" />
          {counts.pending} {counts.pending === 1 ? 'visitor is' : 'visitors are'} waiting at the gate for your approval.
          <span className="res-alert-link">Review</span>
        </button>
      ) : null}

      <section className="res-card">
        <div className="res-toolbar">
          <div className="res-tabs" role="tablist" aria-label="Filter visitors">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`res-tab${tab === item.id ? ' is-on' : ''}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
                {data ? <span className="res-tab-count">{counts[item.id]}</span> : null}
              </button>
            ))}
          </div>
          <label className="res-search">
            <span className="res-sr">Search visitors</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m20 20-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, purpose or vehicle"
            />
          </label>
        </div>

        {note ? <div className="res-card-note"><ResidentNote tone={tone}>{note}</ResidentNote></div> : null}

        <div className="res-card-body">
          <StatusLine loading={loading} error={error} onRetry={reload}>
            <div className="res-table" role="table" aria-label={`${activeLabel} visitors`}>
              <div className="res-visit-grid res-visit-head" role="row">
                <span role="columnheader">Visitor</span>
                <span role="columnheader">Type</span>
                <span role="columnheader">Status</span>
                <span role="columnheader">Time</span>
                <span role="columnheader">Persons</span>
                <span role="columnheader">Vehicle</span>
                <span role="columnheader" className="res-col-actions">Actions</span>
              </div>
              {rows.length === 0 ? (
                <div className="res-empty">
                  <strong>{empty.title}</strong>
                  <p>{empty.body}</p>
                </div>
              ) : rows.map((visit) => (
                  <div key={visit.id} className={`res-visit-grid res-visit-row${visit.status === 'waiting' ? ' is-waiting' : ''}`} role="row">
                    <span className="res-visitor-cell" role="cell">
                      <VisitorPhoto visit={visit} size={40} />
                      <span className="res-visitor-text">
                        <strong>{visit.name}</strong>
                        <span className="res-meta">{visit.purpose}{visit.isPreapproved ? ' · Pre-approved' : ''}</span>
                      </span>
                    </span>
                    <span role="cell" data-label="Type"><span className={`res-type res-type--${typeLabel(visit.type)}`}>{typeLabel(visit.type)}</span></span>
                    <span role="cell" data-label="Status"><span className={`res-badge res-badge--${visit.status}`}>{statusLabel(visit.status)}</span></span>
                    <span role="cell" data-label="Time" className="res-time">
                      <span>{clock(visit.expectedAt || visit.createdAt)}</span>
                      <span className="res-meta">{day(visit.expectedAt || visit.createdAt)}</span>
                    </span>
                    <span role="cell" data-label="Persons">{visit.persons}</span>
                    <span role="cell" data-label="Vehicle" className="res-mono">{visit.vehicle || '—'}</span>
                    <span role="cell" className="res-actions res-col-actions">
                      {visit.status === 'waiting' ? (
                        <>
                          <button type="button" className="res-btn res-btn--success" disabled={busy} onClick={() => decide(visit, 'approve')}>Approve</button>
                          <button type="button" className="res-btn res-btn--danger" disabled={busy} onClick={() => setPending({ visit, action: 'reject' })}>Reject</button>
                        </>
                      ) : null}
                      {visit.status === 'scheduled' ? (
                        <button type="button" className="res-btn res-btn--danger" disabled={busy} onClick={() => setPending({ visit, action: 'cancel' })}>Cancel invite</button>
                      ) : null}
                      {['approved', 'checked_in', 'rejected', 'checked_out', 'cancelled'].includes(visit.status) ? (
                        <span className="res-meta">No action needed</span>
                      ) : null}
                    </span>
                  </div>
              ))}
            </div>
          </StatusLine>
        </div>
      </section>

      <ResidentConfirm
        open={Boolean(pending)}
        danger
        busy={busy}
        title={pending?.action === 'cancel' ? 'Cancel invitation' : 'Reject visitor'}
        confirmLabel={pending?.action === 'cancel' ? 'Cancel invite' : 'Reject'}
        message={pending ? `${pending.action === 'cancel' ? 'Cancel the invite for' : 'Reject'} ${pending.visit.name}?` : ''}
        onCancel={() => setPending(null)}
        onConfirm={() => decide(pending.visit, pending.action)}
      />
    </>
  );
}
