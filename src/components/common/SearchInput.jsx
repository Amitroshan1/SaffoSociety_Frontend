import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import '@/styles/common/crud.css';

export default function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search…',
  debounceMs = 300,
  className = '',
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (debounceMs <= 0) {
      onChange?.(local);
      return undefined;
    }
    const timer = setTimeout(() => onChange?.(local), debounceMs);
    return () => clearTimeout(timer);
  }, [local, debounceMs, onChange]);

  return (
    <div className={`crud-search ${className}`}>
      <Search size={16} className="crud-search-icon" />
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
