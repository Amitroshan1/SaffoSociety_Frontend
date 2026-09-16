import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/guard/visitor/visitors.css';
import '../../../styles/common/crud.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import GateDatePicker from '../../../components/guard/shared/GateDatePicker.jsx';
import ScheduleMonthCalendar from '../../../components/guard/schedule/ScheduleMonthCalendar.jsx';
import { StatusBadge } from '../../../components/common/index.js';
import {
  checkInAttendance,
  checkOutAttendance,
  listAttendance,
} from '../../../services/attendance.service.js';
import { listGates } from '../../../services/gate.service.js';
import { getMyStaff } from '../../../services/staff.service.js';
import {
  SHIFT_STATUS_COLORS,
  completeShift,
  formatShiftLabel,
  formatShiftDate,
  formatShiftTime,
  formatShiftTimeRange,
  listShifts,
  startShift,
  toIsoDate,
} from '../../../services/shift.service.js';
import {
  captureCurrentLocation,
  geolocationErrorMessage,
  summarizeGeo,
} from '../../../utils/guardScheduleGeo.js';

const VIEW_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'shifts', label: 'Shifts' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'log', label: 'Punch Log' },
];

const SHIFT_FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
];

const ATTENDANCE_STATUS_COLORS = {
  checked_in: '#22c55e',
  checked_out: '#64748b',
  voided: '#ef4444',
};

function daysOffsetIso(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return toIsoDate(d);
}

function shiftDateTime(isoDate, hour, minute) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function buildDemoShifts(todayIso) {
  const tomorrow = daysOffsetIso(1);
  const inThreeDays = daysOffsetIso(3);
  const lastWeek = daysOffsetIso(-8);
  return [
    {
      id: 'demo-shift-today',
      shiftDate: todayIso,
      shiftType: 'morning',
      gateName: 'Main Vehicle Gate',
      scheduledStart: shiftDateTime(todayIso, 6, 0),
      scheduledEnd: shiftDateTime(todayIso, 14, 0),
      status: 'scheduled',
      demo: true,
    },
    {
      id: 'demo-shift-up-1',
      shiftDate: tomorrow,
      shiftType: 'evening',
      gateName: 'Pedestrian Gate',
      scheduledStart: shiftDateTime(tomorrow, 14, 0),
      scheduledEnd: shiftDateTime(tomorrow, 22, 0),
      status: 'scheduled',
      demo: true,
    },
    {
      id: 'demo-shift-up-2',
      shiftDate: inThreeDays,
      shiftType: 'night',
      gateName: 'Main Vehicle Gate',
      scheduledStart: shiftDateTime(inThreeDays, 22, 0),
      scheduledEnd: shiftDateTime(daysOffsetIso(4), 6, 0),
      status: 'scheduled',
      demo: true,
    },
    {
      id: 'demo-shift-past-1',
      shiftDate: lastWeek,
      shiftType: 'morning',
      gateName: 'Main Vehicle Gate',
      scheduledStart: shiftDateTime(lastWeek, 6, 0),
      scheduledEnd: shiftDateTime(lastWeek, 14, 0),
      status: 'completed',
      demo: true,
    },
    {
      id: 'demo-shift-past-2',
      shiftDate: lastWeek,
      shiftType: 'evening',
      gateName: 'Main Vehicle Gate',
      scheduledStart: shiftDateTime(lastWeek, 14, 0),
      scheduledEnd: shiftDateTime(lastWeek, 22, 0),
      status: 'completed',
      demo: true,
    },
  ];
}

function mergeApiAndDemo(apiRows, demos) {
  const merged = [...apiRows];
  for (const d of demos) {
    if (!merged.some((r) => r.id === d.id)) merged.push(d);
  }
  return merged;
}

