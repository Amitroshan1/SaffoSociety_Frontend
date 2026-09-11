import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, Pencil } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  ConfirmDialog,
  DataTable,
  EmptyState,
  FormField,
  StatusBadge,
} from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import {
  AMENITY_STATUS_COLORS,
  BOOKING_STATUS_COLORS,
  addAmenityMaintenance,
  deleteAmenity,
  deleteAmenityMaintenance,
  formatAmount,
  formatAvailableDays,
  formatCategory,
  generateAmenitySlots,
  getAmenity,
  listAmenityMaintenance,
  listBookings,
} from '../../../services/facility.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const TABS = [
  { id: 'info', label: 'Info' },
  { id: 'slots', label: 'Slots' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'bookings', label: 'Bookings' },
];

export default function FacilityDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [amenity, setAmenity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('info');
  const [confirm, setConfirm] = useState(false);

  const [slotForm, setSlotForm] = useState({ startDate: '', endDate: '' });

  const [maintList, setMaintList] = useState([]);
  const [maintLoaded, setMaintLoaded] = useState(false);
  const [maintForm, setMaintForm] = useState({ startDate: '', endDate: '', reason: '' });

  const [bookingRows, setBookingRows] = useState([]);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getAmenity(id);
      setAmenity(data.data?.facility || data.data?.amenity || data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load facility');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMaintenance = useCallback(async () => {
    try {
      const { data } = await listAmenityMaintenance(id);
      setMaintList(data.data?.maintenanceBlocks || data.data?.blocks || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load maintenance blocks');
    } finally {
      setMaintLoaded(true);
    }
  }, [id]);

  const loadBookings = useCallback(async () => {
    try {
      const { data } = await listBookings({ amenityId: id, page: 1, pageSize: 50 });
      setBookingRows(data.data?.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setBookingsLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    if (tab === 'maintenance' && !maintLoaded) loadMaintenance();
    if (tab === 'bookings' && !bookingsLoaded) loadBookings();
  }, [tab, maintLoaded, bookingsLoaded, loadMaintenance, loadBookings]);

  const onGenerateSlots = async (e) => {
    e.preventDefault();
    if (!slotForm.startDate || !slotForm.endDate) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await generateAmenitySlots(id, slotForm);
      setSuccess('Slots generated');
      setSlotForm({ startDate: '', endDate: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate slots');
    } finally {
      setBusy(false);
    }
  };

  const onAddMaintenance = async (e) => {
    e.preventDefault();
    if (!maintForm.startDate || !maintForm.endDate || !maintForm.reason.trim()) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await addAmenityMaintenance(id, maintForm);
      setSuccess('Maintenance block added');
      setMaintForm({ startDate: '', endDate: '', reason: '' });
      setMaintLoaded(false);
      await loadMaintenance();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add maintenance block');
    } finally {
      setBusy(false);
    }
  };

  const onRemoveMaintenance = async (blockId) => {
    setBusy(true);
    setError('');
    try {
      await deleteAmenityMaintenance(blockId);
      setMaintLoaded(false);
      await loadMaintenance();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove maintenance block');
    } finally {
      setBusy(false);
    }
  };

  const onDisable = async () => {
    setBusy(true);
    setError('');
    try {
      await deleteAmenity(id);
      setSuccess('Facility disabled');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable facility');
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  if (loading) {
    return (
      <AppShell active="facilities" onChange={(navId) => ADMIN_ROUTES[navId] && navigate(ADMIN_ROUTES[navId])}>
        <p style={{ color: 'var(--t3)' }}>Loadingâ€¦</p>
      </AppShell>
    );
  }

  if (!amenity) {
    return (
      <AppShell active="facilities" onChange={(navId) => ADMIN_ROUTES[navId] && navigate(ADMIN_ROUTES[navId])}>
        <EmptyState title="Facility not found" description={error} />
      </AppShell>
    );
  }

  const bookingColumns = [
    { key: 'bookingNumber', label: 'Booking #' },
    { key: 'residentName', label: 'Resident', render: (r) => r.residentName || r.residentId || '-' },
    { key: 'bookingDate', label: 'Date' },
    { key: 'time', label: 'Time', render: (r) => `${r.startTime || ''}â€“${r.endTime || ''}` },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} colors={BOOKING_STATUS_COLORS} />,
    },
    { key: 'amount', label: 'Amount', render: (r) => formatAmount(r.amount) },
  ];

  return (
    <AppShell
      active="facilities"
      onChange={(navId) => ADMIN_ROUTES[navId] && navigate(ADMIN_ROUTES[navId])}
      breadcrumb={[{ label: 'Home' }, { label: 'Facilities' }, { label: amenity.name || 'Detail' }]}
    >
      <PageHeader
        icon={CalendarCheck}
        iconColor="#93c5fd"
        title={amenity.name}
        subtitle={`${formatCategory(amenity.category)} Â· ${amenity.location || 'No location set'}`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-primary"
              type="button"
              onClick={() => navigate(`/admin/facilities/${id}/edit`)}
            >
              <Pencil size={14} /> Edit
            </button>
            {amenity.isActive !== false && amenity.status !== 'disabled' && (
              <button
                className="crud-btn crud-btn-danger"
                type="button"
                onClick={() => setConfirm(true)}
              >
                Disable
              </button>
            )}
          </div>
        }
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <div style={{ marginBottom: 16 }}>
        <StatusBadge status={amenity.status} colors={AMENITY_STATUS_COLORS} />{' '}
        {amenity.isPaid && (
          <span className="crud-badge crud-badge-active" style={{ marginLeft: 6 }}>
            {formatAmount(amenity.pricePerSlot)} / slot
          </span>
        )}
      </div>

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`crud-btn ${tab === t.id ? 'crud-btn-primary' : 'crud-btn-ghost'}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
            <div>
              <strong>Capacity</strong>
              <p>{amenity.capacity}</p>
            </div>
            <div>
              <strong>Security deposit</strong>
              <p>{formatAmount(amenity.securityDeposit)}</p>
            </div>
            <div>
              <strong>Slot duration</strong>
              <p>{amenity.slotDurationMinutes} minutes</p>
            </div>
            <div>
              <strong>Advance booking window</strong>
              <p>{amenity.advanceBookingDays} days</p>
            </div>
            <div>
              <strong>Cancellation notice</strong>
              <p>{amenity.cancellationHours} hours</p>
            </div>
            <div>
              <strong>Max bookings / resident</strong>
              <p>{amenity.maxBookingsPerResident ?? 'Unlimited'}</p>
            </div>
            <div>
              <strong>Requires approval</strong>
              <p>{amenity.requiresApproval ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <strong>Operating hours</strong>
              <p>
                {amenity.operatingHoursStart || '-'} â€“ {amenity.operatingHoursEnd || '-'}
              </p>
            </div>
            <div>
              <strong>Available days</strong>
              <p>{formatAvailableDays(amenity.availableDays)}</p>
            </div>
            {amenity.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Description</strong>
                <p>{amenity.description}</p>
              </div>
            )}
            {amenity.rulesText && (
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Rules</strong>
                <p style={{ whiteSpace: 'pre-wrap' }}>{amenity.rulesText}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'slots' && (
          <div>
            <p style={{ color: 'var(--t3)', fontSize: 13 }}>
              Generate bookable slots for a date range based on operating hours and slot duration.
            </p>
            <form onSubmit={onGenerateSlots} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <FormField
                label="Start date"
                type="date"
                value={slotForm.startDate}
                onChange={(v) => setSlotForm((s) => ({ ...s, startDate: v }))}
              />
              <FormField
                label="End date"
                type="date"
                value={slotForm.endDate}
                onChange={(v) => setSlotForm((s) => ({ ...s, endDate: v }))}
              />
              <button className="btn-primary" type="submit" disabled={busy}>
                Generate slots
              </button>
            </form>
          </div>
        )}

        {tab === 'maintenance' && (
          <div>
            {maintList.length ? (
              <ul style={{ margin: '0 0 16px', paddingLeft: 0, listStyle: 'none' }}>
                {maintList.map((m) => (
                  <li
                    key={m.id}
                    style={{
                      borderLeft: '2px solid var(--border-soft)',
                      paddingLeft: 14,
                      marginBottom: 14,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {m.startDate} â†’ {m.endDate}
                      </div>
                      <div style={{ color: 'var(--t3)', fontSize: 13 }}>{m.reason}</div>
                    </div>
                    <button
                      type="button"
                      className="crud-btn crud-btn-ghost"
                      disabled={busy}
                      onClick={() => onRemoveMaintenance(m.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No maintenance blocks" description="this facility has no scheduled downtime." />
            )}

            <form onSubmit={onAddMaintenance} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <FormField
                label="Start date"
                type="date"
                value={maintForm.startDate}
                onChange={(v) => setMaintForm((s) => ({ ...s, startDate: v }))}
              />
              <FormField
                label="End date"
                type="date"
                value={maintForm.endDate}
                onChange={(v) => setMaintForm((s) => ({ ...s, endDate: v }))}
              />
              <FormField
                label="Reason"
                value={maintForm.reason}
                onChange={(v) => setMaintForm((s) => ({ ...s, reason: v }))}
              />
              <button className="btn-primary" type="submit" disabled={busy}>
                Add block
              </button>
            </form>
          </div>
        )}

        {tab === 'bookings' && (
          <DataTable
            columns={bookingColumns}
            rows={bookingRows}
            loading={!bookingsLoaded}
            onRowClick={(row) => navigate(`/admin/bookings/${row.id}`)}
            emptyTitle="No bookings for this facility"
          />
        )}
      </section>

      <ConfirmDialog
        open={confirm}
        title="Disable this facility?"
        message="Residents will no longer be able to book this facility."
        confirmLabel="Disable"
        variant="danger"
        loading={busy}
        onConfirm={onDisable}
        onCancel={() => setConfirm(false)}
      />
    </AppShell>
  );
}
