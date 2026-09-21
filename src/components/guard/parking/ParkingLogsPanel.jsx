import { useEffect, useMemo, useRef, useState } from 'react';
import { SearchInput } from '@/components/common/index.js';
import GateDatePicker from '@/components/guard/shared/GateDatePicker.jsx';
import {
  dateRangeForPreset,
  formatLogWhen,
  resolveParkingLogs,
  summarizeLogs,
  withLogDurations,
} from '@/components/guard/parking/parkingLogsData.js';

const PAGE_SIZE = 10;

const ACTIVITY_OPTS = [
  { value: 'all', label: 'All Activity' },
  { value: 'entry', label: 'Entry' },
  { value: 'exit', label: 'Exit' },
];

const TYPE_OPTS = [
  { value: 'all', label: 'All Types' },
  { value: 'resident', label: 'Resident' },
  { value: 'visitor', label: 'Visitor' },
];

const DATE_OPTS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom Date' },
];

function FilterSelect({ value, onChange, options, ariaLabel }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) || options[0];
  const isFiltered = value !== options[0]?.value;

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="gm-plog-filter" ref={rootRef}>
      <button
        type="button"
        className={`gm-plog-filter-trigger${open ? ' is-open' : ''}${isFiltered ? ' is-filtered' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{selected?.label}</span>
        <svg className="gm-plog-filter-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <polyline
            points="6 9 12 15 18 9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <ul className="gm-plog-filter-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={active ? 'is-active' : undefined}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function EventBadge({ eventType }) {
  const isExit = eventType === 'exit';
  return (
    <span className={`gm-plog-event ${isExit ? 'gm-plog-event--exit' : 'gm-plog-event--entry'}`}>
      {isExit ? 'Exit' : 'Entry'}
    </span>
  );
}

function CategoryChip({ category }) {
  const isVisitor = category === 'visitor';
  return (
    <span className={`gm-plog-cat ${isVisitor ? 'gm-plog-cat--visitor' : 'gm-plog-cat--resident'}`}>
      {isVisitor ? 'Visitor' : 'Resident'}
    </span>
  );
}

function LogsSkeleton() {
  return (
    <div className="gm-plog" aria-busy="true">
      <div className="gm-plog-summary">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="gm-plog-stat gm-plog-skel-card" />
        ))}
      </div>
      <div className="gm-plog-toolbar gm-plog-skel-toolbar" />
      <div className="gm-plog-table-card">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="gm-plog-skel gm-plog-skel--row" />
        ))}
      </div>
    </div>
  );
}

function EmptyLogs({ filtered }) {
  return (
    <div className="gm-plog-empty">
      <div className="gm-plog-empty-icon" aria-hidden>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 8h10M7 12h6M7 16h8" />
        </svg>
      </div>
      <strong>{filtered ? 'No matching activity' : 'No parking activity yet'}</strong>
      <p>
        {filtered
          ? 'Try adjusting search or filters to find parking events.'
          : 'Vehicle entry and exit activity will appear here once the first parking event is recorded.'}
      </p>
    </div>
  );
}

/**
 * Read-only Parking Activity / Logs dashboard.
 * @param {{ localLogs?: object[] }} props
 */
export default function ParkingLogsPanel({ localLogs = [] }) {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activity, setActivity] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 280);
    return () => clearTimeout(t);
  }, [localLogs]);

  const baseLogs = useMemo(() => {
    const { logs } = resolveParkingLogs(localLogs);
    return withLogDurations(logs);
  }, [localLogs]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const { from, to } = dateRangeForPreset(datePreset, customFrom, customTo);

    return baseLogs.filter((log) => {
      const ts = new Date(log.timestamp).getTime();
      if (Number.isNaN(ts) || ts < from.getTime() || ts > to.getTime()) return false;
      if (activity !== 'all' && log.eventType !== activity) return false;
      if (typeFilter !== 'all' && log.category !== typeFilter) return false;
      if (!term) return true;
      const hay = [
        log.vehicleNumber,
        log.personName,
        log.flatNumber,
        log.parkingNumber,
        log.vehicleType,
        log.recordedBy,
        log.eventType,
        log.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    });
  }, [baseLogs, search, activity, typeFilter, datePreset, customFrom, customTo]);

  const summary = useMemo(() => summarizeLogs(baseLogs), [baseLogs]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const fromIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const toIdx = Math.min(safePage * PAGE_SIZE, filtered.length);
  const showDurationCol = typeFilter === 'visitor';

  useEffect(() => {
    setPage(1);
  }, [search, activity, typeFilter, datePreset, customFrom, customTo]);

  if (loading) return <LogsSkeleton />;

  return (
    <div className="gm-plog">
      <div className="gm-plog-summary">
        <div className="gm-plog-stat gm-plog-stat--entries">
          <strong>{summary.entries}</strong>
          <span className="gm-plog-stat-label">Total Entries</span>
          <em>Today</em>
        </div>
        <div className="gm-plog-stat gm-plog-stat--exits">
          <strong>{summary.exits}</strong>
          <span className="gm-plog-stat-label">Total Exits</span>
          <em>Today</em>
        </div>
        <div className="gm-plog-stat gm-plog-stat--resident">
          <strong>{summary.resident}</strong>
          <span className="gm-plog-stat-label">Resident Activity</span>
          <em>Entries + exits</em>
        </div>
        <div className="gm-plog-stat gm-plog-stat--visitor">
          <strong>{summary.visitor}</strong>
          <span className="gm-plog-stat-label">Visitor Activity</span>
          <em>Entries + exits</em>
        </div>
      </div>

      <div className={`gm-plog-toolbar${datePreset === 'custom' ? ' gm-plog-toolbar--custom' : ''}`}>
        <div className="gm-plog-search">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search vehicle, resident, visitor, flat or parking..."
            debounceMs={200}
          />
        </div>
        <div className="gm-plog-filters">
          <FilterSelect
            ariaLabel="Activity"
            value={activity}
            onChange={setActivity}
            options={ACTIVITY_OPTS}
          />
          <FilterSelect
            ariaLabel="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={TYPE_OPTS}
          />
          <FilterSelect
            ariaLabel="Date range"
            value={datePreset}
            onChange={setDatePreset}
            options={DATE_OPTS}
          />
          {datePreset === 'custom' ? (
            <div className="gm-plog-custom-dates" aria-label="Custom date range">
              <GateDatePicker
                value={customFrom}
                max={customTo || undefined}
                onChange={(next) => {
                  setCustomFrom(next);
                  if (customTo && next && next > customTo) setCustomTo(next);
                }}
              />
              <span className="gm-plog-custom-dates-arrow" aria-hidden>
                →
              </span>
              <GateDatePicker
                value={customTo}
                min={customFrom || undefined}
                onChange={(next) => {
                  if (customFrom && next && next < customFrom) setCustomTo(customFrom);
                  else setCustomTo(next);
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="gm-plog-table-card">
        <div className="gm-plog-table-head">
          <h4>Parking Activity</h4>
        </div>

        {filtered.length === 0 ? (
          <EmptyLogs filtered={baseLogs.length > 0} />
        ) : (
          <>
            <div className="gm-plog-table-wrap">
              <table className="gm-plog-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Vehicle</th>
                    <th>Person</th>
                    <th>Flat</th>
                    <th>Parking</th>
                    {showDurationCol ? <th>Duration</th> : null}
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <time dateTime={log.timestamp}>{formatLogWhen(log.timestamp)}</time>
                      </td>
                      <td>
                        <div className="gm-plog-type-cell">
                          <EventBadge eventType={log.eventType} />
                          <CategoryChip category={log.category} />
                        </div>
                      </td>
                      <td>
                        <div className="gm-plog-stack">
                          <strong>{log.vehicleNumber || '—'}</strong>
                          <span>{log.vehicleType || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="gm-plog-stack">
                          <strong>{log.personName || '—'}</strong>
                          <span>{log.category === 'visitor' ? 'Visitor' : 'Resident'}</span>
                        </div>
                      </td>
                      <td>
                        {log.flatNumber
                          ? log.category === 'visitor'
                            ? `Visiting ${log.flatNumber}`
                            : log.flatNumber
                          : '—'}
                      </td>
                      <td>
                        <strong className="gm-plog-parking">{log.parkingNumber || '—'}</strong>
                      </td>
                      {showDurationCol ? (
                        <td>
                          {log.eventType === 'exit' ? log.duration || '—' : '—'}
                        </td>
                      ) : null}
                      <td>{log.recordedBy || 'Guard'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="gm-plog-pager">
              <span>
                Showing {fromIdx}–{toIdx} of {filtered.length} logs
              </span>
              <div className="gm-plog-pager-btns">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, safePage - 3), Math.max(0, safePage - 3) + 4)
                  .map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={n === safePage ? 'is-active' : ''}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ))}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
