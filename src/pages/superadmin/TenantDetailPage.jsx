import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { platformService } from '@/services/platform.service';

const USAGE_METRICS = [
  { key: 'users', label: 'Users' },
  { key: 'buildings', label: 'Buildings' },
  { key: 'flats', label: 'Flats' },
  { key: 'visitors', label: 'Visitors' },
  { key: 'parkingSlots', label: 'Parking slots' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'complaints', label: 'Complaints' },
];

function formatWhen(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatLabel(key) {
  return String(key || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function DetailRow({ label, value, mono = false }) {
  const display =
    value === null || value === undefined || value === ''
      ? '—'
      : typeof value === 'boolean'
        ? value
          ? 'Yes'
          : 'No'
        : String(value);

  return (
    <div className="sa-detail-row">
      <span className="sa-detail-label">{label}</span>
      <span className={`sa-detail-value${mono ? ' is-mono' : ''}`}>{display}</span>
    </div>
  );
}

function EmptyBlock({ children }) {
  return <p className="sa-muted" style={{ margin: 0 }}>{children}</p>;
}

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

  const usage = data?.usage || {};
  const health = data?.health || {};
  const healthChecks = health.checks || {};
  const subscription = data?.subscription;
  const license = data?.license;
  const features = data?.features || {};

  const featureEntries = useMemo(
    () => Object.entries(features).sort(([a], [b]) => a.localeCompare(b)),
    [features]
  );

  const healthStatus = String(health.status || '').toLowerCase();
  const healthOk = healthStatus === 'healthy';

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
        <div className="sa-card-head">
          <h3>Usage &amp; Health</h3>
          {(usage.asOf || health.asOf) && (
            <span className="sa-muted sa-card-meta">
              Updated {formatWhen(usage.asOf || health.asOf)}
            </span>
          )}
        </div>

        <h4 className="sa-section-label">Usage</h4>
        <div className="sa-kpi-grid" style={{ marginBottom: '1.25rem' }}>
          {USAGE_METRICS.map(({ key, label }) => (
            <div key={key} className="sa-kpi">
              <div className="sa-kpi-label">{label}</div>
              <div className="sa-kpi-value">
                {usage[key] != null ? Number(usage[key]).toLocaleString() : '—'}
              </div>
            </div>
          ))}
        </div>

        <h4 className="sa-section-label">Health</h4>
        <div className="sa-health-banner">
          <span className={`sa-badge ${healthOk ? 'healthy' : 'degraded'}`}>
            {health.status || 'unknown'}
          </span>
          <span className="sa-muted">Checked {formatWhen(health.asOf)}</span>
        </div>
        <div className="sa-check-grid">
          <div className="sa-check-item">
            <span className="sa-check-label">Tenant status</span>
            <span className={`sa-badge ${healthChecks.tenantStatus || ''}`}>
              {healthChecks.tenantStatus || '—'}
            </span>
          </div>
          <div className="sa-check-item">
            <span className="sa-check-label">Society linked</span>
            <span className={`sa-badge ${healthChecks.hasSociety ? 'active' : 'suspended'}`}>
              {healthChecks.hasSociety ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="sa-check-item">
            <span className="sa-check-label">Isolation mode</span>
            <span className="sa-badge sa-badge-neutral">
              {healthChecks.isolationMode || '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="sa-card">
        <h3>Subscription</h3>
        {subscription ? (
          <div className="sa-detail-grid">
            <DetailRow label="Status" value={subscription.status} />
            <DetailRow label="Billing period" value={subscription.billingPeriod} />
            <DetailRow label="Auto renew" value={subscription.autoRenew} />
            <DetailRow label="Starts" value={formatWhen(subscription.startsAt)} />
            <DetailRow label="Ends" value={formatWhen(subscription.endsAt)} />
            <DetailRow label="Trial ends" value={formatWhen(subscription.trialEndsAt)} />
            <DetailRow label="Grace ends" value={formatWhen(subscription.graceEndsAt)} />
            <DetailRow label="Cancelled" value={formatWhen(subscription.cancelledAt)} />
            <DetailRow label="External ref" value={subscription.externalRef} />
            <DetailRow label="Subscription ID" value={subscription.id} mono />
            <DetailRow label="Plan ID" value={subscription.planId} mono />
          </div>
        ) : (
          <EmptyBlock>No active subscription.</EmptyBlock>
        )}

        <div className="sa-actions" style={{ marginTop: '1rem' }}>
          <div className="sa-field" style={{ margin: 0, minWidth: 160 }}>
            <label htmlFor="plan-code">Plan code</label>
            <input
              id="plan-code"
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
              placeholder="monthly"
            />
          </div>
          <button
            type="button"
            className="sa-btn"
            style={{ alignSelf: 'end' }}
            onClick={() => run(() => platformService.assignSubscription(tenantId, planCode), 'Plan assigned')}
          >
            Assign Plan
          </button>
          <button
            type="button"
            className="sa-btn"
            style={{ alignSelf: 'end' }}
            onClick={() => run(() => platformService.issueLicense(tenantId, { validDays: 365 }), 'License issued')}
          >
            Issue License
          </button>
        </div>

        {license && (
          <>
            <h4 className="sa-section-label" style={{ marginTop: '1.25rem' }}>License</h4>
            <div className="sa-detail-grid">
              <DetailRow label="Status" value={license.status} />
              <DetailRow label="License key" value={license.licenseKey} mono />
              <DetailRow label="Issued" value={formatWhen(license.issuedAt)} />
              <DetailRow label="Expires" value={formatWhen(license.expiresAt)} />
              <DetailRow label="Active" value={license.isActive} />
            </div>
          </>
        )}
      </div>

      <div className="sa-card">
        <div className="sa-card-head">
          <h3>Features</h3>
          <span className="sa-muted sa-card-meta">
            {featureEntries.length} flags
          </span>
        </div>
        {featureEntries.length ? (
          <div className="sa-feature-grid">
            {featureEntries.map(([key, enabled]) => (
              <div
                key={key}
                className={`sa-feature-chip ${enabled ? 'is-on' : 'is-off'}`}
              >
                <span className="sa-feature-name">{formatLabel(key)}</span>
                <span className={`sa-badge ${enabled ? 'active' : 'suspended'}`}>
                  {enabled ? 'On' : 'Off'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyBlock>No feature flags resolved for this tenant.</EmptyBlock>
        )}
      </div>

      <div className="sa-card">
        <h3>Impersonate Admin</h3>
        <div className="sa-field">
          <label>Reason (required)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Support ticket #123 — investigate billing"
          />
        </div>
        <button
          type="button"
          className="sa-btn sa-btn-primary"
          onClick={impersonate}
          disabled={reason.trim().length < 5}
        >
          Start Impersonation
        </button>
      </div>
    </div>
  );
}
