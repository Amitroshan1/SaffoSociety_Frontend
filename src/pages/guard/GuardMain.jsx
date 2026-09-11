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
  markDeliveryCollected,
  markVisitorExit,
} from '../../services/guard.service';
import { DEMO_SOS_ALERTS, activeSosAlerts } from '../../constants/guardSosDemo.js';

export default function GuardMain() {
  const navigate = useNavigate();
  const [bundle, setBundle] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
        value: s.pendingApprovalsCount,
        sub: 'Awaiting resident response',
        subClass: '',
        colorClass: 'yellow',
        onClick: () => navigate('/guard/visitors?tab=pending'),
      },
      {
        label: 'Active Visitors',
        value: s.visitorsInsideCount,
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

  async function handleCollectDelivery(id) {
    try {
      await markDeliveryCollected(id);
      await load();
    } catch (err) {
      setError(apiError(err, 'Collect failed'));
    }
  }

  const approvalRows = bundle?.pending || [];
  // Live active SOS first; if none, show demo so top banner is visible for UI check
  const liveSos = activeSosAlerts(bundle?.sosAlerts || []);
  const sosAlerts = liveSos.length > 0 ? liveSos : activeSosAlerts(DEMO_SOS_ALERTS);
  const sosIsDemo = liveSos.length === 0;

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
              onCollect={handleCollectDelivery}
              onViewAll={() => navigate('/guard/delivery?tab=pending')}
            />
            <StaffSection data={bundle?.staff || []} loading={loading} />
            <RecentActivity data={bundle?.activity || []} loading={loading} />
          </div>
        </main>
      </div>
    </div>
  );
}
