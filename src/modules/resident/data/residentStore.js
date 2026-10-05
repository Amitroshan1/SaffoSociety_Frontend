/**
 * In-memory resident gate data. Same visit story the guard sees for flat A-101.
 * Dummy mode only. Real mode uses the documented HTTP calls.
 */
import { GATE_NOTE_CATEGORIES } from '@/modules/resident/constants/endpoints';

const clone = (value) => JSON.parse(JSON.stringify(value));

function mockPhoto(bg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" fill="${bg}"/><circle cx="120" cy="96" r="44" fill="#ffffff" opacity="0.85"/><path d="M40 232c8-52 44-80 80-80s72 28 80 80z" fill="#ffffff" opacity="0.85"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const profile = {
  id: 'res-1',
  role: 'resident',
  name: 'Kavita Jain',
  email: 'kavita@saffo.test',
  phone: '9876500101',
  emergencyName: 'Rohit Jain',
  emergencyPhone: '9876500199',
};

const flat = {
  society: 'Saffo Heights',
  building: 'Tower A',
  wing: 'A',
  flatNo: 'A-101',
  occupancyRole: 'Owner',
};

const household = [
  { id: 'h1', name: 'Kavita Jain', role: 'Owner' },
  { id: 'h2', name: 'Rohit Jain', role: 'Family' },
];

let visits = [
  {
    id: 'rv-1',
    name: 'Amit Shah',
    phone: '9876511011',
    purpose: 'Guest',
    type: 'guest',
    status: 'waiting',
    persons: 2,
    vehicle: '',
    flatNo: 'A-101',
    createdAt: '2026-09-27T10:12:00+05:30',
    isPreapproved: false,
    photoUrl: mockPhoto('#7c6fb0'),
  },
  {
    id: 'rv-2',
    name: 'Amazon',
    phone: '9800011111',
    purpose: 'Parcel',
    type: 'delivery',
    status: 'waiting',
    persons: 1,
    vehicle: 'MH12AB1234',
    flatNo: 'A-101',
    createdAt: '2026-09-27T10:05:00+05:30',
    isPreapproved: false,
    photoUrl: mockPhoto('#c2884a'),
  },
  {
    id: 'rv-3',
    name: 'Priya Mehta',
    phone: '9876544044',
    purpose: 'Guest',
    type: 'guest',
    status: 'checked_in',
    persons: 3,
    vehicle: '',
    flatNo: 'A-101',
    createdAt: '2026-09-27T09:40:00+05:30',
    checkInTime: '2026-09-27T09:40:00+05:30',
    isPreapproved: false,
    photoUrl: mockPhoto('#4f8a8b'),
  },
  {
    id: 'rv-4',
    name: 'Neha Kapoor',
    phone: '9876502222',
    purpose: 'Birthday',
    type: 'guest',
    status: 'scheduled',
    persons: 4,
    vehicle: 'MH01CD9090',
    flatNo: 'A-101',
    createdAt: '2026-09-27T08:00:00+05:30',
    expectedAt: '2026-09-28T18:00:00+05:30',
    isPreapproved: true,
  },
  {
    id: 'rv-5',
    name: 'City Cab',
    phone: '9876533033',
    purpose: 'Pickup',
    type: 'cab',
    status: 'checked_out',
    persons: 1,
    vehicle: 'MH14CD7788',
    flatNo: 'A-101',
    createdAt: '2026-09-26T19:10:00+05:30',
    isPreapproved: false,
    photoUrl: mockPhoto('#5b7fa6'),
  },
];

let sosItems = [
  {
    id: 'sos-1',
    title: 'Medical help',
    note: 'Need a guard at the flat',
    category: 'security',
    priority: 'critical',
    status: 'active',
    flatNo: 'A-101',
    createdAt: '2026-09-27T10:01:00+05:30',
    guardResponded: false,
  },
  {
    id: 'sos-2',
    title: 'Gate disturbance',
    note: 'Guard already on the way',
    category: 'security',
    priority: 'critical',
    status: 'responded',
    flatNo: 'A-101',
    createdAt: '2026-09-26T21:10:00+05:30',
    guardResponded: true,
  },
];

