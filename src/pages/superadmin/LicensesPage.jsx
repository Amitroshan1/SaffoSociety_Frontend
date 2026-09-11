import { useEffect, useState } from 'react';
import { platformService } from '../../services/platform.service';

export default function LicensesPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const load = () =>
    platformService
      .listLicenses()
      .then((res) => setItems(res.data.data.items || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'));

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="sa-page-title">Licenses</h1>
      <p className="sa-page-sub">Issued license keys and limits</p>
      {error && <div className="sa-error">{error}</div>}
      <div className="sa-card">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Tenant</th>
              <th>Status</th>
              <th>Expires</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id}>
                <td>
                  <code>{l.licenseKey}</code>
                </td>
                <td>{l.tenantId}</td>
                <td>{l.status}</td>
                <td>{l.expiresAt || '—'}</td>
                <td className="sa-actions">
                  <button
                    type="button"
                    className="sa-btn"
                    onClick={() => platformService.renewLicense(l.id).then(load)}
                  >
                    Renew
                  </button>
                  <button
                    type="button"
                    className="sa-btn sa-btn-danger"
                    onClick={() => platformService.deactivateLicense(l.id).then(load)}
                  >
                    Deactivate
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
