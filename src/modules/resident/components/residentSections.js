export const SECTIONS = {
  visitors: [
    { label: 'Pending', to: '/resident/visitors' },
    { label: 'Invite', to: '/resident/visitor-invitations' },
    { label: 'History', to: '/resident/visitor-history' },
  ],
  facilities: [
    { label: 'Book', to: '/resident/facilities' },
    { label: 'My Bookings', to: '/resident/bookings' },
  ],
};

export function tabMatches(pathname, to) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function sectionFor(pathname) {
  return Object.keys(SECTIONS).find((key) => SECTIONS[key].some((tab) => tabMatches(pathname, tab.to))) || null;
}

const PAGE_TITLES = [
  ['/resident/dashboard', 'Dashboard'],
  ['/resident/visitor-invitations', 'Visitors'],
  ['/resident/visitor-history', 'Visitors'],
  ['/resident/visitors', 'Visitors'],
  ['/resident/sos', 'SOS'],
  ['/resident/facilities', 'Facilities'],
  ['/resident/bookings', 'Facilities'],
  ['/resident/parking', 'Parking'],
  ['/resident/clearance', 'Move-out Clearance'],
  ['/resident/profile', 'My Profile'],
  ['/resident/notifications', 'Notifications'],
];

export function titleForPath(pathname) {
  const match = PAGE_TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match ? match[1] : 'Resident';
}
