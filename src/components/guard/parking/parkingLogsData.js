/**
 * Parking activity log shape (frontend contract).
 * Swap MOCK_PARKING_LOGS / local session rows for a future API list.
 *
 * {
 *   id, eventType: 'entry'|'exit', category: 'resident'|'visitor',
 *   vehicleNumber, vehicleType, personName, flatNumber, parkingNumber,
 *   timestamp, entryTime?, recordedBy
 * }
 */

function dayOffsetIso(daysAgo, hour, minute) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Demo rows for UI when no local/API logs exist yet. */
export const MOCK_PARKING_LOGS = [
  {
    id: 'log-001',
    eventType: 'entry',
    category: 'resident',
    vehicleNumber: 'MH12AB1234',
    vehicleType: 'Car',
    personName: 'Rahul Sharma',
    flatNumber: 'B-804',
    parkingNumber: 'B1-01',
    timestamp: dayOffsetIso(0, 10, 42),
    recordedBy: 'Guard',
  },
  {
    id: 'log-002',
    eventType: 'exit',
    category: 'resident',
    vehicleNumber: 'MH12XY9876',
    vehicleType: 'Bike',
    personName: 'Amit Kumar',
    flatNumber: 'A-302',
    parkingNumber: 'B1-03',
    timestamp: dayOffsetIso(0, 10, 31),
    entryTime: dayOffsetIso(0, 8, 17),
    recordedBy: 'Guard',
  },
  {
    id: 'log-003',
    eventType: 'entry',
    category: 'visitor',
    vehicleNumber: 'MH04CD5678',
    vehicleType: 'Car',
    personName: 'Ramesh Kumar',
    flatNumber: 'B-804',
    parkingNumber: 'V-02',
    timestamp: dayOffsetIso(0, 10, 18),
    recordedBy: 'Guard',
  },
  {
    id: 'log-004',
    eventType: 'exit',
    category: 'visitor',
    vehicleNumber: 'MH04EF7890',
    vehicleType: 'Car',
    personName: 'Suresh Kumar',
    flatNumber: 'A-302',
    parkingNumber: 'V-01',
    timestamp: dayOffsetIso(0, 9, 55),
    entryTime: dayOffsetIso(0, 8, 13),
    recordedBy: 'Guard',
  },
  {
    id: 'log-005',
    eventType: 'entry',
    category: 'resident',
    vehicleNumber: 'MH14CD4411',
    vehicleType: 'Car',
    personName: 'Priya Patel',
    flatNumber: 'C-110',
    parkingNumber: 'B2-01',
    timestamp: dayOffsetIso(0, 9, 12),
    recordedBy: 'Guard',
  },
  {
    id: 'log-006',
    eventType: 'exit',
    category: 'resident',
    vehicleNumber: 'MH12AB1234',
    vehicleType: 'Car',
    personName: 'Rahul Sharma',
    flatNumber: 'B-804',
    parkingNumber: 'B1-01',
    timestamp: dayOffsetIso(1, 20, 30),
    entryTime: dayOffsetIso(1, 18, 5),
    recordedBy: 'Guard',
  },
  {
    id: 'log-007',
    eventType: 'entry',
    category: 'visitor',
    vehicleNumber: 'MH02GH3344',
    vehicleType: 'Bike',
    personName: 'Neha Joshi',
    flatNumber: 'B-804',
    parkingNumber: 'V-03',
    timestamp: dayOffsetIso(1, 16, 40),
    recordedBy: 'Guard',
  },
  {
    id: 'log-008',
    eventType: 'exit',
    category: 'visitor',
    vehicleNumber: 'MH02GH3344',
    vehicleType: 'Bike',
    personName: 'Neha Joshi',
    flatNumber: 'B-804',
    parkingNumber: 'V-03',
    timestamp: dayOffsetIso(1, 18, 10),
    entryTime: dayOffsetIso(1, 16, 40),
    recordedBy: 'Guard',
  },
  {
    id: 'log-009',
    eventType: 'entry',
    category: 'resident',
    vehicleNumber: 'MH12XY9876',
    vehicleType: 'Bike',
    personName: 'Amit Kumar',
    flatNumber: 'A-302',
    parkingNumber: 'B1-03',
    timestamp: dayOffsetIso(3, 11, 5),
    recordedBy: 'Guard',
  },
  {
    id: 'log-010',
    eventType: 'exit',
    category: 'resident',
    vehicleNumber: 'MH14CD4411',
    vehicleType: 'Car',
    personName: 'Priya Patel',
    flatNumber: 'C-110',
    parkingNumber: 'B2-01',
    timestamp: dayOffsetIso(5, 19, 22),
    entryTime: dayOffsetIso(5, 17, 40),
    recordedBy: 'Guard',
  },
  {
    id: 'log-011',
    eventType: 'entry',
    category: 'visitor',
    vehicleNumber: 'MH09JK5566',
    vehicleType: 'Car',
    personName: 'Vikram Shah',
    flatNumber: 'C-110',
    parkingNumber: 'V-04',
    timestamp: dayOffsetIso(8, 14, 15),
    recordedBy: 'Guard',
  },
  {
    id: 'log-012',
    eventType: 'exit',
    category: 'visitor',
    vehicleNumber: 'MH09JK5566',
    vehicleType: 'Car',
    personName: 'Vikram Shah',
    flatNumber: 'C-110',
    parkingNumber: 'V-04',
    timestamp: dayOffsetIso(8, 15, 50),
    entryTime: dayOffsetIso(8, 14, 15),
    recordedBy: 'Guard',
  },
];

