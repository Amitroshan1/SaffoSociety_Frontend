import { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import FormField from '../../components/common/FormField';
import FormSelect from '../../components/common/FormSelect';
import StatusBadge from '../../components/common/StatusBadge';
import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_COLORS,
  VEHICLE_TYPES,
  createResidentVehicle,
  formatLabel,
  listResidentVehicles,
  updateResidentVehicle,
} from '../../services/parking.service';

const initialForm = {
  vehicleNumber: '',
  vehicleType: 'car',
  make: '',
  model: '',
  color: '',
  isPrimary: 'false',
  notes: '',
};

export default function MyVehicles() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listResidentVehicles();
      setRows(data.data?.vehicles || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vehicles');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
      vehicleNumber: row.vehicleNumber || '',
      vehicleType: row.vehicleType || 'car',
      make: row.make || '',
      model: row.model || '',
      color: row.color || '',
      isPrimary: String(!!row.isPrimary),
      notes: row.notes || '',
      status: row.status || 'active',
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
        vehicleType: form.vehicleType,
        make: form.make.trim() || null,
        model: form.model.trim() || null,
        color: form.color.trim() || null,
        isPrimary: form.isPrimary === 'true',
        notes: form.notes.trim() || null,
      };
      if (selected) {
        if (form.status) payload.status = form.status;
        await updateResidentVehicle(selected.id, payload);
        setSuccess('Vehicle updated');
      } else {
        await createResidentVehicle({
          ...payload,
          vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        });
        setSuccess('Vehicle registered');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'vehicleNumber', label: 'Number' },
    { key: 'vehicleType', label: 'Type', render: (r) => formatLabel(r.vehicleType) },
    {
      key: 'makeModel',
      label: 'Make / Model',
      render: (r) => [r.make, r.model].filter(Boolean).join(' ') || '-',
    },
    { key: 'color', label: 'Color', render: (r) => r.color || '-' },
    { key: 'parkingCode', label: 'Parking code', render: (r) => r.parkingCode || '-' },
    {
      key: 'isPrimary',
      label: 'Primary',
      render: (r) => (r.isPrimary ? 'Yes' : 'No'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} colors={VEHICLE_STATUS_COLORS} />,
    },
  ];

  if (error && !rows.length && !loading) {
    return <EmptyState title="Vehicles unavailable" description={error} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px' }}>My Vehicles</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>Register and manage your vehicles.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
        >
          Register vehicle
        </button>
      </div>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {success && <p style={{ color: '#166534' }}>{success}</p>}

      <div style={{ marginTop: 16 }}>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          onRowClick={openEdit}
          emptyTitle="No vehicles registered"
        />
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          style={{
            marginTop: 20,
            padding: 16,
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            display: 'grid',
            gap: 12,
            maxWidth: 480,
          }}
        >
          <h3 style={{ margin: 0 }}>{selected ? 'Edit vehicle' : 'Register vehicle'}</h3>
          {!selected && (
            <FormField
              label="Vehicle number *"
              value={form.vehicleNumber}
              onChange={(v) => setForm((s) => ({ ...s, vehicleNumber: v }))}
              required
            />
          )}
          <FormSelect
            label="Type"
            value={form.vehicleType}
            options={VEHICLE_TYPES.map((t) => ({ value: t, label: formatLabel(t) }))}
            onChange={(v) => setForm((s) => ({ ...s, vehicleType: v }))}
          />
          <FormField label="Make" value={form.make} onChange={(v) => setForm((s) => ({ ...s, make: v }))} />
          <FormField label="Model" value={form.model} onChange={(v) => setForm((s) => ({ ...s, model: v }))} />
          <FormField label="Color" value={form.color} onChange={(v) => setForm((s) => ({ ...s, color: v }))} />
          <FormSelect
            label="Primary"
            value={form.isPrimary}
            options={[
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ]}
            onChange={(v) => setForm((s) => ({ ...s, isPrimary: v }))}
          />
          {selected && (
            <FormSelect
              label="Status"
              value={form.status || 'active'}
              options={VEHICLE_STATUSES.map((s) => ({ value: s, label: formatLabel(s) }))}
              onChange={(v) => setForm((s) => ({ ...s, status: v }))}
            />
          )}
          <FormField
            textarea
            label="Notes"
            value={form.notes}
            onChange={(v) => setForm((s) => ({ ...s, notes: v }))}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={resetForm} disabled={saving} style={{ padding: '8px 12px', borderRadius: 8 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: '8px 12px', borderRadius: 8 }}>
              {saving ? 'Saving…' : selected ? 'Update' : 'Register'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
