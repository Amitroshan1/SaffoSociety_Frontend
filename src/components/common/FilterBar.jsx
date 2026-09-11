import '../../styles/common/crud.css';

export default function FilterBar({ filters = [], values = {}, onChange, children }) {
  return (
    <div className="crud-filter-bar">
      {filters.map((f) => (
        <select
          key={f.key}
          className="crud-form-control"
          value={values[f.key] ?? f.defaultValue ?? ''}
          onChange={(e) => onChange(f.key, e.target.value === '' ? '' : e.target.value)}
          aria-label={f.label}
        >
          <option value="">{f.label}: All</option>
          {(f.options || []).map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {children}
    </div>
  );
}
