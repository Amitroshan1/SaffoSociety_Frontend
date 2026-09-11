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
  activateVisitor,
  createVisitor,
  deactivateVisitor,
  getVisitor,
  getVisitorHistory,
  updateVisitor,
} from '../../../services/visitor.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const initialForm = {
  name: '',
  phone: '',
  email: '',
  photoUrl: '',
  governmentIdType: '',
  governmentIdNumber: '',
  notes: '',
};

function toPayload(form, { includeMetadata = false } = {}) {
  const payload = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim() || null,
    photoUrl: form.photoUrl.trim() || null,
    governmentIdType: form.governmentIdType.trim() || null,
    governmentIdNumber: form.governmentIdNumber.trim() || null,
    notes: form.notes.trim() || null,
  };
  if (includeMetadata) payload.metadata = {};
  return payload;
}

function toForm(visitor) {
  return {
    name: visitor.name || '',
    phone: visitor.phone || '',
    email: visitor.email || '',
    photoUrl: visitor.photoUrl || '',
    governmentIdType: visitor.governmentIdType || '',
    governmentIdNumber: visitor.governmentIdNumber || '',
    notes: visitor.notes || '',
  };
}

export default function VisitorFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visitor, setVisitor] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getVisitor(id);
        const v = data.data?.visitor ?? data.data;
        if (cancelled) return;
        setVisitor(v);
        setForm(toForm(v));
        try {
          const hist = await getVisitorHistory(id);
          if (!cancelled) setHistory(hist.data.data?.history || []);
        } catch {
          if (!cancelled) setHistory([]);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load visitor');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const goBack = () => navigate('/admin/visitors');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const payload = toPayload(form, { includeMetadata: isCreate });
    try {
      if (isCreate) {
        const res = await createVisitor(payload);
        navigate('/admin/visitors', {
          replace: true,
          state: { success: res.data.message || 'Visitor created' },
        });
        return;
      }
      const res = await updateVisitor(id, payload);
      const v = res.data.data?.visitor ?? res.data.data;
      if (v) {
        setVisitor(v);
        setForm(toForm(v));
      }
      setSuccess(res.data.message || 'Visitor updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!visitor) return;
    setSaving(true);
    setConfirmDeactivate(false);
    setError('');
    try {
      const apiCall = visitor.isActive ? deactivateVisitor : activateVisitor;
      const { data } = await apiCall(visitor.id);
      const v = data.data?.visitor ?? data.data;
      setVisitor(v);
      setForm(toForm(v));
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
      active="visitors"
      onChange={(navId) => {
        if (navId === 'visitors') {
          goBack();
          return;
        }
        const path = ADMIN_ROUTES[navId];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Visitors' },
        { label: isCreate ? 'Create' : visitor?.name || 'Details' },
      ]}
    >
      <PageHeader
        icon={Users}
        iconColor="#93c5fd"
        title={isCreate ? 'Create Visitor' : visitor?.name || 'Visitor Details'}
        subtitle={
          isCreate
            ? 'Register a reusable visitor identity for gate operations.'
            : 'View and edit visitor identity and visit history.'
        }
        action={
          !isCreate && visitor ? (
            <button
              className="btn-primary"
              type="button"
              onClick={() => (visitor.isActive ? setConfirmDeactivate(true) : toggleActive())}
              disabled={saving}
            >
              {visitor.isActive ? 'Deactivate' : 'Activate'}
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

      {!isCreate && visitor && (
        <div style={{ marginBottom: 12 }}>
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate(`/admin/visits?visitorId=${visitor.id}`)}
          >
            View visits
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
                    <FormField
                      label="Photo URL"
                      value={form.photoUrl}
                      onChange={(v) => setForm((s) => ({ ...s, photoUrl: v }))}
                    />
                    <FormField
                      label="Government ID Type"
                      value={form.governmentIdType}
                      onChange={(v) => setForm((s) => ({ ...s, governmentIdType: v }))}
                    />
                    <FormField
                      label="Government ID Number"
                      value={form.governmentIdNumber}
                      onChange={(v) => setForm((s) => ({ ...s, governmentIdNumber: v }))}
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
              {saving ? 'Saving...' : isCreate ? 'Create visitor' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>

      {!isCreate && history.length > 0 && (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Recent visitor history</h3>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 14, opacity: 0.9 }}>
            {history.slice(0, 8).map((h) => (
              <li key={h.id}>
                {h.visitorType} - {h.status} - {h.flatNo || h.flatId}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={confirmDeactivate}
        title="Deactivate visitor?"
        message="Cannot deactivate while open visits exist."
        confirmLabel="Deactivate"
        variant="danger"
        loading={saving}
        onConfirm={toggleActive}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </AppShell>
  );
}
