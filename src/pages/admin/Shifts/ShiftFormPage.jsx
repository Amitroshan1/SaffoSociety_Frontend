import { useEffect, useState } from 'react';
import { ArrowLeft, Clock3, Plus, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  FormField,
  FormLayout,
  FormSelect,
} from '@/components/common/index.js';
import Spinner from '@/common/Spinner.jsx';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import { listGates } from '@/services/gate.service.js';
import { listStaff } from '@/services/staff.service.js';
import {
  cancelShift,
  completeShift,
  createShift,
  getShift,
  markNoShow,
  startShift,
  updateShift,
} from '@/services/shift.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const SHIFT_TYPES = ['morning', 'evening', 'night', 'custom'];

const initialForm = {
  staffId: '',
  gateId: '',
  shiftDate: '',
  shiftType: 'morning',
  scheduledStart: '',
  scheduledEnd: '',
  notes: '',
};

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toForm(shift) {
  return {
    staffId: shift.staffId || '',
    gateId: shift.gateId || '',
    shiftDate: shift.shiftDate ? String(shift.shiftDate).slice(0, 10) : '',
    shiftType: shift.shiftType || 'morning',
    scheduledStart: toLocalInput(shift.scheduledStart),
    scheduledEnd: toLocalInput(shift.scheduledEnd),
    notes: shift.notes || '',
  };
}

export default function ShiftFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shift, setShift] = useState(null);
  const [staff, setStaff] = useState([]);
  const [gates, setGates] = useState([]);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    Promise.all([
      listStaff({ pageSize: 100, isActive: true, sortBy: 'name', sortOrder: 'asc' }),
      listGates({ pageSize: 100, isActive: true, sortBy: 'sequence', sortOrder: 'asc' }),
    ])
      .then(([s, g]) => {
        setStaff(s.data.data?.staff || []);
        setGates(g.data.data?.gates || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getShift(id);
        const row = data.data?.shift ?? data.data;
        if (cancelled) return;
        setShift(row);
        setForm(toForm(row));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load shift');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/shifts');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        staffId: form.staffId,
        gateId: form.gateId || null,
        shiftDate: form.shiftDate,
        shiftType: form.shiftType,
        scheduledStart: new Date(form.scheduledStart).toISOString(),
        scheduledEnd: new Date(form.scheduledEnd).toISOString(),
        notes: form.notes.trim() || null,
      };
      if (isCreate) {
        const res = await createShift(payload);
        navigate('/admin/shifts', {
          replace: true,
          state: { success: res.data.message || 'Shift created' },
        });
        return;
      }
      const res = await updateShift(id, payload);
      const row = res.data.data?.shift ?? res.data.data;
      if (row) {
        setShift(row);
        setForm(toForm(row));
      }
      setSuccess(res.data.message || 'Shift updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onAction = async (action) => {
    if (!shift) return;
    setSaving(true);
    setError('');
    try {
      const fn = {
        start: startShift,
        complete: completeShift,
        cancel: cancelShift,
        noshow: markNoShow,
      }[action];
      const { data } = await fn(shift.id, {});
      const row = data.data?.shift ?? data.data;
      if (row) {
        setShift(row);
        setForm(toForm(row));
      }
      setSuccess(data.message || 'Updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <AppShell
      active="shifts"
      onChange={(navId) => {
        if (navId === 'shifts') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Shifts' },
        { label: isCreate ? 'Create' : shift?.staffName || 'Details' },
      ]}
    >
      <PageHeader
        icon={Clock3}
        iconColor="#fde68a"
        title={isCreate ? 'Schedule Shift' : `${shift?.staffName || 'Shift'} — ${shift?.status || ''}`}
        subtitle={
          isCreate
            ? 'Assign staff to a gate and time window.'
            : 'View shift details and run status actions.'
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
                title: 'Shift',
                content: (
                  <>
                    <FormSelect
                      label="Staff *"
                      value={form.staffId}
                      options={staff.map((s) => ({ value: s.id, label: `${s.code} — ${s.name}` }))}
                      onChange={(v) => setForm((f) => ({ ...f, staffId: v }))}
                      required
                      disabled={!isCreate && shift?.status !== 'scheduled'}
                    />
                    <FormSelect
                      label="Gate"
                      value={form.gateId}
                      options={[
                        { value: '', label: 'None' },
                        ...gates.map((g) => ({ value: g.id, label: `${g.code} — ${g.name}` })),
                      ]}
                      onChange={(v) => setForm((f) => ({ ...f, gateId: v }))}
                      disabled={!isCreate && shift?.status !== 'scheduled'}
                    />
                    <FormField
                      type="date"
                      label="Date *"
                      value={form.shiftDate}
                      onChange={(v) => setForm((f) => ({ ...f, shiftDate: v }))}
                      required
                      disabled={!isCreate && shift?.status !== 'scheduled'}
                    />
                    <FormSelect
                      label="Type"
                      value={form.shiftType}
                      options={SHIFT_TYPES}
                      onChange={(v) => setForm((f) => ({ ...f, shiftType: v }))}
                      disabled={!isCreate && shift?.status !== 'scheduled'}
                    />
                    <FormField
                      type="datetime-local"
                      label="Start *"
                      value={form.scheduledStart}
                      onChange={(v) => setForm((f) => ({ ...f, scheduledStart: v }))}
                      required
                      disabled={!isCreate && shift?.status !== 'scheduled'}
                    />
                    <FormField
                      type="datetime-local"
                      label="End *"
                      value={form.scheduledEnd}
                      onChange={(v) => setForm((f) => ({ ...f, scheduledEnd: v }))}
                      required
                      disabled={!isCreate && shift?.status !== 'scheduled'}
                    />
                    <FormField
                      textarea
                      label="Notes"
                      value={form.notes}
                      onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
                      disabled={!isCreate && shift?.status !== 'scheduled'}
                    />
                  </>
                ),
              },
            ]}
          />
          {(isCreate || shift?.status === 'scheduled') && (
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button className="btn-primary" type="submit" disabled={saving || !form.staffId}>
                {isCreate ? <Plus size={14} /> : <Save size={14} />}
                {saving ? 'Saving...' : isCreate ? 'Create shift' : 'Save changes'}
              </button>
            </div>
          )}
        </form>
      </section>

      {!isCreate && shift && (shift.status === 'scheduled' || shift.status === 'active') && (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Actions</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {shift.status === 'scheduled' && (
              <>
                <button className="btn-primary" type="button" onClick={() => onAction('start')} disabled={saving}>
                  Start
                </button>
                <button className="btn-primary" type="button" onClick={() => onAction('cancel')} disabled={saving}>
                  Cancel
                </button>
                <button className="btn-primary" type="button" onClick={() => onAction('noshow')} disabled={saving}>
                  No-show
                </button>
              </>
            )}
            {shift.status === 'active' && (
              <button className="btn-primary" type="button" onClick={() => onAction('complete')} disabled={saving}>
                Complete
              </button>
            )}
          </div>
        </section>
      )}
    </AppShell>
  );
}
