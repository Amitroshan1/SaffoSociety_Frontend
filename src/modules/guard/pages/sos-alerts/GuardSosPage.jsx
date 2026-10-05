import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  Info,
  Search,
  ShieldAlert,
  VolumeX,
} from 'lucide-react';
import { navigateGuard } from '@/modules/guard/constants/guardRoutes.js';
import Sidebar from '@/modules/guard/components/Sidebar';
import DashboardHeader from '@/modules/guard/components/DashboardHeader';
import { opsUsesDummy } from '@/config/dataMode';
import {
  getSosAlerts,
  getSosAlert,
  resolveSos,
  subscribeSosAlerts,
  __dummyEmitSosCreated,
} from '@/modules/guard/services/sos/sos.service';
import { apiErrorMessage } from '@/modules/guard/services/core/http';
import {
  ensureSosSoundBridge,
  getSosSoundState,
  stopSosAlertSound,
  subscribeSosSound,
  syncSosAlertSound,
} from '@/modules/guard/utils/sosAlertSound.js';
import '@/modules/guard/styles/core/guard-main.css';
import '@/modules/guard/styles/sos/sos.css';

const TABS = [
  { key: 'active', label: 'Active', status: 'active' },
  { key: 'resolved', label: 'Resolved', status: 'resolved' },
  { key: 'all', label: 'All', status: undefined },
];

