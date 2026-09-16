export const LOCATION_RADIUS_METERS = 120;

function toRad(v) {
  return (v * Math.PI) / 180;
}

export function distanceMeters(aLat, aLng, bLat, bLng) {
  const R = 6371000;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function gateCoords(gate) {
  if (!gate) return null;
  const candidates = [
    [gate.latitude, gate.longitude],
    [gate.lat, gate.lng],
    [gate.lat, gate.lon],
    [gate.location?.latitude, gate.location?.longitude],
    [gate.location?.lat, gate.location?.lng],
  ];
  for (const [latRaw, lngRaw] of candidates) {
    const lat = numOrNull(latRaw);
    const lng = numOrNull(lngRaw);
    if (lat !== null && lng !== null) return { lat, lng };
  }
  return null;
}

export function summarizeGeo(locData, gate) {
  const coords = gateCoords(gate);
  if (!locData) {
    return {
      state: 'not_captured',
      text: 'Location not captured',
      hint: 'Capture GPS before punch in/out.',
    };
  }
  if (!coords) {
    return {
      state: 'unknown_gate',
      text: 'Location captured',
      hint: 'Gate coordinates not configured yet.',
    };
  }
  const dist = distanceMeters(locData.latitude, locData.longitude, coords.lat, coords.lng);
  if (dist <= LOCATION_RADIUS_METERS) {
    return {
      state: 'on_location',
      text: 'On location',
      hint: `Within ${Math.round(dist)}m of gate`,
    };
  }
  return {
    state: 'off_location',
    text: 'Outside gate radius',
    hint: `${Math.round(dist)}m away (allowed ${LOCATION_RADIUS_METERS}m)`,
  };
}

export async function captureCurrentLocation() {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported on this device/browser.');
  }
  const pos = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    });
  });
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    capturedAt: new Date().toISOString(),
  };
}

export function geolocationErrorMessage(err) {
  if (err?.code === 1) return 'Location permission denied.';
  if (err?.code === 2) return 'Unable to detect location.';
  if (err?.code === 3) return 'Location request timed out.';
  if (err?.message) return err.message;
  return 'Failed to capture location.';
}
