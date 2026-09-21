import { useEffect, useState } from 'react';
import { FolderSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  DataTable,
  FilterBar,
  Pagination,
  SearchInput,
  SkeletonLoader,
} from '@/components/common/index.js';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import { useListQuery } from '@/hooks/useListQuery.js';
import { normalizePagination } from '@/utils/listQuery.js';
import {
  REPORT_CATEGORIES,
  formatLabel,
  listAnalyticsReports,
} from '@/services/analytics.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const columns = [
  { key: 'name', label: 'Report' },
  { key: 'category', label: 'Category', render: (r) => formatLabel(r.category) },
  { key: 'reportKey', label: 'Key' },
  {
    key: 'strategy',
    label: 'Strategy',
    render: (r) => formatLabel(r.strategy || 'fact_query'),
  },
];

export default function AnalyticsCatalogPage() {
  const navigate = useNavigate();
  const { state, params, setPage, setSearch, setFilter } = useListQuery({
    sortBy: 'sort_order',
    sortOrder: 'asc',
    pageSize: 20,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    listAnalyticsReports(params)
      .then((res) => {
        setRows(res.data?.data?.reports || res.data?.data?.items || []);
        setPagination(normalizePagination(res.data?.data));
        setError('');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load catalog'))
      .finally(() => setLoading(false));
  }, [params]);

  return (
    <AppShell
      active="analytics-catalog"
      routes={ADMIN_ROUTES}
      breadcrumb={[{ label: 'Home' }, { label: 'Analytics' }, { label: 'Catalog' }]}
    >
      <PageHeader
        icon={FolderSearch}
        iconColor="#93c5fd"
        title="Report Catalog"
        subtitle="Browse and run cross-module analytics reports."
      />
      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      <div className="crud-toolbar">
        <SearchInput value={state.search || ''} onChange={setSearch} placeholder="Search reports" />
        <FilterBar>
          <select
            value={state.category || ''}
            onChange={(e) => setFilter('category', e.target.value || undefined)}
          >
            <option value="">All categories</option>
            {REPORT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {formatLabel(c)}
              </option>
            ))}
          </select>
        </FilterBar>
      </div>
      {loading ? (
        <SkeletonLoader rows={6} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(row) =>
            navigate(`/admin/analytics/reports/${encodeURIComponent(row.reportKey || row.key)}`)
          }
        />
      )}
      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onChange={setPage}
      />
    </AppShell>
  );
}
