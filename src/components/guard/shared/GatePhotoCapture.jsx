import { useCallback, useEffect, useRef, useState } from 'react';
import '../../../styles/guard/visitor/visitors.css';

function isPhoneCameraLabel(label = '') {
  const l = String(label).toLowerCase();
  if (!l.trim()) return false;
  if (l.includes('windows virtual camera') || l.includes('virtual camera')) return true;
  const phoneHints = [
    'phone link', 'phonelink', 'continuity', 'iphone', 'ipad', 'android',
    'phone camera', 'mobile', 'droidcam', 'iriun', 'epoccam', 'camo', 'ivcam',
    'nds camera', 'samsung', 'galaxy', 'pixel', 'oneplus', 'xiaomi', 'redmi',
    'oppo', 'vivo', 'realme', 'motorola', 'nokia',
  ];
  if (phoneHints.some((h) => l.includes(h))) return true;
  if (/\bphone\b/.test(l) && !l.includes('microphone')) return true;
  return false;
}

function isBrowserCameraLabel(label = '') {
  return !isPhoneCameraLabel(label);
}

function friendlyDeviceName(device, index, kindHint) {
  const label = (device?.label || '').trim();
  if (label) return label;
  return kindHint === 'phone' ? `Phone camera ${index + 1}` : `Camera ${index + 1}`;
}

function icon(paths) {
  return function Icon() {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {paths}
      </svg>
    );
  };
}

const CamIcon = icon(
  <>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </>,
);
const UploadIcon = icon(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </>,
);
const CircleIcon = icon(<circle cx="12" cy="12" r="8" />);
const RetakeIcon = icon(
  <>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </>,
);

/**
 * Optional gate photo capture — same UX as Add Visitor.
 * value: data URL | null
 * onChange(next) — parent owns state; call onChange(null) to clear after submit.
 */
