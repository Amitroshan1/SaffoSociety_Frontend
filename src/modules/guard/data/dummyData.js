/** Shared dummy seed data for Guard module — replace via real API later. */

export const DUMMY_GUARD_PROFILE = {
  id: 'g-001',
  name: 'Ravi Kumar',
  email: 'guard@society.com',
  phone: '+91 98765 43210',
  role: 'security_guard',
  gate: 'Main Gate',
  shift: 'Morning (06:00 – 14:00)',
  societyName: 'Saffo Residency',
  employeeId: 'GRD-1024',
  joinedAt: '2024-03-12',
};

export const DUMMY_DASHBOARD = {
  stats: {
    todaysVisitorCount: 42,
    pendingApprovalsCount: 5,
    visitorsInsideCount: 8,
    deliveriesPending: 3,
    staffInsideCount: 6,
    sosActiveCount: 0,
  },
  pending: [
    { id: 'v-101', name: 'Amit Shah', flat: 'A-302', purpose: 'Guest', phone: '98XXXX1101', wait: '4m', time: '10:12 AM' },
    { id: 'v-102', name: 'Neha Patel', flat: 'B-114', purpose: 'Vendor', phone: '98XXXX2202', wait: '9m', time: '10:05 AM' },
    { id: 'v-103', name: 'Kabir Singh', flat: 'C-501', purpose: 'Guest', phone: '98XXXX3303', wait: '2m', time: '10:18 AM' },
  ],
  inside: [
    { id: 'v-201', name: 'Priya Mehta', flat: 'A-101', purpose: 'Guest', duration: '35m', time: '09:40 AM' },
    { id: 'v-202', name: 'Rohan Das', flat: 'B-220', purpose: 'Vendor', duration: '1h 10m', time: '09:05 AM' },
  ],
  deliveries: [
    { id: 'd-01', courier: 'Amazon', flat: 'A-402', status: 'pending', time: '09:55 AM' },
    { id: 'd-02', courier: 'Flipkart', flat: 'C-118', status: 'pending', time: '09:30 AM' },
  ],
  staffInside: [
    { id: 's-01', name: 'Sunita Devi', role: 'Housekeeping', flat: 'Tower A', inAt: '07:10 AM' },
    { id: 's-02', name: 'Manoj Yadav', role: 'Electrician', flat: 'B-210', inAt: '08:45 AM' },
  ],
  activity: [
    { id: 'a-1', text: 'Visitor Amit Shah pending approval for A-302', time: '10:12 AM', type: 'visitor' },
    { id: 'a-2', text: 'Parcel collected for C-118', time: '09:48 AM', type: 'delivery' },
    { id: 'a-3', text: 'Staff Sunita Devi checked in', time: '07:10 AM', type: 'staff' },
  ],
  sos: [
    { id: 'sos-1', flat: 'B-804', resident: 'Ananya Rao', message: 'Medical help needed', status: 'resolved', raisedAt: '10:01 AM' },
  ],
};

export const DUMMY_VISITORS = [
  { id: 'v-101', name: 'Amit Shah', flat: 'A-302', purpose: 'Guest', phone: '9876511011', status: 'pending', persons: 2, vehicle: '', time: '10:12 AM', createdAt: '2026-09-22T10:12:00' },
  { id: 'v-102', name: 'Neha Patel', flat: 'B-114', purpose: 'Vendor', phone: '9876522022', status: 'pending', persons: 1, vehicle: 'MH12 AB 1234', time: '10:05 AM', createdAt: '2026-09-22T10:05:00' },
  { id: 'v-103', name: 'Kabir Singh', flat: 'C-501', purpose: 'Guest', phone: '9876533033', status: 'pending', persons: 1, vehicle: 'MH14 CD 7788', time: '10:18 AM', createdAt: '2026-09-22T10:18:00' },
  { id: 'v-201', name: 'Priya Mehta', flat: 'A-101', purpose: 'Guest', phone: '9876544044', status: 'approved', persons: 3, vehicle: '', time: '09:40 AM', createdAt: '2026-09-22T09:40:00' },
  { id: 'v-202', name: 'Rohan Das', flat: 'B-220', purpose: 'Vendor', phone: '9876555055', status: 'approved', persons: 1, vehicle: '', time: '09:05 AM', createdAt: '2026-09-22T09:05:00' },
  { id: 'v-301', name: 'Suresh Nair', flat: 'D-012', purpose: 'Guest', phone: '9876566066', status: 'exited', persons: 1, vehicle: '', time: '08:20 AM', createdAt: '2026-09-22T08:20:00' },
  { id: 'v-302', name: 'Unknown Caller', flat: 'A-210', purpose: 'Guest', phone: '9876577077', status: 'rejected', persons: 1, vehicle: '', time: '08:05 AM', createdAt: '2026-09-22T08:05:00' },
];

export const DUMMY_DELIVERIES = [
  { id: 'd-01', courier: 'Amazon', flat: 'A-402', resident: 'Kavita Jain', trackingId: 'AMZ-9912', status: 'pending', time: '09:55 AM' },
  { id: 'd-02', courier: 'Flipkart', flat: 'C-118', resident: 'Imran Khan', trackingId: 'FK-4410', status: 'pending', time: '09:30 AM' },
  { id: 'd-03', courier: 'Blinkit', flat: 'B-303', resident: 'Meera Shah', trackingId: 'BL-2201', status: 'collected', time: '08:50 AM' },
];

