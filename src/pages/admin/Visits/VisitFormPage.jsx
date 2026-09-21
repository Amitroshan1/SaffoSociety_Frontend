import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
  Plus,
  XCircle,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  FormField,
  FormLayout,
  FormSelect,
} from '@/components/common/index.js';
import Spinner from '@/common/Spinner.jsx';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import { listOccupancies } from '@/services/occupancy.service.js';
import { listVisitors } from '@/services/visitor.service.js';
import {
  approveVisit,
  cancelVisit,
  checkInVisit,
  checkOutVisit,
  createVisit,
  getVisit,
  rejectVisit,
} from '@/services/visit.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const VISITOR_TYPE_OPTIONS = [
  'guest',
  'delivery',
  'maid',
  'driver',
  'technician',
  'vendor',
  'courier',
  'other',
];
const PASS_TYPE_OPTIONS = ['', 'one_time', 'daily', 'temporary', 'service', 'delivery'];

const initialForm = {
  occupancyId: '',
  visitorId: '',
  purpose: '',
  visitorType: 'guest',
  passType: 'one_time',
  expectedAt: '',
  numberOfPeople: '1',
  vehicleNumber: '',
  isPreapproved: true,
  notes: '',
};

export default function VisitFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isCreate = !id;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visit, setVisit] = useState(null);
  const [occupancies, setOccupancies] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [form, setForm] = useState({
    ...initialForm,
    occupancyId: searchParams.get('occupancyId') || '',
    visitorId: searchParams.get('visitorId') || '',
  });

  useEffect(() => {
    if (!isCreate) return;
    Promise.all([
      listOccupancies({
        pageSize: 100,
        sortBy: 'move_in_date',
        sortOrder: 'desc',
        status: 'active',
      }),
      listVisitors({ pageSize: 200, sortBy: 'name', sortOrder: 'asc', isActive: true }),
    ])
      .then(([o, v]) => {
        setOccupancies(o.data.data?.occupancies || []);
        setVisitors(v.data.data?.visitors || []);
      })
      .catch(() => {});
  }, [isCreate]);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getVisit(id);
        const v = data.data?.visit ?? data.data;
        if (cancelled) return;
        setVisit(v);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load visit');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/visits');

  const onCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        occupancyId: form.occupancyId,
        visitorId: form.visitorId,
        purpose: form.purpose.trim(),
        visitorType: form.visitorType,
        passType: form.passType || null,
        expectedAt: form.expectedAt || null,
        numberOfPeople: Number(form.numberOfPeople) || 1,
        vehicleNumber: form.vehicleNumber.trim() || null,
        isPreapproved: form.isPreapproved,
        status: form.isPreapproved ? 'approved' : 'waiting',
        notes: form.notes.trim() || null,
      };
      const res = await createVisit(payload);
      navigate('/admin/visits', {
        replace: true,
        state: { success: res.data.message || 'Visit created' },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
      setSaving(false);
    }
  };

  const onAction = async (action) => {
    if (!visit) return;
    setSaving(true);
    setError('');
    try {
      const fn = {
        approve: approveVisit,
        reject: rejectVisit,
        checkin: checkInVisit,
        checkout: checkOutVisit,
        cancel: cancelVisit,
      }[action];
      const { data } = await fn(visit.id, {});
      const updated = data.data?.visit ?? data.data;
      if (updated && typeof updated === 'object' && updated.id) {
        setVisit(updated);
      } else {
        const refreshed = await getVisit(visit.id);
        setVisit(refreshed.data.data?.visit ?? refreshed.data.data);
      }
      setSuccess(data.message || 'Visit updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <AppShell
      active="visits"
      onChange={(navId) => {
        if (navId === 'visits') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Visits' },
        { label: isCreate ? 'Create' : visit?.visitorName || 'Details' },
      ]}
    >
      <PageHeader
        icon={Clock3}
        iconColor="#86efac"
        title={
          isCreate
            ? 'Create Visit'
            : visit
              ? `${visit.visitorName} — ${visit.status}`
              : 'Visit Details'
        }
        subtitle={
          isCreate
            ? 'Schedule an expected visitor or walk-in.'
            : 'Approve, check in/out, or cancel this visit.'
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
          <form onSubmit={onCreate}>
            <FormLayout
              sections={[
                {
                  title: 'Visit details',
                  content: (
                    <>
                      <FormSelect
                        label="Occupancy *"
                        value={form.occupancyId}
                        options={occupancies.map((o) => ({
                          value: o.id,
                          label: `${o.flatNo || 'Flat'} - ${o.residentName || o.residentId}`,
                        }))}
                        onChange={(v) => setForm((s) => ({ ...s, occupancyId: v }))}
                        required
                      />
                      <FormSelect
                        label="Visitor *"
                        value={form.visitorId}
                        options={visitors.map((v) => ({
                          value: v.id,
                          label: `${v.name} (${v.phone})`,
                        }))}
                        onChange={(v) => setForm((s) => ({ ...s, visitorId: v }))}
                        required
                      />
                      <FormField
                        label="Purpose *"
                        value={form.purpose}
                        onChange={(v) => setForm((s) => ({ ...s, purpose: v }))}
                        required
                      />
                      <FormSelect
                        label="Visitor Type"
                        value={form.visitorType}
                        options={VISITOR_TYPE_OPTIONS}
                        onChange={(v) => setForm((s) => ({ ...s, visitorType: v }))}
                      />
                      <FormSelect
                        label="Pass Type"
                        value={form.passType}
                        options={PASS_TYPE_OPTIONS}
                        onChange={(v) => setForm((s) => ({ ...s, passType: v }))}
                      />
                      <FormField
                        type="datetime-local"
                        label="Expected At"
                        value={form.expectedAt}
                        onChange={(v) => setForm((s) => ({ ...s, expectedAt: v }))}
                      />
                      <FormField
                        label="Vehicle Number"
                        value={form.vehicleNumber}
                        onChange={(v) => setForm((s) => ({ ...s, vehicleNumber: v }))}
                      />
                      <FormField
                        label="Number of People"
                        value={form.numberOfPeople}
                        onChange={(v) => setForm((s) => ({ ...s, numberOfPeople: v }))}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                        <input
                          type="checkbox"
                          checked={form.isPreapproved}
                          onChange={(e) =>
                            setForm((s) => ({ ...s, isPreapproved: e.target.checked }))
                          }
                        />
                        Preapproved
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
              <button
                className="btn-primary"
                type="submit"
                disabled={saving || !form.occupancyId || !form.visitorId}
              >
                <Plus size={14} />
                {saving ? 'Saving...' : 'Create visit'}
              </button>
            </div>
          </form>
        ) : visit ? (
          <div>
            <div
              className={
                'society-status-bar' +
                (visit.status === 'checked_in' || visit.status === 'approved'
                  ? ' society-status-bar--active'
                  : visit.status === 'rejected' || visit.status === 'cancelled'
                    ? ' society-status-bar--inactive'
                    : ' society-status-bar--draft')
              }
              style={{ marginBottom: 16 }}
            >
              <div className="society-status-bar-main">
                <span
                  className={
                    'society-status-pill' +
                    (visit.status === 'checked_in' || visit.status === 'approved'
                      ? ' society-status-pill--active'
                      : visit.status === 'rejected' || visit.status === 'cancelled'
                        ? ' society-status-pill--inactive'
                        : ' society-status-pill--draft')
                  }
                >
                  <span className="society-status-dot" aria-hidden />
                  {visit.status}
                </span>
                <div className="society-status-identity">
                  <div className="society-status-name">{visit.visitorName}</div>
                </div>
              </div>
              <div className="society-status-meta">
                <span className="society-status-chip">{visit.flatNo || visit.flatId}</span>
                {visit.visitorType ? (
                  <span className="society-status-chip">{visit.visitorType}</span>
                ) : null}
                {visit.passType ? <span className="society-status-chip">{visit.passType}</span> : null}
              </div>
            </div>

            <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 16 }}>{visit.purpose}</p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['scheduled', 'waiting'].includes(visit.status) && (
                <>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => onAction('approve')}
                    disabled={saving}
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => onAction('reject')}
                    disabled={saving}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </>
              )}
              {['approved', 'waiting', 'scheduled'].includes(visit.status) && (
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => onAction('checkin')}
                  disabled={saving}
                >
                  <LogIn size={14} /> Check In
                </button>
              )}
              {visit.status === 'checked_in' && (
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => onAction('checkout')}
                  disabled={saving}
                >
                  <LogOut size={14} /> Check Out
                </button>
              )}
              {!['checked_out', 'cancelled', 'rejected', 'expired'].includes(visit.status) && (
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => onAction('cancel')}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <p style={{ color: '#fca5a5' }}>Visit not found.</p>
        )}
      </section>
    </AppShell>
  );
}
