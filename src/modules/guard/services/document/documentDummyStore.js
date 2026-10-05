import { registerMockGuardFile } from '@/modules/guard/services/core/guardFile';

const documents = [
  {
    id: 'doc-1',
    title: 'Gate emergency procedure',
    category: 'security',
    sizeBytes: 248320,
    publishedAt: '2026-09-18T09:30:00+05:30',
    fileName: 'gate-emergency.pdf',
    viewUrl: '/guard/documents/doc-1/view',
    downloadUrl: '/guard/documents/doc-1/download',
  },
  {
    id: 'doc-2',
    title: 'Visitor SOP',
    category: 'security',
    sizeBytes: 184220,
    publishedAt: '2026-08-12T11:00:00+05:30',
    fileName: 'visitor-sop.pdf',
    viewUrl: '/guard/documents/doc-2/view',
    downloadUrl: '/guard/documents/doc-2/download',
  },
  {
    id: 'doc-3',
    title: 'Society rules 2026',
    category: 'society',
    sizeBytes: 512000,
    publishedAt: '2026-09-01T08:15:00+05:30',
    fileName: 'society-rules-2026.pdf',
    viewUrl: '/guard/documents/doc-3/view',
    downloadUrl: '/guard/documents/doc-3/download',
  },
  {
    id: 'doc-4',
    title: 'Parking guidelines',
    category: 'society',
    sizeBytes: 96000,
    publishedAt: '2026-07-20T16:40:00+05:30',
    fileName: 'parking-guidelines.pdf',
    viewUrl: '/guard/documents/doc-4/view',
    downloadUrl: '/guard/documents/doc-4/download',
  },
];

documents.forEach((doc) => {
  registerMockGuardFile(doc.viewUrl, doc.fileName);
  registerMockGuardFile(doc.downloadUrl, doc.fileName);
});

export function allDocuments() {
  return documents.map((d) => ({ ...d }));
}

export function findDocument(id) {
  return documents.find((d) => d.id === id) || null;
}
