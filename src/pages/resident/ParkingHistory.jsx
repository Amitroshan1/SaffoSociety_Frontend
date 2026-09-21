import { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';
import StatusBadge from '@/components/common/StatusBadge';
import { useListQuery } from '@/hooks/useListQuery';
import { normalizePagination } from '@/utils/listQuery';
import {
  ALLOCATION_STATUS_COLORS,
  VISITOR_STATUS_COLORS,
  formatFee,
  formatLabel,
  getResidentParkingReceipt,
  listResidentParkingHistory,
} from '@/services/parking.service';

export default function ParkingHistory() {
  const { state, params, setPage } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listResidentParkingHistory(params);
      setRows(data.data?.history || data.data?.items || data.data?.allocations || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load parking history');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const onReceipt = async (row, e) => {
    e.stopPropagation();
    setBusyId(row.id);
    setError('');
    setSuccess('');
    try {
      const { data } = await getResidentParkingReceipt(row.id);
      const receipt = data.data;
      if (receipt?.downloadUrl || receipt?.url) {
        window.open(receipt.downloadUrl || receipt.url, '_blank');
      } else {
        setSuccess(
          `Receipt ${receipt?.receiptNumber || row.allocationNumber || row.id}: ${formatFee(
            receipt?.amount ?? row.monthlyFeeMinor ?? row.feeMinor,
          )}`,
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load receipt');
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    {
      key: 'ref',
      label: 'Reference',
      render: (r) => r.allocationNumber || r.parkingCode || r.id || '-',
    },
    { key: 'kind', label: 'Kind', render: (r) => formatLabel(r.kind || r.type || 'allocation') },
    { key: 'slotCode', label: 'Slot', render: (r) => r.slotCode || '-' },
    { key: 'vehicleNumber', label: 'Vehicle', render: (r) => r.vehicleNumber || '-' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <StatusBadge
          status={r.status}
          colors={{ ...ALLOCATION_STATUS_COLORS, ...VISITOR_STATUS_COLORS }}
        />
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (r) => formatFee(r.amount ?? r.monthlyFeeMinor ?? r.feeMinor),
    },
    { key: 'date', label: 'Date', render: (r) => r.startDate || r.entryAt || r.createdAt || '-' },
    {
      key: 'receipt',
      label: 'Receipt',
      render: (r) => (
        <button
          type="button"
          onClick={(e) => onReceipt(r, e)}
          disabled={busyId === r.id}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
        >
          {busyId === r.id ? '…' : 'Receipt'}
        </button>
      ),
    },
  ];

  if (error && !rows.length && !loading) {
    return <EmptyState title="History unavailable" description={error} />;
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 4px' }}>Parking History</h1>
      <p className="resident-page-subtitle">
        Past allocations, visitor parking, and receipts.
      </p>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {success && <p style={{ color: '#166534' }}>{success}</p>}
      <DataTable columns={columns} rows={rows} loading={loading} emptyTitle="No parking history" />
      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        totalPages={pagination.totalPages}
        hasNext={pagination.hasNext}
        hasPrev={pagination.hasPrev}
        onPageChange={setPage}
      />
    </div>
  );
}
