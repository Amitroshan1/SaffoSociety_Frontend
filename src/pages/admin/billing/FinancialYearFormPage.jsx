import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarRange, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  DataTable,
  FormField,
  FormLayout,
} from '@/components/common/index.js';
import Spinner from '@/common/Spinner.jsx';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import {
  closeAccountingPeriod,
  closeFinancialYear,
  createFinancialYear,
  getFinancialYear,
  listAccountingPeriods,
} from '@/services/billing.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const PERIOD_COLUMNS = [
  { key: 'periodKey', label: 'Period' },
  { key: 'startDate', label: 'Start' },
  { key: 'endDate', label: 'End' },
  { key: 'status', label: 'Status' },
];

const initialForm = {
  code: '',
  name: '',
  startDate: '',
  endDate: '',
  notes: '',
};

export default function FinancialYearFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [financialYear, setFinancialYear] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [form, setForm] = useState(initialForm);

  const loadPeriods = async (fyId) => {
    try {
      const { data } = await listAccountingPeriods({
        financialYearId: fyId,
        pageSize: 24,
        sortBy: 'start_date',
        sortOrder: 'asc',
      });
      setPeriods(data.data?.accountingPeriods || []);
    } catch {
      setPeriods([]);
    }
  };

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getFinancialYear(id);
        const row = data.data?.financialYear ?? data.data;
        if (cancelled) return;
        setFinancialYear(row);
        await loadPeriods(row.id || id);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load financial year');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/financial-years');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isCreate) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await createFinancialYear({
        code: form.code.trim(),
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes.trim() || null,
      });
      navigate('/admin/financial-years', {
        replace: true,
        state: { success: res.data.message || 'Financial year created' },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseFy = async () => {
    if (!financialYear) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await closeFinancialYear(financialYear.id, {});
      const row = data.data?.financialYear ?? data.data;
      if (row) setFinancialYear(row);
      else setFinancialYear((s) => (s ? { ...s, status: 'closed' } : s));
      setSuccess(data.message || 'Financial year closed');
      await loadPeriods(financialYear.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Close failed');
    } finally {
      setSaving(false);
    }
  };

  const handleClosePeriod = async (period) => {
    setSaving(true);
    setError('');
    try {
      await closeAccountingPeriod(period.id, {});
      setSuccess(`Period ${period.periodKey} closed`);
      if (financialYear) await loadPeriods(financialYear.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Period close failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <AppShell
      active="financial-years"
      onChange={(navId) => {
        if (navId === 'financial-years') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Financial Years' },
        { label: isCreate ? 'Create' : financialYear?.code || 'Details' },
      ]}
    >
      <PageHeader
        icon={CalendarRange}
        iconColor="#fde68a"
        title={
          isCreate
            ? 'Create Financial Year'
            : financialYear
              ? `${financialYear.code} — ${financialYear.name}`
              : 'Financial Year Details'
        }
        subtitle={
          isCreate
            ? 'Set up a new financial year and date range.'
            : 'View periods and close FY or accounting periods.'
        }
        action={
          !isCreate && financialYear && financialYear.status !== 'closed' ? (
            <button className="btn-primary" type="button" onClick={handleCloseFy} disabled={saving}>
              Close FY
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
                  title: 'Details',
                  content: (
                    <>
                      <FormField
                        label="Code *"
                        value={form.code}
                        onChange={(v) => setForm((s) => ({ ...s, code: v }))}
                        required
                      />
                      <FormField
                        label="Name *"
                        value={form.name}
                        onChange={(v) => setForm((s) => ({ ...s, name: v }))}
                        required
                      />
                      <FormField
                        label="Start date *"
                        type="date"
                        value={form.startDate}
                        onChange={(v) => setForm((s) => ({ ...s, startDate: v }))}
                        required
                      />
                      <FormField
                        label="End date *"
                        type="date"
                        value={form.endDate}
                        onChange={(v) => setForm((s) => ({ ...s, endDate: v }))}
                        required
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
              <Save size={14} /> {saving ? 'Saving...' : 'Create FY'}
            </button>
          </form>
        </section>
      ) : (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          {financialYear && (
            <div style={{ marginBottom: 16 }}>
              <p>
                <strong>Status:</strong> {financialYear.status}
              </p>
              <p>
                <strong>Start:</strong> {financialYear.startDate}
              </p>
              <p>
                <strong>End:</strong> {financialYear.endDate}
              </p>
              {financialYear.notes && (
                <p>
                  <strong>Notes:</strong> {financialYear.notes}
                </p>
              )}
            </div>
          )}
          <h3 style={{ marginTop: 0 }}>Accounting periods</h3>
          <DataTable
            columns={[
              ...PERIOD_COLUMNS,
              {
                key: 'actions',
                label: 'Actions',
                render: (row) =>
                  row.status === 'open' ? (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleClosePeriod(row)}
                      disabled={saving}
                    >
                      Close
                    </button>
                  ) : (
                    '—'
                  ),
              },
            ]}
            rows={periods}
            emptyTitle="No periods"
          />
        </section>
      )}
    </AppShell>
  );
}
