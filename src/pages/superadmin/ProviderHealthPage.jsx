import { useEffect, useState } from 'react';
import { integrationsService } from '@/services/integrations.service';

export default function ProviderHealthPage() {
  const [metrics, setMetrics] = useState(null);
  const [storage, setStorage] = useState([]);
  const [probeResult, setProbeResult] = useState(null);
  const [error, setError] = useState('');
  const [probing, setProbing] = useState(false);

  const load = () =>
    Promise.all([
      integrationsService.getMetrics(),
      integrationsService.getStorageHealth(),
    ])
      .then(([mRes, sRes]) => {
        setMetrics(mRes.data.data);
        setStorage(sRes.data.data.adapters || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load health data'));

  useEffect(() => {
    load();
  }, []);

  const probe = async () => {
    setProbing(true);
    setError('');
    try {
      const res = await integrationsService.probeProviders();
      setProbeResult(res.data.data.providers || []);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Probe failed');
    } finally {
      setProbing(false);
    }
  };

  return (
    <div>
      <h1 className="sa-page-title">Provider Health</h1>
      <p className="sa-page-sub">Integration metrics, storage adapters, and live probes</p>
      {error && <div className="sa-error">{error}</div>}

      <div className="sa-card">
        <h3>Platform metrics</h3>
        {metrics ? (
          <table className="sa-table">
            <tbody>
              <tr>
                <td>Providers</td>
                <td>
                  {metrics.providersUp ?? metrics.providers_up ?? '—'} / {metrics.providers ?? '—'} up
                </td>
              </tr>
              <tr>
                <td>Devices</td>
                <td>
                  {metrics.activeDevices ?? metrics.active_devices ?? '—'} / {metrics.devices ?? '—'} active
                </td>
              </tr>
              <tr>
                <td>Active API keys</td>
                <td>{metrics.activeApiKeys ?? metrics.active_api_keys ?? '—'}</td>
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
        <div className="sa-actions">
          <button
            type="button"
            className="sa-btn sa-btn-primary"
            onClick={probe}
            disabled={probing}
          >
            {probing ? 'Probing…' : 'Run provider probe'}
          </button>
        </div>
        {probeResult && (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Health</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {probeResult.map((p) => (
                <tr key={p.id}>
                  <td>
                    <code>{p.code}</code>
                  </td>
                  <td>{p.healthStatus || p.health_status}</td>
                  <td>{p.healthDetail || p.health_detail || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="sa-card">
        <h3>Storage health</h3>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Adapter</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {storage.map((a, i) => (
              <tr key={a.name || i}>
                <td>{a.name || a.adapter || '—'}</td>
                <td>{a.status || a.healthStatus || '—'}</td>
                <td>{a.detail || a.message || '—'}</td>
              </tr>
            ))}
            {!storage.length && (
              <tr>
                <td colSpan={3}>No storage adapters reported</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
