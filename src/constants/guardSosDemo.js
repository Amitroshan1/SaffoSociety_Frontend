/**
 * Temporary FE-only SOS test harness (no backend).
 * One dummy alert — Activate / Resolve from SOS page; dashboard banner reads the same state.
 */

const STORAGE_KEY = 'guard_test_sos_v1';
export const TEST_SOS_EVENT = 'guard-test-sos';
export const TEST_SOS_ID = 'demo-sos-test-1';

function nowTime() {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const DEFAULT_TEST_SOS = {
  id: TEST_SOS_ID,
  flat: 'B-204',
  note: 'TEST SOS — emergency button pressed (dummy)',
  status: 'resolved',
  time: '—',
  _demo: true,
};

/** @deprecated keep export name for older imports — single test alert only */
export const DEMO_SOS_ALERTS = [DEFAULT_TEST_SOS];

export function activeSosAlerts(alerts = []) {
  return (alerts || []).filter((a) => String(a.status || '').toLowerCase() === 'active');
}

export function readTestSos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_TEST_SOS,
        ...parsed,
        id: TEST_SOS_ID,
        _demo: true,
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_TEST_SOS };
}

export function writeTestSos(patch = {}) {
  const next = {
    ...readTestSos(),
    ...patch,
    id: TEST_SOS_ID,
    _demo: true,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TEST_SOS_EVENT, { detail: next }));
  }
  return next;
}

export function activateTestSos() {
  return writeTestSos({
    status: 'active',
    time: nowTime(),
    note: 'TEST SOS — emergency button pressed (dummy)',
  });
}

export function resolveTestSos() {
  return writeTestSos({
    status: 'resolved',
    time: nowTime(),
    note: 'TEST SOS — resolved by guard (dummy)',
  });
}

/** Active test SOS for dashboard banner (empty when resolved). */
export function getActiveTestSosAlerts() {
  const sos = readTestSos();
  return String(sos.status).toLowerCase() === 'active' ? [sos] : [];
}

export function subscribeTestSos(listener) {
  if (typeof window === 'undefined') return () => {};
  const onCustom = () => listener(readTestSos());
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) listener(readTestSos());
  };
  window.addEventListener(TEST_SOS_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(TEST_SOS_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}
