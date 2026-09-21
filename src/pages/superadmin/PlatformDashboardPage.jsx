import { useEffect, useState } from 'react';
import { platformService } from '@/services/platform.service';

function Kpi({ label, value }) {
  return (
    <div className="sa-kpi">
      <div className="sa-kpi-label">{label}</div>
      <div className="sa-kpi-value">{value ?? '—'}</div>
    </div>
  );
}

export default function PlatformDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    platformService
      .dashboard()
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  const k = data?.kpis || {};

  return (
    <div>
      <h1 className="sa-page-title">Platform Dashboard</h1>
      <p className="sa-page-sub">Control-plane KPIs across all tenants</p>
      {error && <div className="sa-error">{error}</div>}
      <div className="sa-kpi-grid">
        <Kpi label="Total Tenants" value={k.totalTenants} />
        <Kpi label="Active Tenants" value={k.activeTenants} />
        <Kpi label="Inactive Tenants" value={k.inactiveTenants} />
        <Kpi label="Residents" value={k.residents} />
        <Kpi label="Users" value={k.users} />
        <Kpi
          label="Subscription Revenue"
          value={k.subscriptionRevenueMinor != null ? `₹${(k.subscriptionRevenueMinor / 100).toLocaleString()}` : '—'}
        />
        <Kpi label="Complaints" value={k.complaints} />
        <Kpi label="Visitors" value={k.visitors} />
        <Kpi label="Parking Slots" value={k.parkingSlots} />
        <Kpi label="Bookings" value={k.bookings} />
        <Kpi label="API Requests" value={k.apiRequests} />
        <Kpi label="Storage (GB)" value={k.storageUsageGb} />
        <Kpi label="Worker Status" value={k.workerStatus} />
        <Kpi label="Platform Health" value={k.platformHealth} />
      </div>
      <div className="sa-card">
        <h3>Recent Jobs</h3>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recentJobs || []).map((j) => (
              <tr key={j.id}>
                <td>{j.jobKey}</td>
                <td>{j.status}</td>
                <td>{j.createdAt}</td>
              </tr>
            ))}
            {!data?.recentJobs?.length && (
              <tr>
                <td colSpan={3} className="sa-muted">
                  No job runs yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
