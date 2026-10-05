/** Map FastAPI resident payloads onto the field names the existing screens already read. */

export function mapVisit(row) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.visitor_name || row.name || '',
    phone: row.visitor_phone || row.phone || '',
    type: row.visitor_type || row.type || 'guest',
    purpose: row.purpose || '',
    status: row.status || '',
    isPreapproved: Boolean(row.is_preapproved ?? row.isPreapproved),
    notes: row.notes || '',
    persons: row.persons || 1,
    vehicle: row.vehicle || '',
    createdAt: row.createdAt || row.created_at || null,
    expectedAt: row.expectedAt || row.expected_at || null,
  };
}

export function mapProfile(row, email = '') {
  return {
    name: row?.full_name || row?.name || '',
    phone: row?.phone || '',
    email: email || row?.email || '',
    emergencyName: row?.emergency_name || row?.emergencyName || '',
    emergencyPhone: row?.emergency_phone || row?.emergencyPhone || '',
  };
}

export function mapFlat(row) {
  const building = row?.building_name || row?.building || '';
  const number = row?.flat_number || row?.flatNo || '';
  return {
    society: row?.society_name || row?.society || '',
    building,
    wing: row?.wing || '',
    flatNo: row?.flatNo || [building, number].filter(Boolean).join('-') || number,
    occupancyRole: row?.occupancyRole || (row?.is_active === false ? 'Inactive' : 'Resident'),
    occupancyId: row?.occupancy_id ?? null,
    isActive: row?.is_active !== false,
  };
}

export function mapMember(row) {
  return {
    id: row.id,
    name: row.name || '',
    role: row.relation || row.role || 'Member',
    phone: row.phone || '',
  };
}

export function mapSos(row) {
  const status = row?.status === 'open' ? 'active' : row?.status;
  return {
    id: row.id,
    title: row.title || '',
    note: row.description || row.note || '',
    category: row.category || '',
    priority: row.priority || '',
    status,
    photoUrl: row.photo_url || null,
    createdAt: row.created_at || row.createdAt || null,
  };
}

export function mapAmenity(row) {
  const open = row.open_time || '';
  const close = row.close_time || '';
  return {
    id: row.id,
    name: row.name || '',
    hours: open && close ? `${open} – ${close}` : open || close || '',
    fee: 0,
  };
}

export function mapSlot(row) {
  const start = row.start_time || row.startTime || '';
  const end = row.end_time || row.endTime || '';
  return {
    id: `${start}|${end}`,
    startTime: start,
    endTime: end,
    label: start && end ? `${start} – ${end}` : start,
    isBooked: Boolean(row.is_booked),
  };
}

export function mapBooking(row) {
  const status = row.status === 'booked' ? 'confirmed' : row.status;
  return {
    id: row.id,
    code: row.code || `BK-${row.id}`,
    facilityId: row.amenity_id,
    amenity: row.amenity_name || row.amenity || '',
    date: row.booking_date || row.date || '',
    startTime: row.start_time || row.startTime || '',
    endTime: row.end_time || row.endTime || '',
    guests: row.guest_count ?? row.guests ?? 1,
    purpose: row.purpose || '',
    status,
  };
}

export function mapVehicle(row) {
  return {
    id: row.id,
    vehicleNumber: row.vehicle_number || row.vehicleNumber || '',
    vehicleType: row.vehicle_type || row.vehicleType || '',
    make: row.make || '',
    model: row.model || '',
    color: row.color || '',
    primary: Boolean(row.is_primary ?? row.primary),
    parkingCode: row.parking_code || row.parkingCode || '',
    slotId: row.slot_id ?? row.slotId ?? null,
  };
}

export function mapSlotCard(row, parkingCode = '') {
  return {
    id: row.id,
    slotCode: row.code || row.slotCode || '',
    kind: row.kind || '',
    status: row.status || '',
    parkingCode: row.parkingCode || parkingCode || '',
  };
}

export function mapVisitorParking(row) {
  const status = row.status === 'active' ? 'expected' : (row.status || 'expected');
  return {
    id: row.id,
    vehicleNumber: row.vehicle_number || '',
    vehicleType: row.vehicle_type || '',
    purpose: row.purpose || '',
    notes: row.notes || '',
    parkingCode: row.parking_code || '',
    slotId: row.slot_id ?? null,
    slotCode: row.slotCode || '',
    status,
    entryTime: row.entryTime || null,
    exitTime: row.exitTime || null,
    createdAt: row.createdAt || null,
  };
}

export function mapNotification(row) {
  return {
    id: row.id,
    category: row.category || '',
    title: row.title || '',
    body: row.body || '',
    read: Boolean(row.is_read ?? row.read),
    createdAt: row.created_at || row.createdAt || '',
  };
}

const CLEARANCE_DOCS = [
  ['leaveLicense', 'leave_license', 'Leave & License Agreement', true],
  ['tenantIdProof', 'tenant_id', 'Tenant ID Proof', true],
  ['ownerConfirmation', 'owner_confirm', 'Owner Confirmation', true],
  ['duesClearance', 'dues_clear', 'Dues Clearance', true],
];

export function mapClearance(row, flatNo = '') {
  const uploaded = new Map((row?.documents || []).map((doc) => [doc.doc_type, doc]));
  const documents = {};
  CLEARANCE_DOCS.forEach(([key, type, title, required]) => {
    const doc = uploaded.get(type);
    const present = Boolean(doc) || (type === 'dues_clear' && row?.dues_clear);
    documents[key] = {
      title,
      required,
      present,
      fileName: doc?.file_url ? doc.file_url.split('/').pop() : null,
      fileUrl: doc?.file_url || null,
      reviewStatus: present ? 'approved' : null,
      remark: '',
      uploadedAt: null,
      reviewedAt: null,
    };
  });
  return {
    id: row?.id ?? null,
    flatNo,
    status: row?.status || '',
    gateAllowed: Boolean(row?.gate_allowed),
    moveOutDate: row?.move_out_date || null,
    documents,
  };
}

export const CLEARANCE_TYPE = Object.fromEntries(
  CLEARANCE_DOCS.map(([key, type]) => [key, type]),
);
