/**
 * Toggle dummy vs real API for modules.
 * Set VITE_USE_DUMMY_DATA=false when backend is ready.
 */
export const USE_DUMMY_DATA =
  String(import.meta.env.VITE_USE_DUMMY_DATA ?? 'true').toLowerCase() !== 'false';

/**
 * Visitors, Deliveries, Staff Entry, and Cab Entry use the backend
 * even while other Guard screens stay on dummy data.
 */
export const GATE_OPS_USE_LIVE = true;

export function gateUsesDummy() {
  return USE_DUMMY_DATA && !GATE_OPS_USE_LIVE;
}

/** SOS Alerts and My Schedule use the backend while other Guard screens stay on dummy data. */
export const OPS_USE_LIVE = true;

export function opsUsesDummy() {
  return USE_DUMMY_DATA && !OPS_USE_LIVE;
}

/** Parking and Documents use the backend. Move-out on the Documents page stays on dummy data. */
export const PANEL_USE_LIVE = true;

export function panelUsesDummy() {
  return USE_DUMMY_DATA && !PANEL_USE_LIVE;
}

/** Bookings, notifications, and profile use the backend. */
export const ACCOUNT_USE_LIVE = true;

export function accountUsesDummy() {
  return USE_DUMMY_DATA && !ACCOUNT_USE_LIVE;
}

/**
 * Resident panel always uses the FastAPI routes.
 * Dummy helpers stay in the repo, but they are not used while this is on.
 */
export const RESIDENT_USE_LIVE = true;

export function residentUsesDummy() {
  return USE_DUMMY_DATA && !RESIDENT_USE_LIVE;
}

export const DUMMY_LATENCY_MS = Number(import.meta.env.VITE_DUMMY_LATENCY_MS || 350);
