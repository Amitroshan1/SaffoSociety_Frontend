import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, FolderOpen, Plus, Save, Send, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import { FormField, FormLayout, FormSelect } from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import {
  DOCUMENT_ALLOWED_MIME_TYPES,
  DOCUMENT_PERMISSION_TYPES,
  DOCUMENT_SCOPES,
  createDocument,
  getDocument,
  listDocumentCategories,
  publishDocument,
  setDocumentPermissions,
  updateDocument,
} from '../../../services/document.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const initialForm = {
  title: '',
  description: '',
  categoryId: '',
  scope: 'society',
  tags: '',
  folderPath: '',
  fileName: '',
  fileUrl: '',
  mimeType: '',
  fileSizeBytes: '',
  expiresAt: '',
  isPinned: 'false',
};

let permKeySeq = 0;
const newPermissionRow = () => ({
  key: `p${permKeySeq++}`,
  permissionType: 'everyone',
  roleName: '',
  buildingId: '',
  wingId: '',
  flatId: '',
  residentId: '',
  canDownload: 'true',
});

export default function DocumentFormPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const routeMap = ADMIN_ROUTES;

  const [form, setForm] = useState(initialForm);
  const [doc, setDoc] = useState(null);
  const [categories, setCategories] = useState([]);
  const [permissions, setPermissions] = useState([newPermissionRow()]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const setField = (key) => (v) => setForm((s) => ({ ...s, [key]: v }));

  useEffect(() => {
    listDocumentCategories({ pageSize: 100 })
      .then((r) => setCategories(r.data?.data?.categories || []))
      .catch(() => {});
  }, []);

  const loadDocument = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await getDocument(id);
      const d = data.data?.document || data.data;
      setDoc(d);
      setForm({
        title: d.title || '',
        description: d.description || '',
        categoryId: d.categoryId || '',
        scope: d.scope || 'society',
        tags: Array.isArray(d.tags) ? d.tags.join(', ') : d.tags || '',
        folderPath: d.folderPath || '',
        fileName: d.fileName || '',
        fileUrl: d.fileUrl || '',
        mimeType: d.mimeType || '',
        fileSizeBytes: d.fileSizeBytes != null ? String(d.fileSizeBytes) : '',
        expiresAt: d.expiresAt ? d.expiresAt.slice(0, 16) : '',
        isPinned: d.isPinned ? 'true' : 'false',
      });
      setPermissions(
        (d.permissions || []).length
          ? d.permissions.map((p) => ({
              key: p.id || `p${permKeySeq++}`,
              permissionType: p.permissionType || 'everyone',
              roleName: p.roleName || '',
              buildingId: p.buildingId || '',
              wingId: p.wingId || '',
              flatId: p.flatId || '',
              residentId: p.residentId || '',
              canDownload: p.canDownload === false ? 'false' : 'true',
            }))
          : [newPermissionRow()],
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const buildPayload = () => ({
    title: form.title.trim(),
    description: form.description.trim() || null,
    categoryId: form.categoryId || null,
    scope: form.scope,
    tags: form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    folderPath: form.folderPath.trim() || null,
    fileName: form.fileName.trim(),
    fileUrl: form.fileUrl.trim(),
    mimeType: form.mimeType.trim() || null,
    fileSizeBytes: form.fileSizeBytes ? Number(form.fileSizeBytes) : null,
    expiresAt: form.expiresAt || null,
    isPinned: form.isPinned === 'true',
  });

  const onSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (isEdit) {
        await updateDocument(id, buildPayload());
        setSuccess('Document saved');
        await loadDocument();
      } else {
        const { data } = await createDocument(buildPayload());
        const created = data.data?.document || data.data;
        setSuccess('Document created as draft');
        navigate(`${basePath}/documents/${created.id}/edit`, { replace: true });
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
      await updateDocument(id, buildPayload());
      await publishDocument(id);
      setSuccess('Document published');
      navigate(`${basePath}/documents/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Publish failed');
    } finally {
      setSaving(false);
    }
  };

  const addPermissionRow = () => setPermissions((rows) => [...rows, newPermissionRow()]);
  const removePermissionRow = (key) =>
    setPermissions((rows) => rows.filter((r) => r.key !== key));
  const updatePermissionRow = (key, field, value) =>
    setPermissions((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const savePermissions = async () => {
    if (!isEdit) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = permissions.map(stripPermissionKey).filter(validPermission);
      await setDocumentPermissions(id, payload);
      setSuccess('Permissions saved');
      await loadDocument();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      active="documents"
      onChange={(navId) => routeMap[navId] && navigate(routeMap[navId])}
      breadcrumb={[{ label: 'Home' }, { label: 'Documents' }, { label: isEdit ? 'Edit' : 'New' }]}
    >
      <PageHeader
        icon={FolderOpen}
        iconColor="#93c5fd"
        title={isEdit ? `Edit document${doc ? `: ${doc.documentNumber || ''}` : ''}` : 'New document'}
        subtitle="Upload metadata, categorize, and set access permissions."
      />

      <div style={{ marginBottom: 12 }}>
        <button className="btn-ghost" type="button" onClick={() => navigate(`${basePath}/documents`)}>
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}
      {doc?.status && (
        <div style={{ marginBottom: 12 }}>
          <span className="crud-badge crud-badge-active">Status: {doc.status}</span>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--t3)' }}>Loading…</p>
      ) : (
        <form onSubmit={onSave}>
          <FormLayout
            sections={[
              {
                title: 'Info',
                content: (
                  <>
                    <FormField label="Title *" value={form.title} onChange={setField('title')} required />
                    <FormSelect
                      label="Category"
                      value={form.categoryId}
                      options={categories.map((c) => ({ value: c.id, label: c.name }))}
                      onChange={setField('categoryId')}
                    />
                    <FormSelect
                      label="Scope"
                      value={form.scope}
                      options={DOCUMENT_SCOPES}
                      onChange={setField('scope')}
                    />
                    <FormField label="Tags (comma separated)" value={form.tags} onChange={setField('tags')} />
                    <FormField label="Folder path" value={form.folderPath} onChange={setField('folderPath')} />
                    <FormField
                      textarea
                      label="Description"
                      value={form.description}
                      onChange={setField('description')}
                    />
                  </>
                ),
              },
              {
                title: 'File',
                content: (
                  <>
                    <FormField
                      label="File name *"
                      value={form.fileName}
                      onChange={setField('fileName')}
                      required
                    />
                    <FormField
                      label="File URL *"
                      value={form.fileUrl}
                      onChange={setField('fileUrl')}
                      required
                    />
                    <FormSelect
                      label="MIME type"
                      value={form.mimeType}
                      options={DOCUMENT_ALLOWED_MIME_TYPES}
                      onChange={setField('mimeType')}
                      placeholder="Select (optional)"
                    />
                    <FormField
                      label="File size (bytes)"
                      type="number"
                      value={form.fileSizeBytes}
                      onChange={setField('fileSizeBytes')}
                    />
                  </>
                ),
              },
              {
                title: 'Settings',
                content: (
                  <>
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
                  </>
                ),
              },
            ]}
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save draft'}
            </button>
            {isEdit && doc?.status !== 'published' && (
              <button className="btn-primary" type="button" onClick={onPublish} disabled={saving}>
                <Send size={14} /> Publish
              </button>
            )}
          </div>
        </form>
      )}

      {/* Permissions */}
      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Permissions</h3>
        {!isEdit && (
          <p style={{ color: 'var(--t3)', fontSize: 13 }}>
            Save the document as a draft first, then define who can view/download it.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {permissions.map((row) => (
            <div
              key={row.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr 140px auto',
                gap: 10,
                alignItems: 'end',
              }}
            >
              <FormSelect
                label="Permission type"
                value={row.permissionType}
                options={DOCUMENT_PERMISSION_TYPES}
                onChange={(v) => updatePermissionRow(row.key, 'permissionType', v)}
              />
              {row.permissionType === 'role' && (
                <FormField
                  label="Role name"
                  value={row.roleName}
                  onChange={(v) => updatePermissionRow(row.key, 'roleName', v)}
                />
              )}
              {row.permissionType === 'building' && (
                <FormField
                  label="Building ID"
                  value={row.buildingId}
                  onChange={(v) => updatePermissionRow(row.key, 'buildingId', v)}
                />
              )}
              {row.permissionType === 'wing' && (
                <FormField
                  label="Wing ID"
                  value={row.wingId}
                  onChange={(v) => updatePermissionRow(row.key, 'wingId', v)}
                />
              )}
              {row.permissionType === 'flat' && (
                <FormField
                  label="Flat ID"
                  value={row.flatId}
                  onChange={(v) => updatePermissionRow(row.key, 'flatId', v)}
                />
              )}
              {row.permissionType === 'resident' && (
                <FormField
                  label="Resident ID"
                  value={row.residentId}
                  onChange={(v) => updatePermissionRow(row.key, 'residentId', v)}
                />
              )}
              {row.permissionType === 'everyone' && <div />}
              <FormSelect
                label="Can download"
                value={row.canDownload}
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
                onChange={(v) => updatePermissionRow(row.key, 'canDownload', v)}
              />
              <button
                type="button"
                className="crud-btn crud-btn-ghost"
                onClick={() => removePermissionRow(row.key)}
                disabled={permissions.length <= 1}
                aria-label="Remove permission"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button type="button" className="crud-btn crud-btn-ghost" onClick={addPermissionRow}>
            <Plus size={14} /> Add permission
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={savePermissions}
            disabled={!isEdit || saving}
          >
            Save permissions
          </button>
        </div>
      </section>
    </AppShell>
  );
}

function stripPermissionKey({ key, ...rest }) {
  const cleaned = { permissionType: rest.permissionType, canDownload: rest.canDownload === 'true' };
  if (rest.roleName) cleaned.roleName = rest.roleName;
  if (rest.buildingId) cleaned.buildingId = rest.buildingId;
  if (rest.wingId) cleaned.wingId = rest.wingId;
  if (rest.flatId) cleaned.flatId = rest.flatId;
  if (rest.residentId) cleaned.residentId = rest.residentId;
  return cleaned;
}

function validPermission(p) {
  if (p.permissionType === 'everyone') return true;
  if (p.permissionType === 'role') return Boolean(p.roleName);
  if (p.permissionType === 'building') return Boolean(p.buildingId);
  if (p.permissionType === 'wing') return Boolean(p.wingId);
  if (p.permissionType === 'flat') return Boolean(p.flatId);
  if (p.permissionType === 'resident') return Boolean(p.residentId);
  return false;
}
