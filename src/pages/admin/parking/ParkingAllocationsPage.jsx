import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Plus } from 'lucide-react';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  DataTable,
  FilterBar,
  FormField,
  FormSelect,
  Pagination,
  SearchInput,
  StatusBadge,
} from '../../../components/common/index.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import {
  ALLOCATION_STATUSES,
  ALLOCATION_STATUS_COLORS,
  ALLOCATION_TYPES,
  allocateParking,
  formatFee,
  formatLabel,
  listParkingAllocations,
  listParkingSlots,
  listParkingVehicles,
  revokeParking,
  transferParking,
} from '../../../services/parking.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const allocateInitial = {
  slotId: '',
  residentId: '',
  vehicleId: '',
  allocationType: 'permanent',
  startDate: '',
  endDate: '',
  monthlyFeeMinor: '0',
  notes: '',
};

export default function ParkingAllocationsPage() {
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [slots, setSlots] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [allocateForm, setAllocateForm] = useState(allocateInitial);
  const [transferForm, setTransferForm] = useState({ newSlotId: '', vehicleId: '', reason: '' });
  const [revokeReason, setRevokeReason] = useState('');

  useEffect(() => {
    Promise.all([
      listParkingSlots({ status: 'available', pageSize: 100 }),
      listParkingVehicles({ status: 'active', pageSize: 100 }),
    ])
      .then(([slotsRes, vehiclesRes]) => {
        setSlots(slotsRes.data?.data?.slots || []);
        setVehicles(vehiclesRes.data?.data?.vehicles || []);
      })
      .catch(() => {
        setSlots([]);
        setVehicles([]);
      });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const finalParams = { ...params };
      if (state.status) finalParams.status = state.status;
      if (state.allocationType) finalParams.allocationType = state.allocationType;
      const { data } = await listParkingAllocations(finalParams);
      setRows(data.data?.allocations || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch allocations');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.status, state.allocationType]);

  useEffect(() => {
    load();
  }, [load]);

  const closeForms = () => {
    setMode(null);
    setSelected(null);
    setAllocateForm(allocateInitial);
    setTransferForm({ newSlotId: '', vehicleId: '', reason: '' });
    setRevokeReason('');
  };

  const onAllocate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await allocateParking({
        slotId: allocateForm.slotId,
        residentId: allocateForm.residentId.trim(),
        vehicleId: allocateForm.vehicleId || null,
        allocationType: allocateForm.allocationType,
        startDate: allocateForm.startDate,
        endDate: allocateForm.endDate || null,
        monthlyFeeMinor: Number(allocateForm.monthlyFeeMinor) || 0,
        notes: allocateForm.notes.trim() || null,
      });
      setSuccess('Parking allocated');
      closeForms();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Allocation failed');
    } finally {
      setSaving(false);
    }
  };

  const onTransfer = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await transferParking({
        allocationId: selected.id,
        newSlotId: transferForm.newSlotId,
        vehicleId: transferForm.vehicleId || null,
        reason: transferForm.reason.trim() || null,
      });
      setSuccess('Parking transferred');
      closeForms();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed');
    } finally {
      setSaving(false);
    }
  };

  const onRevoke = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await revokeParking({
        allocationId: selected.id,
        reason: revokeReason.trim() || 'Revoked by admin',
      });
      setSuccess('Allocation revoked');
      closeForms();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Revoke failed');
    } finally {
      setSaving(false);
    }
  };

  const COLUMNS = [
    { key: 'allocationNumber', label: 'Allocation #', sortable: true },
    { key: 'slotCode', label: 'Slot', render: (r) => r.slotCode || '-' },
    { key: 'residentName', label: 'Resident', render: (r) => r.residentName || '-' },
    { key: 'vehicleNumber', label: 'Vehicle', render: (r) => r.vehicleNumber || '-' },
    {
      key: 'allocationType',
      label: 'Type',
      render: (r) => formatLabel(r.allocationType),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} colors={ALLOCATION_STATUS_COLORS} />,
    },
    { key: 'startDate', label: 'Start' },
    {
      key: 'monthlyFeeMinor',
      label: 'Fee',
      render: (r) => formatFee(r.monthlyFeeMinor),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status === 'active' ? (
          <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="crud-btn crud-btn-ghost"
              onClick={() => {
                setSelected(r);
                setMode('transfer');
                setTransferForm({ newSlotId: '', vehicleId: r.vehicleId || '', reason: '' });
              }}
            >
              Transfer
            </button>
            <button
              type="button"
              className="crud-btn crud-btn-danger"
              onClick={() => {
                setSelected(r);
                setRevokeReason('');
                setMode('revoke');
              }}
            >
              Revoke
            </button>
          </div>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <AppShell
      active="parking"
      breadcrumb={[{ label: 'Home' }, { label: 'Parking' }, { label: 'Allocations' }]}
    >
      <PageHeader
        icon={KeyRound}
        iconColor="#93c5fd"
        title="Parking Allocations"
        subtitle="Allocate, transfer, and revoke permanent or temporary parking."
        action={
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setMode('allocate');
              setAllocateForm(allocateInitial);
            }}
          >
            <Plus size={14} /> Allocate
          </button>
        }
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search allocations" />
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: ALLOCATION_STATUSES.map((s) => ({ value: s, label: formatLabel(s) })),
              },
              {
                key: 'allocationType',
                label: 'Type',
                options: ALLOCATION_TYPES.map((t) => ({ value: t, label: formatLabel(t) })),
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
          emptyTitle="No allocations found"
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

      {mode === 'allocate' && (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <form onSubmit={onAllocate} style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
            <h3 style={{ marginTop: 0 }}>Allocate parking</h3>
            <FormSelect
              label="Available slot *"
              value={allocateForm.slotId}
              options={slots.map((s) => ({
                value: s.id,
                label: `${s.slotCode}${s.label ? ` (${s.label})` : ''}`,
              }))}
              onChange={(v) => setAllocateForm((s) => ({ ...s, slotId: v }))}
              required
            />
            <FormField
              label="Resident ID *"
              value={allocateForm.residentId}
              onChange={(v) => setAllocateForm((s) => ({ ...s, residentId: v }))}
              required
            />
            <FormSelect
              label="Vehicle"
              value={allocateForm.vehicleId}
              options={vehicles.map((v) => ({
                value: v.id,
                label: `${v.vehicleNumber} (${formatLabel(v.vehicleType)})`,
              }))}
              onChange={(v) => setAllocateForm((s) => ({ ...s, vehicleId: v }))}
            />
            <FormSelect
              label="Allocation type"
              value={allocateForm.allocationType}
              options={ALLOCATION_TYPES.map((t) => ({ value: t, label: formatLabel(t) }))}
              onChange={(v) => setAllocateForm((s) => ({ ...s, allocationType: v }))}
            />
            <FormField
              label="Start date *"
              type="date"
              value={allocateForm.startDate}
              onChange={(v) => setAllocateForm((s) => ({ ...s, startDate: v }))}
              required
            />
            <FormField
              label="End date"
              type="date"
              value={allocateForm.endDate}
              onChange={(v) => setAllocateForm((s) => ({ ...s, endDate: v }))}
            />
            <FormField
              label="Monthly fee (paise)"
              type="number"
              value={allocateForm.monthlyFeeMinor}
              onChange={(v) => setAllocateForm((s) => ({ ...s, monthlyFeeMinor: v }))}
            />
            <FormField
              textarea
              label="Notes"
              value={allocateForm.notes}
              onChange={(v) => setAllocateForm((s) => ({ ...s, notes: v }))}
            />
            <div className="crud-modal-actions">
              <button type="button" className="crud-btn crud-btn-ghost" onClick={closeForms} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="crud-btn crud-btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Allocate'}
              </button>
            </div>
          </form>
        </section>
      )}

      {mode === 'transfer' && selected && (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <form onSubmit={onTransfer} style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
            <h3 style={{ marginTop: 0 }}>Transfer {selected.allocationNumber}</h3>
            <FormSelect
              label="New slot *"
              value={transferForm.newSlotId}
              options={slots.map((s) => ({
                value: s.id,
                label: `${s.slotCode}${s.label ? ` (${s.label})` : ''}`,
              }))}
              onChange={(v) => setTransferForm((s) => ({ ...s, newSlotId: v }))}
              required
            />
            <FormSelect
              label="Vehicle"
              value={transferForm.vehicleId}
              options={vehicles.map((v) => ({
                value: v.id,
                label: `${v.vehicleNumber} (${formatLabel(v.vehicleType)})`,
              }))}
              onChange={(v) => setTransferForm((s) => ({ ...s, vehicleId: v }))}
            />
            <FormField
              label="Reason"
              value={transferForm.reason}
              onChange={(v) => setTransferForm((s) => ({ ...s, reason: v }))}
            />
            <div className="crud-modal-actions">
              <button type="button" className="crud-btn crud-btn-ghost" onClick={closeForms} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="crud-btn crud-btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Transfer'}
              </button>
            </div>
          </form>
        </section>
      )}

      {mode === 'revoke' && selected && (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onRevoke();
            }}
            style={{ display: 'grid', gap: 12, maxWidth: 560 }}
          >
            <h3 style={{ marginTop: 0 }}>Revoke {selected.allocationNumber}</h3>
            <p style={{ margin: 0, opacity: 0.8 }}>The slot will become available.</p>
            <FormField label="Reason" value={revokeReason} onChange={setRevokeReason} required />
            <div className="crud-modal-actions">
              <button type="button" className="crud-btn crud-btn-ghost" onClick={closeForms} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="crud-btn crud-btn-danger" disabled={saving}>
                {saving ? 'Revoking…' : 'Revoke'}
              </button>
            </div>
          </form>
        </section>
      )}
    </AppShell>
  );
}
