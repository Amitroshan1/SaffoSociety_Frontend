import { useCallback, useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import { EmptyState, StatusBadge } from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import {
  BOOKING_STATUS_COLORS,
  approveBooking,
  formatAmount,
  getBooking,
  rejectBooking,
} from '../../../services/facility.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

export default function BookingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getBooking(id);
      setBooking(data.data?.booking || data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onApprove = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await approveBooking(id);
      setSuccess('Booking approved');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve booking');
    } finally {
      setBusy(false);
    }
  };

  const onReject = async () => {
    const reason = window.prompt('Reason for rejection:');
    if (reason === null) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await rejectBooking(id, reason);
      setSuccess('Booking rejected');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject booking');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppShell active="bookings" onChange={(navId) => ADMIN_ROUTES[navId] && navigate(ADMIN_ROUTES[navId])}>
        <p style={{ color: 'var(--t3)' }}>Loadingâ€¦</p>
      </AppShell>
    );
  }

  if (!booking) {
    return (
      <AppShell active="bookings" onChange={(navId) => ADMIN_ROUTES[navId] && navigate(ADMIN_ROUTES[navId])}>
        <EmptyState title="Booking not found" description={error} />
      </AppShell>
    );
  }

  const timeline = [
    booking.createdAt && { label: 'Created', at: booking.createdAt },
    booking.approvedAt && { label: 'Approved', at: booking.approvedAt },
    booking.rejectedReason && { label: 'Rejected', at: booking.updatedAt, note: booking.rejectedReason },
    booking.checkedInAt && { label: 'Checked in', at: booking.checkedInAt },
    booking.checkedOutAt && { label: 'Checked out', at: booking.checkedOutAt },
    booking.completedAt && { label: 'Completed', at: booking.completedAt },
    booking.cancelledAt && { label: 'Cancelled', at: booking.cancelledAt, note: booking.cancellationReason },
  ].filter(Boolean);

  return (
    <AppShell
      active="bookings"
      onChange={(navId) => ADMIN_ROUTES[navId] && navigate(ADMIN_ROUTES[navId])}
      breadcrumb={[{ label: 'Home' }, { label: 'Bookings' }, { label: booking.bookingNumber || 'Detail' }]}
    >
      <PageHeader
        icon={ClipboardList}
        iconColor="#93c5fd"
        title={`Booking ${booking.bookingNumber || ''}`}
        subtitle={`${booking.amenityName || ''} Â· ${booking.bookingDate || ''}`}
        action={
          booking.status === 'pending' ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" type="button" disabled={busy} onClick={onApprove}>
                Approve
              </button>
              <button className="crud-btn crud-btn-danger" type="button" disabled={busy} onClick={onReject}>
                Reject
              </button>
            </div>
          ) : null
        }
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <div style={{ marginBottom: 16 }}>
        <StatusBadge status={booking.status} colors={BOOKING_STATUS_COLORS} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
            <div>
              <strong>Booking code</strong>
              <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>{booking.bookingCode || '-'}</p>
            </div>
            <div>
              <strong>Resident</strong>
              <p>{booking.residentName || booking.residentId || '-'}</p>
            </div>
            <div>
              <strong>Facility</strong>
              <p>{booking.amenityName || '-'}</p>
            </div>
            <div>
              <strong>Date</strong>
              <p>{booking.bookingDate || '-'}</p>
            </div>
            <div>
              <strong>Time</strong>
              <p>
                {booking.startTime || '-'} â€“ {booking.endTime || '-'}
              </p>
            </div>
            <div>
              <strong>Guest count</strong>
              <p>{booking.guestCount ?? 0}</p>
            </div>
            <div>
              <strong>Purpose</strong>
              <p>{booking.purpose || '-'}</p>
            </div>
            <div>
              <strong>Amount</strong>
              <p>{formatAmount(booking.amount)}</p>
            </div>
            <div>
              <strong>Security deposit</strong>
              <p>{formatAmount(booking.securityDeposit)}</p>
            </div>
            <div>
              <strong>Payment status</strong>
              <p>{booking.paymentStatus || '-'}</p>
            </div>
            <div>
              <strong>Checked in</strong>
              <p>{booking.checkedInAt || '-'}</p>
            </div>
            <div>
              <strong>Checked out</strong>
              <p>{booking.checkedOutAt || '-'}</p>
            </div>
          </div>
        </section>

        <section className="glass-card" style={{ padding: 20, borderRadius: 16, height: 'fit-content' }}>
          <h3 style={{ marginTop: 0 }}>Timeline</h3>
          {timeline.length ? (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {timeline.map((t, idx) => (
                <li
                  key={idx}
                  style={{ borderLeft: '2px solid var(--border-soft)', paddingLeft: 12, marginBottom: 12 }}
                >
                  <div style={{ fontWeight: 600 }}>{t.label}</div>
                  <div style={{ color: 'var(--t3)', fontSize: 13 }}>{t.at || ''}</div>
                  {t.note && <div style={{ fontSize: 13, marginTop: 4 }}>{t.note}</div>}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--t3)' }}>No activity yet.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
