import { useEffect, useState } from 'react';
import { ArrowLeft, CreditCard, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  FormField,
  FormLayout,
  FormSelect,
} from '@/components/common/index.js';
import Spinner from '@/common/Spinner.jsx';
import { ADMIN_ROUTES, FINANCE_ROUTES } from '@/constants/adminRoutes.js';
import {
  createPayment,
  formatMoney,
  getPayment,
  listFinancialYears,
  reversePayment,
} from '@/services/billing.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const MODES = ['cash', 'cheque', 'upi', 'bank_transfer', 'card', 'online_gateway'];

const initialForm = {
  residentId: '',
  financialYearId: '',
  amountMinor: '',
  mode: 'cash',
  autoAllocate: 'true',
  externalReference: '',
  notes: '',
};

export default function PaymentFormPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;
  const routeMap = basePath.startsWith('/finance') ? FINANCE_ROUTES : ADMIN_ROUTES;
  const listPath = `${basePath}/payments`;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payment, setPayment] = useState(null);
  const [years, setYears] = useState([]);
  const [form, setForm] = useState(initialForm);

  const goBack = () => navigate(listPath);

  useEffect(() => {
    if (!isCreate) return;
    listFinancialYears({ pageSize: 50, status: 'open', sortBy: 'start_date', sortOrder: 'desc' })
      .then((r) => setYears(r.data?.data?.financialYears || []))
      .catch(() => {});
  }, [isCreate]);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getPayment(id);
        const row = data.data?.payment ?? data.data;
        if (cancelled) return;
        setPayment(row);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load payment');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isCreate) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await createPayment({
        residentId: form.residentId.trim(),
        financialYearId: form.financialYearId,
        amountMinor: Number(form.amountMinor),
        mode: form.mode,
        autoAllocate: form.autoAllocate === 'true',
        externalReference: form.externalReference.trim() || null,
        notes: form.notes.trim() || null,
      });
      navigate(listPath, {
        replace: true,
        state: { success: res.data.message || 'Payment recorded' },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Record payment failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReverse = async () => {
    if (!payment || payment.status === 'reversed') return;
    setSaving(true);
    setError('');
    try {
      const { data } = await reversePayment(payment.id, {});
      const row = data.data?.payment ?? data.data;
      if (row) setPayment(row);
      else setPayment((s) => (s ? { ...s, status: 'reversed' } : s));
      setSuccess(data.message || 'Payment reversed');
    } catch (err) {
      setError(err.response?.data?.message || 'Reverse failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <AppShell
      active="payments"
      routes={routeMap}
      onChange={(navId) => {
        if (navId === 'payments') {
          goBack();
          return;
        }
        const path = routeMap[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Payments' },
        { label: isCreate ? 'Create' : payment?.paymentNumber || 'Details' },
      ]}
    >
      <PageHeader
        icon={CreditCard}
        iconColor="#fde68a"
        title={
          isCreate
            ? 'Record Payment'
            : payment?.paymentNumber || 'Payment Details'
        }
        subtitle={
          isCreate
            ? 'Record a collection and optionally auto-allocate.'
            : 'View payment details and reverse if needed.'
        }
        action={
          !isCreate && payment && payment.status !== 'reversed' ? (
            <button className="btn-primary" type="button" onClick={handleReverse} disabled={saving}>
              Reverse payment
            </button>
          ) : null
        }
      />

      <div style={{ marginBottom: 12 }}>
        <button className="btn-ghost" type="button" onClick={goBack}>
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      {isCreate ? (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <form onSubmit={onSubmit}>
            <FormLayout
              sections={[
                {
                  title: 'Payment',
                  content: (
                    <>
                      <FormField
                        label="Resident ID *"
                        value={form.residentId}
                        onChange={(v) => setForm((s) => ({ ...s, residentId: v }))}
                        required
                      />
                      <FormSelect
                        label="Financial year *"
                        value={form.financialYearId}
                        options={years.map((y) => ({
                          value: y.id,
                          label: `${y.code} — ${y.name}`,
                        }))}
                        onChange={(v) => setForm((s) => ({ ...s, financialYearId: v }))}
                        required
                      />
                      <FormField
                        label="Amount (paise) *"
                        type="number"
                        value={form.amountMinor}
                        onChange={(v) => setForm((s) => ({ ...s, amountMinor: v }))}
                        required
                      />
                      <FormSelect
                        label="Mode"
                        value={form.mode}
                        options={MODES}
                        onChange={(v) => setForm((s) => ({ ...s, mode: v }))}
                      />
                      <FormSelect
                        label="Auto allocate"
                        value={form.autoAllocate}
                        options={[
                          { value: 'true', label: 'Yes' },
                          { value: 'false', label: 'No' },
                        ]}
                        onChange={(v) => setForm((s) => ({ ...s, autoAllocate: v }))}
                      />
                      <FormField
                        label="External reference"
                        value={form.externalReference}
                        onChange={(v) => setForm((s) => ({ ...s, externalReference: v }))}
                      />
                      <FormField
                        textarea
                        label="Notes"
                        value={form.notes}
                        onChange={(v) => setForm((s) => ({ ...s, notes: v }))}
                      />
                    </>
                  ),
                },
              ]}
            />
            <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop: 16 }}>
              <Save size={14} /> {saving ? 'Saving...' : 'Record payment'}
            </button>
          </form>
        </section>
      ) : (
        payment && (
          <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
            <p>
              <strong>Payment #:</strong> {payment.paymentNumber || payment.id}
            </p>
            <p>
              <strong>Resident:</strong> {payment.residentName || payment.residentId}
            </p>
            <p>
              <strong>Amount:</strong> ₹ {formatMoney(payment.amountMinor)}
            </p>
            <p>
              <strong>Mode:</strong> {payment.mode}
            </p>
            <p>
              <strong>Status:</strong> {payment.status}
            </p>
            <p>
              <strong>Date:</strong> {payment.paymentDate}
            </p>
            {payment.externalReference && (
              <p>
                <strong>External reference:</strong> {payment.externalReference}
              </p>
            )}
            {payment.notes && (
              <p>
                <strong>Notes:</strong> {payment.notes}
              </p>
            )}
          </section>
        )
      )}
    </AppShell>
  );
}
