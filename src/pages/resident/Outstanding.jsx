import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { formatMoney, getResidentOutstanding } from '../../services/billing.service';

const BILL_COLUMNS = [
  { key: 'billNumber', label: 'Bill #' },
  { key: 'dueDate', label: 'Due' },
  { key: 'status', label: 'Status' },
  {
    key: 'outstandingMinor',
    label: 'Outstanding ₹',
    render: (row) => formatMoney(row.outstandingMinor),
  },
];

export default function ResidentOutstandingPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getResidentOutstanding();
        if (mounted) setData(res.data?.data || null);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || 'Failed to load outstanding');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <SkeletonLoader rows={4} />;
  if (error) return <EmptyState title="Outstanding unavailable" description={error} />;
  if (!data) return <EmptyState title="No outstanding data" />;

  const bills = (data.bills || []).map((b, i) => ({ ...b, id: b.id || `bill-${i}` }));

  return (
    <div>
      <h1 className="resident-page-title">Outstanding</h1>
      <p className="resident-page-subtitle">Open balances on your published bills.</p>

      <div className="resident-stat-grid" style={{ marginBottom: 16 }}>
        <div className="resident-card resident-card--accent">
          <h3>Total outstanding</h3>
          <p className="resident-card-amount">₹ {formatMoney(data.outstandingMinor)}</p>
        </div>
        <div className="resident-card">
          <h3>Open bills</h3>
          <p className="resident-card-amount">{data.billCount || 0}</p>
        </div>
      </div>

      <section className="resident-section resident-section--panel">
        <h3 style={{ marginTop: 0 }}>Bills with balance</h3>
        <DataTable
          columns={BILL_COLUMNS}
          rows={bills}
          emptyTitle="No outstanding bills"
          emptyDescription="You're all clear."
          onRowClick={() => navigate('/resident/bills')}
        />
      </section>
    </div>
  );
}