const facilities = [
  {
    id: 'fac-1',
    name: 'Clubhouse',
    hours: '08:00 – 22:00',
    fee: 500,
    slots: [
      { id: 'c1', label: '16:00 – 18:00', startTime: '16:00', endTime: '18:00' },
      { id: 'c2', label: '18:00 – 20:00', startTime: '18:00', endTime: '20:00' },
    ],
  },
  {
    id: 'fac-2',
    name: 'Tennis Court',
    hours: '06:00 – 21:00',
    fee: 200,
    slots: [
      { id: 't1', label: '07:00 – 08:00', startTime: '07:00', endTime: '08:00' },
      { id: 't2', label: '18:00 – 19:00', startTime: '18:00', endTime: '19:00' },
    ],
  },
];

let bookings = [
  {
    id: 'bk-1',
    code: 'BK-101',
    facilityId: 'fac-1',
    amenity: 'Clubhouse',
    date: '2026-09-27',
    startTime: '16:00',
    endTime: '18:00',
    guests: 8,
    purpose: 'Family gathering',
    status: 'confirmed',
  },
  {
    id: 'bk-2',
    code: 'BK-088',
    facilityId: 'fac-2',
    amenity: 'Tennis Court',
    date: '2026-09-27',
    startTime: '07:00',
    endTime: '08:00',
    guests: 2,
    purpose: 'Practice',
    status: 'checked_in',
  },
  {
    id: 'bk-3',
    code: 'BK-077',
    facilityId: 'fac-1',
    amenity: 'Clubhouse',
    date: '2026-09-20',
    startTime: '10:00',
    endTime: '12:00',
    guests: 4,
    purpose: 'Meeting',
    status: 'checked_out',
  },
];

let slots = [
  {
    id: 'slot-1',
    slotCode: 'B1-04',
    vehicleNumber: 'MH12KA1010',
    status: 'outside',
    parkingCode: 'PK-A101',
  },
];

let vehicles = [
  {
    id: 'veh-1',
    vehicleNumber: 'MH12KA1010',
    vehicleType: 'car',
    make: 'Honda',
    model: 'City',
    color: 'White',
    primary: true,
    parkingCode: 'PK-A101',
  },
];

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3600000).toISOString();
}

let visitorParking = [
  {
    id: 'vp-1',
    vehicleNumber: 'MH01CD9090',
    vehicleType: 'car',
    purpose: 'Birthday dinner',
    notes: '',
    parkingCode: 'VP-9090',
    slotCode: 'V-02',
    status: 'inside',
    createdAt: hoursAgo(5),
    entryTime: hoursAgo(1.5),
    exitTime: null,
  },
  {
    id: 'vp-2',
    vehicleNumber: 'MH14EF4455',
    vehicleType: 'bike',
    purpose: 'Plumber',
    notes: 'Kitchen sink repair',
    parkingCode: 'VP-4455',
    slotCode: 'V-05',
    status: 'expected',
    createdAt: hoursAgo(0.5),
    entryTime: null,
    exitTime: null,
  },
  {
    id: 'vp-3',
    vehicleNumber: 'MH12GH7788',
    vehicleType: 'car',
    purpose: 'Family visit',
    notes: '',
    parkingCode: 'VP-7788',
    slotCode: 'V-01',
    status: 'exited',
    createdAt: hoursAgo(30),
    entryTime: hoursAgo(27),
    exitTime: hoursAgo(23.25),
  },
  {
    id: 'vp-4',
    vehicleNumber: 'MH04JK1212',
    vehicleType: 'car',
    purpose: 'Friends',
    notes: '',
    parkingCode: 'VP-1212',
    slotCode: 'V-03',
    status: 'exited',
    createdAt: hoursAgo(52),
    entryTime: hoursAgo(50),
    exitTime: hoursAgo(46.5),
  },
];

let visitorSlots = [
  { id: 'vs-1', slotCode: 'V-01', status: 'available' },
  { id: 'vs-2', slotCode: 'V-02', status: 'occupied' },
  { id: 'vs-3', slotCode: 'V-03', status: 'available' },
  { id: 'vs-4', slotCode: 'V-04', status: 'occupied' },
  { id: 'vs-5', slotCode: 'V-05', status: 'reserved' },
  { id: 'vs-6', slotCode: 'V-06', status: 'available' },
];

let parkingLogs = [
  { id: 'pl-1', vehicleNumber: 'MH12KA1010', slotCode: 'B1-04', entryTime: hoursAgo(9), exitTime: hoursAgo(2.2) },
  { id: 'pl-2', vehicleNumber: 'MH12KA1010', slotCode: 'B1-04', entryTime: hoursAgo(20), exitTime: hoursAgo(11) },
  { id: 'pl-3', vehicleNumber: 'MH12KA1010', slotCode: 'B1-04', entryTime: hoursAgo(34), exitTime: hoursAgo(25.5) },
  { id: 'pl-4', vehicleNumber: 'MH12KA1010', slotCode: 'B1-04', entryTime: hoursAgo(58), exitTime: hoursAgo(49) },
];

