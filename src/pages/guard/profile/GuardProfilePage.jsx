import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '@/constants/guardRoutes.js';
import '@/styles/guard/guard-main.css';
import Sidebar from '@/components/guard/Sidebar';
import DashboardHeader from '@/components/guard/DashboardHeader';
import {
  apiError,
  changeGuardPassword,
  getGuardProfile,
  updateGuardProfile,
} from '@/services/guard.service';

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function GuardProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    designation: '',
    gender: '',
    bloodGroup: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    officeContact: '',
  });

  const [pwd, setPwd] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const p = await getGuardProfile();
      setProfile(p);
      const u = p.user || {};
      setForm({
        designation: u.designation || '',
        gender: u.gender || '',
        bloodGroup: u.bloodGroup || u.blood_group || '',
        address: u.address || '',
        emergencyName: u.emergencyName || u.emergency_name || '',
        emergencyPhone: u.emergencyPhone || u.emergency_phone || '',
        officeContact: u.officeContact || u.office_contact || '',
      });
    } catch (e) {
      setErr(apiError(e, 'Failed to load profile'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'My Profile | Guard';
    load();
  }, [load]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      await updateGuardProfile({
        designation: form.designation || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        address: form.address || undefined,
        emergencyName: form.emergencyName || undefined,
        emergencyPhone: form.emergencyPhone || undefined,
        officeContact: form.officeContact || undefined,
      });
      setMsg('Profile updated');
      await load();
    } catch (error) {
      setErr(apiError(error, 'Update failed'));
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setMsg('');
    setErr('');
    if (pwd.newPassword.length < 8) {
      setErr('New password must be at least 8 characters');
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      setErr('New password and confirm do not match');
      return;
    }
    setSaving(true);
    try {
      await changeGuardPassword({
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
      setMsg('Password changed');
    } catch (error) {
      setErr(apiError(error, 'Password change failed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="gm-root">
      <Sidebar activePage="My Profile" onNavigate={(label) => navigateGuard(navigate, label)} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <button
            type="button"
            className="vp-back-btn"
            style={{ marginBottom: 12 }}
            onClick={() => navigate('/guard/dashboard')}
          >
            ← Dashboard
          </button>
          <h2 className="gm-park-page-title">My Profile</h2>
          {err ? <div style={{ color: 'var(--gm-danger)', marginBottom: 10 }}>{err}</div> : null}
          {msg ? <div style={{ color: 'var(--gm-success, #10b981)', marginBottom: 10 }}>{msg}</div> : null}

          {loading ? (
            <p>Loading…</p>
          ) : (
            <>
              <div className="gm-panel" style={{ marginBottom: 16 }}>
                <div className="gm-panel-header">
                  <span className="gm-panel-title">{profile?.name || 'Guard'}</span>
                </div>
                <div style={{ padding: 16, display: 'grid', gap: 8, fontSize: 14 }}>
                  <div>Email: {profile?.email || '—'}</div>
                  <div>Phone: {profile?.phone || '—'}</div>
                  <div>Employee: {profile?.employeeId || '—'}</div>
                </div>
              </div>

              <form className="gm-panel" style={{ marginBottom: 16 }} onSubmit={saveProfile}>
                <div className="gm-panel-header">
                  <span className="gm-panel-title">Edit details</span>
                </div>
                <div style={{ padding: 16, display: 'grid', gap: 12, maxWidth: 520 }}>
                  <label>
                    Designation
                    <input
                      className="gm-search-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={form.designation}
                      onChange={(e) => setField('designation', e.target.value)}
                    />
                  </label>
                  <label>
                    Gender
                    <select
                      className="gm-search-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={form.gender}
                      onChange={(e) => setField('gender', e.target.value)}
                    >
                      <option value="">—</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Blood group
                    <select
                      className="gm-search-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={form.bloodGroup}
                      onChange={(e) => setField('bloodGroup', e.target.value)}
                    >
                      <option value="">—</option>
                      {BLOOD.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Address
                    <textarea
                      className="gm-search-input"
                      style={{ width: '100%', marginTop: 4, minHeight: 72 }}
                      value={form.address}
                      onChange={(e) => setField('address', e.target.value)}
                    />
                  </label>
                  <label>
                    Emergency name
                    <input
                      className="gm-search-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={form.emergencyName}
                      onChange={(e) => setField('emergencyName', e.target.value)}
                    />
                  </label>
                  <label>
                    Emergency phone
                    <input
                      className="gm-search-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={form.emergencyPhone}
                      onChange={(e) => setField('emergencyPhone', e.target.value)}
                    />
                  </label>
                  <label>
                    Office contact
                    <input
                      className="gm-search-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={form.officeContact}
                      onChange={(e) => setField('officeContact', e.target.value)}
                    />
                  </label>
                  <button type="submit" className="gm-exit-btn" disabled={saving} style={{ width: 'fit-content' }}>
                    {saving ? 'Saving…' : 'Save profile'}
                  </button>
                </div>
              </form>

              <form className="gm-panel" onSubmit={savePassword}>
                <div className="gm-panel-header">
                  <span className="gm-panel-title">Change password</span>
                </div>
                <div style={{ padding: 16, display: 'grid', gap: 12, maxWidth: 420 }}>
                  <label>
                    Current password
                    <input
                      type="password"
                      className="gm-search-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={pwd.currentPassword}
                      onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    New password
                    <input
                      type="password"
                      className="gm-search-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={pwd.newPassword}
                      onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                      required
                      minLength={8}
                    />
                  </label>
                  <label>
                    Confirm new password
                    <input
                      type="password"
                      className="gm-search-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={pwd.confirm}
                      onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                      required
                    />
                  </label>
                  <button type="submit" className="gm-exit-btn" disabled={saving} style={{ width: 'fit-content' }}>
                    {saving ? 'Saving…' : 'Update password'}
                  </button>
                </div>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
