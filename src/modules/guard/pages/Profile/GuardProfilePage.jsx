import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Camera,
  DoorOpen,
  Hash,
  IdCard,
  Mail,
  Phone,
} from 'lucide-react';
import { navigateGuard } from '@/modules/guard/constants/guardRoutes.js';
import Sidebar from '@/modules/guard/components/Sidebar';
import DashboardHeader from '@/modules/guard/components/DashboardHeader';
import { useTenant } from '@/hooks/useTenant';
import {
  apiError,
  getGuardProfile,
  removeGuardPhoto,
  uploadGuardPhoto,
} from '@/modules/guard/services/guard/guard.service';
import { mediaUrl } from '@/modules/guard/services/core/http';
import '@/modules/guard/styles/core/guard-main.css';
import '@/modules/guard/styles/profile/profile.css';

const PHOTO_VIEW = 260;

function coverScale(width, height, zoom) {
  return Math.max(PHOTO_VIEW / width, PHOTO_VIEW / height) * zoom;
}

function photoFrame(adjust) {
  const scale = coverScale(adjust.width, adjust.height, adjust.zoom);
  const width = adjust.width * scale;
  const height = adjust.height * scale;
  return {
    width,
    height,
    left: (PHOTO_VIEW - width) / 2 + adjust.x,
    top: (PHOTO_VIEW - height) / 2 + adjust.y,
  };
}

function clampPhotoOffset(x, y, width, height, zoom) {
  const scale = coverScale(width, height, zoom);
  const limitX = Math.max(0, (width * scale - PHOTO_VIEW) / 2);
  const limitY = Math.max(0, (height * scale - PHOTO_VIEW) / 2);
  return {
    x: Math.min(limitX, Math.max(-limitX, x)),
    y: Math.min(limitY, Math.max(-limitY, y)),
  };
}

