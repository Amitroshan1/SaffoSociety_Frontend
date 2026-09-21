import { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import {
  ALLOCATION_STATUS_COLORS,
  formatFee,
  formatLabel,
  listResidentParking,
} from '@/services/parking.service';

export default function MyParking() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listResidentParking();
      setRows(data.data?.allocations || data.data?.parking || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load parking');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { key: 'allocationNumber', label: 'Allocation #' },
    { key: 'slotCode', label: 'Slot', render: (r) => r.slotCode || r.slotLabel || '-' },
    { key: 'zoneName', label: 'Zone', render: (r) => r.zoneName || '-' },
    { key: 'vehicleNumber', label: 'Vehicle', render: (r) => r.vehicleNumber || '-' },
    {
      key: 'allocationType',
      label: 'Type',
      render: (r) => formatLabel(r.allocationType),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} colors={ALLOCATION_STATUS_COLORS} />,
    },
    { key: 'startDate', label: 'Start' },
    { key: 'endDate', label: 'End', render: (r) => r.endDate || '-' },
    {
      key: 'monthlyFeeMinor',
      label: 'Fee',
      render: (r) => formatFee(r.monthlyFeeMinor),
    },
  ];

  if (error && !rows.length && !loading) {
    return <EmptyState title="Parking unavailable" description={error} />;
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 4px' }}>My Parking</h1>
      <p className="resident-page-subtitle">
        Your allocated parking slots and related fees.
      </p>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      <DataTable columns={columns} rows={rows} loading={loading} emptyTitle="No parking allocations" />
    </div>
  );
}
