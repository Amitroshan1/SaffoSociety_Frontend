import { useEffect, useState } from 'react';
import { platformService } from '@/services/platform.service';

export default function MaintenancePage() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    platformService.getMaintenance().then((res) => {
      setData(res.data.data);
      setMessage(res.data.data.message || '');
    });

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || 'Failed'));
  }, []);

  const toggle = async (enabled) => {
    setError('');
    try {
      await platformService.setMaintenance({ enabled, message });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div>
      <h1 className="sa-page-title">Maintenance Mode</h1>
      <p className="sa-page-sub">Blocks society APIs with HTTP 503 while platform remains available</p>
      {error && <div className="sa-error">{error}</div>}
      <div className="sa-card">
        <p>
          Status:{' '}
          <strong>{data?.enabled ? 'ENABLED' : 'disabled'}</strong>
        </p>
        <div className="sa-field">
          <label>Message</label>
          <input value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="sa-actions">
          <button type="button" className="sa-btn sa-btn-danger" onClick={() => toggle(true)}>
            Enable
          </button>
          <button type="button" className="sa-btn sa-btn-primary" onClick={() => toggle(false)}>
            Disable
          </button>
        </div>
      </div>
    </div>
  );
}
