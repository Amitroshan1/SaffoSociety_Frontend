import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { navigateGuard } from '@/modules/guard/constants/guardRoutes.js';
import Sidebar from '@/modules/guard/components/Sidebar';
import DashboardHeader from '@/modules/guard/components/DashboardHeader';
import CabEntryForm from '@/modules/guard/components/quick-entry/CabEntryForm.jsx';
import GateDatePicker from '@/modules/guard/components/shared/GateDatePicker.jsx';
import { EnterIcon, ExitIcon } from '@/modules/guard/components/shared/GateActionIcons.jsx';
import {
  getCabs,
  createCab,
  checkInCab,
  exitCab,
  __mockSetCabStatus,
} from '@/modules/guard/services/cab/cab.service';
import { apiErrorMessage, indiaTodayISO } from '@/modules/guard/services/core/http';
import { GATE_STATUS, GATE_STATUS_LABEL } from '@/modules/guard/services/gate/gateStatus';
import { gateUsesDummy } from '@/config/dataMode';
import '@/modules/guard/styles/core/guard-main.css';
import '@/modules/guard/styles/cab/cab.css';

const TABS = [
  { key: 'add', label: 'Add Cab', icon: 'plus', cls: 'add' },
  { key: 'at-gate', label: 'At Gate', icon: 'clock', cls: 'pending' },
  { key: 'today', label: "Today's Entry", icon: 'clock', cls: 'pending' },
  { key: 'history', label: 'History', icon: 'done', cls: 'approved' },
];

