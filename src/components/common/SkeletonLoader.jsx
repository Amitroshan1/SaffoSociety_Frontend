import '../../styles/common/crud.css';

export default function SkeletonLoader({ rows = 5 }) {
  return (
    <div className="crud-skeleton" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="crud-skeleton-row" />
      ))}
    </div>
  );
}
