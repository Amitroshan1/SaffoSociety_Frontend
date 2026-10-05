import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '@/modules/guard/constants/guardRoutes.js';
import Sidebar from '@/modules/guard/components/Sidebar';
import DashboardHeader from '@/modules/guard/components/DashboardHeader';
import GateDatePicker from '@/modules/guard/components/shared/GateDatePicker.jsx';
import { SearchInput, StatusBadge } from '@/modules/guard/common/index.js';
import {
  BOOKING_STATUS_COLORS,
  getBookings,
} from '@/modules/guard/services/booking/booking.service.js';
import { apiErrorMessage, indiaTodayISO } from '@/modules/guard/services/core/http';
import '@/modules/guard/styles/core/guard-main.css';
import '@/modules/guard/styles/booking/booking.css';

const FILTERS = [
  { key: 'today', label: "Today's Bookings" },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'date', label: 'By Date' },
];

const MAX_VISIBLE_ROWS = 8;

function bodyRowSlots(count) {
  return Math.min(MAX_VISIBLE_ROWS, Math.max(1, count + 1));
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

function daysAgoIso(n) {
  const d = new Date(`${indiaTodayISO()}T12:00:00+05:30`);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatTimeLabel(t) {
  if (!t) return '—';
  // Accept "16:00" or already-localized strings
  if (String(t).includes('AM') || String(t).includes('PM')) return t;
  try {
    const [h, m] = String(t).split(':').map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return t;
  }
}

export default function GuardBookingsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('today');
  const [selectedDate, setSelectedDate] = useState(() => daysAgoIso(1));
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [counts, setCounts] = useState({ today: 0, upcoming: 0, history: 0 });
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 280);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        view: filter === 'date' ? 'date' : filter,
        date: filter === 'date' ? selectedDate : undefined,
        search: debouncedSearch || undefined,
        page,
        pageSize: 20,
      };
      const data = await getBookings(params);
      setItems(data.items || []);
      setPagination(data.pagination || null);
      setCounts(data.counts || { today: 0, upcoming: 0, history: 0 });
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load bookings'));
    } finally {
      setLoading(false);
    }
  }, [filter, selectedDate, debouncedSearch, page]);

  useEffect(() => {
    document.title = 'Bookings | Guard Dashboard';
    load();
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, [load]);

  const displayCounts = useMemo(
    () => ({
      today: counts.today,
      upcoming: counts.upcoming,
    }),
    [counts],
  );

  const rowSlots = bodyRowSlots(loading ? 0 : items.length);

  const emptyText =
    filter === 'upcoming'
      ? 'No upcoming bookings.'
      : filter === 'date'
        ? selectedDate
          ? `No bookings on ${formatDayLabel(selectedDate)}.`
          : 'Pick a date to view bookings.'
        : 'No bookings for today.';

  return (
    <div className="gm-root" data-theme="light">
      <Sidebar activePage="Bookings" onNavigate={(label) => navigateGuard(navigate, label)} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <div className="vp-root gm-book-page">
            <h2 className="gm-park-page-title">Bookings</h2>
            {error ? <div style={{ color: '#fca5a5', marginBottom: 10 }}>{error}</div> : null}

            <div className="gm-book-filters" role="tablist" aria-label="Booking filters">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  className={`gm-book-filter${filter === f.key ? ' gm-book-filter--active' : ''}`}
                  onClick={() => {
                    setFilter(f.key);
                    setPage(1);
                  }}
                >
                  <span>{f.label}</span>
                  {f.key === 'date' ? null : (
                    <span className="gm-book-filter-count">{displayCounts[f.key]}</span>
                  )}
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
              {filter === 'date' ? (
                <div className="gm-book-date-wrap">
                  <GateDatePicker
                    label="Date"
                    value={selectedDate}
                    allowClear={false}
                    onChange={(next) => {
                      setSelectedDate(next || daysAgoIso(1));
                      setPage(1);
                    }}
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
                      <th>Time</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                </table>
              </div>

              <div className="gm-book-body" style={{ '--gm-book-visible-rows': rowSlots }}>
                {loading ? (
                  <div className="gm-book-empty">Loading…</div>
                ) : items.length === 0 ? (
                  <div className="gm-book-empty">{emptyText}</div>
                ) : (
                  <table className="crud-table gm-book-table">
                    <tbody>
                      {items.map((row) => (
                        <tr key={row.id}>
                          <td data-label="Code" style={{ fontWeight: 700, letterSpacing: 1 }}>
                            {row.bookingCode || '-'}
                          </td>
                          <td data-label="Resident">{row.residentName || '-'}</td>
                          <td data-label="Flat">{row.flatNo || row.flatNumber || '-'}</td>
                          <td data-label="Facility">{row.facility || row.amenityName || '-'}</td>
                          <td data-label="Time">
                            {formatTimeLabel(row.startTime)}–{formatTimeLabel(row.endTime)}
                          </td>
                          <td data-label="Status">
                            <StatusBadge status={row.status || 'approved'} colors={BOOKING_STATUS_COLORS} />
                          </td>
                          <td data-label="Date">{formatDayLabel(row.bookingDate) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {pagination && pagination.totalPages > 1 ? (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: 12 }}>
                  <button
                    type="button"
                    className="gm-view-all"
                    disabled={!pagination.hasPrev}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </button>
                  <span style={{ fontSize: 13, color: '#64748b', alignSelf: 'center' }}>
                    Page {pagination.page} / {pagination.totalPages} · {pagination.total} results
                  </span>
                  <button
                    type="button"
                    className="gm-view-all"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
