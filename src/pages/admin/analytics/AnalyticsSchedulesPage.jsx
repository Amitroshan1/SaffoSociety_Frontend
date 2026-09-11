import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  DataTable,
  FormField,
  FormLayout,
  FormSelect,
  Pagination,
  SkeletonLoader,
} from '../../../components/common/index.js';
import { ADMIN_ROUTES, FINANCE_ROUTES } from '../../../constants/adminRoutes.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import {
  EXPORT_FORMATS,
  SCHEDULE_FREQUENCIES,
  createReportSchedule,
  deleteReportSchedule,
  formatLabel,
  listReportSchedules,
} from '../../../services/analytics.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const initial = {
  name: '',
  reportKey: 'billing.outstanding',
  format: 'csv',
  frequency: 'monthly',
  cronExpression: '',
};

export default function AnalyticsSchedulesPage({ basePath = '/admin' } = {}) {
  const isFinance = basePath.startsWith('/finance');
  const routes = isFinance ? FINANCE_ROUTES : ADMIN_ROUTES;
  const { params, setPage } = useListQuery({ sortBy: 'created_at', sortOrder: 'desc', pageSize: 10 });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    listReportSchedules(params)
      .then((res) => {
        setRows(res.data?.data?.schedules || []);
        setPagination(normalizePagination(res.data?.data));
        setError('');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load schedules'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [params]);

  const onCreate = async (e) => {
    e.preventDefault();
    setSuccess('');
    try {
      await createReportSchedule({
        name: form.name,
        reportKey: form.reportKey,
        format: form.format,
        frequency: form.frequency,
        cronExpression: form.frequency === 'cron' ? form.cronExpression : undefined,
        filters: {},
        recipientRoles: isFinance ? ['finance'] : ['admin'],
      });
      setSuccess('Schedule created');
      setForm(initial);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    }
  };

  const onDelete = async (id) => {
    try {
      await deleteReportSchedule(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'reportKey', label: 'Report' },
    { key: 'frequency', label: 'Frequency', render: (r) => formatLabel(r.frequency) },
    { key: 'format', label: 'Format' },
    { key: 'nextRunAt', label: 'Next run', render: (r) => r.nextRunAt || '-' },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <button type="button" className="btn-ghost" onClick={() => onDelete(r.id)}>
          Disable
        </button>
      ),
    },
  ];

  return (
    <AppShell
      active="analytics-schedules"
      routes={routes}
      breadcrumb={[{ label: 'Home' }, { label: 'Analytics' }, { label: 'Schedules' }]}
    >
      <PageHeader
        icon={CalendarClock}
        iconColor="#fcd34d"
        title="Scheduled Reports"
        subtitle="Daily to yearly delivery via the notification system."
      />
      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {success && <p style={{ color: '#86efac' }}>{success}</p>}

      <section className="glass-card" style={{ padding: 16, borderRadius: 16, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Create schedule</h3>
        <form onSubmit={onCreate}>
          <FormLayout>
            <FormField label="Name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>
            <FormField label="Report key">
              <input
                required
                value={form.reportKey}
                onChange={(e) => setForm({ ...form, reportKey: e.target.value })}
              />
            </FormField>
            <FormField label="Format">
              <FormSelect
                label=""
                value={form.format}
                onChange={(v) => setForm({ ...form, format: v })}
                options={EXPORT_FORMATS.map((f) => ({ value: f, label: f }))}
              />
            </FormField>
            <FormField label="Frequency">
              <FormSelect
                label=""
                value={form.frequency}
                onChange={(v) => setForm({ ...form, frequency: v })}
                options={SCHEDULE_FREQUENCIES.map((f) => ({ value: f, label: f }))}
              />
            </FormField>
            {form.frequency === 'cron' && (
              <FormField label="Cron expression">
                <input
                  value={form.cronExpression}
                  onChange={(e) => setForm({ ...form, cronExpression: e.target.value })}
                  placeholder="0 8 * * 1"
                />
              </FormField>
            )}
          </FormLayout>
          <button className="btn-primary" type="submit" style={{ marginTop: 12 }}>
            Save schedule
          </button>
        </form>
      </section>

      {loading ? <SkeletonLoader rows={4} /> : <DataTable columns={columns} rows={rows} />}
      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onChange={setPage}
      />
    </AppShell>
  );
}
