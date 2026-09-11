import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  ConfirmDialog,
  FormField,
  FormLayout,
} from '../../../components/common/index.js';
import Spinner from '../../../common/Spinner.jsx';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import {
  activateResident,
  createResident,
  deactivateResident,
  getResident,
  updateResident,
} from '../../../services/resident.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  dob: '',
  notes: '',
};

function toPayload(form, { includeMetadata = false } = {}) {
  const payload = {
    name: form.name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    gender: form.gender.trim() || null,
    dob: form.dob || null,
    notes: form.notes.trim() || null,
  };
  if (includeMetadata) payload.metadata = {};
  return payload;
}

function toForm(resident) {
  return {
    name: resident.name || '',
    email: resident.email || '',
    phone: resident.phone || '',
    gender: resident.gender || '',
    dob: resident.dob || '',
    notes: resident.notes || '',
  };
}

export default function ResidentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resident, setResident] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getResident(id);
        const r = data.data?.resident ?? data.data;
        if (cancelled) return;
        setResident(r);
        setForm(toForm(r));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load resident');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/residents');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const payload = toPayload(form, { includeMetadata: isCreate });
    try {
      if (isCreate) {
        const res = await createResident(payload);
        navigate('/admin/residents', {
          replace: true,
          state: { success: res.data.message || 'Resident created' },
        });
        return;
      }
      const res = await updateResident(id, payload);
      const r = res.data.data?.resident ?? res.data.data;
      if (r) {
        setResident(r);
        setForm(toForm(r));
      }
      setSuccess(res.data.message || 'Resident updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!resident) return;
    setSaving(true);
    setConfirmDeactivate(false);
    setError('');
    try {
      const apiCall = resident.isActive ? deactivateResident : activateResident;
      const { data } = await apiCall(resident.id);
      const r = data.data?.resident ?? data.data;
      setResident(r);
      setForm(toForm(r));
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
      active="residents"
      onChange={(navId) => {
        if (navId === 'residents') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Residents' },
        { label: isCreate ? 'Create' : resident?.name || 'Details' },
      ]}
    >
      <PageHeader
        icon={Users}
        iconColor="#93c5fd"
        title={isCreate ? 'Create Resident' : resident?.name || 'Resident Details'}
        subtitle={
          isCreate
            ? 'Register a person known to the society.'
            : 'View and edit resident identity. Location comes from occupancy.'
        }
        action={
          !isCreate && resident ? (
            <button
              className="btn-primary"
              type="button"
              onClick={() => (resident.isActive ? setConfirmDeactivate(true) : toggleActive())}
              disabled={saving}
            >
              {resident.isActive ? 'Deactivate' : 'Activate'}
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

      {error && <div style={{ marginBottom: 12, color: '#fca5a5', fontSize: 14 }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac', fontSize: 14 }}>{success}</div>}

      {!isCreate && resident?.currentOccupancies?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate(`/admin/occupancies?residentId=${resident.id}`)}
          >
            View occupancies ({resident.currentOccupancies.length})
          </button>
        </div>
      )}

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
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(v) => setForm((s) => ({ ...s, email: v }))}
                    />
                    <FormField
                      label="Phone"
                      value={form.phone}
                      onChange={(v) => setForm((s) => ({ ...s, phone: v }))}
                    />
                    <FormField
                      label="Gender"
                      value={form.gender}
                      onChange={(v) => setForm((s) => ({ ...s, gender: v }))}
                    />
                    <FormField
                      label="Date of birth"
                      type="date"
                      value={form.dob}
                      onChange={(v) => setForm((s) => ({ ...s, dob: v }))}
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
              <Save size={14} />
              {saving ? 'Saving...' : isCreate ? 'Create resident' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>

      <ConfirmDialog
        open={confirmDeactivate}
        title="Deactivate resident?"
        message="Cannot deactivate while active occupancies exist. End occupancies first."
        confirmLabel="Deactivate"
        variant="danger"
        loading={saving}
        onConfirm={toggleActive}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </AppShell>
  );
}
