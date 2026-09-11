import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Tags } from 'lucide-react';
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
  activateChargeHead,
  createChargeHead,
  deactivateChargeHead,
  getChargeHead,
  updateChargeHead,
} from '../../../services/billing.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const CATEGORIES = [
  'maintenance',
  'water',
  'parking',
  'security',
  'lift',
  'sinking_fund',
  'repair_fund',
  'club_house',
  'electricity',
  'property_tax',
  'other',
];

const initialForm = {
  code: '',
  name: '',
  category: 'maintenance',
  defaultAmountMinor: '0',
  isRecurring: 'true',
  isTaxable: 'false',
  glCode: '',
  displayOrder: '0',
  description: '',
  notes: '',
};

function toForm(row) {
  return {
    code: row.code || '',
    name: row.name || '',
    category: row.category || 'maintenance',
    defaultAmountMinor: String(row.defaultAmountMinor ?? 0),
    isRecurring: row.isRecurring ? 'true' : 'false',
    isTaxable: row.isTaxable ? 'true' : 'false',
    glCode: row.glCode || '',
    displayOrder: String(row.displayOrder ?? 0),
    description: row.description || '',
    notes: row.notes || '',
  };
}

export default function ChargeHeadFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [chargeHead, setChargeHead] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getChargeHead(id);
        const row = data.data?.chargeHead ?? data.data;
        if (cancelled) return;
        setChargeHead(row);
        setForm(toForm(row));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load charge head');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/charge-heads');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category,
        defaultAmountMinor: Number(form.defaultAmountMinor) || 0,
        isRecurring: form.isRecurring === 'true',
        isTaxable: form.isTaxable === 'true',
        glCode: form.glCode.trim() || null,
        displayOrder: Number(form.displayOrder) || 0,
        description: form.description.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (isCreate) {
        const res = await createChargeHead(payload);
        navigate('/admin/charge-heads', {
          replace: true,
          state: { success: res.data.message || 'Charge head created' },
        });
        return;
      }
      const { code, ...updatePayload } = payload;
      const res = await updateChargeHead(id, updatePayload);
      const row = res.data.data?.chargeHead ?? res.data.data;
      if (row) {
        setChargeHead(row);
        setForm(toForm(row));
      }
      setSuccess(res.data.message || 'Charge head updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!chargeHead) return;
    setSaving(true);
    setError('');
    try {
      const apiCall = chargeHead.isActive ? deactivateChargeHead : activateChargeHead;
      const { data } = await apiCall(chargeHead.id);
      const row = data.data?.chargeHead ?? data.data;
      setChargeHead(row);
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
      active="charge-heads"
      onChange={(navId) => {
        if (navId === 'charge-heads') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Charge Heads' },
        { label: isCreate ? 'Create' : chargeHead?.name || 'Details' },
      ]}
    >
      <PageHeader
        icon={Tags}
        iconColor="#93c5fd"
        title={isCreate ? 'Create Charge Head' : chargeHead?.name || 'Charge Head Details'}
        subtitle={
          isCreate
            ? 'Add a maintenance or special charge to the catalog.'
            : 'View and edit charge head details.'
        }
        action={
          !isCreate && chargeHead ? (
            <button className="btn-primary" type="button" onClick={toggleActive} disabled={saving}>
              {chargeHead.isActive ? 'Deactivate' : 'Activate'}
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
                      label="Category"
                      value={form.category}
                      options={CATEGORIES}
                      onChange={(v) => setForm((s) => ({ ...s, category: v }))}
                    />
                    <FormField
                      label="Default amount (paise)"
                      type="number"
                      value={form.defaultAmountMinor}
                      onChange={(v) => setForm((s) => ({ ...s, defaultAmountMinor: v }))}
                    />
                    <FormSelect
                      label="Recurring"
                      value={form.isRecurring}
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                      ]}
                      onChange={(v) => setForm((s) => ({ ...s, isRecurring: v }))}
                    />
                    <FormSelect
                      label="Taxable"
                      value={form.isTaxable}
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                      ]}
                      onChange={(v) => setForm((s) => ({ ...s, isTaxable: v }))}
                    />
                    <FormField
                      label="GL code"
                      value={form.glCode}
                      onChange={(v) => setForm((s) => ({ ...s, glCode: v }))}
                    />
                    <FormField
                      label="Display order"
                      type="number"
                      value={form.displayOrder}
                      onChange={(v) => setForm((s) => ({ ...s, displayOrder: v }))}
                    />
                    <FormField
                      textarea
                      label="Description"
                      value={form.description}
                      onChange={(v) => setForm((s) => ({ ...s, description: v }))}
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
