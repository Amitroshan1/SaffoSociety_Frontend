import { DUMMY_LATENCY_MS } from '@/config/dataMode';
import { ENV } from '@/config/env';

export function mediaUrl(path) {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const base = (ENV.MEDIA_URL || ENV.API_URL || '').replace(/\/$/, '');
  return `${base}${String(path).startsWith('/') ? path : `/${path}`}`;
}

export function delay(ms = DUMMY_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function unwrap(res) {
  const body = res?.data;
  if (body && typeof body === 'object' && 'data' in body) return body.data;
  return body;
}

export function apiMessage(err, fallback = 'Something went wrong') {
  const data = err?.response?.data;
  const detail = data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    const first = detail.find((item) => item && typeof item.msg === 'string');
    if (first?.msg) return first.msg;
  }
  if (typeof data?.message === 'string' && data.message.trim()) return data.message.trim();
  if (err?.message && !String(err.message).startsWith('Request failed with status code')) return err.message;
  return fallback;
}

export function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  error.response = { status, data: { success: false, message } };
  return error;
}
