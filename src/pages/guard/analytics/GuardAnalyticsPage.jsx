import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/guard/guard-main.css';
import '../../../styles/common/crud.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import {
  createAnalyticsExport,
  formatLabel,
  getGuardAnalyticsToday,
} from '../../../services/analytics.service.js';

const HIDDEN_PACK_LABELS = /complaint/i;

const KPI_META = [
  { match: /visitor/i, accent: 'blue', hint: 'Entries today', icon: 'V' },
  { match: /parking|occup/i, accent: 'green', hint: 'Slots in use', icon: 'P' },
  { match: /staff|duty/i, accent: 'amber', hint: 'On duty now', icon: 'S' },
  { match: /booking|facility|amenity/i, accent: 'indigo', hint: 'Check-ins today', icon: 'B' },
];

const PACK_META = [
  { match: /visitor/i, accent: 'blue', title: 'Visitors', desc: 'Gate check-ins logged today' },
  { match: /booking|facility|amenity/i, accent: 'indigo', title: 'Bookings', desc: 'Facility bookings for today' },
  { match: /staff|duty/i, accent: 'amber', title: 'Staff on duty', desc: 'Guards currently clocked in' },
  { match: /parking|occup/i, accent: 'green', title: 'Parking', desc: 'Slot occupancy snapshot' },
];

function kpiMeta(name = '', key = '') {
  const hay = `${name} ${key}`;
  return KPI_META.find((m) => m.match.test(hay)) || {
    accent: 'blue',
    hint: 'Today',
    icon: '•',
  };
}

function packMeta(label = '') {
  return (
    PACK_META.find((m) => m.match.test(label)) || {
      accent: 'blue',
      title: label || 'Metric',
      desc: 'Operational count',
    }
  );
}

function formatKpiValue(value, unit) {
  if (unit === 'minor_currency') return `₹${(Number(value || 0) / 100).toFixed(0)}`;
  if (unit === 'percent') return `${value ?? 0}%`;
  return value ?? 0;
}

function filterGuardSeries(series = []) {
  return series.filter((s) => !HIDDEN_PACK_LABELS.test(String(s.label || '')));
}

