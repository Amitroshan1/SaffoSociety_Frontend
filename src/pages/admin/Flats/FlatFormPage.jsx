import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, DoorOpen, Save } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  ConfirmDialog,
  FormField,
  FormLayout,
  FormSelect,
} from '../../../components/common/index.js';
import Spinner from '../../../common/Spinner.jsx';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import { listBuildings } from '../../../services/building.service.js';
import { listWings } from '../../../services/wing.service.js';
import {
  activateFlat,
  createFlat,
  deactivateFlat,
  getFlat,
  updateFlat,
} from '../../../services/flat.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const FLAT_TYPE_OPTIONS = [
  '',
  '1bhk',
  '2bhk',
  '3bhk',
  '4bhk',
  'studio',
  'penthouse',
  'duplex',
  'shop',
  'office',
  'other',
];
const USAGE_TYPE_OPTIONS = ['', 'residential', 'commercial', 'office', 'shop', 'warehouse'];
const FLAT_STATUS_OPTIONS = ['vacant', 'occupied', 'reserved', 'under_maintenance', 'blocked'];
const OWNERSHIP_OPTIONS = ['', 'owned', 'rented', 'company_leased', 'vacant'];
const AREA_TYPE_OPTIONS = ['', 'carpet', 'built_up', 'super_built_up'];

const initialForm = {
  buildingId: '',
  wingId: '',
  flatNo: '',
  floorNo: '',
  flatType: '',
  usageType: 'residential',
  status: 'vacant',
  ownershipType: '',
  areaSqft: '',
  areaType: 'carpet',
  intercom: '',
  sequence: '0',
  color: '',
  notes: '',
};

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function toPayload(form, { includeFlatNo = true, includeMetadata = false } = {}) {
  const payload = {
    wingId: form.wingId,
    floorNo: form.floorNo.trim(),
    flatType: form.flatType || null,
    usageType: form.usageType || null,
    status: form.status,
    ownershipType: form.ownershipType || null,
    areaSqft: toNumberOrNull(form.areaSqft),
    areaType: form.areaType || null,
    intercom: form.intercom.trim() || null,
    sequence: Number(form.sequence) || 0,
    color: form.color.trim() || null,
    notes: form.notes.trim() || null,
  };
  if (includeFlatNo) payload.flatNo = form.flatNo.trim().toUpperCase();
  if (includeMetadata) payload.metadata = {};
  return payload;
}

function toForm(flat) {
  return {
    buildingId: flat.buildingId || '',
    wingId: flat.wingId || '',
    flatNo: flat.flatNo || '',
    floorNo: flat.floorNo || '',
    flatType: flat.flatType || '',
    usageType: flat.usageType || '',
    status: flat.status || 'vacant',
    ownershipType: flat.ownershipType || '',
    areaSqft: flat.areaSqft ?? '',
    areaType: flat.areaType || '',
    intercom: flat.intercom || '',
    sequence: flat.sequence ?? 0,
    color: flat.color || '',
    notes: flat.notes || '',
  };
}

