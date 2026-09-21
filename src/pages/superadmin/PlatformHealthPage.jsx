import { useEffect, useState } from 'react';
import { platformService } from '@/services/platform.service';

export default function PlatformHealthPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    platformService.health().then((res) => setData(res.data.data));
  }, []);
  return (
    <div>
      <h1 className="sa-page-title">Platform Health</h1>
      <p className="sa-page-sub">Dependency status</p>
      <div className="sa-card">
        <p>
          Overall: <strong>{data?.status || '…'}</strong>
        </p>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {(data?.components || []).map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td>{c.status}</td>
                <td>{c.detail || c.head || c.lastJob || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
