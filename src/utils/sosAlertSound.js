/**
 * Module-level SOS alarm — survives Guard route changes.
 * Plays in a loop until SOS is cleared (resolved) or guard presses Stop.
 */

import {
  getActiveTestSosAlerts,
  subscribeTestSos,
} from '../constants/guardSosDemo.js';

const SOS_SOUND_CANDIDATES = [
  '/sound/Sos_Alert.mp3',
  '/sound/sos_alert.mp3',
  '/sound/sos_alert',
];

let audio = null;
let srcIndex = 0;
let currentKey = '';
let mutedForKey = '';
const listeners = new Set();

function notify() {
  const snapshot = getSosSoundState();
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch {
      // ignore listener errors
    }
  });
}

function ensureAudio() {
  if (audio) return audio;
  audio = new Audio();
  audio.loop = true;
  audio.preload = 'auto';

  const onError = () => {
    if (srcIndex < SOS_SOUND_CANDIDATES.length) {
      audio.src = SOS_SOUND_CANDIDATES[srcIndex++];
      audio.load();
    }
  };

  audio.addEventListener('error', onError);
  audio.src = SOS_SOUND_CANDIDATES[srcIndex++];
  audio.load();
  return audio;
}

function stopAudio() {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // ignore
  }
}

function alertsKey(activeAlerts = []) {
  return (activeAlerts || [])
    .map((a) => String(a?.id || '').trim())
    .filter(Boolean)
    .sort()
    .join('|');
}

function playAudio() {
  const el = ensureAudio();
  const playPromise = el.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      // Autoplay blocked — UI stays intact; next user gesture / sync may retry
    });
  }
}

/**
 * Drive alarm from active SOS rows (live and/or activated test SOS).
 * Empty list → stop. Does not stop merely because a page unmounted.
 */
export function syncSosAlertSound(activeAlerts = []) {
  const key = alertsKey(activeAlerts);
  currentKey = key;

  if (!key) {
    mutedForKey = '';
    stopAudio();
    notify();
    return;
  }

  // New SOS episode after a mute → allow sound again
  if (mutedForKey && mutedForKey !== key) {
    mutedForKey = '';
  }

  if (mutedForKey === key) {
    stopAudio();
    notify();
    return;
  }

  playAudio();
  notify();
}

/** Stop sound only — SOS remains active until Resolve. */
export function stopSosAlertSound() {
  if (currentKey) mutedForKey = currentKey;
  stopAudio();
  notify();
}

export function getSosSoundState() {
  const muted = Boolean(currentKey) && mutedForKey === currentKey;
  return {
    hasActive: Boolean(currentKey),
    muted,
    playing: Boolean(currentKey) && !muted,
  };
}

export function subscribeSosSound(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Keep alarm in sync with temporary test SOS Activate / Resolve across pages
let bridgeStarted = false;
export function ensureSosSoundBridge() {
  if (bridgeStarted || typeof window === 'undefined') return;
  bridgeStarted = true;
  subscribeTestSos(() => {
    syncSosAlertSound(getActiveTestSosAlerts());
  });
  // Initial sync for already-active test SOS (e.g. refresh on another page)
  syncSosAlertSound(getActiveTestSosAlerts());
}
