import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import { DataTable, FormField, FormSelect } from '@/components/common/index.js';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import { DOCUMENT_REPORT_KEYS, getDocumentReport } from '@/services/document.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

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

export default function DocumentReportsPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const routeMap = ADMIN_ROUTES;
  const [reportKey, setReportKey] = useState('by-category');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [ran, setRan] = useState(false);

  const runReport = async () => {
    setLoading(true);
    setError('');
    setRows([]);
    setRan(true);
    try {
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const { data } = await getDocumentReport(reportKey, params);
      setRows(data.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Report failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = columnsFromRows(rows);

  return (
    <AppShell
      active="documents"
      onChange={(id) => routeMap[id] && navigate(routeMap[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Documents' }, { label: 'Reports' }]}
    >
      <PageHeader
        icon={BarChart3}
        iconColor="#a5b4fc"
        title="Document Reports"
        subtitle="Storage, download, and lifecycle analytics for the document repository."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
          <FormSelect
            label="Report"
            value={reportKey}
            options={DOCUMENT_REPORT_KEYS.map((k) => ({ value: k, label: k }))}
            onChange={setReportKey}
          />
          <FormField label="From" type="date" value={fromDate} onChange={setFromDate} />
          <FormField label="To" type="date" value={toDate} onChange={setToDate} />
          <button className="btn-primary" type="button" onClick={runReport} disabled={loading}>
            {loading ? 'Loading…' : 'Run report'}
          </button>
        </div>
      </section>

      {ran && (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          {columns.length > 0 ? (
            <DataTable columns={columns} rows={rows} loading={loading} emptyTitle="No rows" />
          ) : !loading ? (
            <p style={{ color: 'var(--t3)' }}>No rows returned.</p>
          ) : null}
        </section>
      )}
    </AppShell>
  );
}
