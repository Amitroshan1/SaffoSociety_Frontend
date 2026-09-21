import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, FolderOpen, Pencil } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import { ConfirmDialog, EmptyState, FormField, FormSelect } from '@/components/common/index.js';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import {
  DOCUMENT_ALLOWED_MIME_TYPES,
  archiveDocument,
  deleteDocument,
  formatFileSize,
  getDocument,
  listDocumentVersions,
  publishDocument,
  restoreDocument,
  addDocumentVersion,
} from '@/services/document.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const TABS = [
  { id: 'info', label: 'Info' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'versions', label: 'Versions' },
  { id: 'downloads', label: 'Downloads' },
];

const newVersionDraft = () => ({ fileName: '', fileUrl: '', mimeType: '', changeNotes: '' });

export default function DocumentDetailPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const routeMap = ADMIN_ROUTES;

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('info');
  const [versions, setVersions] = useState([]);
  const [versionsLoaded, setVersionsLoaded] = useState(false);
  const [versionDraft, setVersionDraft] = useState(newVersionDraft());
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getDocument(id);
      setDoc(data.data?.document || data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const loadVersions = useCallback(async () => {
    try {
      const { data } = await listDocumentVersions(id);
      setVersions(data.data?.versions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load versions');
    } finally {
      setVersionsLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    if (tab === 'versions' && !versionsLoaded) loadVersions();
  }, [tab, versionsLoaded, loadVersions]);

  const runAction = async (fn, okMsg) => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await fn();
      setSuccess(okMsg);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const addVersion = async () => {
    if (!versionDraft.fileName.trim() || !versionDraft.fileUrl.trim()) return;
    setBusy(true);
    setError('');
    try {
      await addDocumentVersion(id, {
        fileName: versionDraft.fileName.trim(),
        fileUrl: versionDraft.fileUrl.trim(),
        mimeType: versionDraft.mimeType.trim() || null,
        changeNotes: versionDraft.changeNotes.trim() || null,
      });
      setVersionDraft(newVersionDraft());
      setSuccess('Version added');
      setVersionsLoaded(false);
      await loadVersions();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add version');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppShell active="documents" onChange={(navId) => routeMap[navId] && navigate(routeMap[navId])}>
        <p style={{ color: 'var(--t3)' }}>Loading…</p>
      </AppShell>
    );
  }

  if (!doc) {
    return (
      <AppShell active="documents" onChange={(navId) => routeMap[navId] && navigate(routeMap[navId])}>
        <EmptyState title="Document not found" description={error} />
      </AppShell>
    );
  }

  return (
    <AppShell
      active="documents"
      onChange={(navId) => routeMap[navId] && navigate(routeMap[navId])}
      breadcrumb={[{ label: 'Home' }, { label: 'Documents' }, { label: doc.documentNumber || 'Detail' }]}
    >
      <PageHeader
        icon={FolderOpen}
        iconColor="#93c5fd"
        title={doc.title}
        subtitle={`${doc.documentNumber || ''} · ${doc.categoryName || 'Uncategorized'} · ${doc.scope}`}
        action={
          doc.status !== 'deleted' ? (
            <button
              className="btn-primary"
              type="button"
              onClick={() => navigate(`${basePath}/documents/${id}/edit`)}
            >
              <Pencil size={14} /> Edit
            </button>
          ) : null
        }
      />

      <div style={{ marginBottom: 12 }}>
        <button className="btn-ghost" type="button" onClick={() => navigate(`${basePath}/documents`)}>
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <p>
            <span className="crud-badge crud-badge-active">{doc.status}</span>{' '}
            {doc.isPinned && <span className="crud-badge crud-badge-active">Pinned</span>}
          </p>
          {doc.description && <p style={{ color: 'var(--t2)' }}>{doc.description}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 16 }}>
            <div>
              <strong>File name</strong>
              <p>{doc.fileName || '-'}</p>
            </div>
            <div>
              <strong>File URL</strong>
              <p>
                {doc.fileUrl ? (
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                    Open file
                  </a>
                ) : (
                  '-'
                )}
              </p>
            </div>
            <div>
              <strong>MIME type</strong>
              <p>{doc.mimeType || '-'}</p>
            </div>
            <div>
              <strong>File size</strong>
              <p>{formatFileSize(doc.fileSizeBytes)}</p>
            </div>
            <div>
              <strong>Folder path</strong>
              <p>{doc.folderPath || '-'}</p>
            </div>
            <div>
              <strong>Tags</strong>
              <p>{Array.isArray(doc.tags) && doc.tags.length ? doc.tags.join(', ') : '-'}</p>
            </div>
            <div>
              <strong>Expires at</strong>
              <p>{doc.expiresAt || '-'}</p>
            </div>
            <div>
              <strong>Uploaded by</strong>
              <p>{doc.uploadedByName || doc.uploadedBy || '-'}</p>
            </div>
            <div>
              <strong>Downloads</strong>
              <p>{doc.downloadCount ?? 0}</p>
            </div>
            <div>
              <strong>Views</strong>
              <p>{doc.viewCount ?? 0}</p>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`crud-btn ${tab === t.id ? 'crud-btn-primary' : 'crud-btn-ghost'}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'info' && (
              <div>
                <p>
                  <strong>Document #:</strong> {doc.documentNumber}
                </p>
                <p>
                  <strong>Category:</strong> {doc.categoryName || '-'}
                </p>
                <p>
                  <strong>Scope:</strong> {doc.scope}
                </p>
                <p>
                  <strong>Created:</strong> {doc.createdAt || '-'}
                </p>
                <p>
                  <strong>Updated:</strong> {doc.updatedAt || '-'}
                </p>
              </div>
            )}

            {tab === 'permissions' && (
              (doc.permissions || []).length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {doc.permissions.map((p) => (
                    <li key={p.id}>
                      {p.permissionType}
                      {p.roleName ? ` · role ${p.roleName}` : ''}
                      {p.buildingId ? ` · building ${p.buildingId}` : ''}
                      {p.wingId ? ` · wing ${p.wingId}` : ''}
                      {p.flatId ? ` · flat ${p.flatId}` : ''}
                      {p.residentId ? ` · resident ${p.residentId}` : ''}
                      {' · '}
                      {p.canDownload === false ? 'view only' : 'can download'}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No permissions configured" description="Everyone with scope access can view this document." />
              )
            )}

            {tab === 'versions' && (
              <div>
                {versions.length ? (
                  <ul style={{ margin: '0 0 16px', paddingLeft: 0, listStyle: 'none' }}>
                    {versions.map((v) => (
                      <li
                        key={v.id}
                        style={{
                          borderLeft: '2px solid var(--border-soft)',
                          paddingLeft: 14,
                          marginBottom: 14,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>
                          Version {v.versionNumber ?? v.version}{' '}
                          <a href={v.fileUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 400 }}>
                            {v.fileName}
                          </a>
                        </div>
                        <div style={{ color: 'var(--t3)', fontSize: 13 }}>
                          {v.uploadedByName || v.uploadedBy ? `by ${v.uploadedByName || v.uploadedBy} · ` : ''}
                          {v.createdAt || ''}
                        </div>
                        {v.changeNotes && <p style={{ margin: '6px 0 0' }}>{v.changeNotes}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="No versions yet" description="This is the original upload." />
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
                  <FormField
                    label="File name"
                    value={versionDraft.fileName}
                    onChange={(v) => setVersionDraft((s) => ({ ...s, fileName: v }))}
                  />
                  <FormField
                    label="File URL"
                    value={versionDraft.fileUrl}
                    onChange={(v) => setVersionDraft((s) => ({ ...s, fileUrl: v }))}
                  />
                  <FormSelect
                    label="MIME type"
                    value={versionDraft.mimeType}
                    options={DOCUMENT_ALLOWED_MIME_TYPES}
                    onChange={(v) => setVersionDraft((s) => ({ ...s, mimeType: v }))}
                    placeholder="Select (optional)"
                  />
                  <FormField
                    label="Change notes"
                    value={versionDraft.changeNotes}
                    onChange={(v) => setVersionDraft((s) => ({ ...s, changeNotes: v }))}
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: 12 }}
                  onClick={addVersion}
                  disabled={busy}
                >
                  Add version
                </button>
              </div>
            )}

            {tab === 'downloads' && (
              (doc.downloads || []).length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {doc.downloads.map((dl, idx) => (
                    <li key={dl.id || idx}>
                      {dl.downloadedByName || dl.residentName || 'Unknown'} — {dl.downloadedAt || dl.createdAt}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="No download log"
                  description={`Total downloads recorded: ${doc.downloadCount ?? 0}`}
                />
              )
            )}
          </div>
        </section>

        <section className="glass-card" style={{ padding: 20, borderRadius: 16, height: 'fit-content' }}>
          <h3 style={{ marginTop: 0 }}>Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {doc.status === 'draft' && (
              <button
                className="btn-primary"
                type="button"
                disabled={busy}
                onClick={() => runAction(() => publishDocument(id), 'Document published')}
              >
                Publish
              </button>
            )}
            {doc.status === 'archived' ? (
              <button
                className="btn-primary"
                type="button"
                disabled={busy}
                onClick={() => runAction(() => restoreDocument(id), 'Document restored')}
              >
                Restore
              </button>
            ) : (
              doc.status !== 'deleted' && (
                <button
                  className="crud-btn crud-btn-ghost"
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirm('archive')}
                >
                  Archive
                </button>
              )
            )}
            {doc.status !== 'deleted' && (
              <button
                className="crud-btn crud-btn-danger"
                type="button"
                disabled={busy}
                onClick={() => setConfirm('delete')}
              >
                Delete
              </button>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirm === 'archive'}
        title="Archive this document?"
        message="Archived documents are hidden from active resident views."
        confirmLabel="Archive"
        loading={busy}
        onConfirm={() => runAction(() => archiveDocument(id), 'Document archived')}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this document?"
        message="This will soft-delete the document. This cannot be undone from this screen."
        confirmLabel="Delete"
        variant="danger"
        loading={busy}
        onConfirm={() =>
          runAction(async () => {
            await deleteDocument(id);
            navigate(`${basePath}/documents/list`);
          }, 'Document deleted')
        }
        onCancel={() => setConfirm(null)}
      />
    </AppShell>
  );
}
