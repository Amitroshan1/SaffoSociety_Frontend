import { useEffect, useState } from 'react';
import { ArrowLeft, Layers, Save } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  ConfirmDialog,
  FormField,
  FormLayout,
  FormSelect,
} from '@/components/common/index.js';
import Spinner from '@/common/Spinner.jsx';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import { listBuildings } from '@/services/building.service.js';
import {
  activateWing,
  createWing,
  deactivateWing,
  getWing,
  updateWing,
} from '@/services/wing.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const WING_TYPE_OPTIONS = ['', 'residential', 'commercial', 'service', 'mixed'];
const OPERATION_STATUS_OPTIONS = ['operational', 'under_maintenance', 'blocked'];

const initialForm = {
  buildingId: '',
  name: '',
  displayName: '',
  code: '',
  shortCode: '',
  description: '',
  wingType: '',
  status: 'operational',
  sequence: '0',
  color: '',
  totalFloors: '',
  totalFlats: '',
  elevatorCount: '',
  emergencyStairCount: '',
  capacity: '',
  notes: '',
};

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function toPayload(form, { includeCode = true, includeMetadata = false } = {}) {
  const payload = {
    buildingId: form.buildingId,
    name: form.name.trim(),
    displayName: form.displayName.trim() || null,
    shortCode: form.shortCode.trim() || null,
    description: form.description.trim() || null,
    wingType: form.wingType || null,
    status: form.status,
    sequence: Number(form.sequence) || 0,
    color: form.color.trim() || null,
    totalFloors: toNumberOrNull(form.totalFloors),
    totalFlats: toNumberOrNull(form.totalFlats),
    elevatorCount: toNumberOrNull(form.elevatorCount),
    emergencyStairCount: toNumberOrNull(form.emergencyStairCount),
    capacity: toNumberOrNull(form.capacity),
    notes: form.notes.trim() || null,
  };
  if (includeCode) payload.code = form.code.trim().toUpperCase();
  if (includeMetadata) payload.metadata = {};
  return payload;
}

function toForm(wing) {
  return {
    buildingId: wing.buildingId || '',
    name: wing.name || '',
    displayName: wing.displayName || '',
    code: wing.code || '',
    shortCode: wing.shortCode || '',
    description: wing.description || '',
    wingType: wing.wingType || '',
    status: wing.status || 'operational',
    sequence: wing.sequence ?? 0,
    color: wing.color || '',
    totalFloors: wing.totalFloors ?? '',
    totalFlats: wing.totalFlats ?? '',
    elevatorCount: wing.elevatorCount ?? '',
    emergencyStairCount: wing.emergencyStairCount ?? '',
    capacity: wing.capacity ?? '',
    notes: wing.notes || '',
  };
}

