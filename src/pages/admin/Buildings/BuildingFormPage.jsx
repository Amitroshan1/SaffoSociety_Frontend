import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
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
import {
  activateBuilding,
  createBuilding,
  deactivateBuilding,
  getBuilding,
  updateBuilding,
} from '@/services/building.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const BUILDING_TYPE_OPTIONS = ['', 'tower', 'block', 'villa', 'commercial', 'mixed'];
const OPERATION_STATUS_OPTIONS = ['operational', 'under_maintenance', 'blocked'];

const initialForm = {
  name: '',
  displayName: '',
  code: '',
  description: '',
  buildingType: '',
  status: 'operational',
  emergencyContactName: '',
  emergencyContactPhone: '',
  totalFloors: '',
  totalUnits: '',
  plannedUnits: '',
  occupiedUnits: '',
  vacantUnits: '',
  imageUrl: '',
  notes: '',
};

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function toPayload(form, { includeCode = true, includeMetadata = false } = {}) {
  const payload = {
    name: form.name.trim(),
    displayName: form.displayName.trim() || null,
    description: form.description.trim() || null,
    buildingType: form.buildingType || null,
    status: form.status,
    emergencyContactName: form.emergencyContactName.trim() || null,
    emergencyContactPhone: form.emergencyContactPhone.trim() || null,
    totalFloors: toNumberOrNull(form.totalFloors),
    totalUnits: toNumberOrNull(form.totalUnits),
    plannedUnits: toNumberOrNull(form.plannedUnits),
    occupiedUnits: toNumberOrNull(form.occupiedUnits),
    vacantUnits: toNumberOrNull(form.vacantUnits),
    imageUrl: form.imageUrl.trim() || null,
    notes: form.notes.trim() || null,
  };
  if (includeCode) payload.code = form.code.trim().toUpperCase();
  if (includeMetadata) payload.metadata = {};
  return payload;
}

function toForm(building) {
  return {
    name: building.name || '',
    displayName: building.displayName || '',
    code: building.code || '',
    description: building.description || '',
    buildingType: building.buildingType || '',
    status: building.status || 'operational',
    emergencyContactName: building.emergencyContactName || '',
    emergencyContactPhone: building.emergencyContactPhone || '',
    totalFloors: building.totalFloors ?? '',
    totalUnits: building.totalUnits ?? '',
    plannedUnits: building.plannedUnits ?? '',
    occupiedUnits: building.occupiedUnits ?? '',
    vacantUnits: building.vacantUnits ?? '',
    imageUrl: building.imageUrl || '',
    notes: building.notes || '',
  };
}

