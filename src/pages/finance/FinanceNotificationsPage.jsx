import { useCallback, useEffect, useState } from 'react';
import { BellRing, Send } from 'lucide-react';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  DataTable,
  FilterBar,
  FormField,
  FormLayout,
  Pagination,
  SearchInput,
} from '@/components/common/index.js';
import { FINANCE_ROUTES } from '@/constants/adminRoutes.js';
import { useListQuery } from '@/hooks/useListQuery.js';
import { normalizePagination } from '@/utils/listQuery.js';
import {
  formatLabel,
  listFinanceNotificationHistory,
  sendInvoiceNotification,
  sendPaymentReminder,
  sendReceiptNotification,
} from '@/services/notification.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const initialPaymentForm = { flatId: '', invoiceId: '', dueDate: '', amount: '', message: '' };
const initialInvoiceForm = { flatId: '', invoiceId: '', invoiceNumber: '', amount: '', message: '' };
const initialReceiptForm = { paymentId: '', receiptId: '', amount: '', message: '' };

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type', render: (row) => formatLabel(row.type || row.category || 'finance') },
  { key: 'channel', label: 'Channel', render: (row) => formatLabel(row.channel || 'in_app') },
  { key: 'status', label: 'Status', render: (row) => formatLabel(row.status || '-') },
  { key: 'recipient', label: 'Recipient', render: (row) => row.recipientName || row.recipient || '-' },
  { key: 'createdAt', label: 'Sent/Queued at', render: (row) => row.sentAt || row.createdAt || '-' },
];

