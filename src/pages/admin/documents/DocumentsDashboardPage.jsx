import { useCallback, useEffect, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  DataTable,
  ListToolbar,
  Pagination,
} from '@/components/common/index.js';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import { useListQuery } from '@/hooks/useListQuery.js';
import { normalizePagination } from '@/utils/listQuery.js';
import {
  DOCUMENT_SCOPES,
  DOCUMENT_STATUSES,
  formatFileSize,
  listDocumentCategories,
  listDocuments,
} from '@/services/document.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const COLUMNS = (categoriesById) => [
  { key: 'documentNumber', label: 'Doc #', sortable: true },
  { key: 'title', label: 'Title' },
  {
    key: 'categoryName',
    label: 'Category',
    render: (row) => row.categoryName || categoriesById[row.categoryId] || '-',
  },
  { key: 'scope', label: 'Scope' },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <span
        className={`crud-badge ${
          row.status === 'published' ? 'crud-badge-active' : 'crud-badge-inactive'
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    key: 'isPinned',
    label: 'Pinned',
    render: (row) => (row.isPinned ? 'Yes' : 'No'),
  },
  {
    key: 'fileSizeBytes',
    label: 'Size',
    render: (row) => formatFileSize(row.fileSizeBytes),
  },
  { key: 'downloadCount', label: 'Downloads' },
];

export default function DocumentsDashboardPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isFinance = basePath.startsWith('/finance');

  const routeMap = isFinance
    ? {
        documents: `${basePath}/documents`,
        'documents-list': `${basePath}/documents`,
        'documents-new': `${basePath}/documents/new`,
        'documents-categories': `${basePath}/documents/categories`,
        'documents-reports': `${basePath}/documents/reports`,
      }
    : ADMIN_ROUTES;

  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [categories, setCategories] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    listDocumentCategories({ pageSize: 100 })
      .then((r) => setCategories(r.data?.data?.categories || []))
      .catch(() => {});
  }, []);

  const categoriesById = categories.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {});

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const finalParams = { ...params };
      if (state.categoryId) finalParams.categoryId = state.categoryId;
      if (state.scope) finalParams.scope = state.scope;
      if (state.isPinned !== undefined && state.isPinned !== '') {
        finalParams.isPinned = state.isPinned;
      }
      const { data } = await listDocuments(finalParams);
      setRows(data.data?.documents || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setListError(err.response?.data?.message || 'Failed to fetch documents');
      setRows([]);
    } finally {
      setListLoading(false);
    }
  }, [params, state.categoryId, state.scope, state.isPinned]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  return (
    <AppShell
      active="documents"
      onChange={(id) => routeMap[id] && navigate(routeMap[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Documents' }]}
    >
      <PageHeader
        icon={FolderOpen}
        iconColor="#93c5fd"
        title="Documents"
        subtitle="Manage the document repository, permissions, and versions."
      />

      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <h3 style={{ margin: 0, flex: '1 1 auto' }}>Quick links</h3>
          <button
            type="button"
            className="btn-primary crud-btn-sm"
            onClick={() => navigate(routeMap['documents-categories'])}
          >
            Categories
          </button>
        </div>
      </section>

      {listError && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{listError}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>All documents</h3>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search documents"
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: DOCUMENT_STATUSES.map((s) => ({ value: s, label: s })),
            },
            {
              key: 'scope',
              label: 'Scope',
              options: DOCUMENT_SCOPES.map((s) => ({ value: s, label: s })),
            },
            {
              key: 'categoryId',
              label: 'Category',
              options: categories.map((c) => ({ value: c.id, label: c.name })),
            },
            {
              key: 'isPinned',
              label: 'Pinned',
              options: [
                { value: 'true', label: 'Pinned' },
                { value: 'false', label: 'Not pinned' },
              ],
            },
          ]}
          filterValues={state}
          onFilterChange={setFilter}
          newLabel="New Document"
          onNew={() => navigate(routeMap['documents-new'] || `${basePath}/documents/new`)}
        />
        <DataTable
          columns={COLUMNS(categoriesById)}
          rows={rows}
          loading={listLoading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`${basePath}/documents/${row.id}`)}
          emptyTitle="No documents found"
        />
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={setPage}
        />
      </section>
    </AppShell>
  );
}
