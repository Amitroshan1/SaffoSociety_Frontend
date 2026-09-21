import { useEffect, useState } from 'react';
import DataTable from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import { listResidentVisitors } from '@/services/residentPortal.service';

const columns = [
  { key: 'visitorName', label: 'Visitor' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created At' },
];

export default function ResidentVisitorHistoryPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await listResidentVisitors({ page: 1, pageSize: 25, sortBy: 'created_at', sortOrder: 'desc' });
        setRows((res.data?.data?.visits || []).filter((v) => ['checked_out', 'cancelled', 'rejected'].includes(v.status)));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch visitor history');
      }
    })();
  }, []);

  if (error) return <EmptyState title="Visitor history unavailable" description={error} />;
  return (
    <div>
      <h1>Visitor History</h1>
      <DataTable columns={columns} rows={rows} emptyTitle="No historical visits found" />
    </div>
  );
}
