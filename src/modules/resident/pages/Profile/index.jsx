import { useState } from 'react';
import { PageHeader, StatusLine } from '@/modules/resident/components/ResidentShell';
import { ResidentNote } from '@/modules/resident/components/ResidentConfirm';
import { useLoad } from '@/modules/resident/components/useLoad';
import {
  getHousehold,
  getMyFlat,
  getMyProfile,
  saveMyProfile,
  savePassword,
} from '@/modules/resident/services/residentPortal.service';
import '@/modules/resident/styles/profile/profile.css';

const FIELDS = ['name', 'phone', 'emergencyName', 'emergencyPhone'];
const EMPTY_PASS = { currentPassword: '', newPassword: '', confirmPassword: '' };

function initials(name) {
  return String(name || 'R')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function Svg({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const digits = (value) => value.replace(/\D/g, '').slice(0, 10);

export default function ProfilePage() {
  const profileLoad = useLoad(() => getMyProfile(), []);
  const homeLoad = useLoad(() => getHousehold(), []);
  const flatLoad = useLoad(() => getMyFlat(), []);

  const [draft, setDraft] = useState(null);
  const [pass, setPass] = useState(EMPTY_PASS);
  const [profileNote, setProfileNote] = useState({ tone: 'ok', text: '' });
  const [passNote, setPassNote] = useState({ tone: 'ok', text: '' });
  const [busy, setBusy] = useState('');

  const profile = profileLoad.data;
  const form = draft || profile;
  const dirty = Boolean(draft && profile && FIELDS.some((key) => (draft[key] || '') !== (profile[key] || '')));
  const flat = flatLoad.data;
  const members = Array.isArray(homeLoad.data) ? homeLoad.data : [];

  function set(key, value) {
    setDraft((current) => ({ ...(current || profile), [key]: value }));
    setProfileNote({ tone: 'ok', text: '' });
  }

  async function save(event) {
    event.preventDefault();
    if (busy || !dirty) return;
    setBusy('profile');
    setProfileNote({ tone: 'ok', text: '' });
    try {
      await saveMyProfile({
        name: form.name,
        phone: form.phone,
        emergencyName: form.emergencyName,
        emergencyPhone: form.emergencyPhone,
      });
      await profileLoad.reload();
      setDraft(null);
      setProfileNote({ tone: 'ok', text: 'Profile saved.' });
    } catch (err) {
      setProfileNote({ tone: 'err', text: err.message });
    } finally {
      setBusy('');
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    if (busy) return;
    if (pass.newPassword !== pass.confirmPassword) {
      setPassNote({ tone: 'err', text: 'New passwords do not match.' });
      return;
    }
    setBusy('password');
    setPassNote({ tone: 'ok', text: '' });
    try {
      await savePassword({ currentPassword: pass.currentPassword, newPassword: pass.newPassword });
      setPass(EMPTY_PASS);
      setPassNote({ tone: 'ok', text: 'Password updated.' });
    } catch (err) {
      setPassNote({ tone: 'err', text: err.message });
    } finally {
      setBusy('');
    }
  }

  const setP = (key, value) => {
    setPass((current) => ({ ...current, [key]: value }));
    setPassNote({ tone: 'ok', text: '' });
  };

  return (
    <div className="res-prof">
      <PageHeader title="My Profile" />

      <StatusLine loading={profileLoad.loading} error={profileLoad.error} onRetry={profileLoad.reload}>
        {form ? (
          <>
            <section className="res-card res-prof-hero" aria-label="Account">
              <div className="res-prof-avatar" aria-hidden="true">{initials(profile.name)}</div>
              <div className="res-prof-id">
                <h2>{profile.name}</h2>
                <div className="res-prof-meta">
                  <span>
                    <Svg><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Svg>
                    {profile.email}
                  </span>
                  <span>
                    <Svg><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></Svg>
                    {profile.phone}
                  </span>
                </div>
              </div>
              {flat ? (
                <div className="res-prof-flat">
                  <span className="res-prof-flat-no">{flat.flatNo}</span>
                  <span>{[flat.building, flat.society].filter(Boolean).join(' · ')}</span>
                  {flat.occupancyRole ? <span className="res-prof-role">{flat.occupancyRole}</span> : null}
                </div>
              ) : null}
            </section>

            <div className="res-prof-grid">
              <form className="res-card res-prof-main" onSubmit={save} aria-labelledby="res-prof-details">
                <div className="res-card-head">
                  <h2 id="res-prof-details">Personal details</h2>
                </div>

                <div className="res-prof-section">
                  <div className="res-prof-fields">
                    <label>
                      Full name
                      <input required value={form.name || ''} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
                    </label>
                    <label>
                      Mobile number
                      <input
                        required
                        inputMode="numeric"
                        pattern="\d{10}"
                        title="10-digit mobile number"
                        value={form.phone || ''}
                        onChange={(e) => set('phone', digits(e.target.value))}
                        autoComplete="tel"
                      />
                    </label>
                    <label className="res-span">
                      Email address
                      <input value={form.email || ''} readOnly aria-readonly="true" />
                    </label>
                  </div>
                </div>

                <div className="res-prof-section">
                  <h3 className="res-prof-subhead">Emergency contact</h3>
                  <div className="res-prof-fields">
                    <label>
                      Contact name
                      <input value={form.emergencyName || ''} onChange={(e) => set('emergencyName', e.target.value)} />
                    </label>
                    <label>
                      Contact number
                      <input
                        inputMode="numeric"
                        pattern="\d{10}"
                        title="10-digit mobile number"
                        value={form.emergencyPhone || ''}
                        onChange={(e) => set('emergencyPhone', digits(e.target.value))}
                      />
                    </label>
                  </div>
                </div>

                <div className="res-prof-foot">
                  <div className="res-prof-foot-note" aria-live="polite">
                    <ResidentNote tone={profileNote.tone}>{profileNote.text}</ResidentNote>
                    {!profileNote.text && dirty ? <span className="res-prof-unsaved">Unsaved changes</span> : null}
                  </div>
                  <div className="res-prof-foot-actions">
                    <button
                      type="button"
                      className="res-btn res-btn--secondary"
                      onClick={() => { setDraft(null); setProfileNote({ tone: 'ok', text: '' }); }}
                      disabled={!dirty || Boolean(busy)}
                    >
                      Discard
                    </button>
                    <button type="submit" className="res-btn res-btn--primary" disabled={!dirty || Boolean(busy)}>
                      {busy === 'profile' ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="res-prof-side">
                <section className="res-card" aria-labelledby="res-prof-household">
                  <div className="res-card-head">
                    <h2 id="res-prof-household">Household</h2>
                    {members.length ? <span className="res-prof-count">{members.length}</span> : null}
                  </div>
                  <StatusLine
                    loading={homeLoad.loading}
                    error={homeLoad.error}
                    onRetry={homeLoad.reload}
                    empty={!homeLoad.loading && !homeLoad.error && !members.length ? 'No household members.' : ''}
                  >
                    <ul className="res-prof-members">
                      {members.map((member) => (
                        <li key={member.id}>
                          <span className="res-prof-member-avatar" aria-hidden="true">{initials(member.name)}</span>
                          <strong>{member.name}</strong>
                          <span className="res-prof-role">{member.role}</span>
                        </li>
                      ))}
                    </ul>
                  </StatusLine>
                </section>

                <form className="res-card" onSubmit={updatePassword} aria-labelledby="res-prof-security">
                  <div className="res-card-head">
                    <h2 id="res-prof-security">Password</h2>
                  </div>
                  <div className="res-prof-section res-prof-stack">
                    <label>
                      Current password
                      <input type="password" required value={pass.currentPassword} onChange={(e) => setP('currentPassword', e.target.value)} autoComplete="current-password" />
                    </label>
                    <label>
                      New password
                      <input type="password" required minLength={6} value={pass.newPassword} onChange={(e) => setP('newPassword', e.target.value)} autoComplete="new-password" />
                    </label>
                    <label>
                      Confirm new password
                      <input type="password" required value={pass.confirmPassword} onChange={(e) => setP('confirmPassword', e.target.value)} autoComplete="new-password" />
                    </label>
                    <ResidentNote tone={passNote.tone}>{passNote.text}</ResidentNote>
                    <button type="submit" className="res-btn res-btn--secondary" disabled={Boolean(busy)}>
                      {busy === 'password' ? 'Updating…' : 'Update password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        ) : null}
      </StatusLine>
    </div>
  );
}
