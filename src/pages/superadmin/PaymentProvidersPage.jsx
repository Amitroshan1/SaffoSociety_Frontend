import { useEffect, useState } from 'react';
import { integrationsService } from '../../services/integrations.service';

export default function PaymentProvidersPage() {
  const [intents, setIntents] = useState([]);
  const [error, setError] = useState('');
  const [reconcileResult, setReconcileResult] = useState(null);
  const [reconciling, setReconciling] = useState(false);
  const [societyId, setSocietyId] = useState('');

  const load = (params = {}) =>
    integrationsService
      .listPaymentIntents(params)
      .then((res) => setIntents(res.data.data.intents || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load intents'));

  useEffect(() => {
    load();
  }, []);

  const filter = (e) => {
    e.preventDefault();
    load(societyId ? { societyId } : {});
  };

  const reconcile = async () => {
    setReconciling(true);
    setError('');
    try {
      const res = await integrationsService.reconcilePayments();
      setReconcileResult(res.data.data);
      load(societyId ? { societyId } : {});
    } catch (err) {
      setError(err.response?.data?.message || 'Reconcile failed');
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div>
      <h1 className="sa-page-title">Payment Providers</h1>
      <p className="sa-page-sub">Payment intents and reconciliation</p>
      {error && <div className="sa-error">{error}</div>}

      <div className="sa-card">
        <div className="sa-actions">
          <button
            type="button"
            className="sa-btn sa-btn-primary"
            onClick={reconcile}
            disabled={reconciling}
          >
            {reconciling ? 'Reconciling…' : 'Run reconciliation'}
          </button>
        </div>
        {reconcileResult && (
          <pre style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
            {JSON.stringify(reconcileResult, null, 2)}
          </pre>
        )}
      </div>

      <div className="sa-card">
        <form onSubmit={filter}>
          <div className="sa-field">
            <label>Filter by society ID (optional)</label>
            <input value={societyId} onChange={(e) => setSocietyId(e.target.value)} />
          </div>
          <button type="submit" className="sa-btn">
            Apply filter
          </button>
        </form>
      </div>

      <div className="sa-card">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>External ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {intents.map((i) => (
              <tr key={i.id}>
                <td>{i.providerCode || i.provider_code || '—'}</td>
                <td>{i.externalId || i.external_id || '—'}</td>
                <td>{i.amountMinor ?? i.amount_minor ?? '—'}</td>
                <td>{i.status}</td>
                <td>{i.createdAt || i.created_at || '—'}</td>
              </tr>
            ))}
            {!intents.length && (
              <tr>
                <td colSpan={5}>No payment intents</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
