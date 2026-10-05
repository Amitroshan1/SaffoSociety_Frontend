import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AddVisitorForm from '@/modules/guard/components/visitor/AddVisitorForm';
import VisitorTable from '@/modules/guard/components/visitor/VisitorTable';
import {
  getVisitors,
  createVisitor,
  checkInVisitor,
  exitVisitor,
  __mockSetVisitorStatus,
} from '@/modules/guard/services/visitor/visitor.service';
import { apiErrorMessage } from '@/modules/guard/services/core/http';
import { GATE_STATUS } from '@/modules/guard/services/gate/gateStatus';
import { gateUsesDummy } from '@/config/dataMode';

const TABS = [
  { key: 'add', label: 'Add Visitor', icon: 'plus' },
  { key: 'pending', label: 'Pending', icon: 'clock', status: GATE_STATUS.PENDING },
  { key: 'approved', label: 'Approved', icon: 'check', status: GATE_STATUS.APPROVED },
  { key: 'inside', label: 'Inside', icon: 'door', status: GATE_STATUS.INSIDE },
  { key: 'rejected', label: 'Rejected', icon: 'x', status: GATE_STATUS.REJECTED },
  { key: 'exited', label: 'Exited', icon: 'done', status: GATE_STATUS.EXITED },
];

const VALID_TABS = new Set(TABS.map((t) => t.key));

