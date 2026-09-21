import '@/styles/common/crud.css';

/** Generic color-coded status pill. Pass a `colors` map of status -> hex color. */
export default function StatusBadge({ status, colors = {}, fallbackColor = '#94a3b8' }) {
  const color = colors[status] || fallbackColor;
  return (
    <span
      className="crud-badge"
      style={{ background: `${color}26`, color }}
    >
      {String(status || '-').replace(/_/g, ' ')}
    </span>
  );
}
