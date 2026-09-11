import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/guard/guard-main.css';

import Sidebar from '../../components/guard/Sidebar';
import DashboardHeader from '../../components/guard/DashboardHeader';
import AlertsBanner from '../../components/guard/AlertsBanner';
import QuickActions from '../../components/guard/QuickActions';
import StatsCards from '../../components/guard/StatsCards';
import ApprovalList from '../../components/guard/ApprovalList';
import ActiveVisitors from '../../components/guard/ActiveVisitors';
import DeliverySection from '../../components/guard/DeliverySection';
import StaffSection from '../../components/guard/StaffSection';
import RecentActivity from '../../components/guard/RecentActivity';
import { navigateGuard } from '../../constants/guardRoutes.js';
import {
  apiError,
  getDashboardBundle,
  logGuardCall,
  markVisitorExit,
} from '../../services/guard.service';
import {
  activeSosAlerts,
  getActiveTestSosAlerts,
  subscribeTestSos,
} from '../../constants/guardSosDemo.js';

export default function GuardMain() {
  const navigate = useNavigate();
  const [bundle, setBundle] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [testSosTick, setTestSosTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDashboardBundle();
      setBundle(data);
    } catch (err) {
      setError(apiError(err, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Guard Dashboard';
    load();
  }, [load]);

  useEffect(() => {
    return subscribeTestSos(() => setTestSosTick((n) => n + 1));
  }, []);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  function handleQuickAction(label) {
    if (label === 'Add Visitor') {
      navigate('/guard/visitors?tab=add');
      return;
    }
    navigateGuard(navigate, label);
  }

  const stats = useMemo(() => {
    const s = bundle?.stats;
    if (!s) return null;
    const pendingCount = bundle?.pending?.length ?? s.pendingApprovalsCount ?? 0;
    const insideCount = bundle?.inside?.length ?? s.visitorsInsideCount ?? 0;
    return [
      {
        label: 'Total Entries Today',
        value: s.todaysVisitorCount,
        sub: loading ? 'Loading…' : 'Today so far',
        subClass: '',
        colorClass: 'blue',
      },
      {
        label: 'Pending Approvals',
        value: pendingCount,
        sub: 'Awaiting resident response',
        subClass: '',
        colorClass: 'yellow',
        onClick: () => navigate('/guard/visitors?tab=pending'),
      },
      {
        label: 'Active Visitors',
        value: insideCount,
        sub: 'Inside Society',
        subClass: '',
        colorClass: 'green',
        onClick: () => navigate('/guard/visitors?tab=approved'),
      },
      {
        label: 'Deliveries at Gate',
        value: s.pendingDeliveriesCount,
        sub: 'Waiting at gate',
        subClass: '',
        colorClass: 'orange',
        onClick: () => navigate('/guard/delivery?tab=pending'),
      },
      {
        label: 'Staff Inside',
        value: s.staffInsideCount,
        sub: 'Maid / driver checked in',
        subClass: '',
        colorClass: 'purple',
        onClick: () => navigate('/guard/staff-entry?status=in'),
      },
    ];
  }, [bundle, loading, navigate]);

  async function handleMarkExit(id) {
    try {
      await markVisitorExit(id);
      await load();
    } catch (err) {
      setError(apiError(err, 'Exit failed'));
    }
  }

  async function handleCall(item) {
    const raw = String(item?.phone || item?.raw?.phone || '').replace(/[^\d+]/g, '');
    if (!raw) {
      setError('No phone number available for this visitor');
      return;
    }
    try {
      if (item?.id) {
        await logGuardCall(item.id, `Called ${item.name || 'visitor'}`);
      }
    } catch {
      // Dial anyway even if call-log fails
    }
    window.location.href = `tel:${raw}`;
  }

  const approvalRows = bundle?.pending || [];
  // Prefer live API SOS; otherwise use temporary FE test SOS (Activate/Resolve on /guard/sos)
  void testSosTick;
  const liveSos = activeSosAlerts(bundle?.sosAlerts || []);
  const testSos = getActiveTestSosAlerts();
  const sosAlerts = liveSos.length > 0 ? liveSos : testSos;
  const sosIsDemo = liveSos.length === 0 && testSos.length > 0;

  return (
    <div className="gm-root">
      <Sidebar activePage="Dashboard" onNavigate={handleSidebarNav} />

      <div className="gm-content">
        <DashboardHeader />

        <main className="gm-main">
          {error ? (
            <div className="gm-panel" style={{ marginBottom: 16, color: 'var(--gm-danger, #c0392b)' }}>
              {error}
              <button type="button" className="gm-view-all" style={{ marginLeft: 12 }} onClick={load}>
                Retry
              </button>
            </div>
          ) : null}

          <AlertsBanner
            alerts={sosAlerts}
            demo={sosIsDemo}
            onViewDetails={() => navigate('/guard/sos')}
          />

          <QuickActions onAction={handleQuickAction} />

          <StatsCards stats={stats} loading={loading} />

          <div className="gm-two-col">
            <ApprovalList
              data={approvalRows}
              loading={loading}
              onCall={handleCall}
              onViewAll={() => navigate('/guard/visitors?tab=pending')}
            />
            <ActiveVisitors
              data={(bundle?.inside || []).map((v) => ({
                id: v.id,
                name: v.name,
                totalPersons: v.persons,
                flat: v.flat,
                entryTime: v.time,
                duration: v.duration,
              }))}
              loading={loading}
              onMarkExit={handleMarkExit}
              onViewAll={() => navigate('/guard/visitors?tab=approved')}
            />
          </div>

          <div className="gm-three-col">
            <DeliverySection
              data={bundle?.deliveries || []}
              loading={loading}
              onViewAll={() => navigate('/guard/delivery?tab=pending')}
            />
            <StaffSection
              data={bundle?.staff || []}
              loading={loading}
              onViewAll={() => navigate('/guard/staff-entry')}
            />
            <RecentActivity data={bundle?.activity || []} loading={loading} />
          </div>
        </main>
      </div>
    </div>
  );
}
