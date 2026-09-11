import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import { DataTable, Pagination, SkeletonLoader } from '../../../components/common/index.js';
import { ADMIN_ROUTES, FINANCE_ROUTES } from '../../../constants/adminRoutes.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import {
  downloadAnalyticsExport,
  formatLabel,
  listAnalyticsExports,
} from '../../../services/analytics.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const columns = (onDownload) => [
  { key: 'reportKey', label: 'Report' },
  { key: 'format', label: 'Format', render: (r) => (r.format || '').toUpperCase() },
  { key: 'status', label: 'Status', render: (r) => formatLabel(r.status) },
  { key: 'rowCount', label: 'Rows' },
  {
    key: 'createdAt',
    label: 'Created',
    render: (r) => r.createdAt || r.completedAt || '-',
  },
  {
    key: 'actions',
    label: '',
    render: (r) =>
      r.status === 'completed' ? (
        <button type="button" className="btn-primary" onClick={() => onDownload(r)}>
          Download
        </button>
      ) : (
        '-'
      ),
  },
];

export default function AnalyticsExportsPage({ basePath = '/admin' } = {}) {
  const isFinance = basePath.startsWith('/finance');
  const routes = isFinance ? FINANCE_ROUTES : ADMIN_ROUTES;
  const { state, params, setPage } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    listAnalyticsExports(params)
      .then((res) => {
        setRows(res.data?.data?.exports || res.data?.data?.jobs || []);
        setPagination(normalizePagination(res.data?.data));
        setError('');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load exports'))
      .finally(() => setLoading(false));
  }, [params]);

  const onDownload = async (row) => {
    try {
      const res = await downloadAnalyticsExport(row.id);
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = row.fileName || `${row.reportKey}.${row.format || 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Download failed');
    }
  };

  return (
    <AppShell
      active="analytics-exports"
      routes={routes}
      breadcrumb={[{ label: 'Home' }, { label: 'Analytics' }, { label: 'Exports' }]}
    >
      <PageHeader
        icon={Download}
        iconColor="#86efac"
        title="Export Center"
        subtitle="Background exports with download history and expiry."
      />
      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {loading ? <SkeletonLoader rows={5} /> : <DataTable columns={columns(onDownload)} rows={rows} />}
      <Pagination
        page={pagination.page || state.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onChange={setPage}
      />
    </AppShell>
  );
}