export default function WingFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isCreate = !id;
  const initialBuildingId = searchParams.get('buildingId') || '';

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wing, setWing] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [form, setForm] = useState({ ...initialForm, buildingId: initialBuildingId });
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    listBuildings({ pageSize: 100, sortBy: 'name', sortOrder: 'asc', isActive: true })
      .then(({ data }) => setBuildings(data.data?.buildings || []))
      .catch(() => setBuildings([]));
  }, []);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getWing(id);
        const w = data.data?.wing ?? data.data;
        if (cancelled) return;
        setWing(w);
        setForm(toForm(w));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load wing');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/wings');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const payload = toPayload(form, { includeCode: isCreate, includeMetadata: isCreate });
    try {
      if (isCreate) {
        const res = await createWing(payload);
        navigate('/admin/wings', {
          replace: true,
          state: { success: res.data.message || 'Wing created' },
        });
        return;
      }
      const res = await updateWing(id, payload);
      const w = res.data.data?.wing ?? res.data.data;
      if (w) {
        setWing(w);
        setForm(toForm(w));
      }
      setSuccess(res.data.message || 'Wing updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!wing) return;
    setSaving(true);
    setConfirmDeactivate(false);
    setError('');
    try {
      const apiCall = wing.isActive ? deactivateWing : activateWing;
      const { data } = await apiCall(wing.id);
      const w = data.data?.wing ?? data.data;
      setWing(w);
      setForm(toForm(w));
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
      active="wings"
      onChange={(navId) => {
        if (navId === 'wings') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Wings' },
        { label: isCreate ? 'Create' : wing?.name || 'Details' },
      ]}
    >
      <PageHeader
        icon={Layers}
        iconColor="#a5b4fc"
        title={isCreate ? 'Create Wing' : wing?.name || 'Wing Details'}
        subtitle={
          isCreate
            ? 'Add a wing under a building.'
            : 'View and edit wing identity, structure, and capacity.'
        }
        action={
          !isCreate && wing ? (
            <button
              className="btn-primary"
              type="button"
              onClick={() => (wing.isActive ? setConfirmDeactivate(true) : toggleActive())}
              disabled={saving}
            >
              {wing.isActive ? 'Deactivate' : 'Activate'}
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

      {!isCreate && wing && (
        <div style={{ marginBottom: 12 }}>
          <button
            className="btn-primary"
            type="button"
            onClick={() =>
              navigate(`/admin/flats?wingId=${wing.id}&buildingId=${wing.buildingId}`)
            }
          >
            Manage flats for {wing.name}
          </button>
        </div>
      )}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <form onSubmit={onSubmit}>
          <FormLayout
            sections={[
              {
                title: 'Parent & Identity',
                content: (
                  <>
                    <FormSelect
                      label="Building *"
                      value={form.buildingId}
                      options={buildings.map((b) => ({
                        value: b.id,
                        label: `${b.name} (${b.code})`,
                      }))}
                      onChange={(v) => setForm((s) => ({ ...s, buildingId: v }))}
                      required
                      disabled={!isCreate}
                    />
                    <FormField
                      label="Name *"
                      value={form.name}
                      onChange={(v) => setForm((s) => ({ ...s, name: v }))}
                      required
                    />
                    <FormField
                      label="Display Name"
                      value={form.displayName}
                      onChange={(v) => setForm((s) => ({ ...s, displayName: v }))}
                    />
                    <FormField
                      label="Code *"
                      value={form.code}
                      onChange={(v) => setForm((s) => ({ ...s, code: v.toUpperCase() }))}
                      required={isCreate}
                      disabled={!isCreate}
                    />
                    <FormField
                      label="Short Code"
                      value={form.shortCode}
                      onChange={(v) => setForm((s) => ({ ...s, shortCode: v.toUpperCase() }))}
                    />
                    <FormSelect
                      label="Wing Type"
                      value={form.wingType}
                      options={WING_TYPE_OPTIONS}
                      onChange={(v) => setForm((s) => ({ ...s, wingType: v }))}
                    />
                    <FormSelect
                      label="Status"
                      value={form.status}
                      options={OPERATION_STATUS_OPTIONS}
                      onChange={(v) => setForm((s) => ({ ...s, status: v }))}
                    />
                    <FormField
                      label="Sequence"
                      value={form.sequence}
                      onChange={(v) => setForm((s) => ({ ...s, sequence: v }))}
                    />
                    <FormField
                      label="Color (#hex)"
                      value={form.color}
                      onChange={(v) => setForm((s) => ({ ...s, color: v }))}
                    />
                    <FormField
                      textarea
                      label="Description"
                      value={form.description}
                      onChange={(v) => setForm((s) => ({ ...s, description: v }))}
                    />
                  </>
                ),
              },
              {
                title: 'Structure & Capacity',
                content: (
                  <>
                    <FormField
                      label="Total Floors"
                      value={form.totalFloors}
                      onChange={(v) => setForm((s) => ({ ...s, totalFloors: v }))}
                    />
                    <FormField
                      label="Total Flats"
                      value={form.totalFlats}
                      onChange={(v) => setForm((s) => ({ ...s, totalFlats: v }))}
                    />
                    <FormField
                      label="Capacity (unit slots)"
                      value={form.capacity}
                      onChange={(v) => setForm((s) => ({ ...s, capacity: v }))}
                    />
                    <FormField
                      label="Elevators"
                      value={form.elevatorCount}
                      onChange={(v) => setForm((s) => ({ ...s, elevatorCount: v }))}
                    />
                    <FormField
                      label="Emergency Stairs"
                      value={form.emergencyStairCount}
                      onChange={(v) => setForm((s) => ({ ...s, emergencyStairCount: v }))}
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
            <button
              className="btn-primary"
              type="submit"
              disabled={saving || (isCreate && !form.buildingId)}
            >
              <Save size={14} />
              {saving ? 'Saving...' : isCreate ? 'Create wing' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>

      <ConfirmDialog
        open={confirmDeactivate}
        title="Deactivate wing?"
        message="This wing will be hidden from active lists but kept for future Flats linking."
        confirmLabel="Deactivate"
        variant="danger"
        loading={saving}
        onConfirm={toggleActive}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </AppShell>
  );
}
