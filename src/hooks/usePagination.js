import { useMemo, useState } from 'react';

export function usePagination(total = 0, pageSize = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return useMemo(
    () => ({ page, setPage, pageSize, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }),
    [page, pageSize, totalPages],
  );
}
