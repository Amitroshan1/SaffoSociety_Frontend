import { useEffect, useState } from 'react';
import { platformService } from '@/services/platform.service';

const KEYS = [
  'tenant.growth',
  'subscription.trends',
  'license.distribution',
  'feature.adoption',
  'storage.usage',
  'api.usage',
  'worker.queue',
  'system.errors',
  'active.users',
];

export default function PlatformAnalyticsPage() {
  const [key, setKey] = useState('tenant.growth');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    platformService
      .analytics(key)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed'));
  }, [key]);

  return (
    <div>
      <h1 className="sa-page-title">Platform Analytics</h1>
      <p className="sa-page-sub">Cross-tenant aggregates (no PII)</p>
      {error && <div className="sa-error">{error}</div>}
      <div className="sa-actions" style={{ marginBottom: '1rem' }}>
        {KEYS.map((k) => (
          <button key={k} type="button" className="sa-btn" onClick={() => setKey(k)}>
            {k}
          </button>
        ))}
        <button
          type="button"
          className="sa-btn sa-btn-primary"
          onClick={() => platformService.rollupMetrics().then(() => setKey(key))}
        >
          Run metric rollup
        </button>
      </div>
      <div className="sa-card">
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
