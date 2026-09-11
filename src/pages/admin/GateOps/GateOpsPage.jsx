import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import { getGateDashboard } from '../../../services/gate.service.js';
import { listVisits } from '../../../services/visit.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const routes = {
  dashboard: '/admin/dashboard',
  society: '/admin/society',
  buildings: '/admin/buildings',
  wings: '/admin/wings',
  flats: '/admin/flats',
  occupancy: '/admin/occupancies',
  residents: '/admin/residents',
  visitors: '/admin/visitors',
  visits: '/admin/visits',
  staff: '/admin/staff',
  gates: '/admin/gates',
  shifts: '/admin/shifts',
  'gate-ops': '/admin/gate-ops',
  attendance: '/admin/attendance',
  complaints: '/admin/complaints',
};

export default function GateOpsPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({ gates: [], onDuty: [], todayShifts: [] });
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getGateDashboard(),
      listVisits({ pageSize: 20, sortBy: 'created_at', sortOrder: 'desc', status: 'checked_in' }),
    ])
      .then(([d, v]) => {
        setDashboard(d.data.data || { gates: [], onDuty: [], todayShifts: [] });
        setVisits(v.data.data?.visits || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load gate ops'));
  }, []);

  return (
    <AppShell
      active="gate-ops"
      onChange={(id) => routes[id] && navigate(routes[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Gate Ops' }]}
    >
      <PageHeader
        icon={Shield}
        iconColor="#86efac"
        title="Gate Operations"
        subtitle="On-duty staff and active visitor check-ins."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <h3 style={{ marginTop: 0 }}>On duty</h3>
          {dashboard.onDuty?.length ? (
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {dashboard.onDuty.map((s) => (
                <li key={s.id} style={{ marginBottom: 8 }}>
                  {s.staffName} ({s.staffCode}) — {s.gateName || 'Unassigned'} · {s.shiftType}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ opacity: 0.7 }}>No active shifts right now.</p>
          )}
        </section>
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <h3 style={{ marginTop: 0 }}>Checked-in visitors</h3>
          {visits.length ? (
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {visits.map((v) => (
                <li key={v.id} style={{ marginBottom: 8 }}>
                  {v.visitorName} → {v.flatNo || v.flatId} · {v.visitorType}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ opacity: 0.7 }}>No checked-in visits.</p>
          )}
        </section>
      </div>

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Gates</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(dashboard.gates || []).map((g) => (
            <div key={g.id} style={{ padding: '10px 14px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10 }}>
              <strong>{g.code}</strong> · {g.name}
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
