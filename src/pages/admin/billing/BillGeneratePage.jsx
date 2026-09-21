import { useEffect, useState } from 'react';
import { FilePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import { FormField, FormLayout, FormSelect } from '@/components/common/index.js';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import {
  generateBills,
  listBillingCycles,
  listChargeHeads,
  listFinancialYears,
} from '@/services/billing.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const initialForm = {
  cycleId: '',
  financialYearId: '',
  periodFrom: '',
  periodTo: '',
  dueDate: '',
  autoPublish: 'false',
  chargeHeadIds: '',
  title: '',
};

export default function BillGeneratePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [cycles, setCycles] = useState([]);
  const [years, setYears] = useState([]);
  const [heads, setHeads] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    listBillingCycles({ pageSize: 100, isActive: true, sortBy: 'name', sortOrder: 'asc' })
      .then((r) => setCycles(r.data?.data?.billingCycles || []))
      .catch(() => {});
    listFinancialYears({ pageSize: 50, sortBy: 'start_date', sortOrder: 'desc' })
      .then((r) => setYears(r.data?.data?.financialYears || []))
      .catch(() => {});
    listChargeHeads({ pageSize: 100, isActive: true, sortBy: 'display_order', sortOrder: 'asc' })
      .then((r) => setHeads(r.data?.data?.chargeHeads || []))
      .catch(() => {});
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    setResult(null);
    try {
      const chargeHeadIds = form.chargeHeadIds
        ? form.chargeHeadIds.split(/[\s,]+/).filter(Boolean)
        : heads.map((h) => h.id);
      if (!chargeHeadIds.length) {
        setError('Select at least one charge head (comma-separated IDs or ensure heads exist)');
        setSaving(false);
        return;
      }
      const { data } = await generateBills({
        cycleId: form.cycleId,
        financialYearId: form.financialYearId,
        periodFrom: form.periodFrom,
        periodTo: form.periodTo,
        dueDate: form.dueDate,
        autoPublish: form.autoPublish === 'true',
        chargeHeadIds,
        title: form.title.trim() || null,
      });
      setResult(data.data || null);
      setSuccess(data.message || 'Bills generated');
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      active="bill-generate"
      onChange={(id) => ADMIN_ROUTES[id] && navigate(ADMIN_ROUTES[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Generate Bills' }]}
    >
      <PageHeader
        icon={FilePlus}
        iconColor="#86efac"
        title="Generate Bills"
        subtitle="Bulk generate bills for a billing cycle and period."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <form onSubmit={onSubmit}>
          <FormLayout
            sections={[
              {
                title: 'Generation parameters',
                content: (
                  <>
                    <FormSelect
                      label="Billing cycle *"
                      value={form.cycleId}
                      options={cycles.map((c) => ({
                        value: c.id,
                        label: `${c.code} — ${c.name}`,
                      }))}
                      onChange={(v) => setForm((s) => ({ ...s, cycleId: v }))}
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
                      label="Period from *"
                      type="date"
                      value={form.periodFrom}
                      onChange={(v) => setForm((s) => ({ ...s, periodFrom: v }))}
                      required
                    />
                    <FormField
                      label="Period to *"
                      type="date"
                      value={form.periodTo}
                      onChange={(v) => setForm((s) => ({ ...s, periodTo: v }))}
                      required
                    />
                    <FormField
                      label="Due date *"
                      type="date"
                      value={form.dueDate}
                      onChange={(v) => setForm((s) => ({ ...s, dueDate: v }))}
                      required
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
                    <FormSelect
                      label="Primary charge head (optional shortcut)"
                      value=""
                      options={heads.map((h) => ({
                        value: h.id,
                        label: `${h.code} — ${h.name}`,
                      }))}
                      onChange={(v) => {
                        if (!v) return;
                        setForm((s) => ({
                          ...s,
                          chargeHeadIds: s.chargeHeadIds
                            ? `${s.chargeHeadIds},${v}`
                            : v,
                        }));
                      }}
                      placeholder="Add charge head"
                    />
                    <FormField
                      label="Charge head IDs (comma-separated; blank = all active)"
                      value={form.chargeHeadIds}
                      onChange={(v) => setForm((s) => ({ ...s, chargeHeadIds: v }))}
                    />
                    <FormField
                      label="Title override"
                      value={form.title}
                      onChange={(v) => setForm((s) => ({ ...s, title: v }))}
                    />
                  </>
                ),
              },
            ]}
          />
          <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop: 16 }}>
            {saving ? 'Generating...' : 'Generate bills'}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: 20 }}>
            <h4>Result</h4>
            <pre style={{ overflow: 'auto', fontSize: 12, maxHeight: 320 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </AppShell>
  );
}
