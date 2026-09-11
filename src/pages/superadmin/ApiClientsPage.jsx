import { useEffect, useState } from 'react';
import { integrationsService } from '../../services/integrations.service';

export default function ApiClientsPage() {
  const [clients, setClients] = useState([]);
  const [keys, setKeys] = useState([]);
  const [error, setError] = useState('');
  const [newKey, setNewKey] = useState(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    clientCode: '',
    scopes: '',
    rateLimitRpm: 120,
  });
  const [keyForm, setKeyForm] = useState({ clientId: '', name: 'default' });

  const load = () =>
    Promise.all([
      integrationsService.listApiClients(),
      integrationsService.listApiKeys(),
    ])
      .then(([cRes, kRes]) => {
        setClients(cRes.data.data.clients || []);
        setKeys(kRes.data.data.keys || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'));

  useEffect(() => {
    load();
  }, []);

  const createClient = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await integrationsService.createApiClient({
        name: clientForm.name,
        clientCode: clientForm.clientCode,
        scopes: clientForm.scopes
          ? clientForm.scopes.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        rateLimitRpm: Number(clientForm.rateLimitRpm),
      });
      setClientForm({ name: '', clientCode: '', scopes: '', rateLimitRpm: 120 });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Create client failed');
    }
  };

  const createKey = async (e) => {
    e.preventDefault();
    setError('');
    setNewKey(null);
    try {
      const res = await integrationsService.createApiKey({
        clientId: keyForm.clientId,
        name: keyForm.name,
      });
      setNewKey(res.data.data.rawKey || res.data.data.raw_key || res.data.data.key);
      setKeyForm({ clientId: '', name: 'default' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Create key failed');
    }
  };

  const revoke = async (id) => {
    setError('');
    try {
      await integrationsService.revokeApiKey(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Revoke failed');
    }
  };

  return (
    <div>
      <h1 className="sa-page-title">API Clients & Keys</h1>
      <p className="sa-page-sub">Partner and public API access management</p>
      {error && <div className="sa-error">{error}</div>}
      {newKey && (
        <div className="sa-card">
          <p>
            <strong>New API key (copy now — shown once):</strong>
          </p>
          <code>{newKey}</code>
        </div>
      )}

      <div className="sa-card">
        <h3>New client</h3>
        <form onSubmit={createClient}>
          <div className="sa-form-grid">
            <div className="sa-field">
              <label>name</label>
              <input
                value={clientForm.name}
                onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="sa-field">
              <label>client code</label>
              <input
                value={clientForm.clientCode}
                onChange={(e) => setClientForm((p) => ({ ...p, clientCode: e.target.value }))}
                required
              />
            </div>
            <div className="sa-field">
              <label>scopes (comma-separated)</label>
              <input
                value={clientForm.scopes}
                onChange={(e) => setClientForm((p) => ({ ...p, scopes: e.target.value }))}
              />
            </div>
          </div>
          <button type="submit" className="sa-btn sa-btn-primary">
            Create client
          </button>
        </form>
      </div>

      <div className="sa-card">
        <h3>Clients</h3>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Scopes</th>
              <th>Rate limit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>
                  <code>{c.clientCode || c.client_code}</code>
                </td>
                <td>{(c.scopes || c.scopesJson || c.scopes_json || []).join(', ')}</td>
                <td>{c.rateLimitRpm ?? c.rate_limit_rpm ?? '—'}</td>
                <td>{c.status}</td>
              </tr>
            ))}
            {!clients.length && (
              <tr>
                <td colSpan={5}>No clients</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sa-card">
        <h3>Issue API key</h3>
        <form onSubmit={createKey}>
          <div className="sa-form-grid">
            <div className="sa-field">
              <label>client ID</label>
              <input
                value={keyForm.clientId}
                onChange={(e) => setKeyForm((p) => ({ ...p, clientId: e.target.value }))}
                required
              />
            </div>
            <div className="sa-field">
              <label>key name</label>
              <input
                value={keyForm.name}
                onChange={(e) => setKeyForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
          </div>
          <button type="submit" className="sa-btn sa-btn-primary">
            Create key
          </button>
        </form>
      </div>

      <div className="sa-card">
        <h3>API keys</h3>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Prefix</th>
              <th>Client</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id}>
                <td>{k.name}</td>
                <td>
                  <code>{k.keyPrefix || k.key_prefix}</code>
                </td>
                <td>{k.clientId || k.client_id}</td>
                <td>{k.status}</td>
                <td>
                  {k.status === 'active' && (
                    <button type="button" className="sa-btn sa-btn-danger" onClick={() => revoke(k.id)}>
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!keys.length && (
              <tr>
                <td colSpan={5}>No keys</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