function formatWhen(value) {
  if (!value) return '—';
  const text = String(value).trim();
  const date = new Date(text.replace(/(\.\d{3})\d+/, '$1'));
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function GuardSosPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [counts, setCounts] = useState({ all: 0, active: 0, resolved: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [sound, setSound] = useState(() => getSosSoundState());

  useEffect(() => {
    document.title = 'SOS Alerts | Guard';
    ensureSosSoundBridge();
    return subscribeSosSound(setSound);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 280);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const tabCfg = TABS.find((t) => t.key === tab);
      const data = await getSosAlerts({
        status: tabCfg?.status,
        search: debouncedSearch || undefined,
        page,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setItems(data.items);
      setPagination(data.pagination);
      setCounts(data.counts || { all: 0, active: 0, resolved: 0 });
      const active = await getSosAlerts({
        status: 'active',
        page: 1,
        pageSize: 50,
      });
      syncSosAlertSound(active.items || []);
    } catch (err) {
      syncSosAlertSound([]);
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab, page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  // HTTP first, then subscribe (dummy events or real WebSocket)
  useEffect(() => {
    let cancelled = false;
    const sub = subscribeSosAlerts({
      onCreated: () => {
        if (!cancelled) load();
      },
      onResolved: () => {
        if (!cancelled) load();
      },
      onReconnectNeedRefetch: async () => {
        if (!cancelled) await load();
      },
      onError: () => {
        // A dropped socket is not an SOS. The siren follows the active list only.
      },
    });
    return () => {
      cancelled = true;
      sub.close?.();
    };
  }, [load]);

  async function onResolve(id) {
    setBusyId(id);
    setError('');
    try {
      await resolveSos(id);
      setDetail(null);
      // Stop alarm immediately when no active SOS remain
      const active = await getSosAlerts({ status: 'active', page: 1, pageSize: 50 });
      syncSosAlertSound(active.items || []);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function onOpenDetail(id) {
    try {
      const row = await getSosAlert(id);
      setDetail(row);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function onSimulateCreated() {
    if (!opsUsesDummy()) return;
    try {
      await __dummyEmitSosCreated();
      setTab('active');
      setPage(1);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="gm-root" data-theme="light">
      <Sidebar activePage="SOS Alerts" onNavigate={(label) => navigateGuard(navigate, label)} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main gsos-page">
          <header className="gsos-header">
            <button
              type="button"
              className="gsos-back"
              onClick={() => navigate('/guard/dashboard')}
            >
              <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" />
              Dashboard
            </button>
            <div className="gsos-title-block">
              <div className="gsos-title-row">
                <span className="gsos-title-icon" aria-hidden="true">
                  <ShieldAlert size={18} strokeWidth={2.2} />
                </span>
                <h1 className="gsos-title">SOS Alerts</h1>
              </div>
              <p className="gsos-subtitle">
                Monitor and respond to emergency alerts from residents.
              </p>
            </div>
          </header>

          {opsUsesDummy() ? (
            <div className="gsos-banner gsos-banner--info" role="status">
              <Info size={16} strokeWidth={2.2} aria-hidden="true" />
              <p>
                <strong>Dummy mode</strong>
                {' — '}
                Simulates backend SOS list, resolve, and realtime events. No live backend required.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="gsos-banner gsos-banner--error" role="alert">
              <AlertTriangle size={16} strokeWidth={2.2} aria-hidden="true" />
              <p>{error}</p>
            </div>
          ) : null}

          <div className="gsos-toolbar">
            <div className="gsos-filters" role="tablist" aria-label="SOS status filters">
              {TABS.map((t) => {
                const count =
                  t.key === 'active'
                    ? counts.active
                    : t.key === 'resolved'
                      ? counts.resolved
                      : counts.all;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.key}
                    className={`gsos-filter ${tab === t.key ? 'is-active' : ''}`}
                    onClick={() => {
                      setTab(t.key);
                      setPage(1);
                    }}
                  >
                    <span className="gsos-filter-label">{t.label}</span>
                    <span className={`gsos-filter-count${t.key === 'active' && count > 0 ? ' is-alert' : ''}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="gsos-toolbar-actions">
              {opsUsesDummy() ? (
                <button type="button" className="gsos-btn gsos-btn--secondary" onClick={onSimulateCreated}>
                  Sim. New SOS
                </button>
              ) : null}
              {sound.playing ? (
                <button
                  type="button"
                  className="gsos-btn gsos-btn--mute"
                  onClick={() => stopSosAlertSound()}
                >
                  <VolumeX size={15} strokeWidth={2.2} aria-hidden="true" />
                  Stop Sound
                </button>
              ) : null}
            </div>
          </div>

          <section className="gsos-card">
            <div className="gsos-card-header">
              <div className="gsos-card-heading">
                <h2 className="gsos-card-title">Alerts</h2>
                <p className="gsos-card-desc">Live emergency queue for the current filter.</p>
              </div>
              <label className="gsos-search">
                <Search size={15} strokeWidth={2.2} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search flat / resident…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search flat or resident"
                />
              </label>
            </div>

            <div className="gsos-table-scroll">
              <div className="gsos-table-header" role="row">
                <span>Flat</span>
                <span>Resident</span>
                <span>Details</span>
                <span className="gsos-col-center">Status</span>
                <span className="gsos-col-center">Action</span>
              </div>

              <div className="gsos-table-body">
                {loading ? (
                  <div className="gsos-empty">Loading…</div>
                ) : items.length === 0 ? (
                  <div className="gsos-empty">
                    <span className="gsos-empty-icon" aria-hidden="true">
                      <ShieldAlert size={22} strokeWidth={2.1} />
                    </span>
                    <p className="gsos-empty-title">
                      {tab === 'resolved'
                        ? 'No resolved alerts'
                        : tab === 'all'
                          ? 'No SOS alerts yet'
                          : 'No active alerts'}
                    </p>
                    <p className="gsos-empty-text">
                      {tab === 'active'
                        ? 'Residents have not raised an emergency.'
                        : 'Nothing to show for this filter.'}
                    </p>
                  </div>
                ) : (
                  items.map((row) => {
                    const isActive = row.status === 'active';
                    return (
                      <div
                        key={row.id}
                        className={`gsos-row ${isActive ? 'gsos-row--active' : ''}`}
                        role="row"
                      >
                        <div className="gsos-flat">Flat {row.flat || '—'}</div>
                        <div className="gsos-resident">{row.residentName || '—'}</div>
                        <div className="gsos-details">
                          <span className="gsos-details-note">
                            {row.note || row.message || 'Emergency'}
                          </span>
                          <span className="gsos-details-time">{row.time}</span>
                        </div>
                        <div className="gsos-col-center">
                          <span
                            className={`gsos-status ${
                              isActive ? 'gsos-status--active' : 'gsos-status--resolved'
                            }`}
                          >
                            {row.status}
                          </span>
                        </div>
                        <div className="gsos-row-actions">
                          <button
                            type="button"
                            className="gsos-btn gsos-btn--ghost"
                            onClick={() => onOpenDetail(row.id)}
                          >
                            <Eye size={14} strokeWidth={2.2} aria-hidden="true" />
                            Details
                          </button>
                          {isActive ? (
                            <button
                              type="button"
                              className="gsos-btn gsos-btn--danger"
                              disabled={busyId === row.id}
                              onClick={() => onResolve(row.id)}
                            >
                              Resolve
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {pagination && pagination.totalPages > 1 ? (
              <div className="gsos-pagination">
                <button
                  type="button"
                  className="gsos-btn gsos-btn--ghost"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </button>
                <span className="gsos-page-label">
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="gsos-btn gsos-btn--ghost"
                  disabled={!pagination.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </section>

          {detail ? (
            <div
              className="gsos-detail-overlay"
              role="presentation"
              onClick={() => setDetail(null)}
            >
              <section
                className="gsos-card gsos-detail-card"
                role="dialog"
                aria-modal="true"
                aria-label={`SOS Detail Flat ${detail.flat}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="gsos-card-header">
                  <div className="gsos-card-heading">
                    <h2 className="gsos-card-title">SOS Detail · Flat {detail.flat}</h2>
                  </div>
                  <button type="button" className="gsos-btn gsos-btn--ghost" onClick={() => setDetail(null)}>
                    Close
                  </button>
                </div>
                <div className="gsos-detail-body">
                  <div>
                    <strong>Resident:</strong> {detail.residentName || '—'}
                  </div>
                  <div>
                    <strong>Status:</strong> {detail.status}
                  </div>
                  <div>
                    <strong>Note:</strong> {detail.note || detail.message}
                  </div>
                  <div>
                    <strong>Created:</strong> {detail.createdAt ? formatWhen(detail.createdAt) : detail.time || '—'}
                  </div>
                  {detail.resolvedAt ? (
                    <div>
                      <strong>Resolved:</strong> {formatWhen(detail.resolvedAt)}
                    </div>
                  ) : null}
                  {detail.status === 'active' ? (
                    <button
                      type="button"
                      className="gsos-btn gsos-btn--danger"
                      onClick={() => onResolve(detail.id)}
                    >
                      Resolve
                    </button>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
