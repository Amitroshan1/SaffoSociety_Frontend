/**
 * Guard SOS alerts WebSocket — real mode only.
 * ws://localhost:8000/ws/guard/alerts?token=<access_token>
 *
 * Events: sos.created | sos.resolved
 */
import { ENV } from '@/config/env';
import { guardAlertsWsUrl } from '@/modules/guard/constants/opsEndpoints';
import { getAccessToken } from '@/modules/guard/services/core/http';

/**
 * @param {object} handlers
 * @param {(alert: object) => void} handlers.onCreated
 * @param {(alert: object) => void} handlers.onResolved
 * @param {(err: Error) => void} [handlers.onError]
 * @param {() => void} [handlers.onOpen]
 * @param {() => void} [handlers.onClose]
 * @param {() => Promise<void>} [handlers.onReconnectNeedRefetch]
 */
export function connectSosAlertsSocket(handlers = {}) {
  let ws = null;
  let closedByUser = false;
  let retry = 0;
  let retryTimer = null;
  const maxRetry = 8;

  function clearRetry() {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  }

  function scheduleReconnect() {
    if (closedByUser) return;
    if (retry >= maxRetry) {
      handlers.onError?.(new Error('SOS WebSocket reconnect failed'));
      return;
    }
    const delay = Math.min(15000, 1000 * 2 ** retry);
    retry += 1;
    clearRetry();
    retryTimer = setTimeout(async () => {
      try {
        await handlers.onReconnectNeedRefetch?.();
      } catch {
        /* refetch best-effort */
      }
      open();
    }, delay);
  }

  function open() {
    const token = getAccessToken();
    if (!token) {
      handlers.onError?.(new Error('Missing access token for SOS WebSocket'));
      return;
    }
    const url = guardAlertsWsUrl(ENV.API_URL, token);
    try {
      ws = new WebSocket(url);
    } catch (err) {
      handlers.onError?.(err instanceof Error ? err : new Error('WebSocket failed'));
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      retry = 0;
      handlers.onOpen?.();
    };

    ws.onmessage = (ev) => {
      let payload;
      try {
        payload = JSON.parse(ev.data);
      } catch {
        return;
      }
      const type = payload?.type || payload?.event;
      const data = payload?.data ?? payload?.alert ?? payload;
      if (type === 'sos.created') handlers.onCreated?.(data);
      else if (type === 'sos.resolved') handlers.onResolved?.(data);
    };

    ws.onerror = () => {
      handlers.onError?.(new Error('SOS WebSocket error'));
    };

    ws.onclose = (ev) => {
      handlers.onClose?.();
      ws = null;
      if (closedByUser) return;
      // 4001/4401-style auth failures — do not loop forever
      if (ev.code === 4001 || ev.code === 4401 || ev.code === 4403) {
        handlers.onError?.(new Error('SOS WebSocket unauthorized'));
        return;
      }
      scheduleReconnect();
    };
  }

  open();

  return {
    close() {
      closedByUser = true;
      clearRetry();
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
      ws = null;
    },
  };
}
