import { useEffect, useState } from 'react';
import EmptyState from '@/components/common/EmptyState';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import { getResidentFlat } from '@/services/residentPortal.service';

export default function ResidentFlatPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getResidentFlat();
        setData(res.data?.data || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch flat details');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <SkeletonLoader rows={4} />;
  if (error) return <EmptyState title="Flat details unavailable" description={error} />;
  if (!data) return <EmptyState title="No flat data" />;

  return (
    <div>
      <h1>My Flat</h1>
      <div className="resident-panel">
        <p>Society: {data.society?.name || '-'}</p>
        <p>Building: {data.building?.name || '-'}</p>
        <p>Flat: {data.flat?.flatNo || '-'}</p>
        <p>Floor: {data.flat?.floorNo || '-'}</p>
        <p>Area: {data.flat?.areaSqft || '-'} sqft</p>
        <p>Ownership: {data.flat?.ownershipType || '-'}</p>
        <p>Occupancy: {data.occupancy?.status || '-'}</p>
      </div>
    </div>
  );
}
