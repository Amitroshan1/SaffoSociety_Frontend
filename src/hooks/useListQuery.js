import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_LIST_STATE, toListParams } from '../utils/listQuery';

export function useListQuery(initial = {}) {
  const [state, setState] = useState({ ...DEFAULT_LIST_STATE, ...initial });

  const params = useMemo(() => toListParams(state), [state]);

  const setPage = useCallback((page) => {
    setState((s) => ({ ...s, page }));
  }, []);

  const setSearch = useCallback((search) => {
    setState((s) => ({ ...s, search, page: 1 }));
  }, []);

  const setSort = useCallback((sortBy, sortOrder) => {
    setState((s) => ({ ...s, sortBy, sortOrder, page: 1 }));
  }, []);

  const setFilter = useCallback((key, value) => {
    setState((s) => ({ ...s, [key]: value, page: 1 }));
  }, []);

  const reset = useCallback(() => {
    setState({ ...DEFAULT_LIST_STATE, ...initial });
  }, [initial]);

  return {
    state,
    params,
    setPage,
    setSearch,
    setSort,
    setFilter,
    setState,
    reset,
  };
}
