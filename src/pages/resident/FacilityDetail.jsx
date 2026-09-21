import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EmptyState from '@/components/common/EmptyState';
import FormField from '@/components/common/FormField';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import {
  createResidentBooking,
  formatAmount,
  formatAvailableDays,
  formatCategory,
  getResidentAmenity,
} from '@/services/facility.service';

const initialForm = {
  bookingDate: '',
  startTime: '',
  endTime: '',
  guestCount: '1',
  purpose: '',
};

export default function ResidentFacilityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [amenity, setAmenity] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getResidentAmenity(id);
      setAmenity(data.data?.facility || data.data?.amenity || data.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load facility');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key) => (value) => setForm((s) => ({ ...s, [key]: value }));

  const onBook = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await createResidentBooking({
        amenityId: id,
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        guestCount: Number(form.guestCount) || 1,
        purpose: form.purpose.trim() || null,
      });
      const booking = data.data?.booking || data.data;
      setSuccess('Booking request submitted');
      navigate(`/resident/bookings/${booking.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonLoader rows={6} />;
  if (error && !amenity) return <EmptyState title="Facility unavailable" description={error} />;
  if (!amenity) return <EmptyState title="Facility not found" />;

  return (
    <div>
      <p style={{ margin: '0 0 8px' }}>
        <Link to="/resident/facilities">â† Back to facilities</Link>
      </p>
      <h1 style={{ margin: '0 0 4px' }}>{amenity.name}</h1>
      <p style={{ margin: '0 0 16px', color: '#6b7280' }}>
        {formatCategory(amenity.category)} Â· {amenity.location || 'No location'}
      </p>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {success && <p style={{ color: '#166534' }}>{success}</p>}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          <div>
            <strong>Price</strong>
            <p style={{ margin: '4px 0 0' }}>{amenity.isPaid ? formatAmount(amenity.pricePerSlot) : 'Free'}</p>
          </div>
          <div>
            <strong>Capacity</strong>
            <p style={{ margin: '4px 0 0' }}>{amenity.capacity || '-'}</p>
          </div>
          <div>
            <strong>Operating hours</strong>
            <p style={{ margin: '4px 0 0' }}>
              {amenity.operatingHoursStart || '-'} - {amenity.operatingHoursEnd || '-'}
            </p>
          </div>
          <div>
            <strong>Available days</strong>
            <p style={{ margin: '4px 0 0' }}>{formatAvailableDays(amenity.availableDays)}</p>
          </div>
          <div>
            <strong>Cancellation policy</strong>
            <p style={{ margin: '4px 0 0' }}>{amenity.cancellationHours ?? 0} hours notice</p>
          </div>
          <div>
            <strong>Approval required</strong>
            <p style={{ margin: '4px 0 0' }}>{amenity.requiresApproval ? 'Yes' : 'No'}</p>
          </div>
        </div>
        {amenity.description && <p style={{ marginTop: 12 }}>{amenity.description}</p>}
      </div>

      <form onSubmit={onBook} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Book this facility</h3>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
          <FormField label="Booking date" type="date" value={form.bookingDate} onChange={setField('bookingDate')} required />
          <FormField label="Start time" type="time" value={form.startTime} onChange={setField('startTime')} required />
          <FormField label="End time" type="time" value={form.endTime} onChange={setField('endTime')} required />
          <FormField label="Guest count" type="number" value={form.guestCount} onChange={setField('guestCount')} />
          <FormField textarea label="Purpose" value={form.purpose} onChange={setField('purpose')} />
        </div>
        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: 12,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {saving ? 'Submittingâ€¦' : 'Book Now'}
        </button>
      </form>
    </div>
  );
}
