import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bell, Pencil } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import { ConfirmDialog, DataTable, EmptyState, FormField } from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import {
  archiveNotice,
  cancelNotice,
  getNotice,
  getNoticeAcknowledgements,
  getNoticeReads,
  pinNotice,
  publishNotice,
  unpinNotice,
} from '../../../services/notice.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const TABS = [
  { id: 'targets', label: 'Targets' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'reads', label: 'Reads' },
  { id: 'acks', label: 'Acknowledgements' },
];

const READ_COLUMNS = [
  { key: 'residentName', label: 'Resident' },
  { key: 'firstReadAt', label: 'First read' },
  { key: 'lastReadAt', label: 'Last read' },
  { key: 'readCount', label: 'Read count' },
  { key: 'readSource', label: 'Source' },
];

const ACK_COLUMNS = [
  { key: 'residentName', label: 'Resident' },
  { key: 'acknowledgedAt', label: 'Acknowledged at' },
  { key: 'ackSource', label: 'Source' },
];

export default function NoticeDetailPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const routeMap = ADMIN_ROUTES;

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('targets');
  const [reads, setReads] = useState([]);
  const [acks, setAcks] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getNotice(id);
      setNotice(data.data?.notice || data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notice');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const loadTabData = useCallback(async () => {
    if (tab === 'reads') {
      setTabLoading(true);
      try {
        const { data } = await getNoticeReads(id, { pageSize: 100 });
        setReads(data.data?.reads || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load reads');
      } finally {
        setTabLoading(false);
      }
    } else if (tab === 'acks') {
      setTabLoading(true);
      try {
        const { data } = await getNoticeAcknowledgements(id, { pageSize: 100 });
        setAcks(data.data?.acknowledgements || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load acknowledgements');
      } finally {
        setTabLoading(false);
      }
    }
  }, [id, tab]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

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

  if (loading) {
    return (
      <AppShell active="notices" onChange={(navId) => routeMap[navId] && navigate(routeMap[navId])}>
        <p style={{ color: 'var(--t3)' }}>Loading…</p>
      </AppShell>
    );
  }

  if (!notice) {
    return (
      <AppShell active="notices" onChange={(navId) => routeMap[navId] && navigate(routeMap[navId])}>
        <EmptyState title="Notice not found" description={error} />
      </AppShell>
    );
  }

  return (
    <AppShell
      active="notices"
      onChange={(navId) => routeMap[navId] && navigate(routeMap[navId])}
      breadcrumb={[{ label: 'Home' }, { label: 'Notices' }, { label: notice.noticeNumber || 'Detail' }]}
    >
      <PageHeader
        icon={Bell}
        iconColor="#fde68a"
        title={notice.title}
        subtitle={`${notice.noticeNumber || ''} · ${notice.category} · ${notice.priority}`}
        action={
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate(`${basePath}/notices/${id}/edit`)}
          >
            <Pencil size={14} /> Edit
          </button>
        }
      />

      <div style={{ marginBottom: 12 }}>
        <button className="btn-ghost" type="button" onClick={() => navigate(`${basePath}/notices`)}>
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <p>
            <span className="crud-badge crud-badge-active">{notice.status}</span>{' '}
            {notice.isPinned && <span className="crud-badge crud-badge-active">Pinned</span>}
          </p>
          {notice.summary && <p style={{ color: 'var(--t2)' }}>{notice.summary}</p>}
          <p style={{ whiteSpace: 'pre-wrap' }}>{notice.bodyText}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 16 }}>
            <div>
              <strong>Publish at</strong>
              <p>{notice.publishAt || '-'}</p>
            </div>
            <div>
              <strong>Published at</strong>
              <p>{notice.publishedAt || '-'}</p>
            </div>
            <div>
              <strong>Expires at</strong>
              <p>{notice.expiresAt || '-'}</p>
            </div>
            <div>
              <strong>Requires ack</strong>
              <p>{notice.requiresAcknowledgement ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <strong>Audience</strong>
              <p>{notice.audienceCount ?? notice.audienceCountSnapshot ?? '-'}</p>
            </div>
            <div>
              <strong>Reads</strong>
              <p>{notice.readCount ?? 0}</p>
            </div>
            <div>
              <strong>Acknowledgements</strong>
              <p>{notice.acknowledgementCount ?? 0}</p>
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

            {tab === 'targets' && (
              (notice.targets || []).length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {notice.targets.map((t) => (
                    <li key={t.id}>
                      {t.targetType}
                      {t.buildingId ? ` · building ${t.buildingId}` : ''}
                      {t.wingId ? ` · wing ${t.wingId}` : ''}
                      {t.flatId ? ` · flat ${t.flatId}` : ''}
                      {t.residentId ? ` · resident ${t.residentId}` : ''}
                      {t.committeeRole ? ` · role ${t.committeeRole}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No targets configured" />
              )
            )}

            {tab === 'attachments' && (
              (notice.attachments || []).length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {notice.attachments.map((a) => (
                    <li key={a.id}>
                      <a href={a.fileUrl} target="_blank" rel="noreferrer">
                        {a.fileName}
                      </a>{' '}
                      {a.mimeType ? `(${a.mimeType})` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No attachments" />
              )
            )}

            {tab === 'reads' && (
              <DataTable
                columns={READ_COLUMNS}
                rows={reads}
                loading={tabLoading}
                emptyTitle="No reads recorded yet"
              />
            )}

            {tab === 'acks' && (
              <DataTable
                columns={ACK_COLUMNS}
                rows={acks}
                loading={tabLoading}
                emptyTitle="No acknowledgements yet"
              />
            )}
          </div>
        </section>

        <section className="glass-card" style={{ padding: 20, borderRadius: 16, height: 'fit-content' }}>
          <h3 style={{ marginTop: 0 }}>Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notice.status !== 'published' && notice.status !== 'cancelled' && (
              <button
                className="btn-primary"
                type="button"
                disabled={busy}
                onClick={() => runAction(() => publishNotice(id), 'Notice published')}
              >
                Publish
              </button>
            )}
            {notice.isPinned ? (
              <button
                className="btn-primary"
                type="button"
                disabled={busy}
                onClick={() => runAction(() => unpinNotice(id), 'Notice unpinned')}
              >
                Unpin
              </button>
            ) : (
              <button
                className="btn-primary"
                type="button"
                disabled={busy}
                onClick={() => runAction(() => pinNotice(id), 'Notice pinned')}
              >
                Pin
              </button>
            )}
            {notice.status !== 'archived' && (
              <button
                className="crud-btn crud-btn-ghost"
                type="button"
                disabled={busy}
                onClick={() => setConfirm('archive')}
              >
                Archive
              </button>
            )}
            {notice.status !== 'cancelled' && notice.status !== 'archived' && (
              <>
                <FormField
                  label="Cancel reason (required if published)"
                  value={cancelReason}
                  onChange={setCancelReason}
                />
                <button
                  className="crud-btn crud-btn-danger"
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirm('cancel')}
                >
                  Cancel notice
                </button>
              </>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirm === 'archive'}
        title="Archive this notice?"
        message="Archived notices are hidden from active resident views."
        confirmLabel="Archive"
        loading={busy}
        onConfirm={() => runAction(() => archiveNotice(id), 'Notice archived')}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'cancel'}
        title="Cancel this notice?"
        message="This will mark the notice as cancelled. This cannot be undone."
        confirmLabel="Cancel notice"
        variant="danger"
        loading={busy}
        onConfirm={() =>
          runAction(() => cancelNotice(id, { reason: cancelReason || undefined }), 'Notice cancelled')
        }
        onCancel={() => setConfirm(null)}
      />
    </AppShell>
  );
}
