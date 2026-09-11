import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/guard/visitor/visitors.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import QuickGateEntryForm from '../../../components/guard/quick-entry/QuickGateEntryForm.jsx';
import DeliveryEntryForm from '../../../components/guard/quick-entry/DeliveryEntryForm.jsx';
import VisitorTable from '../../../components/guard/visitor/VisitorTable.jsx';
import {
  apiError,
  checkInVisitor,
  listQuickEntryByMode,
  logVisitor,
  markVisitorExit,
  readdRejectedVisit,
  tryGuardApprove,
  tryGuardDeny,
} from '../../../services/guard.service';

export const QUICK_ENTRY_MODES = {
  delivery: {
    title: 'Deliveries',
    addLabel: 'Log Delivery',
    lockedPurpose: 'Delivery',
    defaultVisitorType: 'delivery',
    requireVehicle: false,
    showStaffRole: false,
    submitLabel: 'Log delivery',
    tabs: [
      { key: 'add', label: 'Log Delivery', icon: 'plus' },
      { key: 'pending', label: 'At Gate', icon: 'clock' },
      { key: 'active', label: 'With Resident', icon: 'check' },
      { key: 'completed', label: 'Delivered', icon: 'done' },
      { key: 'rejected', label: 'Returned', icon: 'x' },
    ],
    tableCopy: {
      visitorCol: 'Courier',
      approve: 'Allow in',
      deny: 'Return',
      checkIn: 'Send to flat',
      exit: 'Handed over',
      readd: 'Log again',
      done: 'Delivered',
      emptyPending: 'No parcels waiting at gate',
      emptyPendingSub: 'Log a delivery when a courier arrives.',
      emptyActive: 'No deliveries with resident',
      emptyActiveSub: 'Allowed-in parcels show here until handed over.',
      emptyCompleted: 'No delivered parcels yet',
      emptyCompletedSub: 'Completed handovers appear here.',
      emptyRejected: 'No returned parcels',
      emptyRejectedSub: 'Returned / refused parcels appear here.',
    },
  },
  staff: {
    title: 'Staff Entry',
    addLabel: 'Add Staff',
    lockedPurpose: 'Work / Service',
    defaultVisitorType: 'maid',
    requireVehicle: false,
    showStaffRole: true,
    submitLabel: 'Log staff entry',
  },
  cab: {
    title: 'Cab Entry',
    addLabel: 'Add Cab',
    lockedPurpose: 'Cab',
    defaultVisitorType: 'driver',
    requireVehicle: true,
    showStaffRole: false,
    submitLabel: 'Log cab entry',
  },
};

const DEFAULT_TABS = [
  { key: 'add', label: null, icon: 'plus' },
  { key: 'pending', label: 'Pending', icon: 'clock' },
  { key: 'active', label: 'Active', icon: 'check' },
  { key: 'completed', label: 'Completed', icon: 'done' },
  { key: 'rejected', label: 'Rejected', icon: 'x' },
];

