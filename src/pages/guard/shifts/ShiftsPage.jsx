import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/common/crud.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import { listShifts, startShift, completeShift } from '../../../services/shift.service.js';
import { getMyStaff } from '../../../services/staff.service.js';

export default function GuardShiftsPage() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const meRes = await getMyStaff();
      const me = meRes.data?.data?.staff;
      setStaff(me);
      if (!me?.id) {
        setRows([]);
        return;
      }
      const res = await listShifts({
        page: 1,
        pageSize: 50,
        sortBy: 'shift_date',
        sortOrder: 'asc',
        staffId: me.id,
      });
      setRows(res.data?.data?.shifts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'My Shifts | Guard Dashboard';
    load();
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, [load]);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  async function onStart(id) {
    setError('');
    setSuccess('');
    try {
      await startShift(id, {});
      setSuccess('Shift started');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start shift');
    }
  }

  async function onComplete(id) {
    setError('');
    setSuccess('');
    try {
      await completeShift(id, {});
      setSuccess('Shift completed');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete shift');
    }
  }

  return (
    <div className="gm-root">
      <Sidebar activePage="My Shifts" onNavigate={handleSidebarNav} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <h2 style={{ marginBottom: 8 }}>My Shifts</h2>
          <p style={{ opacity: 0.75, marginBottom: 16 }}>
            {staff ? `${staff.name} (${staff.code})` : 'Link your guard account to a staff record to see shifts.'}
          </p>
          {error && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>}
          {success && <div style={{ color: '#86efac', marginBottom: 12 }}>{success}</div>}
          {loading ? (
            <p>Loading…</p>
          ) : (
            <div className="glass-card" style={{ padding: 16, borderRadius: 12 }}>
              <table className="crud-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Gate</th>
                    <th>Status</th>
                    <th>Scheduled</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6}>No shifts assigned.</td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.shiftDate}</td>
                      <td>{row.shiftType}</td>
                      <td>{row.gateName || '—'}</td>
                      <td>{row.status}</td>
                      <td>
                        {row.scheduledStart ? new Date(row.scheduledStart).toLocaleString() : '—'}
                        {' → '}
                        {row.scheduledEnd ? new Date(row.scheduledEnd).toLocaleString() : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {row.status === 'scheduled' && (
                          <button type="button" className="btn-primary" onClick={() => onStart(row.id)}>
                            Start
                          </button>
                        )}
                        {row.status === 'active' && (
                          <button type="button" className="btn-secondary" onClick={() => onComplete(row.id)}>
                            Complete
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
