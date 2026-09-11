import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Save, Tags } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  DataTable,
  FilterBar,
  FormField,
  FormLayout,
  FormSelect,
  SearchInput,
} from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import {
  createDocumentCategory,
  deactivateDocumentCategory,
  listDocumentCategories,
  updateDocumentCategory,
} from '../../../services/document.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const COLUMNS = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'parentName', label: 'Parent', render: (row) => row.parentName || '-' },
  { key: 'displayOrder', label: 'Order' },
  {
    key: 'isActive',
    label: 'Active',
    render: (row) => (
      <span className={`crud-badge ${row.isActive ? 'crud-badge-active' : 'crud-badge-inactive'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

const initialForm = {
  code: '',
  name: '',
  description: '',
  parentId: '',
  displayOrder: '0',
};

export default function DocumentCategoriesPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const routeMap = ADMIN_ROUTES;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listDocumentCategories({ includeInactive: true });
      const categories = data.data?.categories || [];
      const byId = categories.reduce((acc, c) => {
        acc[c.id] = c.name;
        return acc;
      }, {});
      setRows(categories.map((c) => ({ ...c, parentName: c.parentId ? byId[c.parentId] : null })));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleRows = useMemo(() => {
    let filtered = rows;
    if (statusFilter === 'true') filtered = filtered.filter((r) => r.isActive);
    if (statusFilter === 'false') filtered = filtered.filter((r) => !r.isActive);
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) => r.code?.toLowerCase().includes(term) || r.name?.toLowerCase().includes(term),
      );
    }
    return [...filtered].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [rows, search, statusFilter]);

  const resetForm = () => {
    setSelected(null);
    setForm(initialForm);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        parentId: form.parentId || null,
        displayOrder: Number(form.displayOrder) || 0,
      };
      if (selected) {
        const { code, ...updatePayload } = payload;
        await updateDocumentCategory(selected.id, updatePayload);
      } else {
        await createDocumentCategory(payload);
      }
      setSuccess(selected ? 'Category updated' : 'Category created');
      resetForm();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDeactivate = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await deactivateDocumentCategory(selected.id);
      setSuccess('Category deactivated');
      resetForm();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Deactivate failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      active="documents"
      onChange={(id) => routeMap[id] && navigate(routeMap[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Documents' }, { label: 'Categories' }]}
    >
      <PageHeader
        icon={Tags}
        iconColor="#fbbf24"
        title="Document Categories"
        subtitle="Organize the document repository into a category tree."
        action={
          <button className="btn-primary" type="button" onClick={resetForm}>
            <Plus size={14} /> New category
          </button>
        }
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search categories" />
          <FilterBar
            filters={[
              {
                key: 'isActive',
                label: 'Status',
                options: [
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ],
              },
            ]}
            values={{ isActive: statusFilter }}
            onChange={(_key, value) => setStatusFilter(value)}
          />
        </div>
        <DataTable
          columns={COLUMNS}
          rows={visibleRows}
          loading={loading}
          onRowClick={(row) => {
            setSelected(row);
            setForm({
              code: row.code || '',
              name: row.name || '',
              description: row.description || '',
              parentId: row.parentId || '',
              displayOrder: String(row.displayOrder ?? 0),
            });
          }}
          emptyTitle="No categories"
        />
      </section>

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <form onSubmit={onSubmit}>
          <h3 style={{ marginTop: 0 }}>{selected ? `Edit ${selected.code}` : 'New category'}</h3>
          <FormLayout
            sections={[
              {
                title: 'Details',
                content: (
                  <>
                    {!selected && (
                      <FormField
                        label="Code *"
                        value={form.code}
                        onChange={(v) => setForm((s) => ({ ...s, code: v }))}
                        required
                      />
                    )}
                    <FormField
                      label="Name *"
                      value={form.name}
                      onChange={(v) => setForm((s) => ({ ...s, name: v }))}
                      required
                    />
                    <FormSelect
                      label="Parent category"
                      value={form.parentId}
                      options={rows
                        .filter((r) => r.id !== selected?.id)
                        .map((r) => ({ value: r.id, label: r.name }))}
                      onChange={(v) => setForm((s) => ({ ...s, parentId: v }))}
                    />
                    <FormField
                      label="Display order"
                      type="number"
                      value={form.displayOrder}
                      onChange={(v) => setForm((s) => ({ ...s, displayOrder: v }))}
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
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : selected ? 'Save changes' : 'Create'}
            </button>
            {selected && selected.isActive && (
              <button className="crud-btn crud-btn-danger" type="button" onClick={onDeactivate} disabled={saving}>
                Deactivate
              </button>
            )}
          </div>
        </form>
      </section>
    </AppShell>
  );
}
