import { useEffect, useState } from 'react';
import { platformService } from '../../services/platform.service';

export default function FeatureFlagsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const load = () =>
    platformService
      .listFlags()
      .then((res) => setItems(res.data.data.items || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'));

  useEffect(() => {
    load();
  }, []);

  const toggle = async (flag) => {
    await platformService.upsertFlag({
      key: flag.key,
      name: flag.name,
      defaultEnabled: !flag.defaultEnabled,
    });
    load();
  };

  return (
    <div>
      <h1 className="sa-page-title">Feature Flags</h1>
      <p className="sa-page-sub">Global defaults (tenant overrides on tenant detail)</p>
      {error && <div className="sa-error">{error}</div>}
      <div className="sa-card">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Name</th>
              <th>Default</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id}>
                <td>
                  <code>{f.key}</code>
                </td>
                <td>{f.name}</td>
                <td>{f.defaultEnabled ? 'ON' : 'OFF'}</td>
                <td>
                  <button type="button" className="sa-btn" onClick={() => toggle(f)}>
                    Toggle default
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
