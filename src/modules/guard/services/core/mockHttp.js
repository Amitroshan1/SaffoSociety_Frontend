import { DUMMY_LATENCY_MS } from '@/config/dataMode';

export function delay(ms = DUMMY_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Axios-like success envelope used by Frontend pages: `res.data.data`. */
export async function ok(payload, meta = {}) {
  await delay();
  return {
    data: {
      success: true,
      data: payload,
      ...meta,
    },
  };
}

export async function fail(message = 'Mock error', status = 400) {
  await delay();
  const err = new Error(message);
  err.response = { status, data: { message } };
  throw err;
}
