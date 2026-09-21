import { useEffect, useState } from 'react';
import { Car, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import { EmptyState, SkeletonLoader } from '@/components/common/index.js';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import { formatFee, getParkingDashboard } from '@/services/parking.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const LINKS = [
  { id: 'parking-zones', label: 'Zones' },
  { id: 'parking-slots', label: 'Slots' },
  { id: 'parking-vehicles', label: 'Vehicles' },
  { id: 'parking-allocations', label: 'Allocations' },
  { id: 'parking-visitor', label: 'Visitor parking' },
];

export default function ParkingDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getParkingDashboard()
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

  const recentAllocations = stats?.recentAllocations || [];
  const occupancyByZone = stats?.occupancyByZone || stats?.zones || [];

  return (
    <AppShell active="parking" breadcrumb={[{ label: 'Home' }, { label: 'Parking' }]}>
      <PageHeader
        icon={Car}
        iconColor="#93c5fd"
        title="Parking Dashboard"
        subtitle="Occupancy, allocations, visitor parking, and revenue at a glance."
        action={
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate(ADMIN_ROUTES['parking-allocations'])}
          >
            <Plus size={14} /> Allocate slot
          </button>
        }
      />

      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {loading && <SkeletonLoader rows={4} />}

      {!loading && stats && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div className="crud-stat-card">Total slots: {stats.totalSlots ?? 0}</div>
            <div className="crud-stat-card">Available: {stats.availableSlots ?? 0}</div>
            <div className="crud-stat-card">Allocated: {stats.allocatedSlots ?? 0}</div>
            <div className="crud-stat-card">Occupied: {stats.occupiedSlots ?? 0}</div>
            <div className="crud-stat-card">Visitor today: {stats.visitorToday ?? stats.todayVisitorCount ?? 0}</div>
            <div className="crud-stat-card">Vehicles: {stats.totalVehicles ?? 0}</div>
            <div className="crud-stat-card">
              Monthly revenue: {formatFee(stats.monthlyRevenue ?? stats.monthRevenue ?? 0)}
            </div>
            <div className="crud-stat-card">Zones: {stats.totalZones ?? 0}</div>
          </div>

          <section className="glass-card" style={{ padding: 12, borderRadius: 16, marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'nowrap',
                gap: 8,
                alignItems: 'center',
                overflowX: 'auto',
              }}
            >
              {LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className="btn-primary crud-btn-sm"
                  style={{ flex: '1 1 0', justifyContent: 'center', minWidth: 0 }}
                  onClick={() => ADMIN_ROUTES[link.id] && navigate(ADMIN_ROUTES[link.id])}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
            <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
              <h3 style={{ marginTop: 0 }}>Occupancy by zone</h3>
              {occupancyByZone.length ? (
                <div className="crud-table-wrap">
                  <table className="crud-table">
                    <thead>
                      <tr>
                        <th>Zone</th>
                        <th>Total</th>
                        <th>Available</th>
                        <th>Allocated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {occupancyByZone.map((z, idx) => (
                        <tr key={z.id || z.zoneId || idx}>
                          <td>{z.name || z.zoneName || '-'}</td>
                          <td>{z.totalSlots ?? z.total ?? 0}</td>
                          <td>{z.availableSlots ?? z.available ?? 0}</td>
                          <td>{z.allocatedSlots ?? z.allocated ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No zone data yet" />
              )}
            </section>

            <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
              <h3 style={{ marginTop: 0 }}>Recent allocations</h3>
              {recentAllocations.length ? (
                <div className="crud-table-wrap">
                  <table className="crud-table">
                    <thead>
                      <tr>
                        <th>Allocation #</th>
                        <th>Slot</th>
                        <th>Resident</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAllocations.map((a, idx) => (
                        <tr key={a.id || idx}>
                          <td>{a.allocationNumber || '-'}</td>
                          <td>{a.slotCode || a.slotLabel || '-'}</td>
                          <td>{a.residentName || '-'}</td>
                          <td>{a.status || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No recent allocations" />
              )}
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}
