import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import ListToolbar from '@/components/common/ListToolbar';
import Pagination from '@/components/common/Pagination';
import StatusBadge from '@/components/common/StatusBadge';
import { useListQuery } from '@/hooks/useListQuery';
import { normalizePagination } from '@/utils/listQuery';
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_COLORS,
  cancelResidentBooking,
  formatAmount,
  listResidentBookings,
} from '@/services/facility.service';

export default function ResidentMyBookingsPage() {
  const navigate = useNavigate();
  const { state, params, setPage, setSearch, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const finalParams = { ...params };
      if (state.status) finalParams.status = state.status;
      const { data } = await listResidentBookings(finalParams);
      setRows(data.data?.bookings || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.status]);

  useEffect(() => {
    load();
  }, [load]);

  const onCancel = async (row, e) => {
    e.stopPropagation();
    const reason = window.prompt('Reason for cancellation:');
    if (reason === null) return;
    setBusyId(row.id);
    setError('');
    setSuccess('');
    try {
      await cancelResidentBooking(row.id, reason);
      setSuccess(`Booking ${row.bookingNumber || ''} cancelled`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    { key: 'bookingNumber', label: 'Booking #' },
    { key: 'amenityName', label: 'Facility', render: (row) => row.amenityName || '-' },
    { key: 'bookingDate', label: 'Date' },
    { key: 'time', label: 'Time', render: (row) => `${row.startTime || '-'}-${row.endTime || '-'}` },
    { key: 'amount', label: 'Amount', render: (row) => formatAmount(row.amount) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} colors={BOOKING_STATUS_COLORS} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) =>
        ['pending', 'approved', 'confirmed'].includes(row.status) ? (
          <button
            type="button"
            onClick={(e) => onCancel(row, e)}
            disabled={busyId === row.id}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fecaca', color: '#b91c1c' }}
          >
            Cancel
          </button>
        ) : (
          '-'
        ),
    },
  ];

  if (error && !rows.length && !loading) return <EmptyState title="Bookings unavailable" description={error} />;

  return (
    <div>
      <h1 className="resident-page-title">My Bookings</h1>
      <p className="resident-page-subtitle">
        Track facility requests, booking status, and receipts.
      </p>
      {error && <p className="resident-error">{error}</p>}
      {success && <p style={{ color: '#166534' }}>{success}</p>}

      <ListToolbar
        search={state.search}
        onSearch={setSearch}
        searchPlaceholder="Search by booking number"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: BOOKING_STATUSES.map((s) => ({ value: s, label: s })),
          },
        ]}
        filterValues={state}
        onFilterChange={setFilter}
        newLabel="Book"
        onNew={() => navigate('/resident/facilities')}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={(row) => navigate(`/resident/bookings/${row.id}`)}
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
    </div>
  );
}
