import { useEffect, useState } from 'react';
import { platformService } from '@/services/platform.service';

export default function GlobalSettingsPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [jsonText, setJsonText] = useState('{}');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () =>
    platformService
      .listSettings()
      .then((res) => setItems(res.data.data.items || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'));

  useEffect(() => {
    load();
  }, []);

  const open = (row) => {
    setSelected(row.group);
    setJsonText(JSON.stringify(row.values || {}, null, 2));
  };

  const save = async () => {
    setError('');
    setMsg('');
    try {
      const values = JSON.parse(jsonText);
      await platformService.patchSettings(selected, { values });
      setMsg('Saved');
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    }
  };

  return (
    <div>
      <h1 className="sa-page-title">Global Settings</h1>
      <p className="sa-page-sub">Branding, SMTP refs, security policies — secrets are env-backed</p>
      {error && <div className="sa-error">{error}</div>}
      {msg && <div className="sa-muted">{msg}</div>}
      <div className="sa-card">
        <div className="sa-actions" style={{ marginBottom: '1rem' }}>
          {items.map((s) => (
            <button key={s.group} type="button" className="sa-btn" onClick={() => open(s)}>
              {s.group}
            </button>
          ))}
        </div>
        {selected && (
          <>
            <h3>{selected}</h3>
            <textarea rows={14} value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
            <div style={{ marginTop: '0.75rem' }}>
              <button type="button" className="sa-btn sa-btn-primary" onClick={save}>
                Save group
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
