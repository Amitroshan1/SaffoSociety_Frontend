import { useEffect, useState } from 'react';
import { ArrowLeft, DoorOpen, Save } from 'lucide-react';
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
  activateGate,
  createGate,
  deactivateGate,
  getGate,
  updateGate,
} from '../../../services/gate.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const GATE_TYPES = ['main', 'service', 'pedestrian', 'vehicle', 'basement', 'emergency', 'other'];

const initialForm = {
  code: '',
  name: '',
  gateType: 'main',
  locationDescription: '',
  sequence: '0',
  notes: '',
};

function toForm(gate) {
  return {
    code: gate.code || '',
    name: gate.name || '',
    gateType: gate.gateType || 'main',
    locationDescription: gate.locationDescription || '',
    sequence: String(gate.sequence ?? 0),
    notes: gate.notes || '',
  };
}

export default function GateFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gate, setGate] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getGate(id);
        const g = data.data?.gate ?? data.data;
        if (cancelled) return;
        setGate(g);
        setForm(toForm(g));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load gate');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/gates');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (isCreate) {
        const payload = {
          code: form.code.trim(),
          name: form.name.trim(),
          gateType: form.gateType,
          locationDescription: form.locationDescription.trim() || null,
          sequence: Number(form.sequence) || 0,
          notes: form.notes.trim() || null,
        };
        const res = await createGate(payload);
        navigate('/admin/gates', {
          replace: true,
          state: { success: res.data.message || 'Gate created' },
        });
        return;
      }
      const res = await updateGate(id, {
        name: form.name.trim(),
        gateType: form.gateType,
        locationDescription: form.locationDescription.trim() || null,
        sequence: Number(form.sequence) || 0,
        notes: form.notes.trim() || null,
      });
      const g = res.data.data?.gate ?? res.data.data;
      if (g) {
        setGate(g);
        setForm(toForm(g));
      }
      setSuccess(res.data.message || 'Gate updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!gate) return;
    setSaving(true);
    setError('');
    try {
      const apiCall = gate.isActive ? deactivateGate : activateGate;
      const { data } = await apiCall(gate.id);
      const g = data.data?.gate ?? data.data;
      setGate(g);
      setForm(toForm(g));
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
      active="gates"
      onChange={(navId) => {
        if (navId === 'gates') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Gates' },
        { label: isCreate ? 'Create' : gate?.name || 'Details' },
      ]}
    >
      <PageHeader
        icon={DoorOpen}
        iconColor="#93c5fd"
        title={isCreate ? 'Create Gate' : gate?.name || 'Gate Details'}
        subtitle={
          isCreate
            ? 'Register a new entry point for visitor and staff ops.'
            : 'View and edit gate details.'
        }
        action={
          !isCreate && gate ? (
            <button className="btn-primary" type="button" onClick={toggleActive} disabled={saving}>
              {gate.isActive ? 'Deactivate' : 'Activate'}
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
                title: 'Gate details',
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
                      label="Type"
                      value={form.gateType}
                      options={GATE_TYPES}
                      onChange={(v) => setForm((s) => ({ ...s, gateType: v }))}
                    />
                    <FormField
                      label="Location"
                      value={form.locationDescription}
                      onChange={(v) => setForm((s) => ({ ...s, locationDescription: v }))}
                    />
                    <FormField
                      label="Sequence"
                      value={form.sequence}
                      onChange={(v) => setForm((s) => ({ ...s, sequence: v }))}
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
              <Save size={14} /> {saving ? 'Saving...' : isCreate ? 'Create gate' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
