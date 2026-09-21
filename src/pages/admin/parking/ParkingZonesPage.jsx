import { useCallback, useEffect, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  ConfirmDialog,
  DataTable,
  FilterBar,
  FormField,
  FormSelect,
  Pagination,
  SearchInput,
} from '@/components/common/index.js';
import { useListQuery } from '@/hooks/useListQuery.js';
import { normalizePagination } from '@/utils/listQuery.js';
import {
  PARKING_ZONE_TYPES,
  createParkingZone,
  deleteParkingZone,
  formatFee,
  formatLabel,
  listParkingZones,
  updateParkingZone,
} from '@/services/parking.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const initialForm = {
  code: '',
  name: '',
  description: '',
  zoneType: 'basement',
  floorLabel: '',
  isVisitorAllowed: 'true',
  monthlyFeeMinor: '0',
  visitorFeeMinor: '0',
  additionalVehicleFeeMinor: '0',
  notes: '',
};

export default function ParkingZonesPage() {
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const finalParams = { ...params };
      if (state.zoneType) finalParams.zoneType = state.zoneType;
      if (state.isActive !== undefined && state.isActive !== '') {
        finalParams.isActive = state.isActive;
      }
      const { data } = await listParkingZones(finalParams);
      setRows(data.data?.zones || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch zones');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.zoneType, state.isActive]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setSelected(null);
    setForm(initialForm);
    setShowForm(false);
  };

  const openCreate = () => {
    setSelected(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      code: row.code || '',
      name: row.name || '',
      description: row.description || '',
      zoneType: row.zoneType || 'basement',
      floorLabel: row.floorLabel || '',
      isVisitorAllowed: String(row.isVisitorAllowed !== false),
      monthlyFeeMinor: String(row.monthlyFeeMinor ?? 0),
      visitorFeeMinor: String(row.visitorFeeMinor ?? 0),
      additionalVehicleFeeMinor: String(row.additionalVehicleFeeMinor ?? 0),
      notes: row.notes || '',
    });
    setShowForm(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        zoneType: form.zoneType,
        floorLabel: form.floorLabel.trim() || null,
        isVisitorAllowed: form.isVisitorAllowed === 'true',
        monthlyFeeMinor: Number(form.monthlyFeeMinor) || 0,
        visitorFeeMinor: Number(form.visitorFeeMinor) || 0,
        additionalVehicleFeeMinor: Number(form.additionalVehicleFeeMinor) || 0,
        notes: form.notes.trim() || null,
      };
      if (selected) {
        await updateParkingZone(selected.id, payload);
        setSuccess('Zone updated');
      } else {
        await createParkingZone({ ...payload, code: form.code.trim() });
        setSuccess('Zone created');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await deleteParkingZone(selected.id);
      setSuccess('Zone deleted');
      setConfirmDelete(false);
      resetForm();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  const COLUMNS = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'zoneType', label: 'Type', render: (r) => formatLabel(r.zoneType) },
    { key: 'floorLabel', label: 'Floor', render: (r) => r.floorLabel || '-' },
    { key: 'totalSlots', label: 'Total' },
    { key: 'availableSlots', label: 'Available' },
    {
      key: 'monthlyFeeMinor',
      label: 'Monthly fee',
      render: (r) => formatFee(r.monthlyFeeMinor),
    },
    {
      key: 'isVisitorAllowed',
      label: 'Visitor',
      render: (r) => (r.isVisitorAllowed ? 'Yes' : 'No'),
    },
  ];

  return (
    <AppShell
      active="parking"
      breadcrumb={[{ label: 'Home' }, { label: 'Parking' }, { label: 'Zones' }]}
    >
      <PageHeader
        icon={MapPin}
        iconColor="#93c5fd"
        title="Parking Zones"
        subtitle="Configure basement, open, covered, visitor, and EV parking zones."
        action={
          <button className="btn-primary" type="button" onClick={openCreate}>
            <Plus size={14} /> New zone
          </button>
        }
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search zones" />
          <FilterBar
            filters={[
              {
                key: 'zoneType',
                label: 'Type',
                options: PARKING_ZONE_TYPES.map((t) => ({ value: t, label: formatLabel(t) })),
              },
              {
                key: 'isActive',
                label: 'Active',
                options: [
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ],
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
          onRowClick={openEdit}
          emptyTitle="No zones found"
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

      {showForm && (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
            <h3 style={{ marginTop: 0 }}>{selected ? `Edit ${selected.code}` : 'New zone'}</h3>
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
              label="Zone type"
              value={form.zoneType}
              options={PARKING_ZONE_TYPES.map((t) => ({ value: t, label: formatLabel(t) }))}
              onChange={(v) => setForm((s) => ({ ...s, zoneType: v }))}
            />
            <FormField
              label="Floor label"
              value={form.floorLabel}
              onChange={(v) => setForm((s) => ({ ...s, floorLabel: v }))}
            />
            <FormSelect
              label="Visitor allowed"
              value={form.isVisitorAllowed}
              options={[
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' },
              ]}
              onChange={(v) => setForm((s) => ({ ...s, isVisitorAllowed: v }))}
            />
            <FormField
              label="Monthly fee (paise)"
              type="number"
              value={form.monthlyFeeMinor}
              onChange={(v) => setForm((s) => ({ ...s, monthlyFeeMinor: v }))}
            />
            <FormField
              label="Visitor fee (paise)"
              type="number"
              value={form.visitorFeeMinor}
              onChange={(v) => setForm((s) => ({ ...s, visitorFeeMinor: v }))}
            />
            <FormField
              label="Additional vehicle fee (paise)"
              type="number"
              value={form.additionalVehicleFeeMinor}
              onChange={(v) => setForm((s) => ({ ...s, additionalVehicleFeeMinor: v }))}
            />
            <FormField
              textarea
              label="Description"
              value={form.description}
              onChange={(v) => setForm((s) => ({ ...s, description: v }))}
            />
            <FormField
              textarea
              label="Notes"
              value={form.notes}
              onChange={(v) => setForm((s) => ({ ...s, notes: v }))}
            />
            <div className="crud-modal-actions">
              <button type="button" className="crud-btn crud-btn-ghost" onClick={resetForm} disabled={saving}>
                Cancel
              </button>
              {selected && (
                <button
                  type="button"
                  className="crud-btn crud-btn-danger"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                >
                  Delete
                </button>
              )}
              <button type="submit" className="crud-btn crud-btn-primary" disabled={saving}>
                {saving ? 'Saving…' : selected ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </section>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete zone"
        message={`Delete zone ${selected?.code || ''}? This cannot be undone if slots exist.`}
        confirmLabel="Delete"
        variant="danger"
        loading={saving}
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </AppShell>
  );
}