export const DUMMY_STAFF_ENTRIES = [
  { id: 'se-01', name: 'Sunita Devi', role: 'Housekeeping', flat: 'Tower A', phone: '9800011111', status: 'in', inAt: '07:10 AM', outAt: null },
  { id: 'se-02', name: 'Manoj Yadav', role: 'Electrician', flat: 'B-210', phone: '9800022222', status: 'in', inAt: '08:45 AM', outAt: null },
  { id: 'se-03', name: 'Ramesh Lal', role: 'Plumber', flat: 'C-090', phone: '9800033333', status: 'out', inAt: '07:00 AM', outAt: '09:15 AM' },
  { id: 'se-04', name: 'OT Worker', role: 'Painter', flat: 'A-118', phone: '9800044444', status: 'pending', inAt: null, outAt: null },
];

export const DUMMY_CAB_ENTRIES = [
  { id: 'c-01', driver: 'Ajay Verma', vehicle: 'MH12 XY 4455', company: 'Uber', flat: 'A-302', tripType: 'Pickup', status: 'pending', time: '10:20 AM' },
  { id: 'c-02', driver: 'Vikas More', vehicle: 'MH14 ZZ 1122', company: 'Ola', flat: 'B-501', tripType: 'Drop', status: 'approved', time: '09:50 AM' },
  { id: 'c-03', driver: 'Local Cab', vehicle: 'MH01 AA 0099', company: 'Local', flat: 'C-210', tripType: 'Pickup', status: 'exited', time: '08:40 AM' },
];

export const DUMMY_SCHEDULE = {
  today: {
    date: '2026-09-22',
    shiftName: 'Morning Shift',
    gate: 'Main Gate',
    start: '06:00',
    end: '14:00',
    status: 'on_duty',
    punchedInAt: '05:55 AM',
  },
  upcoming: [
    { id: 'sh-2', date: '2026-09-23', shiftName: 'Morning Shift', gate: 'Main Gate', start: '06:00', end: '14:00' },
    { id: 'sh-3', date: '2026-09-24', shiftName: 'Evening Shift', gate: 'East Gate', start: '14:00', end: '22:00' },
  ],
  attendance: [
    { date: '2026-09-21', status: 'present', inAt: '05:58', outAt: '14:02' },
    { date: '2026-09-20', status: 'present', inAt: '06:01', outAt: '14:05' },
    { date: '2026-09-19', status: 'leave', inAt: null, outAt: null },
  ],
};

export const DUMMY_DOCUMENTS = [
  { id: 'doc-1', title: 'Society Rules 2026', category: 'Policy', flat: '—', uploadedAt: '2026-09-01', status: 'active' },
  { id: 'doc-2', title: 'Visitor SOP', category: 'SOP', flat: '—', uploadedAt: '2026-08-12', status: 'active' },
  { id: 'doc-3', title: 'Parking Guidelines', category: 'Policy', flat: '—', uploadedAt: '2026-07-20', status: 'active' },
];

export const DUMMY_BOOKINGS = [
  { id: 'bk-1', code: 'BK-1001', facility: 'Clubhouse', flat: 'A-101', resident: 'Priya Mehta', date: '2026-09-22', slot: '4–6 PM', status: 'approved' },
  { id: 'bk-2', code: 'BK-1002', facility: 'Banquet Hall', flat: 'B-220', resident: 'Rohan Das', date: '2026-09-23', slot: '6–10 PM', status: 'confirmed' },
  { id: 'bk-3', code: 'BK-1003', facility: 'Tennis Court', flat: 'C-501', resident: 'Kabir Singh', date: '2026-09-22', slot: '7–8 AM', status: 'checked_in' },
];

export const DUMMY_PARKING = {
  slots: [
    { id: 'p-1', slotCode: 'R-B1-01', category: 'resident', status: 'occupied', vehicle: 'MH12 AB 1111', flat: 'A-101' },
    { id: 'p-2', slotCode: 'R-B1-02', category: 'resident', status: 'available', vehicle: null, flat: 'A-102' },
    { id: 'p-3', slotCode: 'V-01', category: 'visitor', status: 'occupied', vehicle: 'MH14 CD 7788', flat: 'C-501' },
    { id: 'p-4', slotCode: 'V-02', category: 'visitor', status: 'available', vehicle: null, flat: null },
  ],
  logs: [
    { id: 'pl-1', slotCode: 'V-01', vehicle: 'MH14 CD 7788', action: 'entry', time: '10:18 AM', by: 'Ravi Kumar' },
    { id: 'pl-2', slotCode: 'R-B1-01', vehicle: 'MH12 AB 1111', action: 'entry', time: '08:02 AM', by: 'System' },
  ],
};

export const DUMMY_NOTIFICATIONS = [
  { id: 'n-1', title: 'SOS raised at B-804', body: 'Medical help requested by Ananya Rao', read: false, time: '10:01 AM', type: 'sos' },
  { id: 'n-2', title: 'Visitor waiting', body: 'Amit Shah pending for A-302', read: false, time: '10:12 AM', type: 'visitor' },
  { id: 'n-3', title: 'Shift reminder', body: 'Tomorrow evening shift at East Gate', read: true, time: 'Yesterday', type: 'schedule' },
];

export const DUMMY_FLATS = [
  { id: 'f-1', label: 'A-101', resident: 'Priya Mehta' },
  { id: 'f-2', label: 'A-302', resident: 'Vikram Shah' },
  { id: 'f-3', label: 'B-114', resident: 'Neha Family' },
  { id: 'f-4', label: 'B-220', resident: 'Rohan Das' },
  { id: 'f-5', label: 'C-501', resident: 'Kabir Singh' },
];