export default function Visitors({ onNavigateBack }) {
  const [searchParams] = useSearchParams();
  const initialTab = VALID_TABS.has(searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'add';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [counts, setCounts] = useState({});

  const showToast = useCallback((type, title, sub) => {
    setToast({ type, title, sub });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (VALID_TABS.has(tab)) setActiveTab(tab);
  }, [searchParams]);

  const loadCounts = useCallback(async () => {
    try {
      const statuses = [
        GATE_STATUS.PENDING,
        GATE_STATUS.APPROVED,
        GATE_STATUS.INSIDE,
        GATE_STATUS.REJECTED,
        GATE_STATUS.EXITED,
      ];
      const results = await Promise.all(
        statuses.map((status) => getVisitors({ status, page: 1, pageSize: 1 })),
      );
      const next = {};
      statuses.forEach((s, i) => {
        next[s] = results[i].pagination?.total ?? 0;
      });
      setCounts(next);
    } catch {
      /* ignore count errors */
    }
  }, []);

  const refreshList = useCallback(async () => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab?.status) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getVisitors({
        status: tab.status,
        search: search.trim() || undefined,
        page,
        pageSize: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      showToast('error', 'Failed to load visits', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, showToast]);

  useEffect(() => {
    if (activeTab === 'add') {
      setLoading(false);
      loadCounts();
      return;
    }
    refreshList();
    loadCounts();
  }, [activeTab, refreshList, loadCounts]);

  const handleAddVisitor = useCallback(
    async (form) => {
      const row = await createVisitor({
        name: form.name,
        phone: form.phone,
        purpose: form.purpose,
        flat: form.flat,
        personCount: form.persons ?? form.personCount,
        vehicleNumber: form.vehicle || form.vehicleNumber,
        vehicleType: form.vtype || form.vehicleType || undefined,
        notifyResident: form.notify !== false,
        preApproved: Boolean(form.preapprove || form.preApproved),
        remarks: form.note || form.remarks,
        photo: form.photoSrc || form.photo,
      });
      if (row.status === GATE_STATUS.INSIDE) {
        setActiveTab('inside');
        showToast('success', 'Visitor logged', `Pre-approved · Flat ${row.flat}`);
      } else {
        setActiveTab('pending');
        showToast('success', 'Visitor added', `Pending resident response · Flat ${row.flat}`);
      }
      setPage(1);
    },
    [showToast],
  );

  const handleCheckIn = useCallback(
    async (id) => {
      try {
        await checkInVisitor(id);
        showToast('success', 'Checked in', 'Visitor is now inside.');
        setActiveTab('inside');
        setPage(1);
        await refreshList();
        await loadCounts();
      } catch (err) {
        showToast('error', 'Check-in failed', apiErrorMessage(err));
        await refreshList();
      }
    },
    [showToast, refreshList, loadCounts],
  );

  const handleExit = useCallback(
    async (id) => {
      try {
        await exitVisitor(id);
        showToast('success', 'Exit marked', 'Visitor has exited.');
        setActiveTab('exited');
        setPage(1);
        await refreshList();
        await loadCounts();
      } catch (err) {
        showToast('error', 'Exit failed', apiErrorMessage(err));
        await refreshList();
      }
    },
    [showToast, refreshList, loadCounts],
  );

  const handleCall = useCallback(
    (id) => {
      const visitor = items.find((v) => v.id === id);
      const phone = visitor?.phone;
      if (!phone) {
        showToast('error', 'No phone', 'Phone is not available.');
        return;
      }
      window.location.href = `tel:${phone}`;
    },
    [items, showToast],
  );

  /** Local mock only — simulates resident decision so check-in can be tested */
  const handleSimulateResident = useCallback(
    async (id, decision) => {
      if (!gateUsesDummy()) return;
      try {
        await __mockSetVisitorStatus(
          id,
          decision === 'approve' ? GATE_STATUS.APPROVED : GATE_STATUS.REJECTED,
        );
        showToast(
          'success',
          decision === 'approve' ? 'Simulated: Approved' : 'Simulated: Rejected',
          'Mock resident decision (dev only)',
        );
        setActiveTab(decision === 'approve' ? 'approved' : 'rejected');
        setPage(1);
        await loadCounts();
      } catch (err) {
        showToast('error', 'Simulate failed', apiErrorMessage(err));
      }
    },
    [showToast, loadCounts],
  );

  const tableVariant =
    activeTab === 'pending'
      ? 'pending'
      : activeTab === 'approved'
        ? 'approved'
        : activeTab === 'inside'
          ? 'inside'
          : activeTab === 'rejected'
            ? 'rejected'
            : activeTab === 'exited'
              ? 'exited'
              : 'pending';

  return (
    <div className="vp-root">
      <div className="vp-header">
        <button type="button" className="vp-back-btn" onClick={onNavigateBack}>
          <BackIcon />
          Dashboard
        </button>
        <div className="vp-header-titles">
          <h1 className="vp-page-title">Visitors</h1>
        </div>
      </div>

      <div className="vp-tabs">
        {TABS.map((tab) => {
          const count = tab.status ? counts[tab.status] : null;
          return (
            <button
              key={tab.key}
              type="button"
              className={`vp-tab vp-tab--${tab.key}${activeTab === tab.key ? ' vp-tab--active' : ''}`}
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
        {activeTab === 'add' && (
          <AddVisitorForm onSubmit={handleAddVisitor} showToast={showToast} />
        )}
        {activeTab !== 'add' && (
          <VisitorTable
            variant={tableVariant}
            data={items}
            loading={loading}
            search={search}
            onSearch={setSearch}
            onCheckIn={handleCheckIn}
            onMarkExit={handleExit}
            onCall={handleCall}
            onSimulateResident={gateUsesDummy() ? handleSimulateResident : undefined}
            pagination={pagination}
            onPageChange={setPage}
            serverSearch
          />
        )}
      </div>

      {toast && (
        <div className={`vp-toast vp-toast--${toast.type}`}>
          <div className={`vp-toast-icon vp-toast-icon--${toast.type}`}>
            {toast.type === 'success' ? <CheckIcon /> : <XIcon />}
          </div>
          <div>
            <div className="vp-toast-title">{toast.title}</div>
            <div className="vp-toast-sub">{toast.sub}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabIcon({ name }) {
  const props = {
    className: 'vp-tab-icon',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
  };
  if (name === 'plus')
    return (
      <svg {...props}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );
  if (name === 'clock')
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  if (name === 'check')
    return (
      <svg {...props}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  if (name === 'door')
    return (
      <svg {...props}>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M14 11h.01" />
      </svg>
    );
  if (name === 'done')
    return (
      <svg {...props}>
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  return (
    <svg {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function BackIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
