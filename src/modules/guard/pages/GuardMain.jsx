import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Sidebar from '@/modules/guard/components/Sidebar';
import DashboardHeader from '@/modules/guard/components/DashboardHeader';
import AlertsBanner from '@/modules/guard/components/AlertsBanner';
import QuickActions from '@/modules/guard/components/QuickActions';
import StatsCards from '@/modules/guard/components/StatsCards';
import ApprovalList from '@/modules/guard/components/ApprovalList';
import ActiveVisitors from '@/modules/guard/components/ActiveVisitors';
import DeliverySection from '@/modules/guard/components/DeliverySection';
import StaffSection from '@/modules/guard/components/StaffSection';
import RecentActivity from '@/modules/guard/components/RecentActivity';
import { navigateGuard } from '@/modules/guard/constants/guardRoutes.js';
import { getDashboard } from '@/modules/guard/services/guard/guard.service';
import { exitVisitor, getVisitors } from '@/modules/guard/services/visitor/visitor.service';
import { getDeliveries } from '@/modules/guard/services/delivery/delivery.service';
import { getStaff } from '@/modules/guard/services/staff/staff.service';
import { connectSosAlertsSocket } from '@/modules/guard/services/sos/sosAlertsWs';
import '@/modules/guard/styles/core/guard-main.css';
import '@/modules/guard/styles/dashboard/dashboard.css';

const LIVE = { live: true };

