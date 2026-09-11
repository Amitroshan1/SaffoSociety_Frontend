import { useEffect, useState } from 'react';
import { platformService } from '../../services/platform.service';

export default function PlatformAuditPage() {
  const [data, setData] = useState({ items: [] });
  useEffect(() => {
    platformService.auditLogs({ pageSize: 50 }).then((res) => setData(res.data.data));
  }, []);
  return (
    <div>
      <h1 className="sa-page-title">Platform Audit Logs</h1>
      <p className="sa-page-sub">Control-plane actions</p>
      <div className="sa-card">
        <table className="sa-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>
            {(data.items || []).map((r) => (
              <tr key={r.id}>
                <td>{r.createdAt}</td>
                <td>{r.action}</td>
                <td>
                  {r.resourceType}/{r.resourceId}
                </td>
                <td>
                  {r.actorRole} {r.actorUserId?.slice(0, 8)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
