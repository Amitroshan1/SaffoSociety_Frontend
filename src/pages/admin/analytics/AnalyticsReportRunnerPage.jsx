import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileBarChart } from 'lucide-react';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  DataTable,
  FilterBar,
  FormSelect,
  Pagination,
  SkeletonLoader,
} from '@/components/common/index.js';
import { BarChart, PieChart } from '@/components/analytics/Charts.jsx';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import {
  EXPORT_FORMATS,
  createAnalyticsExport,
  formatLabel,
  getAnalyticsChart,
  runAnalyticsReport,
} from '@/services/analytics.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

export default function AnalyticsReportRunnerPage({ basePath = '/admin' } = {}) {
  const { reportKey } = useParams();
  const navigate = useNavigate();
  const isFinance = basePath.startsWith('/finance');
  const routes = isFinance
    ? {
        dashboard: '/finance/dashboard',
        analytics: '/finance/analytics',
        'analytics-exports': '/finance/analytics/exports',
      }
    : ADMIN_ROUTES;

  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [chart, setChart] = useState(null);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!reportKey) return;
    setLoading(true);
    setError('');
    try {
      const res = await runAnalyticsReport(reportKey, { page, pageSize: 20 });
      const data = res.data?.data || {};
      setRows(data.rows || data.items || []);
      setMeta(data.report || data.meta || { name: reportKey });
      const cols =
        data.columns ||
        (data.rows?.[0]
          ? Object.keys(data.rows[0]).map((k) => ({
              key: k,
              label: formatLabel(k),
            }))
          : []);
      setColumns(cols);
      setPagination({
        page: data.pagination?.page || page,
        pageSize: data.pagination?.pageSize || 20,
        total: data.pagination?.total || (data.rows || []).length,
      });
      try {
        const ch = await getAnalyticsChart(reportKey, { chartType: 'bar' });
        setChart(ch.data?.data || null);
      } catch {
        setChart(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run report');
    } finally {
      setLoading(false);
    }
  }, [reportKey, page]);

  useEffect(() => {
    load();
  }, [load]);

  const onExport = async () => {
    setExporting(true);
    setMessage('');
    try {
      const res = await createAnalyticsExport({
        reportKey,
        format,
        filters: {},
      });
      setMessage(res.data?.message || 'Export queued');
      navigate(isFinance ? '/finance/analytics/exports' : ADMIN_ROUTES['analytics-exports']);
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell
      active={isFinance ? 'analytics' : 'analytics-catalog'}
      routes={routes}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Analytics' },
        { label: meta?.name || reportKey },
      ]}
    >
      <PageHeader
        icon={FileBarChart}
        iconColor="#c4b5fd"
        title={meta?.name || formatLabel(reportKey)}
        subtitle={meta?.description || `Report key: ${reportKey}`}
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <FormSelect
              label="Format"
              value={format}
              onChange={setFormat}
              options={EXPORT_FORMATS.map((f) => ({ value: f, label: f.toUpperCase() }))}
            />
            <button className="btn-primary" type="button" disabled={exporting} onClick={onExport}>
              {exporting ? 'Exporting…' : 'Export'}
            </button>
          </div>
        }
      />
      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {message && <p style={{ color: '#86efac' }}>{message}</p>}
      <FilterBar>
        <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>
          Back
        </button>
      </FilterBar>
      {loading ? (
        <SkeletonLoader rows={6} />
      ) : (
        <>
          {chart?.series?.length > 0 && (
            <section className="glass-card" style={{ padding: 16, borderRadius: 16, marginBottom: 16 }}>
              {chart.type === 'pie' ? (
                <PieChart series={chart.series} />
              ) : (
                <BarChart series={chart.series} />
              )}
            </section>
          )}
          <DataTable columns={columns} rows={rows} />
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={setPage}
          />
        </>
      )}
    </AppShell>
  );
}
