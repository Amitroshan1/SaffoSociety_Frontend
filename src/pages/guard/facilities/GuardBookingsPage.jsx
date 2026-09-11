import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/common/crud.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import { SearchInput, StatusBadge } from '../../../components/common/index.js';
import {
  BOOKING_STATUS_COLORS,
  checkinBooking,
  checkoutBooking,
  listTodayGuardBookings,
} from '../../../services/facility.service.js';

export default function GuardBookingsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listTodayGuardBookings();
      setRows(res.data?.data?.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load today\'s bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Today's Bookings | Guard Dashboard";
    load();
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, [load]);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        (r.bookingCode || '').toLowerCase().includes(term) ||
        (r.residentName || '').toLowerCase().includes(term) ||
        (r.flatNumber || '').toLowerCase().includes(term) ||
        (r.amenityName || '').toLowerCase().includes(term),
    );
  }, [rows, search]);

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
          <h2 className="gm-park-page-title">Today&apos;s Bookings</h2>
          {error && <div style={{ color: '#fca5a5', marginBottom: 10 }}>{error}</div>}
          {success && <div style={{ color: '#86efac', marginBottom: 10 }}>{success}</div>}

          <div className="gm-park-toolbar">
            <div className="gm-park-search">
              <SearchInput value={search} onChange={setSearch} placeholder="Search booking code / flat / resident" debounceMs={0} />
            </div>
          </div>

          {loading ? (
            <p>Loadingâ€¦</p>
          ) : (
            <div className="glass-card gm-park-table-card">
              <table className="crud-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Booking code</th>
                    <th>Resident</th>
                    <th>Flat no</th>
                    <th>Facility</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={7}>No bookings for today.</td>
                    </tr>
                  )}
                  {filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 700, letterSpacing: 1 }}>{row.bookingCode || '-'}</td>
                      <td>{row.residentName || '-'}</td>
                      <td>{row.flatNumber || '-'}</td>
                      <td>{row.amenityName || '-'}</td>
                      <td>
                        {row.startTime || '-'}â€“{row.endTime || '-'}
                      </td>
                      <td>
                        <StatusBadge status={row.status} colors={BOOKING_STATUS_COLORS} />
                      </td>
                      <td style={{ whiteSpace: 'nowrap', display: 'flex', gap: 6 }}>
                        {['approved', 'confirmed'].includes(row.status) && (
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={busyId === row.id}
                            onClick={() => onCheckin(row)}
                          >
                            Check in
                          </button>
                        )}
                        {row.status === 'checked_in' && (
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={busyId === row.id}
                            onClick={() => onCheckout(row)}
                          >
                            Check out
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
