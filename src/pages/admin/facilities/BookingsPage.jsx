import { useCallback, useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  DataTable,
  FilterBar,
  FormField,
  Pagination,
  SearchInput,
  StatusBadge,
} from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_COLORS,
  approveBooking,
  formatAmount,
  listAmenities,
  listBookings,
  rejectBooking,
} from '../../../services/facility.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

export default function BookingsPage() {
  const navigate = useNavigate();
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    listAmenities({ pageSize: 100 })
      .then((r) => setAmenities(r.data?.data?.facilities || r.data?.data?.amenities || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const finalParams = { ...params };
      if (state.status) finalParams.status = state.status;
      if (state.amenityId) finalParams.amenityId = state.amenityId;
      if (from) finalParams.from = from;
      if (to) finalParams.to = to;
      const { data } = await listBookings(finalParams);
      setRows(data.data?.bookings || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.status, state.amenityId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const onApprove = async (row, e) => {
    e.stopPropagation();
    setBusyId(row.id);
    setError('');
    setSuccess('');
    try {
      await approveBooking(row.id);
      setSuccess(`Booking ${row.bookingNumber || ''} approved`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve booking');
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (row, e) => {
    e.stopPropagation();
    const reason = window.prompt('Reason for rejection:');
    if (reason === null) return;
    setBusyId(row.id);
    setError('');
    setSuccess('');
    try {
      await rejectBooking(row.id, reason);
      setSuccess(`Booking ${row.bookingNumber || ''} rejected`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject booking');
    } finally {
      setBusyId(null);
    }
  };

  const COLUMNS = [
    { key: 'bookingNumber', label: 'Booking #' },
    { key: 'amenityName', label: 'Facility', render: (r) => r.amenityName || '-' },
    { key: 'residentName', label: 'Resident', render: (r) => r.residentName || '-' },
    { key: 'bookingDate', label: 'Date', sortable: true },
    { key: 'time', label: 'Time', render: (r) => `${r.startTime || ''}â€“${r.endTime || ''}` },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} colors={BOOKING_STATUS_COLORS} />,
    },
    { key: 'amount', label: 'Amount', render: (r) => formatAmount(r.amount) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status === 'pending' ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="crud-btn crud-btn-primary"
              disabled={busyId === r.id}
              onClick={(e) => onApprove(r, e)}
            >
              Approve
            </button>
            <button
              type="button"
              className="crud-btn crud-btn-danger"
              disabled={busyId === r.id}
              onClick={(e) => onReject(r, e)}
            >
              Reject
            </button>
          </div>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <AppShell
      active="bookings"
      onChange={(id) => ADMIN_ROUTES[id] && navigate(ADMIN_ROUTES[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Bookings' }]}
    >
      <PageHeader
        icon={ClipboardList}
        iconColor="#93c5fd"
        title="Facility Bookings"
        subtitle="Review, approve, and reject Facility booking requests."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search bookings" />
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: BOOKING_STATUSES.map((s) => ({ value: s, label: s })),
              },
              {
                key: 'amenityId',
                label: 'Facility',
                options: amenities.map((a) => ({ value: a.id, label: a.name })),
              },
            ]}
            values={state}
            onChange={setFilter}
          />
          <FormField label="From" type="date" value={from} onChange={setFrom} />
          <FormField label="To" type="date" value={to} onChange={setTo} />
        </div>

        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`/admin/bookings/${row.id}`)}
          emptyTitle="No bookings found"
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
    </AppShell>
  );
}
