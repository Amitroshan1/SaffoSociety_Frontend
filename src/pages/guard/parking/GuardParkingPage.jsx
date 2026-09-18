import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/common/crud.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import {
  FormField,
  FormSelect,
  SearchInput,
  ConfirmDialog,
} from '../../../components/common/index.js';
import SearchableParkingCode from '../../../components/guard/parking/SearchableParkingCode.jsx';
import ParkingLogsPanel from '../../../components/guard/parking/ParkingLogsPanel.jsx';
import {
  createGuardVisitorParking,
  formatLabel,
  listTodayGuardParking,
  recordParkingEntry,
  recordParkingExit,
} from '../../../services/parking.service.js';

/**
 * Park+-ready slot shape (frontend model):
 * {
 *   id, slotCode, compartment, category: 'resident'|'visitor',
 *   allottee: { name, flat, vehicleNumber, vehicleType } | null,
 *   occupancy: { status, entryAt, exitAt, visitorName?, visitingFlat? }
 * }
 */

const OVERRIDE_KEY = 'gm-park-simple-overrides';
const LOGS_KEY = 'gm-park-simple-logs';

const DEMO_RESIDENT = [
  {
    id: 'demo-r-b1-01',
    slotCode: 'B1-01',
    compartment: 'B1',
    category: 'resident',
    allottee: {
      name: 'Rahul Sharma',
      flat: 'B-804',
      vehicleNumber: 'MH12AB1234',
      vehicleType: 'car',
      role: 'Owner',
    },
    occupancy: { status: 'outside', entryAt: null, exitAt: null },
  },
  {
    id: 'demo-r-b1-02',
    slotCode: 'B1-02',
    compartment: 'B1',
    category: 'resident',
    allottee: {
      name: 'Amit Kumar',
      flat: 'A-302',
      vehicleNumber: 'MH12XY9876',
      vehicleType: 'bike',
      role: 'Tenant',
    },
    occupancy: { status: 'outside', entryAt: null, exitAt: null },
  },
  {
    id: 'demo-r-b2-01',
    slotCode: 'B2-01',
    compartment: 'B2',
    category: 'resident',
    allottee: {
      name: 'Priya Patel',
      flat: 'C-110',
      vehicleNumber: 'MH14CD4411',
      vehicleType: 'car',
      role: 'Owner',
    },
    occupancy: { status: 'outside', entryAt: null, exitAt: null },
  },
];

const DEMO_VISITOR = [
  { id: 'demo-v-01', slotCode: 'V-01', compartment: 'Visitor', category: 'visitor', allottee: null, occupancy: { status: 'available', entryAt: null, exitAt: null } },
  { id: 'demo-v-02', slotCode: 'V-02', compartment: 'Visitor', category: 'visitor', allottee: null, occupancy: { status: 'available', entryAt: null, exitAt: null } },
  { id: 'demo-v-03', slotCode: 'V-03', compartment: 'Visitor', category: 'visitor', allottee: null, occupancy: { status: 'available', entryAt: null, exitAt: null } },
  { id: 'demo-v-04', slotCode: 'V-04', compartment: 'Visitor', category: 'visitor', allottee: null, occupancy: { status: 'available', entryAt: null, exitAt: null } },
];

const VISITOR_TYPES = [
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'other', label: 'Other' },
];

function nowIso() {
  return new Date().toISOString();
}

function formatParkTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  } catch {
    return '—';
  }
}

function normalizeType(type) {
  const t = String(type || '').toLowerCase();
  if (t === 'car') return 'car';
  if (['bike', 'scooter', 'bicycle'].includes(t)) return 'bike';
  return t ? 'other' : '';
}

function normVehicle(value) {
  return String(value || '')
    .replace(/[\s-]/g, '')
    .toLowerCase();
}

function isVisitorApiSlot(slot) {
  const cat = String(slot?.slotCategory || slot?.category || '').toLowerCase();
  return cat === 'visitor' || String(slot?.status || '').toLowerCase() === 'visitor';
}

function compartmentOf(code) {
  const s = String(code || '').trim();
  if (!s) return 'B2';
  if (/^v[-_]?\d+/i.test(s) || /^visitor/i.test(s)) return 'Visitor';

  // Normal floors/blocks: B1-01, B2/03, LG-12, P1_04
  const floorMatch = s.match(/^([A-Za-z]{1,3}\d{0,2}|LG|UG|P\d+|B\d+|G\d+|F\d+)(?=[-_/]|$)/i);
  if (floorMatch) {
    const raw = floorMatch[1].toUpperCase();
    const block = raw.match(/^([A-Z]+)(\d+)?$/);
    if (block) {
      const letter = block[1];
      const num = block[2];
      // Keep classic B1 / B2 / B3 style when possible
      if (letter === 'B' && num) return `B${num}`;
      return `${letter}${num || ''}`.toUpperCase();
    }
    return raw;
  }

  // Non-standard codes → B2 / B3 (never "Other")
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) hash += s.charCodeAt(i);
  return hash % 2 === 0 ? 'B2' : 'B3';
}

function readOverrides() {
  try {
    return JSON.parse(sessionStorage.getItem(OVERRIDE_KEY) || '{}');
  } catch {
    return {};
  }
}

