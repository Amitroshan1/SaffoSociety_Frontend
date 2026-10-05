import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { navigateGuard } from '@/modules/guard/constants/guardRoutes.js';
import Sidebar from '@/modules/guard/components/Sidebar';
import DashboardHeader from '@/modules/guard/components/DashboardHeader';
import GateDatePicker from '@/modules/guard/components/shared/GateDatePicker.jsx';
import { EnterIcon, ExitIcon } from '@/modules/guard/components/shared/GateActionIcons.jsx';
import {
  getStaff,
  checkInStaff,
  checkOutStaff,
} from '@/modules/guard/services/staff/staff.service.js';
import {
  apiErrorMessage,
  indiaTodayISO,
} from '@/modules/guard/services/core/http';
import { STAFF_STATUS, STAFF_STATUS_LABEL } from '@/modules/guard/services/gate/gateStatus';
import '@/modules/guard/styles/core/guard-main.css';
import '@/modules/guard/styles/staff/staff.css';

const STATUS_OPTS = [
  { value: 'all', label: 'All' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'checked_out', label: 'Checked out' },
];

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function FilterDropdown({ value, onChange, options, counts, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const current = options.find((o) => o.value === value) || options[0];

  return (
    <div className="vtbl-filter-wrap gs-status-filter" ref={ref}>
      <button
        type="button"
        className={`vtbl-filter-select${open ? ' is-open' : ''}${
          value !== 'all' ? ' is-filtered' : ''
        }`}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{current?.label}</span>
        {counts?.[value] != null ? (
          <span className="gs-status-filter-count">{counts[value]}</span>
        ) : null}
      </button>
      {open ? (
        <ul className="vtbl-filter-menu" role="listbox">
          {options.map((o) => {
            const n =
              o.value === 'all'
                ? counts?.all
                : o.value === 'checked_in'
                  ? counts?.checkedIn
                  : o.value === 'checked_out'
                    ? counts?.checkedOut
                    : undefined;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  className={value === o.value ? 'is-active' : undefined}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <span>{o.label}</span>
                  {n !== undefined ? <span className="gs-status-filter-menu-count">{n}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function GuardStaffEntryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramStatus = searchParams.get('status');
  const statusFilter =
    paramStatus === 'in' || paramStatus === 'checked_in'
      ? 'checked_in'
      : paramStatus === 'out' || paramStatus === 'checked_out'
        ? 'checked_out'
        : 'all';

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [counts, setCounts] = useState({ all: 0, checkedIn: 0, checkedOut: 0 });
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState(indiaTodayISO);
  const [toDate, setToDate] = useState(indiaTodayISO);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const searchTimer = useRef(null);

  const today = indiaTodayISO();
  const isTodayOnly = fromDate === today && toDate === today;

  useEffect(() => {
    document.title = 'Staff | Guard Dashboard';
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 280);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const showToast = useCallback((type, title, sub) => {
    setToast({ type, title, sub });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) setLoading(true);
      try {
        const from = fromDate <= toDate ? fromDate : toDate;
        const to = fromDate <= toDate ? toDate : fromDate;
        const params = {
          page,
          pageSize: 20,
          search: debouncedSearch || undefined,
          from,
          to,
          sortBy: 'name',
          sortOrder: 'asc',
        };
        if (statusFilter === 'checked_in' || statusFilter === 'checked_out') {
          params.status = statusFilter;
        } else {
          params.status = 'all';
        }

        const data = await getStaff(params);
        if (!cancelled) {
          setItems(data.items || []);
          setPagination(data.pagination || null);
          setCounts(data.counts || { all: 0, checkedIn: 0, checkedOut: 0 });
        }
      } catch (err) {
        if (!cancelled) {
          showToast('error', 'Load failed', apiErrorMessage(err));
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast, fromDate, toDate, page, debouncedSearch, statusFilter, reloadKey]);

  function onStatusChange(next) {
    setPage(1);
    const param =
      next === 'checked_in' ? 'in' : next === 'checked_out' ? 'out' : 'all';
    setSearchParams(param === 'all' ? {} : { status: param }, { replace: true });
  }

  async function onCheckIn(staff) {
    if (!isTodayOnly) {
      showToast('error', 'Today only', 'Entry/exit is only allowed for today’s date.');
      return;
    }
    setBusyId(staff.id);
    try {
      await checkInStaff(staff.id);
      showToast('success', 'Checked in', staff.name);
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast('error', 'Check-in failed', apiErrorMessage(err));
      setReloadKey((k) => k + 1);
    } finally {
      setBusyId(null);
    }
  }

  async function onCheckOut(staff) {
    if (!isTodayOnly) {
      showToast('error', 'Today only', 'Entry/exit is only allowed for today’s date.');
      return;
    }
    setBusyId(staff.id);
    try {
      await checkOutStaff(staff.id);
      showToast('success', 'Checked out', staff.name);
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast('error', 'Check-out failed', apiErrorMessage(err));
      setReloadKey((k) => k + 1);
    } finally {
      setBusyId(null);
    }
  }

  const filterCounts = useMemo(
    () => ({
      all: counts.all,
      checked_in: counts.checkedIn,
      checked_out: counts.checkedOut,
    }),
    [counts],
  );

  return (
    <div className="gm-root" data-theme="light">
      <Sidebar activePage="Staff Entry" onNavigate={(label) => navigateGuard(navigate, label)} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <div className="vp-root">
            <div className="vp-header">
              <button
                type="button"
                className="vp-back-btn"
                onClick={() => navigate('/guard/dashboard')}
              >
                ← Dashboard
              </button>
              <div className="vp-header-titles">
                <h1 className="vp-page-title">Staff</h1>
              </div>
            </div>

            <div className="gs-toolbar">
              <div className="gs-search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name / role / flat / phone / Aadhaar"
                />
              </div>
              <p className="gs-roster-hint" style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Roster from society staff · no create on Guard
              </p>
            </div>

            <div className="gs-summary" aria-label="Staff filters">
              <FilterDropdown
                value={statusFilter}
                onChange={onStatusChange}
                options={STATUS_OPTS}
                counts={filterCounts}
                ariaLabel="Attendance status"
              />

              <div className="gs-date-range" aria-label="Date range filter">
                <GateDatePicker
                  label="From"
                  value={fromDate}
                  max={today}
                  allowClear={false}
                  onChange={(next) => {
                    const value = next || today;
                    setFromDate(value);
                    if (value > toDate) setToDate(value);
                    setPage(1);
                  }}
                />
                <span className="gs-date-sep">→</span>
                <GateDatePicker
                  label="To"
                  value={toDate}
                  min={fromDate}
                  max={today}
                  allowClear={false}
                  onChange={(next) => {
                    const value = next || today;
                    setToDate(value < fromDate ? fromDate : value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="vtbl-table gs-staff-table">
              <div
                className={`vtbl-head vtbl-grid gs-staff-grid${
                  statusFilter === 'checked_in' ? ' gs-staff-grid--in' : ''
                }`}
              >
                <span>Name</span>
                <span>Role</span>
                <span>Works at</span>
                <span>Phone</span>
                <span>Aadhaar</span>
                <span>Check in</span>
                {statusFilter !== 'checked_in' ? <span>Check out</span> : null}
                <span>Action</span>
              </div>

              {loading ? (
                <div className="vtbl-loading">Loading…</div>
              ) : items.length === 0 ? (
                <div className="vtbl-empty">
                  <h3>No staff found</h3>
                  <p>Try another filter or date range. Staff roster is managed by admin.</p>
                </div>
              ) : (
                items.map((s) => {
                  const status = s.attendanceStatus || STAFF_STATUS.NOT_MARKED;
                  const inside = status === STAFF_STATUS.CHECKED_IN;
                  const busy = busyId === s.id;
                  const worksAt = [s.building, s.wing, s.flat].filter(Boolean).join(' · ') || s.flat || '—';
                  return (
                    <div
                      key={s.id}
                      className={`vtbl-row vtbl-grid gs-staff-grid${
                        statusFilter === 'checked_in' ? ' gs-staff-grid--in' : ''
                      }${inside ? ' gs-staff-row--in' : ''}`}
                    >
                      <div className="vtbl-visitor-info">
                        <div className="vtbl-av">{(s.name || '?').charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="vtbl-name">{s.name || '—'}</div>
                          {s.owner ? <div className="vtbl-phone">{s.owner}</div> : null}
                        </div>
                      </div>
                      <div className="vtbl-text" data-label="Role">
                        {s.role || 'Staff'}
                      </div>
                      <div className="vtbl-text gs-flat-cell" data-label="Works at">
                        {worksAt}
                      </div>
                      <div className="vtbl-phone" data-label="Phone">
                        {s.phone || '—'}
                      </div>
                      <div className="vtbl-mono" data-label="Aadhaar">
                        {s.aadhaarMasked || '—'}
                      </div>
                      <div className="vtbl-time" data-label="Check in">
                        {formatTime(s.checkInTime)}
                      </div>
                      {statusFilter !== 'checked_in' ? (
                        <div className="vtbl-time" data-label="Check out">
                          {formatTime(s.checkOutTime)}
                        </div>
                      ) : null}
                      <div className="vtbl-actions">
                        {!isTodayOnly ? (
                          <span className="gs-status gs-status--out">
                            {STAFF_STATUS_LABEL[status] || status}
                          </span>
                        ) : inside ? (
                          <button
                            type="button"
                            className="vtbl-act vtbl-act--exit"
                            disabled={busy}
                            onClick={() => onCheckOut(s)}
                          >
                            {busy ? '…' : <><ExitIcon />Check out</>}
                          </button>
                        ) : status === STAFF_STATUS.CHECKED_OUT ? (
                          <span className="gs-status gs-status--out">Done</span>
                        ) : (
                          <button
                            type="button"
                            className="vtbl-act vtbl-act--checkin"
                            disabled={busy}
                            onClick={() => onCheckIn(s)}
                          >
                            {busy ? '…' : <><EnterIcon />Check in</>}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {pagination && pagination.totalPages > 1 ? (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: 12 }}>
                <button
                  type="button"
                  className="vtbl-act vtbl-act--call"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage((p) => p - 1)}
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
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {toast ? (
        <div className={`vp-toast vp-toast--${toast.type}`}>
          <div>
            <div className="vp-toast-title">{toast.title}</div>
            <div className="vp-toast-sub">{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
