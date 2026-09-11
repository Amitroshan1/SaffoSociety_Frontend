import api from './api';

export const REPORT_CATEGORIES = [
  'executive',
  'society',
  'residents',
  'visitors',
  'staff',
  'complaints',
  'billing',
  'finance',
  'documents',
  'amenities',
  'parking',
  'notifications',
  'security',
  'audit',
  'usage',
  'operational',
];

export const EXPORT_FORMATS = ['csv', 'excel', 'pdf'];

export const SCHEDULE_FREQUENCIES = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'cron',
];

export const CHART_TYPES = [
  'kpi_card',
  'bar',
  'stacked_bar',
  'pie',
  'donut',
  'line',
  'area',
  'trend',
  'heatmap',
  'table',
  'combo',
];

export const formatLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const formatMoneyMinor = (minor) =>
  (Number(minor || 0) / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* â”€â”€ Catalog / KPIs / Dashboards / Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const getAnalyticsCatalog = (params) => api.get('/analytics/catalog', { params });
export const getAnalyticsDashboard = (key = 'executive', params) =>
  api.get(`/analytics/dashboards/${key}`, { params });
export const getAnalyticsKpis = (params) => api.get('/analytics/kpis', { params });
export const getAnalyticsKpi = (kpiKey, params) =>
  api.get(`/analytics/kpis/${kpiKey}`, { params });
export const getAnalyticsChart = (chartKey, params) =>
  api.get(`/analytics/charts/${chartKey}`, { params });
export const listAnalyticsReports = (params) => api.get('/analytics/reports', { params });
export const runAnalyticsReport = (reportKey, params) =>
  api.get(`/analytics/reports/${reportKey}`, { params });

export const refreshAnalyticsSnapshots = () => api.post('/analytics/snapshots/refresh');
export const rebuildAnalytics = (body) => api.post('/analytics/rebuild', body);

/* â”€â”€ Exports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const createAnalyticsExport = (body) => api.post('/analytics/exports', body);
export const listAnalyticsExports = (params) => api.get('/analytics/exports', { params });
export const getAnalyticsExport = (id) => api.get(`/analytics/exports/${id}`);
export const downloadAnalyticsExport = (id) =>
  api.get(`/analytics/exports/${id}/download`, { responseType: 'blob' });

/* â”€â”€ Schedules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const createReportSchedule = (body) => api.post('/analytics/schedules', body);
export const listReportSchedules = (params) => api.get('/analytics/schedules', { params });
export const updateReportSchedule = (id, body) => api.patch(`/analytics/schedules/${id}`, body);
export const deleteReportSchedule = (id) => api.delete(`/analytics/schedules/${id}`);
export const listReportScheduleRuns = (id, params) =>
  api.get(`/analytics/schedules/${id}/runs`, { params });

/* â”€â”€ Preferences / Audit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const getAnalyticsPreferences = () => api.get('/analytics/preferences');
export const updateAnalyticsPreferences = (body) => api.patch('/analytics/preferences', body);
export const listAnalyticsAccessLogs = (params) => api.get('/analytics/access-logs', { params });

/* â”€â”€ Role aliases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const getFinanceAnalyticsDashboard = (params) =>
  api.get('/finance/analytics/dashboard', { params });
export const getGuardAnalyticsToday = (params) => api.get('/guard/analytics/today', { params });
export const getResidentAnalyticsSummary = (params) =>
  api.get('/resident/analytics/summary', { params });
