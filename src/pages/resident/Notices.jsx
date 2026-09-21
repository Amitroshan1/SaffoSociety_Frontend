import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import ListToolbar from '@/components/common/ListToolbar';
import Pagination from '@/components/common/Pagination';
import NoticeTabs from '@/components/resident/NoticeTabs';
import { buildNoticeColumns, titleCase } from '@/components/resident/noticeUi';
import { useListQuery } from '@/hooks/useListQuery';
import { normalizePagination } from '@/utils/listQuery';
import {
  NOTICE_CATEGORIES,
  NOTICE_PRIORITIES,
  getResidentPinnedNotices,
  getResidentUnreadNotices,
  listResidentNotices,
} from '@/services/notice.service';

const columns = buildNoticeColumns();

export default function ResidentNoticesPage() {
  const navigate = useNavigate();
  const { state, params, setPage, setSearch, setFilter } = useListQuery({
    sortBy: 'publish_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [counts, setCounts] = useState({ unread: 0, pinned: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const finalParams = { ...params };
    if (state.unreadOnly) finalParams.unreadOnly = state.unreadOnly;
    listResidentNotices(finalParams)
      .then((res) => {
        if (!mounted) return;
        setRows(res.data?.data?.notices || []);
        setPagination(normalizePagination(res.data?.data));
        setError('');
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.message || 'Failed to fetch notices');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params), state.unreadOnly]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getResidentUnreadNotices().catch(() => null),
      getResidentPinnedNotices().catch(() => null),
    ]).then(([unread, pinned]) => {
      if (!mounted) return;
      setCounts({
        unread: (unread?.data?.data?.notices || []).length,
        pinned: (pinned?.data?.data?.notices || []).length,
      });
    });
    return () => {
      mounted = false;
    };
  }, []);

  const urgentCount = useMemo(
    () => rows.filter((row) => ['high', 'critical'].includes(row.priority)).length,
    [rows],
  );

  if (error && !rows.length) return <EmptyState title="Notices unavailable" description={error} />;

  return (
    <div className="resident-notices">
      <h1 className="resident-page-title">Notices</h1>
      <p className="resident-page-subtitle">Society announcements and circulars.</p>

      <NoticeTabs counts={counts} />

      <div className="notice-stat-row">
        <div className="notice-stat">
          <span className="notice-stat-value">{pagination.total ?? rows.length}</span>
          <span className="notice-stat-label">Total notices</span>
        </div>
        <div className="notice-stat notice-stat--warn">
          <span className="notice-stat-value">{counts.unread}</span>
          <span className="notice-stat-label">Unread</span>
        </div>
        <div className="notice-stat">
          <span className="notice-stat-value">{counts.pinned}</span>
          <span className="notice-stat-label">Pinned</span>
        </div>
        <div className="notice-stat notice-stat--danger">
          <span className="notice-stat-value">{urgentCount}</span>
          <span className="notice-stat-label">High priority on this page</span>
        </div>
      </div>

      {error && <p className="resident-error">{error}</p>}

      <ListToolbar
        search={state.search}
        onSearch={setSearch}
        searchPlaceholder="Search notices"
        filters={[
          {
            key: 'category',
            label: 'Category',
            options: NOTICE_CATEGORIES.map((c) => ({ value: c, label: titleCase(c) })),
          },
          {
            key: 'priority',
            label: 'Priority',
            options: NOTICE_PRIORITIES.map((p) => ({ value: p, label: titleCase(p) })),
          },
          {
            key: 'unreadOnly',
            label: 'Read state',
            options: [{ value: 'true', label: 'Unread only' }],
          },
        ]}
        filterValues={state}
        onFilterChange={setFilter}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={(row) => navigate(`/resident/notices/${row.id}`)}
        emptyTitle="No notices found"
        emptyDescription="Announcements shared with your flat will appear here."
      />
      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        totalPages={pagination.totalPages}
        hasNext={pagination.hasNext}
        hasPrev={pagination.hasPrev}
        onPageChange={setPage}
      />
    </div>
  );
}
