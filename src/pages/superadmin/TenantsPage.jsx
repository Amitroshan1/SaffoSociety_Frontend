import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { platformService } from '../../services/platform.service';

const emptyForm = {
  name: '',
  code: '',
  adminEmail: '',
  planCode: 'trial',
  region: 'IN',
  timezone: 'Asia/Kolkata',
};

export default function TenantsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () =>
    platformService
      .listTenants({ pageSize: 50 })
      .then((res) => setItems(res.data.data.items || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load tenants'));

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await platformService.createTenant(form);
      setForm(emptyForm);
      setMsg('Tenant created (draft). Open detail to provision.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    }
  };

  return (
    <div>
      <h1 className="sa-page-title">Tenant Management</h1>
      <p className="sa-page-sub">Lifecycle of societies on the platform</p>
      {error && <div className="sa-error">{error}</div>}
      {msg && (
        <div className="sa-muted" style={{ marginBottom: '1rem' }}>
          {msg}
        </div>
      )}

      <div className="sa-card">
        <h3>Create Tenant</h3>
        <form onSubmit={create}>
          <div className="sa-form-grid">
            {['name', 'code', 'adminEmail', 'planCode', 'region', 'timezone'].map((key) => (
              <div className="sa-field" key={key}>
                <label>{key}</label>
                <input
                  value={form[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  required={['name', 'code', 'adminEmail'].includes(key)}
                />
              </div>
            ))}
          </div>
          <button type="submit" className="sa-btn sa-btn-primary">
            Create
          </button>
        </form>
      </div>

      <div className="sa-card">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Status</th>
              <th>Plan</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.code}</td>
                <td>
                  <span className={`sa-badge ${t.status}`}>{t.status}</span>
                </td>
                <td>{t.planCode}</td>
                <td>
                  <Link className="sa-btn" to={`/superadmin/tenants/${t.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
