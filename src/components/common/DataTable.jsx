import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import EmptyState from './EmptyState.jsx';
import SkeletonLoader from './SkeletonLoader.jsx';
import '../../styles/common/crud.css';

function SortIcon({ column, sortBy, sortOrder }) {
  if (sortBy !== column.key) return <ArrowUpDown size={12} style={{ opacity: 0.35 }} />;
  return sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
}

export default function DataTable({
  columns,
  rows = [],
  rowKey = 'id',
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting search or filters.',
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
}) {
  if (loading) {
    return <SkeletonLoader rows={5} />;
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="crud-table-wrap">
      <table className="crud-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.sortable ? 'sortable' : undefined}
                onClick={
                  col.sortable && onSort
                    ? () => {
                        const nextOrder =
                          sortBy === col.key && sortOrder === 'asc' ? 'desc' : 'asc';
                        onSort(col.key, nextOrder);
                      }
                    : undefined
                }
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {col.label}
                  {col.sortable && onSort && (
                    <SortIcon column={col} sortBy={sortBy} sortOrder={sortOrder} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
