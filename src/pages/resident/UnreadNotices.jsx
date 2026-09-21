import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import NoticeTabs from '@/components/resident/NoticeTabs';
import { buildNoticeColumns } from '@/components/resident/noticeUi';
import { getResidentUnreadNotices } from '@/services/notice.service';

const columns = buildNoticeColumns();

export default function ResidentUnreadNoticesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getResidentUnreadNotices()
      .then((res) => {
        if (mounted) setRows(res.data?.data?.notices || []);
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.message || 'Failed to fetch unread notices');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h1 className="resident-page-title">Unread Notices</h1>
      <p className="resident-page-subtitle">Notices you have not opened yet.</p>

      <NoticeTabs counts={{ unread: rows.length }} />

      {error && <p className="resident-error">{error}</p>}

      {loading ? (
        <SkeletonLoader rows={4} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(row) => navigate(`/resident/notices/${row.id}`)}
          emptyTitle="You're all caught up"
          emptyDescription="No unread notices right now."
        />
      )}
    </div>
  );
}
