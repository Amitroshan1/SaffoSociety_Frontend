import { useEffect, useState } from 'react';
import { platformService } from '../../services/platform.service';

export default function GlobalRolesPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    platformService.listRoles().then((res) => setItems(res.data.data.items || []));
  }, []);
  return (
    <div>
      <h1 className="sa-page-title">Global Roles</h1>
      <p className="sa-page-sub">Platform and society role catalog</p>
      <div className="sa-card">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Plane</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.role}>
                <td>{r.role}</td>
                <td>{r.plane}</td>
                <td>{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
