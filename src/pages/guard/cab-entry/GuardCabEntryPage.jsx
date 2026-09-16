import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/guard/visitor/visitors.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import CabEntryForm from '../../../components/guard/quick-entry/CabEntryForm.jsx';
import GateDatePicker from '../../../components/guard/shared/GateDatePicker.jsx';
import {
  apiError,
  callResidentForDelivery,
  listCabEntries,
  logCabEntry,
  tryGuardApprove,
  tryGuardDeny,
} from '../../../services/guard.service';

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

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
    </svg>
  );
}

/** Cabs waiting for Call / Allow / Deny */
function isCabAtGate(row) {
  const s = String(row.visitStatus || '').toLowerCase();
  return ['waiting', 'pending'].includes(s);
}

function isCabDenied(row) {
  return String(row.visitStatus || '').toLowerCase() === 'rejected';
}

function isCabAllowed(row) {
  const s = String(row.visitStatus || '').toLowerCase();
  return ['checked_in', 'checked_out', 'approved', 'exited'].includes(s);
}

function matchesCabOutcome(row, outcome) {
  if (!outcome || outcome === 'all') return true;
  if (outcome === 'deny') return isCabDenied(row);
  if (outcome === 'allow') return isCabAllowed(row);
  return true;
}

const CAB_OUTCOME_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'allow', label: 'Allow' },
  { value: 'deny', label: 'Deny' },
];

