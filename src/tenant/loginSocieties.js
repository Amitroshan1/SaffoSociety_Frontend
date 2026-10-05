/**
 * Temporary society list for the login picker.
 *
 * GET /societies requires an authenticated `societies:view` permission, so it
 * cannot be called before login. These entries use integer primary keys from
 * the backend, not mock slugs. Replace this module when a public search
 * endpoint exists.
 */
export const LOGIN_SOCIETIES = [
  { id: 1, name: 'Demo Society' },
];

export function societyById(id) {
  const societyId = Number(id);
  if (!Number.isInteger(societyId)) return null;
  return LOGIN_SOCIETIES.find((society) => society.id === societyId) || null;
}

export function societyByName(name) {
  const needle = String(name || '').trim().toLowerCase();
  if (!needle) return null;
  return LOGIN_SOCIETIES.find((society) => society.name.toLowerCase() === needle) || null;
}
