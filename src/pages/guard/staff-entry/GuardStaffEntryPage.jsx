import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/guard/visitor/visitors.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import AddStaffModal from '../../../components/guard/staff/AddStaffModal.jsx';
import GateDatePicker from '../../../components/guard/shared/GateDatePicker.jsx';
import api from '../../../services/api.js';
import { listStaff } from '../../../services/staff.service.js';
import {
  checkInAttendance,
  checkOutAttendance,
  listAttendance,
} from '../../../services/attendance.service.js';
import {
  getFlatContact,
  logGuardCall,
  markVisitorExit,
  tryGuardApprove,
} from '../../../services/guard.service.js';

const SECURITY_ROLES = new Set(['security_guard', 'security_supervisor']);

const ROLE_LABEL = {
  housekeeping: 'Maid',
  electrician: 'Technician',
  plumber: 'Plumber',
  gardener: 'Gardener',
  other: 'Staff',
  receptionist: 'Reception',
  facility_manager: 'Facility',
};

const STATUS_OPTS = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'Checked in' },
  { value: 'out', label: 'Checked out' },
];

const KIND_OPTS = [
  { value: 'regular', label: 'Regular staff' },
  { value: 'onetime', label: 'One time staff' },
];

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isoDay(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function roleLabel(staff) {
  const vt = staff?.metadata?.visitorType;
  if (vt === 'maid') return 'Maid';
  if (vt === 'driver') return 'Driver';
  if (vt === 'technician') return 'Technician';
  return ROLE_LABEL[staff?.staffRole] || staff?.staffRole || 'Staff';
}

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

const DEMO_ONETIME_STAFF = [
  {
    id: 'demo-ot-1',
    name: 'Sunita Devi',
    phone: '9876543210',
    staffRole: 'other',
    flatId: null,
    visitStatus: 'pending',
    raw: { id: 'demo-ot-1', status: 'pending', flat: 'B-804' },
    metadata: {
      defaultFlat: 'B-804',
      visitorType: 'maid',
      aadhaar: '123412341234',
    },
    kind: 'onetime',
    attendance: {
      status: 'pending',
      checkInTime: null,
      checkOutTime: null,
    },
  },
  {
    id: 'demo-ot-2',
    name: 'Ramesh Yadav',
    phone: '9123456780',
    staffRole: 'other',
    flatId: null,
    visitStatus: 'pending',
    raw: { id: 'demo-ot-2', status: 'pending', flat: 'A-302' },
    metadata: {
      defaultFlat: 'A-302',
      visitorType: 'technician',
      aadhaar: null,
    },
    kind: 'onetime',
    attendance: {
      status: 'pending',
      checkInTime: null,
      checkOutTime: null,
    },
  },
];

function isOneTimeStaffVisit(row) {
  const purpose = String(row?.purpose || '').toLowerCase();
  const type = String(row?.visitorType || row?.visitor_type || '').toLowerCase();
  if (['maid', 'driver', 'technician'].includes(type)) return true;
  if (purpose.includes('work') || purpose.includes('service')) return true;
  return false;
}

function mapOneTimeVisit(row) {
  const statusRaw = String(row?.status || row?.visitStatus || '').toLowerCase();
  const exited = Boolean(
    row?.checkOutTime ||
      row?.exitTime ||
      statusRaw.includes('exit') ||
      statusRaw === 'checked_out' ||
      statusRaw === 'completed',
  );
  const pending =
    statusRaw === 'pending' || statusRaw === 'waiting' || (!statusRaw && !row?.checkInTime);
  const inside =
    !exited &&
    !pending &&
    (statusRaw === 'approved' ||
      statusRaw === 'checked_in' ||
      statusRaw === 'inside' ||
      Boolean(row?.checkInTime));

  return {
    id: row.id || row.visitId,
    name: row.name || 'Staff',
    phone: row.phone || '',
    staffRole: 'other',
    flatId: row.flatId || null,
    visitStatus: pending ? 'pending' : exited ? 'checked_out' : inside ? 'checked_in' : statusRaw || 'pending',
    raw: row,
    metadata: {
      defaultFlat: row.flat || row.flatNumber || '—',
      visitorType:
        row.visitorType ||
        (String(row.purpose || '').toLowerCase().includes('maid')
          ? 'maid'
          : String(row.purpose || '').toLowerCase().includes('driver')
            ? 'driver'
            : 'technician'),
      aadhaar: null,
    },
    kind: 'onetime',
    attendance: {
      status: exited ? 'checked_out' : inside ? 'checked_in' : pending ? 'pending' : null,
      checkInTime: inside || exited ? row.checkInTime || row.createdAt || null : null,
      checkOutTime: row.checkOutTime || row.exitTime || null,
    },
  };
}

function FilterDropdown({
  value,
  onChange,
  options,
  counts,
  ariaLabel,
  alwaysFiltered = false,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) || options[0];
  const count = counts?.[value] ?? counts?.all ?? '';
  const isFiltered = alwaysFiltered || value !== options[0]?.value;

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="gs-status-filter" ref={rootRef}>
      <button
        type="button"
        className={`gs-status-filter-trigger${open ? ' is-open' : ''}${isFiltered ? ' is-filtered' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="gs-status-filter-label">{selected.label}</span>
        {count !== '' && count !== undefined ? (
          <span className="gs-status-filter-count">{count}</span>
        ) : null}
        <svg className="gs-status-filter-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <polyline
            points="6 9 12 15 18 9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <ul className="gs-status-filter-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((o) => {
            const active = o.value === value;
            const n = counts?.[o.value];
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={active ? 'is-active' : undefined}
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

function formatAadhaar(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '—';
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function staffFlat(staff) {
  return staff?.metadata?.defaultFlat || staff?.metadata?.flat || '—';
}

function staffAadhaar(staff) {
  return staff?.metadata?.aadhaar || staff?.metadata?.aadhar || '';
}

export default function GuardStaffEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = ['all', 'in', 'out'].includes(searchParams.get('status'))
    ? searchParams.get('status')
    : 'all';
  const [staffRows, setStaffRows] = useState([]);
  const [oneTimeRows, setOneTimeRows] = useState([]);
  /** staffId -> latest attendance row in selected date range */
  const [dayByStaffId, setDayByStaffId] = useState({});
  const [fromDate, setFromDate] = useState(todayISO);
  const [toDate, setToDate] = useState(todayISO);
  const [search, setSearch] = useState('');
  const [staffKind, setStaffKind] = useState('onetime'); // regular | onetime
  const [statusFilter, setStatusFilter] = useState(initialStatus); // all | in | out
  const [calledIds, setCalledIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const today = todayISO();
  const isTodayOnly = fromDate === today && toDate === today;

  const showToast = useCallback((type, title, sub) => {
    setToast({ type, title, sub });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = fromDate <= toDate ? fromDate : toDate;
      const to = fromDate <= toDate ? toDate : fromDate;
      const [staffRes, attRes, visitRes] = await Promise.all([
        listStaff({ page: 1, pageSize: 100, isActive: true, sortBy: 'name', sortOrder: 'asc' }),
        listAttendance({
          page: 1,
          pageSize: 200,
          fromDate: from,
          toDate: to,
          sortBy: 'check_in_time',
          sortOrder: 'desc',
        }),
        api
          .get('/guard/visitors', {
            params: { page: 1, pageSize: 100, sortBy: 'created_at', sortOrder: 'desc' },
          })
          .catch(() => null),
      ]);

      const allStaff = staffRes.data?.data?.staff || staffRes.data?.data?.items || [];
      const gateStaff = (Array.isArray(allStaff) ? allStaff : []).filter((s) => {
        if (s?.isActive === false) return false;
        if (SECURITY_ROLES.has(String(s.staffRole || '').toLowerCase())) return false;
        if (s.metadata?.gateService) return true;
        return ['housekeeping', 'electrician', 'plumber', 'gardener', 'other', 'receptionist'].includes(
          String(s.staffRole || '').toLowerCase(),
        );
      });

      const dayMap = {};
      for (const a of attRes.data?.data?.attendance || []) {
        if (!a.staffId) continue;
        if (!dayMap[a.staffId]) dayMap[a.staffId] = a;
      }

      const visits = visitRes?.data?.data?.visitors || visitRes?.data?.visitors || [];
      const oneTime = (Array.isArray(visits) ? visits : [])
        .filter(isOneTimeStaffVisit)
        .map(mapOneTimeVisit)
        .filter((row) => {
          const day = isoDay(row.attendance?.checkInTime || row.raw?.createdAt);
          if (!day) return true;
          return day >= from && day <= to;
        });

      setStaffRows(gateStaff);
      setOneTimeRows(oneTime.length > 0 ? oneTime : DEMO_ONETIME_STAFF);
      setDayByStaffId(dayMap);
    } catch (err) {
      showToast('error', 'Load failed', err.response?.data?.message || err.message);
      setStaffRows([]);
      setOneTimeRows(DEMO_ONETIME_STAFF);
      setDayByStaffId({});
    } finally {
      setLoading(false);
    }
  }, [showToast, fromDate, toDate]);

  useEffect(() => {
    document.title = 'Staff | Guard Dashboard';
    load();
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, [load]);

  useEffect(() => {
    const next = searchParams.get('status');
    if (['all', 'in', 'out'].includes(next)) setStatusFilter(next);
  }, [searchParams]);

  const activeRows = staffKind === 'onetime' ? oneTimeRows : staffRows;

  const getAttendance = useCallback(
    (row) => {
      if (row?.kind === 'onetime') return row.attendance || null;
      return dayByStaffId[row.id] || null;
    },
    [dayByStaffId],
  );

  const kindCounts = useMemo(
    () => ({
      regular: staffRows.length,
      onetime: oneTimeRows.length,
    }),
    [staffRows, oneTimeRows],
  );

  const counts = useMemo(() => {
    let checkedIn = 0;
    let checkedOut = 0;
    for (const s of activeRows) {
      const att = getAttendance(s);
      if (!att) continue;
      if (att.status === 'checked_in') checkedIn += 1;
      else if (att.status === 'checked_out') checkedOut += 1;
    }
    return {
      all: activeRows.length,
      in: checkedIn,
      out: checkedOut,
    };
  }, [activeRows, getAttendance]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeRows.filter((s) => {
      const att = getAttendance(s);
      if (statusFilter === 'in' && att?.status !== 'checked_in') return false;
      if (statusFilter === 'out' && att?.status !== 'checked_out') return false;
      if (!q) return true;
      const flat = staffFlat(s);
      const aadhaar = staffAadhaar(s);
      return (
        (s.name || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q) ||
        String(flat).toLowerCase().includes(q) ||
        String(aadhaar).includes(q) ||
        roleLabel(s).toLowerCase().includes(q)
      );
    });
  }, [activeRows, search, statusFilter, getAttendance]);

  async function onCheckIn(staff) {
    if (!isTodayOnly) {
      showToast('error', 'Past / range', 'Check-in only for today’s single date.');
      return;
    }
    setBusyId(staff.id);
    try {
      await checkInAttendance({ staffId: staff.id });
      showToast('success', 'Checked in', staff.name);
      await load();
    } catch (err) {
      showToast('error', 'Check-in failed', err.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function onCheckOut(staff) {
    if (!isTodayOnly) {
      showToast('error', 'Past / range', 'Check-out only for today’s single date.');
      return;
    }
    const open = dayByStaffId[staff.id];
    if (!open?.id || open.status !== 'checked_in') return;
    setBusyId(staff.id);
    try {
      await checkOutAttendance(open.id, {});
      showToast('success', 'Checked out', staff.name);
      await load();
    } catch (err) {
      showToast('error', 'Check-out failed', err.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function onCallResident(row) {
    setBusyId(row.id);
    try {
      let phone = null;
      if (row.flatId) {
        try {
          const contact = await getFlatContact(row.flatId);
          phone =
            contact?.phone ||
            contact?.residentPhone ||
            contact?.mobile ||
            contact?.primaryPhone ||
            null;
        } catch {
          // fall through to staff phone
        }
      }
      if (!phone) phone = row.phone;
      if (!phone) {
        showToast('error', 'No phone', 'Resident / staff phone is not available.');
        return;
      }
      try {
        await logGuardCall(row.id, `Called resident for ${row.name || 'staff'}`);
      } catch {
        // Dial anyway
      }
      setCalledIds((prev) => {
        const next = new Set(prev);
        next.add(row.id);
        return next;
      });
      window.location.href = `tel:${phone}`;
    } finally {
      setBusyId(null);
    }
  }

  async function onAllowOneTime(row) {
    if (!calledIds.has(row.id)) {
      showToast('error', 'Call first', 'Call the resident before allowing entry.');
      return;
    }
    if (String(row.id).startsWith('demo-')) {
      setOneTimeRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                visitStatus: 'checked_in',
                attendance: {
                  status: 'checked_in',
                  checkInTime: new Date().toISOString(),
                  checkOutTime: null,
                },
              }
            : r,
        ),
      );
      showToast('success', 'Allowed', `${row.name} may enter.`);
      return;
    }
    setBusyId(row.id);
    try {
      await tryGuardApprove(row);
      showToast('success', 'Allowed', `${row.name} may enter.`);
      await load();
    } catch (err) {
      showToast('error', 'Allow failed', err.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function onExitOneTime(row) {
    if (String(row.id).startsWith('demo-')) {
      setOneTimeRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                visitStatus: 'checked_out',
                attendance: {
                  ...r.attendance,
                  status: 'checked_out',
                  checkOutTime: new Date().toISOString(),
                },
              }
            : r,
        ),
      );
      showToast('success', 'Checked out', row.name);
      return;
    }
    setBusyId(row.id);
    try {
      await markVisitorExit(row.id);
      showToast('success', 'Checked out', row.name);
      await load();
    } catch (err) {
      showToast('error', 'Exit failed', err.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="gm-root">
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
                  placeholder="Search name / flat / phone / Aadhaar"
                />
              </div>
              <button type="button" className="gs-add-btn" onClick={() => setModalOpen(true)}>
                + Add Staff
              </button>
            </div>

            <div className="gs-summary" aria-label="Staff filters">
              <FilterDropdown
                value={staffKind}
                onChange={setStaffKind}
                options={KIND_OPTS}
                counts={kindCounts}
                ariaLabel="Staff type"
                alwaysFiltered
              />

              <FilterDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTS}
                counts={counts}
                ariaLabel="Check in / Check out"
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
                    setStatusFilter('all');
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
                    setStatusFilter('all');
                  }}
                />
              </div>
            </div>

            <div className="vtbl-table gs-staff-table">
              <div
                className={`vtbl-head vtbl-grid gs-staff-grid${
                  statusFilter === 'in' ? ' gs-staff-grid--in' : ''
                }`}
              >
                <span>Name</span>
                <span>Role</span>
                <span>Works at</span>
                <span>Phone</span>
                <span>Aadhaar</span>
                <span>Check in</span>
                {statusFilter !== 'in' ? <span>Check out</span> : null}
                <span>Action</span>
              </div>

              {loading ? (
                <div className="vtbl-loading">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="vtbl-empty">
                  <h3>
                    {statusFilter === 'in'
                      ? 'No check-ins in this range'
                      : statusFilter === 'out'
                        ? 'No check-outs in this range'
                        : staffKind === 'onetime'
                          ? 'No one-time staff yet'
                          : 'No regular staff yet'}
                  </h3>
                  <p>
                    {statusFilter === 'all'
                      ? staffKind === 'onetime'
                        ? 'Tap Add Staff to log a one-time entry, then call the resident and allow.'
                        : 'Regular staff from the society list appear here.'
                      : 'Try another date range or switch the filter.'}
                  </p>
                </div>
              ) : (
                filtered.map((s) => {
                  const att = getAttendance(s);
                  const inside = att?.status === 'checked_in';
                  const pending = att?.status === 'pending' || s.visitStatus === 'pending';
                  const busy = busyId === s.id;
                  const isOneTime = s.kind === 'onetime' || staffKind === 'onetime';
                  const called = calledIds.has(s.id);
                  return (
                    <div
                      key={s.id}
                      className={`vtbl-row vtbl-grid gs-staff-grid${
                        statusFilter === 'in' ? ' gs-staff-grid--in' : ''
                      }${inside ? ' gs-staff-row--in' : ''}`}
                    >
                      <div className="vtbl-visitor-info">
                        <div className="vtbl-av">{(s.name || '?').charAt(0).toUpperCase()}</div>
                        <div className="vtbl-name">{s.name || '—'}</div>
                      </div>
                      <div className="vtbl-text" data-label="Role">{roleLabel(s)}</div>
                      <div className="vtbl-text gs-flat-cell" data-label="Works at">
                        {staffFlat(s) === '—' ? '—' : `Flat ${staffFlat(s)}`}
                      </div>
                      <div className="vtbl-phone" data-label="Phone">{s.phone || '—'}</div>
                      <div className="vtbl-mono" data-label="Aadhaar">{formatAadhaar(staffAadhaar(s))}</div>
                      <div className="vtbl-time" data-label="Check in">
                        {formatTime(att?.checkInTime)}
                      </div>
                      {statusFilter !== 'in' ? (
                        <div className="vtbl-time" data-label="Check out">
                          {formatTime(att?.checkOutTime)}
                        </div>
                      ) : null}
                      <div className="vtbl-actions">
                        {isOneTime ? (
                          pending ? (
                            <>
                              <button
                                type="button"
                                className="vtbl-act vtbl-act--call"
                                disabled={busy}
                                onClick={() => onCallResident(s)}
                                title="Call resident"
                              >
                                {busy ? '…' : 'Call'}
                              </button>
                              <button
                                type="button"
                                className="vtbl-act vtbl-act--approve"
                                disabled={busy || !called}
                                onClick={() => onAllowOneTime(s)}
                                title={
                                  called
                                    ? 'Allow entry'
                                    : 'Call the resident first, then allow'
                                }
                              >
                                Allow
                              </button>
                            </>
                          ) : inside ? (
                            <button
                              type="button"
                              className="vtbl-act vtbl-act--exit"
                              disabled={busy}
                              onClick={() => onExitOneTime(s)}
                            >
                              {busy ? '…' : 'Check out'}
                            </button>
                          ) : (
                            <span className="gs-status gs-status--out">Done</span>
                          )
                        ) : !isTodayOnly ? (
                          <span className="gs-status gs-status--out">
                            {att?.status === 'checked_in'
                              ? 'Inside'
                              : att?.status === 'checked_out'
                                ? 'Done'
                                : 'No entry'}
                          </span>
                        ) : inside ? (
                          <button
                            type="button"
                            className="vtbl-act vtbl-act--exit"
                            disabled={busy}
                            onClick={() => onCheckOut(s)}
                          >
                            {busy ? '…' : 'Check out'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="vtbl-act vtbl-act--approve"
                            disabled={busy || att?.status === 'checked_out'}
                            onClick={() => onCheckIn(s)}
                            title={
                              att?.status === 'checked_out'
                                ? 'Already checked out today'
                                : undefined
                            }
                          >
                            {busy ? '…' : 'Check in'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>

      <AddStaffModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onDone={load}
        showToast={showToast}
      />

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
