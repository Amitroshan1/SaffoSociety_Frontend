import { useCallback, useEffect, useState } from 'react';
import { Grid3x3, Plus } from 'lucide-react';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  DataTable,
  FilterBar,
  FormField,
  FormSelect,
  Pagination,
  SearchInput,
  StatusBadge,
} from '@/components/common/index.js';
import { useListQuery } from '@/hooks/useListQuery.js';
import { normalizePagination } from '@/utils/listQuery.js';
import {
  SLOT_CATEGORIES,
  SLOT_STATUSES,
  SLOT_STATUS_COLORS,
  createParkingSlot,
  formatFee,
  formatLabel,
  listParkingSlots,
  listParkingZones,
  updateParkingSlot,
} from '@/services/parking.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const initialForm = {
  zoneId: '',
  slotCode: '',
  label: '',
  slotCategory: 'standard',
  vehicleTypesAllowed: 'car,bike,scooter,ev',
  status: 'available',
  floorNo: '',
  isCovered: 'false',
  isEvCharging: 'false',
  monthlyFeeMinor: '',
  notes: '',
};

export default function ParkingSlotsPage() {
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [zones, setZones] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    listParkingZones({ pageSize: 100 })
      .then((r) => setZones(r.data?.data?.zones || []))
      .catch(() => setZones([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const finalParams = { ...params };
      if (state.status) finalParams.status = state.status;
      if (state.slotCategory) finalParams.slotCategory = state.slotCategory;
      if (state.zoneId) finalParams.zoneId = state.zoneId;
      const { data } = await listParkingSlots(finalParams);
      setRows(data.data?.slots || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch slots');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.status, state.slotCategory, state.zoneId]);

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
      zoneId: row.zoneId || '',
      slotCode: row.slotCode || '',
      label: row.label || '',
      slotCategory: row.slotCategory || 'standard',
      vehicleTypesAllowed: row.vehicleTypesAllowed || 'car,bike,scooter,ev',
      status: row.status || 'available',
      floorNo: row.floorNo != null ? String(row.floorNo) : '',
      isCovered: String(!!row.isCovered),
      isEvCharging: String(!!row.isEvCharging),
      monthlyFeeMinor: row.monthlyFeeMinor != null ? String(row.monthlyFeeMinor) : '',
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
        label: form.label.trim() || null,
        slotCategory: form.slotCategory,
        vehicleTypesAllowed: form.vehicleTypesAllowed.trim(),
        status: form.status,
        floorNo: form.floorNo === '' ? null : Number(form.floorNo),
        isCovered: form.isCovered === 'true',
        isEvCharging: form.isEvCharging === 'true',
        monthlyFeeMinor: form.monthlyFeeMinor === '' ? null : Number(form.monthlyFeeMinor),
        notes: form.notes.trim() || null,
      };
      if (selected) {
        await updateParkingSlot(selected.id, payload);
        setSuccess('Slot updated');
      } else {
        await createParkingSlot({
          ...payload,
          zoneId: form.zoneId,
          slotCode: form.slotCode.trim(),
        });
        setSuccess('Slot created');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const COLUMNS = [
    { key: 'slotCode', label: 'Slot code', sortable: true },
    { key: 'label', label: 'Label', render: (r) => r.label || '-' },
    { key: 'zoneName', label: 'Zone', render: (r) => r.zoneName || r.zoneCode || '-' },
    {
      key: 'slotCategory',
      label: 'Category',
      render: (r) => formatLabel(r.slotCategory),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} colors={SLOT_STATUS_COLORS} />,
    },
    {
      key: 'monthlyFeeMinor',
      label: 'Fee',
      render: (r) => (r.monthlyFeeMinor != null ? formatFee(r.monthlyFeeMinor) : '-'),
    },
    {
      key: 'isEvCharging',
      label: 'EV',
      render: (r) => (r.isEvCharging ? 'Yes' : 'No'),
    },
  ];

  return (
    <AppShell
      active="parking"
      breadcrumb={[{ label: 'Home' }, { label: 'Parking' }, { label: 'Slots' }]}
    >
      <PageHeader
        icon={Grid3x3}
        iconColor="#93c5fd"
        title="Parking Slots"
        subtitle="Manage slot inventory, categories, EV charging, and availability."
        action={
          <button className="btn-primary" type="button" onClick={openCreate}>
            <Plus size={14} /> New slot
          </button>
        }
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search slots" />
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: SLOT_STATUSES.map((s) => ({ value: s, label: formatLabel(s) })),
              },
              {
                key: 'slotCategory',
                label: 'Category',
                options: SLOT_CATEGORIES.map((c) => ({ value: c, label: formatLabel(c) })),
              },
              {
                key: 'zoneId',
                label: 'Zone',
                options: zones.map((z) => ({ value: z.id, label: z.name || z.code })),
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
          emptyTitle="No slots found"
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
            <h3 style={{ marginTop: 0 }}>{selected ? `Edit ${selected.slotCode}` : 'New slot'}</h3>
            {!selected && (
              <>
                <FormSelect
                  label="Zone *"
                  value={form.zoneId}
                  options={zones.map((z) => ({ value: z.id, label: `${z.code} — ${z.name}` }))}
                  onChange={(v) => setForm((s) => ({ ...s, zoneId: v }))}
                  required
                />
                <FormField
                  label="Slot code *"
                  value={form.slotCode}
                  onChange={(v) => setForm((s) => ({ ...s, slotCode: v }))}
                  required
                />
              </>
            )}
            <FormField
              label="Label"
              value={form.label}
              onChange={(v) => setForm((s) => ({ ...s, label: v }))}
            />
            <FormSelect
              label="Category"
              value={form.slotCategory}
              options={SLOT_CATEGORIES.map((c) => ({ value: c, label: formatLabel(c) }))}
              onChange={(v) => setForm((s) => ({ ...s, slotCategory: v }))}
            />
            <FormSelect
              label="Status"
              value={form.status}
              options={SLOT_STATUSES.map((s) => ({ value: s, label: formatLabel(s) }))}
              onChange={(v) => setForm((s) => ({ ...s, status: v }))}
            />
            <FormField
              label="Vehicle types allowed"
              value={form.vehicleTypesAllowed}
              onChange={(v) => setForm((s) => ({ ...s, vehicleTypesAllowed: v }))}
            />
            <FormField
              label="Floor no"
              type="number"
              value={form.floorNo}
              onChange={(v) => setForm((s) => ({ ...s, floorNo: v }))}
            />
            <FormSelect
              label="Covered"
              value={form.isCovered}
              options={[
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' },
              ]}
              onChange={(v) => setForm((s) => ({ ...s, isCovered: v }))}
            />
            <FormSelect
              label="EV charging"
              value={form.isEvCharging}
              options={[
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' },
              ]}
              onChange={(v) => setForm((s) => ({ ...s, isEvCharging: v }))}
            />
            <FormField
              label="Monthly fee (paise)"
              type="number"
              value={form.monthlyFeeMinor}
              onChange={(v) => setForm((s) => ({ ...s, monthlyFeeMinor: v }))}
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
              <button type="submit" className="crud-btn crud-btn-primary" disabled={saving}>
                {saving ? 'Saving…' : selected ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </section>
      )}
    </AppShell>
  );
}
