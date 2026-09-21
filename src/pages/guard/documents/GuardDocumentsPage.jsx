import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '@/constants/guardRoutes.js';
import '@/styles/guard/guard-main.css';
import '@/styles/common/crud.css';
import Sidebar from '@/components/guard/Sidebar';
import DashboardHeader from '@/components/guard/DashboardHeader';
import { SearchInput } from '@/components/common/index.js';
import {
  downloadGuardDocument,
  formatFileSize,
  listGuardDocuments,
  openDownloadedFile,
} from '@/services/document.service.js';

const PAGE_TABS = [
  { key: 'documents', label: 'Documents' },
  { key: 'clearance', label: 'Move-out Clearance' },
];

const CLEARANCE_CHECKS = [
  { key: 'leaveLicense', label: 'Leave & License Agreement' },
  { key: 'tenantId', label: 'Tenant ID Proof' },
  { key: 'ownerConfirm', label: 'Owner Confirmation' },
  { key: 'duesClear', label: 'Dues Clearance' },
];

function formatPublished(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const DEMO_DOC_URL =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

function buildDemoClearances() {
  return [
    {
      id: 'clr-1',
      residentName: 'Rahul Mehta',
      flatNumber: 'C3-312',
      moveOutDate: '2026-09-20',
      leaveLicense: true,
      tenantId: true,
      ownerConfirm: true,
      duesClear: false,
      notes: 'Dues clearance pending from office — do not allow exit yet',
      gateAllowed: false,
      documents: [
        {
          id: 'clr-1-d1',
          title: 'Leave & License Agreement',
          uploadedBy: 'Resident',
          fileUrl: DEMO_DOC_URL,
        },
        {
          id: 'clr-1-d2',
          title: 'Tenant ID Proof',
          uploadedBy: 'Resident',
          fileUrl: DEMO_DOC_URL,
        },
        {
          id: 'clr-1-d3',
          title: 'Owner Confirmation',
          uploadedBy: 'Owner',
          fileUrl: DEMO_DOC_URL,
        },
      ],
    },
    {
      id: 'clr-2',
      residentName: 'Priya Sharma',
      flatNumber: 'B2-204',
      moveOutDate: '2026-09-18',
      leaveLicense: true,
      tenantId: true,
      ownerConfirm: false,
      duesClear: false,
      notes: 'Owner confirmation and dues clearance pending',
      gateAllowed: false,
      documents: [
        {
          id: 'clr-2-d1',
          title: 'Leave & License Agreement',
          uploadedBy: 'Resident',
          fileUrl: DEMO_DOC_URL,
        },
        {
          id: 'clr-2-d2',
          title: 'Tenant ID Proof',
          uploadedBy: 'Resident',
          fileUrl: DEMO_DOC_URL,
        },
      ],
    },
    {
      id: 'clr-3',
      residentName: 'Anita Desai',
      flatNumber: 'A1-102',
      moveOutDate: '2026-09-12',
      leaveLicense: true,
      tenantId: true,
      ownerConfirm: true,
      duesClear: true,
      notes: 'All documents uploaded — ready for gate exit',
      gateAllowed: false,
      documents: [
        {
          id: 'clr-3-d1',
          title: 'Leave & License Agreement',
          uploadedBy: 'Resident',
          fileUrl: DEMO_DOC_URL,
        },
        {
          id: 'clr-3-d2',
          title: 'Tenant ID Proof',
          uploadedBy: 'Resident',
          fileUrl: DEMO_DOC_URL,
        },
        {
          id: 'clr-3-d3',
          title: 'Owner Confirmation',
          uploadedBy: 'Owner',
          fileUrl: DEMO_DOC_URL,
        },
        {
          id: 'clr-3-d4',
          title: 'Dues Clearance',
          uploadedBy: 'Secretary',
          fileUrl: DEMO_DOC_URL,
        },
      ],
    },
  ];
}

function isFullyClear(row) {
  return CLEARANCE_CHECKS.every((c) => Boolean(row[c.key]));
}

export default function GuardDocumentsPage() {
  const navigate = useNavigate();
  const [pageTab, setPageTab] = useState('documents');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [clearances, setClearances] = useState(() => buildDemoClearances());
  const [clrSearch, setClrSearch] = useState('');
  const [clrFilter, setClrFilter] = useState('all'); // all | pending | clear
  const [docViewer, setDocViewer] = useState(null); // { residentName, flatNumber, documents, index }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listGuardDocuments({
        page: 1,
        pageSize: 50,
        search: search.trim() || undefined,
      });
      setRows(res.data?.data?.documents || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    document.title = 'Documents | Guard Dashboard';
    load();
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, [load]);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  const categories = useMemo(() => {
    const set = new Set();
    for (const row of rows) {
      if (row.categoryName) set.add(row.categoryName);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (category === 'all') return rows;
    return rows.filter((r) => (r.categoryName || '') === category);
  }, [rows, category]);

  const filteredClearances = useMemo(() => {
    const term = clrSearch.trim().toLowerCase();
    return clearances.filter((r) => {
      const matchSearch =
        !term ||
        (r.residentName || '').toLowerCase().includes(term) ||
        (r.flatNumber || '').toLowerCase().includes(term);
      if (!matchSearch) return false;
      if (clrFilter === 'clear') return isFullyClear(r) && !r.gateAllowed;
      if (clrFilter === 'pending') return !isFullyClear(r);
      if (clrFilter === 'allowed') return Boolean(r.gateAllowed);
      return true;
    });
  }, [clearances, clrSearch, clrFilter]);

  async function openDocument(row, mode) {
    setBusyId(`${mode}-${row.id}`);
    setError('');
    try {
      if (mode === 'view' && row.fileUrl) {
        window.open(row.fileUrl, '_blank', 'noopener');
        return;
      }
      const { data } = await downloadGuardDocument(row.id);
      openDownloadedFile(data, row.fileUrl);
    } catch (err) {
      setError(err.response?.data?.message || (mode === 'view' ? 'View failed' : 'Download failed'));
    } finally {
      setBusyId(null);
    }
  }

  function allowToGo(id) {
    const row = clearances.find((r) => r.id === id);
    if (!row || !isFullyClear(row)) {
      setError('Cannot allow exit — clearance incomplete from office.');
      setTimeout(() => setError(''), 2800);
      return;
    }
    setClearances((prev) =>
      prev.map((r) => (r.id === id ? { ...r, gateAllowed: true, notes: 'Guard allowed exit at gate' } : r)),
    );
    setSuccess(`Allowed ${row.residentName} (${row.flatNumber}) to leave`);
    setTimeout(() => setSuccess(''), 2800);
  }

  function openClearanceDocs(row) {
    const docs = row.documents || [];
    if (docs.length === 0) {
      setError('No documents uploaded yet.');
      setTimeout(() => setError(''), 2800);
      return;
    }
    setDocViewer({
      residentName: row.residentName,
      flatNumber: row.flatNumber,
      documents: docs,
      index: 0,
    });
  }

  function closeClearanceDocs() {
    setDocViewer(null);
  }

  function stepClearanceDoc(delta) {
    setDocViewer((prev) => {
      if (!prev) return prev;
      const next = prev.index + delta;
      if (next < 0 || next >= prev.documents.length) return prev;
      return { ...prev, index: next };
    });
  }

  const viewerDoc = docViewer?.documents?.[docViewer.index] || null;

  return (
    <div className="gm-root">
      <Sidebar activePage="Documents" onNavigate={handleSidebarNav} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <h2 className="gm-park-page-title">Documents</h2>
          {error ? <div style={{ color: '#fca5a5', marginBottom: 10 }}>{error}</div> : null}
          {success ? <div style={{ color: '#86efac', marginBottom: 10 }}>{success}</div> : null}

          <div className="gm-book-filters" role="tablist" aria-label="Documents page tabs">
            {PAGE_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={pageTab === t.key}
                className={`gm-book-filter${pageTab === t.key ? ' gm-book-filter--active' : ''}`}
                onClick={() => setPageTab(t.key)}
              >
                <span>{t.label}</span>
                {t.key === 'clearance' ? (
                  <span className="gm-book-filter-count">
                    {clearances.filter((r) => !isFullyClear(r)).length}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {pageTab === 'documents' ? (
            <>
              <div className="gm-park-toolbar">
                <div className="gm-park-search">
                  <SearchInput value={search} onChange={setSearch} placeholder="Search documents" />
                </div>
                {categories.length > 0 ? (
                  <div className="gm-doc-filters">
                    <button
                      type="button"
                      className={`gm-doc-chip ${category === 'all' ? 'is-active' : ''}`}
                      onClick={() => setCategory('all')}
                    >
                      All
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`gm-doc-chip ${category === c ? 'is-active' : ''}`}
                        onClick={() => setCategory(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {loading ? (
                <p>Loading…</p>
              ) : (
                <div className="glass-card gm-park-table-card">
                  <div className="gm-doc-table-head">
                    <h3 className="gm-park-table-title">Gate documents</h3>
                    <span className="gm-doc-count">
                      {filteredRows.length} file{filteredRows.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <table className="crud-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Size</th>
                        <th>Published</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={5}>No documents available.</td>
                        </tr>
                      ) : null}
                      {filteredRows.map((row) => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 600 }}>{row.title || '—'}</td>
                          <td>{row.categoryName || '—'}</td>
                          <td>{formatFileSize(row.fileSizeBytes)}</td>
                          <td>{formatPublished(row.publishedAt || row.createdAt)}</td>
                          <td>
                            <div className="gm-doc-actions">
                              <button
                                type="button"
                                className="btn-ghost gm-doc-btn"
                                disabled={busyId === `view-${row.id}`}
                                onClick={() => openDocument(row, 'view')}
                              >
                                {busyId === `view-${row.id}` ? 'Opening…' : 'View'}
                              </button>
                              <button
                                type="button"
                                className="btn-primary gm-doc-btn"
                                disabled={busyId === `download-${row.id}`}
                                onClick={() => openDocument(row, 'download')}
                              >
                                {busyId === `download-${row.id}` ? 'Downloading…' : 'Download'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="gm-park-toolbar">
                <div className="gm-park-search">
                  <SearchInput
                    value={clrSearch}
                    onChange={setClrSearch}
                    placeholder="Search flat / resident"
                    debounceMs={0}
                  />
                </div>
                <div className="gm-doc-filters">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'pending', label: 'Not cleared' },
                    { key: 'clear', label: 'Ready for gate' },
                    { key: 'allowed', label: 'Allowed' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`gm-doc-chip ${clrFilter === f.key ? 'is-active' : ''}`}
                      onClick={() => setClrFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card gm-park-table-card">
                <div className="gm-doc-table-head">
                  <h3 className="gm-park-table-title">Move-out clearance</h3>
                  <span className="gm-doc-count">
                    {filteredClearances.length} request
                    {filteredClearances.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="gm-clr-table-wrap">
                  <table className="crud-table gm-clr-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Resident</th>
                        <th>Flat</th>
                        <th>Move-out</th>
                        {CLEARANCE_CHECKS.map((c) => (
                          <th key={c.key}>{c.label}</th>
                        ))}
                        <th>Documents</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClearances.length === 0 ? (
                        <tr>
                          <td colSpan={3 + CLEARANCE_CHECKS.length + 3}>No move-out requests found.</td>
                        </tr>
                      ) : null}
                      {filteredClearances.map((row) => {
                        const ready = isFullyClear(row);
                        return (
                          <tr key={row.id}>
                            <td style={{ fontWeight: 600 }}>{row.residentName}</td>
                            <td>{row.flatNumber}</td>
                            <td>
                              {row.moveOutDate
                                ? formatPublished(`${row.moveOutDate}T12:00:00`).split(',')[0]
                                : '—'}
                            </td>
                            {CLEARANCE_CHECKS.map((c) => {
                              const ok = Boolean(row[c.key]);
                              return (
                                <td key={c.key} className={ok ? 'gm-clr-cell-ok' : 'gm-clr-cell-no'}>
                                  {ok ? 'Yes' : 'No'}
                                </td>
                              );
                            })}
                            <td>
                              {(row.documents || []).length === 0 ? (
                                <span className="gm-clr-muted">—</span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-ghost gm-doc-btn"
                                  onClick={() => openClearanceDocs(row)}
                                >
                                  View
                                </button>
                              )}
                            </td>
                            <td>
                              {row.gateAllowed ? (
                                <span className="gm-clr-status gm-clr-status--allowed">Allowed</span>
                              ) : ready ? (
                                <span className="gm-clr-status gm-clr-status--ok">Ready</span>
                              ) : (
                                <span className="gm-clr-status gm-clr-status--pending">Pending</span>
                              )}
                            </td>
                            <td>
                              {row.gateAllowed ? (
                                <span className="gm-clr-muted">Done</span>
                              ) : ready ? (
                                <button
                                  type="button"
                                  className="btn-primary gm-doc-btn"
                                  onClick={() => allowToGo(row.id)}
                                >
                                  Allow to go
                                </button>
                              ) : (
                                <span className="gm-clr-muted">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {docViewer && viewerDoc ? (
        <div
          className="gm-clr-viewer-backdrop"
          role="presentation"
          onClick={closeClearanceDocs}
        >
          <div
            className="gm-clr-viewer"
            role="dialog"
            aria-modal="true"
            aria-label="Clearance documents"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gm-clr-viewer-head">
              <div>
                <div className="gm-clr-viewer-title">{viewerDoc.title}</div>
                <div className="gm-clr-viewer-meta">
                  {docViewer.residentName} · Flat {docViewer.flatNumber}
                  {viewerDoc.uploadedBy ? ` · Uploaded by ${viewerDoc.uploadedBy}` : ''}
                  {' · '}
                  Paper {docViewer.index + 1} of {docViewer.documents.length}
                </div>
              </div>
              <button type="button" className="btn-ghost gm-doc-btn" onClick={closeClearanceDocs}>
                Close
              </button>
            </div>

            <div className="gm-clr-viewer-body">
              {viewerDoc.fileUrl ? (
                <iframe title={viewerDoc.title} src={viewerDoc.fileUrl} className="gm-clr-viewer-frame" />
              ) : (
                <p className="gm-clr-muted">Document file not available.</p>
              )}
            </div>

            <div className="gm-clr-viewer-foot">
              <button
                type="button"
                className="btn-ghost gm-doc-btn"
                disabled={docViewer.index <= 0}
                onClick={() => stepClearanceDoc(-1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn-primary gm-doc-btn"
                disabled={docViewer.index >= docViewer.documents.length - 1}
                onClick={() => stepClearanceDoc(1)}
              >
                Next paper
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
