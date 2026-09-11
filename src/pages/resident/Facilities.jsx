import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ListToolbar from '../../components/common/ListToolbar';
import Pagination from '../../components/common/Pagination';
import { useListQuery } from '../../hooks/useListQuery';
import { normalizePagination } from '../../utils/listQuery';
import {
  AMENITY_CATEGORIES,
  formatAmount,
  formatCategory,
  listResidentAmenities,
} from '../../services/facility.service';

export default function ResidentFacilitiesPage() {
  const navigate = useNavigate();
  const { state, params, setPage, setSearch, setFilter } = useListQuery({
    sortBy: 'name',
    sortOrder: 'asc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const finalParams = { ...params };
      if (state.category) finalParams.category = state.category;
      const { data } = await listResidentAmenities(finalParams);
      setRows(data.data?.facilities || data.data?.amenities || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load facilities');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.category]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { key: 'name', label: 'Facility' },
    { key: 'category', label: 'Category', render: (row) => formatCategory(row.category) },
    { key: 'location', label: 'Location', render: (row) => row.location || '-' },
    { key: 'capacity', label: 'Capacity' },
    {
      key: 'pricePerSlot',
      label: 'Price',
      render: (row) => (row.isPaid ? formatAmount(row.pricePerSlot) : 'Free'),
    },
    { key: 'nextAvailableSlot', label: 'Next slot', render: (row) => row.nextAvailableSlot || '-' },
  ];

  if (error && !rows.length && !loading) return <EmptyState title="Facilities unavailable" description={error} />;

  return (
    <div>
      <h1 className="resident-page-title">Facilities</h1>
      <p className="resident-page-subtitle">
        Browse society facilities, check availability, and create bookings.
      </p>
      {error && <p className="resident-error">{error}</p>}

      <ListToolbar
        search={state.search}
        onSearch={setSearch}
        searchPlaceholder="Search facilities"
        filters={[
          {
            key: 'category',
            label: 'Category',
            options: AMENITY_CATEGORIES.map((c) => ({ value: c, label: formatCategory(c) })),
          },
        ]}
        filterValues={state}
        onFilterChange={setFilter}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={(row) => navigate(`/resident/facilities/${row.id}`)}
        emptyTitle="No facilities found"
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