const clearanceDocs = {
  leaveLicense: {
    title: 'Leave & License Agreement', required: true, present: true, fileName: 'leave-license.pdf',
    reviewStatus: 'approved', remark: '', uploadedAt: '2026-09-20T11:00:00+05:30', reviewedAt: '2026-09-21T10:30:00+05:30',
  },
  tenantIdProof: {
    title: 'Tenant ID Proof', required: true, present: true, fileName: 'tenant-id.pdf',
    reviewStatus: 'approved', remark: '', uploadedAt: '2026-09-20T11:05:00+05:30', reviewedAt: '2026-09-21T10:32:00+05:30',
  },
  ownerConfirmation: {
    title: 'Owner Confirmation', required: true, present: false, fileName: null,
    reviewStatus: null, remark: '', uploadedAt: null, reviewedAt: null,
  },
  duesClearance: {
    title: 'Dues Clearance', required: true, present: true, fileName: 'dues.pdf',
    reviewStatus: 'pending', remark: '', uploadedAt: '2026-09-26T18:20:00+05:30', reviewedAt: null,
  },
  utilityBills: {
    title: 'Final Utility Bills', required: true, present: true, fileName: 'electricity-bill.pdf',
    reviewStatus: 'rejected', remark: 'Gas bill is missing. Upload both electricity and gas bills.',
    uploadedAt: '2026-09-24T09:40:00+05:30', reviewedAt: '2026-09-25T12:15:00+05:30',
  },
  policeIntimation: {
    title: 'Police Exit Intimation', required: false, present: false, fileName: null,
    reviewStatus: null, remark: '', uploadedAt: null, reviewedAt: null,
  },
};

let notifications = [
  { id: 'n1', category: 'visitor', title: 'Guest at the gate', body: 'Amit Shah is waiting for A-101', read: false, createdAt: '2026-09-27T10:12:00+05:30' },
  { id: 'n2', category: 'emergency', title: 'SOS active', body: 'Medical help is still open', read: false, createdAt: '2026-09-27T10:01:00+05:30' },
  { id: 'n3', category: 'parking', title: 'Parking code', body: 'Primary vehicle code PK-A101', read: true, createdAt: '2026-09-26T09:00:00+05:30' },
  { id: 'n4', category: 'amenity', title: 'Booking confirmed', body: 'Clubhouse today 16:00 – 18:00', read: false, createdAt: '2026-09-27T08:30:00+05:30' },
  { id: 'n5', category: 'billing', title: 'Maintenance due', body: 'Hidden from this panel', read: false, createdAt: '2026-09-25T08:00:00+05:30' },
];

let seq = 20;

function nextId(prefix) {
  seq += 1;
  return `${prefix}-${seq}`;
}

function gateAllowed() {
  return Object.values(clearanceDocs)
    .filter((doc) => doc.required !== false)
    .every((doc) => doc.present && doc.reviewStatus === 'approved');
}

function clearanceView() {
  return {
    flatNo: flat.flatNo,
    documents: clone(clearanceDocs),
    gateAllowed: gateAllowed(),
  };
}

export function storeProfile() {
  return clone(profile);
}

export function storeFlat() {
  return { ...clone(flat), household: clone(household) };
}

export function storeHousehold() {
  return clone(household);
}

export function updateProfile(patch) {
  if (patch.name != null) profile.name = String(patch.name).trim();
  if (patch.phone != null) profile.phone = String(patch.phone).replace(/\D/g, '').slice(0, 10);
  if (patch.emergencyName != null) profile.emergencyName = String(patch.emergencyName).trim();
  if (patch.emergencyPhone != null) profile.emergencyPhone = String(patch.emergencyPhone).replace(/\D/g, '').slice(0, 10);
  if (!profile.name || profile.phone.length !== 10) {
    const error = new Error('Name and a 10-digit phone are required');
    error.status = 422;
    throw error;
  }
  return clone(profile);
}

export function changePassword(body) {
  if (!body?.currentPassword || !body?.newPassword) {
    const error = new Error('Current and new password are required');
    error.status = 422;
    throw error;
  }
  if (String(body.newPassword).length < 6) {
    const error = new Error('New password must be at least 6 characters');
    error.status = 422;
    throw error;
  }
  return { ok: true };
}

