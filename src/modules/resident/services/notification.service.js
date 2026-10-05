import api from '@/services/api/axios';
import { residentUsesDummy } from '@/config/dataMode';
import { GATE_NOTE_CATEGORIES, RESIDENT_ENDPOINTS as EP } from '@/modules/resident/constants/endpoints';
import { apiMessage, delay, fail, unwrap } from '@/modules/resident/services/core/http';
import { mapNotification } from '@/modules/resident/services/map';
import { listNotifications, markRead, unreadGateCount } from '@/modules/resident/data/residentStore';

export async function listGateNotifications(category = 'all') {
  try {
    if (residentUsesDummy()) {
      await delay();
      return listNotifications(category);
    }
    const params = {};
    if (category && category !== 'all') params.category = category;
    const rows = unwrap(await api.get(EP.notifications, { params }));
    const list = (Array.isArray(rows) ? rows : []).map(mapNotification);
    return list.filter((item) => !category || category === 'all' || GATE_NOTE_CATEGORIES.includes(item.category));
  } catch (err) {
    throw fail(apiMessage(err, 'Failed to load notifications'), err?.response?.status);
  }
}

export async function markGateNotificationRead(id) {
  try {
    if (residentUsesDummy()) {
      await delay(80);
      return markRead(id);
    }
    return mapNotification(unwrap(await api.post(EP.notificationRead(id))));
  } catch (err) {
    throw fail(apiMessage(err, 'Could not mark notification read'), err?.response?.status);
  }
}

export async function getGateUnreadCount() {
  try {
    if (residentUsesDummy()) return unreadGateCount();
    const body = unwrap(await api.get(EP.unreadCount));
    return Number(body?.count) || 0;
  } catch {
    return 0;
  }
}
