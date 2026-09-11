import { useEffect, useState } from 'react';
import { integrationsService } from '../../services/integrations.service';

export default function IdentityProvidersPage() {
  const [links, setLinks] = useState([]);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  const load = (params = {}) =>
    integrationsService
      .listIdentityLinks(params)
      .then((res) => setLinks(res.data.data.links || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load identity links'));

  useEffect(() => {
    load();
  }, []);

  const filter = (e) => {
    e.preventDefault();
    load(userId ? { userId } : {});
  };

  return (
    <div>
      <h1 className="sa-page-title">Identity Providers</h1>
      <p className="sa-page-sub">IdP subject links (Google, Microsoft, Apple, LDAP)</p>
      {error && <div className="sa-error">{error}</div>}

      <div className="sa-card">
        <form onSubmit={filter}>
          <div className="sa-field">
            <label>Filter by user ID (optional)</label>
            <input value={userId} onChange={(e) => setUserId(e.target.value)} />
          </div>
          <button type="submit" className="sa-btn sa-btn-primary">
            Apply filter
          </button>
        </form>
      </div>

      <div className="sa-card">
        <table className="sa-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Provider</th>
              <th>Subject</th>
              <th>Email</th>
              <th>Status</th>
              <th>Linked at</th>
            </tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l.id}>
                <td>{l.userId || l.user_id}</td>
                <td>{l.provider}</td>
                <td>{l.subject}</td>
                <td>{l.email || '—'}</td>
                <td>{l.status}</td>
                <td>{l.linkedAt || l.linked_at || '—'}</td>
              </tr>
            ))}
            {!links.length && (
              <tr>
                <td colSpan={6}>No identity links</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