function normalizeShiftDate(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function attendanceDay(row) {
  if (!row?.checkInTime) return '';
  return String(row.checkInTime).slice(0, 10);
}

function matchesShiftFilter(row, filter, todayIso, selectedDate) {
  const rowDate = normalizeShiftDate(row.shiftDate);
  if (filter === 'today') return rowDate === todayIso;
  if (filter === 'upcoming') return rowDate > todayIso;
  if (filter === 'date') return Boolean(selectedDate) && rowDate === selectedDate;
  return true;
}

function formatStamp(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

function formatTotalHours(checkInTime, checkOutTime) {
  if (!checkInTime || !checkOutTime) return null;
  const start = new Date(checkInTime).getTime();
  const end = new Date(checkOutTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const totalMins = Math.round((end - start) / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours <= 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

const PUNCH_LOC_STORAGE_KEY = 'guardSchedulePunchLocations';

function readPunchLocations() {
  try {
    const raw = localStorage.getItem(PUNCH_LOC_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePunchLocations(map) {
  try {
    localStorage.setItem(PUNCH_LOC_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}

function savePunchLocation(attendanceId, phase, onLocation) {
  if (!attendanceId || typeof onLocation !== 'boolean') return;
  const map = readPunchLocations();
  const prev = map[attendanceId] || {};
  map[attendanceId] = { ...prev, [phase]: onLocation };
  writePunchLocations(map);
}

function punchLocationLabel(attendanceId, phase, punchLocMap) {
  const flag = punchLocMap?.[attendanceId]?.[phase];
  if (flag === true) return 'Inside location';
  if (flag === false) return 'Outside location';
  return 'Location N/A';
}

function punchLocationTone(attendanceId, phase, punchLocMap) {
  const flag = punchLocMap?.[attendanceId]?.[phase];
  if (flag === true) return 'inside';
  if (flag === false) return 'outside';
  return 'unknown';
}

export default function MySchedulePage() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [gates, setGates] = useState([]);
  const [shiftRows, setShiftRows] = useState([]);
  const [demoShifts, setDemoShifts] = useState(() => buildDemoShifts(toIsoDate(new Date())));
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [view, setView] = useState('overview');
  const [logVisibleCount, setLogVisibleCount] = useState(20);
  const [shiftFilter, setShiftFilter] = useState('today');
  const [shiftDate, setShiftDate] = useState(() => toIsoDate(new Date()));
  const [calendarDate, setCalendarDate] = useState(() => toIsoDate(new Date()));
  const [gateId, setGateId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locError, setLocError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [punchLocMap, setPunchLocMap] = useState(() => readPunchLocations());

  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  function rememberPunchLocation(attendanceId, phase, onLocation) {
    savePunchLocation(attendanceId, phase, onLocation);
    setPunchLocMap(readPunchLocations());
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const meRes = await getMyStaff();
      const me = meRes.data?.data?.staff;
      setStaff(me);
      const demos = buildDemoShifts(toIsoDate(new Date()));
      if (!me?.id) {
        setShiftRows([]);
        setAttendanceRows([]);
        setDemoShifts(demos);
        return;
      }
      setGateId(me.assignedGateId || '');
      const [shiftRes, attRes, gateRes] = await Promise.all([
        listShifts({
          page: 1,
          pageSize: 60,
          sortBy: 'shift_date',
          sortOrder: 'asc',
          staffId: me.id,
        }),
        listAttendance({
          page: 1,
          pageSize: 100,
          sortBy: 'check_in_time',
          sortOrder: 'desc',
          staffId: me.id,
        }),
        listGates({ page: 1, pageSize: 50, isActive: true }),
      ]);
      setShiftRows(shiftRes.data?.data?.shifts || []);
      setAttendanceRows(attRes.data?.data?.attendance || []);
      setGates(gateRes.data?.data?.gates || []);
      setDemoShifts(demos);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load schedule');
      setDemoShifts(buildDemoShifts(toIsoDate(new Date())));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'My Schedule | Guard Dashboard';
    load();
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, [load]);

  const displayShifts = useMemo(
    () => mergeApiAndDemo(shiftRows, demoShifts),
    [shiftRows, demoShifts],
  );

  const punchableShifts = useMemo(
    () =>
      displayShifts.filter((s) => {
        const d = normalizeShiftDate(s.shiftDate);
        return d === todayIso && ['scheduled', 'active'].includes(s.status);
      }),
    [displayShifts, todayIso],
  );

  useEffect(() => {
    if (shiftId || punchableShifts.length === 0) return;
    const first = punchableShifts[0];
    setShiftId(first.id);
    if (first.gateId) setGateId(first.gateId);
  }, [punchableShifts, shiftId]);

  const openAttendance = attendanceRows.find((r) => r.status === 'checked_in');
  const selectedGate = useMemo(
    () => gates.find((g) => String(g.id) === String(gateId)) || null,
    [gates, gateId],
  );

  const attendanceByDay = useMemo(() => {
    const map = {};
    for (const row of attendanceRows) {
      const iso = attendanceDay(row);
      if (!iso) continue;
      map[iso] = map[iso] || { present: true, rows: [] };
      map[iso].rows.push(row);
    }
    return map;
  }, [attendanceRows]);

  const shiftsByDay = useMemo(() => {
    const map = {};
    for (const row of displayShifts) {
      const iso = normalizeShiftDate(row.shiftDate);
      if (!iso) continue;
      map[iso] = map[iso] || [];
      map[iso].push(row);
    }
    return map;
  }, [displayShifts]);

  const calendarMarks = useMemo(() => {
    const marks = {};
    const allDates = new Set([
      ...Object.keys(attendanceByDay),
      ...Object.keys(shiftsByDay),
    ]);
    for (const iso of allDates) {
      if (attendanceByDay[iso]?.present) {
        marks[iso] = 'present';
      } else if (iso < todayIso && (shiftsByDay[iso]?.length || 0) > 0) {
        marks[iso] = 'absent';
      } else if ((shiftsByDay[iso]?.length || 0) > 0) {
        marks[iso] = 'scheduled';
      }
    }
    return marks;
  }, [attendanceByDay, shiftsByDay, todayIso]);

  const shiftCounts = useMemo(
    () => ({
      today: displayShifts.filter((r) => normalizeShiftDate(r.shiftDate) === todayIso).length,
      upcoming: displayShifts.filter((r) => normalizeShiftDate(r.shiftDate) > todayIso).length,
    }),
    [displayShifts, todayIso],
  );

  const visibleShifts = useMemo(() => {
    const filtered = displayShifts.filter((r) =>
      matchesShiftFilter(r, shiftFilter, todayIso, shiftDate),
    );
    return [...filtered].sort((a, b) => {
      const byDate = String(a.shiftDate).localeCompare(String(b.shiftDate));
      if (byDate !== 0) return byDate;
      return String(a.scheduledStart || '').localeCompare(String(b.scheduledStart || ''));
    });
  }, [displayShifts, shiftFilter, todayIso, shiftDate]);

  const calendarDayShifts = shiftsByDay[calendarDate] || [];
  const calendarDayAttendance = attendanceByDay[calendarDate]?.rows || [];

  const monthAttendanceSummary = useMemo(() => {
    const prefix = String(calendarDate || '').slice(0, 7); // YYYY-MM
    let worked = 0;
    let leave = 0;
    let upcoming = 0;
    if (!prefix) return { worked, leave, upcoming, monthLabel: '' };
    for (const [iso, mark] of Object.entries(calendarMarks)) {
      if (!iso.startsWith(prefix)) continue;
      if (mark === 'present') worked += 1;
      else if (mark === 'absent') leave += 1;
      else if (mark === 'scheduled') upcoming += 1;
    }
    let monthLabel = prefix;
    try {
      monthLabel = new Date(`${prefix}-01T12:00:00`).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      /* keep prefix */
    }
    return { worked, leave, upcoming, monthLabel };
  }, [calendarDate, calendarMarks]);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  async function captureGpsQuietly() {
    return captureCurrentLocation();
  }

  async function syncShiftOnPunchIn(linkedShiftId) {
    if (!linkedShiftId) return;
    if (String(linkedShiftId).startsWith('demo-')) {
      setDemoShifts((prev) =>
        prev.map((r) => (r.id === linkedShiftId ? { ...r, status: 'active' } : r)),
      );
      return;
    }
    try {
      await startShift(linkedShiftId, {});
    } catch {
      /* punch is source of truth; shift sync is best-effort */
    }
  }

  async function syncShiftOnPunchOut(linkedShiftId) {
    if (!linkedShiftId) return;
    if (String(linkedShiftId).startsWith('demo-')) {
      setDemoShifts((prev) =>
        prev.map((r) => (r.id === linkedShiftId ? { ...r, status: 'completed' } : r)),
      );
      return;
    }
    try {
      await completeShift(linkedShiftId, {});
    } catch {
      /* punch is source of truth; shift sync is best-effort */
    }
  }

  async function onCheckIn() {
    if (!staff?.id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    setLocError('');
    let location = null;
    try {
      location = await captureGpsQuietly();
    } catch (err) {
      setLocError(geolocationErrorMessage(err));
      setError('Could not get GPS. Allow location and try again.');
      setSaving(false);
      return;
    }
    const onLocation = summarizeGeo(location, selectedGate).state === 'on_location';
    const linkedShiftId = shiftId || undefined;
    const minimalPayload = {
      staffId: staff.id,
      gateId: gateId || undefined,
      shiftId: linkedShiftId,
    };
    try {
      const res = await checkInAttendance(minimalPayload);
      const attId = res.data?.data?.attendance?.id;
      rememberPunchLocation(attId, 'checkIn', onLocation);
      await syncShiftOnPunchIn(linkedShiftId);
      setSuccess('Punched in');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Punch in failed');
    } finally {
      setSaving(false);
    }
  }

  async function onCheckOut() {
    if (!openAttendance) return;
    setSaving(true);
    setError('');
    setSuccess('');
    setLocError('');
    let location = null;
    try {
      location = await captureGpsQuietly();
    } catch (err) {
      setLocError(geolocationErrorMessage(err));
      setError('Could not get GPS. Allow location and try again.');
      setSaving(false);
      return;
    }
    const gateForGeo =
      gates.find((g) => String(g.id) === String(openAttendance.gateId || gateId)) || selectedGate;
    const onLocation = summarizeGeo(location, gateForGeo).state === 'on_location';
    const linkedShiftId = openAttendance.shiftId || shiftId || undefined;
    try {
      await checkOutAttendance(openAttendance.id, {});
      rememberPunchLocation(openAttendance.id, 'checkOut', onLocation);
      await syncShiftOnPunchOut(linkedShiftId);
      setSuccess('Punched out');
      await load();
    } catch (innerErr) {
      setError(innerErr.response?.data?.message || 'Punch out failed');
    } finally {
      setSaving(false);
    }
  }

  function renderPunchPanel() {
    if (!staff) return null;
    const checkedIn = Boolean(openAttendance);

    return (
      <div className="glass-card gm-sched-punch">
        <div className="gm-sched-punch-left">
          <div className="gm-sched-punch-head">
            <h3 className="gm-sched-punch-title">Punch In / Out</h3>
            <StatusBadge
              status={checkedIn ? 'checked_in' : 'checked_out'}
              colors={ATTENDANCE_STATUS_COLORS}
            />
          </div>
          {checkedIn ? (
            <p className="gm-sched-punch-session">
              <span className="gm-sched-punch-session-label">Session</span>
              {formatStamp(openAttendance.checkInTime)}
              {openAttendance.gateName ? ` · ${openAttendance.gateName}` : ''}
            </p>
          ) : (
            <div className="gm-sched-punch-fields">
              <select
                className="gm-sched-punch-select"
                value={gateId}
                onChange={(e) => setGateId(e.target.value)}
                aria-label="Gate"
              >
                <option value="">Gate</option>
                {gates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code})
                  </option>
                ))}
              </select>
              <select
                className="gm-sched-punch-select"
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                aria-label="Today's shift"
              >
                <option value="">Shift (optional)</option>
                {punchableShifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatShiftTimeRange(s.scheduledStart, s.scheduledEnd)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="gm-sched-punch-actions">
          {!checkedIn ? (
            <button
              type="button"
              className="btn-primary gm-sched-punch-main"
              disabled={saving}
              onClick={onCheckIn}
            >
              {saving ? 'Getting GPS…' : 'Punch in'}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary gm-sched-punch-main gm-sched-punch-out"
              disabled={saving}
              onClick={onCheckOut}
            >
              {saving ? 'Getting GPS…' : 'Punch out'}
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderShiftTable(rows) {
    return (
      <table className="crud-table gm-shift-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Gate</th>
            <th>Schedule</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5}>
                <div className="gm-shift-empty">
                  <strong>No shifts in this view</strong>
                  <span>Try another filter or date.</span>
                </div>
              </td>
            </tr>
          )}
          {rows.map((row) => {
            const isToday = normalizeShiftDate(row.shiftDate) === todayIso;
            return (
              <tr key={row.id} className={isToday ? 'gm-shift-row--today' : undefined}>
                <td>
                  <div className="gm-shift-date">
                    <span className="gm-shift-date-main">{formatShiftDate(row.shiftDate)}</span>
                    {isToday && <span className="gm-shift-today-tag">Today</span>}
                  </div>
                </td>
                <td>
                  <span className="gm-shift-type">{formatShiftLabel(row.shiftType)}</span>
                </td>
                <td>{row.gateName || '—'}</td>
                <td>
                  <span className="gm-shift-time">
                    {formatShiftTimeRange(row.scheduledStart, row.scheduledEnd)}
                  </span>
                </td>
                <td>
                  <StatusBadge status={row.status} colors={SHIFT_STATUS_COLORS} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className="gm-root">
      <Sidebar activePage="My Schedule" onNavigate={handleSidebarNav} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <div className="gm-shift-header">
            <div>
              <h2 className="gm-park-page-title">My Schedule</h2>
              {staff ? (
                <div className="gm-shift-meta">
                  <span className="gm-shift-meta-name">{staff.name}</span>
                  <span className="gm-shift-meta-code">{staff.code}</span>
                </div>
              ) : (
                <p className="gm-shift-meta-empty">
                  Link your guard account to a staff record to manage schedule and attendance.
                </p>
              )}
            </div>
          </div>

          {error && <div className="gm-shift-alert gm-shift-alert--error">{error}</div>}
          {locError && <div className="gm-shift-alert gm-shift-alert--error">{locError}</div>}
          {success && <div className="gm-shift-alert gm-shift-alert--ok">{success}</div>}

          <div className="gm-sched-topbar">
            <div className="gm-sched-view-tabs glass-card" role="tablist" aria-label="Schedule views">
              {VIEW_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={view === t.key}
                  className={`gm-sched-tab gm-sched-tab--${t.key}${view === t.key ? ' is-active' : ''}`}
                  onClick={() => setView(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {!loading && staff ? renderPunchPanel() : null}
          </div>

          {loading ? (
            <p className="gm-shift-loading">Loading schedule…</p>
          ) : (
            <>
              {view === 'overview' && (
                <div className="gm-sched-overview">
                  <div className="gm-sched-stats">
                    <div className="glass-card gm-sched-stat">
                      <span>Today shifts</span>
                      <strong>{shiftCounts.today}</strong>
                    </div>
                    <div className="glass-card gm-sched-stat">
                      <span>Upcoming</span>
                      <strong>{shiftCounts.upcoming}</strong>
                    </div>
                    <div className="glass-card gm-sched-stat">
                      <span>Present days</span>
                      <strong>{Object.keys(attendanceByDay).length}</strong>
                    </div>
                  </div>
                  <div className="glass-card gm-park-table-card gm-shift-card">
                    <h3 className="gm-park-table-title">Today&apos;s duty</h3>
                    {renderShiftTable(
                      displayShifts.filter((r) => normalizeShiftDate(r.shiftDate) === todayIso),
                    )}
                  </div>
                </div>
              )}

              {view === 'shifts' && (
                <>
                  <div className="gm-shift-filters-row">
                    <div className="gm-book-filters">
                      {SHIFT_FILTERS.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          className={`gm-book-filter${shiftFilter === f.key ? ' gm-book-filter--active' : ''}`}
                          onClick={() => setShiftFilter(f.key)}
                        >
                          {f.label}
                          <span className="gm-book-filter-count">{shiftCounts[f.key]}</span>
                        </button>
                      ))}
                    </div>
                    <div className={`gm-shift-date-wrap${shiftFilter === 'date' ? ' is-active' : ''}`}>
                      <GateDatePicker
                        label="Date"
                        value={shiftDate}
                        allowClear={false}
                        displayFormat="mdy"
                        onChange={(next) => {
                          setShiftDate(next || todayIso);
                          setShiftFilter('date');
                        }}
                      />
                    </div>
                  </div>
                  <div className="glass-card gm-park-table-card gm-shift-card">
                    {renderShiftTable(visibleShifts)}
                  </div>
                </>
              )}

              {view === 'attendance' && (
                <div className="gm-sched-att-layout">
                  <ScheduleMonthCalendar
                    value={calendarDate}
                    onChange={setCalendarDate}
                    dayMarks={calendarMarks}
                    todayIso={todayIso}
                  />
                  <div className="gm-sched-att-side glass-card">
                    {(() => {
                      const mark = calendarMarks[calendarDate];
                      const statusLabel =
                        mark === 'present'
                          ? 'Present'
                          : mark === 'absent'
                            ? 'Absent'
                            : mark === 'scheduled'
                              ? 'Scheduled'
                              : 'No record';
                      const statusTone =
                        mark === 'present'
                          ? 'present'
                          : mark === 'absent'
                            ? 'absent'
                            : mark === 'scheduled'
                              ? 'scheduled'
                              : 'none';
                      return (
                        <>
                          <div className="gm-sched-month-summary">
                            <p className="gm-sched-day-kicker">{monthAttendanceSummary.monthLabel} summary</p>
                            <div className="gm-sched-month-stats">
                              <div className="gm-sched-month-stat gm-sched-month-stat--worked">
                                <strong>{monthAttendanceSummary.worked}</strong>
                                <span>Days worked</span>
                              </div>
                              <div className="gm-sched-month-stat gm-sched-month-stat--leave">
                                <strong>{monthAttendanceSummary.leave}</strong>
                                <span>On leave</span>
                              </div>
                              <div className="gm-sched-month-stat gm-sched-month-stat--upcoming">
                                <strong>{monthAttendanceSummary.upcoming}</strong>
                                <span>Upcoming</span>
                              </div>
                            </div>
                          </div>

                          <div className="gm-sched-day-head">
                            <div>
                              <p className="gm-sched-day-kicker">Day details</p>
                              <h3 className="gm-sched-day-title">{formatShiftDate(calendarDate)}</h3>
                            </div>
                            <span className={`gm-sched-day-status gm-sched-day-status--${statusTone}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="gm-sched-day-split">
                            <section className="gm-sched-day-section gm-sched-day-card" aria-label="Shifts">
                              <div className="gm-sched-day-section-head">
                                <h4>Shifts</h4>
                                <span>{calendarDayShifts.length}</span>
                              </div>
                              {calendarDayShifts.length === 0 ? (
                                <p className="gm-sched-day-empty">No shift on this date.</p>
                              ) : (
                                <ul className="gm-sched-day-list">
                                  {calendarDayShifts.map((s) => (
                                    <li key={s.id} className="gm-sched-day-item">
                                      <div className="gm-sched-day-item-main">
                                        <strong>{formatShiftTimeRange(s.scheduledStart, s.scheduledEnd)}</strong>
                                        <span>{s.gateName || 'Unassigned gate'}</span>
                                      </div>
                                      <StatusBadge status={s.status} colors={SHIFT_STATUS_COLORS} />
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </section>

                            <section className="gm-sched-day-section gm-sched-day-card" aria-label="Punch times">
                              <div className="gm-sched-day-section-head">
                                <h4>Punch in / out</h4>
                                <span>{calendarDayAttendance.length}</span>
                              </div>
                              {calendarDayAttendance.length === 0 ? (
                                <p className="gm-sched-day-empty">No punch record on this date.</p>
                              ) : (
                                <ul className="gm-sched-day-list">
                                  {calendarDayAttendance.map((a) => {
                                    const totalHours = formatTotalHours(a.checkInTime, a.checkOutTime);
                                    return (
                                      <li key={a.id} className="gm-sched-day-punch">
                                        <div className="gm-sched-day-punch-cell">
                                          <span className="gm-sched-day-punch-label">In</span>
                                          <strong>{formatShiftTime(a.checkInTime) || '—'}</strong>
                                          <em
                                            className={`gm-sched-day-loc gm-sched-day-loc--${punchLocationTone(a.id, 'checkIn', punchLocMap)}`}
                                          >
                                            {punchLocationLabel(a.id, 'checkIn', punchLocMap)}
                                          </em>
                                        </div>
                                        <div className="gm-sched-day-punch-divider" aria-hidden />
                                        <div className="gm-sched-day-punch-cell">
                                          <span className="gm-sched-day-punch-label">Out</span>
                                          <strong>{formatShiftTime(a.checkOutTime) || '—'}</strong>
                                          <em
                                            className={`gm-sched-day-loc gm-sched-day-loc--${punchLocationTone(a.id, 'checkOut', punchLocMap)}`}
                                          >
                                            {a.checkOutTime
                                              ? punchLocationLabel(a.id, 'checkOut', punchLocMap)
                                              : '—'}
                                          </em>
                                        </div>
                                        <div className="gm-sched-day-punch-footer">
                                          {a.gateName ? (
                                            <p className="gm-sched-day-punch-gate">{a.gateName}</p>
                                          ) : (
                                            <span />
                                          )}
                                          {totalHours ? (
                                            <p className="gm-sched-day-punch-total">
                                              <span>Total</span>
                                              <strong>{totalHours}</strong>
                                            </p>
                                          ) : null}
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </section>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {view === 'log' && (
                <div className="glass-card gm-sched-log">
                  <div className="gm-sched-log-head">
                    <div>
                      <h3 className="gm-sched-log-title">Punch Log</h3>
                      <p className="gm-sched-log-sub">
                        Compact history · showing {Math.min(logVisibleCount, attendanceRows.length)} of{' '}
                        {attendanceRows.length}
                      </p>
                    </div>
                    <span className="gm-sched-log-count">{attendanceRows.length}</span>
                  </div>

                  {attendanceRows.length === 0 ? (
                    <p className="gm-sched-day-empty">No punch records yet.</p>
                  ) : (
                    <>
                      <div className="gm-sched-log-table-wrap">
                        <table className="gm-sched-log-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Gate</th>
                              <th>In</th>
                              <th>Out</th>
                              <th>Location</th>
                              <th>Total</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceRows.slice(0, logVisibleCount).map((row) => {
                              const dayIso = attendanceDay(row);
                              const totalHours = formatTotalHours(row.checkInTime, row.checkOutTime);
                              const inLoc = punchLocationLabel(row.id, 'checkIn', punchLocMap);
                              const outLoc = row.checkOutTime
                                ? punchLocationLabel(row.id, 'checkOut', punchLocMap)
                                : '—';
                              return (
                                <tr key={row.id}>
                                  <td data-label="Date">
                                    <span className="gm-sched-log-date-cell">{formatShiftDate(dayIso)}</span>
                                  </td>
                                  <td data-label="Gate">{row.gateName || '—'}</td>
                                  <td data-label="In">
                                    <strong className="gm-sched-log-time">{formatShiftTime(row.checkInTime) || '—'}</strong>
                                  </td>
                                  <td data-label="Out">
                                    <strong className="gm-sched-log-time">{formatShiftTime(row.checkOutTime) || '—'}</strong>
                                  </td>
                                  <td data-label="Location">
                                    <div className="gm-sched-log-loc-stack">
                                      <em
                                        className={`gm-sched-day-loc gm-sched-day-loc--${punchLocationTone(row.id, 'checkIn', punchLocMap)}`}
                                      >
                                        In · {inLoc}
                                      </em>
                                      <em
                                        className={`gm-sched-day-loc gm-sched-day-loc--${row.checkOutTime ? punchLocationTone(row.id, 'checkOut', punchLocMap) : 'unknown'}`}
                                      >
                                        Out · {outLoc}
                                      </em>
                                    </div>
                                  </td>
                                  <td data-label="Total">
                                    <strong className="gm-sched-log-total">{totalHours || '—'}</strong>
                                  </td>
                                  <td data-label="Status">
                                    <StatusBadge status={row.status} colors={ATTENDANCE_STATUS_COLORS} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {logVisibleCount < attendanceRows.length ? (
                        <div className="gm-sched-log-more">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setLogVisibleCount((n) => n + 20)}
                          >
                            Show more ({attendanceRows.length - logVisibleCount} left)
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
