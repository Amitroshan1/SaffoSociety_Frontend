import { useEffect, useState } from 'react';
import { ArrowLeft, Percent, Save } from 'lucide-react';
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
  createLateFeeRule,
  deactivateLateFeeRule,
  getLateFeeRule,
  updateLateFeeRule,
} from '../../../services/billing.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const FEE_TYPES = ['fixed', 'percentage', 'daily'];
const APPLY_ON = ['outstanding', 'bill_net'];

const initialForm = {
  name: '',
  feeType: 'fixed',
  graceDays: '0',
  fixedAmountMinor: '0',
  percentageBps: '',
  dailyAmountMinor: '',
  maxPenaltyMinor: '',
  applyOn: 'outstanding',
  priority: '0',
  notes: '',
};

function toForm(row) {
  return {
    name: row.name || '',
    feeType: row.feeType || 'fixed',
    graceDays: String(row.graceDays ?? 0),
    fixedAmountMinor: String(row.fixedAmountMinor ?? 0),
    percentageBps: String(row.percentageBps ?? ''),
    dailyAmountMinor: String(row.dailyAmountMinor ?? ''),
    maxPenaltyMinor: String(row.maxPenaltyMinor ?? ''),
    applyOn: row.applyOn || 'outstanding',
    priority: String(row.priority ?? 0),
    notes: row.notes || '',
  };
}

export default function LateFeeRuleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lateFeeRule, setLateFeeRule] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getLateFeeRule(id);
        const row = data.data?.lateFeeRule ?? data.data;
        if (cancelled) return;
        setLateFeeRule(row);
        setForm(toForm(row));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load late fee rule');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/late-fee-rules');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: form.name.trim(),
        feeType: form.feeType,
        graceDays: Number(form.graceDays) || 0,
        applyOn: form.applyOn,
        priority: Number(form.priority) || 0,
        notes: form.notes.trim() || null,
      };
      if (form.feeType === 'fixed') payload.fixedAmountMinor = Number(form.fixedAmountMinor) || 0;
      if (form.feeType === 'percentage') payload.percentageBps = Number(form.percentageBps) || 0;
      if (form.feeType === 'daily') payload.dailyAmountMinor = Number(form.dailyAmountMinor) || 0;
      if (form.maxPenaltyMinor) payload.maxPenaltyMinor = Number(form.maxPenaltyMinor);

      if (isCreate) {
        const res = await createLateFeeRule(payload);
        navigate('/admin/late-fee-rules', {
          replace: true,
          state: { success: res.data.message || 'Rule created' },
        });
        return;
      }
      const res = await updateLateFeeRule(id, payload);
      const row = res.data.data?.lateFeeRule ?? res.data.data;
      if (row) {
        setLateFeeRule(row);
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
    if (!lateFeeRule || !lateFeeRule.isActive) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await deactivateLateFeeRule(lateFeeRule.id);
      const row = data.data?.lateFeeRule ?? data.data;
      if (row) {
        setLateFeeRule(row);
        setForm(toForm(row));
      } else {
        setLateFeeRule((s) => (s ? { ...s, isActive: false } : s));
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
      active="late-fee-rules"
      onChange={(navId) => {
        if (navId === 'late-fee-rules') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Late Fee Rules' },
        { label: isCreate ? 'Create' : lateFeeRule?.name || 'Details' },
      ]}
    >
      <PageHeader
        icon={Percent}
        iconColor="#fca5a5"
        title={isCreate ? 'Create Late Fee Rule' : lateFeeRule?.name || 'Late Fee Rule Details'}
        subtitle={
          isCreate
            ? 'Define grace period and penalty calculation.'
            : 'View and edit late fee rule details.'
        }
        action={
          !isCreate && lateFeeRule?.isActive ? (
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
                      label="Fee type"
                      value={form.feeType}
                      options={FEE_TYPES}
                      onChange={(v) => setForm((s) => ({ ...s, feeType: v }))}
                    />
                    <FormField
                      label="Grace days"
                      type="number"
                      value={form.graceDays}
                      onChange={(v) => setForm((s) => ({ ...s, graceDays: v }))}
                    />
                    {form.feeType === 'fixed' && (
                      <FormField
                        label="Fixed amount (paise)"
                        type="number"
                        value={form.fixedAmountMinor}
                        onChange={(v) => setForm((s) => ({ ...s, fixedAmountMinor: v }))}
                      />
                    )}
                    {form.feeType === 'percentage' && (
                      <FormField
                        label="Percentage (bps)"
                        type="number"
                        value={form.percentageBps}
                        onChange={(v) => setForm((s) => ({ ...s, percentageBps: v }))}
                      />
                    )}
                    {form.feeType === 'daily' && (
                      <FormField
                        label="Daily amount (paise)"
                        type="number"
                        value={form.dailyAmountMinor}
                        onChange={(v) => setForm((s) => ({ ...s, dailyAmountMinor: v }))}
                      />
                    )}
                    <FormField
                      label="Max penalty (paise)"
                      type="number"
                      value={form.maxPenaltyMinor}
                      onChange={(v) => setForm((s) => ({ ...s, maxPenaltyMinor: v }))}
                    />
                    <FormSelect
                      label="Apply on"
                      value={form.applyOn}
                      options={APPLY_ON}
                      onChange={(v) => setForm((s) => ({ ...s, applyOn: v }))}
                    />
                    <FormField
                      label="Priority"
                      type="number"
                      value={form.priority}
                      onChange={(v) => setForm((s) => ({ ...s, priority: v }))}
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
