import api from '@/services/api/axios';
import { residentUsesDummy } from '@/config/dataMode';
import { RESIDENT_ENDPOINTS as EP } from '@/modules/resident/constants/endpoints';
import { apiMessage, delay, fail, unwrap } from '@/modules/resident/services/core/http';
import { mapSos } from '@/modules/resident/services/map';
import { closeSos, createSos, listSos } from '@/modules/resident/data/residentStore';

export async function listMySos() {
  try {
    if (residentUsesDummy()) {
      await delay();
      return listSos();
    }
    const rows = unwrap(await api.get(EP.sos));
    return Array.isArray(rows) ? rows.map(mapSos) : [];
  } catch (err) {
    throw fail(apiMessage(err, 'Failed to load SOS'), err?.response?.status);
  }
}

export async function raiseSos({ title, note }) {
  try {
    if (residentUsesDummy()) {
      await delay();
      return createSos({ title, note });
    }
    const res = await api.post(EP.sos, {
      title: String(title || '').trim(),
      description: String(note || title || '').trim(),
      photo_url: null,
    });
    return mapSos(unwrap(res));
  } catch (err) {
    throw fail(apiMessage(err, 'Could not raise SOS'), err?.status || err?.response?.status);
  }
}

/** Both resolve and cancel use POST /resident/sos/{id}/close. The API has one closed status. */
export async function closeMySos(id, action) {
  try {
    if (residentUsesDummy()) {
      await delay();
      return closeSos(id, action);
    }
    const res = await api.post(EP.sosClose(id));
    return mapSos(unwrap(res));
  } catch (err) {
    throw fail(apiMessage(err, 'Could not update SOS'), err?.status || err?.response?.status);
  }
}