export function listVisits() {
  return clone(visits).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function actOnVisit(visitId, action) {
  const row = visits.find((visit) => visit.id === visitId);
  if (!row) {
    const error = new Error('Visit not found');
    error.status = 404;
    throw error;
  }
  if (action === 'approve' && row.status === 'waiting') row.status = 'approved';
  else if (action === 'reject' && row.status === 'waiting') row.status = 'rejected';
  else if (action === 'cancel' && row.status === 'scheduled') row.status = 'cancelled';
  else {
    const error = new Error('This visit cannot be updated');
    error.status = 409;
    throw error;
  }
  return clone(row);
}

export function createInvite(form) {
  const phone = String(form.phone || '').replace(/\D/g, '');
  if (!form.name?.trim() || phone.length !== 10 || !form.purpose?.trim()) {
    const error = new Error('Name, 10-digit phone and purpose are required');
    error.status = 422;
    throw error;
  }
  const row = {
    id: nextId('rv'),
    name: form.name.trim(),
    phone,
    purpose: form.purpose.trim(),
    type: form.type || 'guest',
    status: 'scheduled',
    persons: Number(form.persons) || 1,
    vehicle: String(form.vehicle || '').toUpperCase(),
    flatNo: flat.flatNo,
    createdAt: new Date().toISOString(),
    expectedAt: form.expectedAt || null,
    isPreapproved: true,
  };
  visits.unshift(row);
  return clone(row);
}

export function listSos() {
  return clone(sosItems).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function createSos(form) {
  if (!form.title?.trim()) {
    const error = new Error('Title is required');
    error.status = 422;
    throw error;
  }
  const row = {
    id: nextId('sos'),
    title: form.title.trim(),
    note: form.note || '',
    category: 'security',
    priority: 'critical',
    status: 'active',
    flatNo: flat.flatNo,
    createdAt: new Date().toISOString(),
    guardResponded: false,
    photoName: form.photoName || null,
  };
  sosItems.unshift(row);
  notifications.unshift({
    id: nextId('n'),
    category: 'emergency',
    title: 'SOS raised',
    body: row.title,
    read: false,
    createdAt: row.createdAt,
  });
  return clone(row);
}

export function closeSos(id, action) {
  const row = sosItems.find((item) => item.id === id);
  if (!row) {
    const error = new Error('SOS not found');
    error.status = 404;
    throw error;
  }
  if (!['active', 'responded'].includes(row.status)) {
    const error = new Error('This SOS is already closed');
    error.status = 409;
    throw error;
  }
  row.status = action === 'cancel' ? 'cancelled' : 'resolved';
  row.closedAt = new Date().toISOString();
  return clone(row);
}

export function listFacilities() {
  return clone(facilities);
}

export function getFacility(id) {
  const row = facilities.find((item) => item.id === id);
  if (!row) {
    const error = new Error('Facility not found');
    error.status = 404;
    throw error;
  }
  return clone(row);
}

export function createBooking(form) {
  const facility = facilities.find((item) => item.id === form.facilityId);
  const slot = (facility?.slots || []).find((item) => item.id === form.slotId);
  const startTime = slot?.startTime || form.startTime;
  const endTime = slot?.endTime || form.endTime;
  if (!facility || !form.date || !startTime || !endTime) {
    const error = new Error('Facility, date and slot are required');
    error.status = 422;
    throw error;
  }
  const row = {
    id: nextId('bk'),
    code: `BK-${100 + seq}`,
    facilityId: facility.id,
    amenity: facility.name,
    date: form.date,
    startTime,
    endTime,
    guests: Number(form.guests) || 1,
    purpose: form.purpose || '',
    status: 'pending',
  };
  bookings.unshift(row);
  return clone(row);
}

export function listBookings() {
  return clone(bookings);
}

export function cancelBooking(id) {
  const row = bookings.find((item) => item.id === id);
  if (!row) {
    const error = new Error('Booking not found');
    error.status = 404;
    throw error;
  }
  if (!['pending', 'approved', 'confirmed'].includes(row.status)) {
    const error = new Error('This booking can no longer be cancelled');
    error.status = 409;
    throw error;
  }
  row.status = 'cancelled';
  return clone(row);
}

export function listParking() {
  return clone(slots);
}

export function listVehicles() {
  return clone(vehicles);
}

export function saveVehicle(form, id) {
  const vehicleNumber = String(form.vehicleNumber || '').replace(/\s+/g, '').toUpperCase();
  if (!vehicleNumber || !form.vehicleType) {
    const error = new Error('Vehicle number and type are required');
    error.status = 422;
    throw error;
  }
  if (form.primary) vehicles.forEach((item) => { item.primary = false; });
  if (id) {
    const row = vehicles.find((item) => item.id === id);
    if (!row) {
      const error = new Error('Vehicle not found');
      error.status = 404;
      throw error;
    }
    Object.assign(row, {
      vehicleNumber,
      vehicleType: form.vehicleType,
      make: form.make || '',
      model: form.model || '',
      color: form.color || '',
      primary: Boolean(form.primary),
    });
    return clone(row);
  }
  const row = {
    id: nextId('veh'),
    vehicleNumber,
    vehicleType: form.vehicleType,
    make: form.make || '',
    model: form.model || '',
    color: form.color || '',
    primary: vehicles.length === 0 || Boolean(form.primary),
    parkingCode: `PK-${vehicleNumber.slice(-4)}`,
  };
  vehicles.unshift(row);
  return clone(row);
}

export function removeVehicle(id) {
  const before = vehicles.length;
  vehicles = vehicles.filter((item) => item.id !== id);
  if (vehicles.length === before) {
    const error = new Error('Vehicle not found');
    error.status = 404;
    throw error;
  }
  if (vehicles.length && !vehicles.some((item) => item.primary)) vehicles[0].primary = true;
  return { ok: true };
}

export function requestVisitorParking(form) {
  const vehicleNumber = String(form.vehicleNumber || '').replace(/\s+/g, '').toUpperCase();
  if (!vehicleNumber || !form.vehicleType) {
    const error = new Error('Vehicle number and type are required');
    error.status = 422;
    throw error;
  }
  const slot = visitorSlots.find((item) => item.id === form.slotId);
  if (!slot) {
    const error = new Error(visitorSlots.some((item) => item.status === 'available')
      ? 'Select a visitor slot'
      : 'All visitor slots are full');
    error.status = 422;
    throw error;
  }
  if (slot.status !== 'available') {
    const error = new Error(`Slot ${slot.slotCode} was just taken. Pick another slot.`);
    error.status = 409;
    throw error;
  }
  slot.status = 'reserved';
  const row = {
    id: nextId('vp'),
    vehicleNumber,
    vehicleType: form.vehicleType,
    purpose: form.purpose || '',
    notes: form.notes || '',
    parkingCode: `VP-${vehicleNumber.slice(-4)}`,
    slotId: slot.id,
    slotCode: slot.slotCode,
    expectedDate: form.expectedDate || null,
    status: 'expected',
    createdAt: new Date().toISOString(),
    entryTime: null,
    exitTime: null,
  };
  visitorParking.unshift(row);
  return clone(row);
}

export function listVisitorParking() {
  return clone(visitorParking).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function listVisitorSlots() {
  return clone(visitorSlots);
}

export function listParkingLogs() {
  return clone(parkingLogs).sort((a, b) => String(b.entryTime).localeCompare(String(a.entryTime)));
}

export function getClearance() {
  return clearanceView();
}

export function uploadClearance(key, fileName) {
  if (!clearanceDocs[key]) {
    const error = new Error('Unknown clearance document');
    error.status = 422;
    throw error;
  }
  Object.assign(clearanceDocs[key], {
    present: true,
    fileName: fileName || 'upload.pdf',
    reviewStatus: 'pending',
    remark: '',
    uploadedAt: new Date().toISOString(),
    reviewedAt: null,
  });
  return clearanceView();
}

export function listNotifications(category) {
  return clone(notifications)
    .filter((item) => GATE_NOTE_CATEGORIES.includes(item.category))
    .filter((item) => !category || category === 'all' || item.category === category)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function markRead(id) {
  const row = notifications.find((item) => item.id === id);
  if (row) row.read = true;
  return listNotifications();
}

export function unreadGateCount() {
  return notifications.filter((item) => GATE_NOTE_CATEGORIES.includes(item.category) && !item.read).length;
}

export function gateDashboard() {
  const primary = vehicles.find((item) => item.primary) || vehicles[0] || null;
  const openSos = sosItems.filter((item) => item.status === 'active' && item.category === 'security' && item.priority === 'critical');
  return {
    resident: { name: profile.name, flatNo: flat.flatNo },
    pendingAtGate: visits.filter((item) => item.status === 'waiting'),
    upcomingInvites: visits.filter((item) => item.status === 'scheduled'),
    activeSos: openSos,
    todaysBookings: bookings.filter((item) => ['confirmed', 'approved'].includes(item.status)),
    parkingCode: primary?.parkingCode || null,
  };
}
