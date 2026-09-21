import { useEffect, useState } from 'react';
import { CalendarCheck, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import { EmptyState, SkeletonLoader } from '@/components/common/index.js';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import {
  formatAmount,
  formatCategory,
  getAmenitiesDashboard,
} from '@/services/facility.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

export default function FacilitiesDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getAmenitiesDashboard()
      .then((r) => {
        if (mounted) setStats(r.data?.data || null);
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.message || 'Failed to load dashboard');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const popularAmenities = stats?.popularAmenities || stats?.popular || [];
  const recentBookings = stats?.recentBookings || stats?.todaysBookings || [];

  return (
    <AppShell
      active="facilities"
      onChange={(id) => ADMIN_ROUTES[id] && navigate(ADMIN_ROUTES[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Facilities' }]}
    >
      <PageHeader
        icon={CalendarCheck}
        iconColor="#93c5fd"
        title="Facilities Dashboard"
        subtitle="Booking activity, revenue, and utilization across society facilities."
      />

      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {loading && <SkeletonLoader rows={4} />}

      {!loading && stats && (
        <>
          <div
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              gap: 12,
              marginBottom: 16,
              alignItems: 'stretch',
              overflowX: 'auto',
            }}
          >
            <div className="crud-stat-card" style={{ flex: '1 1 0', minWidth: 120 }}>
              Total facilities: {stats.totalAmenities ?? 0}
            </div>
            <div className="crud-stat-card" style={{ flex: '1 1 0', minWidth: 120 }}>
              Active: {stats.activeAmenities ?? 0}
            </div>
            <div className="crud-stat-card" style={{ flex: '1 1 0', minWidth: 120 }}>
              Today's bookings: {stats.todayBookings ?? stats.todaysBookingsCount ?? 0}
            </div>
            <div className="crud-stat-card" style={{ flex: '1 1 0', minWidth: 120 }}>
              Pending approvals: {stats.pendingApprovals ?? 0}
            </div>
            <div className="crud-stat-card" style={{ flex: '1 1 0', minWidth: 120 }}>
              Monthly revenue: {formatAmount(stats.monthlyRevenue ?? stats.monthRevenue ?? 0)}
            </div>
            <div className="crud-stat-card" style={{ flex: '1 1 0', minWidth: 120 }}>
              Total bookings: {stats.totalBookings ?? 0}
            </div>
            <div
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <button
                className="btn-primary crud-btn-sm"
                type="button"
                onClick={() => navigate(ADMIN_ROUTES['facilities-new'])}
              >
                <Plus size={13} strokeWidth={2.5} /> New facility
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
            <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
              <h3 style={{ marginTop: 0 }}>Popular facilities</h3>
              {popularAmenities.length ? (
                <div className="crud-table-wrap">
                  <table className="crud-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Bookings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {popularAmenities.map((a, idx) => (
                        <tr
                          key={a.id || a.amenityId || idx}
                          style={{ cursor: a.id ? 'pointer' : 'default' }}
                          onClick={() => a.id && navigate(`/admin/facilities/${a.id}`)}
                        >
                          <td>{a.name || a.amenityName || '-'}</td>
                          <td>{formatCategory(a.category)}</td>
                          <td>{a.bookingCount ?? a.bookings ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No booking data yet" />
              )}
            </section>

            <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
              <h3 style={{ marginTop: 0 }}>Today's bookings</h3>
              {recentBookings.length ? (
                <div className="crud-table-wrap">
                  <table className="crud-table">
                    <thead>
                      <tr>
                        <th>Booking #</th>
                        <th>Facility</th>
                        <th>Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((b, idx) => (
                        <tr
                          key={b.id || idx}
                          style={{ cursor: b.id ? 'pointer' : 'default' }}
                          onClick={() => b.id && navigate(`/admin/bookings/${b.id}`)}
                        >
                          <td>{b.bookingNumber || '-'}</td>
                          <td>{b.amenityName || '-'}</td>
                          <td>{b.startTime ? `${b.startTime}â€“${b.endTime || ''}` : '-'}</td>
                          <td>{b.status || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No bookings today" />
              )}
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}
