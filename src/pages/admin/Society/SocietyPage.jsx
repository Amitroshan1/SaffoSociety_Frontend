import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Hospital, Clock3, Hash, MapPin, Save } from 'lucide-react';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  getSociety,
  createSociety,
  updateSociety,
  deactivateSociety,
  activateSociety,
} from '../../../services/society.service';
import SocietyListPanel from '../../../components/admin/SocietyListPanel.jsx';
import { ConfirmDialog, FormField, FormSelect } from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const emptyForm = {
  name: '',
  displayName: '',
  shortName: '',
  description: '',
  code: '',
  registrationNo: '',
  gstin: '',
  pan: '',
  email: '',
  phone: '',
  contactPerson: '',
  contactDesignation: '',
  contactEmail: '',
  contactPhone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'IN',
  website: '',
  logoUrl: '',
  coverImage: '',
  latitude: '',
  longitude: '',
  establishedYear: '',
  settings: {
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    language: 'en',
    date_format: 'DD/MM/YYYY',
    theme: 'system',
    visitorApproval: 'resident',
    financialYearStart: 4,
  },
};

function societyToForm(s) {
  return {
    name: s.name || '',
    displayName: s.displayName || '',
    shortName: s.shortName || '',
    description: s.description || '',
    code: s.code || '',
    registrationNo: s.registrationNo || '',
    gstin: s.gstin || '',
    pan: s.pan || '',
    email: s.email || '',
    phone: s.phone || '',
    contactPerson: s.contactPerson || '',
    contactDesignation: s.contactDesignation || '',
    contactEmail: s.contactEmail || '',
    contactPhone: s.contactPhone || '',
    addressLine1: s.addressLine1 || '',
    addressLine2: s.addressLine2 || '',
    city: s.city || '',
    state: s.state || '',
    pincode: s.pincode || '',
    country: s.country || 'IN',
    website: s.website || '',
    logoUrl: s.logoUrl || '',
    coverImage: s.coverImage || '',
    latitude: s.latitude ?? '',
    longitude: s.longitude ?? '',
    establishedYear: s.establishedYear ?? '',
    settings: {
      timezone: s.settings?.timezone || 'Asia/Kolkata',
      currency: s.settings?.currency || 'INR',
      language: s.settings?.language || 'en',
      date_format: s.settings?.date_format || 'DD/MM/YYYY',
      theme: s.settings?.theme || 'system',
      visitorApproval: s.settings?.visitorApproval || 'resident',
      financialYearStart: s.settings?.financialYearStart ?? 4,
    },
  };
}

function buildPayload(form, { includeCode }) {
  const payload = {
    name: form.name.trim(),
    displayName: form.displayName.trim() || null,
    shortName: form.shortName.trim() || null,
    description: form.description.trim() || null,
    registrationNo: form.registrationNo.trim() || null,
    gstin: form.gstin.trim() || null,
    pan: form.pan.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    contactPerson: form.contactPerson.trim() || null,
    contactDesignation: form.contactDesignation.trim() || null,
    contactEmail: form.contactEmail.trim() || null,
    contactPhone: form.contactPhone.trim() || null,
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim() || null,
    city: form.city.trim(),
    state: form.state.trim(),
    pincode: form.pincode.trim(),
    country: form.country.trim() || 'IN',
    website: form.website.trim() || null,
    logoUrl: form.logoUrl.trim() || null,
    coverImage: form.coverImage.trim() || null,
    latitude: form.latitude === '' ? null : Number(form.latitude),
    longitude: form.longitude === '' ? null : Number(form.longitude),
    establishedYear: form.establishedYear === '' ? null : Number(form.establishedYear),
    settings: {
      ...form.settings,
      financialYearStart: Number(form.settings.financialYearStart),
    },
  };
  if (includeCode) payload.code = form.code.trim().toUpperCase();
  return payload;
}

