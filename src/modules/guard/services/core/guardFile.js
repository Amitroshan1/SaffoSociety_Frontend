/**
 * Authenticated file fetch for document and move-out view/download URLs.
 * Successful bodies are bytes. JSON bodies are errors.
 */
import api from '@/services/api/axios';
import { USE_DUMMY_DATA, panelUsesDummy } from '@/config/dataMode';
import { delay } from '@/modules/guard/services/core/mockHttp';
import { apiError } from '@/modules/guard/services/core/http';

const mockFiles = new Map();

export function registerMockGuardFile(path, fileName = 'document.pdf') {
  if (!path) return;
  mockFiles.set(String(path), fileName);
}

function mockPdfBlob(fileName) {
  const body = `%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n% ${fileName}\n`;
  return new Blob([body], { type: 'application/pdf' });
}

async function messageFromBlob(blob) {
  try {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    return parsed?.message || 'Request failed';
  } catch {
    return 'Request failed';
  }
}

function isJsonType(contentType, blob) {
  const type = String(contentType || blob?.type || '').toLowerCase();
  return type.includes('application/json') || type.includes('text/json');
}

export async function fetchAuthorizedFile(path) {
  const url = String(path || '').trim();
  if (!url) {
    const e = new Error('File not found');
    e.status = 404;
    throw e;
  }

  const documentPath = url.startsWith('/guard/documents/');
  if (USE_DUMMY_DATA && (panelUsesDummy() || !documentPath)) {
    await delay();
    if (!mockFiles.has(url)) {
      const e = new Error('File not found');
      e.status = 404;
      throw e;
    }
    return { blob: mockPdfBlob(mockFiles.get(url)), fileName: mockFiles.get(url) };
  }

  try {
    const res = await api.get(url, { responseType: 'blob' });
    const blob = res.data;
    const contentType = res.headers?.['content-type'] || blob?.type;
    if (isJsonType(contentType, blob)) {
      const e = new Error(await messageFromBlob(blob));
      e.status = res.status;
      throw e;
    }
    return { blob };
  } catch (err) {
    if (err?.response?.data instanceof Blob) {
      const message = await messageFromBlob(err.response.data);
      const e = new Error(message);
      e.status = err.response.status;
      throw e;
    }
    throw apiError(err, 'File request failed');
  }
}

export async function openGuardDocument(path, fileName) {
  const { blob } = await fetchAuthorizedFile(path);
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, '_blank', 'noopener');
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  return fileName || null;
}

export async function downloadGuardFile(path, fileName) {
  const { blob, fileName: mockName } = await fetchAuthorizedFile(path);
  const name = fileName || mockName || 'download';
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
