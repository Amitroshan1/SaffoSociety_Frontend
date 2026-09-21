import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EmptyState from '@/components/common/EmptyState';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import StatusBadge from '@/components/common/StatusBadge';
import {
  BOOKING_STATUS_COLORS,
  cancelResidentBooking,
  formatAmount,
  getResidentBooking,
  getResidentBookingReceipt,
} from '@/services/facility.service';

export default function ResidentBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bookingRes, receiptRes] = await Promise.all([
        getResidentBooking(id),
        getResidentBookingReceipt(id).catch(() => ({ data: { data: null } })),
      ]);
      setBooking(bookingRes.data?.data?.booking || bookingRes.data?.data || null);
      setReceipt(receiptRes.data?.data?.receipt || receiptRes.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onCancel = async () => {
    const reason = window.prompt('Reason for cancellation:');
    if (reason === null) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await cancelResidentBooking(id, reason);
      setSuccess('Booking cancelled');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <SkeletonLoader rows={6} />;
  if (error && !booking) return <EmptyState title="Booking unavailable" description={error} />;
  if (!booking) return <EmptyState title="Booking not found" />;

  return (
    <div>
      <p style={{ margin: '0 0 8px' }}>
        <Link to="/resident/bookings">â† Back to my bookings</Link>
      </p>
      <h1 style={{ margin: '0 0 4px' }}>Booking {booking.bookingNumber || ''}</h1>
      <p style={{ margin: '0 0 16px', color: '#6b7280' }}>{booking.amenityName || 'Facility booking detail'}</p>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {success && <p style={{ color: '#166534' }}>{success}</p>}

      <div style={{ marginBottom: 16 }}>
        <StatusBadge status={booking.status} colors={BOOKING_STATUS_COLORS} />
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          <div>
            <strong>Booking code</strong>
            <p style={{ margin: '4px 0 0' }}>{booking.bookingCode || '-'}</p>
          </div>
          <div>
            <strong>Date</strong>
            <p style={{ margin: '4px 0 0' }}>{booking.bookingDate || '-'}</p>
          </div>
          <div>
            <strong>Time</strong>
            <p style={{ margin: '4px 0 0' }}>
              {booking.startTime || '-'} - {booking.endTime || '-'}
            </p>
          </div>
          <div>
            <strong>Amount</strong>
            <p style={{ margin: '4px 0 0' }}>{formatAmount(booking.amount)}</p>
          </div>
          <div>
            <strong>Payment status</strong>
            <p style={{ margin: '4px 0 0' }}>{booking.paymentStatus || '-'}</p>
          </div>
          <div>
            <strong>Guests</strong>
            <p style={{ margin: '4px 0 0' }}>{booking.guestCount ?? 0}</p>
          </div>
        </div>
      </div>

      {receipt && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Receipt</h3>
          <p style={{ margin: '4px 0' }}>
            Receipt no: <strong>{receipt.receiptNumber || '-'}</strong>
          </p>
          <p style={{ margin: '4px 0' }}>
            Paid amount: <strong>{formatAmount(receipt.amount || booking.amount)}</strong>
          </p>
          <p style={{ margin: '4px 0' }}>Generated at: {receipt.generatedAt || receipt.createdAt || '-'}</p>
        </div>
      )}

      {['pending', 'approved', 'confirmed'].includes(booking.status) && (
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #fecaca', color: '#b91c1c' }}
        >
          {busy ? 'Cancellingâ€¦' : 'Cancel booking'}
        </button>
      )}

      <p style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={() => navigate('/resident/facilities')}
          style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', padding: 0 }}
        >
          Book another facility
        </button>
      </p>
    </div>
  );
}
