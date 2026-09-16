import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/guard/visitor/visitors.css';
import '../../../styles/common/crud.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import GateDatePicker from '../../../components/guard/shared/GateDatePicker.jsx';
import { SearchInput, StatusBadge } from '../../../components/common/index.js';
import {
  BOOKING_STATUS_COLORS,
  checkinBooking,
  checkoutBooking,
  listTodayGuardBookings,
} from '../../../services/facility.service.js';

const FILTERS = [
  { key: 'today', label: "Today's Bookings" },
  { key: 'future', label: 'Upcoming Bookings' },
  { key: 'by-date', label: 'By Date' },
];

const MAX_VISIBLE_ROWS = 8;

function bodyRowSlots(count) {
  return Math.min(MAX_VISIBLE_ROWS, Math.max(1, count + 1));
}

function matchesSearch(row, term) {
  if (!term) return true;
  return (
    (row.bookingCode || '').toLowerCase().includes(term) ||
    (row.residentName || '').toLowerCase().includes(term) ||
    (row.flatNumber || '').toLowerCase().includes(term) ||
    (row.amenityName || '').toLowerCase().includes(term)
  );
}

function formatDayLabel(isoDate) {
  if (!isoDate) return '';
  try {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysAgoIso(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return toIsoDate(d);
}

function daysAheadIso(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
}

/** Frontend-only sample rows until future / by-date APIs exist. */
function buildDemoFutureBookings() {
  return [
    {
      id: 'demo-future-1',
      bookingCode: 'BK-FUT-101',
      residentName: 'Demo Resident',
      flatNumber: 'A1-101',
      amenityName: 'Clubhouse',
      bookingDate: daysAheadIso(1),
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      status: 'approved',
      demo: true,
    },
    {
      id: 'demo-future-2',
      bookingCode: 'BK-FUT-102',
      residentName: 'Priya Sharma',
      flatNumber: 'B2-204',
      amenityName: 'Banquet Hall',
      bookingDate: daysAheadIso(3),
      startTime: '04:00 PM',
      endTime: '08:00 PM',
      status: 'confirmed',
      demo: true,
    },
  ];
}

function buildDemoDatedBookings() {
  return [
    {
      id: 'demo-date-1',
      bookingCode: 'BK-DAT-088',
      residentName: 'Rahul Mehta',
      flatNumber: 'C3-312',
      amenityName: 'Tennis Court',
      bookingDate: daysAgoIso(1),
      startTime: '06:00 AM',
      endTime: '07:00 AM',
      status: 'completed',
      demo: true,
    },
    {
      id: 'demo-date-2',
      bookingCode: 'BK-DAT-074',
      residentName: 'Anita Desai',
      flatNumber: 'A1-102',
      amenityName: 'Party Lawn',
      bookingDate: daysAgoIso(4),
      startTime: '05:00 PM',
      endTime: '09:00 PM',
      status: 'checked_out',
      demo: true,
    },
    {
      id: 'demo-date-3',
      bookingCode: 'BK-DAT-061',
      residentName: 'Vikram Rao',
      flatNumber: 'D1-401',
      amenityName: 'Gym',
      bookingDate: daysAgoIso(4),
      startTime: '07:00 AM',
      endTime: '08:00 AM',
      status: 'cancelled',
      demo: true,
    },
    {
      id: 'demo-date-4',
      bookingCode: 'BK-DAT-055',
      residentName: 'Neha Kapoor',
      flatNumber: 'B1-110',
      amenityName: 'Clubhouse',
      bookingDate: daysAgoIso(7),
      startTime: '11:00 AM',
      endTime: '01:00 PM',
      status: 'completed',
      demo: true,
    },
  ];
}

export default function GuardBookingsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('today');
  const [selectedDate, setSelectedDate] = useState(() => daysAgoIso(1));
  const [search, setSearch] = useState('');
  const [todayRows, setTodayRows] = useState([]);
  const [futureRows] = useState(() => buildDemoFutureBookings());
  const [datedRows] = useState(() => buildDemoDatedBookings());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listTodayGuardBookings();
      setTodayRows(res.data?.data?.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load today's bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Bookings | Guard Dashboard';
    load();
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, [load]);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  const term = search.trim().toLowerCase();

  const byDateRows = useMemo(() => {
    if (!selectedDate) return [];
    return [...datedRows, ...futureRows].filter((r) => r.bookingDate === selectedDate);
  }, [datedRows, futureRows, selectedDate]);

  const counts = useMemo(
    () => ({
      today: todayRows.filter((r) => matchesSearch(r, term)).length,
      future: futureRows.filter((r) => matchesSearch(r, term)).length,
      'by-date': byDateRows.filter((r) => matchesSearch(r, term)).length,
    }),
    [todayRows, futureRows, byDateRows, term],
  );

  const activeRows = useMemo(() => {
    const source =
      filter === 'future' ? futureRows : filter === 'by-date' ? byDateRows : todayRows;
    return source.filter((r) => matchesSearch(r, term));
  }, [filter, todayRows, futureRows, byDateRows, term]);

  const showDate = filter === 'future' || filter === 'by-date';
  const showActions = filter === 'today';
  const rowSlots = bodyRowSlots(loading && filter === 'today' ? 0 : activeRows.length);

  const emptyText =
    filter === 'future'
      ? 'No upcoming bookings.'
      : filter === 'by-date'
        ? selectedDate
          ? `No bookings on ${formatDayLabel(selectedDate)}.`
          : 'Pick a date to view bookings.'
        : 'No bookings for today.';

  async function onCheckin(row) {
    setBusyId(row.id);
    setError('');
    setSuccess('');
    try {
      await checkinBooking(row.id);
      setSuccess(`Checked in ${row.bookingCode || ''}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
    } finally {
      setBusyId(null);
    }
  }

  async function onCheckout(row) {
    setBusyId(row.id);
    setError('');
    setSuccess('');
    try {
      await checkoutBooking(row.id);
      setSuccess(`Checked out ${row.bookingCode || ''}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-out failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="gm-root">
      <Sidebar activePage="Bookings" onNavigate={handleSidebarNav} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <div className="vp-root gm-book-page">
            <h2 className="gm-park-page-title">Bookings</h2>
            {error ? <div style={{ color: '#fca5a5', marginBottom: 10 }}>{error}</div> : null}
            {success ? <div style={{ color: '#86efac', marginBottom: 10 }}>{success}</div> : null}

            <div className="gm-book-filters" role="tablist" aria-label="Booking filters">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  className={`gm-book-filter${filter === f.key ? ' gm-book-filter--active' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  <span>{f.label}</span>
                  <span className="gm-book-filter-count">{counts[f.key]}</span>
                </button>
              ))}
            </div>

            <div className="gm-park-toolbar gm-book-toolbar">
              <div className="gm-park-search">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search booking code / flat / resident"
                  debounceMs={0}
                />
              </div>
              {filter === 'by-date' ? (
                <div className="gm-book-date-wrap">
                  <GateDatePicker
                    label="Date"
                    value={selectedDate}
                    allowClear={false}
                    onChange={(next) => setSelectedDate(next || daysAgoIso(1))}
                  />
                </div>
              ) : null}
            </div>

            <div className="glass-card gm-park-table-card gm-book-card">
              <div className="gm-book-table-head">
                <table className="crud-table gm-book-table">
                  <thead>
                    <tr>
                      <th>Booking code</th>
                      <th>Resident</th>
                      <th>Flat no</th>
                      <th>Facility</th>
                      {showDate ? <th>Date</th> : null}
                      <th>Time</th>
                      <th>Status</th>
                      {showActions ? <th>Action</th> : null}
                    </tr>
                  </thead>
                </table>
              </div>

              <div className="gm-book-body" style={{ '--gm-book-visible-rows': rowSlots }}>
                {loading && filter === 'today' ? (
                  <div className="gm-book-empty">Loading…</div>
                ) : activeRows.length === 0 ? (
                  <div className="gm-book-empty">{emptyText}</div>
                ) : (
                  <table className="crud-table gm-book-table">
                    <tbody>
                      {activeRows.map((row) => (
                        <tr key={row.id}>
                          <td data-label="Code" style={{ fontWeight: 700, letterSpacing: 1 }}>
                            {row.bookingCode || '-'}
                          </td>
                          <td data-label="Resident">{row.residentName || '-'}</td>
                          <td data-label="Flat">{row.flatNumber || '-'}</td>
                          <td data-label="Facility">{row.amenityName || '-'}</td>
                          {showDate ? (
                            <td data-label="Date">{formatDayLabel(row.bookingDate) || '-'}</td>
                          ) : null}
                          <td data-label="Time">
                            {row.startTime || '-'}–{row.endTime || '-'}
                          </td>
                          <td data-label="Status">
                            <StatusBadge status={row.status} colors={BOOKING_STATUS_COLORS} />
                          </td>
                          {showActions ? (
                            <td data-label="Action">
                              <div className="gm-book-actions">
                                {['approved', 'confirmed'].includes(row.status) && !row.demo ? (
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    disabled={busyId === row.id}
                                    onClick={() => onCheckin(row)}
                                  >
                                    Check in
                                  </button>
                                ) : null}
                                {row.status === 'checked_in' && !row.demo ? (
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    disabled={busyId === row.id}
                                    onClick={() => onCheckout(row)}
                                  >
                                    Check out
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
