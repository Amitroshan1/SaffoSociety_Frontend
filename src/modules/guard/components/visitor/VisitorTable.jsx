import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GUARD_VISITOR_PURPOSES, purposeLabel } from '@/modules/guard/services/gate/gateStatus';
import { EnterIcon, ExitIcon } from '@/modules/guard/components/shared/GateActionIcons.jsx';

const AVATAR_COLORS = ['#5b52f0', '#20c997', '#f5a623', '#f05353', '#a855f7', '#3b82f6'];
const PURPOSE_OPTIONS = GUARD_VISITOR_PURPOSES.map(purposeLabel);

function avColor(name) {
  return AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length];
}
function initials(name) {
  const p = String(name || '?').trim().split(/\s+/);
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : p[0].substring(0, 2).toUpperCase();
}

function rowFilterValue(row, filterBy) {
  if (filterBy === 'company') return String(row.company || row.cabService || row.purpose || '').trim();
  return String(row.purpose || '').trim();
}

export default function VisitorTable({
  variant,
  data,
  loading = false,
  onApprove,
  onDeny,
  onCall,
  onMarkExit,
  onCheckIn,
  onReadd,
  onVerifyOtp,
  onSimulateResident,
  actionLabels = {},
  filterBy = 'purpose',
  filterOptions,
  filterAllLabel,
  search: controlledSearch,
  onSearch,
  searchPlaceholder = 'Search by name, phone or flat…',
  showTracking = false,
  hideStatus = false,
  renderStatus,
  renderActions,
  serverSearch = false,
  pagination = null,
  onPageChange,
}) {
  const { hasPermission } = useAuth();
  const canApprove = hasPermission('visitor.approve');
  const canReject = hasPermission('visitor.reject');
  const [localSearch, setLocalSearch] = useState('');
  const search = controlledSearch != null ? controlledSearch : localSearch;
  const setSearch = onSearch || setLocalSearch;
  const [filterVal, setFilterVal] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const options = filterOptions || (filterBy === 'company' ? [] : PURPOSE_OPTIONS);
  const allLabel =
    filterAllLabel || (filterBy === 'company' ? 'All companies' : 'All purposes');
  const labels = {
    visitorCol: 'Visitor',
    purposeCol: 'Purpose',
    approve: 'Approve',
    deny: 'Deny',
    checkIn: 'Check in',
    exit: 'Mark exit',
    readd: 'Re-add',
    done: 'Done',
    ...actionLabels,
  };

  useEffect(() => {
    if (!filterOpen) return undefined;
    const onDoc = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [filterOpen]);

  const filtered = serverSearch
    ? data.filter((v) => {
        if (!filterVal) return true;
        return rowFilterValue(v, filterBy).toLowerCase() === filterVal.toLowerCase();
      })
    : data.filter((v) => {
        const name = String(v.name || v.courierName || v.driverName || '');
        const matchSearch =
          !search ||
          name.toLowerCase().includes(search.toLowerCase()) ||
          String(v.phone || '').includes(search) ||
          String(v.flat || '').toLowerCase().includes(search.toLowerCase()) ||
          String(v.company || v.cabService || '').toLowerCase().includes(search.toLowerCase()) ||
          String(v.trackingId || '').toLowerCase().includes(search.toLowerCase()) ||
          String(v.vehicleNumber || v.vehicle || '').toLowerCase().includes(search.toLowerCase());
        const matchFilter =
          !filterVal ||
          rowFilterValue(v, filterBy).toLowerCase() === filterVal.toLowerCase();
        return matchSearch && matchFilter;
      });

  const gridVariant = `${
    variant === 'inside' || variant === 'exited' || variant === 'held' || variant === 'handed' ? 'approved' : variant
  }${
    showTracking ? ' vtbl-grid--tracking' : ''
  }${hideStatus ? ' vtbl-grid--no-status' : ''}`;
  const displayName = (v) => v.name || v.courierName || v.driverName || '—';
  const displayPurpose = (v) =>
    v.company || v.cabService || purposeLabel(v.purpose) || v.purpose || '—';
  const displayTime = (v) =>
    v.time ||
    (v.createdAt
      ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '—');

  return (
    <div className="vtbl-root">
      <div className="vtbl-toolbar">
        <div className="vtbl-search-wrap">
          <SearchIcon />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {options.length > 0 ? (
          <div className="vtbl-filter-wrap" ref={filterRef}>
            <button
              type="button"
              className={`vtbl-filter-select${filterOpen ? ' is-open' : ''}`}
              onClick={() => setFilterOpen((o) => !o)}
            >
              <span>{filterVal || allLabel}</span>
            </button>
            {filterOpen ? (
              <ul className="vtbl-filter-menu" role="listbox">
                <li>
                  <button
                    type="button"
                    className={!filterVal ? 'is-active' : undefined}
                    onClick={() => {
                      setFilterVal('');
                      setFilterOpen(false);
                    }}
                  >
                    {allLabel}
                  </button>
                </li>
                {options.map((p) => (
                  <li key={p}>
                    <button
                      type="button"
                      className={filterVal === p ? 'is-active' : undefined}
                      onClick={() => {
                        setFilterVal(p);
                        setFilterOpen(false);
                      }}
                    >
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="vtbl-table">
        <div className={`vtbl-head vtbl-grid vtbl-grid--${gridVariant}`}>
          <span>{labels.visitorCol}</span>
          <span className="vtbl-hide">Flat</span>
          <span className="vtbl-hide">{labels.purposeCol}</span>
          {showTracking ? <span className="vtbl-hide">Tracking ID</span> : null}
          <span className="vtbl-hide">Time</span>
          {hideStatus ? null : <span>Status</span>}
          <span className="vtbl-actions-head">Actions</span>
        </div>

        {loading && (
          <div className="vtbl-loading">
            <div className="vtbl-spinner" />
          </div>
        )}

        {!loading &&
          (filtered.length === 0 ? (
            <EmptyState variant={variant} labels={labels} />
          ) : (
            filtered.map((v) => (
              <div key={v.id} className={`vtbl-row vtbl-grid vtbl-grid--${gridVariant}`}>
                <div className="vtbl-visitor-info">
                  <div
                    className="vtbl-av"
                    style={{
                      background: `${avColor(displayName(v))}22`,
                      color: avColor(displayName(v)),
                      borderColor: `${avColor(displayName(v))}55`,
                      overflow: 'hidden',
                    }}
                  >
                    {v.photoDisplayUrl ? (
                      <img
                        src={v.photoDisplayUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      initials(displayName(v))
                    )}
                  </div>
                  <div>
                    <div className="vtbl-name">{displayName(v)}</div>
                    <div className="vtbl-phone">{v.phone || v.vehicleNumber || '—'}</div>
                  </div>
                </div>
                <div className="vtbl-mono vtbl-hide" data-label="Flat">
                  {v.flat}
                </div>
                <div className="vtbl-text vtbl-hide" data-label={labels.purposeCol}>
                  {displayPurpose(v)}
                </div>
                {showTracking ? (
                  <div className="vtbl-mono vtbl-hide vtbl-tracking" data-label="Tracking ID" title={v.trackingId || ''}>
                    {v.trackingId || '—'}
                  </div>
                ) : null}
                <div className="vtbl-time vtbl-hide" data-label="Time">
                  {displayTime(v)}
                </div>
                {hideStatus ? null : (
                  <div data-label="Status">
                    {renderStatus ? (
                      renderStatus(v)
                    ) : (
                      <span
                        className={`vtbl-badge vtbl-badge--${
                          variant === 'rejected' ? 'rejected' : variant === 'pending' ? 'pending' : 'approved'
                        }`}
                      >
                        <span className="vtbl-badge-dot" />
                        {String(v.status || variant)}
                      </span>
                    )}
                  </div>
                )}
                <div className="vtbl-actions">
                  {renderActions ? renderActions(v) : (
                  <>
                  {variant === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="vtbl-act vtbl-act--call"
                        onClick={() => onCall?.(v.id)}
                      >
                        <PhoneIcon />
                        <span>Call</span>
                      </button>
                      {onSimulateResident ? (
                        <>
                          <button
                            type="button"
                            className="vtbl-act vtbl-act--approve"
                            onClick={() => onSimulateResident(v.id, 'approve')}
                          >
                            Sim. Approve
                          </button>
                          <button
                            type="button"
                            className="vtbl-act vtbl-act--deny"
                            onClick={() => onSimulateResident(v.id, 'reject')}
                          >
                            Sim. Reject
                          </button>
                        </>
                      ) : (
                        <span className="vtbl-badge vtbl-badge--pending">Awaiting resident</span>
                      )}
                      {onApprove && canApprove ? (
                        <button type="button" className="vtbl-act vtbl-act--approve" onClick={() => onApprove(v.id)}>
                          {labels.approve}
                        </button>
                      ) : null}
                      {onDeny && canReject ? (
                        <button type="button" className="vtbl-act vtbl-act--deny" onClick={() => onDeny(v.id)}>
                          {labels.deny}
                        </button>
                      ) : null}
                      {onVerifyOtp ? (
                        <button type="button" className="vtbl-act vtbl-act--readd" onClick={() => onVerifyOtp(v.id)}>
                          OTP
                        </button>
                      ) : null}
                    </>
                  )}
                  {variant === 'approved' && (
                    <button
                      type="button"
                      className="vtbl-act vtbl-act--checkin"
                      onClick={() => (onCheckIn || onMarkExit)?.(v.id)}
                    >
                      <EnterIcon />
                      {labels.checkIn}
                    </button>
                  )}
                  {variant === 'inside' && (
                    <button type="button" className="vtbl-act vtbl-act--exit" onClick={() => onMarkExit?.(v.id)}>
                      <ExitIcon />
                      {labels.exit}
                    </button>
                  )}
                  {(variant === 'exited' || variant === 'completed') && (
                    <span className="vtbl-badge vtbl-badge--approved">{labels.done}</span>
                  )}
                  {variant === 'rejected' &&
                    (onReadd ? (
                      <button type="button" className="vtbl-act vtbl-act--readd" onClick={() => onReadd(v.id)}>
                        {labels.readd}
                      </button>
                    ) : (
                      <span className="vtbl-badge vtbl-badge--rejected">Rejected</span>
                    ))}
                  </>
                  )}
                </div>
              </div>
            ))
          ))}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: 12 }}>
          <button
            type="button"
            className="vtbl-act vtbl-act--call"
            disabled={!pagination.hasPrev}
            onClick={() => onPageChange?.(pagination.page - 1)}
          >
            Prev
          </button>
          <span style={{ fontSize: 13, color: '#64748b', alignSelf: 'center' }}>
            Page {pagination.page} / {pagination.totalPages} · {pagination.total} total
          </span>
          <button
            type="button"
            className="vtbl-act vtbl-act--call"
            disabled={!pagination.hasNext}
            onClick={() => onPageChange?.(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ variant, labels = {} }) {
  const msgs = {
    pending: [labels.emptyPending || 'No pending requests', labels.emptyPendingSub || 'Waiting for resident response.'],
    approved: [labels.emptyActive || 'No approved entries', labels.emptyActiveSub || 'Approved entries ready for check-in appear here.'],
    held: [labels.emptyHeld || 'Nothing at the gate', labels.emptyHeldSub || ''],
    handed: [labels.emptyHanded || 'No handovers yet', labels.emptyHandedSub || 'Parcels handed to a resident appear here.'],
    inside: [labels.emptyInside || 'No visitors inside', labels.emptyInsideSub || 'Checked-in visitors appear here.'],
    exited: [labels.emptyExited || 'No exited entries', labels.emptyExitedSub || 'Completed visits appear here.'],
    completed: [labels.emptyCompleted || 'No completed entries', labels.emptyCompletedSub || ''],
    rejected: [labels.emptyRejected || 'No rejected entries', labels.emptyRejectedSub || ''],
  };
  const [title, sub] = msgs[variant] || ['No data', ''];
  return (
    <div className="vtbl-empty">
      <h3>{title}</h3>
      <p>{sub}</p>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.9 1.17h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
