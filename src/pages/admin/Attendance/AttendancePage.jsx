import { useCallback, useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import { DataTable, FilterBar, Pagination, SearchInput } from '../../../components/common/index.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import { listAttendance, voidAttendance } from '../../../services/attendance.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const routes = {
  dashboard: '/admin/dashboard',
  society: '/admin/society',
  buildings: '/admin/buildings',
  wings: '/admin/wings',
  flats: '/admin/flats',
  occupancy: '/admin/occupancies',
  residents: '/admin/residents',
  visitors: '/admin/visitors',
  visits: '/admin/visits',
  staff: '/admin/staff',
  gates: '/admin/gates',
  shifts: '/admin/shifts',
  'gate-ops': '/admin/gate-ops',
  attendance: '/admin/attendance',
  complaints: '/admin/complaints',
};

const COLUMNS = [
  { key: 'staffName', label: 'Staff' },
  { key: 'gateName', label: 'Gate' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'checkInTime', label: 'In', sortable: true },
  { key: 'checkOutTime', label: 'Out' },
];

export default function AttendancePage() {
  const navigate = useNavigate();
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'check_in_time',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listAttendance(params);
      setRows(data.data?.attendance || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      active="attendance"
      onChange={(id) => routes[id] && navigate(routes[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Attendance' }]}
    >
      <PageHeader
        icon={ClipboardList}
        iconColor="#c4b5fd"
        title="Attendance Log"
        subtitle="Staff check-in / check-out history."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}
      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search..." />
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'checked_in', label: 'Checked In' },
                  { value: 'checked_out', label: 'Checked Out' },
                  { value: 'voided', label: 'Voided' },
                ],
              },
            ]}
            values={state}
            onChange={setFilter}
          />
        </div>
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey="id"
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={setSelected}
          emptyTitle="No attendance records"
          emptyDescription="Clock-ins will appear here."
        />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </section>
      {selected && selected.status !== 'voided' && (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>
            {selected.staffName} — {selected.status}
          </h3>
          <button
            className="btn-primary"
            type="button"
            onClick={async () => {
              try {
                const { data } = await voidAttendance(selected.id);
                setSuccess(data.message || 'Voided');
                setSelected(null);
                await load();
              } catch (err) {
                setError(err.response?.data?.message || 'Void failed');
              }
            }}
          >
            Void record
          </button>
        </section>
      )}
    </AppShell>
  );
}