export default function FinanceNotificationsPage() {
  const { state, params, setPage, setSearch, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm);
  const [receiptForm, setReceiptForm] = useState(initialReceiptForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const finalParams = { ...params };
      if (state.type) finalParams.type = state.type;
      const { data } = await listFinanceNotificationHistory(finalParams);
      setRows(data.data?.history || data.data?.notifications || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load finance notification history');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.type]);

  useEffect(() => {
    load();
  }, [load]);

  const notifyAndReload = async (apiCall, payload, doneMessage, resetter) => {
    setSending(true);
    setError('');
    setSuccess('');
    try {
      await apiCall(payload);
      setSuccess(doneMessage);
      resetter();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const onSendPaymentReminder = async (e) => {
    e.preventDefault();
    await notifyAndReload(
      sendPaymentReminder,
      {
        flatId: paymentForm.flatId.trim() || null,
        invoiceId: paymentForm.invoiceId.trim() || null,
        dueDate: paymentForm.dueDate || null,
        amount: paymentForm.amount ? Number(paymentForm.amount) : null,
        message: paymentForm.message.trim() || null,
      },
      'Payment reminder sent',
      () => setPaymentForm(initialPaymentForm),
    );
  };

  const onSendInvoice = async (e) => {
    e.preventDefault();
    await notifyAndReload(
      sendInvoiceNotification,
      {
        flatId: invoiceForm.flatId.trim() || null,
        invoiceId: invoiceForm.invoiceId.trim() || null,
        invoiceNumber: invoiceForm.invoiceNumber.trim() || null,
        amount: invoiceForm.amount ? Number(invoiceForm.amount) : null,
        message: invoiceForm.message.trim() || null,
      },
      'Invoice notification sent',
      () => setInvoiceForm(initialInvoiceForm),
    );
  };

  const onSendReceipt = async (e) => {
    e.preventDefault();
    await notifyAndReload(
      sendReceiptNotification,
      {
        paymentId: receiptForm.paymentId.trim() || null,
        receiptId: receiptForm.receiptId.trim() || null,
        amount: receiptForm.amount ? Number(receiptForm.amount) : null,
        message: receiptForm.message.trim() || null,
      },
      'Receipt notification sent',
      () => setReceiptForm(initialReceiptForm),
    );
  };

  return (
    <AppShell
      active="notifications"
      routes={FINANCE_ROUTES}
      breadcrumb={[{ label: 'Home' }, { label: 'Finance' }, { label: 'Notifications' }]}
    >
      <PageHeader
        icon={BellRing}
        iconColor="#93c5fd"
        title="Finance Notifications"
        subtitle="Send payment reminders, invoice alerts, and receipt confirmations."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', marginBottom: 16 }}>
        <section className="glass-card" style={{ padding: 16, borderRadius: 12 }}>
          <form onSubmit={onSendPaymentReminder}>
            <FormLayout
              sections={[
                {
                  title: 'Payment reminder',
                  content: (
                    <>
                      <FormField label="Flat ID" value={paymentForm.flatId} onChange={(v) => setPaymentForm((s) => ({ ...s, flatId: v }))} />
                      <FormField label="Invoice ID" value={paymentForm.invoiceId} onChange={(v) => setPaymentForm((s) => ({ ...s, invoiceId: v }))} />
                      <FormField label="Due date" type="date" value={paymentForm.dueDate} onChange={(v) => setPaymentForm((s) => ({ ...s, dueDate: v }))} />
                      <FormField label="Amount" type="number" value={paymentForm.amount} onChange={(v) => setPaymentForm((s) => ({ ...s, amount: v }))} />
                      <FormField textarea label="Message" value={paymentForm.message} onChange={(v) => setPaymentForm((s) => ({ ...s, message: v }))} />
                    </>
                  ),
                },
              ]}
            />
            <button className="btn-primary" type="submit" disabled={sending}>
              <Send size={14} /> Send reminder
            </button>
          </form>
        </section>

        <section className="glass-card" style={{ padding: 16, borderRadius: 12 }}>
          <form onSubmit={onSendInvoice}>
            <FormLayout
              sections={[
                {
                  title: 'Invoice notification',
                  content: (
                    <>
                      <FormField label="Flat ID" value={invoiceForm.flatId} onChange={(v) => setInvoiceForm((s) => ({ ...s, flatId: v }))} />
                      <FormField label="Invoice ID" value={invoiceForm.invoiceId} onChange={(v) => setInvoiceForm((s) => ({ ...s, invoiceId: v }))} />
                      <FormField label="Invoice #" value={invoiceForm.invoiceNumber} onChange={(v) => setInvoiceForm((s) => ({ ...s, invoiceNumber: v }))} />
                      <FormField label="Amount" type="number" value={invoiceForm.amount} onChange={(v) => setInvoiceForm((s) => ({ ...s, amount: v }))} />
                      <FormField textarea label="Message" value={invoiceForm.message} onChange={(v) => setInvoiceForm((s) => ({ ...s, message: v }))} />
                    </>
                  ),
                },
              ]}
            />
            <button className="btn-primary" type="submit" disabled={sending}>
              <Send size={14} /> Send invoice alert
            </button>
          </form>
        </section>

        <section className="glass-card" style={{ padding: 16, borderRadius: 12 }}>
          <form onSubmit={onSendReceipt}>
            <FormLayout
              sections={[
                {
                  title: 'Receipt notification',
                  content: (
                    <>
                      <FormField label="Payment ID" value={receiptForm.paymentId} onChange={(v) => setReceiptForm((s) => ({ ...s, paymentId: v }))} />
                      <FormField label="Receipt ID" value={receiptForm.receiptId} onChange={(v) => setReceiptForm((s) => ({ ...s, receiptId: v }))} />
                      <FormField label="Amount" type="number" value={receiptForm.amount} onChange={(v) => setReceiptForm((s) => ({ ...s, amount: v }))} />
                      <FormField textarea label="Message" value={receiptForm.message} onChange={(v) => setReceiptForm((s) => ({ ...s, message: v }))} />
                    </>
                  ),
                },
              ]}
            />
            <button className="btn-primary" type="submit" disabled={sending}>
              <Send size={14} /> Send receipt
            </button>
          </form>
        </section>
      </div>

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search notification history" />
          <FilterBar
            filters={[
              {
                key: 'type',
                label: 'Type',
                options: [
                  { value: 'payment_reminder', label: 'Payment reminder' },
                  { value: 'invoice', label: 'Invoice' },
                  { value: 'receipt', label: 'Receipt' },
                ],
              },
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'queued', label: 'Queued' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'read', label: 'Read' },
                ],
              },
            ]}
            values={state}
            onChange={setFilter}
          />
        </div>
        <DataTable columns={columns} rows={rows} loading={loading} emptyTitle="No finance notifications yet" />
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
    </AppShell>
  );
}
