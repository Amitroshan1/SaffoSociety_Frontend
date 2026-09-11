import { useCallback, useEffect, useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { AppShell } from '../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../layout/admin/PageHeader.jsx';
import { DataTable, FormField, Pagination } from '../../components/common/index.js';
import { FINANCE_ROUTES } from '../../constants/adminRoutes.js';
import { normalizePagination } from '../../utils/listQuery.js';
import {
  formatFee,
  getParkingRevenue,
  listParkingPayments,
  refundParking,
} from '../../services/parking.service.js';
import '../../styles/admin/AdminDashboard.css';
import '../../styles/common/crud.css';

export default function FinanceParkingRevenuePage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refundModal, setRefundModal] = useState(null);
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const [revenueRes, paymentsRes] = await Promise.all([
        getParkingRevenue(params),
        listParkingPayments({ ...params, page, pageSize: 10 }),
      ]);
      setSummary(revenueRes.data?.data || null);
      setRows(
        paymentsRes.data?.data?.payments ||
          paymentsRes.data?.data?.allocations ||
          [],
      );
      setPagination(normalizePagination(paymentsRes.data?.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load parking revenue');
    } finally {
      setLoading(false);
    }
  }, [from, to, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openRefund = (row) => {
    setRefundModal(row);
    setRefundForm({
      amount: row.amount != null ? String(row.amount) : String(row.monthlyFeeMinor ?? 0),
      reason: '',
    });
  };

  const onRefund = async (e) => {
    e.preventDefault();
    if (!refundModal) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await refundParking({
        allocationId: refundModal.allocationId || refundModal.id,
        visitorLogId: refundModal.visitorLogId || null,
        amount: Number(refundForm.amount) || 0,
        reason: refundForm.reason.trim(),
      });
      setSuccess('Refund processed');
      setRefundModal(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Refund failed');
    } finally {
      setSaving(false);
    }
  };

  const COLUMNS = [
    {
      key: 'ref',
      label: 'Reference',
      render: (r) => r.allocationNumber || r.parkingCode || r.id || '-',
    },
    { key: 'residentName', label: 'Resident', render: (r) => r.residentName || '-' },
    { key: 'slotCode', label: 'Slot', render: (r) => r.slotCode || '-' },
    {
      key: 'amount',
      label: 'Amount',
      render: (r) => formatFee(r.amount ?? r.monthlyFeeMinor ?? r.feeMinor),
    },
    { key: 'paymentStatus', label: 'Payment status', render: (r) => r.paymentStatus || '-' },
    { key: 'paidAt', label: 'Paid at', render: (r) => r.paidAt || r.createdAt || '-' },
    {
      key: 'refund',
      label: 'Refund',
      render: (r) => (
        <button
          type="button"
          className="crud-btn crud-btn-ghost"
          onClick={(e) => {
            e.stopPropagation();
            openRefund(r);
          }}
        >
          Refund
        </button>
      ),
    },
  ];

  return (
    <AppShell
      active="parking-revenue"
      routes={FINANCE_ROUTES}
      breadcrumb={[{ label: 'Home' }, { label: 'Finance' }, { label: 'Parking Revenue' }]}
    >
      <PageHeader
        icon={IndianRupee}
        iconColor="#93c5fd"
        title="Parking Revenue"
        subtitle="Monthly parking fees, visitor charges, payments, and refunds."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <div className="crud-toolbar">
          <FormField label="From" type="date" value={from} onChange={setFrom} />
          <FormField label="To" type="date" value={to} onChange={setTo} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
            gap: 12,
            marginTop: 12,
          }}
        >
          <div className="crud-stat-card">Total revenue: {formatFee(summary?.totalRevenue)}</div>
          <div className="crud-stat-card">Allocations: {summary?.totalAllocations ?? summary?.totalPayments ?? 0}</div>
          <div className="crud-stat-card">Total refunded: {formatFee(summary?.totalRefunded)}</div>
          <div className="crud-stat-card">Net revenue: {formatFee(summary?.netRevenue)}</div>
        </div>
      </section>

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <DataTable columns={COLUMNS} rows={rows} loading={loading} emptyTitle="No payments found" />
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={setPage}
        />
      </section>

      {refundModal && (
        <div className="crud-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setRefundModal(null)}>
          <div className="crud-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Refund {refundModal.allocationNumber || refundModal.parkingCode || ''}</h3>
            <form onSubmit={onRefund} style={{ display: 'grid', gap: 12 }}>
              <FormField
                label="Amount (paise)"
                type="number"
                value={refundForm.amount}
                onChange={(v) => setRefundForm((s) => ({ ...s, amount: v }))}
                required
              />
              <FormField
                label="Reason"
                value={refundForm.reason}
                onChange={(v) => setRefundForm((s) => ({ ...s, reason: v }))}
                required
              />
              <div className="crud-modal-actions">
                <button
                  type="button"
                  className="crud-btn crud-btn-ghost"
                  onClick={() => setRefundModal(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="crud-btn crud-btn-primary" disabled={saving}>
                  {saving ? 'Processing…' : 'Process refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
