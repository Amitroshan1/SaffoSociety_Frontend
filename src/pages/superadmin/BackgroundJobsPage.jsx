import { useEffect, useState } from 'react';
import { platformService } from '@/services/platform.service';

export default function BackgroundJobsPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    platformService.jobs().then((res) => setItems(res.data.data.items || []));
  }, []);
  return (
    <div>
      <h1 className="sa-page-title">Background Jobs</h1>
      <p className="sa-page-sub">Provision, rollups, announcement fan-out history</p>
      <div className="sa-card">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((j) => (
              <tr key={j.id}>
                <td>{j.jobKey}</td>
                <td>{j.status}</td>
                <td>{j.durationMs != null ? `${j.durationMs} ms` : '—'}</td>
                <td>{j.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
