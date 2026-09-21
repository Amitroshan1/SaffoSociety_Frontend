import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { navigateGuard } from '@/constants/guardRoutes.js';
import '@/styles/guard/guard-main.css';
import '@/styles/guard/visitor/visitors.css';
import Sidebar from '@/components/guard/Sidebar';
import DashboardHeader from '@/components/guard/DashboardHeader';
import DeliveryEntryForm from '@/components/guard/quick-entry/DeliveryEntryForm.jsx';
import VisitorTable from '@/components/guard/visitor/VisitorTable.jsx';
import {
  apiError,
  callResidentForDelivery,
  holdDeliveryAtGate,
  listQuickEntryByMode,
  logDelivery,
  markHeldParcelCollected,
  markResidentReceived,
} from '@/services/guard.service';

const DELIVERY_CONFIG = {
  title: 'Deliveries',
  addLabel: 'Log Delivery',
  submitLabel: 'Log delivery',
  filterBy: 'company',
  filterAllLabel: 'All companies',
  filterOptions: [
    'Amazon',
    'Flipkart',
    'Blinkit',
    'Zepto',
    'Swiggy Instamart',
    'Dunzo',
    'Delhivery',
    'Blue Dart',
    'India Post',
    'Other',
  ],
  tabs: [
    { key: 'add', label: 'Log Delivery', icon: 'plus' },
    { key: 'pending', label: 'At Gate', icon: 'clock' },
    { key: 'rejected', label: 'Received by Guard', icon: 'x' },
    { key: 'completed', label: 'Received by Resident', icon: 'done' },
  ],
  tableCopy: {
    visitorCol: 'Courier',
    purposeCol: 'Company',
    approve: 'By Resident',
    deny: 'By Guard',
    checkIn: 'Send to flat',
    exit: 'By Resident',
    readd: 'Mark Collected',
    done: 'By Resident',
    emptyPending: 'No parcels waiting at gate',
    emptyPendingSub: 'Log a delivery when a courier arrives.',
    emptyActive: '—',
    emptyActiveSub: '—',
    emptyCompleted: 'No resident handovers yet',
    emptyCompletedSub: 'When resident takes or accepts the parcel, it shows here.',
    emptyRejected: 'No parcels with guard',
    emptyRejectedSub: 'Leave-at-gate parcels kept with security show here.',
  },
};

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
  if (name === 'done') {
    return (
      <svg {...props}>
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  }
  if (name === 'x') {
    return (
      <svg {...props}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }
  return null;
}

function mapDeliveryTab(tab) {
  if (tab === 'at-gate' || tab === 'log') return 'pending';
  if (tab === 'held') return 'rejected';
  return tab;
}

export default function GuardQuickEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const config = DELIVERY_CONFIG;
  const tabs = config.tabs;

  const mappedTab = mapDeliveryTab(searchParams.get('tab'));
  const initialTab = tabs.some((t) => t.key === mappedTab) ? mappedTab : 'add';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [pending, setPending] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.title = `${config.title} | Guard Dashboard`;
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, [config.title]);

  useEffect(() => {
    const next = mapDeliveryTab(searchParams.get('tab'));
    if (tabs.some((t) => t.key === next)) setActiveTab(next);
  }, [searchParams, tabs]);

  const showToast = useCallback((type, title, sub) => {
    setToast({ type, title, sub });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refreshLists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listQuickEntryByMode('delivery');
      setPending(data.pending);
      setCompleted(data.completed);
      setRejected(data.rejected);
    } catch (err) {
      showToast('error', 'Failed to load', apiError(err, 'Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  async function handleSubmit(form) {
    const row = await logDelivery(form);
    await refreshLists();
    setActiveTab('pending');
    showToast('success', 'At gate', `Waiting for flat ${row.flat}`);
  }

  const handleApprove = useCallback(
    async (id) => {
      const v = pending.find((x) => x.id === id);
      if (!v) return;
      try {
        await markResidentReceived(id);
        await refreshLists();
        setActiveTab('completed');
        showToast('success', 'Received by Resident', `${v.name} · Flat ${v.flat}`);
      } catch (err) {
        showToast('error', 'Action failed', apiError(err, 'Please try again.'));
      }
    },
    [pending, refreshLists, showToast],
  );

  const handleDeny = useCallback(
    async (id) => {
      const v = pending.find((x) => x.id === id);
      if (!v) return;
      try {
        await holdDeliveryAtGate(id, v.raw?.remarks || v.note || '');
        await refreshLists();
        setActiveTab('rejected');
        showToast('success', 'Received by Guard', `Parcel kept at gate · Flat ${v.flat}`);
      } catch (err) {
        showToast('error', 'Action failed', apiError(err, 'Please try again.'));
      }
    },
    [pending, refreshLists, showToast],
  );

  const handleCall = useCallback(
    async (id) => {
      const row = pending.find((v) => v.id === id);
      if (!row) {
        showToast('error', 'No phone', 'Phone not available.');
        return;
      }
      try {
        const { phone, residentName } = await callResidentForDelivery(row);
        showToast('success', 'Calling resident', `${residentName} · Flat ${row.flat}`);
        window.location.href = `tel:${phone}`;
      } catch (err) {
        showToast('error', 'Cannot call', apiError(err, 'Phone not available.'));
      }
    },
    [pending, showToast],
  );

  const handleReadd = useCallback(
    async (id) => {
      const v = rejected.find((x) => x.id === id);
      if (!v) return;
      try {
        await markHeldParcelCollected(id);
        await refreshLists();
        setActiveTab('completed');
        showToast('success', 'Collected', `Resident picked up · Flat ${v.flat}`);
      } catch (err) {
        showToast('error', 'Action failed', apiError(err, 'Please try again.'));
      }
    },
    [rejected, refreshLists, showToast],
  );

  const tableCopy = config.tableCopy;

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
                <h1 className="vp-page-title">{config.title}</h1>
              </div>
            </div>

            <div className="vp-tabs">
              {tabs.map((tab) => {
                const count =
                  tab.key === 'pending'
                    ? pending.length
                    : tab.key === 'completed'
                      ? completed.length
                      : tab.key === 'rejected'
                        ? rejected.length
                        : null;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    className={`vp-tab vp-tab--${tab.key === 'completed' ? 'approved' : tab.key}${
                      activeTab === tab.key ? ' vp-tab--active' : ''
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <TabIcon name={tab.icon} />
                    <span>{tab.label}</span>
                    {count !== null ? (
                      <span
                        className={`vp-tab-count vp-tab-count--${
                          tab.key === 'completed' ? 'approved' : tab.key
                        }`}
                      >
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="vp-panel">
              {activeTab === 'add' ? (
                <DeliveryEntryForm
                  title={config.addLabel}
                  submitLabel={config.submitLabel}
                  onSubmit={handleSubmit}
                  showToast={showToast}
                />
              ) : null}

              {activeTab === 'pending' ? (
                <VisitorTable
                  variant="pending"
                  data={pending}
                  loading={loading}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  onCall={handleCall}
                  actionLabels={tableCopy}
                  filterBy={config.filterBy}
                  filterOptions={config.filterOptions}
                  filterAllLabel={config.filterAllLabel}
                />
              ) : null}

              {activeTab === 'completed' ? (
                <VisitorTable
                  variant="completed"
                  data={completed}
                  loading={loading}
                  actionLabels={tableCopy}
                  filterBy={config.filterBy}
                  filterOptions={config.filterOptions}
                  filterAllLabel={config.filterAllLabel}
                />
              ) : null}

              {activeTab === 'rejected' ? (
                <VisitorTable
                  variant="rejected"
                  data={rejected}
                  loading={loading}
                  onReadd={handleReadd}
                  actionLabels={tableCopy}
                  filterBy={config.filterBy}
                  filterOptions={config.filterOptions}
                  filterAllLabel={config.filterAllLabel}
                />
              ) : null}
            </div>

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
