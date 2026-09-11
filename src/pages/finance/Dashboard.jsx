import { useEffect, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../layout/admin/PageHeader.jsx';
import { DataTable } from '../../components/common/index.js';
import { FINANCE_ROUTES } from '../../constants/adminRoutes.js';
import { useAuth } from '../../hooks/useAuth';
import {
  formatMoney,
  getBillingDashboard,
  listPayments,
} from '../../services/billing.service';
import '../../styles/admin/AdminDashboard.css';
import '../../styles/common/crud.css';

const money = (stats, key) =>
  formatMoney(stats?.[`${key}Minor`] ?? stats?.[key]);

const DEFAULTER_COLUMNS = [
  { key: 'residentName', label: 'Resident', render: (row) => row.residentName || row.residentId || '-' },
  { key: 'flatNo', label: 'Flat', render: (row) => row.flatNo || '-' },
  {
    key: 'outstandingMinor',
    label: 'Outstanding ₹',
    render: (row) => formatMoney(row.outstandingMinor),
  },
];

const MODE_COLUMNS = [
  { key: 'mode', label: 'Mode', render: (row) => row.mode || '-' },
  {
    key: 'amountMinor',
    label: 'Collected ₹',
    render: (row) => formatMoney(row.amountMinor),
  },
];

const PAYMENT_COLUMNS = [
  { key: 'paymentNumber', label: 'Payment #' },
  { key: 'residentName', label: 'Resident', render: (row) => row.residentName || '-' },
  {
    key: 'amountMinor',
    label: 'Amount ₹',
    render: (row) => formatMoney(row.amountMinor),
  },
  { key: 'mode', label: 'Mode' },
  { key: 'status', label: 'Status' },
  { key: 'paymentDate', label: 'Date' },
];

const FinanceDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    getBillingDashboard()
      .then((r) => setStats(r.data?.data || null))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load KPIs'))
      .finally(() => setLoading(false));

    listPayments({ page: 1, pageSize: 10, sortBy: 'payment_date', sortOrder: 'desc' })
      .then((r) => setPayments(r.data?.data?.payments || []))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
  }, []);

  const defaulters = (stats?.topDefaulters || []).map((d, i) => ({
    ...d,
    id: d.residentId || `defaulter-${i}`,
  }));
  const byMode = (stats?.collectionByMode || []).map((m, i) => ({
    ...m,
    id: m.mode || `mode-${i}`,
  }));

  return (
    <AppShell
      active="dashboard"
      routes={FINANCE_ROUTES}
      breadcrumb={[{ label: 'Home' }, { label: 'Finance Dashboard' }]}
    >
      <PageHeader
        icon={LayoutDashboard}
        iconColor="#EAF3DE"
        title="Finance Dashboard"
        subtitle={user?.name ? `Welcome, ${user.name}` : 'Collections, revenue, and outstanding dues.'}
      />

      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}

      {loading && !stats && !error && (
        <p style={{ color: 'var(--t3)' }}>Loading dashboard…</p>
      )}

      {stats && (
        <div className="crud-stat-grid">
          <div className="crud-stat-card">
            <span className="crud-stat-label">Today</span>
            <strong>₹ {money(stats, 'todayCollection')}</strong>
          </div>
          <div className="crud-stat-card">
            <span className="crud-stat-label">This month</span>
            <strong>₹ {money(stats, 'monthCollection')}</strong>
          </div>
          <div className="crud-stat-card">
            <span className="crud-stat-label">Outstanding</span>
            <strong>₹ {money(stats, 'totalOutstanding')}</strong>
          </div>
          <div className="crud-stat-card">
            <span className="crud-stat-label">Overdue</span>
            <strong>
              ₹ {money(stats, 'overdueAmount')} ({stats.overdueCount || 0})
            </strong>
          </div>
        </div>
      )}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Top defaulters</h3>
        <DataTable
          columns={DEFAULTER_COLUMNS}
          rows={defaulters}
          loading={loading}
          emptyTitle="No defaulters"
          emptyDescription="No outstanding dues at the moment."
        />
      </section>

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Collection by mode (this month)</h3>
        <DataTable
          columns={MODE_COLUMNS}
          rows={byMode}
          loading={loading}
          emptyTitle="No collections"
          emptyDescription="No cleared payments this month yet."
        />
      </section>

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <h3 style={{ marginTop: 0 }}>Recent payments</h3>
        <DataTable
          columns={PAYMENT_COLUMNS}
          rows={payments}
          loading={paymentsLoading}
          emptyTitle="No payments"
          emptyDescription="Payments will appear here once recorded."
          onRowClick={(row) => navigate(`${FINANCE_ROUTES.payments}/${row.id}`)}
        />
      </section>
    </AppShell>
  );
};

export default FinanceDashboard;
