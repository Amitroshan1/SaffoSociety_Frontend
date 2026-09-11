import { useEffect, useState } from 'react';
import { integrationsService } from '../../services/integrations.service';

export default function WebhooksPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [dlq, setDlq] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    targetUrl: '',
    events: '*',
    maxAttempts: 8,
    timeoutSeconds: 10,
  });

  const load = () =>
    Promise.all([
      integrationsService.listWebhookSubscriptions(),
      integrationsService.listWebhookDeliveries(),
      integrationsService.listWebhookDlq(),
    ])
      .then(([subs, dels, dlqRes]) => {
        setSubscriptions(subs.data.data.subscriptions || []);
        setDeliveries(dels.data.data.deliveries || []);
        setDlq(dlqRes.data.data.items || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load webhooks'));

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await integrationsService.createWebhookSubscription({
        name: form.name,
        targetUrl: form.targetUrl,
        events: form.events.split(',').map((s) => s.trim()).filter(Boolean),
        maxAttempts: Number(form.maxAttempts),
        timeoutSeconds: Number(form.timeoutSeconds),
      });
      setForm({ name: '', targetUrl: '', events: '*', maxAttempts: 8, timeoutSeconds: 10 });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    }
  };

  const testSub = async (id) => {
    setError('');
    try {
      await integrationsService.testWebhookSubscription(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Test failed');
    }
  };

  return (
    <div>
      <h1 className="sa-page-title">Webhooks</h1>
      <p className="sa-page-sub">Outbound subscriptions, deliveries, and dead-letter queue</p>
      {error && <div className="sa-error">{error}</div>}

      <div className="sa-card">
        <h3>New subscription</h3>
        <form onSubmit={create}>
          <div className="sa-form-grid">
            <div className="sa-field">
              <label>name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="sa-field">
              <label>target URL</label>
              <input
                value={form.targetUrl}
                onChange={(e) => setForm((p) => ({ ...p, targetUrl: e.target.value }))}
                required
              />
            </div>
            <div className="sa-field">
              <label>events (comma-separated)</label>
              <input
                value={form.events}
                onChange={(e) => setForm((p) => ({ ...p, events: e.target.value }))}
              />
            </div>
          </div>
          <button type="submit" className="sa-btn sa-btn-primary">
            Create subscription
          </button>
        </form>
      </div>

      <div className="sa-card">
        <h3>Subscriptions</h3>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Target</th>
              <th>Events</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.targetUrl || s.target_url}</td>
                <td>{(s.events || []).join(', ')}</td>
                <td>{s.status}</td>
                <td>
                  <button type="button" className="sa-btn" onClick={() => testSub(s.id)}>
                    Test
                  </button>
                </td>
              </tr>
            ))}
            {!subscriptions.length && (
              <tr>
                <td colSpan={5}>No subscriptions</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sa-card">
        <h3>Recent deliveries</h3>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>HTTP</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id}>
                <td>{d.eventType || d.event_type}</td>
                <td>{d.status}</td>
                <td>{d.attemptCount ?? d.attempt_count ?? '—'}</td>
                <td>{d.httpStatus ?? d.http_status ?? '—'}</td>
                <td>{d.createdAt || d.created_at || '—'}</td>
              </tr>
            ))}
            {!deliveries.length && (
              <tr>
                <td colSpan={5}>No deliveries</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sa-card">
        <h3>Dead-letter queue</h3>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Delivery</th>
              <th>Reason</th>
              <th>Failed at</th>
            </tr>
          </thead>
          <tbody>
            {dlq.map((item) => (
              <tr key={item.id}>
                <td>{item.deliveryId || item.delivery_id || item.id}</td>
                <td>{item.reason || item.error || '—'}</td>
                <td>{item.failedAt || item.failed_at || '—'}</td>
              </tr>
            ))}
            {!dlq.length && (
              <tr>
                <td colSpan={3}>DLQ empty</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
