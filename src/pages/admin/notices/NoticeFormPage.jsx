import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bell, Plus, Save, Send, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import { FormField, FormLayout, FormSelect } from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import { listBuildings } from '../../../services/building.service.js';
import {
  NOTICE_CATEGORIES,
  NOTICE_PRIORITIES,
  NOTICE_TARGET_TYPES,
  addNoticeAttachment,
  createNotice,
  deleteNoticeAttachment,
  getNotice,
  publishNotice,
  setNoticeTargets,
  updateNotice,
} from '../../../services/notice.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const initialForm = {
  title: '',
  summary: '',
  bodyText: '',
  category: 'general',
  priority: 'normal',
  requiresAcknowledgement: 'false',
  acknowledgementDueAt: '',
  publishAt: '',
  expiresAt: '',
  isPinned: 'false',
  pinUntil: '',
  notes: '',
};

let targetKeySeq = 0;
const newTargetRow = () => ({
  key: `t${targetKeySeq++}`,
  targetType: 'society',
  buildingId: '',
  wingId: '',
  flatId: '',
  residentId: '',
  committeeRole: '',
});

const newAttachmentDraft = () => ({ fileName: '', fileUrl: '', mimeType: '', sortOrder: '0' });

export default function NoticeFormPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const routeMap = ADMIN_ROUTES;

  const [form, setForm] = useState(initialForm);
  const [notice, setNotice] = useState(null);
  const [targets, setTargets] = useState([newTargetRow()]);
  const [attachments, setAttachments] = useState([]);
  const [attachmentDraft, setAttachmentDraft] = useState(newAttachmentDraft());
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const setField = (key) => (v) => setForm((s) => ({ ...s, [key]: v }));

  useEffect(() => {
    listBuildings({ pageSize: 100, isActive: true }).then((r) => {
      setBuildings(r.data?.data?.buildings || []);
    }).catch(() => {});
  }, []);

  const loadNotice = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await getNotice(id);
      const n = data.data?.notice || data.data;
      setNotice(n);
      setForm({
        title: n.title || '',
        summary: n.summary || '',
        bodyText: n.bodyText || '',
        category: n.category || 'general',
        priority: n.priority || 'normal',
        requiresAcknowledgement: n.requiresAcknowledgement ? 'true' : 'false',
        acknowledgementDueAt: n.acknowledgementDueAt ? n.acknowledgementDueAt.slice(0, 16) : '',
        publishAt: n.publishAt ? n.publishAt.slice(0, 16) : '',
        expiresAt: n.expiresAt ? n.expiresAt.slice(0, 16) : '',
        isPinned: n.isPinned ? 'true' : 'false',
        pinUntil: n.pinUntil ? n.pinUntil.slice(0, 16) : '',
        notes: n.notes || '',
      });
      setTargets(
        (n.targets || []).length
          ? n.targets.map((t) => ({
              key: t.id || `t${targetKeySeq++}`,
              targetType: t.targetType || 'society',
              buildingId: t.buildingId || '',
              wingId: t.wingId || '',
              flatId: t.flatId || '',
              residentId: t.residentId || '',
              committeeRole: t.committeeRole || '',
            }))
          : [newTargetRow()],
      );
      setAttachments(n.attachments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notice');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    loadNotice();
  }, [loadNotice]);

  const buildPayload = () => ({
    title: form.title.trim(),
    summary: form.summary.trim() || null,
    bodyText: form.bodyText,
    category: form.category,
    priority: form.priority,
    requiresAcknowledgement: form.requiresAcknowledgement === 'true',
    acknowledgementDueAt: form.acknowledgementDueAt || null,
    publishAt: form.publishAt || null,
    expiresAt: form.expiresAt || null,
    isPinned: form.isPinned === 'true',
    pinUntil: form.pinUntil || null,
    notes: form.notes.trim() || null,
  });

  const onSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (isEdit) {
        await updateNotice(id, buildPayload());
        setSuccess('Notice saved');
        await loadNotice();
      } else {
        const payload = { ...buildPayload(), targets: targets.map(stripTargetKey).filter(validTarget) };
        const { data } = await createNotice(payload);
        const created = data.data?.notice || data.data;
        setSuccess('Notice created as draft');
        navigate(`${basePath}/notices/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onPublish = async () => {
    if (!isEdit) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateNotice(id, buildPayload());
      await publishNotice(id);
      setSuccess('Notice published');
      navigate(`${basePath}/notices/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Publish failed');
    } finally {
      setSaving(false);
    }
  };

  const addTargetRow = () => setTargets((rows) => [...rows, newTargetRow()]);
  const removeTargetRow = (key) => setTargets((rows) => rows.filter((r) => r.key !== key));
  const updateTargetRow = (key, field, value) =>
    setTargets((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const saveTargets = async () => {
    if (!isEdit) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = targets.map(stripTargetKey).filter(validTarget);
      await setNoticeTargets(id, payload);
      setSuccess('Targets saved');
      await loadNotice();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save targets');
    } finally {
      setSaving(false);
    }
  };

  const addAttachment = async () => {
    if (!isEdit || !attachmentDraft.fileName.trim() || !attachmentDraft.fileUrl.trim()) return;
    setSaving(true);
    setError('');
    try {
      await addNoticeAttachment(id, {
        fileName: attachmentDraft.fileName.trim(),
        fileUrl: attachmentDraft.fileUrl.trim(),
        mimeType: attachmentDraft.mimeType.trim() || null,
        sortOrder: Number(attachmentDraft.sortOrder) || 0,
      });
      setAttachmentDraft(newAttachmentDraft());
      setSuccess('Attachment added');
      await loadNotice();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add attachment');
    } finally {
      setSaving(false);
    }
  };

  const removeAttachment = async (attachmentId) => {
    if (!isEdit) return;
    setSaving(true);
    setError('');
    try {
      await deleteNoticeAttachment(id, attachmentId);
      setSuccess('Attachment removed');
      await loadNotice();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove attachment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      active="notices"
      onChange={(navId) => routeMap[navId] && navigate(routeMap[navId])}
      breadcrumb={[{ label: 'Home' }, { label: 'Notices' }, { label: isEdit ? 'Edit' : 'New' }]}
    >
      <PageHeader
        icon={Bell}
        iconColor="#fde68a"
        title={isEdit ? `Edit notice${notice ? `: ${notice.noticeNumber || ''}` : ''}` : 'New notice'}
        subtitle="Draft content, target residents, schedule, and attach files."
      />

      <div style={{ marginBottom: 12 }}>
        <button className="btn-ghost" type="button" onClick={() => navigate(`${basePath}/notices`)}>
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}
      {notice?.status && (
        <div style={{ marginBottom: 12 }}>
          <span className="crud-badge crud-badge-active">Status: {notice.status}</span>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--t3)' }}>Loading…</p>
      ) : (
        <form onSubmit={onSave}>
          <FormLayout
            sections={[
              {
                title: 'Content',
                content: (
                  <>
                    <FormField label="Title *" value={form.title} onChange={setField('title')} required />
                    <FormField label="Summary" value={form.summary} onChange={setField('summary')} />
                    <FormSelect
                      label="Category"
                      value={form.category}
                      options={NOTICE_CATEGORIES}
                      onChange={setField('category')}
                    />
                    <FormSelect
                      label="Priority"
                      value={form.priority}
                      options={NOTICE_PRIORITIES}
                      onChange={setField('priority')}
                    />
                    <FormSelect
                      label="Requires acknowledgement"
                      value={form.requiresAcknowledgement}
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                      ]}
                      onChange={setField('requiresAcknowledgement')}
                    />
                    {form.requiresAcknowledgement === 'true' && (
                      <FormField
                        label="Acknowledgement due at"
                        type="datetime-local"
                        value={form.acknowledgementDueAt}
                        onChange={setField('acknowledgementDueAt')}
                      />
                    )}
                    <FormField
                      textarea
                      rows={6}
                      label="Body"
                      value={form.bodyText}
                      onChange={setField('bodyText')}
                    />
                    <FormField textarea label="Notes" value={form.notes} onChange={setField('notes')} />
                  </>
                ),
              },
              {
                title: 'Scheduling',
                content: (
                  <>
                    <FormField
                      label="Publish at"
                      type="datetime-local"
                      value={form.publishAt}
                      onChange={setField('publishAt')}
                    />
                    <FormField
                      label="Expires at"
                      type="datetime-local"
                      value={form.expiresAt}
                      onChange={setField('expiresAt')}
                    />
                    <FormSelect
                      label="Pin to top"
                      value={form.isPinned}
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                      ]}
                      onChange={setField('isPinned')}
                    />
                    {form.isPinned === 'true' && (
                      <FormField
                        label="Pin until"
                        type="datetime-local"
                        value={form.pinUntil}
                        onChange={setField('pinUntil')}
                      />
                    )}
                  </>
                ),
              },
            ]}
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save draft'}
            </button>
            {isEdit && notice?.status !== 'published' && (
              <button className="btn-primary" type="button" onClick={onPublish} disabled={saving}>
                <Send size={14} /> Publish
              </button>
            )}
          </div>
        </form>
      )}

      {/* Targets */}
      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Targets</h3>
        {!isEdit && (
          <p style={{ color: 'var(--t3)', fontSize: 13 }}>
            Save the notice as a draft first, then define who should receive it.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {targets.map((row) => (
            <div
              key={row.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr auto',
                gap: 10,
                alignItems: 'end',
              }}
            >
              <FormSelect
                label="Target type"
                value={row.targetType}
                options={NOTICE_TARGET_TYPES}
                onChange={(v) => updateTargetRow(row.key, 'targetType', v)}
              />
              {row.targetType === 'building' && (
                <FormSelect
                  label="Building"
                  value={row.buildingId}
                  options={buildings.map((b) => ({ value: b.id, label: b.name || b.code || b.id }))}
                  onChange={(v) => updateTargetRow(row.key, 'buildingId', v)}
                />
              )}
              {row.targetType === 'wing' && (
                <FormField
                  label="Wing ID"
                  value={row.wingId}
                  onChange={(v) => updateTargetRow(row.key, 'wingId', v)}
                />
              )}
              {row.targetType === 'flat' && (
                <FormField
                  label="Flat ID"
                  value={row.flatId}
                  onChange={(v) => updateTargetRow(row.key, 'flatId', v)}
                />
              )}
              {row.targetType === 'resident' && (
                <FormField
                  label="Resident ID"
                  value={row.residentId}
                  onChange={(v) => updateTargetRow(row.key, 'residentId', v)}
                />
              )}
              {row.targetType === 'committee_role' && (
                <FormField
                  label="Committee role"
                  value={row.committeeRole}
                  onChange={(v) => updateTargetRow(row.key, 'committeeRole', v)}
                />
              )}
              {row.targetType === 'society' && <div />}
              <button
                type="button"
                className="crud-btn crud-btn-ghost"
                onClick={() => removeTargetRow(row.key)}
                disabled={targets.length <= 1}
                aria-label="Remove target"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button type="button" className="crud-btn crud-btn-ghost" onClick={addTargetRow}>
            <Plus size={14} /> Add target
          </button>
          <button type="button" className="btn-primary" onClick={saveTargets} disabled={!isEdit || saving}>
            Save targets
          </button>
        </div>
      </section>

      {/* Attachments */}
      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Attachments</h3>
        {!isEdit && (
          <p style={{ color: 'var(--t3)', fontSize: 13 }}>Save the notice as a draft first to add attachments.</p>
        )}
        {attachments.length > 0 && (
          <ul style={{ margin: '0 0 14px', paddingLeft: 18 }}>
            {attachments.map((a) => (
              <li key={a.id} style={{ marginBottom: 6 }}>
                <a href={a.fileUrl} target="_blank" rel="noreferrer">
                  {a.fileName}
                </a>{' '}
                <button
                  type="button"
                  className="crud-btn crud-btn-ghost"
                  style={{ padding: '2px 8px', marginLeft: 8 }}
                  onClick={() => removeAttachment(a.id)}
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
          <FormField
            label="File name"
            value={attachmentDraft.fileName}
            onChange={(v) => setAttachmentDraft((s) => ({ ...s, fileName: v }))}
            disabled={!isEdit}
          />
          <FormField
            label="File URL"
            value={attachmentDraft.fileUrl}
            onChange={(v) => setAttachmentDraft((s) => ({ ...s, fileUrl: v }))}
            disabled={!isEdit}
          />
          <FormField
            label="MIME type"
            value={attachmentDraft.mimeType}
            onChange={(v) => setAttachmentDraft((s) => ({ ...s, mimeType: v }))}
            disabled={!isEdit}
          />
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{ marginTop: 12 }}
          onClick={addAttachment}
          disabled={!isEdit || saving}
        >
          <Plus size={14} /> Add attachment
        </button>
      </section>
    </AppShell>
  );
}

function stripTargetKey({ key, ...rest }) {
  const cleaned = { targetType: rest.targetType };
  if (rest.buildingId) cleaned.buildingId = rest.buildingId;
  if (rest.wingId) cleaned.wingId = rest.wingId;
  if (rest.flatId) cleaned.flatId = rest.flatId;
  if (rest.residentId) cleaned.residentId = rest.residentId;
  if (rest.committeeRole) cleaned.committeeRole = rest.committeeRole;
  return cleaned;
}

function validTarget(t) {
  if (t.targetType === 'society') return true;
  if (t.targetType === 'building') return Boolean(t.buildingId);
  if (t.targetType === 'wing') return Boolean(t.wingId);
  if (t.targetType === 'flat') return Boolean(t.flatId);
  if (t.targetType === 'resident') return Boolean(t.residentId);
  if (t.targetType === 'committee_role') return Boolean(t.committeeRole);
  return false;
}
