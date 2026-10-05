/**
 * Guard documents — list, open, download only.
 * Categories: all | security | society.
 */
import api from '@/services/api/axios';
import { panelUsesDummy } from '@/config/dataMode';
import { GUARD_PANEL_ENDPOINTS as EP } from '@/modules/guard/constants/panelEndpoints';
import { delay } from '@/modules/guard/services/core/mockHttp';
import { apiError, buildPagination, unwrapEnvelope } from '@/modules/guard/services/core/http';
import { downloadGuardFile, openGuardDocument } from '@/modules/guard/services/core/guardFile';
import { allDocuments, findDocument } from '@/modules/guard/services/document/documentDummyStore';

const CATEGORIES = new Set(['all', 'security', 'society']);
const SORTS = new Set(['publishedAt', 'title', 'category', 'sizeBytes', 'fileName']);

export const formatFileSize = (bytes) => {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

function countsOf(rows) {
  return {
    all: rows.length,
    security: rows.filter((d) => d.category === 'security').length,
    society: rows.filter((d) => d.category === 'society').length,
  };
}

function mockList(params) {
  const category = params.category == null || params.category === '' ? 'all' : String(params.category);
  if (!CATEGORIES.has(category)) {
    const e = new Error('Unknown document category');
    e.status = 400;
    throw e;
  }
  const sortBy = params.sortBy || 'publishedAt';
  if (!SORTS.has(sortBy)) {
    const e = new Error('Unsupported sort field');
    e.status = 400;
    throw e;
  }
  const source = allDocuments();
  const counts = countsOf(source);
  let rows = source;
  if (category !== 'all') rows = rows.filter((d) => d.category === category);
  const needle = String(params.search || '').trim().toLowerCase();
  if (needle) {
    rows = rows.filter(
      (d) =>
        String(d.title || '').toLowerCase().includes(needle) ||
        String(d.fileName || '').toLowerCase().includes(needle),
    );
  }
  const dir = params.sortOrder === 'asc' ? 1 : -1;
  rows = [...rows].sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av || '').localeCompare(String(bv || '')) * dir;
  });
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
  const page = Math.max(1, Number(params.page) || 1);
  const start = (page - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    pagination: buildPagination(rows.length, page, pageSize),
    counts,
  };
}

export async function listGuardDocuments(params = {}) {
  try {
    const query = { ...params };
    if (!query.category || query.category === 'all') delete query.category;
    if (!query.sortBy) query.sortBy = 'publishedAt';
    if (!query.sortOrder) query.sortOrder = 'desc';
    if (!query.pageSize) query.pageSize = 20;
    if (panelUsesDummy()) {
      await delay();
      return mockList(query);
    }
    const res = await api.get(EP.documents, { params: query });
    const data = unwrapEnvelope(res) || {};
    const items = data.items || data.documents || [];
    return {
      items,
      pagination: data.pagination,
      counts: data.counts,
    };
  } catch (err) {
    throw apiError(err, 'Failed to load documents');
  }
}

export async function getGuardDocument(id) {
  try {
    if (panelUsesDummy()) {
      await delay();
      const row = findDocument(id);
      if (!row) {
        const e = new Error('Document not found');
        e.status = 404;
        throw e;
      }
      return row;
    }
    const res = await api.get(EP.documentById(id));
    return unwrapEnvelope(res);
  } catch (err) {
    throw apiError(err, 'Document not found');
  }
}

export async function openGuardDocumentFile(path, fileName) {
  return openGuardDocument(path, fileName);
}

export async function downloadGuardDocument(path, fileName) {
  return downloadGuardFile(path, fileName);
}
