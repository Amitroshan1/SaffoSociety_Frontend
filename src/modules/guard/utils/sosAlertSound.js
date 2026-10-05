/**
 * Module-level SOS alarm — survives Guard route changes.
 * Driven by active SOS list from sos.service (dummy or real).
 */

import {
  getActiveSosAlerts,
  subscribeSosAlerts,
} from '@/modules/guard/services/sos/sos.service';

const SOS_SOUND_CANDIDATES = [
  '/sound/Sos_Alert.mp3',
  '/sound/sos_alert.mp3',
  '/sound/sos_alert',
];

const SOS_AUDIO_KEY = '__saffoGuardSosAudio';
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
      /* ignore */
    }
  });
}

function currentAudio() {
  if (audio) return audio;
  if (typeof window !== 'undefined' && window[SOS_AUDIO_KEY]) {
    audio = window[SOS_AUDIO_KEY];
  }
  return audio;
}

function ensureAudio() {
  const existing = currentAudio();
  if (existing) return existing;
  audio = new Audio();
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
  if (typeof window !== 'undefined') {
    window[SOS_AUDIO_KEY] = audio;
    const list = Array.isArray(window.__saffoGuardSosAudios) ? window.__saffoGuardSosAudios : [];
    list.push(audio);
    window.__saffoGuardSosAudios = list;
  }
  return audio;
}

stopAudio();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopAudio();
  });
}

function stopAudio() {
  const seen = new Set();
  const candidates = [audio];
  if (typeof window !== 'undefined') {
    candidates.push(window[SOS_AUDIO_KEY]);
    const list = window.__saffoGuardSosAudios;
    if (Array.isArray(list)) candidates.push(...list);
  }
  for (const el of candidates) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    try {
      el.loop = false;
      el.pause();
      el.currentTime = 0;
      el.removeAttribute('src');
      el.load();
    } catch {
      /* ignore */
    }
  }
  audio = null;
  srcIndex = 0;
}

function liveActiveAlerts(activeAlerts = []) {
  const list = Array.isArray(activeAlerts) ? activeAlerts : [];
  return list.filter((alert) => {
    const id = String(alert?.id ?? '').trim();
    const status = String(alert?.status || '').toLowerCase();
    return Boolean(id) && status === 'active';
  });
}

function alertsKey(activeAlerts = []) {
  return liveActiveAlerts(activeAlerts)
    .map((alert) => String(alert.id))
    .sort()
    .join('|');
}

function playAudio() {
  const el = ensureAudio();
  if (!el.getAttribute('src')) {
    srcIndex = 1;
    el.src = SOS_SOUND_CANDIDATES[0];
    el.load();
  }
  el.loop = true;
  const playPromise = el.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {});
  }
}

export function syncSosAlertSound(activeAlerts = []) {
  const key = alertsKey(activeAlerts);
  currentKey = key;

  if (!key) {
    mutedForKey = '';
    stopAudio();
    notify();
    return;
  }

  if (mutedForKey && mutedForKey !== key) mutedForKey = '';
  if (mutedForKey === key) {
    stopAudio();
    notify();
    return;
  }
  playAudio();
  notify();
}

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

let bridgeStarted = false;
let bridgeSub = null;

export function ensureSosSoundBridge() {
  if (bridgeStarted || typeof window === 'undefined') return;
  bridgeStarted = true;
  syncSosAlertSound([]);

  const refresh = async () => {
    try {
      const active = await getActiveSosAlerts();
      syncSosAlertSound(active);
    } catch {
      syncSosAlertSound([]);
    }
  };

  refresh();
  bridgeSub = subscribeSosAlerts({
    onCreated: () => refresh(),
    onResolved: () => refresh(),
    onReconnectNeedRefetch: () => refresh(),
  });
}

export function teardownSosSoundBridge() {
  bridgeSub?.close?.();
  bridgeSub = null;
  bridgeStarted = false;
}
