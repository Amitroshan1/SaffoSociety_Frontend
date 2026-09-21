import { useCallback, useEffect, useState } from 'react';
import { FolderOpen, Plus, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  DataTable,
  FilterBar,
  FormField,
  FormLayout,
  FormSelect,
  Pagination,
  SearchInput,
} from '@/components/common/index.js';
import { FINANCE_ROUTES } from '@/constants/adminRoutes.js';
import { useListQuery } from '@/hooks/useListQuery.js';
import { normalizePagination } from '@/utils/listQuery.js';
import {
  DOCUMENT_ALLOWED_MIME_TYPES,
  DOCUMENT_STATUSES,
  createFinanceDocument,
  downloadFinanceDocument,
  formatFileSize,
  listDocumentCategories,
  listFinanceDocuments,
  openDownloadedFile,
} from '@/services/document.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const initialForm = {
  title: '',
  description: '',
  categoryId: '',
  fileName: '',
  fileUrl: '',
  mimeType: '',
};

export default function FinanceDocumentsPage() {
  const navigate = useNavigate();
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
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);

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
      const { data } = await listFinanceDocuments(finalParams);
      setRows(data.data?.documents || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch finance documents');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  const onDownload = async (row) => {
    try {
      const { data } = await downloadFinanceDocument(row.id);
      openDownloadedFile(data, row.fileUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Download failed');
    }
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await createFinanceDocument({
        title: form.title.trim(),
        description: form.description.trim() || null,
        categoryId: form.categoryId || null,
        fileName: form.fileName.trim(),
        fileUrl: form.fileUrl.trim(),
        mimeType: form.mimeType || null,
      });
      setSuccess('Finance document uploaded');
      setForm(initialForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const COLUMNS = [
    { key: 'documentNumber', label: 'Doc #', sortable: true },
    { key: 'title', label: 'Title' },
    {
      key: 'categoryName',
      label: 'Category',
      render: (row) => row.categoryName || categoriesById[row.categoryId] || '-',
    },
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
    { key: 'fileSizeBytes', label: 'Size', render: (row) => formatFileSize(row.fileSizeBytes) },
    {
      key: 'download',
      label: 'Download',
      render: (row) => (
        <button
          type="button"
          className="crud-btn crud-btn-ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDownload(row);
          }}
        >
          Download
        </button>
      ),
    },
  ];

  return (
    <AppShell
      active="documents"
      routes={FINANCE_ROUTES}
      breadcrumb={[{ label: 'Home' }, { label: 'Finance' }, { label: 'Documents' }]}
    >
      <PageHeader
        icon={FolderOpen}
        iconColor="#93c5fd"
        title="Finance Documents"
        subtitle="Financial statements, audit reports, and finance-scoped files."
        action={
          <button className="btn-primary" type="button" onClick={() => setShowForm((v) => !v)}>
            <Plus size={14} /> Upload document
          </button>
        }
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      {showForm && (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
          <form onSubmit={onCreate}>
            <FormLayout
              sections={[
                {
                  title: 'New finance document',
                  content: (
                    <>
                      <FormField
                        label="Title *"
                        value={form.title}
                        onChange={(v) => setForm((s) => ({ ...s, title: v }))}
                        required
                      />
                      <FormField
                        label="File name *"
                        value={form.fileName}
                        onChange={(v) => setForm((s) => ({ ...s, fileName: v }))}
                        required
                      />
                      <FormField
                        label="File URL *"
                        value={form.fileUrl}
                        onChange={(v) => setForm((s) => ({ ...s, fileUrl: v }))}
                        required
                      />
                      <FormSelect
                        label="Category"
                        value={form.categoryId}
                        options={categories.map((c) => ({ value: c.id, label: c.name }))}
                        onChange={(v) => setForm((s) => ({ ...s, categoryId: v }))}
                      />
                      <FormSelect
                        label="MIME type"
                        value={form.mimeType}
                        options={DOCUMENT_ALLOWED_MIME_TYPES}
                        onChange={(v) => setForm((s) => ({ ...s, mimeType: v }))}
                        placeholder="Select (optional)"
                      />
                      <FormField
                        textarea
                        label="Description"
                        value={form.description}
                        onChange={(v) => setForm((s) => ({ ...s, description: v }))}
                      />
                    </>
                  ),
                },
              ]}
            />
            <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop: 14 }}>
              <Save size={14} /> {saving ? 'Saving…' : 'Upload'}
            </button>
          </form>
        </section>
      )}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search finance documents" />
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: DOCUMENT_STATUSES.map((s) => ({ value: s, label: s })),
              },
              {
                key: 'categoryId',
                label: 'Category',
                options: categories.map((c) => ({ value: c.id, label: c.name })),
              },
            ]}
            values={state}
            onChange={setFilter}
          />
        </div>

        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          emptyTitle="No finance documents found"
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
