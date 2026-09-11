import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/common/crud.css';

export default function Pagination({
  page = 1,
  pageSize = 10,
  total = 0,
  totalPages = 1,
  hasNext = false,
  hasPrev = false,
  onPageChange,
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="crud-pagination">
      <span>
        {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
      </span>
      <div className="crud-pagination-btns">
        <button type="button" disabled={!hasPrev} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        <span style={{ padding: '6px 8px', color: 'var(--t2)' }}>
          Page {page} / {totalPages}
        </span>
        <button type="button" disabled={!hasNext} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
