import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/guard/visitor/visitors.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import AddStaffModal from '../../../components/guard/staff/AddStaffModal.jsx';
import { listStaff } from '../../../services/staff.service.js';
import {
  checkInAttendance,
  checkOutAttendance,
  listAttendance,
} from '../../../services/attendance.service.js';

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

function todayISO() {
  const d = new Date();
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
  /** staffId -> latest attendance row in selected date range */
  const [dayByStaffId, setDayByStaffId] = useState({});
  const [fromDate, setFromDate] = useState(todayISO);
  const [toDate, setToDate] = useState(todayISO);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus); // all | in | out
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
      const [staffRes, attRes] = await Promise.all([
        listStaff({ page: 1, pageSize: 100, isActive: true, sortBy: 'name', sortOrder: 'asc' }),
        listAttendance({
          page: 1,
          pageSize: 200,
          fromDate: from,
          toDate: to,
          sortBy: 'check_in_time',
          sortOrder: 'desc',
        }),
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

      setStaffRows(gateStaff);
      setDayByStaffId(dayMap);
    } catch (err) {
      showToast('error', 'Load failed', err.response?.data?.message || err.message);
      setStaffRows([]);
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

  const counts = useMemo(() => {
    let checkedIn = 0;
    let checkedOut = 0;
    for (const s of staffRows) {
      const att = dayByStaffId[s.id];
      if (!att) continue;
      if (att.status === 'checked_in') checkedIn += 1;
      else if (att.status === 'checked_out') checkedOut += 1;
    }
    return {
      all: staffRows.length,
      in: checkedIn,
      out: checkedOut,
    };
  }, [staffRows, dayByStaffId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staffRows.filter((s) => {
      const att = dayByStaffId[s.id];
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
  }, [staffRows, search, statusFilter, dayByStaffId]);

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

            <div className="gs-summary" role="tablist" aria-label="Staff status filter">
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'all'}
                className={`gs-summary-chip${statusFilter === 'all' ? ' gs-summary-chip--active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                <span className="gs-summary-label">All staff</span>
                <span className="gs-summary-num">{counts.all}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'in'}
                className={`gs-summary-chip gs-summary-chip--in${statusFilter === 'in' ? ' gs-summary-chip--active' : ''}`}
                onClick={() => setStatusFilter('in')}
              >
                <span className="gs-summary-label">Checked in</span>
                <span className="gs-summary-num">{counts.in}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'out'}
                className={`gs-summary-chip gs-summary-chip--out${statusFilter === 'out' ? ' gs-summary-chip--active' : ''}`}
                onClick={() => setStatusFilter('out')}
              >
                <span className="gs-summary-label">Checked out</span>
                <span className="gs-summary-num">{counts.out}</span>
              </button>

              <div className="gs-date-range" aria-label="Date range filter">
                <label className="gs-date-filter">
                  <span>From</span>
                  <input
                    type="date"
                    value={fromDate}
                    max={today}
                    onChange={(e) => {
                      const next = e.target.value || today;
                      setFromDate(next);
                      if (next > toDate) setToDate(next);
                      setStatusFilter('all');
                    }}
                  />
                </label>
                <span className="gs-date-sep">→</span>
                <label className="gs-date-filter">
                  <span>To</span>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    max={today}
                    onChange={(e) => {
                      const next = e.target.value || today;
                      setToDate(next < fromDate ? fromDate : next);
                      setStatusFilter('all');
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="vtbl-table gs-staff-table">
              <div className="vtbl-head vtbl-grid gs-staff-grid">
                <span>Name</span>
                <span>Role</span>
                <span>Works at</span>
                <span>Phone</span>
                <span>Aadhaar</span>
                <span>Check in</span>
                <span>Check out</span>
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
                        : 'No staff yet'}
                  </h3>
                  <p>
                    {statusFilter === 'all'
                      ? 'Tap Add Staff and choose Regular to build the daily list.'
                      : 'Try another date range or switch the filter.'}
                  </p>
                </div>
              ) : (
                filtered.map((s) => {
                  const att = dayByStaffId[s.id];
                  const inside = att?.status === 'checked_in';
                  const busy = busyId === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`vtbl-row vtbl-grid gs-staff-grid${inside ? ' gs-staff-row--in' : ''}`}
                    >
                      <div className="vtbl-visitor-info">
                        <div className="vtbl-av">{(s.name || '?').charAt(0).toUpperCase()}</div>
                        <div className="vtbl-name">{s.name || '—'}</div>
                      </div>
                      <div className="vtbl-text">{roleLabel(s)}</div>
                      <div className="vtbl-text gs-flat-cell">
                        {staffFlat(s) === '—' ? '—' : `Flat ${staffFlat(s)}`}
                      </div>
                      <div className="vtbl-phone">{s.phone || '—'}</div>
                      <div className="vtbl-mono">{formatAadhaar(staffAadhaar(s))}</div>
                      <div className="vtbl-time">{formatTime(att?.checkInTime)}</div>
                      <div className="vtbl-time">{formatTime(att?.checkOutTime)}</div>
                      <div className="vtbl-actions">
                        {!isTodayOnly ? (
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