export default function BuildingFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [building, setBuilding] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getBuilding(id);
        const b = data.data?.building ?? data.data;
        if (cancelled) return;
        setBuilding(b);
        setForm(toForm(b));
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load building');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/buildings');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const payload = toPayload(form, { includeCode: isCreate, includeMetadata: isCreate });
    try {
      if (isCreate) {
        const res = await createBuilding(payload);
        setSuccess(res.data.message || 'Building created');
        navigate('/admin/buildings', { replace: true, state: { success: res.data.message || 'Building created' } });
        return;
      }
      const res = await updateBuilding(id, payload);
      const b = res.data.data?.building ?? res.data.data;
      if (b) {
        setBuilding(b);
        setForm(toForm(b));
      }
      setSuccess(res.data.message || 'Building updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!building) return;
    setSaving(true);
    setConfirmDeactivate(false);
    setError('');
    try {
      const apiCall = building.isActive ? deactivateBuilding : activateBuilding;
      const { data } = await apiCall(building.id);
      const b = data.data?.building ?? data.data;
      setBuilding(b);
      setForm(toForm(b));
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
      active="buildings"
      onChange={(navId) => {
        if (navId === 'buildings') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Buildings' },
        { label: isCreate ? 'Create' : building?.name || 'Details' },
      ]}
    >
      <PageHeader
        icon={Building2}
        iconColor="#93c5fd"
        title={isCreate ? 'Create Building' : building?.name || 'Building Details'}
        subtitle={
          isCreate
            ? 'Add a new tower or block to your society.'
            : 'View and edit building identity, capacity, and contacts.'
        }
        action={
          !isCreate && building ? (
            <button
              className="btn-primary"
              type="button"
              onClick={() => (building.isActive ? setConfirmDeactivate(true) : toggleActive())}
              disabled={saving}
            >
              {building.isActive ? 'Deactivate' : 'Activate'}
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

      {!isCreate && building && (
        <div
          className={
            'society-status-bar' +
            (building.isActive ? ' society-status-bar--active' : ' society-status-bar--inactive')
          }
          style={{ marginBottom: 14 }}
        >
          <div className="society-status-bar-main">
            <span
              className={
                'society-status-pill' +
                (building.isActive ? ' society-status-pill--active' : ' society-status-pill--inactive')
              }
            >
              <span className="society-status-dot" aria-hidden />
              {building.isActive ? 'Active' : 'Inactive'}
            </span>
            <div className="society-status-identity">
              <div className="society-status-name">{building.displayName || building.name}</div>
            </div>
          </div>
          <div className="society-status-meta">
            {building.code ? <span className="society-status-chip">{building.code}</span> : null}
            {building.buildingType ? (
              <span className="society-status-chip">{building.buildingType}</span>
            ) : null}
            {building.status ? <span className="society-status-chip">{building.status}</span> : null}
            {building.totalFloors != null ? (
              <span className="society-status-chip">{building.totalFloors} floors</span>
            ) : null}
            {building.plannedUnits != null ? (
              <span className="society-status-chip">{building.plannedUnits} planned units</span>
            ) : null}
          </div>
        </div>
      )}

      {!isCreate && building && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate(`/admin/wings?buildingId=${building.id}`)}
          >
            Manage wings
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate(`/admin/flats?buildingId=${building.id}`)}
          >
            View flats
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
                    <FormSelect
                      label="Building Type"
                      value={form.buildingType}
                      options={BUILDING_TYPE_OPTIONS}
                      onChange={(v) => setForm((s) => ({ ...s, buildingType: v }))}
                    />
                    <FormSelect
                      label="Operational Status"
                      value={form.status}
                      options={OPERATION_STATUS_OPTIONS}
                      onChange={(v) => setForm((s) => ({ ...s, status: v }))}
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
                title: 'Units and Capacity',
                content: (
                  <>
                    <FormField
                      label="Total Floors"
                      value={form.totalFloors}
                      onChange={(v) => setForm((s) => ({ ...s, totalFloors: v }))}
                    />
                    <FormField
                      label="Total Units"
                      value={form.totalUnits}
                      onChange={(v) => setForm((s) => ({ ...s, totalUnits: v }))}
                    />
                    <FormField
                      label="Planned Units"
                      value={form.plannedUnits}
                      onChange={(v) => setForm((s) => ({ ...s, plannedUnits: v }))}
                    />
                    <FormField
                      label="Occupied Units"
                      value={form.occupiedUnits}
                      onChange={(v) => setForm((s) => ({ ...s, occupiedUnits: v }))}
                    />
                    <FormField
                      label="Vacant Units"
                      value={form.vacantUnits}
                      onChange={(v) => setForm((s) => ({ ...s, vacantUnits: v }))}
                    />
                  </>
                ),
              },
              {
                title: 'Emergency and Metadata',
                content: (
                  <>
                    <FormField
                      label="Emergency Contact Name"
                      value={form.emergencyContactName}
                      onChange={(v) => setForm((s) => ({ ...s, emergencyContactName: v }))}
                    />
                    <FormField
                      label="Emergency Contact Phone"
                      value={form.emergencyContactPhone}
                      onChange={(v) => setForm((s) => ({ ...s, emergencyContactPhone: v }))}
                    />
                    <FormField
                      label="Image URL"
                      value={form.imageUrl}
                      onChange={(v) => setForm((s) => ({ ...s, imageUrl: v }))}
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
              {saving ? 'Saving...' : isCreate ? 'Create building' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>

      <ConfirmDialog
        open={confirmDeactivate}
        title="Deactivate building?"
        message="This building will be hidden from active lists but kept for historical references and future Wings/Flats linking."
        confirmLabel="Deactivate"
        variant="danger"
        loading={saving}
        onConfirm={toggleActive}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </AppShell>
  );
}