export default function FlatFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isCreate = !id;
  const initialBuildingId = searchParams.get('buildingId') || '';
  const initialWingId = searchParams.get('wingId') || '';

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [flat, setFlat] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [wings, setWings] = useState([]);
  const [form, setForm] = useState({
    ...initialForm,
    buildingId: initialBuildingId,
    wingId: initialWingId,
  });
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const formWings = useMemo(() => {
    if (!form.buildingId) return wings;
    return wings.filter((w) => w.buildingId === form.buildingId);
  }, [wings, form.buildingId]);

  useEffect(() => {
    listBuildings({ pageSize: 100, sortBy: 'name', sortOrder: 'asc', isActive: true })
      .then(({ data }) => setBuildings(data.data?.buildings || []))
      .catch(() => setBuildings([]));
    listWings({ pageSize: 100, sortBy: 'sequence', sortOrder: 'asc', isActive: true })
      .then(({ data }) => setWings(data.data?.wings || []))
      .catch(() => setWings([]));
  }, []);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getFlat(id);
        const f = data.data?.flat ?? data.data;
        if (cancelled) return;
        setFlat(f);
        setForm(toForm(f));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load flat');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/flats');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const payload = toPayload(form, { includeFlatNo: isCreate, includeMetadata: isCreate });
    try {
      if (isCreate) {
        const res = await createFlat(payload);
        navigate('/admin/flats', {
          replace: true,
          state: { success: res.data.message || 'Flat created' },
        });
        return;
      }
      const res = await updateFlat(id, payload);
      const f = res.data.data?.flat ?? res.data.data;
      if (f) {
        setFlat(f);
        setForm(toForm(f));
      }
      setSuccess(res.data.message || 'Flat updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!flat) return;
    setSaving(true);
    setConfirmDeactivate(false);
    setError('');
    try {
      const apiCall = flat.isActive ? deactivateFlat : activateFlat;
      const { data } = await apiCall(flat.id);
      const f = data.data?.flat ?? data.data;
      setFlat(f);
      setForm(toForm(f));
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
      active="flats"
      onChange={(navId) => {
        if (navId === 'flats') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Flats' },
        { label: isCreate ? 'Create' : flat?.flatNo || 'Details' },
      ]}
    >
      <PageHeader
        icon={DoorOpen}
        iconColor="#93c5fd"
        title={isCreate ? 'Create Flat' : flat?.flatNo || 'Flat Details'}
        subtitle={
          isCreate
            ? 'Add a unit under a wing.'
            : 'View and edit flat identity, area, and status.'
        }
        action={
          !isCreate && flat ? (
            <button
              className="btn-primary"
              type="button"
              onClick={() => (flat.isActive ? setConfirmDeactivate(true) : toggleActive())}
              disabled={saving}
            >
              {flat.isActive ? 'Deactivate' : 'Activate'}
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

      {!isCreate && flat && (
        <div style={{ marginBottom: 12 }}>
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate(`/admin/occupancies?flatId=${flat.id}`)}
          >
            Household / Occupancy
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
                      label="Building"
                      value={form.buildingId}
                      options={buildings.map((b) => ({
                        value: b.id,
                        label: `${b.name} (${b.code})`,
                      }))}
                      onChange={(v) => setForm((s) => ({ ...s, buildingId: v, wingId: '' }))}
                      disabled={!isCreate}
                    />
                    <FormSelect
                      label="Wing *"
                      value={form.wingId}
                      options={formWings.map((w) => ({
                        value: w.id,
                        label: `${w.name} (${w.code})`,
                      }))}
                      onChange={(v) => {
                        const wing = wings.find((w) => w.id === v);
                        setForm((s) => ({
                          ...s,
                          wingId: v,
                          buildingId: wing?.buildingId || s.buildingId,
                        }));
                      }}
                      required
                      disabled={!isCreate}
                    />
                    <FormField
                      label="Flat No *"
                      value={form.flatNo}
                      onChange={(v) => setForm((s) => ({ ...s, flatNo: v.toUpperCase() }))}
                      required={isCreate}
                      disabled={!isCreate}
                    />
                    <FormField
                      label="Floor No *"
                      value={form.floorNo}
                      onChange={(v) => setForm((s) => ({ ...s, floorNo: v }))}
                      required
                    />
                    <FormSelect
                      label="Flat Type"
                      value={form.flatType}
                      options={FLAT_TYPE_OPTIONS}
                      onChange={(v) => setForm((s) => ({ ...s, flatType: v }))}
                    />
                    <FormSelect
                      label="Usage Type"
                      value={form.usageType}
                      options={USAGE_TYPE_OPTIONS}
                      onChange={(v) => setForm((s) => ({ ...s, usageType: v }))}
                    />
                    <FormSelect
                      label="Status"
                      value={form.status}
                      options={FLAT_STATUS_OPTIONS}
                      onChange={(v) => setForm((s) => ({ ...s, status: v }))}
                    />
                    <FormSelect
                      label="Ownership"
                      value={form.ownershipType}
                      options={OWNERSHIP_OPTIONS}
                      onChange={(v) => setForm((s) => ({ ...s, ownershipType: v }))}
                    />
                  </>
                ),
              },
              {
                title: 'Area & Display',
                content: (
                  <>
                    <FormField
                      label="Area (sqft)"
                      value={form.areaSqft}
                      onChange={(v) => setForm((s) => ({ ...s, areaSqft: v }))}
                    />
                    <FormSelect
                      label="Area Type"
                      value={form.areaType}
                      options={AREA_TYPE_OPTIONS}
                      onChange={(v) => setForm((s) => ({ ...s, areaType: v }))}
                    />
                    <FormField
                      label="Intercom"
                      value={form.intercom}
                      onChange={(v) => setForm((s) => ({ ...s, intercom: v }))}
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
              disabled={saving || (isCreate && !form.wingId)}
            >
              <Save size={14} />
              {saving ? 'Saving...' : isCreate ? 'Create flat' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>

      <ConfirmDialog
        open={confirmDeactivate}
        title="Deactivate flat?"
        message="This flat will be hidden from active lists but kept for future Residents linking."
        confirmLabel="Deactivate"
        variant="danger"
        loading={saving}
        onConfirm={toggleActive}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </AppShell>
  );
}