/** Map session / legacy rows into the canonical log shape. */
export function normalizeParkingLog(row) {
  if (!row || typeof row !== 'object') return null;

  if (row.eventType && row.timestamp) {
    return {
      id: String(row.id || `log-${row.timestamp}`),
      eventType: String(row.eventType).toLowerCase() === 'exit' ? 'exit' : 'entry',
      category: String(row.category || '').toLowerCase() === 'visitor' ? 'visitor' : 'resident',
      vehicleNumber: row.vehicleNumber || null,
      vehicleType: row.vehicleType || null,
      personName: row.personName || row.name || null,
      flatNumber: row.flatNumber || row.flat || null,
      parkingNumber: row.parkingNumber || row.slotCode || null,
      timestamp: row.timestamp || row.at || null,
      entryTime: row.entryTime || null,
      recordedBy: row.recordedBy || 'Guard',
    };
  }

  const kind = String(row.kind || '').toLowerCase();
  const isExit = kind.startsWith('exit') || /exit/i.test(row.label || '');
  const isVisitor = kind.includes('visitor') || /visitor/i.test(row.label || '');

  return {
    id: String(row.id || `log-${row.at || Date.now()}`),
    eventType: isExit ? 'exit' : 'entry',
    category: isVisitor ? 'visitor' : 'resident',
    vehicleNumber: row.vehicleNumber || null,
    vehicleType: row.vehicleType || null,
    personName: row.personName || row.name || null,
    flatNumber: row.flatNumber || row.flat || null,
    parkingNumber: row.parkingNumber || row.slotCode || null,
    timestamp: row.timestamp || row.at || null,
    entryTime: row.entryTime || null,
    recordedBy: row.recordedBy || 'Guard',
  };
}

export function resolveParkingLogs(localRows = []) {
  const normalized = (Array.isArray(localRows) ? localRows : [])
    .map(normalizeParkingLog)
    .filter(Boolean)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (normalized.length > 0) return { logs: normalized, source: 'local' };
  return {
    logs: MOCK_PARKING_LOGS.map(normalizeParkingLog).filter(Boolean),
    source: 'mock',
  };
}

export function formatLogClock(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function formatLogWhen(iso, now = new Date()) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';

  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);

  const clock = formatLogClock(iso);
  if (d >= startToday) return clock;
  if (d >= startYesterday) return `Yesterday, ${clock}`;

  const day = d.getDate();
  const mon = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  if (year === now.getFullYear()) return `${day} ${mon}, ${clock}`;
  return `${day} ${mon} ${year}, ${clock}`;
}

export function formatLogDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const day = d.getDate();
  const mon = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${mon} ${year}`;
}

export function formatDuration(entryIso, exitIso) {
  if (!entryIso || !exitIso) return '—';
  const a = new Date(entryIso).getTime();
  const b = new Date(exitIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return '—';
  const mins = Math.round((b - a) / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Attach duration for exits (use entryTime or find prior matching entry). */
export function withLogDurations(logs) {
  return logs.map((log) => {
    if (log.eventType !== 'exit') return { ...log, duration: '—' };
    if (log.entryTime) {
      return { ...log, duration: formatDuration(log.entryTime, log.timestamp) };
    }
    const prior = logs.find(
      (r) =>
        r.eventType === 'entry' &&
        r.vehicleNumber &&
        r.vehicleNumber === log.vehicleNumber &&
        r.parkingNumber === log.parkingNumber &&
        new Date(r.timestamp) <= new Date(log.timestamp),
    );
    if (!prior) return { ...log, duration: '—', entryTime: null };
    return {
      ...log,
      entryTime: prior.timestamp,
      duration: formatDuration(prior.timestamp, log.timestamp),
    };
  });
}

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function dateRangeForPreset(preset, customFrom, customTo, now = new Date()) {
  const today = startOfDay(now);
  if (preset === 'today') {
    return { from: today, to: endOfDay(now) };
  }
  if (preset === 'yesterday') {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return { from: y, to: endOfDay(y) };
  }
  if (preset === '7d') {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from, to: endOfDay(now) };
  }
  if (preset === '30d') {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { from, to: endOfDay(now) };
  }
  if (preset === 'custom') {
    const from = customFrom ? startOfDay(new Date(customFrom)) : today;
    const to = customTo ? endOfDay(new Date(customTo)) : endOfDay(now);
    return { from, to };
  }
  return { from: today, to: endOfDay(now) };
}

export function summarizeLogs(logs, now = new Date()) {
  const { from, to } = dateRangeForPreset('today', null, null, now);
  const todayRows = logs.filter((l) => {
    const t = new Date(l.timestamp).getTime();
    return t >= from.getTime() && t <= to.getTime();
  });

  const entries = todayRows.filter((l) => l.eventType === 'entry').length;
  const exits = todayRows.filter((l) => l.eventType === 'exit').length;
  const resident = todayRows.filter((l) => l.category === 'resident').length;
  const visitor = todayRows.filter((l) => l.category === 'visitor').length;

  return { entries, exits, resident, visitor };
}