function clock(value) {
  if (!value) return '—';
  const text = String(value);
  if (/^\d{2}:\d{2}/.test(text) && text.length <= 8) return text.slice(0, 5);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return text;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function durationSince(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function flatLabel(row) {
  if (!row) return '—';
  const building = row.buildingNo || row.building || '';
  const wing = row.wingNo || row.wing || '';
  const flatNo = row.flatNo || '';
  if (building || flatNo) {
    const parts = [];
    if (building) parts.push(building);
    if (wing && wing !== building) parts.push(wing);
    if (flatNo || (row.flat && row.flat !== building)) parts.push(flatNo || row.flat);
    return parts.filter(Boolean).join('-') || '—';
  }
  return row.flat || '—';
}

function formatErr(err, fallback) {
  const data = err?.response?.data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail;
  if (err?.message && !/^Request failed with status code/.test(err.message)) return err.message;
  return fallback;
}

export default function GuardMain() {
  const navigate = useNavigate();
  const [bundle, setBundle] = useState(null);
  const [insideVisitors, setInsideVisitors] = useState(null);
  const [pendingDeliveries, setPendingDeliveries] = useState(null);
  const [staffInside, setStaffInside] = useState(null);
  const [visitorPhones, setVisitorPhones] = useState({});
  const [error, setError] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(null);
  const hasDataRef = useRef(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
      setSectionError('');
      setNotice('');
    }
    const [dashR, insideR, pendingR, deliveryR, staffR] = await Promise.allSettled([
      getDashboard(LIVE),
      getVisitors(
        { status: 'inside', page: 1, pageSize: 8, sortBy: 'checkInTime', sortOrder: 'desc' },
        LIVE,
      ),
      getVisitors({ status: 'pending', page: 1, pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }, LIVE),
      getDeliveries({ status: 'pending', page: 1, pageSize: 8, sortBy: 'createdAt', sortOrder: 'desc' }, LIVE),
      getStaff({ status: 'checked_in', page: 1, pageSize: 8 }, LIVE),
    ]);

    const problems = [];
    if (dashR.status === 'fulfilled') {
      setBundle(dashR.value || {});
      hasDataRef.current = true;
      if (!silent) setError('');
    } else if (!silent || !hasDataRef.current) {
      setBundle(null);
      setError(formatErr(dashR.reason, 'Failed to load dashboard'));
    } else {
      setError(formatErr(dashR.reason, 'Failed to refresh dashboard'));
    }

    if (insideR.status === 'fulfilled') {
      setInsideVisitors(insideR.value || { items: [], pagination: { total: 0 } });
    } else {
      if (!silent) setInsideVisitors(null);
      problems.push(formatErr(insideR.reason, 'Active visitors could not be loaded'));
    }

    if (pendingR.status === 'fulfilled') {
      const phones = {};
      for (const row of pendingR.value?.items || []) {
        if (row?.id != null && row.phone) phones[row.id] = row.phone;
      }
      setVisitorPhones(phones);
    } else {
      if (!silent) setVisitorPhones({});
      problems.push(formatErr(pendingR.reason, 'Visitor phone numbers could not be loaded'));
    }

    if (deliveryR.status === 'fulfilled') {
      setPendingDeliveries(deliveryR.value || { items: [], pagination: { total: 0 } });
    } else {
      if (!silent) setPendingDeliveries(null);
      problems.push(formatErr(deliveryR.reason, 'Pending deliveries could not be loaded'));
    }

    if (staffR.status === 'fulfilled') {
      setStaffInside(staffR.value || { items: [], counts: { checkedIn: 0 }, pagination: { total: 0 } });
    } else {
      if (!silent) setStaffInside(null);
      problems.push(formatErr(staffR.reason, 'Staff inside could not be loaded'));
    }

    setSectionError(problems.join(' '));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    document.title = 'Guard Dashboard';
    load();
  }, [load]);

  useEffect(() => {
    const sub = connectSosAlertsSocket({
      onCreated: () => loadRef.current?.({ silent: true }),
      onResolved: () => loadRef.current?.({ silent: true }),
      onReconnectNeedRefetch: () => loadRef.current?.({ silent: true }),
    });
    return () => sub.close?.();
  }, []);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  function handleCall(item) {
    const raw = String(item?.phone || '').replace(/[^\d+]/g, '');
    if (!raw) {
      setError('No phone number available for this visitor');
      return;
    }
    window.location.href = `tel:${raw}`;
  }

  async function handleMarkExit(id) {
    try {
      setNotice('');
      setError('');
      await exitVisitor(id, LIVE);
      setNotice('Visitor exit recorded');
      await load({ silent: true });
    } catch (err) {
      setError(formatErr(err, 'Exit failed'));
    }
  }

  function handleQuickAction(label) {
    if (label === 'Add Visitor') {
      navigate('/guard/visitors?tab=add');
      return;
    }
    navigateGuard(navigate, label);
  }

  const stats = useMemo(() => {
    if (loading && !bundle) return null;
    if (!bundle && !insideVisitors && !pendingDeliveries && !staffInside) return null;
    const c = bundle?.counts || {};
    const totalEntries =
      Number(c.waitingApproval || 0) + Number(c.approvedAtGate || 0) + Number(c.insideNow || 0);
    const activeVisitorCount = insideVisitors ? Number(insideVisitors.pagination?.total ?? 0) : null;
    const deliveryCount = pendingDeliveries ? Number(pendingDeliveries.pagination?.total ?? 0) : null;
    const staffCount = staffInside
      ? Number(staffInside.counts?.checkedIn ?? staffInside.pagination?.total ?? 0)
      : null;
    return [
      {
        label: 'Total Entries Today',
        value: bundle ? totalEntries : '—',
        sub: 'Today so far',
        colorClass: 'blue',
        onClick: () => navigate('/guard/visitors'),
      },
      {
        label: 'Pending Approvals',
        value: bundle ? (c.waitingApproval ?? 0) : '—',
        sub: 'View now →',
        subClass: 'link',
        colorClass: 'yellow',
        onClick: () => navigate('/guard/visitors?tab=pending'),
      },
      {
        label: 'Active Visitors',
        value: activeVisitorCount ?? '—',
        sub: 'Inside Society',
        colorClass: 'green',
        onClick: () => navigate('/guard/visitors?tab=inside'),
      },
      {
        label: 'Deliveries Pending',
        value: deliveryCount ?? '—',
        sub: 'Awaiting pickup',
        colorClass: 'orange',
        onClick: () => navigate('/guard/delivery?tab=pending'),
      },
      {
        label: 'Staff Inside',
        value: staffCount ?? '—',
        sub: 'Currently on duty',
        colorClass: 'purple',
        onClick: () => navigate('/guard/staff-entry'),
      },
    ];
  }, [bundle, insideVisitors, pendingDeliveries, staffInside, loading, navigate]);

  const approvalRows = (bundle?.waiting || []).map((row) => ({
    id: `${row.type || 'item'}-${row.id}`,
    name: row.name || '—',
    phone: row.type === 'visitor' ? visitorPhones[row.id] || '' : '',
    flat: row.flatNo || '—',
    purpose: row.purpose || '—',
    time: clock(row.createdAt),
  }));
  const visitorRows = (insideVisitors?.items || []).map((row) => ({
    id: row.id,
    name: row.name || 'Visitor',
    totalPersons: row.personCount ?? '—',
    flat: flatLabel(row),
    entryTime: clock(row.checkInTime),
    duration: durationSince(row.checkInTime),
  }));
  const deliveryRows = (pendingDeliveries?.items || []).map((row) => ({
    id: row.id,
    person: row.courierName || row.name || '—',
    company: row.company || '—',
    flat: flatLabel(row),
    status: row.status || 'pending',
  }));
  const staffRows = (staffInside?.items || []).map((row) => ({
    id: row.id,
    name: row.name || '—',
    role: row.role || '—',
    flat: flatLabel(row),
    since: clock(row.checkIn),
  }));
  const activityRows = [
    ...(bundle?.waiting || []).map((row) => ({
      id: `wait-${row.type}-${row.id}`,
      type: row.type || 'visitor',
      event:
        row.type === 'delivery' ? 'Delivery pending' : row.type === 'cab' ? 'Cab pending' : 'Approval requested',
      detail: [row.name, row.flatNo, row.purpose].filter(Boolean).join(' · '),
      time: clock(row.createdAt),
    })),
    ...(bundle?.inside || []).map((row) => ({
      id: `in-${row.type}-${row.id}`,
      type: row.type || 'visitor',
      event:
        row.type === 'staff'
          ? 'Staff inside'
          : row.type === 'delivery'
            ? 'Delivery inside'
            : row.type === 'cab'
              ? 'Cab inside'
              : 'Visitor inside',
      detail: [row.name, row.flatNo].filter(Boolean).join(' · '),
      time: clock(row.checkInTime),
    })),
  ];
  const sosRows = (bundle?.sos || []).map((row) => {
    const flat = row.flatNo || row.flat || '—';
    return {
      id: row.id,
      event: row.residentName || 'SOS',
      detail: [flat, row.message].filter(Boolean).join(' · '),
      text: row.message || '',
      time: clock(row.createdAt),
      type: 'sos',
      flat,
      message: row.message || '',
      note: row.message || '',
    };
  });

  const pendingTotal = bundle?.counts?.waitingApproval;
  const insideTotal = insideVisitors?.pagination?.total;
  const deliveryTotal = pendingDeliveries ? Number(pendingDeliveries.pagination?.total ?? 0) : null;
  const staffTotal = staffInside
    ? Number(staffInside.counts?.checkedIn ?? staffInside.pagination?.total ?? 0)
    : null;

  return (
    <div className="gm-root" data-theme="light">
      <Sidebar activePage="Dashboard" onNavigate={handleSidebarNav} />

      <div className="gm-content">
        <DashboardHeader />

        <main className="gm-main gm-ops">
          {error ? (
            <div className="gm-panel" style={{ marginBottom: 0, color: 'var(--gm-danger, #c0392b)' }}>
              {error}
              <button type="button" className="gm-view-all" style={{ marginLeft: 12 }} onClick={() => load()}>
                Retry
              </button>
            </div>
          ) : null}
          {sectionError ? (
            <div className="gm-panel" style={{ marginBottom: 0, color: 'var(--gm-danger, #c0392b)' }}>
              {sectionError}
            </div>
          ) : null}
          {notice ? (
            <div className="gm-panel" style={{ marginBottom: 0 }}>
              {notice}
            </div>
          ) : null}

          <AlertsBanner
            alerts={loading && !bundle ? [] : sosRows}
            onViewDetails={() => navigate('/guard/sos')}
          />

          <QuickActions onAction={handleQuickAction} />

          <StatsCards stats={stats} loading={loading} />

          <div className="gm-two-col">
            <ApprovalList
              title="Live Approvals"
              data={approvalRows}
              loading={loading && !bundle}
              totalCount={pendingTotal}
              showCall
              onCall={handleCall}
              onViewAll={() => navigate('/guard/visitors?tab=pending')}
            />
            <ActiveVisitors
              title="Active Visitors"
              data={visitorRows}
              loading={loading && !insideVisitors}
              totalCount={insideTotal}
              onMarkExit={handleMarkExit}
              onViewAll={() => navigate('/guard/visitors?tab=inside')}
            />
          </div>

          <div className="gm-three-col">
            <DeliverySection
              title="Deliveries at Gate"
              badge={
                deliveryTotal == null
                  ? undefined
                  : deliveryTotal === 1
                    ? '1 At gate'
                    : `${deliveryTotal} At gate`
              }
              columns={['Delivery By', 'Flat No.', 'Company', 'Status']}
              emptyText="No deliveries at gate"
              data={deliveryRows}
              loading={loading && !pendingDeliveries}
              onViewAll={() => navigate('/guard/delivery?tab=pending')}
            />
            <StaffSection
              title="Staff Inside"
              badge={
                staffTotal == null ? undefined : staffTotal === 1 ? '1 Inside' : `${staffTotal} Inside`
              }
              data={staffRows}
              loading={loading && !staffInside}
              onViewAll={() => navigate('/guard/staff-entry')}
            />
            <RecentActivity
              title="Recent Activity"
              data={activityRows}
              loading={loading && !bundle}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