function dayKey(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayKey() {
  return dayKey(new Date());
}

function daysAgoKey(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return dayKey(d);
}

function CabList({
  rows,
  loading,
  search,
  onSearch,
  emptyTitle,
  emptySub,
  showActions = false,
  onCall,
  onAllow,
  onDeny,
  busyId = null,
  showDateFilter = false,
  fromDate = '',
  toDate = '',
  onFromDate,
  onToDate,
  outcomeFilter = 'all',
  onOutcomeFilter,
}) {
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const outcomeRef = useRef(null);

  useEffect(() => {
    if (!outcomeOpen) return undefined;
    const onDoc = (e) => {
      if (outcomeRef.current && !outcomeRef.current.contains(e.target)) {
        setOutcomeOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [outcomeOpen]);

  const outcomeLabel =
    CAB_OUTCOME_OPTIONS.find((o) => o.value === outcomeFilter)?.label || 'All';

  const filtered = rows.filter((r) => {
    if (showDateFilter) {
      const key = dayKey(r.createdAt);
      if (!key) return false;
      if (fromDate && key < fromDate) return false;
      if (toDate && key > toDate) return false;
      if (!matchesCabOutcome(r, outcomeFilter)) return false;
    }
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      r.driver.toLowerCase().includes(q) ||
      r.vehicle.toLowerCase().includes(q) ||
      r.flat.toLowerCase().includes(q) ||
      String(r.resident || '')
        .toLowerCase()
        .includes(q) ||
      String(r.service || '')
        .toLowerCase()
        .includes(q)
    );
  });

  const gridCls = showActions ? 'cab-grid cab-grid--actions' : 'cab-grid';

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
            placeholder={showDateFilter ? 'Search…' : 'Search by driver, vehicle number or flat…'}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        {showDateFilter ? (
          <div className="cab-date-range" aria-label="Date range filter">
            <GateDatePicker
              label="From"
              value={fromDate}
              max={toDate || todayKey()}
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
              max={todayKey()}
              onChange={(next) => {
                if (fromDate && next && next < fromDate) onToDate?.(fromDate);
                else onToDate?.(next);
              }}
            />
            <div className="vtbl-filter-wrap cab-outcome-filter" ref={outcomeRef}>
              <button
                type="button"
                className={`vtbl-filter-select cab-outcome-select${outcomeOpen ? ' is-open' : ''}${
                  outcomeFilter !== 'all' ? ' is-filtered' : ''
                }`}
                aria-haspopup="listbox"
                aria-expanded={outcomeOpen}
                aria-label="Filter by allow or deny"
                onClick={() => setOutcomeOpen((o) => !o)}
              >
                <span>{outcomeLabel}</span>
              </button>
              {outcomeOpen ? (
                <ul className="vtbl-filter-menu" role="listbox">
                  {CAB_OUTCOME_OPTIONS.map((opt) => (
                    <li key={opt.value}>
                      <button
                        type="button"
                        className={outcomeFilter === opt.value ? 'is-active' : undefined}
                        role="option"
                        aria-selected={outcomeFilter === opt.value}
                        onClick={() => {
                          onOutcomeFilter?.(opt.value);
                          setOutcomeOpen(false);
                        }}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="vtbl-table">
        <div className={`vtbl-head ${gridCls}`}>
          <span>Driver</span>
          <span>Vehicle</span>
          <span className="vtbl-hide">Flat / Resident</span>
          <span className="vtbl-hide">Service</span>
          <span>Purpose</span>
          <span>Entry Time</span>
          {showActions ? <span className="vtbl-actions-head">Actions</span> : null}
        </div>

        {loading ? (
          <div className="vtbl-loading">
            <div className="vtbl-spinner" />
          </div>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <div className="vtbl-empty">
            <h3>{emptyTitle}</h3>
            {emptySub ? <p>{emptySub}</p> : null}
          </div>
        ) : null}

        {!loading &&
          filtered.map((r) => {
            const busy = busyId === r.id;
            return (
              <div key={r.id} className={`vtbl-row ${gridCls}`}>
                <div className="vtbl-name" data-label="Driver">
                  {r.driver}
                </div>
                <div className="vtbl-mono" data-label="Vehicle">
                  {r.vehicle}
                </div>
                <div className="vtbl-hide" data-label="Flat / Resident">
                  <div className="vtbl-mono">{r.flat}</div>
                  {r.resident ? <div className="vtbl-phone">{r.resident}</div> : null}
                </div>
                <div className="vtbl-text vtbl-hide" data-label="Service">
                  {r.service}
                </div>
                <div className="vtbl-text" data-label="Purpose">
                  {r.purpose}
                </div>
                <div className="vtbl-time" data-label="Entry Time">
                  {r.entryTime}
                </div>
                {showActions ? (
                  <div className="vtbl-actions">
                    <button
                      type="button"
                      className="vtbl-act vtbl-act--call"
                      title="Call resident"
                      disabled={busy}
                      onClick={() => onCall?.(r)}
                    >
                      <PhoneIcon />
                      <span>Call</span>
                    </button>
                    <button
                      type="button"
                      className="vtbl-act vtbl-act--approve"
                      disabled={busy}
                      onClick={() => onAllow?.(r)}
                    >
                      Allow
                    </button>
                    <button
                      type="button"
                      className="vtbl-act vtbl-act--deny"
                      disabled={busy}
                      onClick={() => onDeny?.(r)}
                    >
                      Deny
                    </button>
                  </div>
                ) : null}
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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [historyFrom, setHistoryFrom] = useState(() => daysAgoKey(7));
  const [historyTo, setHistoryTo] = useState(() => daysAgoKey(1));
  const [historyOutcome, setHistoryOutcome] = useState('all');

  useEffect(() => {
    document.title = 'Cab Entry | Guard Dashboard';
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, []);

  const showToast = useCallback((type, title, sub) => {
    setToast({ type, title, sub });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listCabEntries());
    } catch (err) {
      showToast('error', 'Failed to load', apiError(err, 'Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function setTab(key) {
    setSearch('');
    setSearchParams(key === 'add' ? { tab: 'add' } : { tab: key }, { replace: true });
  }

  async function handleSubmit(form) {
    const row = await logCabEntry(form);
    await refresh();
    setTab('at-gate');
    showToast('success', 'Cab logged', `${form.vehicle} · Flat ${row.flat}`);
  }

  const handleCall = useCallback(
    async (row) => {
      setBusyId(row.id);
      try {
        const { phone, residentName } = await callResidentForDelivery({
          flatId: row.flatId,
          flat: row.flat,
          phone: row.phone,
          name: row.driver,
          raw: row.raw,
        });
        showToast('success', 'Calling resident', `${residentName} · Flat ${row.flat}`);
        window.location.href = `tel:${phone}`;
      } catch (err) {
        showToast('error', 'Cannot call', apiError(err, 'Phone not available.'));
      } finally {
        setBusyId(null);
      }
    },
    [showToast],
  );

  const handleAllow = useCallback(
    async (row) => {
      setBusyId(row.id);
      try {
        await tryGuardApprove(row.raw || row);
        await refresh();
        setTab('today');
        showToast('success', 'Cab allowed', `${row.vehicle} · Flat ${row.flat}`);
      } catch (err) {
        showToast('error', 'Allow failed', apiError(err, 'Please try again.'));
      } finally {
        setBusyId(null);
      }
    },
    [refresh, showToast],
  );

  const handleDeny = useCallback(
    async (row) => {
      setBusyId(row.id);
      try {
        await tryGuardDeny({
          ...(row.raw || row),
          id: row.id,
        });
        await refresh();
        showToast('success', 'Cab denied', `${row.vehicle} · Flat ${row.flat}`);
      } catch (err) {
        showToast('error', 'Deny failed', apiError(err, 'Please try again.'));
      } finally {
        setBusyId(null);
      }
    },
    [refresh, showToast],
  );

  const { atGateRows, todayRows, historyRows, historyFilteredCount } = useMemo(() => {
    const today = todayKey();
    const atGate = [];
    const todays = [];
    const older = [];
    for (const row of rows) {
      if (isCabAtGate(row)) {
        atGate.push(row);
        continue;
      }
      const key = dayKey(row.createdAt);
      if (key && key === today) todays.push(row);
      else older.push(row);
    }
    const historyShown = older.filter((r) => {
      const key = dayKey(r.createdAt);
      if (!key) return false;
      if (historyFrom && key < historyFrom) return false;
      if (historyTo && key > historyTo) return false;
      if (!matchesCabOutcome(r, historyOutcome)) return false;
      return true;
    });
    return {
      atGateRows: atGate,
      todayRows: todays,
      historyRows: older,
      historyFilteredCount: historyShown.length,
    };
  }, [rows, historyFrom, historyTo, historyOutcome]);

  return (
    <div className="gm-root">
      <Sidebar activePage="Dashboard" onNavigate={(label) => navigateGuard(navigate, label)} />

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
              {TABS.map((tab) => {
                const count =
                  tab.key === 'at-gate'
                    ? atGateRows.length
                    : tab.key === 'today'
                      ? todayRows.length
                      : tab.key === 'history'
                        ? historyFilteredCount
                        : null;
                return (
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
                    {count !== null ? (
                      <span className={`vp-tab-count vp-tab-count--${tab.cls}`}>{count}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="vp-panel">
              {activeTab === 'add' ? (
                <CabEntryForm onSubmit={handleSubmit} showToast={showToast} />
              ) : null}

              {activeTab === 'at-gate' ? (
                <CabList
                  rows={atGateRows}
                  loading={loading}
                  search={search}
                  onSearch={setSearch}
                  emptyTitle="No cabs at gate"
                  emptySub="Logged cabs waiting for Call / Allow / Deny show here."
                  showActions
                  onCall={handleCall}
                  onAllow={handleAllow}
                  onDeny={handleDeny}
                  busyId={busyId}
                />
              ) : null}

              {activeTab === 'today' ? (
                <CabList
                  rows={todayRows}
                  loading={loading}
                  search={search}
                  onSearch={setSearch}
                  emptyTitle="No cab entries today"
                  emptySub="Add a cab when one arrives at the gate."
                />
              ) : null}

              {activeTab === 'history' ? (
                <CabList
                  rows={historyRows}
                  loading={loading}
                  search={search}
                  onSearch={setSearch}
                  emptyTitle="No cab entries for this date range"
                  showDateFilter
                  fromDate={historyFrom}
                  toDate={historyTo}
                  onFromDate={setHistoryFrom}
                  onToDate={setHistoryTo}
                  outcomeFilter={historyOutcome}
                  onOutcomeFilter={setHistoryOutcome}
                />
              ) : null}
            </div>
          </div>
        </main>
      </div>

      {toast ? (
        <div className="vp-toast">
          <div
            className={`vp-toast-icon vp-toast-icon--${toast.type === 'error' ? 'error' : 'success'}`}
          >
            {toast.type === 'error' ? '!' : '✓'}
          </div>
          <div>
            <div className="vp-toast-title">{toast.title}</div>
            {toast.sub ? <div className="vp-toast-sub">{toast.sub}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