function formatJoined(value) {
  if (!value) return '';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function InfoBlock({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="gp-block">
      <span className="gp-block-icon" aria-hidden="true">
        <Icon size={16} strokeWidth={2.1} />
      </span>
      <span className="gp-block-label">{label}</span>
      <span className="gp-block-value">{value}</span>
    </div>
  );
}

export default function GuardProfilePage() {
  const navigate = useNavigate();
  const { societyName } = useTenant();
  const fileRef = useRef(null);
  const avatarRef = useRef(null);
  const dragRef = useRef(null);
  const toastTimer = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);
  const [err, setErr] = useState('');
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adjust, setAdjust] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    setMissing(false);
    try {
      setProfile(await getGuardProfile());
    } catch (e) {
      if (e?.status === 404 || e?.response?.status === 404) {
        setProfile(null);
        setMissing(true);
      } else {
        setErr(apiError(e, 'Failed to load profile'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'My Profile | Guard';
    load();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [load]);

  function showToast(text, tone = 'ok') {
    setToast({ text, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onPointerDown(event) {
      if (!avatarRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  function closeAdjust() {
    setAdjust((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  function onPickPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setErr('');
      setAdjust({
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        zoom: 1,
        x: 0,
        y: 0,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      showToast('Could not read that image.', 'error');
    };
    image.src = url;
  }

  function moveAdjust(clientX, clientY) {
    const drag = dragRef.current;
    if (!drag || !adjust) return;
    const next = clampPhotoOffset(
      drag.x + (clientX - drag.px),
      drag.y + (clientY - drag.py),
      adjust.width,
      adjust.height,
      adjust.zoom,
    );
    setAdjust((current) => (current ? { ...current, ...next } : current));
  }

  function changeZoom(zoom) {
    setAdjust((current) => {
      if (!current) return current;
      return { ...current, zoom, ...clampPhotoOffset(current.x, current.y, current.width, current.height, zoom) };
    });
  }

  async function saveAdjusted() {
    if (!adjust) return;
    const image = new Image();
    image.src = adjust.url;
    try {
      await image.decode();
    } catch {
      showToast('Could not read that image.', 'error');
      return;
    }
    const scale = coverScale(adjust.width, adjust.height, adjust.zoom);
    const left = (PHOTO_VIEW - adjust.width * scale) / 2 + adjust.x;
    const top = (PHOTO_VIEW - adjust.height * scale) / 2 + adjust.y;
    const output = 512;
    const canvas = document.createElement('canvas');
    canvas.width = output;
    canvas.height = output;
    const context = canvas.getContext('2d');
    context.drawImage(
      image,
      -left / scale,
      -top / scale,
      PHOTO_VIEW / scale,
      PHOTO_VIEW / scale,
      0,
      0,
      output,
      output,
    );
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) {
      showToast('Could not prepare the photo.', 'error');
      return;
    }
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    closeAdjust();
    setSaving(true);
    try {
      setProfile(await uploadGuardPhoto(file));
      showToast('Photo updated');
    } catch (error) {
      showToast(apiError(error, 'Photo upload failed'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function onRemovePhoto() {
    setSaving(true);
    try {
      setProfile(await removeGuardPhoto());
      showToast('Photo removed');
    } catch (error) {
      showToast(apiError(error, 'Photo remove failed'), 'error');
    } finally {
      setSaving(false);
    }
  }

  const photoSrc = mediaUrl(profile?.photoUrl);
  const initials = profile?.initials || 'G';
  const activeKnown = typeof profile?.isActive === 'boolean';

  return (
    <div className="gm-root" data-theme="light">
      <Sidebar activePage="My Profile" onNavigate={(label) => navigateGuard(navigate, label)} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main gp-page">
          <header className="gp-head">
            <button type="button" className="gp-back" onClick={() => navigate('/guard/dashboard')}>
              <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" />
              Back to Dashboard
            </button>
            <h1 className="gp-title">My Profile</h1>
          </header>

          {err ? <p className="gp-note gp-note--error">{err}</p> : null}

          {loading ? (
            <p className="gp-state">Loading profile…</p>
          ) : missing ? (
            <p className="gp-state">No guard profile was found.</p>
          ) : (
            <>
              <section className="gp-hero" aria-label="Profile summary">
                <div className="gp-avatar-wrap" ref={avatarRef}>
                  <button
                    type="button"
                    className="gp-avatar"
                    disabled={saving}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label="Profile photo options"
                    onClick={() => setMenuOpen((open) => !open)}
                  >
                    {photoSrc ? <img src={photoSrc} alt="" /> : <span>{initials}</span>}
                  </button>
                  <span className="gp-avatar-badge" aria-hidden="true">
                    <Camera size={13} strokeWidth={2.3} />
                  </span>
                  {menuOpen ? (
                    <div className="gp-photo-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          fileRef.current?.click();
                        }}
                      >
                        <Camera size={14} strokeWidth={2.2} aria-hidden="true" />
                        {photoSrc ? 'Change photo' : 'Add photo'}
                      </button>
                      {photoSrc ? (
                        <button
                          type="button"
                          role="menuitem"
                          className="is-danger"
                          disabled={saving}
                          onClick={() => {
                            setMenuOpen(false);
                            onRemovePhoto();
                          }}
                        >
                          Remove photo
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    hidden
                    onChange={onPickPhoto}
                  />
                </div>
                <div className="gp-identity">
                  <h2 className="gp-name">{profile?.name || 'Guard'}</h2>
                  {profile?.designation ? <p className="gp-designation">{profile.designation}</p> : null}
                  <p className="gp-identity-line">
                    {profile?.staffCode ? <span>Staff code: {profile.staffCode}</span> : null}
                    {profile?.gateName ? <span>{profile.gateName}</span> : null}
                  </p>
                </div>
                {activeKnown ? (
                  <p className={`gp-live${profile.isActive ? ' is-on' : ''}`}>
                    <span className="gp-live-dot" aria-hidden="true" />
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </p>
                ) : <span />}
              </section>

              <div className="gp-info-grid">
                <section className="gp-card">
                  <h3>Personal information</h3>
                  <div className="gp-blocks">
                    <InfoBlock icon={Mail} label="Email" value={profile?.email} />
                    <InfoBlock icon={Phone} label="Phone" value={profile?.phone} />
                  </div>
                </section>
                <section className="gp-card">
                  <h3>Employment information</h3>
                  <div className="gp-blocks">
                    <InfoBlock icon={BadgeCheck} label="Designation" value={profile?.designation} />
                    <InfoBlock icon={IdCard} label="Staff code" value={profile?.staffCode} />
                  </div>
                </section>
              </div>

              <section className="gp-card gp-gate">
                <h3>Gate assignment</h3>
                <div className="gp-blocks gp-blocks--gate">
                  <InfoBlock icon={Building2} label="Society" value={societyName || ''} />
                  <InfoBlock icon={DoorOpen} label="Assigned gate" value={profile?.gateName} />
                  <InfoBlock icon={Hash} label="Gate code" value={profile?.gateCode} />
                  <InfoBlock icon={CalendarDays} label="Joining date" value={formatJoined(profile?.joiningDate)} />
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {adjust ? (
        <div className="gp-adjust-backdrop" role="presentation">
          <div className="gp-adjust" role="dialog" aria-modal="true" aria-label="Adjust profile photo">
            <h2>Adjust photo</h2>
            <p>Drag the photo to reposition it, then save.</p>
            <div
              className="gp-adjust-stage"
              onPointerDown={(event) => {
                dragRef.current = { px: event.clientX, py: event.clientY, x: adjust.x, y: adjust.y };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (dragRef.current) moveAdjust(event.clientX, event.clientY);
              }}
              onPointerUp={() => {
                dragRef.current = null;
              }}
            >
              <img src={adjust.url} alt="" draggable={false} style={photoFrame(adjust)} />
            </div>
            <label className="gp-adjust-zoom">
              Zoom
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.01"
                value={adjust.zoom}
                onChange={(event) => changeZoom(Number(event.target.value))}
              />
            </label>
            <div className="gp-adjust-actions">
              <button type="button" className="gp-photo-btn gp-photo-btn--quiet" onClick={closeAdjust} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="gp-photo-btn" onClick={saveAdjusted} disabled={saving}>
                {saving ? 'Saving…' : 'Save photo'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {toast ? (
        <div className={`gp-toast${toast.tone === 'error' ? ' is-error' : ''}`} role="status">
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}
