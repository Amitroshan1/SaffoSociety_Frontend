import { useEffect, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import { FormField, FormSelect } from '@/components/common/index.js';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  TARGET_TYPES,
  broadcastNotification,
  formatLabel,
  listNotificationTemplates,
} from '@/services/notification.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const initialForm = {
  templateId: '',
  title: '',
  body: '',
  channels: ['in_app'],
  targetType: 'society',
  targetRole: '',
  buildingId: '',
  wingId: '',
  flatId: '',
  residentId: '',
  userId: '',
  priority: 'normal',
  category: 'system',
};

export default function BroadcastPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [templates, setTemplates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    listNotificationTemplates({ pageSize: 100 })
      .then((r) => setTemplates(r.data?.data?.templates || []))
      .catch(() => setTemplates([]));
  }, []);

  const toggleChannel = (channel) => {
    setForm((f) => {
      const has = f.channels.includes(channel);
      const next = has ? f.channels.filter((c) => c !== channel) : [...f.channels, channel];
      return { ...f, channels: next.length ? next : ['in_app'] };
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        templateId: form.templateId || null,
        title: form.title.trim() || null,
        body: form.body.trim() || null,
        channels: form.channels,
        targetType: form.targetType,
        targetRole: form.targetRole.trim() || null,
        buildingId: form.buildingId.trim() || null,
        wingId: form.wingId.trim() || null,
        flatId: form.flatId.trim() || null,
        residentId: form.residentId.trim() || null,
        userId: form.userId.trim() || null,
        priority: form.priority,
        category: form.category,
      };
      await broadcastNotification(payload);
      setSuccess('Broadcast queued successfully');
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || 'Broadcast failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      active="notifications"
      breadcrumb={[{ label: 'Home' }, { label: 'Notifications' }, { label: 'Broadcast' }]}
    >
      <PageHeader
        icon={Send}
        iconColor="#fcd34d"
        title="Broadcast Notification"
        subtitle="Send a message to society, building, wing, flat, role, or specific residents."
      />

      <div style={{ marginBottom: 12 }}>
        <button
          className="btn-ghost"
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.notifications || '/admin/notifications')}
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
          <FormSelect
            label="Template (optional)"
            value={form.templateId}
            options={[
              { value: '', label: '— Custom message —' },
              ...templates.map((t) => ({ value: t.id, label: `${t.code} — ${t.name}` })),
            ]}
            onChange={(v) => setForm((f) => ({ ...f, templateId: v }))}
          />
          <FormField
            label="Title"
            value={form.title}
            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            required={!form.templateId}
          />
          <FormField
            label="Body"
            value={form.body}
            onChange={(v) => setForm((f) => ({ ...f, body: v }))}
            textarea
            rows={5}
            required={!form.templateId}
          />

          <div>
            <div style={{ opacity: 0.8, marginBottom: 6 }}>Channels</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {NOTIFICATION_CHANNELS.filter((c) => c !== 'webhook').map((ch) => (
                <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={form.channels.includes(ch)}
                    onChange={() => toggleChannel(ch)}
                  />
                  {formatLabel(ch)}
                </label>
              ))}
            </div>
          </div>

          <FormSelect
            label="Target type"
            value={form.targetType}
            options={TARGET_TYPES.map((t) => ({ value: t, label: formatLabel(t) }))}
            onChange={(v) => setForm((f) => ({ ...f, targetType: v }))}
          />
          {form.targetType === 'role' && (
            <FormField
              label="Target role"
              value={form.targetRole}
              onChange={(v) => setForm((f) => ({ ...f, targetRole: v }))}
              required
            />
          )}
          {['building', 'wing', 'flat'].includes(form.targetType) && (
            <FormField
              label="Building ID"
              value={form.buildingId}
              onChange={(v) => setForm((f) => ({ ...f, buildingId: v }))}
              required={form.targetType === 'building'}
            />
          )}
          {['wing', 'flat'].includes(form.targetType) && (
            <FormField
              label="Wing ID"
              value={form.wingId}
              onChange={(v) => setForm((f) => ({ ...f, wingId: v }))}
              required={form.targetType === 'wing'}
            />
          )}
          {form.targetType === 'flat' && (
            <FormField
              label="Flat ID"
              value={form.flatId}
              onChange={(v) => setForm((f) => ({ ...f, flatId: v }))}
              required
            />
          )}
          {form.targetType === 'resident' && (
            <FormField
              label="Resident ID"
              value={form.residentId}
              onChange={(v) => setForm((f) => ({ ...f, residentId: v }))}
              required
            />
          )}
          {form.targetType === 'user' && (
            <FormField
              label="User ID"
              value={form.userId}
              onChange={(v) => setForm((f) => ({ ...f, userId: v }))}
              required
            />
          )}

          <FormSelect
            label="Category"
            value={form.category}
            options={NOTIFICATION_CATEGORIES.map((c) => ({ value: c, label: formatLabel(c) }))}
            onChange={(v) => setForm((f) => ({ ...f, category: v }))}
          />
          <FormSelect
            label="Priority"
            value={form.priority}
            options={NOTIFICATION_PRIORITIES.map((p) => ({ value: p, label: formatLabel(p) }))}
            onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
          />

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Sending…' : 'Send broadcast'}
          </button>
        </form>
      </section>
    </AppShell>
  );
}