export default function GatePhotoCapture({
  value = null,
  onChange,
  showToast,
  title = 'Photo',
  subject = 'person',
}) {
  const photoSrc = value;
  const [camActive, setCamActive] = useState(false);
  const [camLoading, setCamLoading] = useState(false);
  const [activeCameraLabel, setActiveCameraLabel] = useState('');
  const [camModalOpen, setCamModalOpen] = useState(false);
  const [camModalView, setCamModalView] = useState('choice');
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [enumerating, setEnumerating] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const streamRef = useRef(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  async function listVideoDevices() {
    if (!navigator.mediaDevices?.getUserMedia || !navigator.mediaDevices?.enumerateDevices) {
      throw new Error('Camera APIs are not available in this browser.');
    }
    const warm = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    warm.getTracks().forEach((t) => t.stop());
    const all = await navigator.mediaDevices.enumerateDevices();
    return all.filter((d) => d.kind === 'videoinput');
  }

  async function startCameraWithDevice(deviceId, label) {
    if (photoSrc) return;
    setCamLoading(true);
    stopStream();
    try {
      const videoConstraint = deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
        : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } };
      const s = await navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: false });
      streamRef.current = s;
      setCamActive(true);
      setActiveCameraLabel(label || 'Camera');
      setCamModalOpen(false);
      setCamModalView('choice');
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const video = videoRef.current;
      if (!video) {
        s.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCamActive(false);
        setActiveCameraLabel('');
        return;
      }
      video.srcObject = s;
      await video.play();
    } catch (err) {
      stopStream();
      setCamActive(false);
      setActiveCameraLabel('');
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        showToast?.('error', 'Camera denied', 'Allow camera access or use Upload.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        showToast?.('error', 'No camera found', 'Connect a camera or use Upload.');
      } else {
        showToast?.('error', 'Camera error', 'Could not open camera. Try Upload.');
      }
    } finally {
      setCamLoading(false);
      setEnumerating(false);
    }
  }

  function openCameraPicker() {
    if (photoSrc || camActive || camLoading) return;
    setCamModalView('choice');
    setDeviceOptions([]);
    setCamModalOpen(true);
  }

  function closeCameraPicker() {
    if (enumerating || camLoading) return;
    setCamModalOpen(false);
    setCamModalView('choice');
    setDeviceOptions([]);
  }

  async function handlePhoneCameraChoice() {
    setEnumerating(true);
    try {
      const devices = await listVideoDevices();
      const phones = devices.filter((d) => isPhoneCameraLabel(d.label));
      if (phones.length === 0) {
        setCamModalView('phone-missing');
        return;
      }
      if (phones.length === 1) {
        await startCameraWithDevice(phones[0].deviceId, friendlyDeviceName(phones[0], 0, 'phone'));
        return;
      }
      setDeviceOptions(phones.map((d, i) => ({
        deviceId: d.deviceId,
        label: friendlyDeviceName(d, i, 'phone'),
      })));
      setCamModalView('pick-phone');
    } catch (err) {
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        showToast?.('error', 'Camera denied', 'Allow camera access to list devices.');
      } else {
        showToast?.('error', 'Camera error', err?.message || 'Could not list cameras.');
      }
      setCamModalView('phone-missing');
    } finally {
      setEnumerating(false);
    }
  }

  async function handleBrowserCameraChoice() {
    setEnumerating(true);
    try {
      const devices = await listVideoDevices();
      if (devices.length === 0) {
        showToast?.('error', 'No camera found', 'Connect a camera or use Upload.');
        setCamModalOpen(false);
        return;
      }
      const browserCams = devices.filter((d) => isBrowserCameraLabel(d.label));
      const pool = browserCams.length > 0 ? browserCams : devices;
      if (pool.length === 1) {
        await startCameraWithDevice(pool[0].deviceId, friendlyDeviceName(pool[0], 0, 'browser'));
        return;
      }
      setDeviceOptions(pool.map((d, i) => ({
        deviceId: d.deviceId,
        label: friendlyDeviceName(d, i, 'browser'),
      })));
      setCamModalView('pick-browser');
    } catch (err) {
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        showToast?.('error', 'Camera denied', 'Allow camera access or use Upload.');
      } else {
        showToast?.('error', 'Camera error', err?.message || 'Could not open browser camera.');
      }
      setCamModalOpen(false);
    } finally {
      setEnumerating(false);
    }
  }

  function capturePhoto() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v?.videoWidth) return;
    const maxSide = 480;
    const scale = Math.min(1, maxSide / Math.max(v.videoWidth, v.videoHeight));
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    onChange?.(c.toDataURL('image/jpeg', 0.82));
    setCamActive(false);
    setActiveCameraLabel('');
    stopStream();
  }

  function retakePhoto() {
    onChange?.(null);
    setCamActive(false);
    setCamLoading(false);
    setActiveCameraLabel('');
    stopStream();
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    stopStream();
    setCamActive(false);
    setActiveCameraLabel('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange?.(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  return (
    <>
      <div className="avf-card avf-card--photo">
        <div className="avf-card-title">
          {title}
          <span className="avf-optional-tag">optional</span>
        </div>
        <div className="avf-photo-zone">
          <div
            className="avf-photo-circle"
            onClick={!camActive && !photoSrc && !camLoading ? openCameraPicker : undefined}
          >
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                display: camActive ? 'block' : 'none',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
              }}
            />
            {photoSrc && !camActive ? (
              <img
                src={photoSrc}
                alt={subject}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : null}
            {!camActive && !photoSrc ? (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--vp-tx3)" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span className="avf-photo-hint-text">{camLoading ? '…' : 'Tap'}</span>
              </>
            ) : null}
          </div>

          <div className="avf-photo-actions">
            {camActive && activeCameraLabel ? (
              <p className="avf-cam-using">
                Using: <strong>{activeCameraLabel}</strong>
              </p>
            ) : null}
            <div className="avf-photo-btns">
              {!camActive && !photoSrc ? (
                <>
                  <button type="button" className="avf-btn-sm" onClick={openCameraPicker} disabled={camLoading}>
                    <CamIcon /> {camLoading ? 'Opening…' : 'Take Photo'}
                  </button>
                  <button type="button" className="avf-btn-sm" onClick={() => fileRef.current?.click()} disabled={camLoading}>
                    <UploadIcon /> Upload
                  </button>
                </>
              ) : null}
              {camActive ? (
                <button type="button" className="avf-btn-sm avf-btn-capture" onClick={capturePhoto}>
                  <CircleIcon /> Capture now
                </button>
              ) : null}
              {photoSrc || camActive ? (
                <button type="button" className="avf-btn-sm" onClick={retakePhoto}>
                  <RetakeIcon /> Retake
                </button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>

      {camModalOpen ? (
        <div className="avf-cam-backdrop" role="presentation" onClick={closeCameraPicker}>
          <div
            className="avf-cam-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gate-cam-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {camModalView === 'choice' ? (
              <>
                <h3 id="gate-cam-modal-title" className="avf-cam-modal-title">Choose camera</h3>
                <p className="avf-cam-modal-sub">
                  Select how you want to take the {subject} photo.
                </p>
                <div className="avf-cam-choice-grid">
                  <button type="button" className="avf-cam-choice" onClick={handlePhoneCameraChoice} disabled={enumerating || camLoading}>
                    <span className="avf-cam-choice-emoji" aria-hidden>📱</span>
                    <span className="avf-cam-choice-label">Connected Phone Camera</span>
                    <span className="avf-cam-choice-hint">Uses phone if Windows exposes it as a camera</span>
                  </button>
                  <button type="button" className="avf-cam-choice" onClick={handleBrowserCameraChoice} disabled={enumerating || camLoading}>
                    <span className="avf-cam-choice-emoji" aria-hidden>💻</span>
                    <span className="avf-cam-choice-label">Browser Camera</span>
                    <span className="avf-cam-choice-hint">Laptop / USB webcam in this browser</span>
                  </button>
                </div>
                {(enumerating || camLoading) ? <p className="avf-cam-modal-status">Checking cameras…</p> : null}
                <button type="button" className="avf-btn-sm avf-cam-cancel" onClick={closeCameraPicker} disabled={enumerating || camLoading}>
                  Cancel
                </button>
              </>
            ) : null}

            {camModalView === 'phone-missing' ? (
              <>
                <h3 id="gate-cam-modal-title" className="avf-cam-modal-title">Phone Camera Not Available</h3>
                <p className="avf-cam-modal-sub">
                  Please connect your phone to this computer and make sure it is available as a camera.
                </p>
                <div className="avf-cam-modal-actions">
                  <button type="button" className="avf-btn-sm" onClick={handlePhoneCameraChoice} disabled={enumerating || camLoading}>
                    {enumerating ? 'Checking…' : 'Try Again'}
                  </button>
                  <button type="button" className="avf-btn-sm avf-btn-capture" onClick={handleBrowserCameraChoice} disabled={enumerating || camLoading}>
                    Use Browser Camera
                  </button>
                </div>
              </>
            ) : null}

            {camModalView === 'pick-phone' || camModalView === 'pick-browser' ? (
              <>
                <h3 id="gate-cam-modal-title" className="avf-cam-modal-title">
                  {camModalView === 'pick-phone' ? 'Select phone camera' : 'Select camera'}
                </h3>
                <div className="avf-cam-device-list">
                  {deviceOptions.map((d) => (
                    <button
                      key={d.deviceId}
                      type="button"
                      className="avf-cam-device"
                      disabled={camLoading}
                      onClick={() => startCameraWithDevice(d.deviceId, d.label)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <button type="button" className="avf-btn-sm avf-cam-cancel" onClick={closeCameraPicker} disabled={camLoading}>
                  Cancel
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
