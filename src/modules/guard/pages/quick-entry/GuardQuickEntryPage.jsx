import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { navigateGuard } from '@/modules/guard/constants/guardRoutes.js';
import Sidebar from '@/modules/guard/components/Sidebar';
import DashboardHeader from '@/modules/guard/components/DashboardHeader';
import DeliveryEntryForm from '@/modules/guard/components/quick-entry/DeliveryEntryForm.jsx';
import DeliveryHandoverModal, {
  DeliveryHandoverRecord,
} from '@/modules/guard/components/quick-entry/DeliveryHandoverModal.jsx';
import VisitorTable from '@/modules/guard/components/visitor/VisitorTable.jsx';
import { EnterIcon, ExitIcon, PhoneIcon } from '@/modules/guard/components/shared/GateActionIcons.jsx';
import {
  getDeliveries,
  createDelivery,
  checkInDelivery,
  exitDelivery,
  holdDeliveryAtGate,
  collectDeliveryAtGate,
  __mockSetDeliveryStatus,
} from '@/modules/guard/services/delivery/delivery.service';
import { apiErrorMessage } from '@/modules/guard/services/core/http';
import { DELIVERY_HELD, GATE_STATUS } from '@/modules/guard/services/gate/gateStatus';
import { gateUsesDummy } from '@/config/dataMode';
import '@/modules/guard/styles/core/guard-main.css';
import '@/modules/guard/styles/delivery/delivery.css';

/**
 * Pending also lists "approved" rows: the resident allowed entry in their app,
 * and the backend still needs the guard's check-in to move them inside.
 */
const TABS = [
  { key: 'add', label: 'Log Delivery', icon: 'plus' },
  {
    key: 'pending',
    label: 'Pending',
    icon: 'clock',
    statuses: [GATE_STATUS.PENDING, GATE_STATUS.APPROVED],
  },
  { key: 'at-gate', label: 'At Gate', icon: 'box', statuses: [DELIVERY_HELD] },
  { key: 'handed', label: 'Handed over', icon: 'handover', statuses: [GATE_STATUS.EXITED], collectedAtGate: true },
  { key: 'inside', label: 'Inside', icon: 'door', statuses: [GATE_STATUS.INSIDE] },
  { key: 'rejected', label: 'Rejected', icon: 'x', statuses: [GATE_STATUS.REJECTED] },
  { key: 'exited', label: 'Exited', icon: 'done', statuses: [GATE_STATUS.EXITED], collectedAtGate: false },
];

const COUNT_STATUSES = [
  GATE_STATUS.PENDING,
  GATE_STATUS.APPROVED,
  DELIVERY_HELD,
  GATE_STATUS.INSIDE,
  GATE_STATUS.REJECTED,
];

const TABLE_VARIANT = {
  pending: 'pending',
  'at-gate': 'held',
  handed: 'handed',
  inside: 'inside',
  rejected: 'rejected',
  exited: 'exited',
};

const FILTER_OPTIONS = [
  'amazon',
  'flipkart',
  'blinkit',
  'zepto',
  'swiggy instamart',
  'dunzo',
  'delhivery',
  'blue dart',
  'india post',
  'other',
];

const TABLE_COPY = {
  visitorCol: 'Courier',
  purposeCol: 'Company',
  emptyPending: 'No pending deliveries',
  emptyPendingSub: 'Waiting for resident response.',
  emptyHeld: 'No parcels at the gate',
  emptyHeldSub: 'Parcels the resident will collect from the gate appear here.',
  emptyHanded: 'No handovers yet',
  emptyHandedSub: 'Parcels you handed to a resident show here, with who collected them.',
  emptyInside: 'No couriers inside',
  emptyInsideSub: 'Couriers who went up to the flat appear here.',
  emptyRejected: 'No rejected deliveries',
  emptyRejectedSub: 'Rejected by resident appear here.',
  emptyExited: 'No completed deliveries',
  emptyExitedSub: 'Exited couriers and collected parcels appear here.',
};

