import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import ListToolbar from '@/components/common/ListToolbar';
import Pagination from '@/components/common/Pagination';
import NoticeTabs from '@/components/resident/NoticeTabs';
import { buildNoticeColumns } from '@/components/resident/noticeUi';
import { useListQuery } from '@/hooks/useListQuery';
import { normalizePagination } from '@/utils/listQuery';
import { getResidentArchivedNotices } from '@/services/notice.service';

const columns = buildNoticeColumns({ dateKey: 'expiresAt', dateLabel: 'Expired / archived' });

export default function ResidentNoticeArchivePage() {
  const navigate = useNavigate();
  const { state, params, setPage, setSearch } = useListQuery({
    sortBy: 'publish_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getResidentArchivedNotices(params)
      .then((res) => {
        if (!mounted) return;
        setRows(res.data?.data?.notices || []);
        setPagination(normalizePagination(res.data?.data));
        setError('');
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.message || 'Failed to fetch archived notices');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return (
    <div className="resident-notices">
      <h1 className="resident-page-title">Notice Archive</h1>
      <p className="resident-page-subtitle">Expired and archived notices.</p>

      <NoticeTabs />

      {error && <p className="resident-error">{error}</p>}

      <ListToolbar
        search={state.search}
        onSearch={setSearch}
        searchPlaceholder="Search archived notices"
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={(row) => navigate(`/resident/notices/${row.id}`)}
        emptyTitle="Nothing archived yet"
        emptyDescription="Expired and archived notices will show up here."
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
