import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LogOut, Save, UserCheck } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  FormField,
  FormLayout,
  FormSelect,
} from '../../../components/common/index.js';
import Spinner from '../../../common/Spinner.jsx';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import { listBuildings } from '../../../services/building.service.js';
import { listWings } from '../../../services/wing.service.js';
import { listFlats } from '../../../services/flat.service.js';
import { listResidents } from '../../../services/resident.service.js';
import {
  createOccupancy,
  getOccupancy,
  moveOutOccupancy,
  updateOccupancy,
} from '../../../services/occupancy.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const ROLE_OPTIONS = ['owner', 'tenant', 'family_member', 'domestic_help'];
const ENDED_REASON_OPTIONS = ['moved_out', 'lease_ended', 'transfer', 'deceased', 'other'];

const initialForm = {
  buildingId: '',
  wingId: '',
  flatId: '',
  residentId: '',
  role: 'tenant',
  isPrimary: false,
  moveInDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

export default function OccupancyFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isCreate = !id;
  const initialFlatId = searchParams.get('flatId') || '';
  const initialResidentId = searchParams.get('residentId') || '';

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [occupancy, setOccupancy] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [wings, setWings] = useState([]);
  const [flats, setFlats] = useState([]);
  const [residents, setResidents] = useState([]);
  const [form, setForm] = useState({
    ...initialForm,
    flatId: initialFlatId,
    residentId: initialResidentId,
  });
  const [showMoveOutForm, setShowMoveOutForm] = useState(false);
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().slice(0, 10));
  const [endedReason, setEndedReason] = useState('moved_out');

  const formWings = useMemo(() => {
    if (!form.buildingId) return wings;
    return wings.filter((w) => w.buildingId === form.buildingId);
  }, [wings, form.buildingId]);

  const formFlats = useMemo(() => {
    if (!form.wingId) {
      return flats.filter((f) => !form.buildingId || f.buildingId === form.buildingId);
    }
    return flats.filter((f) => f.wingId === form.wingId);
  }, [flats, form.buildingId, form.wingId]);

  useEffect(() => {
    if (!isCreate) return;
    Promise.all([
      listBuildings({ pageSize: 100, sortBy: 'name', sortOrder: 'asc', isActive: true }),
      listWings({ pageSize: 100, sortBy: 'sequence', sortOrder: 'asc', isActive: true }),
      listFlats({ pageSize: 200, sortBy: 'sequence', sortOrder: 'asc', isActive: true }),
      listResidents({ pageSize: 200, sortBy: 'name', sortOrder: 'asc', isActive: true }),
    ])
      .then(([b, w, f, r]) => {
        setBuildings(b.data.data?.buildings || []);
        setWings(w.data.data?.wings || []);
        setFlats(f.data.data?.flats || []);
        setResidents(r.data.data?.residents || []);
        const flat = (f.data.data?.flats || []).find((x) => x.id === initialFlatId);
        if (flat) {
          setForm((s) => ({
            ...s,
            buildingId: flat.buildingId || s.buildingId,
            wingId: flat.wingId || s.wingId,
            flatId: flat.id,
          }));
        }
      })
      .catch(() => {});
  }, [isCreate, initialFlatId]);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getOccupancy(id);
        const occ = data.data?.occupancy ?? data.data;
        if (cancelled) return;
        setOccupancy(occ);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load occupancy');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/occupancies');

  const onMoveIn = async (e) => {
    e.preventDefault();
    if (!form.flatId || !form.residentId) {
      setError('Flat and resident are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await createOccupancy({
        flatId: form.flatId,
        residentId: form.residentId,
        role: form.role,
        isPrimary: form.isPrimary,
        moveInDate: form.moveInDate,
        notes: form.notes.trim() || null,
      });
      navigate('/admin/occupancies', {
        replace: true,
        state: { success: res.data.message || 'Move-in recorded' },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Move-in failed');
      setSaving(false);
    }
  };

  const onSetPrimary = async () => {
    if (!occupancy || occupancy.status !== 'active') return;
    setSaving(true);
    setError('');
    try {
      const res = await updateOccupancy(occupancy.id, { isPrimary: true });
      const occ = res.data.data?.occupancy ?? res.data.data;
      if (occ) setOccupancy(occ);
      setSuccess(res.data.message || 'Primary updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not set primary');
    } finally {
      setSaving(false);
    }
  };

  const onMoveOut = async () => {
    if (!occupancy) return;
    setSaving(true);
    setShowMoveOutForm(false);
    setError('');
    try {
      const res = await moveOutOccupancy(occupancy.id, {
        moveOutDate,
        endedReason,
      });
      const occ = res.data.data?.occupancy ?? res.data.data;
      if (occ) setOccupancy(occ);
      setSuccess(res.data.message || 'Move-out recorded');
    } catch (err) {
      setError(err.response?.data?.message || 'Move-out failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <AppShell
      active="occupancy"
      onChange={(navId) => {
        if (navId === 'occupancy') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Occupancy' },
        { label: isCreate ? 'Move in' : occupancy?.residentName || 'Details' },
      ]}
    >
      <PageHeader
        icon={UserCheck}
        iconColor="#86efac"
        title={
          isCreate
            ? 'Move In'
            : occupancy
              ? `${occupancy.residentName} — ${occupancy.flatNo}`
              : 'Occupancy Details'
        }
        subtitle={
          isCreate
            ? 'Assign a resident to a flat and record move-in.'
            : 'View occupancy details, set primary, or record move-out.'
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

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        {isCreate ? (
          <form onSubmit={onMoveIn}>
            <FormLayout
              sections={[
                {
                  title: 'Assignment',
                  content: (
                    <>
                      <FormSelect
                        label="Building"
                        value={form.buildingId}
                        options={[
                          { value: '', label: '—' },
                          ...buildings.map((b) => ({
                            value: b.id,
                            label: `${b.name} (${b.code})`,
                          })),
                        ]}
                        onChange={(v) =>
                          setForm((s) => ({ ...s, buildingId: v, wingId: '', flatId: '' }))
                        }
                      />
                      <FormSelect
                        label="Wing"
                        value={form.wingId}
                        options={[
                          { value: '', label: '—' },
                          ...formWings.map((w) => ({
                            value: w.id,
                            label: `${w.name} (${w.code})`,
                          })),
                        ]}
                        onChange={(v) => setForm((s) => ({ ...s, wingId: v, flatId: '' }))}
                      />
                      <FormSelect
                        label="Flat *"
                        value={form.flatId}
                        options={[
                          { value: '', label: '—' },
                          ...formFlats.map((f) => ({ value: f.id, label: f.flatNo })),
                        ]}
                        onChange={(v) => setForm((s) => ({ ...s, flatId: v }))}
                      />
                      <FormSelect
                        label="Resident *"
                        value={form.residentId}
                        options={[
                          { value: '', label: '—' },
                          ...residents.map((r) => ({
                            value: r.id,
                            label: `${r.name} (${r.code})`,
                          })),
                        ]}
                        onChange={(v) => setForm((s) => ({ ...s, residentId: v }))}
                      />
                      <FormSelect
                        label="Role *"
                        value={form.role}
                        options={ROLE_OPTIONS}
                        onChange={(v) =>
                          setForm((s) => ({
                            ...s,
                            role: v,
                            isPrimary: v === 'domestic_help' ? false : s.isPrimary,
                          }))
                        }
                      />
                      <FormField
                        label="Move-in date *"
                        type="date"
                        value={form.moveInDate}
                        onChange={(v) => setForm((s) => ({ ...s, moveInDate: v }))}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                        <input
                          type="checkbox"
                          checked={form.isPrimary}
                          disabled={form.role === 'domestic_help'}
                          onChange={(e) =>
                            setForm((s) => ({ ...s, isPrimary: e.target.checked }))
                          }
                        />
                        Primary contact for flat
                      </label>
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
                <Save size={14} />
                {saving ? 'Saving...' : 'Record move-in'}
              </button>
            </div>
          </form>
        ) : occupancy ? (
          <div>
            <div
              className={
                'society-status-bar' +
                (occupancy.status === 'active'
                  ? ' society-status-bar--active'
                  : ' society-status-bar--inactive')
              }
              style={{ marginBottom: 16 }}
            >
              <div className="society-status-bar-main">
                <span
                  className={
                    'society-status-pill' +
                    (occupancy.status === 'active'
                      ? ' society-status-pill--active'
                      : ' society-status-pill--inactive')
                  }
                >
                  <span className="society-status-dot" aria-hidden />
                  {occupancy.status}
                </span>
                <div className="society-status-identity">
                  <div className="society-status-name">{occupancy.residentName}</div>
                </div>
              </div>
              <div className="society-status-meta">
                <span className="society-status-chip">{occupancy.flatNo}</span>
                <span className="society-status-chip">{occupancy.role}</span>
                {occupancy.isPrimary ? (
                  <span className="society-status-chip">Primary</span>
                ) : null}
                <span className="society-status-chip">In: {occupancy.moveInDate}</span>
                {occupancy.moveOutDate ? (
                  <span className="society-status-chip">Out: {occupancy.moveOutDate}</span>
                ) : null}
              </div>
            </div>

            {occupancy.status === 'active' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                {!occupancy.isPrimary && occupancy.role !== 'domestic_help' && (
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={onSetPrimary}
                    disabled={saving}
                  >
                    Set as primary
                  </button>
                )}
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => setShowMoveOutForm((v) => !v)}
                  disabled={saving}
                >
                  <LogOut size={14} />
                  Move out
                </button>
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => navigate(`/admin/residents/${occupancy.residentId}`)}
                >
                  View resident
                </button>
              </div>
            )}

            {occupancy.status === 'active' && showMoveOutForm && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <FormField
                  label="Move-out date"
                  type="date"
                  value={moveOutDate}
                  onChange={setMoveOutDate}
                />
                <FormSelect
                  label="Reason"
                  value={endedReason}
                  options={ENDED_REASON_OPTIONS}
                  onChange={setEndedReason}
                />
                <button
                  className="btn-primary"
                  type="button"
                  onClick={onMoveOut}
                  disabled={saving}
                  style={{ marginTop: 12 }}
                >
                  Confirm move-out
                </button>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: '#fca5a5' }}>Occupancy not found.</p>
        )}
      </section>
    </AppShell>
  );
}
