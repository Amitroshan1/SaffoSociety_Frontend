import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock3, MapPin, Shield } from 'lucide-react';
import { navigateGuard } from '@/modules/guard/constants/guardRoutes.js';
import Sidebar from '@/modules/guard/components/Sidebar';
import DashboardHeader from '@/modules/guard/components/DashboardHeader';
import GateDatePicker from '@/modules/guard/components/shared/GateDatePicker.jsx';
import ScheduleMonthCalendar from '@/modules/guard/components/schedule/ScheduleMonthCalendar.jsx';
import { StatusBadge } from '@/modules/guard/common/index.js';
import {
  ATTENDANCE_STATUS_COLORS,
  SHIFT_STATUS,
  SHIFT_STATUS_COLORS,
  formatShiftDate,
  formatShiftLabel,
  formatShiftTime,
  formatShiftTimeRange,
  getAttendance,
  getShifts,
  punchIn,
  punchOut,
  toIsoDate,
} from '@/modules/guard/services/schedule/schedule.service.js';
import { apiErrorMessage } from '@/modules/guard/services/core/http';
import {
  captureCurrentLocation,
  geolocationErrorMessage,
  summarizeGeo,
} from '@/modules/guard/utils/guardScheduleGeo.js';
import '@/modules/guard/styles/core/guard-main.css';
import '@/modules/guard/styles/booking/booking.css';
import '@/modules/guard/styles/schedule/schedule.css';

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

/** Punch panel badge labels (UI) — map to PDF attendance under the hood */
const PUNCH_BADGE_COLORS = {
  checked_in: '#22c55e',
  checked_out: '#64748b',
};

const PUNCH_LOC_STORAGE_KEY = 'guardSchedulePunchLocations';

function normalizeDutyDate(value) {
  return String(value || '').slice(0, 10);
}

