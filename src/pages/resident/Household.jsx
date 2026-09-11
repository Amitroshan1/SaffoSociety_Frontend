import { useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { getResidentHousehold } from '../../services/residentPortal.service';

const columns = [
  { key: 'residentName', label: 'Member' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'moveInDate', label: 'Move In' },
];

export default function ResidentHouseholdPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getResidentHousehold();
        setRows(res.data?.data?.household || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch household');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <SkeletonLoader rows={5} />;
  if (error) return <EmptyState title="Household unavailable" description={error} />;

  return (
    <div>
      <h1>My Household</h1>
      <div className="resident-panel">
        <DataTable
          columns={columns}
          rows={rows}
          loading={false}
          emptyTitle="No household members found"
        />
      </div>
    </div>
  );
}
