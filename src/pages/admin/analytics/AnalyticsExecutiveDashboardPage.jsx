import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import { EmptyState, SkeletonLoader } from '@/components/common/index.js';
import { BarChart, KpiCard, LineChart, PieChart } from '@/components/analytics/Charts.jsx';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import {
  formatLabel,
  getAnalyticsDashboard,
  refreshAnalyticsSnapshots,
} from '@/services/analytics.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const LINKS = [
  { id: 'analytics-catalog', label: 'Report Catalog' },
  { id: 'analytics-exports', label: 'Export Center' },
  { id: 'analytics-schedules', label: 'Scheduled Reports' },
  { id: 'analytics-settings', label: 'Analytics Settings' },
];

export default function AnalyticsExecutiveDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getAnalyticsDashboard('executive')
      .then((r) => setData(r.data?.data || null))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setBusy(true);
    setError('');
    try {
      await refreshAnalyticsSnapshots();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Refresh failed');
    } finally {
      setBusy(false);
    }
  };

  const kpis = data?.kpis || [];
  const charts = data?.charts || [];
  const revenueTrend = charts.find((c) => c.type === 'line' || c.chartKey?.includes('revenue'))?.series || [];
  const mix = charts.find((c) => c.type === 'pie' || c.chartKey?.includes('mix'))?.series || [];
  const bars = charts.find((c) => c.type === 'bar')?.series || [];

  return (
    <AppShell active="analytics" routes={ADMIN_ROUTES} breadcrumb={[{ label: 'Home' }, { label: 'Analytics' }]}>
      <PageHeader
        icon={BarChart3}
        iconColor="#a5b4fc"
        title="Executive Analytics"
        subtitle="Cross-module KPIs, trends, and operational health."
        action={
          <button className="btn-primary" type="button" disabled={busy} onClick={onRefresh}>
            <RefreshCw size={14} /> {busy ? 'Refreshing…' : 'Refresh KPIs'}
          </button>
        }
      />

      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {loading && <SkeletonLoader rows={5} />}

      {!loading && !data && !error && (
        <EmptyState title="No analytics yet" description="Run a rebuild or wait for nightly aggregation." />
      )}

      {!loading && data && (
        <>
          <div className="crud-stat-grid">
            {kpis.map((k) => (
              <KpiCard
                key={k.kpiKey || k.key}
                label={k.name || formatLabel(k.kpiKey || k.key)}
                value={k.value}
                unit={k.unit}
                delta={k.delta}
              />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
            <section className="glass-card" style={{ padding: 16, borderRadius: 16 }}>
              <h3 style={{ marginTop: 0 }}>Revenue trend</h3>
              <LineChart series={revenueTrend.length ? revenueTrend : bars} />
            </section>
            <section className="glass-card" style={{ padding: 16, borderRadius: 16 }}>
              <h3 style={{ marginTop: 0 }}>Category mix</h3>
              <PieChart series={mix.length ? mix : bars.slice(0, 5)} />
            </section>
            <section className="glass-card" style={{ padding: 16, borderRadius: 16 }}>
              <h3 style={{ marginTop: 0 }}>Operational volume</h3>
              <BarChart series={bars.length ? bars : revenueTrend} />
            </section>
          </div>

          <section className="glass-card" style={{ padding: 16, borderRadius: 16, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Analytics shortcuts</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate(ADMIN_ROUTES[link.id])}
                >
                  {link.label}
                </button>
              ))}
            </div>
            {data.asOf && (
              <p style={{ marginTop: 12, opacity: 0.6, fontSize: 13 }}>
                As of {data.asOf} · Freshness: {data.sourceFreshness || 'snapshot'}
              </p>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