function formatStamp(value) {
  if (!value) return '—';
  const text = String(value);
  if (/^\d{2}:\d{2}/.test(text) && text.length <= 8) return text.slice(0, 5);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toLocaleString();
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
    /* ignore */
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

function gateFromShift(shift) {
  if (!shift) return null;
  return {
    name: shift.gateName,
    code: shift.gateCode,
    latitude: shift.latitude,
    longitude: shift.longitude,
  };
}

export default function MySchedulePage() {
  const navigate = useNavigate();
  const [shiftRows, setShiftRows] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [view, setView] = useState('overview');
  const [logVisibleCount, setLogVisibleCount] = useState(20);
  const [shiftFilter, setShiftFilter] = useState('today');
  const [shiftDate, setShiftDate] = useState(() => toIsoDate());
  const [calendarDate, setCalendarDate] = useState(() => toIsoDate());
  const [gateKey, setGateKey] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locError, setLocError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [punchLocMap, setPunchLocMap] = useState(() => readPunchLocations());

  const todayIso = useMemo(() => toIsoDate(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [shiftRes, attRes] = await Promise.all([
        getShifts({ page: 1, pageSize: 60, sortBy: 'dutyDate', sortOrder: 'asc' }),
        getAttendance({ page: 1, pageSize: 100, sortBy: 'dutyDate', sortOrder: 'desc' }),
      ]);
      setShiftRows(shiftRes.items || []);
      setAttendanceRows(attRes.items || []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load schedule'));
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

  const staffMeta = useMemo(() => {
    const s = shiftRows[0];
    if (!s) return null;
    return { name: s.staffName, code: s.staffCode };
  }, [shiftRows]);

  const punchableShifts = useMemo(
    () =>
      shiftRows.filter((s) => {
        const d = normalizeDutyDate(s.dutyDate);
        return d === todayIso && s.status === SHIFT_STATUS.SCHEDULED;
      }),
    [shiftRows, todayIso],
  );

  const todayGates = useMemo(() => {
    const map = new Map();
    for (const s of punchableShifts) {
      const key = String(s.gateCode || s.gateName || s.id);
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: s.gateName || 'Gate',
          code: s.gateCode || '',
          latitude: s.latitude,
          longitude: s.longitude,
        });
      }
    }
    return [...map.values()];
  }, [punchableShifts]);

  const shiftsForGate = useMemo(() => {
    if (!gateKey) return punchableShifts;
    return punchableShifts.filter(
      (s) => String(s.gateCode || s.gateName || s.id) === String(gateKey),
    );
  }, [punchableShifts, gateKey]);

  const openShift = useMemo(
    () => shiftRows.find((s) => s.status === SHIFT_STATUS.IN_PROGRESS) || null,
    [shiftRows],
  );

  const openAttendance = useMemo(() => {
    if (!openShift) return null;
    return (
      attendanceRows.find(
        (a) =>
          String(a.shiftId) === String(openShift.id) &&
          a.checkInTime &&
          !a.checkOutTime,
      ) || null
    );
  }, [attendanceRows, openShift]);

  useEffect(() => {
    if (gateKey || todayGates.length === 0) return;
    setGateKey(todayGates[0].key);
  }, [todayGates, gateKey]);

  useEffect(() => {
    if (!shiftsForGate.some((s) => String(s.id) === String(shiftId))) {
      setShiftId(shiftsForGate[0] ? String(shiftsForGate[0].id) : '');
    }
  }, [shiftsForGate, shiftId]);

  const attendanceByDay = useMemo(() => {
    const map = {};
    for (const row of attendanceRows) {
      const iso = normalizeDutyDate(row.dutyDate);
      if (!iso) continue;
      map[iso] = map[iso] || { present: false, rows: [] };
      if (row.status === 'present') map[iso].present = true;
      map[iso].rows.push(row);
    }
    return map;
  }, [attendanceRows]);

  const shiftsByDay = useMemo(() => {
    const map = {};
    for (const row of shiftRows) {
      const iso = normalizeDutyDate(row.dutyDate);
      if (!iso) continue;
      map[iso] = map[iso] || [];
      map[iso].push(row);
    }
    return map;
  }, [shiftRows]);

  const calendarMarks = useMemo(() => {
    const marks = {};
    const allDates = new Set([...Object.keys(attendanceByDay), ...Object.keys(shiftsByDay)]);
    for (const iso of allDates) {
      const att = attendanceByDay[iso];
      if (att?.rows?.some((r) => r.status === 'present')) marks[iso] = 'present';
      else if (att?.rows?.some((r) => r.status === 'absent')) marks[iso] = 'absent';
      else if ((shiftsByDay[iso]?.length || 0) > 0) marks[iso] = 'scheduled';
    }
    return marks;
  }, [attendanceByDay, shiftsByDay]);

  const presentDaysCount = useMemo(
    () => Object.values(calendarMarks).filter((m) => m === 'present').length,
    [calendarMarks],
  );

  const shiftCounts = useMemo(
    () => ({
      today: shiftRows.filter((r) => normalizeDutyDate(r.dutyDate) === todayIso).length,
      upcoming: shiftRows.filter((r) => normalizeDutyDate(r.dutyDate) > todayIso).length,
    }),
    [shiftRows, todayIso],
  );

  const visibleShifts = useMemo(() => {
    let filtered = shiftRows;
    if (shiftFilter === 'today') {
      filtered = shiftRows.filter((r) => normalizeDutyDate(r.dutyDate) === todayIso);
    } else if (shiftFilter === 'upcoming') {
      filtered = shiftRows.filter((r) => normalizeDutyDate(r.dutyDate) > todayIso);
    } else if (shiftFilter === 'date' && shiftDate) {
      filtered = shiftRows.filter((r) => normalizeDutyDate(r.dutyDate) === shiftDate);
    }
    return [...filtered].sort((a, b) => {
      const byDate = String(a.dutyDate).localeCompare(String(b.dutyDate));
      if (byDate !== 0) return byDate;
      return String(a.startTime || '').localeCompare(String(b.startTime || ''));
    });
  }, [shiftRows, shiftFilter, todayIso, shiftDate]);

  const todayShifts = useMemo(
    () => shiftRows.filter((r) => normalizeDutyDate(r.dutyDate) === todayIso),
    [shiftRows, todayIso],
  );

  const calendarDayShifts = shiftsByDay[calendarDate] || [];
  const calendarDayAttendance = attendanceByDay[calendarDate]?.rows || [];

  const monthAttendanceSummary = useMemo(() => {
    const prefix = String(calendarDate || '').slice(0, 7);
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
      /* keep */
    }
    return { worked, leave, upcoming, monthLabel };
  }, [calendarDate, calendarMarks]);

  const punchLogRows = useMemo(() => {
    return [...attendanceRows]
      .filter((a) => a.checkInTime || a.status === 'present' || a.status === 'absent')
      .sort((a, b) => String(b.dutyDate || '').localeCompare(String(a.dutyDate || '')));
  }, [attendanceRows]);

  async function requireGps() {
    try {
      const location = await captureCurrentLocation();
      const lat = Number(location?.latitude);
      const lng = Number(location?.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error('Location is required for punch.');
      }
      return { ...location, latitude: lat, longitude: lng };
    } catch (err) {
      setLocError(geolocationErrorMessage(err));
      setError('Could not get GPS. Allow location and try again.');
      return null;
    }
  }

  function rememberPunchLocation(attId, phase, onLocation) {
    savePunchLocation(attId, phase, onLocation);
    setPunchLocMap(readPunchLocations());
  }

  async function onCheckIn() {
    if (!shiftId) {
      setError('Select a shift to punch in.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    setLocError('');
    const gps = await requireGps();
    if (!gps) {
      setSaving(false);
      return;
    }
    const selected = punchableShifts.find((s) => String(s.id) === String(shiftId));
    const onLocation = summarizeGeo(gps, gateFromShift(selected)).state === 'on_location';
    try {
      const res = await punchIn({ shiftId, latitude: gps.latitude, longitude: gps.longitude });
      const attId = res?.attendance?.id;
      rememberPunchLocation(attId, 'checkIn', onLocation);
      setSuccess('Punched in');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Punch in failed'));
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function onCheckOut() {
    if (!openShift) return;
    setSaving(true);
    setError('');
    setSuccess('');
    setLocError('');
    const gps = await requireGps();
    if (!gps) {
      setSaving(false);
      return;
    }
    const onLocation = summarizeGeo(gps, gateFromShift(openShift)).state === 'on_location';
    try {
      const res = await punchOut({
        shiftId: openShift.id,
        latitude: gps.latitude,
        longitude: gps.longitude,
      });
      const attId = res?.attendance?.id || openAttendance?.id;
      rememberPunchLocation(attId, 'checkOut', onLocation);
      setSuccess('Punched out');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Punch out failed'));
      await load();
    } finally {
      setSaving(false);
    }
  }

  function renderPunchPanel() {
    const checkedIn = Boolean(openShift);
    return (
      <div className="glass-card gm-sched-punch">
        <div className="gm-sched-punch-left">
          <div className="gm-sched-punch-head">
            <h3 className="gm-sched-punch-title">Punch In / Out</h3>
            <StatusBadge
              status={checkedIn ? 'checked_in' : 'checked_out'}
              colors={PUNCH_BADGE_COLORS}
            />
          </div>
          {checkedIn ? (
            <p className="gm-sched-punch-session">
              <span className="gm-sched-punch-session-label">Session</span>
              {formatStamp(openAttendance?.checkInTime || openShift.startTime)}
              {openShift.gateName ? ` · ${openShift.gateName}` : ''}
            </p>
          ) : (
            <div className="gm-sched-punch-fields">
              <select
                className="gm-sched-punch-select"
                value={gateKey}
                onChange={(e) => setGateKey(e.target.value)}
                aria-label="Gate"
              >
                <option value="">Gate</option>
                {todayGates.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.name}
                    {g.code ? ` (${g.code})` : ''}
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
                {shiftsForGate.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatShiftTimeRange(s.startTime, s.endTime)}
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
              disabled={saving || !shiftId}
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
            const isToday = normalizeDutyDate(row.dutyDate) === todayIso;
            return (
              <tr key={row.id} className={isToday ? 'gm-shift-row--today' : undefined}>
                <td>
                  <div className="gm-shift-date">
                    <span className="gm-shift-date-main">{formatShiftDate(row.dutyDate)}</span>
                    {isToday ? <span className="gm-shift-today-tag">Today</span> : null}
                  </div>
                </td>
                <td>
                  <span className="gm-shift-type">{formatShiftLabel(row.shiftType)}</span>
                </td>
                <td>
                  {row.gateName || '—'}
                  {row.gateCode ? ` (${row.gateCode})` : ''}
                </td>
                <td>
                  <span className="gm-shift-time">
                    {formatShiftTimeRange(row.startTime, row.endTime)}
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

  function renderTodaysDuty() {
    if (todayShifts.length === 0) {
      return (
        <section className="gm-duty-card gm-duty-card--empty" aria-label="Today's duty">
          <div className="gm-duty-card-head">
            <div>
              <p className="gm-duty-kicker">Current assignment</p>
              <h3 className="gm-duty-title">Today&apos;s duty</h3>
            </div>
          </div>
          <p className="gm-duty-empty-msg">No duty assigned for today.</p>
        </section>
      );
    }

    return (
      <section className="gm-duty-card" aria-label="Today's duty">
        <div className="gm-duty-card-head">
          <div>
            <p className="gm-duty-kicker">Current assignment</p>
            <h3 className="gm-duty-title">Today&apos;s duty</h3>
          </div>
          {todayShifts.length > 1 ? (
            <span className="gm-duty-count">{todayShifts.length} shifts</span>
          ) : null}
        </div>

        <div className="gm-duty-list">
          {todayShifts.map((row) => (
            <article key={row.id} className="gm-duty-item">
              <div className="gm-duty-item-top">
                <div className="gm-duty-date-block">
                  <span className="gm-duty-date">{formatShiftDate(row.dutyDate)}</span>
                  <span className="gm-shift-today-tag">Today</span>
                </div>
                <StatusBadge status={row.status} colors={SHIFT_STATUS_COLORS} />
              </div>

              <div className="gm-duty-fields">
                <div className="gm-duty-field">
                  <span className="gm-duty-label">
                    <Shield size={13} strokeWidth={2.2} aria-hidden="true" />
                    Shift
                  </span>
                  <strong className="gm-duty-value">
                    <span className="gm-duty-type">{formatShiftLabel(row.shiftType)}</span>
                  </strong>
                </div>
                <div className="gm-duty-field">
                  <span className="gm-duty-label">
                    <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                    Gate
                  </span>
                  <strong className="gm-duty-value">
                    {row.gateName || '—'}
                    {row.gateCode ? ` (${row.gateCode})` : ''}
                  </strong>
                </div>
                <div className="gm-duty-field">
                  <span className="gm-duty-label">
                    <Clock3 size={13} strokeWidth={2.2} aria-hidden="true" />
                    Schedule
                  </span>
                  <strong className="gm-duty-value gm-duty-time">
                    {formatShiftTimeRange(row.startTime, row.endTime)}
                  </strong>
                </div>
                <div className="gm-duty-field">
                  <span className="gm-duty-label">
                    <CalendarDays size={13} strokeWidth={2.2} aria-hidden="true" />
                    Date
                  </span>
                  <strong className="gm-duty-value">{formatShiftDate(row.dutyDate)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="gm-root" data-theme="light">
      <Sidebar activePage="My Schedule" onNavigate={(label) => navigateGuard(navigate, label)} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <div className="gm-shift-header">
            <div>
              <h2 className="gm-park-page-title">My Schedule</h2>
              {staffMeta ? (
                <div className="gm-shift-meta">
                  <span className="gm-shift-meta-name">{staffMeta.name}</span>
                  <span className="gm-shift-meta-code">{staffMeta.code}</span>
                </div>
              ) : (
                <p className="gm-shift-meta-empty">Your assigned shifts appear here.</p>
              )}
            </div>
          </div>

          {error ? <div className="gm-shift-alert gm-shift-alert--error">{error}</div> : null}
          {locError ? <div className="gm-shift-alert gm-shift-alert--error">{locError}</div> : null}
          {success ? <div className="gm-shift-alert gm-shift-alert--ok">{success}</div> : null}

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
            {!loading ? renderPunchPanel() : null}
          </div>

          {loading ? (
            <p className="gm-shift-loading">Loading schedule…</p>
          ) : (
            <>
              {view === 'overview' ? (
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
                      <strong>{presentDaysCount}</strong>
                    </div>
                  </div>
                  {renderTodaysDuty()}
                </div>
              ) : null}

              {view === 'shifts' ? (
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
              ) : null}

              {view === 'attendance' ? (
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
                            <p className="gm-sched-day-kicker">
                              {monthAttendanceSummary.monthLabel} summary
                            </p>
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
                                        <strong>
                                          {formatShiftTimeRange(s.startTime, s.endTime)}
                                        </strong>
                                        <span>{s.gateName || 'Unassigned gate'}</span>
                                      </div>
                                      <StatusBadge status={s.status} colors={SHIFT_STATUS_COLORS} />
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </section>

                            <section
                              className="gm-sched-day-section gm-sched-day-card"
                              aria-label="Punch times"
                            >
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
                                            className={`gm-sched-day-loc gm-sched-day-loc--${a.checkOutTime ? punchLocationTone(a.id, 'checkOut', punchLocMap) : 'unknown'}`}
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
              ) : null}

              {view === 'log' ? (
                <div className="glass-card gm-sched-log">
                  <div className="gm-sched-log-head">
                    <div>
                      <h3 className="gm-sched-log-title">Punch Log</h3>
                      <p className="gm-sched-log-sub">
                        Compact history · showing {Math.min(logVisibleCount, punchLogRows.length)} of{' '}
                        {punchLogRows.length}
                      </p>
                    </div>
                    <span className="gm-sched-log-count">{punchLogRows.length}</span>
                  </div>

                  {punchLogRows.length === 0 ? (
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
                            {punchLogRows.slice(0, logVisibleCount).map((row) => {
                              const dayIso = normalizeDutyDate(row.dutyDate);
                              const totalHours = formatTotalHours(row.checkInTime, row.checkOutTime);
                              const inLoc = punchLocationLabel(row.id, 'checkIn', punchLocMap);
                              const outLoc = row.checkOutTime
                                ? punchLocationLabel(row.id, 'checkOut', punchLocMap)
                                : '—';
                              return (
                                <tr key={row.id}>
                                  <td data-label="Date">
                                    <span className="gm-sched-log-date-cell">
                                      {formatShiftDate(dayIso)}
                                    </span>
                                  </td>
                                  <td data-label="Gate">{row.gateName || '—'}</td>
                                  <td data-label="In">
                                    <strong className="gm-sched-log-time">
                                      {formatShiftTime(row.checkInTime) || '—'}
                                    </strong>
                                  </td>
                                  <td data-label="Out">
                                    <strong className="gm-sched-log-time">
                                      {formatShiftTime(row.checkOutTime) || '—'}
                                    </strong>
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
                      {logVisibleCount < punchLogRows.length ? (
                        <div className="gm-sched-log-more">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setLogVisibleCount((n) => n + 20)}
                          >
                            Show more ({punchLogRows.length - logVisibleCount} left)
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
