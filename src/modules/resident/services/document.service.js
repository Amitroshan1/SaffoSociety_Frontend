import api from '@/services/api/axios';
import { residentUsesDummy } from '@/config/dataMode';
import { RESIDENT_ENDPOINTS as EP } from '@/modules/resident/constants/endpoints';
import { apiMessage, delay, fail, unwrap } from '@/modules/resident/services/core/http';
import { CLEARANCE_TYPE, mapClearance } from '@/modules/resident/services/map';
import { getClearance, uploadClearance } from '@/modules/resident/data/residentStore';

async function loadCases() {
  const rows = unwrap(await api.get(EP.clearances));
  return Array.isArray(rows) ? rows : [];
}

export async function getMoveOutClearance() {
  try {
    if (residentUsesDummy()) {
      await delay();
      return getClearance();
    }
    const rows = await loadCases();
    const current = rows[0] || null;
    return mapClearance(current);
  } catch (err) {
    throw fail(apiMessage(err, 'Failed to load clearance'), err?.response?.status);
  }
}

export async function uploadClearanceFile(key) {
  if (residentUsesDummy()) {
    await delay();
    return uploadClearance(key, arguments[1]?.name);
  }
  const docType = CLEARANCE_TYPE[key];
  if (!docType) {
    throw fail('This document type is not accepted by the server.', 400);
  }
  if (docType === 'dues_clear') {
    throw fail('Dues clearance is recorded by the society office, not by a file upload.', 403);
  }
  throw fail(
    'The server stores a document URL. There is no resident route that accepts the file itself.',
    400,
  );
}
