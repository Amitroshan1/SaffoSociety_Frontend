import { useEffect, useMemo, useRef, useState } from 'react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toIsoKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoKey(iso) {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDisplay(iso, displayFormat = 'dmy') {
  if (!iso) return 'Select date';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return 'Select date';
  if (displayFormat === 'mdy') return `${m}/${d}/${y}`;
  return `${d}-${m}-${y}`;
}

function todayIso() {
  return toIsoKey(new Date());
}

function buildMonthDays(viewYear, viewMonth) {
  const first = new Date(viewYear, viewMonth, 1);
  const start = new Date(viewYear, viewMonth, 1 - first.getDay());
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      iso: toIsoKey(d),
      outside: d.getMonth() !== viewMonth,
    });
  }
  return days;
}

function decadeStart(year) {
  return Math.floor(year / 12) * 12;
}

function CalendarIcon() {
  return (
    <svg
      className="gdp-cal-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/**
 * Shared guard-module date picker — replaces native browser calendar UI.
 */
export default function GateDatePicker({
  label,
  value,
  onChange,
  min,
  max,
  className = '',
  allowClear = true,
  displayFormat = 'dmy',
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState('day'); // day | month | year
  const selected = parseIsoKey(value);
  const [viewYear, setViewYear] = useState(() => (selected || new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selected || new Date()).getMonth());

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (panel === 'year') setPanel('month');
      else if (panel === 'month') setPanel('day');
      else setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, panel]);

  useEffect(() => {
    if (!open) {
      setPanel('day');
      return;
    }
    const base = selected || new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setPanel('day');
  }, [open, value]);

  const days = useMemo(() => buildMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const yearBlockStart = decadeStart(viewYear);
  const years = useMemo(
    () => Array.from({ length: 12 }, (_, i) => yearBlockStart + i),
    [yearBlockStart],
  );

  const isDisabled = (iso) => {
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  };

  const shiftView = (delta) => {
    if (panel === 'year') {
      setViewYear((y) => y + delta * 12);
      return;
    }
    if (panel === 'month') {
      setViewYear((y) => y + delta);
      return;
    }
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const pick = (iso) => {
    if (isDisabled(iso)) return;
    onChange?.(iso);
    setOpen(false);
  };

  const handleToday = () => {
    let iso = todayIso();
    if (min && iso < min) iso = min;
    if (max && iso > max) iso = max;
    if (!isDisabled(iso)) {
      onChange?.(iso);
      setOpen(false);
    }
  };

  const handleClear = () => {
    if (!allowClear) return;
    onChange?.('');
    setOpen(false);
  };

  const advancePanel = () => {
    if (panel === 'day') setPanel('month');
    else if (panel === 'month') setPanel('year');
  };

  const titleLabel =
    panel === 'year'
      ? `${yearBlockStart} – ${yearBlockStart + 11}`
      : panel === 'month'
        ? String(viewYear)
        : `${MONTHS[viewMonth]} ${viewYear}`;

  const titleAria =
    panel === 'year'
      ? 'Year range'
      : panel === 'month'
        ? 'Select year'
        : 'Select month and year';

  const navPrevLabel = panel === 'year' ? 'Previous years' : panel === 'month' ? 'Previous year' : 'Previous month';
  const navNextLabel = panel === 'year' ? 'Next years' : panel === 'month' ? 'Next year' : 'Next month';

  const today = todayIso();
  const now = new Date();

  return (
    <div className={`gdp-root${open ? ' gdp-root--open' : ''}${className ? ` ${className}` : ''}`} ref={rootRef}>
      <button
        type="button"
        className="gdp-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        {label ? <span className="gdp-trigger-label">{label}</span> : null}
        <span className="gdp-trigger-value">{formatDisplay(value, displayFormat)}</span>
        <CalendarIcon />
      </button>

      {open ? (
        <div className="gdp-popover" role="dialog" aria-label={label ? `${label} calendar` : 'Calendar'}>
          <div className="gdp-head">
            <button type="button" className="gdp-nav" aria-label={navPrevLabel} onClick={() => shiftView(-1)}>
              ‹
            </button>
            <button
              type="button"
              className={`gdp-title${panel !== 'year' ? ' gdp-title--btn' : ''}`}
              aria-label={titleAria}
              disabled={panel === 'year'}
              onClick={advancePanel}
            >
              <span>{titleLabel}</span>
              {panel !== 'year' ? <span className="gdp-title-chevron" aria-hidden>▾</span> : null}
            </button>
            <button type="button" className="gdp-nav" aria-label={navNextLabel} onClick={() => shiftView(1)}>
              ›
            </button>
          </div>

          {panel === 'day' ? (
            <>
              <div className="gdp-weekdays">
                {WEEKDAYS.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>

              <div className="gdp-grid">
                {days.map((cell) => {
                  const disabled = isDisabled(cell.iso);
                  const isSelected = value && cell.iso === value;
                  const isToday = cell.iso === today;
                  return (
                    <button
                      key={`${cell.iso}-${cell.outside ? 'o' : 'i'}`}
                      type="button"
                      className={[
                        'gdp-day',
                        cell.outside ? 'gdp-day--outside' : '',
                        isSelected ? 'gdp-day--selected' : '',
                        isToday && !isSelected ? 'gdp-day--today' : '',
                        disabled ? 'gdp-day--disabled' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      disabled={disabled}
                      onClick={() => pick(cell.iso)}
                    >
                      {Number(cell.iso.slice(8, 10))}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {panel === 'month' ? (
            <div className="gdp-picker-grid" role="listbox" aria-label="Select month">
              {MONTHS_SHORT.map((name, idx) => {
                const isSelected = viewMonth === idx && selected?.getFullYear() === viewYear;
                const isCurrent = now.getFullYear() === viewYear && now.getMonth() === idx;
                return (
                  <button
                    key={name}
                    type="button"
                    role="option"
                    aria-selected={viewMonth === idx}
                    className={[
                      'gdp-picker-cell',
                      viewMonth === idx ? 'gdp-picker-cell--active' : '',
                      isSelected ? 'gdp-picker-cell--selected' : '',
                      isCurrent && !isSelected ? 'gdp-picker-cell--today' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      setViewMonth(idx);
                      setPanel('day');
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          ) : null}

          {panel === 'year' ? (
            <div className="gdp-picker-grid" role="listbox" aria-label="Select year">
              {years.map((y) => {
                const isSelected = selected?.getFullYear() === y;
                const isCurrent = now.getFullYear() === y;
                return (
                  <button
                    key={y}
                    type="button"
                    role="option"
                    aria-selected={viewYear === y}
                    className={[
                      'gdp-picker-cell',
                      viewYear === y ? 'gdp-picker-cell--active' : '',
                      isSelected ? 'gdp-picker-cell--selected' : '',
                      isCurrent && !isSelected ? 'gdp-picker-cell--today' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      setViewYear(y);
                      setPanel('month');
                    }}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="gdp-foot">
            {allowClear ? (
              <button type="button" className="gdp-foot-btn gdp-foot-btn--muted" onClick={handleClear}>
                Clear
              </button>
            ) : (
              <span />
            )}
            <button type="button" className="gdp-foot-btn gdp-foot-btn--primary" onClick={handleToday}>
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
