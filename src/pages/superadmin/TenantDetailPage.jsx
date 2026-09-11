import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { platformService } from '../../services/platform.service';

export default function TenantDetailPage() {
  const { tenantId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [reason, setReason] = useState('');
  const [planCode, setPlanCode] = useState('monthly');

  const load = () =>
    platformService
      .getTenant(tenantId)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load tenant'));

  useEffect(() => {
    load();
  }, [tenantId]);

  const run = async (fn, okMsg) => {
    setError('');
    setMsg('');
    try {
      const res = await fn();
      setMsg(okMsg);
      if (res?.data?.data?.bootstrap?.tempPassword) {
        setMsg(`${okMsg} Temp password: ${res.data.data.bootstrap.tempPassword}`);
      }
      load();
      return res;
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
      return null;
    }
  };

  const impersonate = async () => {
    const res = await run(
      () => platformService.impersonate(tenantId, reason),
      'Impersonation token issued'
    );
    if (!res) return;
    const payload = res.data.data;
    const platformToken = localStorage.getItem('accessToken');
    sessionStorage.setItem(
      'impersonation',
      JSON.stringify({
        banner: payload.banner,
        platformToken,
        sessionId: payload.sessionId,
      })
    );
    localStorage.setItem('accessToken', payload.accessToken);
    window.location.href = '/admin/dashboard';
  };

  if (!data && !error) return <div className="sa-muted">Loading…</div>;

  return (
    <div>
      <p>
        <Link to="/superadmin/tenants" className="sa-btn sa-btn-ghost">
          ← Tenants
        </Link>
      </p>
      <h1 className="sa-page-title">{data?.name || 'Tenant'}</h1>
      <p className="sa-page-sub">
        {data?.code} · <span className={`sa-badge ${data?.status}`}>{data?.status}</span>
      </p>
      {error && <div className="sa-error">{error}</div>}
      {msg && <div className="sa-muted" style={{ marginBottom: '1rem' }}>{msg}</div>}

      <div className="sa-card">
        <h3>Lifecycle</h3>
        <div className="sa-actions">
          <button type="button" className="sa-btn sa-btn-primary" onClick={() => run(() => platformService.provisionTenant(tenantId), 'Provisioned')}>
            Provision
          </button>
          <button type="button" className="sa-btn" onClick={() => run(() => platformService.activateTenant(tenantId), 'Activated')}>
            Activate
          </button>
          <button type="button" className="sa-btn" onClick={() => run(() => platformService.suspendTenant(tenantId), 'Suspended')}>
            Suspend
          </button>
          <button type="button" className="sa-btn" onClick={() => run(() => platformService.reactivateTenant(tenantId), 'Reactivated')}>
            Reactivate
          </button>
          <button type="button" className="sa-btn" onClick={() => run(() => platformService.archiveTenant(tenantId), 'Archived')}>
            Archive
          </button>
          <button type="button" className="sa-btn sa-btn-danger" onClick={() => run(() => platformService.deleteTenant(tenantId), 'Delete scheduled')}>
            Schedule Delete
          </button>
        </div>
      </div>

      <div className="sa-card">
        <h3>Usage & Health</h3>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
          {JSON.stringify({ usage: data?.usage, health: data?.health }, null, 2)}
        </pre>
      </div>

      <div className="sa-card">
        <h3>Subscription</h3>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
          {JSON.stringify(data?.subscription, null, 2)}
        </pre>
        <div className="sa-actions" style={{ marginTop: '0.75rem' }}>
          <input value={planCode} onChange={(e) => setPlanCode(e.target.value)} style={{ maxWidth: 160 }} />
          <button
            type="button"
            className="sa-btn"
            onClick={() => run(() => platformService.assignSubscription(tenantId, planCode), 'Plan assigned')}
          >
            Assign Plan
          </button>
          <button
            type="button"
            className="sa-btn"
            onClick={() => run(() => platformService.issueLicense(tenantId, { validDays: 365 }), 'License issued')}
          >
            Issue License
          </button>
        </div>
      </div>

      <div className="sa-card">
        <h3>Features</h3>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
          {JSON.stringify(data?.features, null, 2)}
        </pre>
      </div>

      <div className="sa-card">
        <h3>Impersonate Admin</h3>
        <div className="sa-field">
          <label>Reason (required)</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Support ticket #123 — investigate billing" />
        </div>
        <button type="button" className="sa-btn sa-btn-primary" onClick={impersonate} disabled={reason.trim().length < 5}>
          Start Impersonation
        </button>
      </div>
    </div>
  );
}
