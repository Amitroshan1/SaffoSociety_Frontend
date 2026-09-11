import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Save } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  ConfirmDialog,
  FormField,
  FormSelect,
} from '../../../components/common/index.js';
import Spinner from '../../../common/Spinner.jsx';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  TEMPLATE_PLACEHOLDERS,
  createNotificationTemplate,
  deleteNotificationTemplate,
  formatLabel,
  listNotificationTemplates,
  updateNotificationTemplate,
} from '../../../services/notification.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const LIST_PATH = '/admin/notifications/templates';

const initialForm = {
  code: '',
  name: '',
  category: 'system',
  channel: 'in_app',
  subjectTemplate: '',
  bodyTemplate: '',
  priority: 'normal',
  notes: '',
};

function toForm(row) {
  return {
    code: row.code || '',
    name: row.name || '',
    category: row.category || 'system',
    channel: row.channel || 'in_app',
    subjectTemplate: row.subjectTemplate || '',
    bodyTemplate: row.bodyTemplate || '',
    priority: row.priority || 'normal',
    notes: row.notes || '',
  };
}

export default function NotificationTemplateFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isCreate = !id;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [template, setTemplate] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const goBack = () => navigate(LIST_PATH);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const fromState = location.state?.template;
        if (fromState && String(fromState.id) === String(id)) {
          if (cancelled) return;
          setTemplate(fromState);
          setForm(toForm(fromState));
          return;
        }
        const { data } = await listNotificationTemplates({ pageSize: 100, sortBy: 'created_at', sortOrder: 'desc' });
        const rows = data.data?.templates || [];
        const row = rows.find((t) => String(t.id) === String(id));
        if (!row) throw new Error('Template not found');
        if (cancelled) return;
        setTemplate(row);
        setForm(toForm(row));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load template');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate, location.state]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        channel: form.channel,
        subjectTemplate: form.subjectTemplate.trim() || null,
        bodyTemplate: form.bodyTemplate.trim(),
        priority: form.priority,
        notes: form.notes.trim() || null,
      };
      if (isCreate) {
        const res = await createNotificationTemplate({ ...payload, code: form.code.trim() });
        navigate(LIST_PATH, {
          replace: true,
          state: { success: res.data?.message || 'Template created' },
        });
        return;
      }
      const res = await updateNotificationTemplate(id, payload);
      const row = res.data?.data?.template ?? res.data?.data;
      if (row) {
        setTemplate(row);
        setForm(toForm(row));
      }
      navigate(LIST_PATH, {
        replace: true,
        state: { success: res.data?.message || 'Template updated' },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!template || template.isSystem) return;
    setSaving(true);
    setError('');
    try {
      const res = await deleteNotificationTemplate(id);
      navigate(LIST_PATH, {
        replace: true,
        state: { success: res.data?.message || 'Template deleted' },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <AppShell
      active="notifications"
      onChange={(navId) => ADMIN_ROUTES[navId] && navigate(ADMIN_ROUTES[navId])}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Notifications' },
        { label: 'Templates' },
        { label: isCreate ? 'Create' : template?.code || 'Edit' },
      ]}
    >
      <PageHeader
        icon={FileText}
        iconColor="#fcd34d"
        title={isCreate ? 'New template' : `Edit template${template?.code ? `: ${template.code}` : ''}`}
        subtitle="Reusable subject/body templates with placeholder variables."
      />

      <div style={{ marginBottom: 12 }}>
        <button className="btn-ghost" type="button" onClick={goBack}>
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <p style={{ color: 'var(--t3)', fontSize: 13, marginTop: 0 }}>
          Placeholders: {TEMPLATE_PLACEHOLDERS.join(' ')}
        </p>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
          {isCreate && (
            <FormField
              label="Code *"
              value={form.code}
              onChange={(v) => setForm((f) => ({ ...f, code: v }))}
              required
            />
          )}
          <FormField
            label="Name *"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            required
          />
          <FormSelect
            label="Category"
            value={form.category}
            options={NOTIFICATION_CATEGORIES.map((c) => ({ value: c, label: formatLabel(c) }))}
            onChange={(v) => setForm((f) => ({ ...f, category: v }))}
          />
          <FormSelect
            label="Channel"
            value={form.channel}
            options={NOTIFICATION_CHANNELS.map((c) => ({ value: c, label: formatLabel(c) }))}
            onChange={(v) => setForm((f) => ({ ...f, channel: v }))}
          />
          <FormSelect
            label="Priority"
            value={form.priority}
            options={NOTIFICATION_PRIORITIES.map((p) => ({ value: p, label: formatLabel(p) }))}
            onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
          />
          <FormField
            label="Subject template"
            value={form.subjectTemplate}
            onChange={(v) => setForm((f) => ({ ...f, subjectTemplate: v }))}
          />
          <FormField
            label="Body template *"
            value={form.bodyTemplate}
            onChange={(v) => setForm((f) => ({ ...f, bodyTemplate: v }))}
            textarea
            rows={6}
            required
          />
          <FormField
            label="Notes"
            value={form.notes}
            onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            textarea
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : isCreate ? 'Create' : 'Update'}
            </button>
            {!isCreate && template && !template.isSystem && (
              <button
                className="crud-btn"
                type="button"
                style={{ color: '#fca5a5' }}
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete template"
        message="Are you sure you want to delete this template?"
        confirmLabel="Delete"
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
        busy={saving}
      />
    </AppShell>
  );
}
