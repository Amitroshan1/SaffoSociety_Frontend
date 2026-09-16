import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '../../../constants/guardRoutes.js';
import '../../../styles/guard/guard-main.css';
import '../../../styles/common/crud.css';
import Sidebar from '../../../components/guard/Sidebar';
import DashboardHeader from '../../../components/guard/DashboardHeader';
import { FormField, FormSelect, SearchInput, StatusBadge } from '../../../components/common/index.js';
import SearchableParkingCode from '../../../components/guard/parking/SearchableParkingCode.jsx';
import {
  SLOT_STATUS_COLORS,
  VISITOR_STATUS_COLORS,
  createGuardVisitorParking,
  formatLabel,
  listTodayGuardParking,
  recordParkingEntry,
  recordParkingExit,
} from '../../../services/parking.service.js';

const PARK_TABS = [
  { key: 'resident', label: 'Resident Parking' },
  { key: 'visitor', label: 'Visitor Parking' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'inside', label: 'Inside' },
  { value: 'outside', label: 'Outside' },
  { value: 'available', label: 'Free slots' },
];

const TYPE_FILTERS = [
  { value: 'all', label: 'All types' },
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'other', label: 'Other' },
];

const VISITOR_VEHICLE_TYPES = [
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'other', label: 'Other' },
];

const STATUS_COLORS = {
  ...SLOT_STATUS_COLORS,
  ...VISITOR_STATUS_COLORS,
  occupied: '#f59e0b',
  inside: '#22c55e',
  active: '#22c55e',
  available: '#22c55e',
  outside: '#64748b',
  exited: '#64748b',
};

const PANEL = {
  entry: {
    key: 'entry',
    title: 'Record entry',
    cardClass: 'gm-park-card--entry',
    btnLabel: 'Record entry',
  },
  exit: {
    key: 'exit',
    title: 'Record exit',
    cardClass: 'gm-park-card--exit',
    btnLabel: 'Confirm exit',
  },
  visitor: {
    key: 'visitor',
    title: 'Register Visitor Vehicle',
    cardClass: 'gm-park-card--visitor',
    btnLabel: 'Register Entry',
  },
};

function formatParkTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}.${minutes} ${ampm}`;
  } catch {
    return '—';
  }
}

function formatDuration(entryAt, exitAt) {
  if (!entryAt || !exitAt) return null;
  const start = new Date(entryAt).getTime();
  const end = new Date(exitAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const totalMins = Math.round((end - start) / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours <= 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function normalizeType(type) {
  const t = String(type || '').toLowerCase();
  if (t === 'car') return 'car';
  if (t === 'bike' || t === 'scooter' || t === 'bicycle') return 'bike';
  if (!t) return '';
  return 'other';
}

function isVisitorSlot(slot) {
  const cat = String(slot?.slotCategory || slot?.category || '').toLowerCase();
  if (cat === 'visitor') return true;
  return String(slot?.status || '').toLowerCase() === 'visitor';
}

function isResidentSlot(slot) {
  return !isVisitorSlot(slot);
}

function isInsideStatus(status) {
  const s = String(status || '').toLowerCase();
  return ['occupied', 'visitor', 'active', 'requested', 'inside'].includes(s);
}

function isOutsideStatus(status) {
  const s = String(status || '').toLowerCase();
  return ['outside', 'exited', 'allocated', 'reserved'].includes(s);
}

function isAvailableStatus(status) {
  return String(status || '').toLowerCase() === 'available';
}

function displayStatus(row) {
  if (row?.presence) return row.presence;
  const raw = row.slotStatus || row.status || '';
  const s = String(raw).toLowerCase();
  if (row.kind === 'visitor') {
    if (row.isFreeSlot || s === 'available') return 'available';
    if (s === 'active' || s === 'requested' || s === 'visitor') return 'inside';
    if (s === 'exited') return 'exited';
  }
  if (s === 'occupied') return 'inside';
  if (s === 'allocated' || s === 'reserved') return 'outside';
  if (s === 'available') return 'available';
  if (s === 'exited') return 'exited';
  return raw || '—';
}

function parkingNo(row) {
  return row.slotCode || row.parkingCode || '—';
}

function presenceKey(row) {
  return [
    row.kind || '',
    String(row.vehicleNumber || '').toLowerCase(),
    String(row.slotCode || row.parkingCode || '').toLowerCase(),
  ].join('|');
}

function rememberExit(prev, row, exitAt) {
  const next = { ...prev };
  const iso = exitAt || new Date().toISOString();
  const keys = [
    presenceKey(row),
    `resident|${String(row.vehicleNumber || '').toLowerCase()}|`,
    `visitor|${String(row.vehicleNumber || '').toLowerCase()}|`,
    `|${String(row.slotCode || row.parkingCode || '').toLowerCase()}`,
  ];
  for (const key of keys) {
    if (key && key !== '||' && key !== 'resident||' && key !== 'visitor||') {
      next[key] = iso;
    }
  }
  try {
    sessionStorage.setItem('gm-park-last-exit', JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

function lookupExitAt(map, row) {
  if (row?.exitAt) return row.exitAt;
  if (!map) return null;
  return (
    map[presenceKey(row)] ||
    map[`resident|${String(row.vehicleNumber || '').toLowerCase()}|`] ||
    map[`visitor|${String(row.vehicleNumber || '').toLowerCase()}|`] ||
    map[`|${String(row.slotCode || row.parkingCode || '').toLowerCase()}`] ||
    null
  );
}

export default function GuardParkingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [parkTab, setParkTab] = useState('resident');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [summaryFocus, setSummaryFocus] = useState('residentsInside');
  const [activePanel, setActivePanel] = useState(null);
  const [selected, setSelected] = useState(null);
  const [lastExitByKey, setLastExitByKey] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('gm-park-last-exit') || '{}');
    } catch {
      return {};
    }
  });
  const [entryForm, setEntryForm] = useState({ slotId: '', vehicleNumber: '' });
  const [exitForm, setExitForm] = useState({ slotId: '', vehicleNumber: '' });
  const [visitorForm, setVisitorForm] = useState({
    vehicleNumber: '',
    vehicleType: 'car',
    visitorName: '',
    visitingResident: '',
    slotId: '',
    purpose: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listTodayGuardParking();
      setData(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load today's parking");
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
    if (!activePanel && !selected) return undefined;
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (selected) setSelected(null);
      else setActivePanel(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePanel, selected]);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  function closePanel() {
    setActivePanel(null);
  }

  const visitorLogById = useMemo(() => {
    const map = {};
    for (const log of data?.activeVisitorParking || []) {
      map[String(log.id)] = log;
    }
    return map;
  }, [data]);

  const parkedVehicles = useMemo(() => {
    const rows =
      data?.parkedVehicles ||
      data?.vehicles ||
      [
        ...(data?.activeVisitorParking || []).map((log) => ({
          id: log.id,
          kind: 'visitor',
          vehicleNumber: log.vehicleNumber,
          vehicleType: log.vehicleType,
          residentName: null,
          parkingCode: log.parkingCode,
          slotCode: null,
          slotStatus: null,
          status: log.status,
          entryAt: log.entryAt,
          exitAt: log.exitAt,
        })),
        ...(data?.occupiedSlots || []).map((s) => ({
          id: s.id,
          kind: 'resident',
          vehicleNumber: null,
          vehicleType: null,
          residentName: null,
          parkingCode: null,
          slotCode: s.slotCode,
          slotStatus: s.status,
          status: s.status,
          entryAt: null,
        })),
      ];

    return rows.map((row) => {
      if (row.kind !== 'visitor') return row;
      const log = visitorLogById[String(row.id)];
      const meta = log?.metadata || {};
      return {
        ...row,
        entryAt: row.entryAt || log?.entryAt || null,
        exitAt: row.exitAt || log?.exitAt || null,
        purpose: log?.purpose || null,
        visitorName: meta.visitorName || meta.name || null,
        visitingResident: meta.visitingResident || meta.flat || meta.residentLabel || null,
        parkingCode: row.parkingCode || log?.parkingCode || null,
        slotId: log?.slotId || row.slotId || null,
      };
    });
  }, [data, visitorLogById]);

  const slotOptions = useMemo(() => {
    const fromApi = data?.slots || [];
    if (fromApi.length) return fromApi;
    return (data?.occupiedSlots || []).map((s) => ({
      id: s.id,
      code: s.slotCode,
      slotCode: s.slotCode,
      status: s.status,
      slotCategory: s.slotCategory,
      label: `${s.slotCode} · ${s.status}`,
    }));
  }, [data]);

  // Resident slots are fixed — track which assigned cars are currently inside vs outside.
  const residentBoard = useMemo(() => {
    const insideBySlot = new Map();
    const insideByVehicle = new Map();
    for (const v of parkedVehicles) {
      if (v.kind !== 'resident') continue;
      if (v.slotCode) insideBySlot.set(String(v.slotCode).toLowerCase(), v);
      if (v.parkingCode) insideBySlot.set(String(v.parkingCode).toLowerCase(), v);
      if (v.vehicleNumber) insideByVehicle.set(String(v.vehicleNumber).toLowerCase(), v);
    }

    const rows = [];
    const seenSlots = new Set();
    const seenVehicles = new Set();

    for (const s of slotOptions) {
      if (!isResidentSlot(s)) continue;
      if (!['allocated', 'reserved', 'occupied'].includes(String(s.status || '').toLowerCase())) {
        continue;
      }
      const codeKey = String(s.slotCode || s.code || '').toLowerCase();
      const parked =
        (codeKey && insideBySlot.get(codeKey)) ||
        (s.vehicleNumber && insideByVehicle.get(String(s.vehicleNumber).toLowerCase())) ||
        null;
      const presence = parked || String(s.status).toLowerCase() === 'occupied' ? 'inside' : 'outside';
      if (codeKey) seenSlots.add(codeKey);
      if (parked?.vehicleNumber) seenVehicles.add(String(parked.vehicleNumber).toLowerCase());
      else if (s.vehicleNumber) seenVehicles.add(String(s.vehicleNumber).toLowerCase());

      rows.push({
        id: parked?.id || s.id,
        kind: 'resident',
        slotId: s.id,
        slotCode: s.slotCode || s.code,
        parkingCode: parked?.parkingCode || s.slotCode || s.code,
        vehicleNumber: parked?.vehicleNumber || s.vehicleNumber || null,
        vehicleType: parked?.vehicleType || null,
        residentName: parked?.residentName || null,
        entryAt: parked?.entryAt || null,
        exitAt: parked?.exitAt || null,
        slotStatus: s.status,
        status: presence,
        presence,
      });
    }

    for (const c of data?.parkingCodes || []) {
      if (c.kind !== 'resident') continue;
      const codeKey = String(c.code || '').toLowerCase();
      const vehicleKey = String(c.vehicleNumber || '').toLowerCase();
      if (codeKey && seenSlots.has(codeKey)) continue;
      if (vehicleKey && seenVehicles.has(vehicleKey)) continue;

      const parked =
        (codeKey && insideBySlot.get(codeKey)) ||
        (vehicleKey && insideByVehicle.get(vehicleKey)) ||
        null;
      const presence = parked ? 'inside' : 'outside';
      if (codeKey) seenSlots.add(codeKey);
      if (vehicleKey) seenVehicles.add(vehicleKey);

      rows.push({
        id: parked?.id || `code-${c.code}`,
        kind: 'resident',
        slotId: parked?.slotId || parked?.id || null,
        slotCode: c.code,
        parkingCode: c.code,
        vehicleNumber: parked?.vehicleNumber || c.vehicleNumber || null,
        vehicleType: parked?.vehicleType || c.vehicleType || null,
        residentName: parked?.residentName || null,
        entryAt: parked?.entryAt || null,
        exitAt: parked?.exitAt || null,
        slotStatus: presence,
        status: presence,
        presence,
      });
    }

    // Any resident currently parked but missing from assigned lists.
    for (const v of parkedVehicles) {
      if (v.kind !== 'resident') continue;
      const vehicleKey = String(v.vehicleNumber || '').toLowerCase();
      const codeKey = String(v.slotCode || v.parkingCode || '').toLowerCase();
      if (vehicleKey && seenVehicles.has(vehicleKey)) continue;
      if (codeKey && seenSlots.has(codeKey)) continue;
      rows.push({
        ...v,
        presence: 'inside',
        status: 'inside',
      });
    }

    return rows.map((row) => {
      if (row.presence !== 'outside') return row;
      return { ...row, exitAt: lookupExitAt(lastExitByKey, row) || row.exitAt || null };
    });
  }, [slotOptions, parkedVehicles, data, lastExitByKey]);

  // Visitor slots are open pool — every free/occupied slot must be trackable.
  const visitorBoard = useMemo(() => {
    const visitorSlots = slotOptions.filter(isVisitorSlot);
    const insideVisitors = parkedVehicles.filter((v) => v.kind === 'visitor');
    const usedSlotIds = new Set();
    const usedSlotCodes = new Set();

    const rows = [];

    const matchVisitor = (slot) =>
      insideVisitors.find((v) => {
        if (slot.id && v.slotId && String(v.slotId) === String(slot.id)) return true;
        if (slot.slotCode && v.slotCode && v.slotCode === slot.slotCode) return true;
        if (slot.code && v.slotCode && v.slotCode === slot.code) return true;
        if (slot.slotCode && v.parkingCode && v.parkingCode === slot.slotCode) return true;
        return false;
      });

    if (visitorSlots.length) {
      for (const s of visitorSlots) {
        const parked = matchVisitor(s);
        if (parked) {
          if (parked.slotId) usedSlotIds.add(String(parked.slotId));
          if (parked.slotCode) usedSlotCodes.add(String(parked.slotCode).toLowerCase());
          if (parked.id) usedSlotIds.add(String(parked.id));
          rows.push({
            ...parked,
            slotId: parked.slotId || s.id,
            slotCode: parked.slotCode || s.slotCode || s.code,
            slotCategory: s.slotCategory || 'visitor',
            presence: 'inside',
            status: 'inside',
            isFreeSlot: false,
          });
        } else {
          rows.push({
            id: `free-${s.id}`,
            kind: 'visitor',
            slotId: s.id,
            slotCode: s.slotCode || s.code,
            parkingCode: s.slotCode || s.code,
            slotCategory: s.slotCategory || 'visitor',
            vehicleNumber: null,
            vehicleType: null,
            visitorName: null,
            visitingResident: null,
            entryAt: null,
            exitAt: null,
            slotStatus: 'available',
            status: 'available',
            presence: 'available',
            isFreeSlot: true,
          });
        }
      }
    }

    // Visitors parked without a categorized visitor slot still appear.
    for (const v of insideVisitors) {
      if (v.slotId && usedSlotIds.has(String(v.slotId))) continue;
      if (v.slotCode && usedSlotCodes.has(String(v.slotCode).toLowerCase())) continue;
      if (usedSlotIds.has(String(v.id))) continue;
      rows.push({
        ...v,
        presence: 'inside',
        status: 'inside',
        isFreeSlot: false,
      });
    }

    // If API has no visitor-category slots, still expose free available slots as visitor-capable.
    if (!visitorSlots.length) {
      for (const s of slotOptions) {
        if (String(s.status || '').toLowerCase() !== 'available') continue;
        if (isVisitorSlot(s)) continue;
        rows.push({
          id: `free-${s.id}`,
          kind: 'visitor',
          slotId: s.id,
          slotCode: s.slotCode || s.code,
          parkingCode: s.slotCode || s.code,
          vehicleNumber: null,
          status: 'available',
          presence: 'available',
          isFreeSlot: true,
        });
      }
    }

    return rows;
  }, [slotOptions, parkedVehicles]);

  const summary = useMemo(() => {
    const residentsInside = residentBoard.filter((r) => r.presence === 'inside').length;
    const residentsOutside = residentBoard.filter((r) => r.presence === 'outside').length;
    const visitorFree = visitorBoard.filter((r) => r.presence === 'available').length;
    const visitorsInside = visitorBoard.filter((r) => r.presence === 'inside').length;
    return {
      residentsInside,
      residentsOutside,
      visitorFree,
      visitorsInside,
    };
  }, [residentBoard, visitorBoard]);

  const filteredVehicles = useMemo(() => {
    const term = search.trim().toLowerCase();
    const source = parkTab === 'visitor' ? visitorBoard : residentBoard;

    return source.filter((v) => {
      const status = displayStatus(v);

      if (statusFilter === 'inside' && !isInsideStatus(status)) return false;
      if (statusFilter === 'outside' && !isOutsideStatus(status)) return false;
      if (statusFilter === 'available' && !isAvailableStatus(status)) return false;

      if (typeFilter !== 'all') {
        if (v.isFreeSlot) return false;
        if (normalizeType(v.vehicleType) !== typeFilter) return false;
      }

      if (!term) return true;
      const hay = [
        v.vehicleNumber,
        v.parkingCode,
        v.slotCode,
        v.residentName,
        v.visitorName,
        v.visitingResident,
        v.purpose,
        v.presence,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    });
  }, [residentBoard, visitorBoard, parkTab, search, statusFilter, typeFilter]);

  const entrySlotOptions = useMemo(() => {
    // Fixed assigned resident slots — show who is inside vs outside.
    const byPresence = (presence) =>
      residentBoard
        .filter((r) => r.presence === presence && (r.slotId || r.slotCode))
        .map((r) => ({
          id: r.slotId || r.id,
          code: r.slotCode || r.parkingCode,
          slotCode: r.slotCode || r.parkingCode,
          status: r.presence,
          vehicleNumber: r.vehicleNumber,
          label: `${r.slotCode || r.parkingCode || '—'} · ${r.vehicleNumber || '—'} (${r.presence})`,
        }));

    const outside = byPresence('outside');
    const inside = byPresence('inside');
    if (outside.length || inside.length) return [...outside, ...inside];

    return slotOptions
      .filter((s) => isResidentSlot(s) && ['allocated', 'reserved', 'occupied'].includes(s.status))
      .map((s) => ({
        ...s,
        label: s.vehicleNumber
          ? `${s.slotCode || s.code} · ${s.vehicleNumber} (assigned)`
          : `${s.slotCode || s.code} · ${s.status}`,
      }));
  }, [residentBoard, slotOptions]);

  const exitSlotOptions = useMemo(() => {
    const insideResidents = residentBoard
      .filter((r) => r.presence === 'inside')
      .map((r) => ({
        id: r.slotId || r.id,
        code: r.slotCode || r.parkingCode,
        slotCode: r.slotCode || r.parkingCode,
        status: 'inside',
        vehicleNumber: r.vehicleNumber,
        kind: 'resident',
        label: `${r.slotCode || r.parkingCode || '—'} · ${r.vehicleNumber || '—'} (resident)`,
      }));
    const insideVisitors = visitorBoard
      .filter((r) => r.presence === 'inside')
      .map((r) => ({
        id: r.slotId || r.id,
        code: r.slotCode || r.parkingCode,
        slotCode: r.slotCode || r.parkingCode,
        status: 'inside',
        vehicleNumber: r.vehicleNumber,
        kind: 'visitor',
        label: `${r.slotCode || r.parkingCode || '—'} · ${r.vehicleNumber || '—'} (visitor)`,
      }));
    if (insideResidents.length || insideVisitors.length) {
      return [...insideResidents, ...insideVisitors];
    }
    return parkedVehicles
      .filter((v) => v.slotCode || v.slotId)
      .map((v) => ({
        id: v.slotId || v.id,
        code: v.slotCode || v.parkingCode,
        slotCode: v.slotCode || v.parkingCode,
        status: v.slotStatus || v.status,
        vehicleNumber: v.vehicleNumber,
        kind: v.kind,
        label: `${v.slotCode || v.parkingCode || '—'} · ${v.vehicleNumber || '—'}`,
      }));
  }, [residentBoard, visitorBoard, parkedVehicles]);

  const visitorSlotOptions = useMemo(
    () =>
      visitorBoard
        .filter((r) => r.presence === 'available')
        .map((r) => ({
          id: r.slotId || r.id,
          code: r.slotCode,
          slotCode: r.slotCode,
          status: 'available',
          slotCategory: r.slotCategory || 'visitor',
          label: `${r.slotCode || '—'} · free`,
        })),
    [visitorBoard],
  );

  const exitPreview = useMemo(() => {
    const term = exitForm.vehicleNumber.trim().toLowerCase();
    const selectedOpt = exitSlotOptions.find((o) => String(o.id) === String(exitForm.slotId));
    const bySlot = parkedVehicles.find((v) => {
      if (exitForm.slotId && String(v.slotId || '') === String(exitForm.slotId)) return true;
      if (selectedOpt?.slotCode && v.slotCode === selectedOpt.slotCode) return true;
      if (selectedOpt?.code && (v.slotCode === selectedOpt.code || v.parkingCode === selectedOpt.code)) {
        return true;
      }
      if (exitForm.slotId && v.kind === 'resident' && String(v.id) === String(exitForm.slotId)) {
        return true;
      }
      return false;
    });
    if (bySlot) return bySlot;
    if (!term) return null;
    return (
      parkedVehicles.find((v) => String(v.vehicleNumber || '').toLowerCase() === term) || null
    );
  }, [exitForm, parkedVehicles, exitSlotOptions]);

  function onPickEntrySlot(opt) {
    setEntryForm((s) => ({
      ...s,
      slotId: opt?.id || '',
      vehicleNumber: opt?.vehicleNumber || s.vehicleNumber,
    }));
  }

  function onPickExitSlot(opt) {
    setExitForm((s) => ({
      ...s,
      slotId: opt?.id || '',
      vehicleNumber: opt?.vehicleNumber || s.vehicleNumber,
    }));
  }

  function onPickVisitorSlot(opt) {
    setVisitorForm((s) => ({
      ...s,
      slotId: opt?.id || '',
    }));
  }

  const onEntry = async (e) => {
    e.preventDefault();
    if (!entryForm.vehicleNumber.trim() && !entryForm.slotId) {
      setError('Enter vehicle number or select the assigned parking slot');
      return;
    }
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await recordParkingEntry({
        slotId: entryForm.slotId || null,
        vehicleNumber: entryForm.vehicleNumber.trim() || null,
      });
      setSuccess('Entry recorded');
      setEntryForm({ slotId: '', vehicleNumber: '' });
      setActivePanel(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Entry failed');
    } finally {
      setBusy(false);
    }
  };

  const onExit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        slotId: exitForm.slotId || null,
        vehicleNumber: exitForm.vehicleNumber.trim() || null,
      };
      if (exitPreview?.kind === 'visitor') {
        payload.visitorLogId = exitPreview.id;
      }
      await recordParkingExit(payload);
      if (exitPreview) {
        setLastExitByKey((prev) => rememberExit(prev, exitPreview));
      }
      setSuccess('Exit recorded');
      setExitForm({ slotId: '', vehicleNumber: '' });
      setActivePanel(null);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Exit failed');
    } finally {
      setBusy(false);
    }
  };

  const onVisitor = async (e) => {
    e.preventDefault();
    if (!visitorForm.vehicleNumber.trim()) {
      setError('Vehicle number is required');
      return;
    }
    if (!visitorForm.visitorName.trim()) {
      setError('Visitor name is required');
      return;
    }
    if (!visitorForm.visitingResident.trim()) {
      setError('Visiting resident / flat is required');
      return;
    }
    if (!visitorForm.slotId) {
      setError('Select an available visitor parking slot');
      return;
    }
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await createGuardVisitorParking({
        vehicleNumber: visitorForm.vehicleNumber.trim(),
        vehicleType: visitorForm.vehicleType,
        slotId: visitorForm.slotId || null,
        purpose: visitorForm.purpose.trim() || null,
        metadata: {
          visitorName: visitorForm.visitorName.trim(),
          visitingResident: visitorForm.visitingResident.trim(),
        },
      });
      setSuccess('Visitor vehicle registered');
      setVisitorForm({
        vehicleNumber: '',
        vehicleType: 'car',
        visitorName: '',
        visitingResident: '',
        slotId: '',
        purpose: '',
      });
      setActivePanel(null);
      setParkTab('visitor');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Visitor parking failed');
    } finally {
      setBusy(false);
    }
  };

  async function markExitFromDrawer() {
    if (!selected) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        slotId: selected.slotId || (selected.kind === 'resident' ? selected.id : null),
        vehicleNumber: selected.vehicleNumber || null,
      };
      if (selected.kind === 'visitor') payload.visitorLogId = selected.id;
      await recordParkingExit(payload);
      setLastExitByKey((prev) => rememberExit(prev, selected));
      setSuccess('Exit recorded');
      setSelected(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Exit failed');
    } finally {
      setBusy(false);
    }
  }

  function applySummaryFocus(key) {
    setSummaryFocus(key);
    if (key === 'residentsInside') {
      setParkTab('resident');
      setStatusFilter('inside');
      setTypeFilter('all');
      return;
    }
    if (key === 'residentsOutside') {
      setParkTab('resident');
      setStatusFilter('outside');
      setTypeFilter('all');
      return;
    }
    if (key === 'visitorFree') {
      setParkTab('visitor');
      setStatusFilter('available');
      setTypeFilter('all');
      return;
    }
    if (key === 'visitorsInside') {
      setParkTab('visitor');
      setStatusFilter('inside');
      setTypeFilter('all');
    }
  }

  function openVisitorWithSlot(row) {
    setVisitorForm((s) => ({
      ...s,
      slotId: row.slotId || '',
    }));
    setActivePanel('visitor');
    setSelected(null);
  }

  const panel = activePanel ? PANEL[activePanel] : null;
  const emptyMessage =
    search.trim()
      ? 'No vehicles found.'
      : parkTab === 'visitor'
        ? statusFilter === 'available'
          ? 'No free visitor slots right now.'
          : 'No visitor vehicles currently inside.'
        : statusFilter === 'outside'
          ? 'All assigned resident vehicles are currently inside.'
          : statusFilter === 'inside'
            ? 'No resident vehicles currently inside.'
            : 'No assigned resident parking records.';

  function renderVehicleTable(rows) {
    const isVisitorTab = parkTab === 'visitor';
    return (
      <div className="glass-card gm-park-table-card">
        <div className="gm-park-section-head">
          <div>
            <h3 className="gm-park-table-title">
              {isVisitorTab ? 'Visitor Parking' : 'Resident Parking'}
            </h3>
            {isVisitorTab ? (
              <p className="gm-park-section-sub">
                Open visitor slots — track which are free and which car is using each slot
              </p>
            ) : (
              <p className="gm-park-section-sub">
                Fixed assigned slots — record which resident cars are inside and which are outside
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="gm-park-table-skeleton" aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="gm-park-skel-row" />
            ))}
          </div>
        ) : (
          <div className="gm-park-table-wrap">
            <table className="crud-table gm-park-data-table">
              <thead>
                <tr>
                  <th>Vehicle Number</th>
                  <th>Type</th>
                  <th>{isVisitorTab ? 'Visitor' : 'Resident'}</th>
                  {isVisitorTab ? <th>Visiting Resident</th> : null}
                  <th>Parking No</th>
                  <th>{statusFilter === 'outside' ? 'Out Time' : 'Entry Time'}</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={isVisitorTab ? 8 : 7}>
                      <div className="gm-park-empty">{emptyMessage}</div>
                    </td>
                  </tr>
                )}
                {rows.map((v) => {
                  const status = displayStatus(v);
                  const timeValue =
                    statusFilter === 'outside'
                      ? formatParkTime(v.exitAt)
                      : v.isFreeSlot
                        ? '—'
                        : formatParkTime(v.entryAt);
                  return (
                    <tr key={v.id || `${v.slotCode}-${v.vehicleNumber}-${status}`}>
                      <td>
                        <span className="gm-park-vehicle-no">
                          {v.isFreeSlot ? '— Free slot —' : v.vehicleNumber || '—'}
                        </span>
                      </td>
                      <td>{v.isFreeSlot ? '—' : formatLabel(v.vehicleType)}</td>
                      <td>
                        {isVisitorTab
                          ? v.isFreeSlot
                            ? 'Open for any visitor'
                            : v.visitorName || '—'
                          : v.residentName || '—'}
                      </td>
                      {isVisitorTab ? (
                        <td>{v.isFreeSlot ? '—' : v.visitingResident || '—'}</td>
                      ) : null}
                      <td>{parkingNo(v)}</td>
                      <td>{timeValue}</td>
                      <td>
                        <StatusBadge status={status} colors={STATUS_COLORS} />
                      </td>
                      <td>
                        {v.isFreeSlot ? (
                          <button
                            type="button"
                            className="gm-park-link-btn"
                            onClick={() => openVisitorWithSlot(v)}
                          >
                            Use slot
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="gm-park-link-btn"
                            onClick={() => setSelected(v)}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="gm-root">
      <Sidebar activePage="Parking" onNavigate={handleSidebarNav} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main gm-park-page">
          <div className="gm-park-topbar">
            <div className="gm-park-page-head">
              <h2 className="gm-park-page-title">Parking</h2>
              <p className="gm-park-page-sub">
                Track resident cars inside/outside and keep visitor free slots accurate
              </p>
            </div>
            <div className="gm-park-toolbar-btns">
              <button
                type="button"
                className="gm-park-action-btn gm-park-action-btn--entry"
                onClick={() => setActivePanel('entry')}
              >
                Record entry
              </button>
              <button
                type="button"
                className="gm-park-action-btn gm-park-action-btn--exit"
                onClick={() => setActivePanel('exit')}
              >
                Record exit
              </button>
              <button
                type="button"
                className="gm-park-action-btn gm-park-action-btn--visitor"
                onClick={() => setActivePanel('visitor')}
              >
                Visitor parking
              </button>
            </div>
          </div>

          {error && <div className="gm-park-alert gm-park-alert--error">{error}</div>}
          {success && <div className="gm-park-alert gm-park-alert--ok">{success}</div>}

          <div className="gm-park-summary">
            <button
              type="button"
              className={`glass-card gm-park-stat gm-park-stat--ok${summaryFocus === 'residentsInside' ? ' is-active' : ''}`}
              onClick={() => applySummaryFocus('residentsInside')}
            >
              <strong>{loading ? '—' : summary.residentsInside}</strong>
              <span className="gm-park-stat-label">Residents Inside</span>
            </button>
            <button
              type="button"
              className={`glass-card gm-park-stat${summaryFocus === 'residentsOutside' ? ' is-active' : ''}`}
              onClick={() => applySummaryFocus('residentsOutside')}
            >
              <strong>{loading ? '—' : summary.residentsOutside}</strong>
              <span className="gm-park-stat-label">Residents Outside</span>
            </button>
            <button
              type="button"
              className={`glass-card gm-park-stat gm-park-stat--ok${summaryFocus === 'visitorFree' ? ' is-active' : ''}`}
              onClick={() => applySummaryFocus('visitorFree')}
            >
              <strong>{loading ? '—' : summary.visitorFree}</strong>
              <span className="gm-park-stat-label">Visitor Free</span>
            </button>
            <button
              type="button"
              className={`glass-card gm-park-stat gm-park-stat--info${summaryFocus === 'visitorsInside' ? ' is-active' : ''}`}
              onClick={() => applySummaryFocus('visitorsInside')}
            >
              <strong>{loading ? '—' : summary.visitorsInside}</strong>
              <span className="gm-park-stat-label">Visitors Inside</span>
            </button>
          </div>

          <div className="gm-park-controlbar">
            <div className="gm-park-search">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search vehicle number / Parking No"
                debounceMs={250}
              />
            </div>
            <label className="gm-park-filter gm-park-filter--inline">
              <span>Parking</span>
              <select
                value={parkTab}
                onChange={(e) => {
                  setParkTab(e.target.value);
                  setSummaryFocus(
                    e.target.value === 'visitor' ? 'visitorsInside' : 'residentsInside',
                  );
                  setStatusFilter('all');
                }}
                aria-label="Parking type"
              >
                {PARK_TABS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="gm-park-filter gm-park-filter--inline">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Status filter"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="gm-park-filter gm-park-filter--inline">
              <span>Type</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Vehicle type filter"
              >
                {TYPE_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {renderVehicleTable(filteredVehicles)}

          {panel && (
            <div
              className="gm-park-modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-label={panel.title}
              onClick={closePanel}
            >
              <form
                className={`gm-park-card gm-park-modal ${panel.cardClass}`}
                onClick={(e) => e.stopPropagation()}
                onSubmit={
                  activePanel === 'entry'
                    ? onEntry
                    : activePanel === 'exit'
                      ? onExit
                      : onVisitor
                }
              >
                <div className="gm-park-card-head">
                  <span className="gm-park-card-badge" aria-hidden />
                  <h3 className="gm-park-card-title">{panel.title}</h3>
                  <button
                    type="button"
                    className="gm-park-modal-close"
                    onClick={closePanel}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="gm-park-card-body">
                  {activePanel === 'entry' && (
                    <div className="gm-park-card-body-grid">
                      <p className="gm-park-hint gm-park-hint--wide">
                        Resident parking number is already fixed. Record entry/exit to track
                        whether that assigned car is currently inside or outside.
                      </p>
                      <FormField
                        label="Vehicle number *"
                        value={entryForm.vehicleNumber}
                        onChange={(v) => setEntryForm((s) => ({ ...s, vehicleNumber: v }))}
                      />
                      <SearchableParkingCode
                        label="Assigned Parking No"
                        placeholder="Search assigned slot…"
                        emptyText="No assigned resident slots found"
                        value={entryForm.slotId}
                        options={entrySlotOptions}
                        onChange={onPickEntrySlot}
                      />
                    </div>
                  )}

                  {activePanel === 'exit' && (
                    <div className="gm-park-card-body-grid">
                      <SearchableParkingCode
                        label="Parking No"
                        placeholder="Search vehicle / Parking No…"
                        emptyText="No matching parked vehicle"
                        value={exitForm.slotId}
                        options={exitSlotOptions}
                        onChange={onPickExitSlot}
                      />
                      <FormField
                        label="Vehicle number"
                        value={exitForm.vehicleNumber}
                        onChange={(v) => setExitForm((s) => ({ ...s, vehicleNumber: v }))}
                      />
                      {exitPreview ? (
                        <div className="gm-park-exit-preview">
                          <div>
                            <span>Vehicle</span>
                            <strong>{exitPreview.vehicleNumber || '—'}</strong>
                          </div>
                          <div>
                            <span>{exitPreview.kind === 'visitor' ? 'Visitor' : 'Resident'}</span>
                            <strong>
                              {exitPreview.kind === 'visitor'
                                ? exitPreview.visitorName || 'Visitor'
                                : exitPreview.residentName || '—'}
                            </strong>
                          </div>
                          <div>
                            <span>Parking No</span>
                            <strong>{parkingNo(exitPreview)}</strong>
                          </div>
                          <div>
                            <span>Entry Time</span>
                            <strong>{formatParkTime(exitPreview.entryAt)}</strong>
                          </div>
                          <div>
                            <span>Status</span>
                            <StatusBadge status={displayStatus(exitPreview)} colors={STATUS_COLORS} />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {activePanel === 'visitor' && (
                    <div className="gm-park-card-body-grid">
                      <p className="gm-park-hint gm-park-hint--wide">
                        Visitor slots are open — any visitor car can use a free slot. Pick a free
                        slot so we keep an accurate free/occupied track.
                      </p>
                      <FormField
                        label="Vehicle Number *"
                        value={visitorForm.vehicleNumber}
                        onChange={(v) => setVisitorForm((s) => ({ ...s, vehicleNumber: v }))}
                        required
                      />
                      <FormSelect
                        label="Vehicle Type *"
                        value={visitorForm.vehicleType}
                        options={VISITOR_VEHICLE_TYPES}
                        onChange={(v) => setVisitorForm((s) => ({ ...s, vehicleType: v }))}
                      />
                      <FormField
                        label="Visitor Name *"
                        value={visitorForm.visitorName}
                        onChange={(v) => setVisitorForm((s) => ({ ...s, visitorName: v }))}
                        required
                      />
                      <FormField
                        label="Visiting Resident *"
                        value={visitorForm.visitingResident}
                        onChange={(v) => setVisitorForm((s) => ({ ...s, visitingResident: v }))}
                        required
                      />
                      <SearchableParkingCode
                        label="Available Visitor Slot *"
                        placeholder="Select free visitor slot…"
                        emptyText="No available visitor slots"
                        value={visitorForm.slotId}
                        options={visitorSlotOptions}
                        onChange={onPickVisitorSlot}
                      />
                      <FormField
                        label="Purpose"
                        value={visitorForm.purpose}
                        onChange={(v) => setVisitorForm((s) => ({ ...s, purpose: v }))}
                      />
                    </div>
                  )}
                </div>

                <div className="gm-park-modal-actions">
                  <button type="button" className="btn-secondary" onClick={closePanel} disabled={busy}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary gm-park-card-btn" disabled={busy}>
                    {busy ? 'Saving…' : panel.btnLabel}
                  </button>
                </div>
              </form>
            </div>
          )}

          {selected && (
            <div
              className="gm-park-drawer-backdrop"
              role="dialog"
              aria-modal="true"
              aria-label="Vehicle details"
              onClick={() => setSelected(null)}
            >
              <aside
                className="gm-park-drawer"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="gm-park-drawer-head">
                  <div>
                    <p className="gm-park-drawer-kicker">Vehicle details</p>
                    <h3 className="gm-park-drawer-title">{selected.vehicleNumber || '—'}</h3>
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
                      <dt>Type</dt>
                      <dd>{formatLabel(selected.vehicleType)}</dd>
                    </div>
                    {selected.kind === 'visitor' ? (
                      <>
                        <div>
                          <dt>Visitor</dt>
                          <dd>{selected.visitorName || '—'}</dd>
                        </div>
                        <div>
                          <dt>Visiting Resident</dt>
                          <dd>{selected.visitingResident || '—'}</dd>
                        </div>
                      </>
                    ) : (
                      <div>
                        <dt>Resident</dt>
                        <dd>{selected.residentName || '—'}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Parking No</dt>
                      <dd>{parkingNo(selected)}</dd>
                    </div>
                    <div>
                      <dt>Entry</dt>
                      <dd>{formatParkTime(selected.entryAt)}</dd>
                    </div>
                    <div>
                      <dt>Exit</dt>
                      <dd>{formatParkTime(selected.exitAt)}</dd>
                    </div>
                    {formatDuration(selected.entryAt, selected.exitAt) ? (
                      <div>
                        <dt>Duration</dt>
                        <dd>{formatDuration(selected.entryAt, selected.exitAt)}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Status</dt>
                      <dd>
                        <StatusBadge status={displayStatus(selected)} colors={STATUS_COLORS} />
                      </dd>
                    </div>
                    {selected.purpose ? (
                      <div className="gm-park-detail-wide">
                        <dt>Purpose</dt>
                        <dd>{selected.purpose}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>

                {selected.isFreeSlot ? (
                  <div className="gm-park-drawer-foot">
                    <button
                      type="button"
                      className="gm-park-action-btn gm-park-action-btn--visitor"
                      onClick={() => openVisitorWithSlot(selected)}
                    >
                      Register visitor here
                    </button>
                  </div>
                ) : isInsideStatus(displayStatus(selected)) || isInsideStatus(selected.status) ? (
                  <div className="gm-park-drawer-foot">
                    <button
                      type="button"
                      className="gm-park-action-btn gm-park-action-btn--exit"
                      disabled={busy}
                      onClick={markExitFromDrawer}
                    >
                      {busy ? 'Saving…' : 'Mark Vehicle Exit'}
                    </button>
                  </div>
                ) : selected.kind === 'resident' && selected.presence === 'outside' ? (
                  <div className="gm-park-drawer-foot">
                    <button
                      type="button"
                      className="gm-park-action-btn gm-park-action-btn--entry"
                      onClick={() => {
                        setEntryForm({
                          slotId: selected.slotId || '',
                          vehicleNumber: selected.vehicleNumber || '',
                        });
                        setActivePanel('entry');
                        setSelected(null);
                      }}
                    >
                      Record entry
                    </button>
                  </div>
                ) : null}
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
