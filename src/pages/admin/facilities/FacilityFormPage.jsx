import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import { FormField, FormLayout, FormSelect } from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import {
  AMENITY_CATEGORIES,
  WEEK_DAYS,
  createAmenity,
  formatCategory,
  getAmenity,
  updateAmenity,
} from '../../../services/facility.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const initialForm = {
  name: '',
  description: '',
  category: 'clubhouse',
  location: '',
  capacity: '1',
  isPaid: 'false',
  pricePerSlot: '',
  securityDeposit: '',
  slotDurationMinutes: '60',
  advanceBookingDays: '30',
  cancellationHours: '24',
  maxBookingsPerResident: '2',
  requiresApproval: 'false',
  operatingHoursStart: '06:00',
  operatingHoursEnd: '22:00',
  availableDays: ['0', '1', '2', '3', '4', '5', '6'],
  rulesText: '',
  imageUrl: '',
};

export default function FacilityFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [amenity, setAmenity] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const setField = (key) => (v) => setForm((s) => ({ ...s, [key]: v }));

  const toggleDay = (day) => {
    setForm((s) => {
      const has = s.availableDays.includes(day);
      const next = has ? s.availableDays.filter((d) => d !== day) : [...s.availableDays, day];
      next.sort();
      return { ...s, availableDays: next };
    });
  };

  const loadAmenity = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await getAmenity(id);
      const a = data.data?.facility || data.data?.amenity || data.data;
      setAmenity(a);
      setForm({
        name: a.name || '',
        description: a.description || '',
        category: a.category || 'clubhouse',
        location: a.location || '',
        capacity: a.capacity != null ? String(a.capacity) : '1',
        isPaid: a.isPaid ? 'true' : 'false',
        pricePerSlot: a.pricePerSlot != null ? String(a.pricePerSlot) : '',
        securityDeposit: a.securityDeposit != null ? String(a.securityDeposit) : '',
        slotDurationMinutes: a.slotDurationMinutes != null ? String(a.slotDurationMinutes) : '60',
        advanceBookingDays: a.advanceBookingDays != null ? String(a.advanceBookingDays) : '30',
        cancellationHours: a.cancellationHours != null ? String(a.cancellationHours) : '24',
        maxBookingsPerResident:
          a.maxBookingsPerResident != null ? String(a.maxBookingsPerResident) : '',
        requiresApproval: a.requiresApproval ? 'true' : 'false',
        operatingHoursStart: a.operatingHoursStart || '06:00',
        operatingHoursEnd: a.operatingHoursEnd || '22:00',
        availableDays: a.availableDays ? String(a.availableDays).split('') : ['0', '1', '2', '3', '4', '5', '6'],
        rulesText: a.rulesText || '',
        imageUrl: a.imageUrl || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load facility');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    loadAmenity();
  }, [loadAmenity]);

  const buildPayload = () => ({
    name: form.name.trim(),
    description: form.description.trim() || null,
    category: form.category,
    location: form.location.trim() || null,
    capacity: Number(form.capacity) || 1,
    isPaid: form.isPaid === 'true',
    pricePerSlot: form.isPaid === 'true' ? Number(form.pricePerSlot) || 0 : 0,
    securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : 0,
    slotDurationMinutes: Number(form.slotDurationMinutes) || 60,
    advanceBookingDays: Number(form.advanceBookingDays) || 30,
    cancellationHours: Number(form.cancellationHours) || 24,
    maxBookingsPerResident: form.maxBookingsPerResident ? Number(form.maxBookingsPerResident) : null,
    requiresApproval: form.requiresApproval === 'true',
    operatingHoursStart: form.operatingHoursStart || null,
    operatingHoursEnd: form.operatingHoursEnd || null,
    availableDays: form.availableDays.slice().sort().join(''),
    rulesText: form.rulesText.trim() || null,
    imageUrl: form.imageUrl.trim() || null,
  });

  const onSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (isEdit) {
        await updateAmenity(id, buildPayload());
        setSuccess('Facility saved');
        await loadAmenity();
      } else {
        const { data } = await createAmenity(buildPayload());
        const created = data.data?.facility || data.data?.amenity || data.data;
        setSuccess('Facility created');
        navigate(`/admin/facilities/${created.id}`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      active="facilities"
      onChange={(navId) => ADMIN_ROUTES[navId] && navigate(ADMIN_ROUTES[navId])}
      breadcrumb={[{ label: 'Home' }, { label: 'Facilities' }, { label: isEdit ? 'Edit' : 'New' }]}
    >
      <PageHeader
        icon={CalendarCheck}
        iconColor="#93c5fd"
        title={isEdit ? `Edit facility${amenity ? `: ${amenity.name}` : ''}` : 'New facility'}
        subtitle="Configure pricing, scheduling, and booking rules for this facility."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      {loading ? (
        <p style={{ color: 'var(--t3)' }}>Loadingâ€¦</p>
      ) : (
        <form onSubmit={onSave}>
          <FormLayout
            sections={[
              {
                title: 'Info',
                content: (
                  <>
                    <FormField label="Name *" value={form.name} onChange={setField('name')} required />
                    <FormSelect
                      label="Category"
                      value={form.category}
                      options={AMENITY_CATEGORIES.map((c) => ({ value: c, label: formatCategory(c) }))}
                      onChange={setField('category')}
                    />
                    <FormField label="Location" value={form.location} onChange={setField('location')} />
                    <FormField
                      label="Capacity"
                      type="number"
                      value={form.capacity}
                      onChange={setField('capacity')}
                    />
                    <FormField
                      textarea
                      label="Description"
                      value={form.description}
                      onChange={setField('description')}
                    />
                    <FormField label="Image URL" value={form.imageUrl} onChange={setField('imageUrl')} />
                  </>
                ),
              },
              {
                title: 'Pricing',
                content: (
                  <>
                    <FormSelect
                      label="Is paid"
                      value={form.isPaid}
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No (free)' },
                      ]}
                      onChange={setField('isPaid')}
                    />
                    {form.isPaid === 'true' && (
                      <FormField
                        label="Price per slot (â‚¹)"
                        type="number"
                        value={form.pricePerSlot}
                        onChange={setField('pricePerSlot')}
                      />
                    )}
                    <FormField
                      label="Security deposit (â‚¹)"
                      type="number"
                      value={form.securityDeposit}
                      onChange={setField('securityDeposit')}
                    />
                  </>
                ),
              },
              {
                title: 'Scheduling',
                content: (
                  <>
                    <FormField
                      label="Slot duration (minutes)"
                      type="number"
                      value={form.slotDurationMinutes}
                      onChange={setField('slotDurationMinutes')}
                    />
                    <FormField
                      label="Advance booking window (days)"
                      type="number"
                      value={form.advanceBookingDays}
                      onChange={setField('advanceBookingDays')}
                    />
                    <FormField
                      label="Cancellation notice (hours)"
                      type="number"
                      value={form.cancellationHours}
                      onChange={setField('cancellationHours')}
                    />
                    <FormField
                      label="Max bookings per resident"
                      type="number"
                      value={form.maxBookingsPerResident}
                      onChange={setField('maxBookingsPerResident')}
                    />
                    <FormField
                      label="Operating hours start"
                      type="time"
                      value={form.operatingHoursStart}
                      onChange={setField('operatingHoursStart')}
                    />
                    <FormField
                      label="Operating hours end"
                      type="time"
                      value={form.operatingHoursEnd}
                      onChange={setField('operatingHoursEnd')}
                    />
                  </>
                ),
              },
              {
                title: 'Approval & availability',
                content: (
                  <>
                    <FormSelect
                      label="Requires approval"
                      value={form.requiresApproval}
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No (auto-confirm)' },
                      ]}
                      onChange={setField('requiresApproval')}
                    />
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ opacity: 0.8, display: 'block', marginBottom: 6, fontSize: 13 }}>
                        Available days
                      </span>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {WEEK_DAYS.map((d) => (
                          <label
                            key={d.value}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                          >
                            <input
                              type="checkbox"
                              checked={form.availableDays.includes(d.value)}
                              onChange={() => toggleDay(d.value)}
                            />
                            {d.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <FormField
                      textarea
                      label="Rules text"
                      value={form.rulesText}
                      onChange={setField('rulesText')}
                    />
                  </>
                ),
              },
            ]}
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              <Save size={14} /> {saving ? 'Savingâ€¦' : isEdit ? 'Save changes' : 'Create facility'}
            </button>
          </div>
        </form>
      )}
    </AppShell>
  );
}
