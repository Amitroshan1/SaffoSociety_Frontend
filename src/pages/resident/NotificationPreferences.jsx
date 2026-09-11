import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FormField } from '../../components/common/index.js';
import {
  getResidentNotificationPreferences,
  updateResidentNotificationPreferences,
} from '../../services/notification.service.js';

const initialState = {
  emailEnabled: false,
  smsEnabled: false,
  pushEnabled: false,
  billingEnabled: true,
  visitorEnabled: true,
  noticesEnabled: true,
  emergencyEnabled: true,
  quietHoursStart: '',
  quietHoursEnd: '',
};

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="resident-checkbox-row">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export default function ResidentNotificationPreferencesPage() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getResidentNotificationPreferences();
      setForm({ ...initialState, ...(res.data?.data?.preferences || res.data?.data || {}) });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateResidentNotificationPreferences(form);
      setSuccess('Preferences updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading preferences…</p>;

  return (
    <div>
      <h1>Notification Preferences</h1>
      <p className="resident-page-subtitle">Choose which alerts you receive and when.</p>
      {error && <p className="resident-error">{error}</p>}
      {success && <p className="resident-success">{success}</p>}

      <form onSubmit={onSubmit} className="resident-form">
        <h3>Channels</h3>
        <Checkbox label="Email alerts" checked={form.emailEnabled} onChange={(v) => setForm((s) => ({ ...s, emailEnabled: v }))} />
        <Checkbox label="SMS alerts" checked={form.smsEnabled} onChange={(v) => setForm((s) => ({ ...s, smsEnabled: v }))} />
        <Checkbox label="Push alerts" checked={form.pushEnabled} onChange={(v) => setForm((s) => ({ ...s, pushEnabled: v }))} />

        <h3>Topics</h3>
        <Checkbox label="Billing updates" checked={form.billingEnabled} onChange={(v) => setForm((s) => ({ ...s, billingEnabled: v }))} />
        <Checkbox label="Visitor updates" checked={form.visitorEnabled} onChange={(v) => setForm((s) => ({ ...s, visitorEnabled: v }))} />
        <Checkbox label="Notice updates" checked={form.noticesEnabled} onChange={(v) => setForm((s) => ({ ...s, noticesEnabled: v }))} />
        <Checkbox label="Emergency alerts" checked={form.emergencyEnabled} onChange={(v) => setForm((s) => ({ ...s, emergencyEnabled: v }))} />

        <h3>Quiet hours</h3>
        <div className="resident-form-two-col">
          <FormField label="Start time" type="time" value={form.quietHoursStart || ''} onChange={(v) => setForm((s) => ({ ...s, quietHoursStart: v }))} />
          <FormField label="End time" type="time" value={form.quietHoursEnd || ''} onChange={(v) => setForm((s) => ({ ...s, quietHoursEnd: v }))} />
        </div>

        <div className="resident-inline-actions">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
          <Link to="/resident/notifications">
            Back to notifications
          </Link>
        </div>
      </form>
    </div>
  );
}
