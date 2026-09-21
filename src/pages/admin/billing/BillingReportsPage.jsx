import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import { DataTable, FormField, FormSelect } from '@/components/common/index.js';
import { ADMIN_ROUTES, FINANCE_ROUTES } from '@/constants/adminRoutes.js';
import { getBillingReport } from '@/services/billing.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const REPORT_KEYS = [
  'outstanding',
  'collections',
  'revenue',
  'defaulters',
  'resident-ledger',
  'income',
  'charge-head-summary',
  'monthly-collections',
  'yearly-collections',
  'payment-trends',
];

function rowsFromReport(data) {
  if (!data) return [];
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.bills)) return data.bills;
  if (Array.isArray(data.payments)) return data.payments;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data)) return data;
  return [];
}

function columnsFromRows(rows) {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((key) => ({
    key,
    label: key,
    render: (row) => {
      const v = row[key];
      if (v != null && typeof v === 'object') return JSON.stringify(v);
      return String(v ?? '');
    },
  }));
}

export default function BillingReportsPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const isFinance = basePath.startsWith('/finance');
  const routeMap = isFinance ? FINANCE_ROUTES : ADMIN_ROUTES;
  const [reportKey, setReportKey] = useState('outstanding');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);

  const runReport = async () => {
    setLoading(true);
    setError('');
    setPayload(null);
    try {
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const { data } = await getBillingReport(reportKey, params);
      setPayload(data.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Report failed');
    } finally {
      setLoading(false);
    }
  };

  const tableRows = rowsFromReport(payload);
  const columns = columnsFromRows(tableRows);

  return (
    <AppShell
      active={isFinance ? 'reports' : 'billing-reports'}
      routes={routeMap}
      breadcrumb={[{ label: 'Home' }, { label: 'Billing Reports' }]}
    >
      <PageHeader
        icon={BarChart3}
        iconColor="#a5b4fc"
        title="Billing Reports"
        subtitle="Run outstanding, collections, defaulters, and ledger reports."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
          <FormSelect
            label="Report"
            value={reportKey}
            options={REPORT_KEYS.map((k) => ({ value: k, label: k }))}
            onChange={setReportKey}
          />
          <FormField label="From" type="date" value={fromDate} onChange={setFromDate} />
          <FormField label="To" type="date" value={toDate} onChange={setToDate} />
          <button className="btn-primary" type="button" onClick={runReport} disabled={loading}>
            {loading ? 'Loading...' : 'Run report'}
          </button>
        </div>
      </section>

      {payload && (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          {columns.length > 0 ? (
            <DataTable columns={columns} rows={tableRows} emptyTitle="No rows" />
          ) : (
            <pre style={{ overflow: 'auto', fontSize: 12, maxHeight: 480 }}>
              {JSON.stringify(payload, null, 2)}
            </pre>
          )}
        </section>
      )}
    </AppShell>
  );
}
