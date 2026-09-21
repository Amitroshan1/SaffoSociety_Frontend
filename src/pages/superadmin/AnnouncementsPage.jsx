import { useEffect, useState } from 'react';
import { platformService } from '@/services/platform.service';

export default function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: '',
    body: '',
    type: 'broadcast',
    priority: 'normal',
  });
  const [error, setError] = useState('');

  const load = () =>
    platformService
      .listAnnouncements()
      .then((res) => setItems(res.data.data.items || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed'));

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await platformService.createAnnouncement(form);
      setForm({ title: '', body: '', type: 'broadcast', priority: 'normal' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    }
  };

  return (
    <div>
      <h1 className="sa-page-title">Global Announcements</h1>
      <p className="sa-page-sub">Broadcast to tenant admins via Notification engine</p>
      {error && <div className="sa-error">{error}</div>}
      <div className="sa-card">
        <form onSubmit={create}>
          <div className="sa-form-grid">
            <div className="sa-field">
              <label>title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </div>
            <div className="sa-field">
              <label>type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="broadcast">broadcast</option>
                <option value="maintenance">maintenance</option>
                <option value="emergency">emergency</option>
                <option value="release">release</option>
              </select>
            </div>
          </div>
          <div className="sa-field">
            <label>body</label>
            <textarea
              rows={4}
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              required
            />
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
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.type}</td>
                <td>{a.status}</td>
                <td>
                  <button
                    type="button"
                    className="sa-btn"
                    onClick={() => platformService.sendAnnouncement(a.id).then(load)}
                    disabled={a.status === 'sent'}
                  >
                    Send
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
