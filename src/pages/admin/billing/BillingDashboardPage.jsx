import { useEffect, useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import { DataTable } from '../../../components/common/index.js';
import { ADMIN_ROUTES, FINANCE_ROUTES } from '../../../constants/adminRoutes.js';
import { formatMoney, getBillingDashboard } from '../../../services/billing.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const LINKS = [
  { id: 'bills', label: 'Bills' },
  { id: 'bill-generate', label: 'Generate Bills' },
  { id: 'payments', label: 'Payments' },
  { id: 'receipts', label: 'Receipts' },
  { id: 'charge-heads', label: 'Charge Heads' },
  { id: 'billing-cycles', label: 'Billing Cycles' },
  { id: 'financial-years', label: 'Financial Years' },
  { id: 'billing-reports', label: 'Reports' },
];

const money = (stats, key) =>
  formatMoney(stats?.[`${key}Minor`] ?? stats?.[key]);

const DEFAULTER_COLUMNS = [
  {
    key: 'residentName',
    label: 'Resident',
    render: (row) => row.residentName || row.residentId || '-',
  },
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

export default function BillingDashboardPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const isFinance = basePath.startsWith('/finance');

  useEffect(() => {
    getBillingDashboard()
      .then((r) => setStats(r.data?.data || null))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const routeMap = isFinance ? FINANCE_ROUTES : ADMIN_ROUTES;
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
      active="billing"
      routes={routeMap}
      breadcrumb={[{ label: 'Home' }, { label: 'Billing' }]}
    >
      <PageHeader
        icon={IndianRupee}
        iconColor="#fde68a"
        title="Billing Dashboard"
        subtitle={
          isFinance
            ? 'Collections, outstanding dues, and payment overview.'
            : 'Collections, outstanding dues, and billing shortcuts.'
        }
      />

      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}

      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div className="crud-stat-card">Today: ₹ {money(stats, 'todayCollection')}</div>
          <div className="crud-stat-card">This month: ₹ {money(stats, 'monthCollection')}</div>
          <div className="crud-stat-card">Outstanding: ₹ {money(stats, 'totalOutstanding')}</div>
          <div className="crud-stat-card">
            Overdue: ₹ {money(stats, 'overdueAmount')} ({stats.overdueCount || 0})
          </div>
        </div>
      )}

      {isFinance ? (
        <>
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

          <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ marginTop: 0 }}>Collection by mode (this month)</h3>
            <DataTable
              columns={MODE_COLUMNS}
              rows={byMode}
              loading={loading}
              emptyTitle="No collections"
              emptyDescription="No cleared payments this month yet."
            />
          </section>
        </>
      ) : (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <h3 style={{ marginTop: 0 }}>Quick links</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {LINKS.map((link) => {
              const href = ADMIN_ROUTES[link.id];
              if (!href) return null;
              return (
                <button
                  key={link.id}
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate(href)}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          {stats?.topDefaulters?.length > 0 && (
            <>
              <h4>Top defaulters</h4>
              <ul>
                {stats.topDefaulters.map((d, i) => (
                  <li key={d.residentId || i}>
                    {d.residentName || d.residentId}: ₹ {formatMoney(d.outstandingMinor)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </AppShell>
  );
}