function readLogs() {
  try {
    const rows = JSON.parse(sessionStorage.getItem(LOGS_KEY) || '[]');
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function pushParkLog(entry) {
  const next = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: entry.timestamp || nowIso(),
      recordedBy: entry.recordedBy || 'Guard',
      ...entry,
    },
    ...readLogs(),
  ].slice(0, 120);
  try {
    sessionStorage.setItem(LOGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}

function StatusPill({ status }) {
  const s = String(status || '').toLowerCase();
  const label =
    s === 'inside'
      ? 'Inside'
      : s === 'outside'
        ? 'Outside'
        : s === 'occupied'
          ? 'Filled'
          : s === 'available'
            ? 'Free'
            : status || '—';
  return <span className={`gm-pcd-pill gm-pcd-pill--${s}`}>{label}</span>;
}

function mapApiToSlots(apiData) {
  const slots = apiData?.slots || [];
  const parked = apiData?.parkedVehicles || apiData?.vehicles || [];
  const codes = apiData?.parkingCodes || [];
  const visitorLogs = apiData?.activeVisitorParking || [];

  const insideByCode = new Map();
  const insideByVehicle = new Map();
  for (const v of parked) {
    if (v.kind === 'visitor') continue;
    if (v.slotCode) insideByCode.set(String(v.slotCode).toLowerCase(), v);
    if (v.parkingCode) insideByCode.set(String(v.parkingCode).toLowerCase(), v);
    if (v.vehicleNumber) insideByVehicle.set(String(v.vehicleNumber).toLowerCase(), v);
  }

  const resident = [];
  const seen = new Set();

  for (const s of slots) {
    if (isVisitorApiSlot(s)) continue;
    const status = String(s.status || '').toLowerCase();
    if (!['allocated', 'reserved', 'occupied'].includes(status) && !s.vehicleNumber) continue;
    const slotCode = s.slotCode || s.code;
    if (!slotCode) continue;
    const key = String(slotCode).toLowerCase();
    seen.add(key);
    const parkedRow =
      insideByCode.get(key) ||
      (s.vehicleNumber && insideByVehicle.get(String(s.vehicleNumber).toLowerCase())) ||
      null;
    const codeMeta = codes.find(
      (c) => c.kind === 'resident' && String(c.code || '').toLowerCase() === key,
    );
    const vehicleNumber =
      parkedRow?.vehicleNumber || s.vehicleNumber || codeMeta?.vehicleNumber || null;
    resident.push({
      id: s.id || `r-${key}`,
      slotCode,
      compartment: compartmentOf(slotCode),
      category: 'resident',
      allottee: vehicleNumber
        ? {
            name: parkedRow?.residentName || null,
            flat: parkedRow?.flat || parkedRow?.flatNumber || null,
            vehicleNumber,
            vehicleType: normalizeType(parkedRow?.vehicleType || codeMeta?.vehicleType),
          }
        : null,
      occupancy: {
        status: parkedRow || status === 'occupied' ? 'inside' : 'outside',
        entryAt: parkedRow?.entryAt || null,
        exitAt: null,
      },
      slotId: s.id || null,
    });
  }

  for (const c of codes) {
    if (c.kind !== 'resident') continue;
    const key = String(c.code || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const parkedRow =
      insideByCode.get(key) ||
      (c.vehicleNumber && insideByVehicle.get(String(c.vehicleNumber).toLowerCase())) ||
      null;
    resident.push({
      id: parkedRow?.id || `r-${key}`,
      slotCode: c.code,
      compartment: compartmentOf(c.code),
      category: 'resident',
      allottee: {
        name: parkedRow?.residentName || null,
        flat: null,
        vehicleNumber: parkedRow?.vehicleNumber || c.vehicleNumber || null,
        vehicleType: normalizeType(parkedRow?.vehicleType || c.vehicleType),
      },
      occupancy: {
        status: parkedRow ? 'inside' : 'outside',
        entryAt: parkedRow?.entryAt || null,
        exitAt: null,
      },
      slotId: parkedRow?.slotId || null,
    });
  }

  const visitor = [];
  const vSeen = new Set();
  const visitorApiSlots = slots.filter(isVisitorApiSlot);

  for (const s of visitorApiSlots) {
    const slotCode = s.slotCode || s.code;
    const key = String(slotCode).toLowerCase();
    vSeen.add(key);
    const log = visitorLogs.find(
      (l) =>
        (s.id && l.slotId && String(l.slotId) === String(s.id)) ||
        (slotCode && l.parkingCode && l.parkingCode === slotCode),
    );
    const parkedV = parked.find(
      (v) =>
        v.kind === 'visitor' &&
        ((s.id && v.slotId && String(v.slotId) === String(s.id)) ||
          (slotCode && (v.slotCode === slotCode || v.parkingCode === slotCode))),
    );
    const occ = parkedV || log || null;
    const meta = occ?.metadata || {};
    visitor.push({
      id: s.id || `v-${key}`,
      slotCode,
      compartment: 'Visitor',
      category: 'visitor',
      allottee: null,
      occupancy: occ
        ? {
            status: 'occupied',
            entryAt: occ.entryAt || null,
            exitAt: occ.exitAt || null,
            visitorName: occ.visitorName || meta.visitorName || meta.name || null,
            visitingFlat: occ.visitingResident || meta.visitingResident || meta.flat || null,
            vehicleNumber: occ.vehicleNumber || null,
            vehicleType: normalizeType(occ.vehicleType),
            visitorLogId: occ.id || null,
          }
        : { status: 'available', entryAt: null, exitAt: null },
      slotId: s.id || null,
    });
  }

  for (const log of visitorLogs) {
    const slotCode = log.parkingCode || log.slotCode;
    if (!slotCode) continue;
    const key = String(slotCode).toLowerCase();
    if (vSeen.has(key)) continue;
    vSeen.add(key);
    const meta = log.metadata || {};
    visitor.push({
      id: log.id || `v-${key}`,
      slotCode,
      compartment: 'Visitor',
      category: 'visitor',
      allottee: null,
      occupancy: {
        status: 'occupied',
        entryAt: log.entryAt || null,
        exitAt: log.exitAt || null,
        visitorName: meta.visitorName || meta.name || null,
        visitingFlat: meta.visitingResident || meta.flat || null,
        vehicleNumber: log.vehicleNumber || null,
        vehicleType: normalizeType(log.vehicleType),
        visitorLogId: log.id,
      },
      slotId: log.slotId || null,
    });
  }

  return {
    resident: resident.length ? resident : DEMO_RESIDENT,
    visitor: visitor.length ? visitor : DEMO_VISITOR,
    usedDemo: !resident.length || !visitor.length,
  };
}

export default function GuardParkingPage() {
  const navigate = useNavigate();
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState('resident');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [compartment, setCompartment] = useState('all');
  const [overrides, setOverrides] = useState(readOverrides);
  const [parkLogs, setParkLogs] = useState(readLogs);

  const [panel, setPanel] = useState(null);
  const [selected, setSelected] = useState(null);
  const [confirmExit, setConfirmExit] = useState(null);

  const [residentForm, setResidentForm] = useState({ slotKey: '', vehicleNumber: '' });
  const [visitorForm, setVisitorForm] = useState({
    visitorName: '',
    vehicleNumber: '',
    visitingFlat: '',
    vehicleType: 'car',
    slotKey: '',
  });
  const [exitForm, setExitForm] = useState({ matchKey: '', vehicleNumber: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listTodayGuardParking();
      setApiData(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load parking");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Parking | Guard Dashboard';
    load();
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, [load]);

  useEffect(() => {
    try {
      sessionStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
    } catch {
      /* ignore */
    }
  }, [overrides]);

  useEffect(() => {
    if (!panel && !selected && !confirmExit) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (confirmExit) setConfirmExit(null);
      else if (selected) setSelected(null);
      else closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, selected, confirmExit]);

  function closePanel() {
    setPanel(null);
    setResidentForm({ slotKey: '', vehicleNumber: '' });
    setVisitorForm({
      visitorName: '',
      vehicleNumber: '',
      visitingFlat: '',
      vehicleType: 'car',
      slotKey: '',
    });
    setExitForm({ matchKey: '', vehicleNumber: '' });
  }

  function patchSlot(id, patch) {
    setOverrides((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch },
    }));
  }

  const mapped = useMemo(() => mapApiToSlots(apiData), [apiData]);

  const residentSlots = useMemo(
    () =>
      mapped.resident.map((s) => {
        const ov = overrides[s.id];
        if (!ov) return s;
        return {
          ...s,
          allottee: ov.allottee !== undefined ? ov.allottee : s.allottee,
          occupancy: { ...s.occupancy, ...ov.occupancy },
        };
      }),
    [mapped.resident, overrides],
  );

  const visitorSlots = useMemo(
    () =>
      mapped.visitor.map((s) => {
        const ov = overrides[s.id];
        if (!ov) return s;
        return {
          ...s,
          occupancy: { ...s.occupancy, ...ov.occupancy },
        };
      }),
    [mapped.visitor, overrides],
  );

  const summary = useMemo(() => {
    const inside = residentSlots.filter((s) => s.occupancy.status === 'inside').length;
    const outside = residentSlots.filter((s) => s.occupancy.status === 'outside').length;
    const filled = visitorSlots.filter((s) => s.occupancy.status === 'occupied').length;
    const free = visitorSlots.filter((s) => s.occupancy.status === 'available').length;
    return { inside, outside, filled, free, visitorTotal: visitorSlots.length };
  }, [residentSlots, visitorSlots]);

  const compartments = useMemo(() => {
    if (tab === 'logs') return [];
    const source = tab === 'resident' ? residentSlots : visitorSlots;
    const map = new Map();
    for (const s of source) {
      const key = s.compartment || 'B2';
      if (!map.has(key)) map.set(key, { key, total: 0, inside: 0, outside: 0, free: 0, filled: 0 });
      const row = map.get(key);
      row.total += 1;
      if (s.category === 'resident') {
        if (s.occupancy.status === 'inside') row.inside += 1;
        else row.outside += 1;
      } else if (s.occupancy.status === 'available') row.free += 1;
      else row.filled += 1;
    }
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [tab, residentSlots, visitorSlots]);

  const filtered = useMemo(() => {
    if (tab === 'logs') return [];
    const source = tab === 'resident' ? residentSlots : visitorSlots;
    const term = search.trim().toLowerCase();
    return source
      .filter((s) => {
        if (compartment !== 'all' && s.compartment !== compartment) return false;
        const st = s.occupancy.status;
        if (statusFilter === 'inside' && st !== 'inside') return false;
        if (statusFilter === 'outside' && st !== 'outside') return false;
        if (statusFilter === 'free' && st !== 'available') return false;
        if (statusFilter === 'filled' && st !== 'occupied') return false;
        if (!term) return true;
        const hay = [
          s.slotCode,
          s.compartment,
          s.allottee?.name,
          s.allottee?.flat,
          s.allottee?.vehicleNumber,
          s.occupancy?.visitorName,
          s.occupancy?.visitingFlat,
          s.occupancy?.vehicleNumber,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(term);
      })
      .sort((a, b) => String(a.slotCode).localeCompare(String(b.slotCode)));
  }, [tab, residentSlots, visitorSlots, compartment, statusFilter, search]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const s of filtered) {
      const key = s.compartment || 'B2';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return Array.from(map.entries()).map(([key, rows]) => ({ key, rows }));
  }, [filtered]);

  const matchedResident = useMemo(() => {
    if (residentForm.slotKey) {
      return residentSlots.find((s) => s.id === residentForm.slotKey) || null;
    }
    const term = normVehicle(residentForm.vehicleNumber);
    if (term.length < 4) return null;

    const exact = residentSlots.find(
      (s) => normVehicle(s.allottee?.vehicleNumber) === term,
    );
    if (exact) return exact;

    const partial = residentSlots.filter((s) => {
      const v = normVehicle(s.allottee?.vehicleNumber);
      return v && (v.includes(term) || term.includes(v));
    });
    return partial.length === 1 ? partial[0] : null;
  }, [residentForm, residentSlots]);

  const residentLookupTried =
    panel === 'residentEntry' && normVehicle(residentForm.vehicleNumber).length >= 4;

  const exitMatch = useMemo(() => {
    if (panel !== 'vehicleExit') return null;
    const term = normVehicle(exitForm.vehicleNumber);
    if (term.length < 4) return null;

    const insideResidents = residentSlots.filter((s) => s.occupancy.status === 'inside');
    const filledVisitors = visitorSlots.filter((s) => s.occupancy.status === 'occupied');

    const matchIn = (pool, getVehicle) => {
      const exact = pool.find((s) => normVehicle(getVehicle(s)) === term);
      if (exact) return exact;
      const partial = pool.filter((s) => {
        const v = normVehicle(getVehicle(s));
        return v && (v.includes(term) || term.includes(v));
      });
      return partial.length === 1 ? partial[0] : null;
    };

    // Prefer exact resident match, then visitor (vehicle no only)
    return (
      matchIn(insideResidents, (s) => s.allottee?.vehicleNumber) ||
      matchIn(filledVisitors, (s) => s.occupancy.vehicleNumber) ||
      null
    );
  }, [exitForm.vehicleNumber, panel, residentSlots, visitorSlots]);

  const vehicleExitLookupTried =
    panel === 'vehicleExit' && normVehicle(exitForm.vehicleNumber).length >= 4;

  const freeVisitorOptions = useMemo(
    () =>
      visitorSlots
        .filter((s) => s.occupancy.status === 'available')
        .map((s) => ({
          id: s.id,
          code: s.slotCode,
          slotCode: s.slotCode,
          status: 'available',
          kind: 'visitor',
          label: s.slotCode,
        })),
    [visitorSlots],
  );

  async function confirmResidentEntry() {
    const slot = matchedResident;
    if (!slot) {
      setError('Enter vehicle number to find resident');
      return;
    }
    if (slot.occupancy.status === 'inside') {
      setError('Already inside');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (slot.slotId || slot.allottee?.vehicleNumber) {
        try {
          await recordParkingEntry({
            slotId: slot.slotId || null,
            vehicleNumber: slot.allottee?.vehicleNumber || null,
          });
        } catch {
          /* local track still updates */
        }
      }
      const entryAt = nowIso();
      patchSlot(slot.id, {
        occupancy: { status: 'inside', entryAt, exitAt: null },
      });
      setParkLogs(
        pushParkLog({
          eventType: 'entry',
          category: 'resident',
          vehicleNumber: slot.allottee?.vehicleNumber || null,
          vehicleType: formatLabel(slot.allottee?.vehicleType) || null,
          personName: slot.allottee?.name || null,
          flatNumber: slot.allottee?.flat || null,
          parkingNumber: slot.slotCode,
          timestamp: entryAt,
          recordedBy: 'Guard',
        }),
      );
      setSuccess(`Entry · ${slot.slotCode}`);
      closePanel();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Entry failed');
    } finally {
      setBusy(false);
    }
  }

  async function confirmVisitorEntry() {
    const { visitorName, vehicleNumber, visitingFlat, vehicleType, slotKey } = visitorForm;
    if (!visitorName.trim() || !vehicleNumber.trim() || !visitingFlat.trim() || !slotKey) {
      setError('Fill visitor details and pick a free slot');
      return;
    }
    const slot = visitorSlots.find((s) => s.id === slotKey);
    if (!slot || slot.occupancy.status !== 'available') {
      setError('Slot not free');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (slot.slotId) {
        try {
          await createGuardVisitorParking({
            vehicleNumber: vehicleNumber.trim(),
            vehicleType,
            slotId: slot.slotId,
            purpose: null,
            metadata: {
              visitorName: visitorName.trim(),
              visitingResident: visitingFlat.trim(),
            },
          });
        } catch {
          /* local */
        }
      }
      const entryAt = nowIso();
      patchSlot(slot.id, {
        occupancy: {
          status: 'occupied',
          entryAt,
          exitAt: null,
          visitorName: visitorName.trim(),
          visitingFlat: visitingFlat.trim(),
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          vehicleType,
        },
      });
      setParkLogs(
        pushParkLog({
          eventType: 'entry',
          category: 'visitor',
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          vehicleType: formatLabel(vehicleType) || null,
          personName: visitorName.trim(),
          flatNumber: visitingFlat.trim(),
          parkingNumber: slot.slotCode,
          timestamp: entryAt,
          recordedBy: 'Guard',
        }),
      );
      setSuccess(`Visitor parked · ${slot.slotCode}`);
      setTab('visitor');
      closePanel();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Visitor entry failed');
    } finally {
      setBusy(false);
    }
  }

  async function performExit(slot) {
    if (!slot) return;
    const isVisitor = slot.category === 'visitor';
    setBusy(true);
    setError('');
    try {
      try {
        const payload = {
          slotId: slot.slotId || null,
          vehicleNumber: slot.allottee?.vehicleNumber || slot.occupancy.vehicleNumber || null,
        };
        if (isVisitor && slot.occupancy.visitorLogId) {
          payload.visitorLogId = slot.occupancy.visitorLogId;
        }
        await recordParkingExit(payload);
      } catch {
        /* local */
      }
      const exitAt = nowIso();
      if (isVisitor) {
        const entryTime = slot.occupancy.entryAt || null;
        patchSlot(slot.id, {
          occupancy: {
            status: 'available',
            entryAt: null,
            exitAt,
            visitorName: null,
            visitingFlat: null,
            vehicleNumber: null,
            vehicleType: null,
            visitorLogId: null,
          },
        });
        setParkLogs(
          pushParkLog({
            eventType: 'exit',
            category: 'visitor',
            vehicleNumber: slot.occupancy.vehicleNumber || null,
            vehicleType: formatLabel(slot.occupancy.vehicleType) || null,
            personName: slot.occupancy.visitorName || null,
            flatNumber: slot.occupancy.visitingFlat || null,
            parkingNumber: slot.slotCode,
            timestamp: exitAt,
            entryTime,
            recordedBy: 'Guard',
          }),
        );
      } else {
        const entryTime = slot.occupancy.entryAt || null;
        patchSlot(slot.id, {
          occupancy: { status: 'outside', entryAt: null, exitAt },
        });
        setParkLogs(
          pushParkLog({
            eventType: 'exit',
            category: 'resident',
            vehicleNumber: slot.allottee?.vehicleNumber || null,
            vehicleType: formatLabel(slot.allottee?.vehicleType) || null,
            personName: slot.allottee?.name || null,
            flatNumber: slot.allottee?.flat || null,
            parkingNumber: slot.slotCode,
            timestamp: exitAt,
            entryTime,
            recordedBy: 'Guard',
          }),
        );
      }
      setSuccess(`Exit · ${slot.slotCode}`);
      setConfirmExit(null);
      setSelected(null);
      closePanel();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Exit failed');
    } finally {
      setBusy(false);
    }
  }

  function openEntry(kind) {
    setError('');
    setSuccess('');
    if (kind === 'visitor') {
      setTab('visitor');
      setPanel('visitorEntry');
      return;
    }
    setTab('resident');
    setPanel('residentEntry');
  }

  function openExit() {
    setError('');
    setSuccess('');
    setExitForm({ matchKey: '', vehicleNumber: '' });
    setPanel('vehicleExit');
  }

  const isExitPanel = panel === 'vehicleExit';

  return (
    <div className="gm-root">
      <Sidebar activePage="Parking" onNavigate={(label) => navigateGuard(navigate, label)} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main gm-park-page gm-pcd">
          <div className="gm-park-topbar">
            <div className="gm-park-page-head">
              <h2 className="gm-park-page-title">Parking</h2>
            </div>
            <div className="gm-park-toolbar-btns">
              {tab !== 'logs' ? (
                <>
                  <button
                    type="button"
                    className="gm-park-action-btn gm-park-action-btn--entry"
                    onClick={() => openEntry('resident')}
                  >
                    Resident Entry
                  </button>
                  <button
                    type="button"
                    className="gm-park-action-btn gm-park-action-btn--visitor"
                    onClick={() => openEntry('visitor')}
                  >
                    Visitor Entry
                  </button>
                  <button
                    type="button"
                    className="gm-park-action-btn gm-park-action-btn--exit"
                    onClick={openExit}
                  >
                    Vehicle Exit
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {error ? <div className="gm-park-alert gm-park-alert--error">{error}</div> : null}
          {success ? <div className="gm-park-alert gm-park-alert--ok">{success}</div> : null}

          {tab !== 'logs' ? (
          <div className="gm-park-summary">
            <div className="glass-card gm-park-stat gm-park-stat--ok">
              <strong>{loading ? '—' : summary.inside}</strong>
              <span className="gm-park-stat-label">Residents Inside</span>
            </div>
            <div className="glass-card gm-park-stat">
              <strong>{loading ? '—' : summary.outside}</strong>
              <span className="gm-park-stat-label">Residents Outside</span>
            </div>
            <div className="glass-card gm-park-stat gm-park-stat--warn">
              <strong>
                {loading ? '—' : `${summary.filled}/${summary.visitorTotal}`}
              </strong>
              <span className="gm-park-stat-label">Visitor Filled</span>
            </div>
            <div className="glass-card gm-park-stat gm-park-stat--info">
              <strong>{loading ? '—' : summary.free}</strong>
              <span className="gm-park-stat-label">Visitor Free</span>
            </div>
          </div>
          ) : null}

          <section className="glass-card gm-pcd-live">
            <div className="gm-pcd-live-head">
              <div className="gm-pcd-tabs">
                <button
                  type="button"
                  className={tab === 'resident' ? 'is-active' : ''}
                  onClick={() => {
                    setTab('resident');
                    setCompartment('all');
                    setStatusFilter('all');
                    setSearch('');
                  }}
                >
                  Resident Parking
                </button>
                <button
                  type="button"
                  className={tab === 'visitor' ? 'is-active' : ''}
                  onClick={() => {
                    setTab('visitor');
                    setCompartment('all');
                    setStatusFilter('all');
                    setSearch('');
                  }}
                >
                  Visitor Parking
                </button>
                <button
                  type="button"
                  className={tab === 'logs' ? 'is-active' : ''}
                  onClick={() => {
                    setTab('logs');
                    setParkLogs(readLogs());
                    setSearch('');
                    setCompartment('all');
                    setStatusFilter('all');
                  }}
                >
                  Logs
                </button>
              </div>
            </div>

            {tab === 'logs' ? (
              <ParkingLogsPanel localLogs={parkLogs} />
            ) : (
              <>
            <div className="gm-park-controlbar gm-pcd-filters">
              <div className="gm-park-search">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder={
                    tab === 'resident'
                      ? 'Search slot, resident, vehicle, flat'
                      : 'Search visitor slot, name, vehicle, flat'
                  }
                  debounceMs={200}
                />
              </div>
              <label className="gm-park-filter gm-park-filter--inline">
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  {tab === 'resident' ? (
                    <>
                      <option value="inside">Inside</option>
                      <option value="outside">Outside</option>
                    </>
                  ) : (
                    <>
                      <option value="free">Free</option>
                      <option value="filled">Filled</option>
                    </>
                  )}
                </select>
              </label>
            </div>

            {compartments.length > 0 ? (
              <div className="gm-pcd-floor-chips" role="tablist" aria-label="Floor">
                <button
                  type="button"
                  className={compartment === 'all' ? 'is-active' : ''}
                  onClick={() => setCompartment('all')}
                >
                  All
                </button>
                {compartments.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={compartment === c.key ? 'is-active' : ''}
                    onClick={() => setCompartment(c.key)}
                  >
                    {c.key}
                  </button>
                ))}
              </div>
            ) : null}

            {loading ? (
              <div className="gm-pcd-empty">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="gm-pcd-empty">
                {tab === 'resident'
                  ? 'No resident slots match.'
                  : 'No visitor slots match.'}
              </div>
            ) : (
              <div className="gm-pcd-board">
                <div className="gm-pcd-rows">
                  <div className="gm-pcd-rows-head" aria-hidden>
                    <span>Parking No</span>
                    <span>Status</span>
                    <span>{tab === 'resident' ? 'Allotted' : 'Visitor'}</span>
                    <span>Vehicle</span>
                    <span>Time</span>
                  </div>
                  {groups.map((g) => (
                    <div key={g.key} className="gm-pcd-floor-block">
                      <div className="gm-pcd-floor-head">
                        <h4>{g.key}</h4>
                        <span>{g.rows.length}</span>
                      </div>
                      {g.rows.map((s) => {
                        const isVisitor = s.category === 'visitor';
                        const st = s.occupancy.status;
                        const name = isVisitor
                          ? st === 'available'
                            ? '—'
                            : s.occupancy.visitorName || 'Visitor'
                          : s.allottee?.name || 'Unassigned';
                        const vehicle = isVisitor
                          ? s.occupancy.vehicleNumber || '—'
                          : s.allottee?.vehicleNumber || '—';
                        const detail = isVisitor
                          ? st === 'available'
                            ? 'Free'
                            : `Flat ${s.occupancy.visitingFlat || '—'}`
                          : s.allottee?.flat
                            ? `Flat ${s.allottee.flat}`
                            : formatLabel(s.allottee?.vehicleType) || '—';
                        const time =
                          st === 'inside' || st === 'occupied'
                            ? formatParkTime(s.occupancy.entryAt)
                            : s.occupancy.exitAt
                              ? formatParkTime(s.occupancy.exitAt)
                              : '—';
                        return (
                          <button
                            type="button"
                            key={s.id}
                            className={`gm-pcd-row gm-pcd-row--${st}`}
                            onClick={() => setSelected(s)}
                          >
                            <strong className="gm-pcd-row-slot">{s.slotCode}</strong>
                            <StatusPill status={st} />
                            <div className="gm-pcd-row-main">
                              <span className="gm-pcd-row-person">{name}</span>
                              <span className="gm-pcd-row-vehicle">{detail}</span>
                            </div>
                            <div className="gm-pcd-row-meta">{vehicle}</div>
                            <div className="gm-pcd-row-time">{time}</div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
              </>
            )}
          </section>

          {panel ? (
            <div className="gm-park-modal-backdrop" role="dialog" aria-modal="true" onClick={closePanel}>
              <div
                className={`gm-park-modal gm-park-card ${
                  isExitPanel
                    ? 'gm-park-card--exit'
                    : panel === 'visitorEntry'
                      ? 'gm-park-card--visitor'
                      : 'gm-park-card--entry'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="gm-park-card-head">
                  <span className="gm-park-card-badge" aria-hidden />
                  <h3 className="gm-park-card-title">
                    {panel === 'residentEntry'
                      ? 'Resident Entry'
                      : panel === 'visitorEntry'
                        ? 'Visitor Entry'
                        : 'Vehicle Exit'}
                  </h3>
                  <button type="button" className="gm-park-modal-close" onClick={closePanel} aria-label="Close">
                    ×
                  </button>
                </div>

                <div className="gm-park-card-body gm-pcd-modal-body">
                  {panel === 'residentEntry' ? (
                    <div className="gm-park-card-body-grid">
                      <label className="gm-park-field-wide">
                        <span>Vehicle No</span>
                        <input
                          className="crud-form-control"
                          type="text"
                          autoFocus
                          autoComplete="off"
                          placeholder="Enter vehicle number"
                          value={residentForm.vehicleNumber}
                          onChange={(e) =>
                            setResidentForm({
                              vehicleNumber: e.target.value.toUpperCase(),
                              slotKey: '',
                            })
                          }
                        />
                      </label>
                      {matchedResident ? (
                        <div className="gm-park-exit-preview">
                          <div>
                            <span>Parking No</span>
                            <strong>{matchedResident.slotCode}</strong>
                          </div>
                          <div>
                            <span>Flat No</span>
                            <strong>{matchedResident.allottee?.flat || '—'}</strong>
                          </div>
                          <div>
                            <span>
                              {matchedResident.allottee?.role === 'Tenant'
                                ? 'Tenant'
                                : matchedResident.allottee?.role === 'Owner'
                                  ? 'Owner'
                                  : 'Owner / Tenant'}
                            </span>
                            <strong>{matchedResident.allottee?.name || '—'}</strong>
                          </div>
                          <div>
                            <span>Vehicle</span>
                            <strong>{matchedResident.allottee?.vehicleNumber || '—'}</strong>
                          </div>
                          <div>
                            <span>Type</span>
                            <strong>
                              {formatLabel(matchedResident.allottee?.vehicleType) || '—'}
                            </strong>
                          </div>
                          <div>
                            <span>Status</span>
                            <StatusPill status={matchedResident.occupancy.status} />
                          </div>
                        </div>
                      ) : residentLookupTried ? (
                        <p className="gm-park-hint gm-park-hint--wide gm-park-hint--warn">
                          No resident found for this vehicle number.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {panel === 'visitorEntry' ? (
                    <div className="gm-park-card-body-grid gm-park-card-body-grid--visitor">
                      <FormField
                        label="Visitor name *"
                        value={visitorForm.visitorName}
                        onChange={(v) => setVisitorForm((s) => ({ ...s, visitorName: v }))}
                      />
                      <FormField
                        label="Vehicle number *"
                        value={visitorForm.vehicleNumber}
                        onChange={(v) =>
                          setVisitorForm((s) => ({ ...s, vehicleNumber: v.toUpperCase() }))
                        }
                      />
                      <FormField
                        label="Visiting flat *"
                        value={visitorForm.visitingFlat}
                        onChange={(v) => setVisitorForm((s) => ({ ...s, visitingFlat: v }))}
                      />
                      <FormSelect
                        label="Vehicle type"
                        value={visitorForm.vehicleType}
                        options={VISITOR_TYPES}
                        onChange={(v) => setVisitorForm((s) => ({ ...s, vehicleType: v }))}
                      />
                      <div className="gm-park-code-wide">
                        <SearchableParkingCode
                          label="Parking No *"
                          placeholder="Search free parking no…"
                          emptyText="No free visitor parking"
                          value={visitorForm.slotKey}
                          options={freeVisitorOptions}
                          onChange={(opt) =>
                            setVisitorForm((s) => ({ ...s, slotKey: opt?.id || '' }))
                          }
                        />
                      </div>
                    </div>
                  ) : null}

                  {panel === 'vehicleExit' ? (
                    <div className="gm-park-card-body-grid">
                      <label className="gm-park-field-wide">
                        <span>Vehicle No</span>
                        <input
                          className="crud-form-control"
                          type="text"
                          autoFocus
                          autoComplete="off"
                          placeholder="Enter vehicle number"
                          value={exitForm.vehicleNumber}
                          onChange={(e) =>
                            setExitForm({
                              vehicleNumber: e.target.value.toUpperCase(),
                              matchKey: '',
                            })
                          }
                        />
                      </label>
                      {exitMatch ? (
                        <div className="gm-park-exit-preview">
                          <div>
                            <span>Type</span>
                            <strong>
                              {exitMatch.category === 'visitor'
                                ? 'Visitor'
                                : exitMatch.allottee?.role === 'Tenant'
                                  ? 'Tenant'
                                  : exitMatch.allottee?.role === 'Owner'
                                    ? 'Owner'
                                    : 'Resident'}
                            </strong>
                          </div>
                          <div>
                            <span>Parking No</span>
                            <strong>{exitMatch.slotCode}</strong>
                          </div>
                          {exitMatch.category === 'visitor' ? (
                            <>
                              <div>
                                <span>Visitor</span>
                                <strong>{exitMatch.occupancy.visitorName || '—'}</strong>
                              </div>
                              <div>
                                <span>Visiting flat</span>
                                <strong>{exitMatch.occupancy.visitingFlat || '—'}</strong>
                              </div>
                              <div>
                                <span>Vehicle</span>
                                <strong>{exitMatch.occupancy.vehicleNumber || '—'}</strong>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span>Flat No</span>
                                <strong>{exitMatch.allottee?.flat || '—'}</strong>
                              </div>
                              <div>
                                <span>
                                  {exitMatch.allottee?.role === 'Tenant'
                                    ? 'Tenant'
                                    : exitMatch.allottee?.role === 'Owner'
                                      ? 'Owner'
                                      : 'Owner / Tenant'}
                                </span>
                                <strong>{exitMatch.allottee?.name || '—'}</strong>
                              </div>
                              <div>
                                <span>Vehicle</span>
                                <strong>{exitMatch.allottee?.vehicleNumber || '—'}</strong>
                              </div>
                            </>
                          )}
                          <div>
                            <span>Entry</span>
                            <strong>{formatParkTime(exitMatch.occupancy.entryAt)}</strong>
                          </div>
                        </div>
                      ) : vehicleExitLookupTried ? (
                        <p className="gm-park-hint gm-park-hint--wide gm-park-hint--warn">
                          No inside resident or parked visitor found for this vehicle number.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="gm-park-modal-actions">
                  <button type="button" className="btn-secondary" onClick={closePanel} disabled={busy}>
                    Cancel
                  </button>
                  {panel === 'residentEntry' ? (
                    <button
                      type="button"
                      className="btn-primary gm-park-card-btn"
                      disabled={busy || !matchedResident || matchedResident.occupancy.status === 'inside'}
                      onClick={confirmResidentEntry}
                    >
                      {busy ? 'Saving…' : 'Mark Inside'}
                    </button>
                  ) : null}
                  {panel === 'visitorEntry' ? (
                    <button
                      type="button"
                      className="btn-primary gm-park-card-btn"
                      disabled={busy || !freeVisitorOptions.length}
                      onClick={confirmVisitorEntry}
                    >
                      {busy ? 'Saving…' : 'Park Visitor'}
                    </button>
                  ) : null}
                  {panel === 'vehicleExit' ? (
                    <button
                      type="button"
                      className="btn-primary gm-park-card-btn"
                      disabled={busy || !exitMatch}
                      onClick={() => setConfirmExit(exitMatch)}
                    >
                      {busy
                        ? 'Saving…'
                        : exitMatch?.category === 'visitor'
                          ? 'Mark Free'
                          : 'Mark Outside'}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {selected ? (
            <div
              className="gm-park-drawer-backdrop"
              role="dialog"
              aria-modal="true"
              onClick={() => setSelected(null)}
            >
              <aside className="gm-park-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="gm-park-drawer-head">
                  <div>
                    <p className="gm-park-drawer-kicker">
                      {selected.category === 'visitor' ? 'Visitor slot' : 'Resident slot'}
                    </p>
                    <h3 className="gm-park-drawer-title">{selected.slotCode}</h3>
                  </div>
                  <button
                    type="button"
                    className="gm-park-modal-close"
                    onClick={() => setSelected(null)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="gm-park-drawer-body">
                  <dl className="gm-park-detail-grid">
                    <div>
                      <dt>Compartment</dt>
                      <dd>{selected.compartment}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>
                        <StatusPill status={selected.occupancy.status} />
                      </dd>
                    </div>
                    {selected.category === 'resident' ? (
                      <>
                        <div>
                          <dt>Allotted to</dt>
                          <dd>{selected.allottee?.name || 'Unassigned'}</dd>
                        </div>
                        <div>
                          <dt>Flat</dt>
                          <dd>{selected.allottee?.flat || '—'}</dd>
                        </div>
                        <div>
                          <dt>Vehicle</dt>
                          <dd>{selected.allottee?.vehicleNumber || '—'}</dd>
                        </div>
                        <div>
                          <dt>Entry</dt>
                          <dd>{formatParkTime(selected.occupancy.entryAt)}</dd>
                        </div>
                        <div>
                          <dt>Last exit</dt>
                          <dd>{formatParkTime(selected.occupancy.exitAt)}</dd>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <dt>Visitor</dt>
                          <dd>{selected.occupancy.visitorName || '—'}</dd>
                        </div>
                        <div>
                          <dt>Vehicle</dt>
                          <dd>{selected.occupancy.vehicleNumber || '—'}</dd>
                        </div>
                        <div>
                          <dt>Visiting</dt>
                          <dd>{selected.occupancy.visitingFlat || '—'}</dd>
                        </div>
                        <div>
                          <dt>Entry</dt>
                          <dd>{formatParkTime(selected.occupancy.entryAt)}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                </div>
                {(selected.occupancy.status === 'inside' ||
                  selected.occupancy.status === 'occupied') && (
                  <div className="gm-park-drawer-foot">
                    <button
                      type="button"
                      className="gm-park-action-btn gm-park-action-btn--exit"
                      onClick={() => setConfirmExit(selected)}
                    >
                      Vehicle Exit
                    </button>
                  </div>
                )}
                {selected.category === 'resident' && selected.occupancy.status === 'outside' ? (
                  <div className="gm-park-drawer-foot">
                    <button
                      type="button"
                      className="gm-park-action-btn gm-park-action-btn--entry"
                      onClick={() => {
                        setResidentForm({
                          slotKey: selected.id,
                          vehicleNumber: selected.allottee?.vehicleNumber || '',
                        });
                        setSelected(null);
                        setPanel('residentEntry');
                      }}
                    >
                      Mark Inside
                    </button>
                  </div>
                ) : null}
                {selected.category === 'visitor' && selected.occupancy.status === 'available' ? (
                  <div className="gm-park-drawer-foot">
                    <button
                      type="button"
                      className="gm-park-action-btn gm-park-action-btn--visitor"
                      onClick={() => {
                        setVisitorForm((s) => ({ ...s, slotKey: selected.id }));
                        setSelected(null);
                        setPanel('visitorEntry');
                      }}
                    >
                      Give this slot
                    </button>
                  </div>
                ) : null}
              </aside>
            </div>
          ) : null}

          <ConfirmDialog
            open={Boolean(confirmExit)}
            title="Confirm exit?"
            message={
              confirmExit
                ? `${confirmExit.slotCode} will become ${
                    confirmExit.category === 'visitor' ? 'free' : 'outside'
                  }.`
                : ''
            }
            confirmLabel="Confirm Exit"
            variant="danger"
            loading={busy}
            onCancel={() => setConfirmExit(null)}
            onConfirm={() => performExit(confirmExit)}
          />
        </main>
      </div>
    </div>
  );
}