export default function SocietyPage() {
  const navigate = useNavigate();
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [society, setSociety] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isCreate, setIsCreate] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'identity'
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [listKey, setListKey] = useState(0);

  const openIdentity = async (row) => {
    setError('');
    setSuccess('');
    // Open immediately with list row data, then hydrate full profile.
    setSociety(row);
    setForm(societyToForm(row));
    setIsCreate(false);
    setView('identity');
    setDetailLoading(true);
    try {
      const { data } = await getSociety(row.id);
      const s = data.data.society;
      setSociety(s);
      setForm(societyToForm(s));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to open society profile');
    } finally {
      setDetailLoading(false);
    }
  };

  const openCreate = () => {
    setError('');
    setSuccess('');
    setSociety(null);
    setForm(emptyForm);
    setIsCreate(true);
    setView('identity');
  };

  const backToList = () => {
    setError('');
    setSuccess('');
    setIsCreate(false);
    setDetailLoading(false);
    setView('list');
  };

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSettingsChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      settings: { ...prev.settings, [key]: value },
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (isCreate) {
        const { data } = await createSociety(buildPayload(form, { includeCode: true }));
        const s = data.data.society;
        setSociety(s);
        setForm(societyToForm(s));
        setIsCreate(false);
        setSuccess('Society created successfully');
        setListKey((k) => k + 1);
      } else {
        const { data } = await updateSociety(
          society.id,
          buildPayload(form, { includeCode: false }),
        );
        const s = data.data.society;
        setSociety(s);
        setForm(societyToForm(s));
        setSuccess('Society updated successfully');
        setListKey((k) => k + 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!society) return;
    setSaving(true);
    setError('');
    setConfirmDeactivate(false);
    try {
      const apiCall = society.isActive ? deactivateSociety : activateSociety;
      const { data } = await apiCall(society.id);
      const s = data.data.society;
      setSociety(s);
      setSuccess(data.message || 'Status updated');
      setListKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Status update failed');
    } finally {
      setSaving(false);
    }
  };

  const onListView = view === 'list';

  return (
    <AppShell
      active="society"
      onChange={(id) => {
        if (id === 'society') return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[
        { label: 'Home' },
        { label: 'Society' },
        ...(onListView ? [] : [{ label: isCreate ? 'Create' : 'Identity' }]),
      ]}
    >
      <PageHeader
        icon={Hospital}
        iconColor="#93c5fd"
        title={
          onListView
            ? 'Society Profile'
            : isCreate
              ? 'Create Society'
              : 'Society Identity'
        }
        subtitle={
          onListView
            ? 'Select a society row to open its identity profile.'
            : 'Manage housing society identity, contacts, and settings.'
        }
        action={
          !onListView && society ? (
            <button
              className="btn-primary"
              type="button"
              onClick={() => (society.isActive ? setConfirmDeactivate(true) : toggleActive())}
              disabled={saving || detailLoading}
            >
              {society.isActive ? 'Deactivate' : 'Activate'}
            </button>
          ) : null
        }
      />

      {error && (
        <div className="society-alert society-alert-error" role="alert">{error}</div>
      )}
      {success && (
        <div className="society-alert society-alert-success" role="status">{success}</div>
      )}

      {onListView ? (
        <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--t2)' }}>All societies</h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--t3)' }}>
            Click a row to open the identity page.
          </p>
          <SocietyListPanel key={listKey} onSelect={openIdentity} onCreate={openCreate} />
        </section>
      ) : (
        <>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-ghost" type="button" onClick={backToList}>
              <ArrowLeft size={14} />
              Back
            </button>
            {detailLoading ? (
              <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.95)' }}>Loading full profile…</span>
            ) : null}
          </div>

          <ConfirmDialog
            open={confirmDeactivate}
            title="Deactivate society?"
            message="Residents and staff linked to this society may lose access until it is reactivated."
            confirmLabel="Deactivate"
            variant="danger"
            loading={saving}
            onConfirm={toggleActive}
            onCancel={() => setConfirmDeactivate(false)}
          />

          {(society || isCreate) && (
            <div
              className={
                'society-status-bar' +
                (isCreate
                  ? ' society-status-bar--draft'
                  : society?.isActive
                    ? ' society-status-bar--active'
                    : ' society-status-bar--inactive')
              }
            >
              <div className="society-status-bar-main">
                <span
                  className={
                    'society-status-pill' +
                    (isCreate
                      ? ' society-status-pill--draft'
                      : society?.isActive
                        ? ' society-status-pill--active'
                        : ' society-status-pill--inactive')
                  }
                >
                  <span className="society-status-dot" aria-hidden />
                  {isCreate ? 'Draft' : society?.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="society-status-identity">
                  <div className="society-status-name">
                    {isCreate
                      ? form.name.trim() || 'New society'
                      : society?.displayName || society?.name || 'Society'}
                  </div>
                </div>
              </div>

              <div className="society-status-meta">
                {!isCreate && society?.code ? (
                  <span className="society-status-chip">
                    <Hash size={12} strokeWidth={2} />
                    {society.code}
                  </span>
                ) : null}
                {(form.city || form.state) ? (
                  <span className="society-status-chip">
                    <MapPin size={12} strokeWidth={2} />
                    {[form.city, form.state].filter(Boolean).join(', ') || '—'}
                  </span>
                ) : null}
                {!isCreate && society?.version != null ? (
                  <span className="society-status-chip">
                    v{society.version}
                  </span>
                ) : null}
                {!isCreate && society?.lastActivityAt ? (
                  <span className="society-status-chip">
                    <Clock3 size={12} strokeWidth={2} />
                    {new Date(society.lastActivityAt).toLocaleString()}
                  </span>
                ) : (
                  !isCreate && (
                    <span className="society-status-chip society-status-chip--muted">
                      <Clock3 size={12} strokeWidth={2} />
                      No recent activity
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
            <Section title="Identity">
              <FormField label="Name *" value={form.name} onChange={(v) => onChange('name', v)} required />
              <FormField label="Display name" value={form.displayName} onChange={(v) => onChange('displayName', v)} />
              <FormField label="Short name" value={form.shortName} onChange={(v) => onChange('shortName', v)} />
              <FormField
                label="Code *"
                value={form.code}
                onChange={(v) => onChange('code', v.toUpperCase())}
                required={isCreate}
                disabled={!isCreate}
              />
              <FormField
                label="Description"
                value={form.description}
                onChange={(v) => onChange('description', v)}
                textarea
              />
            </Section>

            <Section title="Address">
              <FormField label="Address line 1 *" value={form.addressLine1} onChange={(v) => onChange('addressLine1', v)} required />
              <FormField label="Address line 2" value={form.addressLine2} onChange={(v) => onChange('addressLine2', v)} />
              <FormField label="City *" value={form.city} onChange={(v) => onChange('city', v)} required />
              <FormField label="State *" value={form.state} onChange={(v) => onChange('state', v)} required />
              <FormField label="Pincode *" value={form.pincode} onChange={(v) => onChange('pincode', v)} required />
              <FormField label="Country *" value={form.country} onChange={(v) => onChange('country', v.toUpperCase())} required />
              <FormField label="Latitude" value={form.latitude} onChange={(v) => onChange('latitude', v)} />
              <FormField label="Longitude" value={form.longitude} onChange={(v) => onChange('longitude', v)} />
            </Section>

            <Section title="Contacts">
              <FormField label="Office email" value={form.email} onChange={(v) => onChange('email', v)} />
              <FormField label="Office phone" value={form.phone} onChange={(v) => onChange('phone', v)} />
              <FormField label="Contact person" value={form.contactPerson} onChange={(v) => onChange('contactPerson', v)} />
              <FormField label="Contact designation" value={form.contactDesignation} onChange={(v) => onChange('contactDesignation', v)} />
              <FormField label="Contact email" value={form.contactEmail} onChange={(v) => onChange('contactEmail', v)} />
              <FormField label="Contact phone" value={form.contactPhone} onChange={(v) => onChange('contactPhone', v)} />
            </Section>

            <Section title="Legal (India)">
              <FormField label="Registration no" value={form.registrationNo} onChange={(v) => onChange('registrationNo', v)} />
              <FormField label="GSTIN" value={form.gstin} onChange={(v) => onChange('gstin', v.toUpperCase())} />
              <FormField label="PAN" value={form.pan} onChange={(v) => onChange('pan', v.toUpperCase())} />
              <FormField label="Established year" value={form.establishedYear} onChange={(v) => onChange('establishedYear', v)} />
            </Section>

            <Section title="Branding & links">
              <FormField label="Website" value={form.website} onChange={(v) => onChange('website', v)} />
              <FormField label="Logo URL" value={form.logoUrl} onChange={(v) => onChange('logoUrl', v)} />
              <FormField label="Cover image URL" value={form.coverImage} onChange={(v) => onChange('coverImage', v)} />
            </Section>

            <Section title="Settings">
              <FormField label="Timezone" value={form.settings.timezone} onChange={(v) => onSettingsChange('timezone', v)} />
              <FormField label="Currency" value={form.settings.currency} onChange={(v) => onSettingsChange('currency', v.toUpperCase())} />
              <FormField label="Language" value={form.settings.language} onChange={(v) => onSettingsChange('language', v)} />
              <FormField label="Date format" value={form.settings.date_format} onChange={(v) => onSettingsChange('date_format', v)} />
              <FormSelect
                label="Theme"
                value={form.settings.theme}
                onChange={(v) => onSettingsChange('theme', v)}
                options={['system', 'light', 'dark']}
              />
              <FormSelect
                label="Visitor approval"
                value={form.settings.visitorApproval}
                onChange={(v) => onSettingsChange('visitorApproval', v)}
                options={['resident', 'guard', 'admin']}
              />
              <FormField
                label="Financial year start month"
                value={form.settings.financialYearStart}
                onChange={(v) => onSettingsChange('financialYearStart', v)}
              />
            </Section>

            <div className="society-form-actions">
              <button className="btn-primary" type="submit" disabled={saving}>
                <Save size={14} />
                {saving ? 'Saving…' : isCreate ? 'Create society' : 'Save changes'}
              </button>
              {!isCreate && society ? (
                <span className="society-form-hint">
                  Editing profile · version {society.version}
                </span>
              ) : null}
            </div>
          </form>
        </>
      )}
    </AppShell>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}
