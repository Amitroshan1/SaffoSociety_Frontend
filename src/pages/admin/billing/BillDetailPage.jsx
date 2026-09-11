import { useEffect, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import { FormField, FormLayout } from '../../../components/common/index.js';
import Spinner from '../../../common/Spinner.jsx';
import { ADMIN_ROUTES, FINANCE_ROUTES } from '../../../constants/adminRoutes.js';
import {
  applyDiscount,
  applyLateFee,
  cancelBill,
  formatMoney,
  getBill,
  publishBill,
  writeOffBill,
} from '../../../services/billing.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

export default function BillDetailPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const routeMap = basePath.startsWith('/finance') ? FINANCE_ROUTES : ADMIN_ROUTES;
  const listPath = `${basePath}/bills`;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bill, setBill] = useState(null);
  const [writeOffReason, setWriteOffReason] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');

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
        const { data } = await getBill(id);
        const row = data.data?.bill ?? data.data;
        if (cancelled) return;
        setBill(row);
        setWriteOffReason('');
        setDiscountAmount('');
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load bill');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const refreshBill = async () => {
    const { data } = await getBill(id);
    setBill(data.data?.bill ?? data.data);
  };

  const runAction = async (fn, okMsg) => {
    if (!bill) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await fn();
      setSuccess(okMsg);
      await refreshBill();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <AppShell
      active="bills"
      routes={routeMap}
      onChange={(navId) => {
        if (navId === 'bills') {
          goBack();
          return;
        }
        const path = routeMap[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Bills' },
        { label: bill?.billNumber || 'Details' },
      ]}
    >
      <PageHeader
        icon={FileText}
        iconColor="#93c5fd"
        title={bill?.billNumber || bill?.title || 'Bill Details'}
        subtitle="View bill lines and run publish, cancel, fee, and write-off actions."
      />

      <div style={{ marginBottom: 12 }}>
        <button className="btn-ghost" type="button" onClick={goBack}>
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      {bill && (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <h3 style={{ marginTop: 0 }}>{bill.billNumber || bill.title}</h3>
          <p>
            <strong>Status:</strong> {bill.status}
          </p>
          <p>
            <strong>Resident:</strong> {bill.residentName || bill.residentId}
          </p>
          <p>
            <strong>Net:</strong> ₹ {formatMoney(bill.netMinor)}
          </p>
          <p>
            <strong>Paid:</strong> ₹ {formatMoney(bill.paidMinor)}
          </p>
          <p>
            <strong>Outstanding:</strong> ₹ {formatMoney(bill.outstandingMinor)}
          </p>
          <p>
            <strong>Due:</strong> {bill.dueDate}
          </p>

          <h4>Lines</h4>
          <ul>
            {(bill.lines || []).map((line) => (
              <li key={line.id}>
                {line.description}: ₹ {formatMoney(line.lineTotalMinor)}
              </li>
            ))}
          </ul>

          <FormLayout
            sections={[
              {
                title: 'Actions',
                content: (
                  <>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className="btn-primary"
                        type="button"
                        disabled={saving}
                        onClick={() => runAction(() => publishBill(bill.id), 'Published')}
                      >
                        Publish
                      </button>
                      <button
                        className="btn-primary"
                        type="button"
                        disabled={saving}
                        onClick={() => runAction(() => cancelBill(bill.id), 'Cancelled')}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-primary"
                        type="button"
                        disabled={saving}
                        onClick={() => runAction(() => applyLateFee(bill.id), 'Late fee applied')}
                      >
                        Apply late fee
                      </button>
                    </div>
                    <FormField
                      label="Write-off reason"
                      value={writeOffReason}
                      onChange={setWriteOffReason}
                    />
                    <button
                      className="btn-primary"
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        runAction(
                          () => writeOffBill(bill.id, { reason: writeOffReason }),
                          'Written off',
                        )
                      }
                    >
                      Write off
                    </button>
                    <FormField
                      label="Discount amount (paise)"
                      type="number"
                      value={discountAmount}
                      onChange={setDiscountAmount}
                    />
                    <button
                      className="btn-primary"
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        runAction(
                          () =>
                            applyDiscount(bill.id, {
                              amountMinor: Number(discountAmount),
                            }),
                          'Discount applied',
                        )
                      }
                    >
                      Apply discount
                    </button>
                  </>
                ),
              },
            ]}
          />
        </section>
      )}
    </AppShell>
  );
}
