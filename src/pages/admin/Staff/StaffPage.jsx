import { useCallback, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  DataTable,
  ListToolbar,
  Pagination,
} from '@/components/common/index.js';
import { useListQuery } from '@/hooks/useListQuery.js';
import { normalizePagination } from '@/utils/listQuery.js';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import { listStaff } from '@/services/staff.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const ROLES = [
  'security_guard',
  'security_supervisor',
  'housekeeping',
  'facility_manager',
  'electrician',
  'plumber',
  'gardener',
  'receptionist',
  'other',
];

const COLUMNS = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'phone', label: 'Phone' },
  { key: 'staffRole', label: 'Role', sortable: true },
  { key: 'assignedGateName', label: 'Gate' },
  {
    key: 'isActive',
    label: 'Active',
    render: (row) => (
      <span className={`crud-badge ${row.isActive ? 'crud-badge-active' : 'crud-badge-inactive'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

export default function StaffPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'name',
    sortOrder: 'asc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const apiParams = { ...params };
      if (apiParams.isActive === 'true') apiParams.isActive = true;
      else if (apiParams.isActive === 'false') apiParams.isActive = false;
      else delete apiParams.isActive;
      const { data } = await listStaff(apiParams);
      setRows(data.data?.staff || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch staff');
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
      active="staff"
      onChange={(id) => {
        if (id === 'staff') return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[{ label: 'Home' }, { label: 'Staff' }]}
    >
      <PageHeader
        icon={Users}
        iconColor="#86efac"
        title="Staff Directory"
        subtitle="Click a staff row to open details, or add a new staff member."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search name, phone, code..."
          filters={[
            {
              key: 'isActive',
              label: 'Status',
              options: [
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ],
            },
            {
              key: 'staffRole',
              label: 'Role',
              options: ROLES.map((r) => ({ value: r, label: r })),
            },
          ]}
          filterValues={state}
          onFilterChange={setFilter}
          newLabel="New Staff"
          onNew={() => navigate('/admin/staff/new')}
        />
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey="id"
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`/admin/staff/${row.id}`)}
          emptyTitle="No staff found"
          emptyDescription="Add security and facility staff for gate operations."
        />
        {!loading && pagination && <Pagination {...pagination} onPageChange={setPage} />}
      </section>
    </AppShell>
  );
}
