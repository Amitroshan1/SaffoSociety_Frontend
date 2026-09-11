import { useEffect, useState } from 'react';
import { ArrowLeft, BadgePercent, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  FormField,
  FormLayout,
  FormSelect,
} from '../../../components/common/index.js';
import Spinner from '../../../common/Spinner.jsx';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import {
  createDiscountRule,
  deactivateDiscountRule,
  getDiscountRule,
  updateDiscountRule,
} from '../../../services/billing.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const DISCOUNT_TYPES = ['fixed', 'percentage'];
const SCOPES = ['society', 'resident', 'occupancy', 'bill'];

const initialForm = {
  name: '',
  discountType: 'fixed',
  fixedAmountMinor: '0',
  percentageBps: '',
  scope: 'society',
  oneTime: 'false',
  stackable: 'false',
  notes: '',
};

function toForm(row) {
  return {
    name: row.name || '',
    discountType: row.discountType || 'fixed',
    fixedAmountMinor: String(row.fixedAmountMinor ?? 0),
    percentageBps: String(row.percentageBps ?? ''),
    scope: row.scope || 'society',
    oneTime: row.oneTime ? 'true' : 'false',
    stackable: row.stackable ? 'true' : 'false',
    notes: row.notes || '',
  };
}

export default function DiscountRuleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [discountRule, setDiscountRule] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getDiscountRule(id);
        const row = data.data?.discountRule ?? data.data;
        if (cancelled) return;
        setDiscountRule(row);
        setForm(toForm(row));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load discount rule');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/discount-rules');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: form.name.trim(),
        discountType: form.discountType,
        scope: form.scope,
        oneTime: form.oneTime === 'true',
        stackable: form.stackable === 'true',
        notes: form.notes.trim() || null,
      };
      if (form.discountType === 'fixed') payload.fixedAmountMinor = Number(form.fixedAmountMinor) || 0;
      if (form.discountType === 'percentage') payload.percentageBps = Number(form.percentageBps) || 0;

      if (isCreate) {
        const res = await createDiscountRule(payload);
        navigate('/admin/discount-rules', {
          replace: true,
          state: { success: res.data.message || 'Rule created' },
        });
        return;
      }
      const res = await updateDiscountRule(id, payload);
      const row = res.data.data?.discountRule ?? res.data.data;
      if (row) {
        setDiscountRule(row);
        setForm(toForm(row));
      }
      setSuccess(res.data.message || 'Rule updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!discountRule || !discountRule.isActive) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await deactivateDiscountRule(discountRule.id);
      const row = data.data?.discountRule ?? data.data;
      if (row) {
        setDiscountRule(row);
        setForm(toForm(row));
      } else {
        setDiscountRule((s) => (s ? { ...s, isActive: false } : s));
      }
      setSuccess(data.message || 'Rule deactivated');
    } catch (err) {
      setError(err.response?.data?.message || 'Deactivate failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <AppShell
      active="discount-rules"
      onChange={(navId) => {
        if (navId === 'discount-rules') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Discount Rules' },
        { label: isCreate ? 'Create' : discountRule?.name || 'Details' },
      ]}
    >
      <PageHeader
        icon={BadgePercent}
        iconColor="#86efac"
        title={isCreate ? 'Create Discount Rule' : discountRule?.name || 'Discount Rule Details'}
        subtitle={
          isCreate
            ? 'Define a fixed or percentage discount by scope.'
            : 'View and edit discount rule details.'
        }
        action={
          !isCreate && discountRule?.isActive ? (
            <button className="btn-primary" type="button" onClick={handleDeactivate} disabled={saving}>
              Deactivate
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

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <form onSubmit={onSubmit}>
          <FormLayout
            sections={[
              {
                title: 'Rule',
                content: (
                  <>
                    <FormField
                      label="Name *"
                      value={form.name}
                      onChange={(v) => setForm((s) => ({ ...s, name: v }))}
                      required
                    />
                    <FormSelect
                      label="Discount type"
                      value={form.discountType}
                      options={DISCOUNT_TYPES}
                      onChange={(v) => setForm((s) => ({ ...s, discountType: v }))}
                    />
                    {form.discountType === 'fixed' ? (
                      <FormField
                        label="Fixed amount (paise)"
                        type="number"
                        value={form.fixedAmountMinor}
                        onChange={(v) => setForm((s) => ({ ...s, fixedAmountMinor: v }))}
                      />
                    ) : (
                      <FormField
                        label="Percentage (bps)"
                        type="number"
                        value={form.percentageBps}
                        onChange={(v) => setForm((s) => ({ ...s, percentageBps: v }))}
                      />
                    )}
                    <FormSelect
                      label="Scope"
                      value={form.scope}
                      options={SCOPES}
                      onChange={(v) => setForm((s) => ({ ...s, scope: v }))}
                    />
                    <FormSelect
                      label="One-time"
                      value={form.oneTime}
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                      ]}
                      onChange={(v) => setForm((s) => ({ ...s, oneTime: v }))}
                    />
                    <FormSelect
                      label="Stackable"
                      value={form.stackable}
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                      ]}
                      onChange={(v) => setForm((s) => ({ ...s, stackable: v }))}
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
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : isCreate ? 'Create' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
