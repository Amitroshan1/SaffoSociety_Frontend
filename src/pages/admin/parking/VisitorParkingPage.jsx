import { useCallback, useEffect, useState } from 'react';
import { ParkingCircle } from 'lucide-react';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  DataTable,
  FilterBar,
  Pagination,
  SearchInput,
  StatusBadge,
} from '../../../components/common/index.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import {
  VISITOR_PARKING_STATUSES,
  VISITOR_STATUS_COLORS,
  formatFee,
  formatLabel,
  listVisitorParkingLogs,
} from '../../../services/parking.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const COLUMNS = [
  { key: 'vehicleNumber', label: 'Vehicle', sortable: true },
  { key: 'vehicleType', label: 'Type', render: (r) => formatLabel(r.vehicleType) },
  { key: 'slotCode', label: 'Slot', render: (r) => r.slotCode || '-' },
  { key: 'residentName', label: 'Host resident', render: (r) => r.residentName || '-' },
  { key: 'parkingCode', label: 'Code', render: (r) => r.parkingCode || '-' },
  {
    key: 'status',
    label: 'Status',
    render: (r) => <StatusBadge status={r.status} colors={VISITOR_STATUS_COLORS} />,
  },
  { key: 'entryAt', label: 'Entry', render: (r) => r.entryAt || '-' },
  { key: 'exitAt', label: 'Exit', render: (r) => r.exitAt || '-' },
  { key: 'feeMinor', label: 'Fee', render: (r) => formatFee(r.feeMinor) },
  { key: 'purpose', label: 'Purpose', render: (r) => r.purpose || '-' },
];

export default function VisitorParkingPage() {
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const finalParams = { ...params };
      if (state.status) finalParams.status = state.status;
      const { data } = await listVisitorParkingLogs(finalParams);
      setRows(data.data?.logs || data.data?.visitorLogs || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch visitor parking logs');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      active="parking"
      breadcrumb={[{ label: 'Home' }, { label: 'Parking' }, { label: 'Visitor parking' }]}
    >
      <PageHeader
        icon={ParkingCircle}
        iconColor="#93c5fd"
        title="Visitor Parking"
        subtitle="Visitor parking requests, active stays, and exit history."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search by vehicle or code" />
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: VISITOR_PARKING_STATUSES.map((s) => ({
                  value: s,
                  label: formatLabel(s),
                })),
              },
            ]}
            values={state}
            onChange={setFilter}
          />
        </div>
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          emptyTitle="No visitor parking logs"
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
