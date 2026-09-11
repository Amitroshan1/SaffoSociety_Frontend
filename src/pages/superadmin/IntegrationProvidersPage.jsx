import { useEffect, useState } from 'react';
import { integrationsService } from '../../services/integrations.service';

export default function IntegrationProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState('');
  const [probing, setProbing] = useState(false);

  const load = () =>
    integrationsService
      .listProviders()
      .then((res) => setProviders(res.data.data.providers || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load providers'));

  useEffect(() => {
    load();
  }, []);

  const probe = async () => {
    setProbing(true);
    setError('');
    try {
      const res = await integrationsService.probeProviders();
      setProviders(res.data.data.providers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Probe failed');
    } finally {
      setProbing(false);
    }
  };

  return (
    <div>
      <h1 className="sa-page-title">Integration Providers</h1>
      <p className="sa-page-sub">Registered adapters and health status</p>
      {error && <div className="sa-error">{error}</div>}
      <div className="sa-card">
        <div className="sa-actions">
          <button
            type="button"
            className="sa-btn sa-btn-primary"
            onClick={probe}
            disabled={probing}
          >
            {probing ? 'Probing…' : 'Probe all providers'}
          </button>
        </div>
      </div>
      <div className="sa-card">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Category</th>
              <th>Health</th>
              <th>Detail</th>
              <th>Last check</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id}>
                <td>
                  <code>{p.code}</code>
                </td>
                <td>{p.category}</td>
                <td>{p.healthStatus || p.health_status || '—'}</td>
                <td>{p.healthDetail || p.health_detail || '—'}</td>
                <td>{p.lastHealthAt || p.last_health_at || '—'}</td>
              </tr>
            ))}
            {!providers.length && (
              <tr>
                <td colSpan={5}>No providers registered</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
