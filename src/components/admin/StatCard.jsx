import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

function useCountUp(target, duration = 800, delay = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const t = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min(1, (ts - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setV(Math.round(target * eased));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);
  return v;
}

export function StatCard({
  label,
  value,
  prefix,
  icon: Icon,
  iconColor,
  accent,
  trend,
  delay = 0,
}) {
  const v = useCountUp(value, 900, delay);
  const TrendIcon = trend.dir === "up" ? TrendingUp : TrendingDown;
  const trendBg    = trend.dir === "up" ? "rgba(34,197,94,0.12)"  : "rgba(239,68,68,0.10)";
  const trendColor = trend.dir === "up" ? "#86efac"               : "#fca5a5";
  const trendBorder= trend.dir === "up" ? "rgba(34,197,94,0.18)"  : "rgba(239,68,68,0.18)";

  return (
    <div
      className="glass card-accent-top stat-card"
      style={{ borderTopColor: accent }}
    >
      <div className="stat-row">
        <span className="stat-label">{label}</span>
        <div
          className="stat-icon"
          style={{
            background: `${iconColor}1A`,
            border: `1px solid ${iconColor}33`,
            color: iconColor,
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      <div className="stat-value">
        {prefix}
        {v.toLocaleString()}
      </div>

      <div className="stat-foot">
        <span
          className="badge-base"
          style={{ background: trendBg, color: trendColor, borderColor: trendBorder }}
        >
          <TrendIcon size={11} />
          {trend.value}
        </span>
        <div className="spark">
          {[8, 12, 7, 16, 11].map((h, i) => (
            <span
              key={i}
              style={{
                height: h,
                background: i === 4 ? "#6366f1" : "rgba(99,102,241,0.3)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}