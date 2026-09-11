import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/guard/visitor/visitors.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import CabEntryForm from '../../../components/guard/quick-entry/CabEntryForm.jsx';
import {
  apiError,
  listCabEntries,
  logCabEntry,
} from '../../../services/guard.service';

const TABS = [
  { key: 'add', label: 'Add Cab', icon: 'plus', cls: 'add' },
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

function CabList({ rows, loading, search, onSearch, emptyTitle, emptySub }) {
  const filtered = rows.filter((r) => {
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

  return (
    <div className="vtbl-root">
      <div className="vtbl-toolbar">
        <div className="vtbl-search-wrap">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by driver, vehicle number or flat…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="vtbl-table">
        <div className="vtbl-head cab-grid">
          <span>Driver</span>
          <span>Vehicle</span>
          <span className="vtbl-hide">Flat / Resident</span>
          <span className="vtbl-hide">Service</span>
          <span>Purpose</span>
          <span>Entry Time</span>
        </div>

        {loading ? (
          <div className="vtbl-loading">
            <div className="vtbl-spinner" />
          </div>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <div className="vtbl-empty">
            <h3>{emptyTitle}</h3>
            <p>{emptySub}</p>
          </div>
        ) : null}

        {!loading &&
          filtered.map((r) => (
            <div key={r.id} className="vtbl-row cab-grid">
              <div className="vtbl-name">{r.driver}</div>
              <div className="vtbl-mono">{r.vehicle}</div>
              <div className="vtbl-hide">
                <div className="vtbl-mono">{r.flat}</div>
                {r.resident ? <div className="vtbl-phone">{r.resident}</div> : null}
              </div>
              <div className="vtbl-text vtbl-hide">{r.service}</div>
              <div className="vtbl-text">{r.purpose}</div>
              <div className="vtbl-time">{r.entryTime}</div>
            </div>
          ))}
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
    setTab('today');
    showToast('success', 'Cab logged', `${form.vehicle} · Flat ${row.flat}`);
  }

  const { todayRows, historyRows } = useMemo(() => {
    const today = todayKey();
    const todays = [];
    const older = [];
    for (const row of rows) {
      const key = dayKey(row.createdAt);
      if (key && key === today) todays.push(row);
      else older.push(row);
    }
    return { todayRows: todays, historyRows: older };
  }, [rows]);

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
                  tab.key === 'today'
                    ? todayRows.length
                    : tab.key === 'history'
                      ? historyRows.length
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
                  emptyTitle="No older cab entries"
                  emptySub="Past days will show up here."
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
