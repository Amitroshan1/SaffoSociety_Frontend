/** Shared mobile/tablet nav open state for Guard sidebar drawer. */

let open = false;
const listeners = new Set();

export function isGuardMobileNavOpen() {
  return open;
}

export function setGuardMobileNavOpen(next) {
  open = Boolean(next);
  listeners.forEach((fn) => {
    try {
      fn(open);
    } catch {
      // ignore
    }
  });
}

export function toggleGuardMobileNav() {
  setGuardMobileNavOpen(!open);
}

export function closeGuardMobileNav() {
  setGuardMobileNavOpen(false);
}

export function subscribeGuardMobileNav(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
