import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import NoticeTabs from '@/components/resident/NoticeTabs';
import { buildNoticeColumns } from '@/components/resident/noticeUi';
import { getResidentPinnedNotices } from '@/services/notice.service';

const columns = buildNoticeColumns({ dateKey: 'pinUntil', dateLabel: 'Pinned until' });

export default function ResidentPinnedNoticesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getResidentPinnedNotices()
      .then((res) => {
        if (mounted) setRows(res.data?.data?.notices || []);
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.message || 'Failed to fetch pinned notices');
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
      <h1 className="resident-page-title">Pinned Notices</h1>
      <p className="resident-page-subtitle">Important notices kept at the top by society admin.</p>

      <NoticeTabs counts={{ pinned: rows.length }} />

      {error && <p className="resident-error">{error}</p>}

      {loading ? (
        <SkeletonLoader rows={4} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(row) => navigate(`/resident/notices/${row.id}`)}
          emptyTitle="No pinned notices"
          emptyDescription="Important notices pinned by the admin will appear here."
        />
      )}
    </div>
  );
}
