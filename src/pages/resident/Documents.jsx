import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import ListToolbar from '@/components/common/ListToolbar';
import Pagination from '@/components/common/Pagination';
import { useListQuery } from '@/hooks/useListQuery';
import { normalizePagination } from '@/utils/listQuery';
import {
  downloadResidentDocument,
  favoriteResidentDocument,
  formatFileSize,
  listResidentDocuments,
  openDownloadedFile,
} from '@/services/document.service';

export default function ResidentDocumentsPage() {
  const navigate = useNavigate();
  const { state, params, setPage, setSearch, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const finalParams = { ...params };
      if (state.favoritesOnly === 'true') finalParams.favoritesOnly = true;
      const res = await listResidentDocuments(finalParams);
      setRows(res.data?.data?.documents || []);
      setPagination(normalizePagination(res.data?.data));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [params, state.favoritesOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const onDownload = async (row) => {
    setBusyId(row.id);
    try {
      const { data } = await downloadResidentDocument(row.id);
      openDownloadedFile(data, row.fileUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Download failed');
    } finally {
      setBusyId(null);
    }
  };

  const onToggleFavorite = async (row) => {
    setBusyId(row.id);
    try {
      await favoriteResidentDocument(row.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update favorite');
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'scope', label: 'Scope' },
    { key: 'fileSizeBytes', label: 'Size', render: (row) => formatFileSize(row.fileSizeBytes) },
    {
      key: 'isFavorite',
      label: 'Favorite',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(row);
          }}
          disabled={busyId === row.id}
          className="resident-favorite-btn"
          aria-label={row.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {row.isFavorite ? '★' : '☆'}
        </button>
      ),
    },
    {
      key: 'download',
      label: 'Download',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDownload(row);
          }}
          disabled={busyId === row.id}
          className="resident-download-btn"
        >
          Download
        </button>
      ),
    },
  ];

  if (error && !rows.length) return <EmptyState title="Documents unavailable" description={error} />;

  return (
    <div>
      <h1 className="resident-page-title">Documents</h1>
      <p className="resident-page-subtitle">
        Society circulars, policies, and files shared with you.
      </p>

      {error && <p className="resident-error">{error}</p>}

      <ListToolbar
        search={state.search}
        onSearch={setSearch}
        searchPlaceholder="Search documents"
        filters={[
          {
            key: 'favoritesOnly',
            label: 'Favorites',
            options: [{ value: 'true', label: 'Favorites only' }],
          },
        ]}
        filterValues={state}
        onFilterChange={setFilter}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={(row) => navigate(`/resident/documents/${row.id}`)}
        emptyTitle="No documents available"
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
