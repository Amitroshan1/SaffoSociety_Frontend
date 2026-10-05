/**
 * In-memory parking store shaped like the 24 Sep 2026 Guard parking contract.
 */

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600000).toISOString();
}

const residents = [
  {
    id: 'pr-1',
    slotNumber: 'B1-01',
    building: 'Tower 1',
    wingNo: 'B',
    status: 'outside',
    residentName: 'Rahul Sharma',
    flatNo: 'B-804',
    vehicleNumber: 'MH12AB1234',
    vehicleType: 'car',
    entryTime: null,
  },
  {
    id: 'pr-2',
    slotNumber: 'B1-03',
    building: 'Tower 1',
    wingNo: 'A',
    status: 'inside',
    residentName: 'Amit Kumar',
    flatNo: 'A-302',
    vehicleNumber: 'MH12XY9876',
    vehicleType: 'bike',
    entryTime: hoursAgo(2),
  },
  {
    id: 'pr-3',
    slotNumber: 'B2-01',
    building: 'Tower 2',
    wingNo: 'C',
    status: 'outside',
    residentName: 'Priya Patel',
    flatNo: 'C-110',
    vehicleNumber: 'MH14CD4411',
    vehicleType: 'car',
    entryTime: null,
  },
  {
    id: 'pr-4',
    slotNumber: 'B2-04',
    building: 'Tower 2',
    wingNo: 'A',
    status: 'vacant',
    residentName: null,
    flatNo: null,
    vehicleNumber: null,
    vehicleType: null,
    entryTime: null,
  },
];

const visitors = [
  {
    id: 'pv-1',
    slotNumber: 'V-01',
    building: 'Visitor',
    wingNo: 'V',
    status: 'occupied',
    logId: 'vl-1',
    visitorName: 'Ramesh Kumar',
    phone: '9876501111',
    flatBuilding: 'Tower 1',
    flatWingNo: 'B',
    flatNo: 'B-804',
    vehicleNumber: 'MH04CD5678',
    vehicleType: 'car',
    entryTime: hoursAgo(1),
  },
  {
    id: 'pv-2',
    slotNumber: 'V-02',
    building: 'Visitor',
    wingNo: 'V',
    status: 'free',
    logId: null,
    visitorName: null,
    phone: null,
    flatBuilding: null,
    flatWingNo: null,
    flatNo: null,
    vehicleNumber: null,
    vehicleType: null,
    entryTime: null,
  },
  {
    id: 'pv-3',
    slotNumber: 'V-03',
    building: 'Visitor',
    wingNo: 'V',
    status: 'free',
    logId: null,
    visitorName: null,
    phone: null,
    flatBuilding: null,
    flatWingNo: null,
    flatNo: null,
    vehicleNumber: null,
    vehicleType: null,
    entryTime: null,
  },
];

const logs = [
  {
    id: 'pl-1',
    parkingId: 'pr-2',
    slotNumber: 'B1-03',
    building: 'Tower 1',
    wingNo: 'A',
    parkingType: 'resident',
    residentName: 'Amit Kumar',
    visitorName: null,
    phone: null,
    flatNo: 'A-302',
    vehicleNumber: 'MH12XY9876',
    vehicleType: 'bike',
    entryTime: hoursAgo(2),
    exitTime: null,
    recordedBy: 'Ravi Kumar',
  },
  {
    id: 'vl-1',
    parkingId: 'pv-1',
    slotNumber: 'V-01',
    building: 'Visitor',
    wingNo: 'V',
    parkingType: 'visitor',
    residentName: null,
    visitorName: 'Ramesh Kumar',
    phone: '9876501111',
    flatNo: 'B-804',
    vehicleNumber: 'MH04CD5678',
    vehicleType: 'car',
    entryTime: hoursAgo(1),
    exitTime: null,
    recordedBy: 'Ravi Kumar',
  },
  {
    id: 'pl-2',
    parkingId: 'pr-1',
    slotNumber: 'B1-01',
    building: 'Tower 1',
    wingNo: 'B',
    parkingType: 'resident',
    residentName: 'Rahul Sharma',
    visitorName: null,
    phone: null,
    flatNo: 'B-804',
    vehicleNumber: 'MH12AB1234',
    vehicleType: 'car',
    entryTime: hoursAgo(5),
    exitTime: hoursAgo(3),
    recordedBy: 'Ravi Kumar',
  },
];

let logSeq = 10;

function clone(row) {
  return row ? { ...row } : row;
}

