import { useEffect, useState } from 'react';
import { integrationsService } from '@/services/integrations.service';

export default function PushDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([
      integrationsService.getMetrics(),
      integrationsService.listDevices(),
    ])
      .then(([mRes, dRes]) => {
        setMetrics(mRes.data.data);
        setDevices(dRes.data.data.devices || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load push dashboard'));

  useEffect(() => {
    load();
  }, []);

  const activeDevices = devices.filter((d) => d.status === 'active');
  const byPlatform = devices.reduce((acc, d) => {
    const p = d.platform || 'unknown';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="sa-page-title">Push Dashboard</h1>
      <p className="sa-page-sub">Push delivery overview and device summary</p>
      {error && <div className="sa-error">{error}</div>}

      <div className="sa-card">
        <h3>Summary</h3>
        {metrics ? (
          <table className="sa-table">
            <tbody>
              <tr>
                <td>Total devices</td>
                <td>{metrics.devices ?? devices.length}</td>
              </tr>
              <tr>
                <td>Active devices</td>
                <td>{metrics.activeDevices ?? metrics.active_devices ?? activeDevices.length}</td>
              </tr>
              <tr>
                <td>Providers up</td>
                <td>
                  {metrics.providersUp ?? metrics.providers_up ?? '—'} / {metrics.providers ?? '—'}
                </td>
              </tr>
              <tr>
                <td>Checked at</td>
                <td>{metrics.checkedAt || metrics.checked_at || '—'}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p>Loading…</p>
        )}
      </div>

      <div className="sa-card">
        <h3>Devices by platform</h3>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(byPlatform).map(([platform, count]) => (
              <tr key={platform}>
                <td>{platform}</td>
                <td>{count}</td>
              </tr>
            ))}
            {!Object.keys(byPlatform).length && (
              <tr>
                <td colSpan={2}>No devices registered</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sa-card">
        <h3>Recent devices</h3>
        <table className="sa-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Platform</th>
              <th>App version</th>
              <th>Status</th>
              <th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {devices.slice(0, 20).map((d) => (
              <tr key={d.id}>
                <td>{d.userId || d.user_id || '—'}</td>
                <td>{d.platform || '—'}</td>
                <td>{d.appVersion || d.app_version || '—'}</td>
                <td>{d.status}</td>
                <td>{d.lastSeenAt || d.last_seen_at || '—'}</td>
              </tr>
            ))}
            {!devices.length && (
              <tr>
                <td colSpan={5}>No devices</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