const VALID_TABS = new Set(DEFAULT_TABS.map((t) => t.key));

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
  if (name === 'check') {
    return (
      <svg {...props}>
        <polyline points="20 6 9 17 4 12" />
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

export default function GuardQuickEntryPage({ mode = 'delivery' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const config = QUICK_ENTRY_MODES[mode] || QUICK_ENTRY_MODES.delivery;

  const initialTab = VALID_TABS.has(searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'add';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [pending, setPending] = useState([]);
  const [active, setActive] = useState([]);
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
    const tab = searchParams.get('tab');
    if (VALID_TABS.has(tab)) setActiveTab(tab);
  }, [searchParams]);

  const showToast = useCallback((type, title, sub) => {
    setToast({ type, title, sub });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refreshLists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listQuickEntryByMode(mode);
      setPending(data.pending);
      setActive(data.active);
      setCompleted(data.completed);
      setRejected(data.rejected);
    } catch (err) {
      showToast('error', 'Failed to load', apiError(err, 'Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [mode, showToast]);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  async function handleSubmit(form) {
    const row = await logVisitor(form);
    await refreshLists();
    if (mode === 'delivery') {
      if (row.visitStatus === 'waiting') {
        setActiveTab('pending');
        showToast('success', 'At gate', `Waiting for flat ${row.flat}`);
      } else {
        setActiveTab('active');
        showToast('success', 'Logged', `Ready to hand over · Flat ${row.flat}`);
      }
      return;
    }
    if (row.visitStatus === 'waiting') {
      setActiveTab('pending');
      showToast('success', 'Saved', `Waiting approval · Flat ${row.flat}`);
    } else {
      setActiveTab('active');
      showToast('success', 'Saved', `Ready / active · Flat ${row.flat}`);
    }
  }

  const handleApprove = useCallback(
    async (id) => {
      const v = pending.find((x) => x.id === id);
      if (!v) return;
      try {
        await tryGuardApprove(v);
        await refreshLists();
        setActiveTab('active');
        showToast(
          'success',
          mode === 'delivery' ? 'Allowed in' : 'Approved',
          `${v.name} · Flat ${v.flat}`,
        );
      } catch (err) {
        showToast('error', 'Approve failed', apiError(err, 'Please try again.'));
      }
    },
    [pending, refreshLists, showToast, mode],
  );

  const handleDeny = useCallback(
    async (id) => {
      const v = pending.find((x) => x.id === id);
      if (!v) return;
      try {
        await tryGuardDeny(v);
        await refreshLists();
        setActiveTab('rejected');
        showToast(
          'error',
          mode === 'delivery' ? 'Returned' : 'Denied',
          mode === 'delivery' ? `${v.name} · parcel returned` : `${v.name} turned away`,
        );
      } catch (err) {
        showToast('error', 'Deny failed', apiError(err, 'Please try again.'));
      }
    },
    [pending, refreshLists, showToast, mode],
  );

  const handleCall = useCallback(
    (id) => {
      const row = pending.find((v) => v.id === id) || active.find((v) => v.id === id);
      if (!row?.phone) {
        showToast('error', 'No phone', 'Phone not available.');
        return;
      }
      window.location.href = `tel:${row.phone}`;
    },
    [pending, active, showToast],
  );

  const handleMarkExit = useCallback(
    async (id) => {
      const v = active.find((x) => x.id === id);
      if (!v) return;
      try {
        if (v.visitStatus === 'approved') {
          await checkInVisitor(id);
          await refreshLists();
          showToast(
            'success',
            mode === 'delivery' ? 'With resident' : 'Checked in',
            mode === 'delivery' ? `${v.name} going to flat` : `${v.name} is inside`,
          );
          return;
        }
        await markVisitorExit(id);
        await refreshLists();
        setActiveTab('completed');
        showToast(
          'success',
          mode === 'delivery' ? 'Delivered' : 'Completed',
          mode === 'delivery' ? `${v.name} · handed over` : `${v.name} marked exit`,
        );
      } catch (err) {
        showToast('error', 'Action failed', apiError(err, 'Please try again.'));
      }
    },
    [active, refreshLists, showToast, mode],
  );

  const handleReadd = useCallback(
    async (id) => {
      const v = rejected.find((x) => x.id === id);
      if (!v) return;
      try {
        await readdRejectedVisit(v);
        await refreshLists();
        setActiveTab('pending');
        showToast(
          'success',
          mode === 'delivery' ? 'Back at gate' : 'Re-added',
          `${v.name} · Flat ${v.flat}`,
        );
      } catch (err) {
        showToast('error', 'Re-add failed', apiError(err, 'Please try again.'));
      }
    },
    [rejected, refreshLists, showToast, mode],
  );

  const tabs = (config.tabs || DEFAULT_TABS).map((t) =>
    t.key === 'add' && !config.tabs ? { ...t, label: config.addLabel } : t,
  );
  const tableCopy = config.tableCopy || {};

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
                    : tab.key === 'active'
                      ? active.length
                      : tab.key === 'completed'
                        ? completed.length
                        : tab.key === 'rejected'
                          ? rejected.length
                          : null;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    className={`vp-tab vp-tab--${tab.key === 'active' ? 'approved' : tab.key === 'completed' ? 'approved' : tab.key}${
                      activeTab === tab.key ? ' vp-tab--active' : ''
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <TabIcon name={tab.icon} />
                    <span>{tab.label}</span>
                    {count !== null ? (
                      <span className={`vp-tab-count vp-tab-count--${tab.key === 'active' || tab.key === 'completed' ? 'approved' : tab.key}`}>
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="vp-panel">
              {activeTab === 'add' ? (
                mode === 'delivery' ? (
                  <DeliveryEntryForm
                    title={config.addLabel}
                    submitLabel={config.submitLabel}
                    onSubmit={handleSubmit}
                    showToast={showToast}
                  />
                ) : (
                  <QuickGateEntryForm
                    mode={mode}
                    title={config.addLabel}
                    lockedPurpose={config.lockedPurpose}
                    defaultVisitorType={config.defaultVisitorType}
                    requireVehicle={config.requireVehicle}
                    showStaffRole={config.showStaffRole}
                    submitLabel={config.submitLabel}
                    onSubmit={handleSubmit}
                    showToast={showToast}
                  />
                )
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
                />
              ) : null}

              {activeTab === 'active' ? (
                <VisitorTable
                  variant="approved"
                  data={active}
                  loading={loading}
                  onMarkExit={handleMarkExit}
                  actionLabels={tableCopy}
                />
              ) : null}

              {activeTab === 'completed' ? (
                <VisitorTable
                  variant="completed"
                  data={completed}
                  loading={loading}
                  actionLabels={tableCopy}
                />
              ) : null}

              {activeTab === 'rejected' ? (
                <VisitorTable
                  variant="rejected"
                  data={rejected}
                  loading={loading}
                  onReadd={handleReadd}
                  actionLabels={tableCopy}
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
