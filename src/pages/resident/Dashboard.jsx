import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { formatMoney, getResidentOutstanding } from '../../services/billing.service';
import { getResidentDashboard } from '../../services/residentPortal.service';
import { getResidentPinnedNotices, getResidentUnreadNotices } from '../../services/notice.service';

const HOUSEHOLD_COLUMNS = [
  { key: 'residentName', label: 'Member', render: (row) => row.residentName || '-' },
  { key: 'role', label: 'Role', render: (row) => row.role || '-' },
];

const VISITOR_COLUMNS = [
  { key: 'visitorName', label: 'Visitor', render: (row) => row.visitorName || 'Visitor' },
  { key: 'status', label: 'Status' },
  { key: 'expectedAt', label: 'Expected', render: (row) => row.expectedAt || '-' },
];

const NOTICE_COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category', render: (row) => row.category || '-' },
  { key: 'priority', label: 'Priority', render: (row) => row.priority || '-' },
];

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [outstanding, setOutstanding] = useState(null);
  const [pinnedNotices, setPinnedNotices] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getResidentDashboard();
        if (mounted) setData(res.data?.data || null);
        try {
          const out = await getResidentOutstanding();
          if (mounted) setOutstanding(out.data?.data || null);
        } catch {
          /* optional billing widget */
        }
        try {
          const pinned = await getResidentPinnedNotices();
          if (mounted) setPinnedNotices(pinned.data?.data?.notices || []);
        } catch {
          /* optional notices widget */
        }
        try {
          const unread = await getResidentUnreadNotices();
          if (mounted) setUnreadCount((unread.data?.data?.notices || []).length);
        } catch {
          /* optional notices widget */
        }
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <SkeletonLoader rows={6} />;
  if (error) return <EmptyState title="Dashboard unavailable" description={error} />;
  if (!data) return <EmptyState title="No dashboard data" />;

  const outstandingMinor =
    outstanding?.outstandingMinor ??
    data.paymentSummary?.outstandingMinor ??
    null;

  const noticeItems = (pinnedNotices.length ? pinnedNotices : data.latestNotices || []).map(
    (item, i) => ({ ...item, id: item.id || `notice-${i}` }),
  );
  const householdItems = (data.household || []).slice(0, 8).map((item, i) => ({
    ...item,
    id: item.id || `hh-${i}`,
  }));
  const visitorItems = (data.upcomingVisitors || []).slice(0, 8).map((item, i) => ({
    ...item,
    id: item.id || `vis-${i}`,
  }));

  return (
    <div className="resident-dashboard">
      <h1 className="resident-page-title">Welcome, {data.welcome?.name}</h1>
      <p className="resident-page-subtitle">
        Resident code: {data.welcome?.residentCode || '-'}
      </p>

      <div className="resident-stat-grid resident-stat-grid--guardish">
        <div className="resident-card resident-card--accent">
          <h3>Outstanding Dues</h3>
          {outstandingMinor != null ? (
            <>
              <p className="resident-card-amount">₹ {formatMoney(outstandingMinor)}</p>
              <p className="resident-card-muted">
                {outstanding?.billCount ?? data.paymentSummary?.billCount ?? 0} open bill(s)
              </p>
            </>
          ) : (
            <p className="resident-card-muted">
              {data.paymentSummary?.message || 'Not available'}
            </p>
          )}
        </div>

        <div className="resident-card">
          <h3>Flat Details</h3>
          <p>Flat: {data.flat?.flatNo || '-'}</p>
          <p>Floor: {data.flat?.floorNo || '-'}</p>
          <p>Building: {data.flat?.buildingName || '-'}</p>
        </div>

        <div className="resident-card">
          <h3>Pinned Notices</h3>
          <p className="resident-card-amount">{noticeItems.length}</p>
          <p className="resident-card-muted">active notice(s)</p>
        </div>

        <div className="resident-card">
          <h3>Unread Notices</h3>
          <p className="resident-card-amount">{unreadCount}</p>
          <p className="resident-card-muted">pending read(s)</p>
        </div>
      </div>

      <section className="resident-section resident-section--panel" style={{ marginBottom: 16 }}>
        <div className="resident-section-header">
          <h3>Household members</h3>
          <Link className="resident-link" to="/resident/household">
            View all
          </Link>
        </div>
        <DataTable
          columns={HOUSEHOLD_COLUMNS}
          rows={householdItems}
          emptyTitle="No household members"
          emptyDescription="Household entries will appear here."
        />
      </section>

      <section className="resident-section resident-section--panel" style={{ marginBottom: 16 }}>
        <div className="resident-section-header">
          <h3>Upcoming visitors</h3>
          <Link className="resident-link" to="/resident/visitors">
            View all
          </Link>
        </div>
        <DataTable
          columns={VISITOR_COLUMNS}
          rows={visitorItems}
          emptyTitle="No upcoming visitors"
          emptyDescription="Invited or expected visitors will appear here."
          onRowClick={() => navigate('/resident/visitors')}
        />
      </section>

      <section className="resident-section resident-section--panel">
        <div className="resident-section-header">
          <h3>Pinned notices</h3>
          {unreadCount > 0 && (
            <span className="resident-badge">{unreadCount} unread</span>
          )}
        </div>
        <DataTable
          columns={NOTICE_COLUMNS}
          rows={noticeItems}
          emptyTitle="No pinned notices"
          emptyDescription="Pinned notices will appear here."
          onRowClick={(row) => navigate(`/resident/notices/${row.id}`)}
        />
        <div className="resident-actions resident-actions-row" style={{ marginTop: 12 }}>
          <Link className="resident-link resident-action-btn" to="/resident/notices">
            All notices
          </Link>
          <Link className="resident-link resident-action-btn" to="/resident/notices/unread">
            Unread
          </Link>
          <Link className="resident-link resident-action-btn" to="/resident/outstanding">
            Outstanding
          </Link>
        </div>
      </section>
    </div>
  );
}
