import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Calendar, Check, Download, Eye, FileText } from 'lucide-react';
import { navigateGuard } from '@/modules/guard/constants/guardRoutes.js';
import Sidebar from '@/modules/guard/components/Sidebar';
import DashboardHeader from '@/modules/guard/components/DashboardHeader';
import { Pagination, SearchInput } from '@/modules/guard/common/index.js';
import {
  downloadGuardDocument,
  formatFileSize,
  listGuardDocuments,
  openGuardDocumentFile,
} from '@/modules/guard/services/document/document.service.js';
import {
  allowMoveOut,
  listMoveOutRequests,
  viewMoveOutFile,
} from '@/modules/guard/services/moveout/moveout.service.js';
import '@/modules/guard/styles/core/guard-main.css';
import '@/modules/guard/styles/document/document.css';

const PAGE_TABS = [
  { key: 'documents', label: 'Documents' },
  { key: 'clearance', label: 'Move-out Clearance' },
];

const CATEGORY_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'security', label: 'Security' },
  { key: 'society', label: 'Society' },
];

const CLEARANCE_CHECKS = [
  { key: 'leaveLicense', label: 'Leave & License Agreement', short: 'Leave & License' },
  { key: 'tenantIdProof', label: 'Tenant ID Proof', short: 'Tenant ID' },
  { key: 'ownerConfirmation', label: 'Owner Confirmation', short: 'Owner confirmation' },
  { key: 'duesClearance', label: 'Dues Clearance', short: 'Dues clearance' },
];

