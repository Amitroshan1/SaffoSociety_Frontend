import { useState } from 'react';
import FormField from '../../components/common/FormField';
import FormSelect from '../../components/common/FormSelect';
import {
  VEHICLE_TYPES,
  createResidentVisitorParking,
  formatLabel,
} from '../../services/parking.service';

export default function VisitorParkingRequest() {
  const [form, setForm] = useState({
    vehicleNumber: '',
    vehicleType: 'car',
    purpose: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    setResult(null);
    try {
      const res = await createResidentVisitorParking({
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        vehicleType: form.vehicleType,
        purpose: form.purpose.trim() || null,
        notes: form.notes.trim() || null,
      });
      setResult(res.data?.data || null);
      setSuccess('Visitor parking requested');
      setForm({ vehicleNumber: '', vehicleType: 'car', purpose: '', notes: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 4px' }}>Visitor Parking</h1>
      <p className="resident-page-subtitle">
        Request temporary parking for a guest vehicle.
      </p>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {success && <p style={{ color: '#166534' }}>{success}</p>}
      {result?.parkingCode && (
        <p style={{ color: '#166534' }}>
          Parking code: <strong>{result.parkingCode}</strong>
          {result.slotCode ? ` · Slot ${result.slotCode}` : ''}
        </p>
      )}

      <form
        onSubmit={onSubmit}
        style={{
          display: 'grid',
          gap: 12,
          maxWidth: 480,
          padding: 16,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
        }}
      >
        <FormField
          label="Vehicle number *"
          value={form.vehicleNumber}
          onChange={(v) => setForm((s) => ({ ...s, vehicleNumber: v }))}
          required
        />
        <FormSelect
          label="Vehicle type"
          value={form.vehicleType}
          options={VEHICLE_TYPES.map((t) => ({ value: t, label: formatLabel(t) }))}
          onChange={(v) => setForm((s) => ({ ...s, vehicleType: v }))}
        />
        <FormField
          label="Purpose"
          value={form.purpose}
          onChange={(v) => setForm((s) => ({ ...s, purpose: v }))}
        />
        <FormField
          textarea
          label="Notes"
          value={form.notes}
          onChange={(v) => setForm((s) => ({ ...s, notes: v }))}
        />
        <button type="submit" disabled={saving} style={{ padding: '10px 14px', borderRadius: 8 }}>
          {saving ? 'Submitting…' : 'Request visitor parking'}
        </button>
      </form>
    </div>
  );
}
