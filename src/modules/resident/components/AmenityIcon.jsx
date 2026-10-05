const PATHS = {
  building: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V8l7-5 7 5v13" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  court: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M12 5v14" />
      <path d="M3 12h18" />
    </>
  ),
  pool: (
    <>
      <path d="M2 18c2 0 2-1.5 4-1.5S8 18 10 18s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
      <path d="M8 15V5a2 2 0 0 1 4 0" />
      <path d="M16 15V5a2 2 0 0 0-4 0" />
      <path d="M8 9h8" />
    </>
  ),
  gym: (
    <>
      <path d="M6 7v10" />
      <path d="M18 7v10" />
      <path d="M3 10v4" />
      <path d="M21 10v4" />
      <path d="M6 12h12" />
    </>
  ),
  default: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3 10h18" />
    </>
  ),
};

export function amenityKind(name) {
  const value = String(name || '').toLowerCase();
  if (/club|hall|community|party/.test(value)) return 'building';
  if (/tennis|badminton|court|squash/.test(value)) return 'court';
  if (/pool|swim/.test(value)) return 'pool';
  if (/gym|fitness/.test(value)) return 'gym';
  return 'default';
}

export default function AmenityIcon({ name }) {
  const kind = amenityKind(name);
  return (
    <span className={`res-amenity-icon res-amenity-icon--${kind}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {PATHS[kind]}
      </svg>
    </span>
  );
}
