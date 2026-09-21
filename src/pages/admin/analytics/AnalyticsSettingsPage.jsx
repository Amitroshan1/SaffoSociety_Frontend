import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import { DataTable, SkeletonLoader } from '@/components/common/index.js';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import {
  formatLabel,
  getAnalyticsPreferences,
  listAnalyticsAccessLogs,
  rebuildAnalytics,
  updateAnalyticsPreferences,
} from '@/services/analytics.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

export default function AnalyticsSettingsPage() {
  const [prefs, setPrefs] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAnalyticsPreferences(), listAnalyticsAccessLogs({ page: 1, pageSize: 20 })])
      .then(([p, l]) => {
        setPrefs(p.data?.data || {});
        setLogs(l.data?.data?.logs || l.data?.data?.items || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const onSavePrefs = async () => {
    try {
      await updateAnalyticsPreferences({
        favoriteReportKeys: prefs?.favoriteReportKeys || [],
        defaultFilters: prefs?.defaultFilters || {},
        savedFilters: prefs?.savedFilters || [],
      });
      setSuccess('Preferences saved');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const onRebuild = async () => {
    setSuccess('');
    try {
      await rebuildAnalytics({});
      setSuccess('Rebuild queued / completed for recent window');
    } catch (err) {
      setError(err.response?.data?.message || 'Rebuild failed');
    }
  };

  const logColumns = [
    { key: 'action', label: 'Action', render: (r) => formatLabel(r.action) },
    { key: 'resourceType', label: 'Resource' },
    { key: 'resourceKey', label: 'Key' },
    { key: 'createdAt', label: 'When' },
  ];

  return (
    <AppShell
      active="analytics-settings"
      routes={ADMIN_ROUTES}
      breadcrumb={[{ label: 'Home' }, { label: 'Analytics' }, { label: 'Settings' }]}
    >
      <PageHeader
        icon={Settings2}
        iconColor="#fda4af"
        title="Analytics Settings"
        subtitle="Preferences, rebuild controls, and access audit."
      />
      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {success && <p style={{ color: '#86efac' }}>{success}</p>}
      {loading ? (
        <SkeletonLoader rows={4} />
      ) : (
        <>
          <section className="glass-card" style={{ padding: 16, borderRadius: 16, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Maintenance</h3>
            <button type="button" className="btn-primary" onClick={onRebuild}>
              Trigger analytics rebuild
            </button>
            <button type="button" className="btn-ghost" style={{ marginLeft: 8 }} onClick={onSavePrefs}>
              Save preferences
            </button>
          </section>
          <section className="glass-card" style={{ padding: 16, borderRadius: 16 }}>
            <h3 style={{ marginTop: 0 }}>Recent access logs</h3>
            <DataTable columns={logColumns} rows={logs} />
          </section>
        </>
      )}
    </AppShell>
  );
}
