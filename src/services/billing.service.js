import api from '@/services/api';

/** Format minor currency units (paise) as major units. */
export const formatMoney = (minor) => ((Number(minor) || 0) / 100).toFixed(2);

/* ── Charge heads ─────────────────────────────────────────────────────────── */
export const listChargeHeads = (params) => api.get('/charge-heads', { params });
export const getChargeHead = (id) => api.get(`/charge-heads/${id}`);
export const createChargeHead = (payload) => api.post('/charge-heads', payload);
export const updateChargeHead = (id, payload) => api.patch(`/charge-heads/${id}`, payload);
export const activateChargeHead = (id) => api.post(`/charge-heads/${id}/activate`);
export const deactivateChargeHead = (id) => api.post(`/charge-heads/${id}/deactivate`);

/* ── Billing cycles ───────────────────────────────────────────────────────── */
export const listBillingCycles = (params) => api.get('/billing-cycles', { params });
export const getBillingCycle = (id) => api.get(`/billing-cycles/${id}`);
export const createBillingCycle = (payload) => api.post('/billing-cycles', payload);
export const updateBillingCycle = (id, payload) => api.patch(`/billing-cycles/${id}`, payload);
export const activateBillingCycle = (id) => api.post(`/billing-cycles/${id}/activate`);
export const deactivateBillingCycle = (id) => api.post(`/billing-cycles/${id}/deactivate`);

/* ── Late fee rules ───────────────────────────────────────────────────────── */
export const listLateFeeRules = (params) => api.get('/late-fee-rules', { params });
export const getLateFeeRule = (id) => api.get(`/late-fee-rules/${id}`);
export const createLateFeeRule = (payload) => api.post('/late-fee-rules', payload);
export const updateLateFeeRule = (id, payload) => api.patch(`/late-fee-rules/${id}`, payload);
export const deactivateLateFeeRule = (id) => api.delete(`/late-fee-rules/${id}`);

/* ── Discount rules ───────────────────────────────────────────────────────── */
export const listDiscountRules = (params) => api.get('/discount-rules', { params });
export const getDiscountRule = (id) => api.get(`/discount-rules/${id}`);
export const createDiscountRule = (payload) => api.post('/discount-rules', payload);
export const updateDiscountRule = (id, payload) => api.patch(`/discount-rules/${id}`, payload);
export const deactivateDiscountRule = (id) => api.delete(`/discount-rules/${id}`);

/* ── Financial years & periods ────────────────────────────────────────────── */
export const listFinancialYears = (params) => api.get('/financial-years', { params });
export const getFinancialYear = (id) => api.get(`/financial-years/${id}`);
export const createFinancialYear = (payload) => api.post('/financial-years', payload);
export const updateFinancialYear = (id, payload) => api.patch(`/financial-years/${id}`, payload);
export const closeFinancialYear = (id, payload) =>
  api.post(`/financial-years/${id}/close`, payload || {});

export const listAccountingPeriods = (params) => api.get('/accounting-periods', { params });
export const createAccountingPeriod = (payload) => api.post('/accounting-periods', payload);
export const closeAccountingPeriod = (id, payload) =>
  api.post(`/accounting-periods/${id}/close`, payload || {});

/* ── Bills ────────────────────────────────────────────────────────────────── */
export const listBills = (params) => api.get('/bills', { params });
export const getBill = (id) => api.get(`/bills/${id}`);
export const createBill = (payload) => api.post('/bills', payload);
export const updateBill = (id, payload) => api.patch(`/bills/${id}`, payload);
export const generateBills = (payload) => api.post('/bills/generate', payload);
export const publishBill = (id, payload) => api.post(`/bills/${id}/publish`, payload || {});
export const cancelBill = (id, payload) => api.post(`/bills/${id}/cancel`, payload || {});
export const writeOffBill = (id, payload) => api.post(`/bills/${id}/write-off`, payload);
export const applyLateFee = (id, payload) => api.post(`/bills/${id}/apply-late-fee`, payload || {});
export const applyDiscount = (id, payload) => api.post(`/bills/${id}/apply-discount`, payload);

/* ── Payments & receipts ──────────────────────────────────────────────────── */
export const listPayments = (params) => api.get('/payments', { params });
export const getPayment = (id) => api.get(`/payments/${id}`);
export const createPayment = (payload) => api.post('/payments', payload);
export const allocatePayment = (id, payload) => api.post(`/payments/${id}/allocate`, payload);
export const reversePayment = (id, payload) => api.post(`/payments/${id}/reverse`, payload || {});

export const listReceipts = (params) => api.get('/receipts', { params });
export const getReceipt = (id) => api.get(`/receipts/${id}`);

/* ── Dashboard & reports ──────────────────────────────────────────────────── */
export const getBillingDashboard = () => api.get('/billing/dashboard');
export const getBillingReport = (reportKey, params) =>
  api.get(`/billing/reports/${reportKey}`, { params });

/* ── Resident billing ─────────────────────────────────────────────────────── */
export const listResidentBills = (params) => api.get('/resident/bills', { params });
export const getResidentBill = (id) => api.get(`/resident/bills/${id}`);
export const listResidentPayments = (params) => api.get('/resident/payments', { params });
export const listResidentReceipts = (params) => api.get('/resident/receipts', { params });
export const getResidentReceipt = (id) => api.get(`/resident/receipts/${id}`);
export const getResidentOutstanding = () => api.get('/resident/outstanding');
