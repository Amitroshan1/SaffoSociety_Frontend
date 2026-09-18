import { useEffect, useMemo, useState } from 'react';

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

/** dayMarks[iso] = present | absent | scheduled */
export default function ScheduleMonthCalendar({ value, onChange, dayMarks = {}, todayIso }) {
  const selected = parseIsoKey(value);
  const [panel, setPanel] = useState('day'); // day | month | year
  const [viewYear, setViewYear] = useState(() => (selected || new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selected || new Date()).getMonth());

  useEffect(() => {
    if (!selected) return;
    setViewYear(selected.getFullYear());
    setViewMonth(selected.getMonth());
    setPanel('day');
  }, [value]);

  const days = useMemo(() => buildMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const yearBlockStart = decadeStart(viewYear);
  const years = useMemo(
    () => Array.from({ length: 12 }, (_, i) => yearBlockStart + i),
    [yearBlockStart],
  );

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

  const now = new Date();

  return (
    <div className="gm-sched-cal glass-card" role="group" aria-label="Attendance calendar">
      <div className="gm-sched-cal-head">
        <button type="button" className="gm-sched-cal-nav" aria-label={navPrevLabel} onClick={() => shiftView(-1)}>
          ‹
        </button>
        <button
          type="button"
          className={`gm-sched-cal-title${panel !== 'year' ? ' gm-sched-cal-title--btn' : ''}`}
          aria-label={titleAria}
          disabled={panel === 'year'}
          onClick={advancePanel}
        >
          <span>{titleLabel}</span>
          {panel !== 'year' ? <span className="gm-sched-cal-title-chevron" aria-hidden>▾</span> : null}
        </button>
        <button type="button" className="gm-sched-cal-nav" aria-label={navNextLabel} onClick={() => shiftView(1)}>
          ›
        </button>
      </div>

      {panel === 'day' ? (
        <>
          <div className="gm-sched-cal-weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="gm-sched-cal-grid">
            {days.map((cell) => {
              const mark = dayMarks[cell.iso];
              const isSelected = value && cell.iso === value;
              const isToday = todayIso && cell.iso === todayIso;
              return (
                <button
                  key={`${cell.iso}-${cell.outside ? 'o' : 'i'}`}
                  type="button"
                  className={[
                    'gm-sched-cal-day',
                    cell.outside ? 'gm-sched-cal-day--outside' : '',
                    isSelected ? 'gm-sched-cal-day--selected' : '',
                    isToday && !isSelected ? 'gm-sched-cal-day--today' : '',
                    mark ? `gm-sched-cal-day--${mark}` : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onChange?.(cell.iso)}
                >
                  <span className="gm-sched-cal-num">{Number(cell.iso.slice(8, 10))}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {panel === 'month' ? (
        <div className="gm-sched-cal-picker" role="listbox" aria-label="Select month">
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
                  'gm-sched-cal-picker-cell',
                  viewMonth === idx ? 'gm-sched-cal-picker-cell--active' : '',
                  isSelected ? 'gm-sched-cal-picker-cell--selected' : '',
                  isCurrent && !isSelected ? 'gm-sched-cal-picker-cell--today' : '',
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
        <div className="gm-sched-cal-picker" role="listbox" aria-label="Select year">
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
                  'gm-sched-cal-picker-cell',
                  viewYear === y ? 'gm-sched-cal-picker-cell--active' : '',
                  isSelected ? 'gm-sched-cal-picker-cell--selected' : '',
                  isCurrent && !isSelected ? 'gm-sched-cal-picker-cell--today' : '',
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

      <div className="gm-sched-cal-legend">
        <span>
          <i className="gm-sched-dot gm-sched-dot--present" /> Present
        </span>
        <span>
          <i className="gm-sched-dot gm-sched-dot--absent" /> Absent
        </span>
        <span>
          <i className="gm-sched-dot gm-sched-dot--scheduled" /> Shift only
        </span>
      </div>
    </div>
  );
}
