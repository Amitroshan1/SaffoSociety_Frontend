/** Simple SVG chart helpers for analytics (no extra chart library). */

export function BarChart({
  series = [],
  height = 220,
  color = '#2563eb',
  labelColor = 'currentColor',
}) {
  const values = series.map((s) => Number(s.value) || 0);
  const max = Math.max(...values, 1);
  const n = Math.max(series.length, 1);
  const gap = 16;
  const padX = 28;
  const padTop = 28;
  const padBottom = 36;
  const plotH = height - padTop - padBottom;
  const width = Math.max(360, n * 64 + padX * 2);
  const barW = Math.min(48, Math.max(22, (width - padX * 2) / n - gap));

  if (!series.length) {
    return (
      <div className="gm-chart-empty" style={{ height }}>
        No chart data for today
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      className="gm-bar-chart"
    >
      {[0.25, 0.5, 0.75, 1].map((t) => {
        const y = padTop + plotH * (1 - t);
        return (
          <line
            key={t}
            x1={padX}
            x2={width - padX}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeOpacity="0.08"
          />
        );
      })}
      {series.map((s, i) => {
        const val = Number(s.value) || 0;
        const h = (val / max) * plotH;
        const x = padX + i * (barW + gap) + gap / 2;
        const y = padTop + plotH - h;
        const label = (s.label || '').toString();
        return (
          <g key={`${label}-${i}`}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 2)} rx={6} fill={color} />
            <text
              x={x + barW / 2}
              y={y - 8}
              textAnchor="middle"
              fill={labelColor}
              fontSize="11"
              fontWeight="600"
              opacity="0.85"
            >
              {val}
            </text>
            <text
              x={x + barW / 2}
              y={height - 12}
              textAnchor="middle"
              fill={labelColor}
              fontSize="11"
              opacity="0.55"
            >
              {label.length > 10 ? `${label.slice(0, 9)}…` : label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ series = [], height = 180, color = '#22d3ee' }) {
  const max = Math.max(...series.map((s) => Number(s.value) || 0), 1);
  const width = 360;
  const pts = series.map((s, i) => {
    const x = series.length <= 1 ? width / 2 : (i / (series.length - 1)) * (width - 20) + 10;
    const y = height - 24 - ((Number(s.value) || 0) / max) * (height - 40);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img">
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={pts.join(' ')} />
      {series.map((s, i) => {
        const x = series.length <= 1 ? width / 2 : (i / (series.length - 1)) * (width - 20) + 10;
        const y = height - 24 - ((Number(s.value) || 0) / max) * (height - 40);
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}

export function PieChart({ series = [], size = 160 }) {
  const total = series.reduce((a, s) => a + (Number(s.value) || 0), 0) || 1;
  const colors = ['#6366f1', '#22d3ee', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];
  let angle = -90;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const slices = series.map((s, i) => {
    const value = Number(s.value) || 0;
    const sweep = (value / total) * 360;
    const start = angle;
    angle += sweep;
    const large = sweep > 180 ? 1 : 0;
    const rad = (d) => (Math.PI / 180) * d;
    const x1 = cx + r * Math.cos(rad(start));
    const y1 = cy + r * Math.sin(rad(start));
    const x2 = cx + r * Math.cos(rad(start + sweep));
    const y2 = cy + r * Math.sin(rad(start + sweep));
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return <path key={i} d={d} fill={colors[i % colors.length]} opacity={0.9} />;
  });
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices}
      </svg>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 13 }}>
        {series.map((s, i) => (
          <li key={i} style={{ marginBottom: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: colors[i % colors.length],
                display: 'inline-block',
              }}
            />
            {s.label}: {s.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function KpiCard({ label, value, unit, delta }) {
  return (
    <div className="crud-stat-card">
      <span className="crud-stat-label">{label}</span>
      <strong>
        {unit === 'minor_currency' ? `₹ ${(Number(value || 0) / 100).toFixed(2)}` : value ?? 0}
        {unit === 'percent' ? '%' : ''}
      </strong>
      {delta != null && (
        <div style={{ fontSize: 12, color: Number(delta) >= 0 ? '#86efac' : '#fca5a5', marginTop: 4 }}>
          {Number(delta) >= 0 ? '+' : ''}
          {delta}
        </div>
      )}
    </div>
  );
}
