import { useEffect, useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../layout/admin/PageHeader.jsx';
import { SkeletonLoader } from '../../components/common/index.js';
import { BarChart, KpiCard, LineChart } from '../../components/analytics/Charts.jsx';
import { FINANCE_ROUTES } from '../../constants/adminRoutes.js';
import {
  formatLabel,
  getFinanceAnalyticsDashboard,
} from '../../services/analytics.service.js';
import '../../styles/admin/AdminDashboard.css';
import '../../styles/common/crud.css';

export default function FinanceAnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getFinanceAnalyticsDashboard()
      .then((r) => setData(r.data?.data || null))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load finance analytics'))
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.kpis || [];
  const charts = data?.charts || [];

  return (
    <AppShell
      active="analytics"
      routes={FINANCE_ROUTES}
      breadcrumb={[{ label: 'Home' }, { label: 'Finance Analytics' }]}
    >
      <PageHeader
        icon={IndianRupee}
        iconColor="#fde68a"
        title="Finance Analytics"
        subtitle="Revenue, collections, outstanding, and refund trends."
      />
      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {loading && <SkeletonLoader rows={4} />}
      {!loading && data && (
        <>
          <div className="crud-stat-grid">
            {kpis.map((k) => (
              <KpiCard
                key={k.kpiKey || k.key}
                label={k.name || formatLabel(k.kpiKey)}
                value={k.value}
                unit={k.unit}
              />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            {charts.map((c) => (
              <section key={c.chartKey || c.name} className="glass-card" style={{ padding: 16, borderRadius: 16 }}>
                <h3 style={{ marginTop: 0 }}>{c.name || formatLabel(c.chartKey)}</h3>
                {c.type === 'line' ? <LineChart series={c.series || []} /> : <BarChart series={c.series || []} />}
              </section>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary" onClick={() => navigate('/finance/analytics/exports')}>
              Export Center
            </button>
            <button type="button" className="btn-primary" onClick={() => navigate('/finance/analytics/schedules')}>
              Schedules
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/finance/analytics/reports/billing.collections')}
            >
              Collections report
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
}