const CLR_FILTERS = [
  { key: 'all', label: 'All', status: 'all' },
  { key: 'pending', label: 'Pending', status: 'pending' },
  { key: 'clear', label: 'Ready', status: 'ready' },
  { key: 'allowed', label: 'Allowed', status: 'allowed' },
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

function formatMoveOutDate(value) {
  if (!value) return '—';
  const raw = String(value);
  const d = new Date(raw.includes('T') ? raw : `${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function clearanceScore(row) {
  const done = CLEARANCE_CHECKS.filter((check) => Boolean(row?.[check.key])).length;
  return { done, total: CLEARANCE_CHECKS.length };
}

function statusMeta(status) {
  if (status === 'ready') return { label: 'Ready', tone: 'ready' };
  if (status === 'allowed') return { label: 'Allowed', tone: 'allowed' };
  return { label: 'Pending', tone: 'pending' };
}

function messageOf(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}

export default function GuardDocumentsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [pageTab, setPageTab] = useState(params.get('tab') === 'clearance' ? 'clearance' : 'documents');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [counts, setCounts] = useState({ all: 0, security: 0, society: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [clearances, setClearances] = useState([]);
  const [clrSearch, setClrSearch] = useState('');
  const [clrFilter, setClrFilter] = useState('all');
  const [clrLoading, setClrLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [docViewer, setDocViewer] = useState(null);
  const [viewerUrl, setViewerUrl] = useState('');

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listGuardDocuments({
        page,
        pageSize: 20,
        search: search.trim() || undefined,
        category,
        sortBy: 'publishedAt',
        sortOrder: 'desc',
      });
      setRows(data.items || []);
      setPagination(data.pagination || null);
      setCounts(data.counts || { all: 0, security: 0, society: 0 });
    } catch (err) {
      setError(messageOf(err, 'Failed to load documents'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  const loadClearance = useCallback(async () => {
    setClrLoading(true);
    setError('');
    try {
      const status = CLR_FILTERS.find((f) => f.key === clrFilter)?.status || 'all';
      const data = await listMoveOutRequests({
        status,
        search: clrSearch.trim() || undefined,
      });
      setClearances(data.items || []);
    } catch (err) {
      setError(messageOf(err, 'Failed to load move-out requests'));
      setClearances([]);
    } finally {
      setClrLoading(false);
    }
  }, [clrFilter, clrSearch]);

  useEffect(() => {
    document.title = 'Documents | Guard Dashboard';
    return () => {
      document.title = 'Guard Dashboard';
    };
  }, []);

  useEffect(() => {
    if (params.get('tab') === 'clearance') setPageTab('clearance');
  }, [params]);

  useEffect(() => {
    if (pageTab === 'documents') loadDocs();
  }, [pageTab, loadDocs]);

  useEffect(() => {
    if (pageTab === 'clearance') loadClearance();
  }, [pageTab, loadClearance]);

  useEffect(() => {
    let cancelled = false;
    const doc = docViewer?.documents?.[docViewer.index];
    if (!doc?.viewUrl) {
      setViewerUrl('');
      return undefined;
    }
    viewMoveOutFile(doc.viewUrl)
      .then((url) => {
        if (!cancelled) setViewerUrl(url);
      })
      .catch((err) => {
        if (!cancelled) {
          setViewerUrl('');
          setError(messageOf(err, 'Could not open file'));
        }
      });
    return () => {
      cancelled = true;
      setViewerUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return '';
      });
    };
  }, [docViewer]);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  async function openDocument(row, mode) {
    setBusyId(`${mode}-${row.id}`);
    setError('');
    try {
      const path = mode === 'view' ? row.viewUrl : row.downloadUrl;
      if (mode === 'view') await openGuardDocumentFile(path, row.fileName);
      else await downloadGuardDocument(path, row.fileName);
    } catch (err) {
      setError(messageOf(err, mode === 'view' ? 'View failed' : 'Download failed'));
    } finally {
      setBusyId(null);
    }
  }

  async function allowToGo(id) {
    setError('');
    setBusyId(id);
    try {
      await allowMoveOut(id);
      setSuccess('Move-out allowed');
      setTimeout(() => setSuccess(''), 2800);
      setDetail((prev) => (
        prev && prev.id === id
          ? { ...prev, status: 'allowed', canAllow: false, allowedAt: new Date().toISOString() }
          : prev
      ));
      await loadClearance();
    } catch (err) {
      setError(messageOf(err, 'Allow to go failed'));
      await loadClearance();
    } finally {
      setBusyId(null);
    }
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
      flatNumber: row.flatNo,
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
  const pendingBadge = clearances.filter((row) => row.status === 'pending').length;
  const fileCount = pagination?.total ?? rows.length;
  const detailScore = detail ? clearanceScore(detail) : null;
  const detailStatus = detail ? statusMeta(detail.status) : null;

  function renderAllowAction(row) {
    if (row.status === 'allowed') return <span className="gdoc-muted">Done</span>;
    if (!row.canAllow) return <span className="gdoc-muted">—</span>;
    return (
      <button
        type="button"
        className="btn-primary gdoc-btn"
        disabled={busyId === row.id}
        onClick={() => allowToGo(row.id)}
      >
        {busyId === row.id ? 'Allowing…' : 'Allow to go'}
      </button>
    );
  }

  return (
    <div className="gm-root" data-theme="light">
      <Sidebar activePage="Documents" onNavigate={handleSidebarNav} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main gdoc-page">
          <header className="gdoc-head">
            <p className="gdoc-kicker">Documents</p>
            <h1 className="gdoc-title">Documents</h1>
          </header>

          {error ? (
            <p className="gdoc-note gdoc-note--error">
              {error}
              {pageTab === 'documents' ? (
                <button type="button" className="gdoc-retry" onClick={loadDocs}>Retry</button>
              ) : (
                <button type="button" className="gdoc-retry" onClick={loadClearance}>Retry</button>
              )}
            </p>
          ) : null}
          {success ? <p className="gdoc-note gdoc-note--ok">{success}</p> : null}

          <div className="gdoc-tabs" role="tablist" aria-label="Documents page tabs">
            {PAGE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={pageTab === tab.key}
                className={`gdoc-tab${pageTab === tab.key ? ' is-active' : ''}`}
                onClick={() => setPageTab(tab.key)}
              >
                <span>{tab.label}</span>
                {tab.key === 'clearance' ? <span className="gdoc-tab-count">{pendingBadge}</span> : null}
              </button>
            ))}
          </div>

          {pageTab === 'documents' ? (
            <section className="gdoc-workspace" aria-label="Documents">
              <div className="gdoc-section-head">
                <h2>Documents</h2>
                <span>{loading ? '–' : `${fileCount} document${fileCount === 1 ? '' : 's'}`}</span>
              </div>
              <div className="gdoc-toolbar">
                <div className="gdoc-search">
                  <SearchInput
                    value={search}
                    onChange={(value) => {
                      setSearch(value);
                      setPage(1);
                    }}
                    placeholder="Search documents"
                  />
                </div>
                <div className="gdoc-chips" role="group" aria-label="Document category">
                  {CATEGORY_CHIPS.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      className={`gdoc-chip${category === chip.key ? ' is-active' : ''}`}
                      onClick={() => {
                        setCategory(chip.key);
                        setPage(1);
                      }}
                    >
                      {chip.label}
                      <span>{loading ? '–' : counts[chip.key] ?? 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="gdoc-skeleton" aria-busy="true" aria-label="Loading documents">
                  <span />
                  <span />
                  <span />
                </div>
              ) : error ? null : (
                <>
                  <div className="gdoc-grid gdoc-grid--docs" role="table" aria-label="Documents">
                    <div className="gdoc-grid-head" role="row">
                      <span role="columnheader">Document</span>
                      <span role="columnheader">Category</span>
                      <span role="columnheader">Size</span>
                      <span role="columnheader">Published</span>
                      <span role="columnheader">Actions</span>
                    </div>
                    {rows.length === 0 ? (
                      <div className="gdoc-empty">
                        <span className="gdoc-empty-icon" aria-hidden="true">
                          <FileText size={20} strokeWidth={2.1} />
                        </span>
                        <p className="gdoc-empty-title">No documents available</p>
                        <p className="gdoc-empty-text">
                          Documents shared with your gate or society will appear here.
                        </p>
                      </div>
                    ) : null}
                    {rows.map((row) => (
                      <article className="gdoc-grid-row" role="row" key={row.id}>
                        <div className="gdoc-file" role="cell">
                          <span className="gdoc-file-icon" aria-hidden="true">
                            <FileText size={15} strokeWidth={2.1} />
                          </span>
                          <span>
                            <span className="gdoc-file-title">{row.title || '—'}</span>
                            <span className="gdoc-file-kind">{row.fileName || 'Document'}</span>
                          </span>
                        </div>
                        <div className="gdoc-cat" role="cell">{row.category || '—'}</div>
                        <div role="cell">{formatFileSize(row.sizeBytes)}</div>
                        <div className="gdoc-date" role="cell">{formatPublished(row.publishedAt)}</div>
                        <div className="gdoc-row-actions" role="cell">
                          <button
                            type="button"
                            className="btn-ghost gdoc-btn"
                            disabled={busyId === `view-${row.id}`}
                            onClick={() => openDocument(row, 'view')}
                          >
                            <Eye size={14} strokeWidth={2.2} aria-hidden="true" />
                            {busyId === `view-${row.id}` ? 'Opening…' : 'View'}
                          </button>
                          <button
                            type="button"
                            className="btn-primary gdoc-btn"
                            disabled={busyId === `download-${row.id}`}
                            onClick={() => openDocument(row, 'download')}
                          >
                            <Download size={14} strokeWidth={2.2} aria-hidden="true" />
                            {busyId === `download-${row.id}` ? 'Downloading…' : 'Download'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                  {pagination && pagination.totalPages > 1 ? (
                    <Pagination
                      page={pagination.page}
                      pageSize={pagination.pageSize}
                      total={pagination.total}
                      totalPages={pagination.totalPages}
                      hasNext={pagination.hasNext}
                      hasPrev={pagination.hasPrev}
                      onPageChange={setPage}
                    />
                  ) : null}
                </>
              )}
            </section>
          ) : (
            <section className="gdoc-workspace" aria-label="Move-out clearance">
              <div className="gdoc-section-head">
                <h2>Move-out Clearance</h2>
                <span>
                  {clrLoading ? '–' : `${clearances.length} request${clearances.length === 1 ? '' : 's'}`}
                </span>
              </div>
              <div className="gdoc-toolbar">
                <div className="gdoc-search">
                  <SearchInput
                    value={clrSearch}
                    onChange={setClrSearch}
                    placeholder="Search flat or resident"
                    debounceMs={280}
                  />
                </div>
                <div className="gdoc-chips" role="group" aria-label="Clearance status">
                  {CLR_FILTERS.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      className={`gdoc-chip${clrFilter === filter.key ? ' is-active' : ''}`}
                      onClick={() => setClrFilter(filter.key)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {clrLoading ? (
                <div className="gdoc-skeleton" aria-busy="true" aria-label="Loading clearance">
                  <span />
                  <span />
                  <span />
                </div>
              ) : error ? null : (
                <div className="gdoc-grid gdoc-grid--clr" role="table" aria-label="Move-out clearance">
                  <div className="gdoc-grid-head" role="row">
                    <span role="columnheader">Resident</span>
                    <span role="columnheader">Flat</span>
                    <span role="columnheader">Move-out</span>
                    <span role="columnheader">Documents</span>
                    <span role="columnheader">Status</span>
                    <span role="columnheader">Action</span>
                  </div>
                  {clearances.length === 0 ? (
                    <div className="gdoc-empty">
                      <span className="gdoc-empty-icon" aria-hidden="true">
                        <FileText size={20} strokeWidth={2.1} />
                      </span>
                      <p className="gdoc-empty-title">No move-out requests</p>
                      <p className="gdoc-empty-text">Clearance requests from residents will appear here.</p>
                    </div>
                  ) : null}
                  {clearances.map((row) => {
                    const score = clearanceScore(row);
                    const status = statusMeta(row.status);
                    return (
                      <article className="gdoc-grid-row" role="row" key={row.id}>
                        <div className="gdoc-person" role="cell">
                          <span className="gdoc-person-name">{row.residentName || '—'}</span>
                          <span className="gdoc-person-meta">Move-out request</span>
                        </div>
                        <div className="gdoc-flat" role="cell">
                          <Building2 size={14} strokeWidth={2.1} aria-hidden="true" />
                          <span>{row.flatNo || '—'}</span>
                        </div>
                        <div className="gdoc-when" role="cell">
                          <Calendar size={14} strokeWidth={2.1} aria-hidden="true" />
                          <span>{formatMoveOutDate(row.moveOutDate)}</span>
                        </div>
                        <div className="gdoc-docs" role="cell">
                          <div className="gdoc-docs-line">
                            <span className={`gdoc-meter${score.done === score.total ? ' is-done' : ''}`} aria-hidden="true">
                              <span style={{ width: `${score.total ? (score.done / score.total) * 100 : 0}%` }} />
                            </span>
                            <strong>{score.done}/{score.total} complete</strong>
                          </div>
                          <button type="button" className="gdoc-link" onClick={() => setDetail(row)}>
                            View details
                          </button>
                        </div>
                        <div role="cell">
                          <span className={`gdoc-badge gdoc-badge--${status.tone}`}>{status.label}</span>
                        </div>
                        <div className="gdoc-row-actions" role="cell">
                          {renderAllowAction(row)}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {detail ? (
        <div className="gdoc-detail-backdrop" role="presentation" onClick={() => setDetail(null)}>
          <aside
            className="gdoc-detail"
            role="dialog"
            aria-modal="true"
            aria-label="Move-out details"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="gdoc-detail-head">
              <div>
                <h2>{detail.residentName || 'Resident'}</h2>
                <p>{detail.flatNo ? `Flat ${detail.flatNo}` : 'Flat unavailable'}</p>
              </div>
              <button type="button" className="btn-ghost gdoc-btn" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
            <dl className="gdoc-detail-meta">
              <div>
                <dt>Move-out</dt>
                <dd>{formatMoveOutDate(detail.moveOutDate)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd><span className={`gdoc-badge gdoc-badge--${detailStatus.tone}`}>{detailStatus.label}</span></dd>
              </div>
              <div>
                <dt>Documents</dt>
                <dd>{detailScore.done}/{detailScore.total} complete</dd>
              </div>
            </dl>
            <ul className="gdoc-checklist">
              {CLEARANCE_CHECKS.map((check) => {
                const ok = Boolean(detail[check.key]);
                return (
                  <li key={check.key} className={ok ? 'is-ok' : 'is-missing'}>
                    <span aria-hidden="true">{ok ? <Check size={14} strokeWidth={2.4} /> : '—'}</span>
                    {check.label}
                  </li>
                );
              })}
            </ul>
            {detail.allowedAt ? (
              <p className="gdoc-detail-note">Allowed {formatPublished(detail.allowedAt)}</p>
            ) : null}
            <div className="gdoc-detail-actions">
              <button type="button" className="btn-ghost gdoc-btn" onClick={() => openClearanceDocs(detail)}>
                <Eye size={14} strokeWidth={2.2} aria-hidden="true" />
                View documents
              </button>
              {renderAllowAction(detail)}
            </div>
          </aside>
        </div>
      ) : null}

      {docViewer && viewerDoc ? (
        <div className="gm-clr-viewer-backdrop" role="presentation" onClick={closeClearanceDocs}>
          <div
            className="gm-clr-viewer"
            role="dialog"
            aria-modal="true"
            aria-label="Clearance documents"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="gm-clr-viewer-head">
              <div>
                <div className="gm-clr-viewer-title">{viewerDoc.title}</div>
                <div className="gm-clr-viewer-meta">
                  {docViewer.residentName} · Flat {docViewer.flatNumber}
                  {viewerDoc.fileName ? ` · ${viewerDoc.fileName}` : ''}
                  {viewerDoc.sizeBytes ? ` · ${formatFileSize(viewerDoc.sizeBytes)}` : ''}
                  {' · '}
                  Paper {docViewer.index + 1} of {docViewer.documents.length}
                </div>
              </div>
              <button type="button" className="btn-ghost gdoc-btn" onClick={closeClearanceDocs}>
                Close
              </button>
            </div>
            <div className="gm-clr-viewer-body">
              {viewerUrl ? (
                <iframe title={viewerDoc.title} src={viewerUrl} className="gm-clr-viewer-frame" />
              ) : (
                <p className="gdoc-muted">Document file not available.</p>
              )}
            </div>
            <div className="gm-clr-viewer-foot">
              <button
                type="button"
                className="btn-ghost gdoc-btn"
                disabled={docViewer.index <= 0}
                onClick={() => stepClearanceDoc(-1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn-primary gdoc-btn"
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
