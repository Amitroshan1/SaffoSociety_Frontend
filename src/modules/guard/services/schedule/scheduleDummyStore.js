/**
 * Schedule dummy store — PDF field shapes for shifts / attendance / punches.
 */
import { buildPagination, indiaTodayISO } from '@/modules/guard/services/core/http';

function shiftIso(day, hour, minute) {
  const d = new Date(`${day}T12:00:00+05:30`);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysOffset(n) {
  const d = new Date(`${indiaTodayISO()}T12:00:00+05:30`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function seedShifts() {
  const today = indiaTodayISO();
  const tomorrow = daysOffset(1);
  const in3 = daysOffset(3);
  const past = daysOffset(-2);
  return [
    {
      id: 101,
      dutyDate: today,
      shiftType: 'morning',
      gateName: 'Main Vehicle Gate',
      gateCode: 'MG',
      staffName: 'Ravi Kumar',
      staffCode: 'GRD-1024',
      startTime: shiftIso(today, 6, 0),
      endTime: shiftIso(today, 14, 0),
      status: 'scheduled',
      latitude: 19.076,
      longitude: 72.8777,
    },
    {
      id: 102,
      dutyDate: tomorrow,
      shiftType: 'evening',
      gateName: 'Pedestrian Gate',
      gateCode: 'PG',
      staffName: 'Ravi Kumar',
      staffCode: 'GRD-1024',
      startTime: shiftIso(tomorrow, 14, 0),
      endTime: shiftIso(tomorrow, 22, 0),
      status: 'scheduled',
    },
    {
      id: 103,
      dutyDate: in3,
      shiftType: 'night',
      gateName: 'Main Vehicle Gate',
      gateCode: 'MG',
      staffName: 'Ravi Kumar',
      staffCode: 'GRD-1024',
      startTime: shiftIso(in3, 22, 0),
      endTime: shiftIso(daysOffset(4), 6, 0),
      status: 'scheduled',
    },
    {
      id: 104,
      dutyDate: past,
      shiftType: 'morning',
      gateName: 'Main Vehicle Gate',
      gateCode: 'MG',
      staffName: 'Ravi Kumar',
      staffCode: 'GRD-1024',
      startTime: shiftIso(past, 6, 0),
      endTime: shiftIso(past, 14, 0),
      status: 'completed',
    },
  ];
}

function seedAttendance() {
  const today = indiaTodayISO();
  const past = daysOffset(-2);
  const past2 = daysOffset(-3);
  return [
    {
      id: 'att-1',
      dutyDate: past,
      status: 'present',
      shiftId: 104,
      checkInTime: shiftIso(past, 5, 58),
      checkOutTime: shiftIso(past, 14, 2),
      gateName: 'Main Vehicle Gate',
    },
    {
      id: 'att-2',
      dutyDate: past2,
      status: 'absent',
      shiftId: null,
      checkInTime: null,
      checkOutTime: null,
      gateName: null,
    },
    {
      id: 'att-3',
      dutyDate: today,
      status: 'scheduled',
      shiftId: 101,
      checkInTime: null,
      checkOutTime: null,
      gateName: 'Main Vehicle Gate',
    },
  ];
}

function seedPunches() {
  const past = daysOffset(-2);
  return [
    {
      id: 'p-1',
      shiftId: 104,
      type: 'in',
      punchedAt: shiftIso(past, 5, 58),
      latitude: 19.076,
      longitude: 72.8777,
      gateName: 'Main Vehicle Gate',
    },
    {
      id: 'p-2',
      shiftId: 104,
      type: 'out',
      punchedAt: shiftIso(past, 14, 2),
      latitude: 19.0761,
      longitude: 72.8778,
      gateName: 'Main Vehicle Gate',
    },
  ];
}

let shifts = seedShifts();
let attendance = seedAttendance();
let punches = seedPunches();

/** Demo gate coords for outside-gate simulation */
export const DUMMY_GATE_COORDS = { lat: 19.076, lng: 72.8777, radiusM: 120 };

function haversine(aLat, aLng, bLat, bLng) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function paginate(list, params = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
  const start = (page - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    pagination: buildPagination(list.length, page, pageSize),
  };
}

function filterByDate(rows, dateField, params) {
  let list = [...rows];
  if (params.from || params.to) {
    list = list.filter((r) => {
      const day = String(r[dateField] || '').slice(0, 10);
      if (params.from && day < params.from) return false;
      if (params.to && day > params.to) return false;
      return true;
    });
  }
  if (params.dutyDate) {
    list = list.filter((r) => String(r[dateField]).slice(0, 10) === params.dutyDate);
  }
  if (params.status) {
    list = list.filter((r) => r.status === params.status);
  }
  return list;
}

export const scheduleDummyStore = {
  reset() {
    shifts = seedShifts();
    attendance = seedAttendance();
    punches = seedPunches();
  },

  listShifts(params = {}) {
    let rows = filterByDate(shifts, 'dutyDate', params);
    if (params.scope === 'today') {
      const t = indiaTodayISO();
      rows = rows.filter((r) => r.dutyDate === t);
    } else if (params.scope === 'upcoming') {
      const t = indiaTodayISO();
      rows = rows.filter((r) => r.dutyDate > t);
    }
    rows = [...rows].sort((a, b) => String(a.dutyDate).localeCompare(String(b.dutyDate)));
    return paginate(rows, params);
  },

  listAttendance(params = {}) {
    let rows = filterByDate(attendance, 'dutyDate', params);
    rows = [...rows].sort((a, b) => String(b.dutyDate).localeCompare(String(a.dutyDate)));
    return paginate(rows, params);
  },

  listPunches(params = {}) {
    let rows = [...punches];
    if (params.shiftId) {
      rows = rows.filter((p) => String(p.shiftId) === String(params.shiftId));
    }
    rows = [...rows].sort((a, b) => String(b.punchedAt).localeCompare(String(a.punchedAt)));
    return paginate(rows, params);
  },

  getShift(id) {
    return shifts.find((s) => String(s.id) === String(id)) || null;
  },

  punchIn({ shiftId, latitude, longitude }) {
    const shift = this.getShift(shiftId);
    if (!shift) {
      const e = new Error('Shift not found');
      e.status = 404;
      throw e;
    }
    if (shift.status === 'completed') {
      const e = new Error('Shift already completed');
      e.status = 409;
      throw e;
    }
    if (shift.status === 'in_progress') {
      const e = new Error('Already punched in for this shift');
      e.status = 409;
      throw e;
    }
    const dist = haversine(latitude, longitude, DUMMY_GATE_COORDS.lat, DUMMY_GATE_COORDS.lng);
    if (dist > DUMMY_GATE_COORDS.radiusM) {
      const e = new Error('You are outside the gate geofence');
      e.status = 422;
      throw e;
    }
    shift.status = 'in_progress';
    const now = new Date().toISOString();
    const punch = {
      id: `p-${Date.now()}`,
      shiftId: shift.id,
      type: 'in',
      punchedAt: now,
      latitude,
      longitude,
      gateName: shift.gateName,
    };
    punches = [punch, ...punches];
    const attIdx = attendance.findIndex(
      (a) => a.dutyDate === shift.dutyDate && String(a.shiftId) === String(shift.id),
    );
    const attRow = {
      id: attIdx >= 0 ? attendance[attIdx].id : `att-${Date.now()}`,
      dutyDate: shift.dutyDate,
      status: 'present',
      shiftId: shift.id,
      checkInTime: now,
      checkOutTime: null,
      gateName: shift.gateName,
    };
    if (attIdx >= 0) attendance[attIdx] = attRow;
    else attendance = [attRow, ...attendance];
    return { shift: { ...shift }, attendance: { ...attRow }, punch };
  },

  punchOut({ shiftId, latitude, longitude }) {
    const shift = this.getShift(shiftId);
    if (!shift) {
      const e = new Error('Shift not found');
      e.status = 404;
      throw e;
    }
    if (shift.status !== 'in_progress') {
      const e = new Error('Punch-in required before punch-out');
      e.status = 409;
      throw e;
    }
    const dist = haversine(latitude, longitude, DUMMY_GATE_COORDS.lat, DUMMY_GATE_COORDS.lng);
    if (dist > DUMMY_GATE_COORDS.radiusM) {
      const e = new Error('You are outside the gate geofence');
      e.status = 422;
      throw e;
    }
    shift.status = 'completed';
    const now = new Date().toISOString();
    const punch = {
      id: `p-${Date.now()}`,
      shiftId: shift.id,
      type: 'out',
      punchedAt: now,
      latitude,
      longitude,
      gateName: shift.gateName,
    };
    punches = [punch, ...punches];
    const att = attendance.find((a) => String(a.shiftId) === String(shift.id) && a.status === 'present');
    if (att) {
      att.checkOutTime = now;
    }
    return { shift: { ...shift }, attendance: att ? { ...att } : null, punch };
  },
};