function OpsPackGrid({ series = [] }) {
  if (!series.length) {
    return <div className="gm-chart-empty">No operational counts for today yet.</div>;
  }
  return (
    <div className="gm-ops-grid">
      {series.map((s, i) => {
        const val = Number(s.value) || 0;
        const meta = packMeta(s.label || '');
        return (
          <article key={`${s.label}-${i}`} className={`gm-ops-tile gm-ops-tile--${meta.accent}`}>
            <div className="gm-ops-tile-top">
              <span className="gm-ops-tile-badge">{meta.title}</span>
            </div>
            <strong className="gm-ops-tile-value">{val}</strong>
            <p className="gm-ops-tile-desc">{meta.desc}</p>
            <div className="gm-ops-tile-bar" aria-hidden="true">
              <span style={{ width: `${Math.min(100, Math.max(8, val === 0 ? 8 : 35 + val * 8))}%` }} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function GuardAnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = async ({ soft = false } = {}) => {
    if (soft) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const r = await getGuardAnalyticsToday();
      setData(r.data?.data || null);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    document.title = 'Operations Analytics | Guard Dashboard';
    load();
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, []);

  const kpis = useMemo(
    () => (data?.kpis || []).filter((k) => !HIDDEN_PACK_LABELS.test(`${k.name || ''} ${k.kpiKey || ''}`)),
    [data]
  );

  const packSeries = useMemo(() => {
    const charts = data?.charts || [];
    const first = charts[0];
    return filterGuardSeries(first?.series || []);
  }, [data]);

  const packTitle = data?.charts?.[0]?.name || 'Operational Today Pack';
  const activityTotal = packSeries.reduce((sum, s) => sum + (Number(s.value) || 0), 0);

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const updatedLabel = updatedAt
    ? updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  const onExportToday = async () => {
    setSuccess('');
    setError('');
    setExporting(true);
    try {
      await createAnalyticsExport({
        reportKey: 'operational.today',
        format: 'csv',
        filters: {},
      });
      setSuccess("Today's export queued. Check downloads when ready.");
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="gm-root">
      <Sidebar activePage="Analytics" onNavigate={(label) => navigateGuard(navigate, label)} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <div className="gm-analytics-top">
            <div>
              <h2 className="gm-park-page-title">Operations Analytics</h2>
              <p className="gm-analytics-date">
                {todayLabel} · Gate ops snapshot
                <span className="gm-analytics-updated"> · Updated {updatedLabel}</span>
              </p>
            </div>
            <div className="gm-analytics-actions">
              <button
                type="button"
                className="gm-analytics-refresh"
                onClick={() => load({ soft: true })}
                disabled={refreshing || loading}
              >
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
              <button
                type="button"
                className="btn-primary gm-analytics-export"
                onClick={onExportToday}
                disabled={exporting}
              >
                {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>
          </div>

          {error && <div className="gm-analytics-alert is-error">{error}</div>}
          {success && <div className="gm-analytics-alert is-ok">{success}</div>}

          {loading ? (
            <div className="gm-analytics-skeleton">
              <div className="gm-analytics-skel-row" />
              <div className="gm-analytics-skel-grid">
                <div className="gm-analytics-skel-card" />
                <div className="gm-analytics-skel-card" />
                <div className="gm-analytics-skel-card" />
              </div>
              <div className="gm-analytics-skel-panel" />
            </div>
          ) : (
            <>
              <section className="gm-analytics-hero">
                <div className="gm-analytics-hero-main">
                  <span className="gm-analytics-live">
                    <span className="gm-analytics-live-dot" />
                    Live today
                  </span>
                  <h3>Gate activity overview</h3>
                  <p>
                    {activityTotal > 0
                      ? `${activityTotal} total ops signals across visitors, bookings, and duty.`
                      : "Waiting for today's first gate activity."}
                  </p>
                </div>
                <div className="gm-analytics-hero-stats">
                  <div>
                    <span>Metrics tracked</span>
                    <strong>{Math.max(kpis.length, packSeries.length)}</strong>
                  </div>
                  <div>
                    <span>Pack items</span>
                    <strong>{packSeries.length}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong className="is-ok">Online</strong>
                  </div>
                </div>
              </section>

              <div className="gm-analytics-kpi-grid">
                {kpis.length === 0 && (
                  <div className="gm-analytics-empty-card">No KPI data for today yet.</div>
                )}
                {kpis.map((k) => {
                  const meta = kpiMeta(k.name, k.kpiKey || k.key);
                  return (
                    <article
                      key={k.kpiKey || k.key}
                      className={`gm-analytics-kpi gm-analytics-kpi--${meta.accent}`}
                    >
                      <div className="gm-analytics-kpi-head">
                        <span className="gm-analytics-kpi-label">
                          {k.name || formatLabel(k.kpiKey || k.key)}
                        </span>
                        <span className={`gm-analytics-kpi-icon gm-analytics-kpi-icon--${meta.accent}`}>
                          {meta.icon}
                        </span>
                      </div>
                      <strong className="gm-analytics-kpi-value">
                        {formatKpiValue(k.value, k.unit)}
                      </strong>
                      <span className="gm-analytics-kpi-hint">{meta.hint}</span>
                    </article>
                  );
                })}
              </div>

              <section className="glass-card gm-analytics-chart-card">
                <div className="gm-analytics-chart-head">
                  <div>
                    <h3>{packTitle}</h3>
                    <p>Guard-relevant counts for this shift day</p>
                  </div>
                  <span className="gm-analytics-pill">{packSeries.length} metrics</span>
                </div>
                <OpsPackGrid series={packSeries} />
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
