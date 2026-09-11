import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarClock, Save } from 'lucide-react';
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
  activateBillingCycle,
  createBillingCycle,
  deactivateBillingCycle,
  getBillingCycle,
  updateBillingCycle,
} from '../../../services/billing.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const FREQUENCIES = ['monthly', 'quarterly', 'half_yearly', 'yearly', 'manual', 'custom'];

const initialForm = {
  code: '',
  name: '',
  frequency: 'monthly',
  dayOfMonth: '1',
  defaultDueDays: '10',
  autoPublish: 'false',
  periodLabelTemplate: '',
  notes: '',
};

function toForm(row) {
  return {
    code: row.code || '',
    name: row.name || '',
    frequency: row.frequency || 'monthly',
    dayOfMonth: String(row.dayOfMonth ?? 1),
    defaultDueDays: String(row.defaultDueDays ?? 10),
    autoPublish: row.autoPublish ? 'true' : 'false',
    periodLabelTemplate: row.periodLabelTemplate || '',
    notes: row.notes || '',
  };
}

export default function BillingCycleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [billingCycle, setBillingCycle] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getBillingCycle(id);
        const row = data.data?.billingCycle ?? data.data;
        if (cancelled) return;
        setBillingCycle(row);
        setForm(toForm(row));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load billing cycle');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/billing-cycles');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        frequency: form.frequency,
        dayOfMonth: form.dayOfMonth ? Number(form.dayOfMonth) : null,
        defaultDueDays: Number(form.defaultDueDays) || 0,
        autoPublish: form.autoPublish === 'true',
        periodLabelTemplate: form.periodLabelTemplate.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (isCreate) {
        const res = await createBillingCycle(payload);
        navigate('/admin/billing-cycles', {
          replace: true,
          state: { success: res.data.message || 'Cycle created' },
        });
        return;
      }
      const { code, ...updatePayload } = payload;
      const res = await updateBillingCycle(id, updatePayload);
      const row = res.data.data?.billingCycle ?? res.data.data;
      if (row) {
        setBillingCycle(row);
        setForm(toForm(row));
      }
      setSuccess(res.data.message || 'Cycle updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!billingCycle) return;
    setSaving(true);
    setError('');
    try {
      const apiCall = billingCycle.isActive ? deactivateBillingCycle : activateBillingCycle;
      const { data } = await apiCall(billingCycle.id);
      const row = data.data?.billingCycle ?? data.data;
      setBillingCycle(row);
      setForm(toForm(row));
      setSuccess(data.message || 'Status updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Status update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <AppShell
      active="billing-cycles"
      onChange={(navId) => {
        if (navId === 'billing-cycles') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Billing Cycles' },
        { label: isCreate ? 'Create' : billingCycle?.name || 'Details' },
      ]}
    >
      <PageHeader
        icon={CalendarClock}
        iconColor="#86efac"
        title={isCreate ? 'Create Billing Cycle' : billingCycle?.name || 'Billing Cycle Details'}
        subtitle={
          isCreate
            ? 'Define a period and generation schedule.'
            : 'View and edit billing cycle details.'
        }
        action={
          !isCreate && billingCycle ? (
            <button className="btn-primary" type="button" onClick={toggleActive} disabled={saving}>
              {billingCycle.isActive ? 'Deactivate' : 'Activate'}
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
                title: 'Details',
                content: (
                  <>
                    {isCreate && (
                      <FormField
                        label="Code *"
                        value={form.code}
                        onChange={(v) => setForm((s) => ({ ...s, code: v }))}
                        required
                      />
                    )}
                    <FormField
                      label="Name *"
                      value={form.name}
                      onChange={(v) => setForm((s) => ({ ...s, name: v }))}
                      required
                    />
                    <FormSelect
                      label="Frequency"
                      value={form.frequency}
                      options={FREQUENCIES}
                      onChange={(v) => setForm((s) => ({ ...s, frequency: v }))}
                    />
                    <FormField
                      label="Day of month"
                      type="number"
                      value={form.dayOfMonth}
                      onChange={(v) => setForm((s) => ({ ...s, dayOfMonth: v }))}
                    />
                    <FormField
                      label="Default due days"
                      type="number"
                      value={form.defaultDueDays}
                      onChange={(v) => setForm((s) => ({ ...s, defaultDueDays: v }))}
                    />
                    <FormSelect
                      label="Auto publish"
                      value={form.autoPublish}
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                      ]}
                      onChange={(v) => setForm((s) => ({ ...s, autoPublish: v }))}
                    />
                    <FormField
                      label="Period label template"
                      value={form.periodLabelTemplate}
                      onChange={(v) => setForm((s) => ({ ...s, periodLabelTemplate: v }))}
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
