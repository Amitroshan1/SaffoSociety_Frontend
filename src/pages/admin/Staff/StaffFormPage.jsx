import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Users } from 'lucide-react';
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
import {
  activateStaff,
  createStaff,
  deactivateStaff,
  getStaff,
  updateStaff,
} from '@/services/staff.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const ROLES = [
  'security_guard',
  'security_supervisor',
  'housekeeping',
  'facility_manager',
  'electrician',
  'plumber',
  'gardener',
  'receptionist',
  'other',
];

const initialForm = {
  name: '',
  phone: '',
  email: '',
  staffRole: 'security_guard',
  employmentType: 'permanent',
  department: '',
  assignedGateId: '',
  notes: '',
};

function toForm(staff) {
  return {
    name: staff.name || '',
    phone: staff.phone || '',
    email: staff.email || '',
    staffRole: staff.staffRole || 'security_guard',
    employmentType: staff.employmentType || 'permanent',
    department: staff.department || '',
    assignedGateId: staff.assignedGateId || '',
    notes: staff.notes || '',
  };
}

export default function StaffFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [staff, setStaff] = useState(null);
  const [gates, setGates] = useState([]);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    listGates({ pageSize: 100, sortBy: 'sequence', sortOrder: 'asc', isActive: true })
      .then((r) => setGates(r.data.data?.gates || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getStaff(id);
        const s = data.data?.staff ?? data.data;
        if (cancelled) return;
        setStaff(s);
        setForm(toForm(s));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load staff');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/staff');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        staffRole: form.staffRole,
        employmentType: form.employmentType || null,
        department: form.department.trim() || null,
        assignedGateId: form.assignedGateId || null,
        notes: form.notes.trim() || null,
      };
      if (isCreate) {
        const res = await createStaff(payload);
        navigate('/admin/staff', {
          replace: true,
          state: { success: res.data.message || 'Staff created' },
        });
        return;
      }
      const res = await updateStaff(id, payload);
      const s = res.data.data?.staff ?? res.data.data;
      if (s) {
        setStaff(s);
        setForm(toForm(s));
      }
      setSuccess(res.data.message || 'Staff updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!staff) return;
    setSaving(true);
    setError('');
    try {
      const apiCall = staff.isActive ? deactivateStaff : activateStaff;
      const { data } = await apiCall(staff.id);
      const s = data.data?.staff ?? data.data;
      setStaff(s);
      setForm(toForm(s));
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
      active="staff"
      onChange={(navId) => {
        if (navId === 'staff') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Staff' },
        { label: isCreate ? 'Create' : staff?.name || 'Details' },
      ]}
    >
      <PageHeader
        icon={Users}
        iconColor="#86efac"
        title={isCreate ? 'Create Staff' : staff?.name || 'Staff Details'}
        subtitle={
          isCreate
            ? 'Add a society employee, security, or facility worker.'
            : 'View and edit staff identity and gate assignment.'
        }
        action={
          !isCreate && staff ? (
            <button className="btn-primary" type="button" onClick={toggleActive} disabled={saving}>
              {staff.isActive ? 'Deactivate' : 'Activate'}
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
                title: 'Identity',
                content: (
                  <>
                    <FormField
                      label="Name *"
                      value={form.name}
                      onChange={(v) => setForm((s) => ({ ...s, name: v }))}
                      required
                    />
                    <FormField
                      label="Phone *"
                      value={form.phone}
                      onChange={(v) => setForm((s) => ({ ...s, phone: v }))}
                      required
                    />
                    <FormField
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(v) => setForm((s) => ({ ...s, email: v }))}
                    />
                    <FormSelect
                      label="Role"
                      value={form.staffRole}
                      options={ROLES}
                      onChange={(v) => setForm((s) => ({ ...s, staffRole: v }))}
                    />
                    <FormSelect
                      label="Employment"
                      value={form.employmentType}
                      options={['permanent', 'contract', 'agency']}
                      onChange={(v) => setForm((s) => ({ ...s, employmentType: v }))}
                    />
                    <FormSelect
                      label="Default Gate"
                      value={form.assignedGateId}
                      options={[
                        { value: '', label: 'None' },
                        ...gates.map((g) => ({ value: g.id, label: `${g.code} — ${g.name}` })),
                      ]}
                      onChange={(v) => setForm((s) => ({ ...s, assignedGateId: v }))}
                    />
                    <FormField
                      label="Department"
                      value={form.department}
                      onChange={(v) => setForm((s) => ({ ...s, department: v }))}
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
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : isCreate ? 'Create staff' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