const STATUS_BADGE = {
  [GATE_STATUS.PENDING]: ['pending', 'Waiting for resident'],
  [GATE_STATUS.APPROVED]: ['approved', 'Resident allowed'],
  [DELIVERY_HELD]: ['held', 'At gate'],
  [GATE_STATUS.INSIDE]: ['inside', 'Inside'],
  [GATE_STATUS.REJECTED]: ['rejected', 'Rejected'],
  [GATE_STATUS.EXITED]: ['exited', 'Exited'],
};

function mapDeliveryTab(tab) {
  if (tab === 'log') return 'pending';
  if (tab === 'approved') return 'pending';
  if (tab === 'held') return 'at-gate';
  if (tab === 'completed') return 'exited';
  return tab;
}

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
  if (name === 'box') {
    return (
      <svg {...props}>
        <path d="M21 8l-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </svg>
    );
  }
  if (name === 'handover') {
    return (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="3" />
        <path d="M19 8v6" />
        <path d="M22 11h-6" />
      </svg>
    );
  }
  if (name === 'door') {
    return (
      <svg {...props}>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M14 11h.01" />
      </svg>
    );
  }
  if (name === 'done') {
    return (
      <svg {...props}>
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function GuardQuickEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mappedTab = mapDeliveryTab(searchParams.get('tab'));
  const [activeTab, setActiveTab] = useState(
    TABS.some((t) => t.key === mappedTab) ? mappedTab : 'add',
  );
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [handoverFor, setHandoverFor] = useState(null);
  const [recordFor, setRecordFor] = useState(null);
  const [toast, setToast] = useState(null);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    document.title = 'Deliveries | Guard Dashboard';
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, []);

  const showToast = useCallback((type, title, sub) => {
    setToast({ type, title, sub });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadCounts = useCallback(async () => {
    try {
      const results = await Promise.all(
        COUNT_STATUSES.map((status) => getDeliveries({ status, page: 1, pageSize: 1 })),
      );
      const byStatus = {};
      COUNT_STATUSES.forEach((s, i) => {
        byStatus[s] = results[i].pagination?.total ?? 0;
      });
      const [left, handed] = await Promise.all([
        getDeliveries({ status: GATE_STATUS.EXITED, collectedAtGate: 'false', page: 1, pageSize: 1 }),
        getDeliveries({ status: GATE_STATUS.EXITED, collectedAtGate: 'true', page: 1, pageSize: 1 }),
      ]);
      const next = {};
      TABS.forEach((t) => {
        if (!t.statuses || t.collectedAtGate != null) return;
        next[t.key] = t.statuses.reduce((sum, s) => sum + (byStatus[s] || 0), 0);
      });
      next.exited = left.pagination?.total ?? 0;
      next.handed = handed.pagination?.total ?? 0;
      setCounts(next);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshList = useCallback(async () => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab?.statuses) {
      setItems([]);
      return;
    }
    try {
      const data = await getDeliveries({
        status: tab.statuses.join(','),
        collectedAtGate: tab.collectedAtGate == null ? undefined : String(tab.collectedAtGate),
        search: search.trim() || undefined,
        page,
        pageSize: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      showToast('error', 'Failed to load deliveries', apiErrorMessage(err));
    }
  }, [activeTab, page, search, showToast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (activeTab === 'add') {
        await loadCounts();
        return;
      }
      if (!cancelled) setLoading(true);
      try {
        await refreshList();
        await loadCounts();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, refreshList, loadCounts]);

  async function handleSubmit(form) {
    const row = await createDelivery(form);
    setActiveTab('pending');
    setPage(1);
    showToast('success', 'Delivery logged', `Pending resident · Flat ${row.flat}`);
    await loadCounts();
  }

  const runAction = useCallback(
    async (id, action, { title, sub, nextTab, errorTitle }) => {
      setBusyId(id);
      try {
        await action();
        showToast('success', title, sub);
        if (nextTab && nextTab !== activeTab) {
          setActiveTab(nextTab);
          setPage(1);
        } else {
          await refreshList();
        }
        await loadCounts();
      } catch (err) {
        showToast('error', errorTitle, apiErrorMessage(err));
        await refreshList();
      } finally {
        setBusyId(null);
      }
    },
    [activeTab, showToast, refreshList, loadCounts],
  );

  const handleSendInside = (id) =>
    runAction(id, () => checkInDelivery(id), {
      title: 'Sent inside',
      sub: 'Courier is going up to the flat.',
      nextTab: 'inside',
      errorTitle: 'Check-in failed',
    });

  const handleKeepAtGate = (id) =>
    runAction(id, () => holdDeliveryAtGate(id), {
      title: 'Kept at gate',
      sub: 'Resident will collect the parcel from the gate.',
      nextTab: 'at-gate',
      errorTitle: 'Could not keep at gate',
    });

  async function handleHandover(fields) {
    if (!handoverFor) return;
    const id = handoverFor.id;
    const who = fields.collectedByName;
    setBusyId(id);
    try {
      await collectDeliveryAtGate(id, fields);
      setHandoverFor(null);
      showToast('success', 'Parcel handed over', `${who} collected it. It is in Handed over.`);
      setActiveTab('handed');
      setPage(1);
      await loadCounts();
    } catch (err) {
      showToast('error', 'Could not mark collected', apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const handleExit = (id) =>
    runAction(id, () => exitDelivery(id), {
      title: 'Exit marked',
      sub: 'Courier has left.',
      nextTab: 'exited',
      errorTitle: 'Exit failed',
    });

  const handleSimulate = (id, decision) => {
    if (!gateUsesDummy()) return;
    if (decision === 'inside') {
      runAction(
        id,
        async () => {
          await __mockSetDeliveryStatus(id, GATE_STATUS.APPROVED);
          await checkInDelivery(id);
        },
        {
          title: 'Simulated: Send inside',
          sub: 'Mock resident decision (dev only)',
          nextTab: 'inside',
          errorTitle: 'Simulate failed',
        },
      );
    } else if (decision === 'gate') {
      runAction(id, () => holdDeliveryAtGate(id), {
        title: 'Simulated: Keep at gate',
        sub: 'Mock resident decision (dev only)',
        nextTab: 'at-gate',
        errorTitle: 'Simulate failed',
      });
    } else {
      runAction(id, () => __mockSetDeliveryStatus(id, GATE_STATUS.REJECTED), {
        title: 'Simulated: Rejected',
        sub: 'Mock resident decision (dev only)',
        nextTab: 'rejected',
        errorTitle: 'Simulate failed',
      });
    }
  };

  const handleCall = (id) => {
    const row = items.find((v) => v.id === id);
    if (!row?.phone) {
      showToast('error', 'No phone', 'Phone is not available.');
      return;
    }
    window.location.assign(`tel:${row.phone}`);
  };

  const renderStatus = (row) => {
    const status = String(row.status || '').toLowerCase();
    const [cls, label] = STATUS_BADGE[status] || ['pending', status || '—'];
    const handover = row.handover;
    const handedOver = status === GATE_STATUS.EXITED && row.collectedAtGate;
    const handedAt = handover?.handedAt || row.exitTime;
    const when = handedAt
      ? new Date(handedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    return (
      <div className="dho-status">
        <span className={`vtbl-badge vtbl-badge--${handedOver ? 'held' : cls}`}>
          <span className="vtbl-badge-dot" />
          {handedOver ? 'Handed over' : label}
        </span>
        {handedOver ? (
          <button type="button" className="dho-who" onClick={() => setRecordFor(row)}>
            To {handover?.collectedByName || 'resident'}
            {when ? ` · ${when}` : ''}
          </button>
        ) : null}
      </div>
    );
  };

  const renderActions = (row) => {
    const status = String(row.status || '').toLowerCase();
    const busy = busyId === row.id;

    if (status === GATE_STATUS.PENDING) {
      return (
        <>
          <button
            type="button"
            className="vtbl-act vtbl-act--call"
            title="Call courier"
            aria-label="Call courier"
            disabled={busy}
            onClick={() => handleCall(row.id)}
          >
            <PhoneIcon />
            <span>Call</span>
          </button>
          {gateUsesDummy() ? (
            <>
              <button type="button" className="vtbl-act vtbl-act--approve" disabled={busy} onClick={() => handleSimulate(row.id, 'inside')}>
                Sim. Inside
              </button>
              <button type="button" className="vtbl-act vtbl-act--hold" disabled={busy} onClick={() => handleSimulate(row.id, 'gate')}>
                Sim. At gate
              </button>
              <button type="button" className="vtbl-act vtbl-act--deny" disabled={busy} onClick={() => handleSimulate(row.id, 'reject')}>
                Sim. Reject
              </button>
            </>
          ) : (
            <button type="button" className="vtbl-act vtbl-act--hold" disabled={busy} onClick={() => handleKeepAtGate(row.id)}>
              Keep at gate
            </button>
          )}
        </>
      );
    }
    if (status === GATE_STATUS.APPROVED) {
      return (
        <>
          <button type="button" className="vtbl-act vtbl-act--checkin" disabled={busy} onClick={() => handleSendInside(row.id)}>
            <EnterIcon />
            Send inside
          </button>
          <button type="button" className="vtbl-act vtbl-act--hold" disabled={busy} onClick={() => handleKeepAtGate(row.id)}>
            Keep at gate
          </button>
        </>
      );
    }
    if (status === DELIVERY_HELD) {
      return (
        <button type="button" className="vtbl-act vtbl-act--approve" disabled={busy} onClick={() => setHandoverFor(row)}>
          Handed to resident
        </button>
      );
    }
    if (status === GATE_STATUS.EXITED && row.collectedAtGate) {
      return (
        <button type="button" className="vtbl-act vtbl-act--hold" onClick={() => setRecordFor(row)}>
          Handover record
        </button>
      );
    }
    if (status === GATE_STATUS.INSIDE) {
      return (
        <button type="button" className="vtbl-act vtbl-act--exit" disabled={busy} onClick={() => handleExit(row.id)}>
          <ExitIcon />
          Mark exit
        </button>
      );
    }
    return <span className="vtbl-act-none">—</span>;
  };

  return (
    <div className="gm-root" data-theme="light">
      <Sidebar activePage="Deliveries" onNavigate={(label) => navigateGuard(navigate, label)} />

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
                <h1 className="vp-page-title">Deliveries</h1>
              </div>
            </div>

            <div className="vp-tabs">
              {TABS.map((tab) => {
                const count = tab.statuses ? counts[tab.key] : null;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    className={`vp-tab vp-tab--${tab.key}${
                      activeTab === tab.key ? ' vp-tab--active' : ''
                    }`}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setPage(1);
                      setSearch('');
                    }}
                  >
                    <TabIcon name={tab.icon} />
                    <span>{tab.label}</span>
                    {count != null ? (
                      <span className={`vp-tab-count vp-tab-count--${tab.key}`}>{count}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="vp-panel">
              {activeTab === 'add' ? (
                <DeliveryEntryForm
                  title="Log Delivery"
                  submitLabel="Log delivery"
                  onSubmit={handleSubmit}
                  showToast={showToast}
                />
              ) : (
                <VisitorTable
                  variant={TABLE_VARIANT[activeTab] || 'pending'}
                  data={items}
                  loading={loading}
                  search={search}
                  onSearch={setSearch}
                  searchPlaceholder="Search courier, phone, flat or tracking ID…"
                  showTracking
                  hideStatus={activeTab === 'pending'}
                  renderStatus={renderStatus}
                  renderActions={renderActions}
                  actionLabels={TABLE_COPY}
                  filterBy="company"
                  filterOptions={FILTER_OPTIONS}
                  filterAllLabel="All companies"
                  pagination={pagination}
                  onPageChange={setPage}
                  serverSearch
                />
              )}
            </div>

            {handoverFor ? (
              <DeliveryHandoverModal
                delivery={handoverFor}
                onClose={() => setHandoverFor(null)}
                onSubmit={handleHandover}
                showToast={showToast}
              />
            ) : null}
            {recordFor ? (
              <DeliveryHandoverRecord delivery={recordFor} onClose={() => setRecordFor(null)} />
            ) : null}

            {toast ? (
              <div className={`vp-toast vp-toast--${toast.type}`}>
                <div>
                  <div className="vp-toast-title">{toast.title}</div>
                  <div className="vp-toast-sub">{toast.sub}</div>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
