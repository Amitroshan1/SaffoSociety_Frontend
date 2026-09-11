import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/common/crud.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import {
  checkInAttendance,
  checkOutAttendance,
  listAttendance,
} from '../../../services/attendance.service.js';
import { listGates } from '../../../services/gate.service.js';
import { getMyStaff } from '../../../services/staff.service.js';
import { listShifts } from '../../../services/shift.service.js';

export default function GuardAttendancePage() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [gates, setGates] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [rows, setRows] = useState([]);
  const [gateId, setGateId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      setGateId(me.assignedGateId || '');
      const [attRes, gateRes, shiftRes] = await Promise.all([
        listAttendance({
          page: 1,
          pageSize: 20,
          sortBy: 'check_in_time',
          sortOrder: 'desc',
          staffId: me.id,
        }),
        listGates({ page: 1, pageSize: 50, isActive: true }),
        listShifts({
          page: 1,
          pageSize: 20,
          staffId: me.id,
          sortBy: 'shift_date',
          sortOrder: 'asc',
        }),
      ]);
      setRows(attRes.data?.data?.attendance || []);
      setGates(gateRes.data?.data?.gates || []);
      setShifts(
        (shiftRes.data?.data?.shifts || []).filter((s) =>
          ['scheduled', 'active'].includes(s.status)
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Clock In/Out | Guard Dashboard';
    load();
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, [load]);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  const openRow = rows.find((r) => r.status === 'checked_in');

  async function onCheckIn() {
    if (!staff?.id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await checkInAttendance({
        staffId: staff.id,
        gateId: gateId || undefined,
        shiftId: shiftId || undefined,
      });
      setSuccess('Checked in');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
    } finally {
      setSaving(false);
    }
  }

  async function onCheckOut() {
    if (!openRow) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await checkOutAttendance(openRow.id, {});
      setSuccess('Checked out');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-out failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="gm-root">
      <Sidebar activePage="Clock In/Out" onNavigate={handleSidebarNav} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <h2 style={{ marginBottom: 8 }}>Clock In / Out</h2>
          <p style={{ opacity: 0.75, marginBottom: 16 }}>
            {staff
              ? `Attendance for ${staff.name} (${staff.code})`
              : 'Link your guard account to a staff record to clock in.'}
          </p>
          {error && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>}
          {success && <div style={{ color: '#86efac', marginBottom: 12 }}>{success}</div>}

          {staff && (
            <div className="glass-card gm-att-card">
              {!openRow ? (
                <div className="gm-att-checkin">
                  <label className="gm-att-field">
                    <span className="gm-att-label">Gate</span>
                    <select
                      className="gm-att-select"
                      value={gateId}
                      onChange={(e) => setGateId(e.target.value)}
                    >
                      <option value="">Default / none</option>
                      {gates.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.code})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="gm-att-field">
                    <span className="gm-att-label">Shift (optional)</span>
                    <select
                      className="gm-att-select"
                      value={shiftId}
                      onChange={(e) => setShiftId(e.target.value)}
                    >
                      <option value="">None</option>
                      {shifts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.shiftDate} · {s.shiftType} · {s.status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn-primary gm-att-btn"
                    disabled={saving}
                    onClick={onCheckIn}
                  >
                    Check In
                  </button>
                </div>
              ) : (
                <div className="gm-att-checkout">
                  <span className="gm-att-open-msg">
                    Open since {openRow.checkInTime ? new Date(openRow.checkInTime).toLocaleString() : '—'}
                    {openRow.gateName ? ` at ${openRow.gateName}` : ''}
                  </span>
                  <button
                    type="button"
                    className="btn-primary gm-att-btn"
                    disabled={saving}
                    onClick={onCheckOut}
                  >
                    Check Out
                  </button>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <p>Loading…</p>
          ) : (
            <div className="glass-card" style={{ padding: 16, borderRadius: 12 }}>
              <h3 style={{ marginBottom: 12 }}>Recent attendance</h3>
              <table className="crud-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Gate</th>
                    <th>In</th>
                    <th>Out</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4}>No attendance records.</td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.status}</td>
                      <td>{row.gateName || '—'}</td>
                      <td>{row.checkInTime ? new Date(row.checkInTime).toLocaleString() : '—'}</td>
                      <td>{row.checkOutTime ? new Date(row.checkOutTime).toLocaleString() : '—'}</td>
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
