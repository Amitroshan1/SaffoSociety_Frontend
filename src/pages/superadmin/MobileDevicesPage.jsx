import { useEffect, useState } from 'react';
import { integrationsService } from '@/services/integrations.service';

export default function MobileDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState('');
  const [societyId, setSocietyId] = useState('');

  const load = (params = {}) =>
    integrationsService
      .listDevices(params)
      .then((res) => setDevices(res.data.data.devices || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load devices'));

  useEffect(() => {
    load();
  }, []);

  const filter = (e) => {
    e.preventDefault();
    load(societyId ? { societyId } : {});
  };

  const remove = async (id) => {
    setError('');
    try {
      await integrationsService.removeDevice(id);
      load(societyId ? { societyId } : {});
    } catch (err) {
      setError(err.response?.data?.message || 'Remove failed');
    }
  };

  return (
    <div>
      <h1 className="sa-page-title">Mobile Devices</h1>
      <p className="sa-page-sub">Registered devices, push tokens, and app versions</p>
      {error && <div className="sa-error">{error}</div>}

      <div className="sa-card">
        <form onSubmit={filter}>
          <div className="sa-field">
            <label>Filter by society ID (optional)</label>
            <input value={societyId} onChange={(e) => setSocietyId(e.target.value)} />
          </div>
          <button type="submit" className="sa-btn sa-btn-primary">
            Apply filter
          </button>
        </form>
      </div>

      <div className="sa-card">
        <table className="sa-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Platform</th>
              <th>App version</th>
              <th>Status</th>
              <th>Last seen</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td>{d.userId || d.user_id || '—'}</td>
                <td>{d.platform || '—'}</td>
                <td>{d.appVersion || d.app_version || '—'}</td>
                <td>{d.status}</td>
                <td>{d.lastSeenAt || d.last_seen_at || '—'}</td>
                <td>
                  {d.status !== 'removed' && (
                    <button type="button" className="sa-btn sa-btn-danger" onClick={() => remove(d.id)}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!devices.length && (
              <tr>
                <td colSpan={6}>No devices</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
