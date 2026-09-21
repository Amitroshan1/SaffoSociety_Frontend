import { useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import FilterBar from '@/components/common/FilterBar.jsx';
import SearchInput from '@/components/common/SearchInput.jsx';
import '@/styles/common/crud.css';

/**
 * Shared list toolbar: search + filters + Clear + small New action on the right.
 */
export default function ListToolbar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  filters = [],
  filterValues = {},
  onFilterChange,
  newLabel,
  onNew,
  filterChildren,
}) {
  const activeFilterCount = useMemo(() => {
    return filters.reduce((count, f) => {
      const value = filterValues[f.key];
      if (value === undefined || value === null || value === '' || value === f.defaultValue) {
        return count;
      }
      return count + 1;
    }, 0);
  }, [filters, filterValues]);

  const clearFilters = () => {
    filters.forEach((f) => onFilterChange?.(f.key, ''));
  };

  return (
    <div className="crud-toolbar">
      <SearchInput value={search} onChange={onSearch} placeholder={searchPlaceholder} />

      <div className="crud-toolbar-mid">
        {filters.length > 0 ? (
          <FilterBar filters={filters} values={filterValues} onChange={onFilterChange}>
            {filterChildren}
          </FilterBar>
        ) : null}

        {activeFilterCount > 0 ? (
          <button
            type="button"
            className="crud-btn-sm crud-btn-ghost"
            onClick={clearFilters}
            title="Clear filters"
          >
            <X size={13} strokeWidth={2} />
            Clear
          </button>
        ) : null}
      </div>

      {onNew ? (
        <div className="crud-toolbar-actions">
          <button type="button" className="btn-primary crud-btn-sm" onClick={onNew}>
            <Plus size={13} strokeWidth={2.5} />
            {newLabel || 'New'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