export function parkingCounts() {
  return {
    residentsInside: residents.filter((r) => r.status === 'inside').length,
    residentsOutside: residents.filter((r) => r.status === 'outside').length,
    visitorFilled: visitors.filter((v) => v.status === 'occupied').length,
    visitorFree: visitors.filter((v) => v.status === 'free').length,
    visitorCapacity: visitors.length,
  };
}

export function listResidentRows() {
  return residents.map(clone);
}

export function listVisitorRows() {
  return visitors.map(clone);
}

export function listLogRows() {
  return logs.map(clone);
}

export function findResident(id) {
  return residents.find((r) => r.id === id) || null;
}

export function enterResident(id) {
  const row = residents.find((r) => r.id === id);
  if (!row) {
    const e = new Error('Parking slot not found');
    e.status = 404;
    throw e;
  }
  if (row.status === 'vacant') {
    const e = new Error('This parking slot is vacant');
    e.status = 409;
    throw e;
  }
  if (row.status === 'inside') {
    const e = new Error('Vehicle is already inside');
    e.status = 409;
    throw e;
  }
  row.status = 'inside';
  row.entryTime = new Date().toISOString();
  logs.unshift({
    id: `pl-${++logSeq}`,
    parkingId: row.id,
    slotNumber: row.slotNumber,
    building: row.building,
    wingNo: row.wingNo,
    parkingType: 'resident',
    residentName: row.residentName,
    visitorName: null,
    phone: null,
    flatNo: row.flatNo,
    vehicleNumber: row.vehicleNumber,
    vehicleType: row.vehicleType,
    entryTime: row.entryTime,
    exitTime: null,
    recordedBy: 'Ravi Kumar',
  });
  return clone(row);
}

export function exitResident(id) {
  const row = residents.find((r) => r.id === id);
  if (!row) {
    const e = new Error('Parking slot not found');
    e.status = 404;
    throw e;
  }
  if (row.status === 'vacant') {
    const e = new Error('This parking slot is vacant');
    e.status = 409;
    throw e;
  }
  if (row.status === 'outside') {
    const e = new Error('Vehicle is already outside');
    e.status = 409;
    throw e;
  }
  const open = logs.find((l) => l.parkingId === row.id && l.parkingType === 'resident' && l.exitTime == null);
  const exitTime = new Date().toISOString();
  if (open) open.exitTime = exitTime;
  row.status = 'outside';
  row.entryTime = null;
  return clone(row);
}

export function enterVisitor(body) {
  const slot = visitors.find((v) => v.id === body.parkingId);
  if (!slot) {
    const e = new Error('Visitor parking slot not found');
    e.status = 404;
    throw e;
  }
  if (slot.status === 'occupied') {
    const e = new Error('Visitor slot is already occupied');
    e.status = 409;
    throw e;
  }
  const entryTime = new Date().toISOString();
  const logId = `vl-${++logSeq}`;
  slot.status = 'occupied';
  slot.logId = logId;
  slot.visitorName = body.visitorName;
  slot.phone = body.phone;
  slot.flatBuilding = body.building;
  slot.flatWingNo = body.wingNo;
  slot.flatNo = body.flatNo;
  slot.vehicleNumber = body.vehicleNumber;
  slot.vehicleType = body.vehicleType;
  slot.entryTime = entryTime;
  logs.unshift({
    id: logId,
    parkingId: slot.id,
    slotNumber: slot.slotNumber,
    building: slot.building,
    wingNo: slot.wingNo,
    parkingType: 'visitor',
    residentName: null,
    visitorName: body.visitorName,
    phone: body.phone,
    flatNo: body.flatNo,
    vehicleNumber: body.vehicleNumber,
    vehicleType: body.vehicleType,
    entryTime,
    exitTime: null,
    recordedBy: 'Ravi Kumar',
  });
  return clone(slot);
}

export function exitVisitor(logId) {
  const log = logs.find((l) => l.id === logId && l.parkingType === 'visitor');
  if (!log) {
    const e = new Error('Visitor parking log not found');
    e.status = 404;
    throw e;
  }
  if (log.exitTime) {
    const e = new Error('Visitor parking is already exited');
    e.status = 409;
    throw e;
  }
  log.exitTime = new Date().toISOString();
  const slot = visitors.find((v) => v.id === log.parkingId);
  if (slot) {
    slot.status = 'free';
    slot.logId = null;
    slot.visitorName = null;
    slot.phone = null;
    slot.flatBuilding = null;
    slot.flatWingNo = null;
    slot.flatNo = null;
    slot.vehicleNumber = null;
    slot.vehicleType = null;
    slot.entryTime = null;
    return clone(slot);
  }
  return null;
}
