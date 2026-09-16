import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Searchable single-select (Parking No / parking code style).
 * options: [{ id?, code, label, vehicleNumber?, kind?, status? }]
 * value matches option.id if present, otherwise option.code
 */
export default function SearchableParkingCode({
  label = 'Parking No',
  value,
  options = [],
  onChange,
  placeholder = 'Search Parking No…',
  emptyText = 'No matching Parking No',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const optionKey = (o) => o.id || o.code;

  const selected = useMemo(
    () => options.find((o) => optionKey(o) === value) || null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => {
      const hay = `${o.code || ''} ${o.slotCode || ''} ${o.vehicleNumber || ''} ${o.label || ''} ${o.status || ''}`.toLowerCase();
      return hay.includes(term);
    });
  }, [options, query]);

  useEffect(() => {
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  function selectOption(opt) {
    onChange(opt);
    setOpen(false);
    setQuery('');
  }

  function clear() {
    onChange(null);
    setQuery('');
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <label className="gm-park-code-field" ref={rootRef}>
      <span className="gm-park-code-label">{label}</span>
      <div className={`gm-park-code-control ${open ? 'is-open' : ''}`}>
        {open ? (
          <input
            ref={inputRef}
            className="gm-park-code-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="gm-park-code-trigger"
            onClick={() => setOpen(true)}
          >
            <span className={selected ? '' : 'is-placeholder'}>
              {selected ? selected.label || selected.code : placeholder}
            </span>
          </button>
        )}
        {value ? (
          <button type="button" className="gm-park-code-clear" onClick={clear} aria-label="Clear">
            ×
          </button>
        ) : (
          <span className="gm-park-code-chevron" aria-hidden>
            ▾
          </span>
        )}
      </div>

      {open && (
        <ul className="gm-park-code-menu" role="listbox">
          {filtered.length === 0 && (
            <li className="gm-park-code-empty">{emptyText}</li>
          )}
          {filtered.map((opt) => {
            const key = optionKey(opt);
            return (
              <li key={key}>
                <button
                  type="button"
                  className={`gm-park-code-option ${key === value ? 'is-active' : ''}`}
                  onClick={() => selectOption(opt)}
                >
                  <span className="gm-park-code-option-code">{opt.code || opt.slotCode}</span>
                  <span className="gm-park-code-option-meta">
                    {opt.vehicleNumber
                      ? opt.vehicleNumber
                      : opt.status
                        ? formatStatus(opt.status)
                        : '—'}
                    {opt.kind === 'visitor' ? ' · visitor' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </label>
  );
}

function formatStatus(status) {
  if (!status) return '';
  return String(status).replace(/_/g, ' ');
}
