/**
 * Shared Guard API helpers — backend contract envelope & media.
 */
import { ENV } from '@/config/env';
import { readAccessToken } from '@/auth/session';

/** Bearer token from the in-memory auth session. Legacy storage keys are not read. */
export function getAccessToken() {
  return readAccessToken();
}

export function unwrapEnvelope(res) {
  const body = res?.data;
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data;
  }
  return body;
}

export function responseMessage(data) {
  if (!data || typeof data !== 'object') return '';
  if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail.trim();
  if (Array.isArray(data.detail)) {
    const text = data.detail
      .map((item) => (typeof item === 'string' ? item : item?.msg))
      .filter(Boolean)
      .join(', ');
    if (text) return text;
  }
  return '';
}

export function apiError(err, fallback = 'Something went wrong') {
  const status = err?.response?.status || err?.status;
  const msg =
    responseMessage(err?.response?.data) ||
    (err?.message && !/^Request failed with status code/.test(err.message) ? err.message : '') ||
    fallback;
  const error = new Error(msg);
  error.status = status;
  error.response = err?.response;
  return error;
}

export function apiErrorMessage(err, fallback = 'Something went wrong') {
  return responseMessage(err?.response?.data) || err?.message || fallback;
}

/** "A-101" or "A-B-101" from the existing single flat field. */
export function splitGateAddress(value) {
  const parts = String(value || '')
    .trim()
    .split(/[\s,/|-]+/)
    .filter(Boolean);
  if (parts.length >= 3) {
    return { building: parts[0], wing: parts[1], flat: parts.slice(2).join('-') };
  }
  if (parts.length === 2) {
    return { building: parts[0], wing: parts[0], flat: parts[1] };
  }
  return { building: '', wing: '', flat: '' };
}

export function requireGateAddress(fields = {}) {
  if (fields.building && (fields.flatNo || fields.flat)) {
    const building = String(fields.building).trim();
    const flat = String(fields.flatNo || fields.flat).trim();
    const wing = String(fields.wing || building).trim();
    return { building, wing, flat };
  }
  const parsed = splitGateAddress(fields.flat || fields.flatNo || '');
  if (!parsed.building || !parsed.flat) {
    const error = new Error('Enter the flat as building and number, for example A-101');
    error.status = 422;
    throw error;
  }
  return parsed;
}

export function gateFlatLabel(row) {
  if (!row) return '—';
  const building = row.buildingNo || row.building || '';
  const wing = row.wingNo || row.wing || '';
  const flatNo = row.flatNo || '';
  if (!building && !wing && !flatNo) return row.flat || '—';
  const parts = [];
  if (building) parts.push(building);
  if (wing && wing !== building) parts.push(wing);
  if (flatNo) parts.push(flatNo);
  return parts.join('-') || row.flat || '—';
}

export function splitStatuses(status) {
  return String(status || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Backend photoUrl is absolute path like /uploads/... — never prefix /api */
export function mediaUrl(photoUrl) {
  if (!photoUrl) return null;
  if (/^https?:\/\//i.test(photoUrl)) return photoUrl;
  const base = (ENV.MEDIA_URL || ENV.API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const path = String(photoUrl).startsWith('/') ? photoUrl : `/${photoUrl}`;
  return `${base}${path}`;
}

/** India calendar date YYYY-MM-DD (Asia/Kolkata) */
export function indiaTodayISO() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function normalizePhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function isValidPhone10(raw) {
  return normalizePhone(raw).length === 10;
}

/** data: URL or Blob/File → File for FormData */
export async function toPhotoFile(photo, filename = 'photo.jpg') {
  if (!photo) return null;
  if (photo instanceof File) return photo;
  if (photo instanceof Blob) {
    return new File([photo], filename, { type: photo.type || 'image/jpeg' });
  }
  const src = String(photo);
  if (src.startsWith('data:')) {
    const res = await fetch(src);
    const blob = await res.blob();
    const ext = (blob.type || 'image/jpeg').split('/')[1] || 'jpg';
    return new File([blob], `photo.${ext}`, { type: blob.type || 'image/jpeg' });
  }
  return null;
}

export const PHOTO_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export function validatePhotoFile(file) {
  if (!file) return null;
  const okTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (file.type && !okTypes.includes(file.type.toLowerCase()) && !okTypes.includes(file.type)) {
    return 'Photo must be JPG, JPEG, PNG, or WEBP.';
  }
  if (file.size > PHOTO_MAX_BYTES) return 'Photo must be 5 MB or smaller.';
  return null;
}

export function emptyPagination(page = 1, pageSize = 20) {
  return {
    page,
    pageSize,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };
}

export function buildPagination(total, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
