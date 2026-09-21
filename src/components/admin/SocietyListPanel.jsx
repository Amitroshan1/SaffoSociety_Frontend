import { useCallback, useEffect, useState } from 'react';
import {
  DataTable,
  ListToolbar,
  Pagination,
} from '@/components/common/index.js';
import { useListQuery } from '@/hooks/useListQuery.js';
import { listSocieties } from '@/services/society.service.js';
import { normalizePagination } from '@/utils/listQuery.js';
import '@/styles/common/crud.css';

const STATUS_FILTER = {
  key: 'isActive',
  label: 'Status',
  options: [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ],
};

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'code', label: 'Code', sortable: true },
  { key: 'city', label: 'City', sortable: true },
  {
    key: 'isActive',
    label: 'Status',
    render: (row) => (
      <span className={`crud-badge ${row.isActive ? 'crud-badge-active' : 'crud-badge-inactive'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

export default function SocietyListPanel({ onSelect, onCreate }) {
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'name',
    sortOrder: 'asc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const apiParams = { ...params };
      if (apiParams.isActive === 'true') apiParams.isActive = true;
      else if (apiParams.isActive === 'false') apiParams.isActive = false;
      else delete apiParams.isActive;

      const res = await listSocieties(apiParams);
      const data = res.data?.data ?? res.data;
      setRows(data.societies ?? []);
      setPagination(normalizePagination(data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load societies');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <div style={{ marginBottom: 24 }}>
      <ListToolbar
        search={state.search}
        onSearch={setSearch}
        searchPlaceholder="Search societies…"
        filters={[STATUS_FILTER]}
        filterValues={state}
        onFilterChange={setFilter}
        newLabel="New Society"
        onNew={onCreate}
      />

      {error && (
        <p style={{ color: '#f87171', fontSize: 14, marginBottom: 12 }}>{error}</p>
      )}

      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey="id"
        loading={loading}
        sortBy={state.sortBy}
        sortOrder={state.sortOrder}
        onSort={setSort}
        onRowClick={onSelect}
        emptyTitle="No societies found"
      />

      {pagination && !loading && (
        <Pagination
          {...pagination}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
