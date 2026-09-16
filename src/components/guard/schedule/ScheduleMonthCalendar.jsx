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

/** dayMarks[iso] = present | absent | scheduled */
export default function ScheduleMonthCalendar({ value, onChange, dayMarks = {}, todayIso }) {
  const selected = parseIsoKey(value);
  const [viewYear, setViewYear] = useState(() => (selected || new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selected || new Date()).getMonth());

  useEffect(() => {
    if (!selected) return;
    setViewYear(selected.getFullYear());
    setViewMonth(selected.getMonth());
  }, [value]);

  const days = useMemo(() => buildMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const shiftMonth = (delta) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  return (
    <div className="gm-sched-cal glass-card" role="group" aria-label="Attendance calendar">
      <div className="gm-sched-cal-head">
        <button type="button" className="gm-sched-cal-nav" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
          ‹
        </button>
        <span className="gm-sched-cal-title">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button type="button" className="gm-sched-cal-nav" aria-label="Next month" onClick={() => shiftMonth(1)}>
          ›
        </button>
      </div>
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
