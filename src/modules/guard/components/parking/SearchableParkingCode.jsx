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
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const optionKey = (o) => o.id || o.code;

  const selected = useMemo(
    () => options.find((o) => optionKey(o) === value) || null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => {
      const hay =
        `${o.code || ''} ${o.slotCode || ''} ${o.vehicleNumber || ''} ${o.label || ''} ${o.status || ''}`.toLowerCase();
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
    if (!open) {
      setQuery('');
      setActiveIdx(0);
      return;
    }
    setActiveIdx(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open || !menuRef.current) return;
    const el = menuRef.current.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open, filtered]);

  function selectOption(opt) {
    onChange(opt);
    setOpen(false);
    setQuery('');
  }

  function clear(e) {
    e?.stopPropagation?.();
    onChange(null);
    setQuery('');
    setOpen(true);
  }

  function onKeyDown(e) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[activeIdx];
      if (opt) selectOption(opt);
    }
  }

  return (
    <label className={`gm-park-code-field ${open ? 'is-open' : ''}`} ref={rootRef}>
      <span className="gm-park-code-label">{label}</span>
      <div
        className={`gm-park-code-control ${open ? 'is-open' : ''} ${selected ? 'has-value' : ''}`}
        onKeyDown={onKeyDown}
      >
        {open ? (
          <input
            ref={inputRef}
            className="gm-park-code-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            autoComplete="off"
          />
        ) : (
          <button
            type="button"
            className="gm-park-code-trigger"
            onClick={() => setOpen(true)}
            onKeyDown={onKeyDown}
          >
            {selected ? (
              <span className="gm-park-code-selected">
                <strong>{selected.code || selected.slotCode}</strong>
                <em>{formatStatus(selected.status) || selected.vehicleNumber || 'Selected'}</em>
              </span>
            ) : (
              <span className="is-placeholder">{placeholder}</span>
            )}
          </button>
        )}
        {value ? (
          <button type="button" className="gm-park-code-clear" onClick={clear} aria-label="Clear">
            ×
          </button>
        ) : (
          <span className={`gm-park-code-chevron ${open ? 'is-open' : ''}`} aria-hidden>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        )}
      </div>

      {open ? (
        <ul className="gm-park-code-menu" role="listbox" ref={menuRef}>
          {filtered.length === 0 ? (
            <li className="gm-park-code-empty">{emptyText}</li>
          ) : (
            filtered.map((opt, idx) => {
              const key = optionKey(opt);
              const isActive = idx === activeIdx;
              return (
                <li key={key}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={key === value}
                    data-active={isActive ? 'true' : undefined}
                    className={`gm-park-code-option ${key === value ? 'is-active' : ''} ${
                      isActive ? 'is-focused' : ''
                    }`}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => selectOption(opt)}
                  >
                    <span className="gm-park-code-option-main">
                      <span className="gm-park-code-option-code">{opt.code || opt.slotCode}</span>
                      {opt.status ? (
                        <span className={`gm-park-code-tag gm-park-code-tag--${opt.status}`}>
                          {formatStatus(opt.status)}
                        </span>
                      ) : null}
                    </span>
                    <span className="gm-park-code-option-meta">
                      {opt.vehicleNumber
                        ? opt.vehicleNumber
                        : opt.kind === 'visitor'
                          ? 'Visitor parking'
                          : '—'}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </label>
  );
}

function formatStatus(status) {
  if (!status) return '';
  const s = String(status).toLowerCase();
  if (s === 'available') return 'Free';
  if (s === 'occupied') return 'Filled';
  if (s === 'inside') return 'Inside';
  if (s === 'outside') return 'Outside';
  return s.replace(/_/g, ' ');
}
