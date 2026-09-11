import { useCallback, useEffect, useState } from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import { DataTable, FilterBar, Pagination, SearchInput } from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import {
  DOCUMENT_SCOPES,
  DOCUMENT_STATUSES,
  formatFileSize,
  listDocumentCategories,
  listDocuments,
} from '../../../services/document.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

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

export default function DocumentsPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const routeMap = ADMIN_ROUTES;
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listDocumentCategories({ pageSize: 100 })
      .then((r) => setCategories(r.data?.data?.categories || []))
      .catch(() => {});
  }, []);

  const categoriesById = categories.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
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
      setError(err.response?.data?.message || 'Failed to fetch documents');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.categoryId, state.scope, state.isPinned]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      active="documents"
      onChange={(id) => routeMap[id] && navigate(routeMap[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Documents' }, { label: 'All documents' }]}
    >
      <PageHeader
        icon={FolderOpen}
        iconColor="#93c5fd"
        title="Documents"
        subtitle="Manage the document repository, permissions, and versions."
        action={
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate(`${basePath}/documents/new`)}
          >
            <Plus size={14} /> Upload document
          </button>
        }
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search documents" />
          <FilterBar
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
            values={state}
            onChange={setFilter}
          />
        </div>

        <DataTable
          columns={COLUMNS(categoriesById)}
          rows={rows}
          loading={loading}
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
