import { useEffect, useState } from 'react';
import EmptyState from '@/components/common/EmptyState';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import { BarChart, KpiCard } from '@/components/analytics/Charts.jsx';
import {
  createAnalyticsExport,
  formatLabel,
  getResidentAnalyticsSummary,
} from '@/services/analytics.service.js';

export default function ResidentAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getResidentAnalyticsSummary()
      .then((r) => setData(r.data?.data || null))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load your analytics'))
      .finally(() => setLoading(false));
  }, []);

  const onExport = async (reportKey) => {
    setMessage('');
    try {
      await createAnalyticsExport({ reportKey, format: 'csv', filters: {} });
      setMessage('Personal export created.');
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed');
    }
  };

  if (loading) return <SkeletonLoader rows={5} />;
  if (error && !data) return <EmptyState title="Analytics unavailable" description={error} />;
  if (!data) return <EmptyState title="No personal analytics yet" />;

  const kpis = data.kpis || [];
  const charts = data.charts || [];
  const sections = data.sections || [];

  return (
    <div>
      <h1 className="resident-page-title">My Analytics</h1>
      <p className="resident-page-subtitle">
        Personal billing, visitors, parking, and facility insights. Society-wide data is not shown.
      </p>
      {error && <p className="resident-error">{error}</p>}
      {message && <p style={{ color: '#86efac' }}>{message}</p>}

      <div className="resident-stat-grid">
        {kpis.map((k) => (
          <div key={k.kpiKey || k.key} className="resident-card">
            <KpiCard
              label={k.name || formatLabel(k.kpiKey)}
              value={k.value}
              unit={k.unit}
            />
          </div>
        ))}
      </div>

      {charts.map((c) => (
        <div key={c.chartKey || c.name} className="resident-section">
          <h3>{c.name || formatLabel(c.chartKey)}</h3>
          <BarChart series={c.series || []} color="#60a5fa" />
        </div>
      ))}

      <div className="resident-section">
        <h3>My reports</h3>
        <ul className="resident-list">
          {(sections.length
            ? sections
            : [
                { key: 'resident.billing', label: 'My billing summary' },
                { key: 'resident.visitors', label: 'My visitor history' },
                { key: 'resident.parking', label: 'My parking' },
                { key: 'resident.amenities', label: 'My facility bookings' },
              ]
          ).map((s) => (
            <li key={s.key || s.reportKey}>
              {s.label || s.name}{' '}
              <button
                type="button"
                className="resident-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => onExport(s.key || s.reportKey)}
              >
                Export CSV
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
