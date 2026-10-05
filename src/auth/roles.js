/** Backend role names mapped to the existing panel routes. */
const FRONTEND_ROLE_MAP = {
  security_guard: 'guard',
};

/** Roles this UI understands. Anything else is denied. */
export const KNOWN_FRONTEND_ROLES = new Set([
  'guard',
  'resident',
  'admin',
  'finance',
  'super_admin',
]);

/** Panel home for a confirmed backend role. There is no default panel. */
const PANEL_HOME = {
  guard: '/guard/dashboard',
  resident: '/resident/dashboard',
  admin: '/admin/dashboard',
  finance: '/finance/dashboard',
  super_admin: '/super-admin/dashboard',
};

const ROLE_TITLES = {
  guard: 'Guard',
  resident: 'Resident',
  admin: 'Admin',
  finance: 'Finance',
  super_admin: 'Super Admin',
};

export function toFrontendRole(role) {
  if (role == null || role === '') return '';
  const value = String(role);
  return FRONTEND_ROLE_MAP[value] || value;
}

export function isKnownRole(role) {
  return KNOWN_FRONTEND_ROLES.has(toFrontendRole(role));
}

export function homeForRole(role) {
  return PANEL_HOME[toFrontendRole(role)] || '/unauthorized';
}

export function roleTitle(role) {
  const normalized = toFrontendRole(role);
  return ROLE_TITLES[normalized] || normalized;
}
