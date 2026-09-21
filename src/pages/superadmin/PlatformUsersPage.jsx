import { useEffect, useState } from 'react';
import { platformService } from '@/services/platform.service';

export default function PlatformUsersPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'platform_support',
  });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () =>
    platformService
      .listUsers()
      .then((res) => setItems(res.data.data.items || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'));

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await platformService.createUser(form);
      setMsg(
        res.data.data.tempPassword
          ? `Created. Temp password: ${res.data.data.tempPassword}`
          : 'Created'
      );
      setForm({ name: '', email: '', phone: '', role: 'platform_support' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    }
  };

  return (
    <div>
      <h1 className="sa-page-title">Platform Users</h1>
      <p className="sa-page-sub">Super Admin, Support, Auditor, Billing operators</p>
      {error && <div className="sa-error">{error}</div>}
      {msg && <div className="sa-muted">{msg}</div>}
      <div className="sa-card">
        <form onSubmit={create}>
          <div className="sa-form-grid">
            {['name', 'email', 'phone'].map((k) => (
              <div className="sa-field" key={k}>
                <label>{k}</label>
                <input
                  value={form[k]}
                  onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                  required
                />
              </div>
            ))}
            <div className="sa-field">
              <label>role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="super_admin">super_admin</option>
                <option value="platform_support">platform_support</option>
                <option value="platform_auditor">platform_auditor</option>
                <option value="platform_billing">platform_billing</option>
              </select>
            </div>
          </div>
          <button type="submit" className="sa-btn sa-btn-primary">
            Create user
          </button>
        </form>
      </div>
      <div className="sa-card">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.isActive ? 'yes' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
