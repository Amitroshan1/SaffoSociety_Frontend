import { useEffect, useState } from 'react';
import { ArrowLeft, Receipt } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import Spinner from '@/common/Spinner.jsx';
import { ADMIN_ROUTES, FINANCE_ROUTES } from '@/constants/adminRoutes.js';
import { formatMoney, getReceipt } from '@/services/billing.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

export default function ReceiptDetailPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const routeMap = basePath.startsWith('/finance') ? FINANCE_ROUTES : ADMIN_ROUTES;
  const listPath = `${basePath}/receipts`;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const goBack = () => navigate(listPath);

  useEffect(() => {
    if (!id) {
      goBack();
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getReceipt(id);
        const row = data.data?.receipt ?? data.data;
        if (cancelled) return;
        setReceipt(row);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load receipt');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Spinner />;

  return (
    <AppShell
      active="receipts"
      routes={routeMap}
      onChange={(navId) => {
        if (navId === 'receipts') {
          goBack();
          return;
        }
        const path = routeMap[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Receipts' },
        { label: receipt?.receiptNumber || 'Details' },
      ]}
    >
      <PageHeader
        icon={Receipt}
        iconColor="#86efac"
        title={receipt?.receiptNumber || 'Receipt Details'}
        subtitle="Immutable payment acknowledgment."
      />

      <div style={{ marginBottom: 12 }}>
        <button className="btn-ghost" type="button" onClick={goBack}>
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}

      {receipt && (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <h3 style={{ marginTop: 0 }}>{receipt.receiptNumber}</h3>
          <p>
            <strong>Amount:</strong> ₹ {formatMoney(receipt.amountMinor)}
          </p>
          <p>
            <strong>Resident:</strong> {receipt.residentName || receipt.residentId}
          </p>
          <p>
            <strong>Issued:</strong> {receipt.issuedAt}
          </p>
          <p>
            <strong>Void:</strong> {receipt.isVoid ? 'Yes' : 'No'}
          </p>
        </section>
      )}
    </AppShell>
  );
}