function TabIcon({ name }) {
  const props = {
    className: 'vp-tab-icon',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
  };
  if (name === 'plus') {
    return (
      <svg {...props}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );
  }
  if (name === 'clock') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function formatEntryTime(row) {
  const iso = row.entryTime || row.checkInTime || row.createdAt;
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function CabList({
  rows,
  loading,
  search,
  onSearch,
  emptyTitle,
  emptySub,
  showDateFilter = false,
  fromDate = '',
  toDate = '',
  onFromDate,
  onToDate,
  onCheckIn,
  onExit,
  onCall,
  onSimulateResident,
  busyId = null,
  mode = 'at-gate',
}) {
  const today = indiaTodayISO();

  return (
    <div className="vtbl-root">
      <div
        className={`vtbl-toolbar vtbl-toolbar--cab${showDateFilter ? ' vtbl-toolbar--cab-dates' : ''}`}
      >
        <div className="vtbl-search-wrap">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search vehicle, driver, flat, service…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        {showDateFilter ? (
          <div className="cab-date-range" aria-label="Date range filter">
            <GateDatePicker
              label="From"
              value={fromDate}
              max={toDate || today}
              onChange={(next) => {
                onFromDate?.(next);
                if (toDate && next && next > toDate) onToDate?.(next);
              }}
            />
            <span className="cab-date-sep" aria-hidden="true">
              –
            </span>
            <GateDatePicker
              label="To"
              value={toDate}
              min={fromDate || undefined}
              max={today}
              onChange={(next) => {
                if (fromDate && next && next < fromDate) onToDate?.(fromDate);
                else onToDate?.(next);
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="vtbl-table">
        <div className="vtbl-head cab-grid cab-grid--actions">
          <span>Driver</span>
          <span>Vehicle</span>
          <span className="vtbl-hide">Flat</span>
          <span className="vtbl-hide">Service</span>
          <span>Purpose</span>
          <span>Status</span>
          <span className="vtbl-actions-head">Actions</span>
        </div>

        {loading ? (
          <div className="vtbl-loading">
            <div className="vtbl-spinner" />
          </div>
        ) : null}

        {!loading && rows.length === 0 ? (
          <div className="vtbl-empty">
            <h3>{emptyTitle}</h3>
            {emptySub ? <p>{emptySub}</p> : null}
          </div>
        ) : null}

        {!loading &&
          rows.map((r) => {
            const busy = busyId === r.id;
            const status = r.status;
            return (
              <div key={r.id} className="vtbl-row cab-grid cab-grid--actions">
                <div className="vtbl-name" data-label="Driver">
                  {r.driverName || '—'}
                </div>
                <div className="vtbl-mono" data-label="Vehicle">
                  {r.vehicleNumber}
                </div>
                <div className="vtbl-hide vtbl-mono" data-label="Flat">
                  {r.flat}
                </div>
                <div className="vtbl-text vtbl-hide" data-label="Service">
                  {r.cabService}
                </div>
                <div className="vtbl-text" data-label="Purpose">
                  {r.purpose}
                </div>
                <div className="vtbl-time" data-label="Status">
                  {GATE_STATUS_LABEL[status] || status}
                  {status === GATE_STATUS.INSIDE || status === GATE_STATUS.EXITED
                    ? ` · ${formatEntryTime(r)}`
                    : ''}
                </div>
                <div className="vtbl-actions">
                  {mode === 'at-gate' && status === GATE_STATUS.PENDING ? (
                    <>
                      <button
                        type="button"
                        className="vtbl-act vtbl-act--call"
                        disabled={busy}
                        onClick={() => onCall?.(r)}
                      >
                        Call
                      </button>
                      {onSimulateResident ? (
                        <>
                          <button
                            type="button"
                            className="vtbl-act vtbl-act--approve"
                            disabled={busy}
                            onClick={() => onSimulateResident(r.id, 'approve')}
                          >
                            Sim. Approve
                          </button>
                          <button
                            type="button"
                            className="vtbl-act vtbl-act--deny"
                            disabled={busy}
                            onClick={() => onSimulateResident(r.id, 'reject')}
                          >
                            Sim. Reject
                          </button>
                        </>
                      ) : (
                        <span className="vtbl-badge vtbl-badge--pending">Awaiting resident</span>
                      )}
                    </>
                  ) : null}
                  {mode === 'at-gate' && status === GATE_STATUS.APPROVED ? (
                    <button
                      type="button"
                      className="vtbl-act vtbl-act--checkin"
                      disabled={busy}
                      onClick={() => onCheckIn?.(r.id)}
                    >
                      <EnterIcon />
                      Check in
                    </button>
                  ) : null}
                  {status === GATE_STATUS.INSIDE ? (
                    <button
                      type="button"
                      className="vtbl-act vtbl-act--exit"
                      disabled={busy}
                      onClick={() => onExit?.(r.id)}
                    >
                      <ExitIcon />
                      Mark exit
                    </button>
                  ) : null}
                  {status === GATE_STATUS.REJECTED ? (
                    <span className="vtbl-badge vtbl-badge--rejected">Rejected</span>
                  ) : null}
                  {status === GATE_STATUS.EXITED ? (
                    <span className="vtbl-badge vtbl-badge--approved">Exited</span>
                  ) : null}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default function GuardCabEntryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.key === rawTab) ? rawTab : 'add';
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [historyFrom, setHistoryFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
  });
  const [historyTo, setHistoryTo] = useState(() => indiaTodayISO());
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    document.title = 'Cab Entry | Guard Dashboard';
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const showToast = useCallback((type, title, sub) => {
    setToast({ type, title, sub });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const listParams = useMemo(() => {
    const today = indiaTodayISO();
    const base = {
      search: debouncedSearch || undefined,
      page,
      pageSize: 20,
    };
    if (activeTab === 'at-gate') {
      return {
        ...base,
        status: `${GATE_STATUS.PENDING},${GATE_STATUS.APPROVED}`,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
    }
    if (activeTab === 'today') {
      return {
        ...base,
        from: today,
        to: today,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
    }
    if (activeTab === 'history') {
      return {
        ...base,
        status: GATE_STATUS.EXITED,
        from: historyFrom || undefined,
        to: historyTo || undefined,
        sortBy: 'entryTime',
        sortOrder: 'desc',
      };
    }
    return null;
  }, [activeTab, debouncedSearch, page, historyFrom, historyTo, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!listParams) return;
      if (!cancelled) setLoading(true);
      try {
        const data = await getCabs(listParams);
        if (!cancelled) {
          setItems(data.items);
          setPagination(data.pagination);
        }
      } catch (err) {
        if (!cancelled) showToast('error', 'Failed to load', apiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listParams, showToast]);

  function setTab(key) {
    setSearch('');
    setPage(1);
    setSearchParams(key === 'add' ? { tab: 'add' } : { tab: key }, { replace: true });
  }

  async function handleSubmit(form) {
    const row = await createCab({
      vehicleNumber: form.vehicle,
      driverName: form.driverName,
      cabService: form.service,
      flat: form.flat,
      purpose: form.tripPurpose,
      photo: form.photoSrc,
    });
    setTab('at-gate');
    showToast('success', 'Cab logged', `${row.vehicleNumber} · Flat ${row.flat}`);
  }

  const handleCall = useCallback(
    (row) => {
      showToast('success', 'Call resident', `Flat ${row.flat}`);
    },
    [showToast],
  );

  const handleCheckIn = useCallback(
    async (id) => {
      setBusyId(id);
      try {
        await checkInCab(id);
        showToast('success', 'Checked in', 'Cab is now inside.');
        setSearchParams({ tab: 'today' }, { replace: true });
      } catch (err) {
        showToast('error', 'Check-in failed', apiErrorMessage(err));
      } finally {
        setBusyId(null);
      }
    },
    [showToast, setSearchParams],
  );

  const handleExit = useCallback(
    async (id) => {
      setBusyId(id);
      try {
        await exitCab(id);
        showToast('success', 'Exit marked', 'Cab has exited.');
        setSearchParams({ tab: 'history' }, { replace: true });
      } catch (err) {
        showToast('error', 'Exit failed', apiErrorMessage(err));
      } finally {
        setBusyId(null);
      }
    },
    [showToast, setSearchParams],
  );

  const handleSimulateResident = useCallback(
    async (id, decision) => {
      if (!gateUsesDummy()) return;
      setBusyId(id);
      try {
        await __mockSetCabStatus(
          id,
          decision === 'approve' ? GATE_STATUS.APPROVED : GATE_STATUS.REJECTED,
        );
        showToast(
          'success',
          decision === 'approve' ? 'Simulated: Approved' : 'Simulated: Rejected',
          'Mock resident decision (dev only)',
        );
        setReloadKey((k) => k + 1);
      } catch (err) {
        showToast('error', 'Simulate failed', apiErrorMessage(err));
      } finally {
        setBusyId(null);
      }
    },
    [showToast],
  );

  return (
    <div className="gm-root" data-theme="light">
      <Sidebar activePage="Cab Entry" onNavigate={(label) => navigateGuard(navigate, label)} />

      <div className="gm-content">
        <DashboardHeader />

        <main className="gm-main">
          <div className="vp-root">
            <div className="vp-header">
              <button
                type="button"
                className="vp-back-btn"
                onClick={() => navigate('/guard/dashboard')}
              >
                ← Dashboard
              </button>
              <div className="vp-header-titles">
                <h1 className="vp-page-title">Cab Entry</h1>
              </div>
            </div>

            <div className="vp-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`vp-tab vp-tab--${tab.cls}${
                    activeTab === tab.key ? ' vp-tab--active' : ''
                  }`}
                  onClick={() => setTab(tab.key)}
                >
                  <TabIcon name={tab.icon} />
                  <span>{tab.label}</span>
                  {tab.key !== 'add' && pagination && activeTab === tab.key ? (
                    <span className={`vp-tab-count vp-tab-count--${tab.cls}`}>
                      {pagination.total}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="vp-panel">
              {activeTab === 'add' ? (
                <CabEntryForm onSubmit={handleSubmit} showToast={showToast} />
              ) : null}

              {activeTab === 'at-gate' ? (
                <CabList
                  rows={items}
                  loading={loading}
                  search={search}
                  onSearch={setSearch}
                  emptyTitle="No cabs at gate"
                  emptySub="Pending and approved cabs waiting for check-in appear here."
                  mode="at-gate"
                  onCall={handleCall}
                  onCheckIn={handleCheckIn}
                  onExit={handleExit}
                  onSimulateResident={gateUsesDummy() ? handleSimulateResident : undefined}
                  busyId={busyId}
                />
              ) : null}

              {activeTab === 'today' ? (
                <CabList
                  rows={items}
                  loading={loading}
                  search={search}
                  onSearch={setSearch}
                  emptyTitle="No cab entries today"
                  emptySub="Entries created today appear here."
                  mode="today"
                  onCheckIn={handleCheckIn}
                  onExit={handleExit}
                  busyId={busyId}
                />
              ) : null}

              {activeTab === 'history' ? (
                <CabList
                  rows={items}
                  loading={loading}
                  search={search}
                  onSearch={setSearch}
                  emptyTitle="No exited cab entries"
                  emptySub="Exited cabs for the selected date range appear here."
                  showDateFilter
                  fromDate={historyFrom}
                  toDate={historyTo}
                  onFromDate={(v) => {
                    setHistoryFrom(v);
                    setPage(1);
                  }}
                  onToDate={(v) => {
                    setHistoryTo(v);
                    setPage(1);
                  }}
                  mode="history"
                  busyId={busyId}
                />
              ) : null}

              {pagination && pagination.totalPages > 1 && activeTab !== 'add' ? (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: 12 }}>
                  <button
                    type="button"
                    className="vtbl-act vtbl-act--call"
                    disabled={!pagination.hasPrev}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </button>
                  <span style={{ fontSize: 13, color: '#64748b', alignSelf: 'center' }}>
                    Page {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    className="vtbl-act vtbl-act--call"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </main>
      </div>

      {toast ? (
        <div className={`vp-toast vp-toast--${toast.type}`}>
          <div>
            <div className="vp-toast-title">{toast.title}</div>
            {toast.sub ? <div className="vp-toast-sub">{toast.sub}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
