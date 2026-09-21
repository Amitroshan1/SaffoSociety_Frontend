import { useEffect, useState } from 'react';
import { platformService } from '@/services/platform.service';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([platformService.listPlans(), platformService.listSubscriptions()])
      .then(([p, s]) => {
        setPlans(p.data.data.items || []);
        setSubs(s.data.data.items || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'));
  }, []);

  return (
    <div>
      <h1 className="sa-page-title">Subscriptions</h1>
      <p className="sa-page-sub">Plans and tenant subscription assignments</p>
      {error && <div className="sa-error">{error}</div>}
      <div className="sa-card">
        <h3>Plans</h3>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Period</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td>{p.code}</td>
                <td>{p.name}</td>
                <td>{p.billingPeriod}</td>
                <td>
                  {p.currency} {(p.priceMinor / 100).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sa-card">
        <h3>Tenant Subscriptions</h3>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Status</th>
              <th>Period</th>
              <th>Ends</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}>
                <td>{s.tenantId}</td>
                <td>{s.status}</td>
                <td>{s.billingPeriod}</td>
                <td>{s.endsAt || '—'}</td>
                <td className="sa-actions">
                  <button
                    type="button"
                    className="sa-btn"
                    onClick={() => platformService.renewSubscription(s.id).then(() => window.location.reload())}
                  >
                    Renew
                  </button>
                  <button
                    type="button"
                    className="sa-btn sa-btn-danger"
                    onClick={() => platformService.cancelSubscription(s.id).then(() => window.location.reload())}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
