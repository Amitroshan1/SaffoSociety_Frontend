// client/src/components/guard/visitor/AddVisitorForm.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Form for creating a new visitor entry.
//
// Props:
//   onSubmit  : (entry) => void — called after successful form submission
//   showToast : (type, title, sub) => void — for error/success feedback
//
// ── BACKEND INTEGRATION NOTES ─────────────────────────────────────────────────
//
// 1. PHOTO UPLOAD
//    On capturePhoto() or handleFileUpload():
//      a. Convert canvas/file to Blob
//      b. Upload to Supabase Storage:
//           const { data, error } = await supabase.storage
//             .from('visitor-photos')
//             .upload(`${societyId}/${Date.now()}.jpg`, blob, { contentType: 'image/jpeg' })
//         OR upload to S3 via presigned URL:
//           POST /api/upload/presign → { url, key }
//           PUT <url> with blob body
//      c. Store returned URL in photoUrl state
//      d. Send photoUrl in the POST /api/visitors body
//
// 2. FLAT AUTOCOMPLETE
//    Replace the plain text input for "Visiting flat" with an autocomplete:
//      GET /api/flats?societyId=X&q=B-1
//      Returns: [{ id, flat_number, resident_name }]
//    Store flat_id (not flat_number string) in form state — the backend needs flat_id.
//
// 3. RECENT VISITORS
//    Replace hardcoded RECENT_VISITORS array with:
//      GET /api/visitors/recent?guardId=X&limit=5
//      Returns: last 5 unique visitors added by this guard
//    Called once on mount via useEffect.
//
// 4. GUARD INFO
//    Replace hardcoded "Rajesh Kumar" in preview card with:
//      const { user } = useAuth()  →  user.name
//    And send guard_id in the POST body from user.id
//
// 5. NOTIFY RESIDENT
//    The notify toggle maps to:  notify_resident: true/false  in POST body
//    Backend handles FCM push if notify_resident === true
//
// 6. PRE-APPROVED
//    If pre_approved === true:
//      Backend sets status='approved' and entry_time=NOW() immediately on INSERT
//      (skip the pending state entirely)
//
// 7. FORM SUBMIT → POST /api/visitors
//    Body shape:
//    {
//      society_id     : number,    // from user.society_id (useAuth)
//      flat_id        : number,    // selected flat's DB id
//      guard_id       : number,    // user.id (useAuth)
//      name           : string,
//      phone          : string,    // without country code — backend prepends +91
//      purpose        : string,
//      persons_count  : number,
//      vehicle_number : string,
//      vehicle_type   : string,
//      photo_url      : string | null,
//      notify_resident: boolean,
//      pre_approved   : boolean,
//      remarks        : string,
//    }
//    Returns: { visitor: { id, ...allFields, status, created_at } }
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";
import { getRecentWalkIns } from "../../../services/guard.service";

const PURPOSES = [
  "Guest",
  "Work / Service",
  "Medical",
  "Other",
];

/** Heuristic: label looks like a phone / Phone Link / Continuity–style camera. */
function isPhoneCameraLabel(label = "") {
  const l = String(label).toLowerCase();
  if (!l.trim()) return false;

  // Phone Link / Continuity usually expose the phone as a Windows virtual camera
  if (l.includes("windows virtual camera") || l.includes("virtual camera")) {
    return true;
  }

  const phoneHints = [
    "phone link",
    "phonelink",
    "continuity",
    "iphone",
    "ipad",
    "android",
    "phone camera",
    "mobile",
    "droidcam",
    "iriun",
    "epoccam",
    "camo",
    "ivcam",
    "nds camera",
    "samsung",
    "galaxy",
    "pixel",
    "oneplus",
    "xiaomi",
    "redmi",
    "oppo",
    "vivo",
    "realme",
    "motorola",
    "nokia",
  ];
  if (phoneHints.some((h) => l.includes(h))) return true;

  // Common Samsung / Android model codes in device names (e.g. "Amaresh's S21 FE")
  if (/\bs(?:1[0-9]|2[0-9]|3[0-9])\s*(?:fe|ultra|\+|plus)?\b/.test(l)) return true;
  if (/\b(?:note|fold|flip)\s*\d*/.test(l)) return true;

  // Lone "phone" but not "microphone" etc.
  if (/\bphone\b/.test(l) && !l.includes("microphone")) return true;
  return false;
}

/** Built-in / USB webcams for the Browser Camera path. */
function isBrowserCameraLabel(label = "") {
  return !isPhoneCameraLabel(label);
}

function friendlyDeviceName(device, index, kindHint) {
  const label = (device?.label || "").trim();
  if (label) return label;
  if (kindHint === "phone") return `Phone camera ${index + 1}`;
  return `Camera ${index + 1}`;
}

export default function AddVisitorForm({ onSubmit, showToast }) {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [flat, setFlat] = useState("");
  // TODO: also track flatId for backend: const [flatId, setFlatId] = useState(null);
  const [purpose, setPurpose] = useState("Guest");
  const [persons, setPersons] = useState(1);
  const [vehicle, setVehicle] = useState("");
  const [vtype, setVtype] = useState("");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [preapprove, setPreapprove] = useState(false);
  const [submitting, setSubmitting] = useState(false); // prevent double-submit

  // ── Photo state ────────────────────────────────────────────────────────────
  const [photoSrc, setPhotoSrc] = useState(null);
  // TODO: track the uploaded URL separately
  // const [photoUrl, setPhotoUrl] = useState(null);
  const [camActive, setCamActive] = useState(false);
  const [camLoading, setCamLoading] = useState(false);
  const [activeCameraLabel, setActiveCameraLabel] = useState("");
  const [camModalOpen, setCamModalOpen] = useState(false);
  // choice | phone-missing | pick-phone | pick-browser
  const [camModalView, setCamModalView] = useState("choice");
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [enumerating, setEnumerating] = useState(false);
  const [recentWalkIns, setRecentWalkIns] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const streamRef = useRef(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getRecentWalkIns(5);
        if (!cancelled) setRecentWalkIns(rows);
      } catch {
        if (!cancelled) setRecentWalkIns([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function listVideoDevices() {
    if (!navigator.mediaDevices?.getUserMedia || !navigator.mediaDevices?.enumerateDevices) {
      throw new Error("Camera APIs are not available in this browser.");
    }
    // Permission first — labels are often empty until granted
    const warm = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    warm.getTracks().forEach((t) => t.stop());

    const all = await navigator.mediaDevices.enumerateDevices();
    return all.filter((d) => d.kind === "videoinput");
  }

  /* ── Camera ── */
  async function startCameraWithDevice(deviceId, label) {
    if (photoSrc) return;
    setCamLoading(true);
    stopStream();
    try {
      const videoConstraint = deviceId
        ? {
            deviceId: { exact: deviceId },
            width: { ideal: 640 },
            height: { ideal: 480 },
          }
        : {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          };

      const s = await navigator.mediaDevices.getUserMedia({
        video: videoConstraint,
        audio: false,
      });
      streamRef.current = s;
      setCamActive(true);
      setActiveCameraLabel(label || "Camera");
      setCamModalOpen(false);
      setCamModalView("choice");

      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );
      const video = videoRef.current;
      if (!video) {
        s.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCamActive(false);
        setActiveCameraLabel("");
        return;
      }
      video.srcObject = s;
      await video.play();
    } catch (err) {
      stopStream();
      setCamActive(false);
      setActiveCameraLabel("");
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        showToast("error", "Camera denied", "Allow camera access or use Upload.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        showToast("error", "No camera found", "Connect a camera or use Upload.");
      } else {
        showToast("error", "Camera error", "Could not open camera. Try Upload.");
      }
    } finally {
      setCamLoading(false);
      setEnumerating(false);
    }
  }

  function openCameraPicker() {
    if (photoSrc || camActive || camLoading) return;
    setCamModalView("choice");
    setDeviceOptions([]);
    setCamModalOpen(true);
  }

  function closeCameraPicker() {
    if (enumerating || camLoading) return;
    setCamModalOpen(false);
    setCamModalView("choice");
    setDeviceOptions([]);
  }

  async function handlePhoneCameraChoice() {
    setEnumerating(true);
    try {
      const devices = await listVideoDevices();
      const phones = devices.filter((d) => isPhoneCameraLabel(d.label));
      if (phones.length === 0) {
        setCamModalView("phone-missing");
        return;
      }
      if (phones.length === 1) {
        await startCameraWithDevice(
          phones[0].deviceId,
          friendlyDeviceName(phones[0], 0, "phone"),
        );
        return;
      }
      setDeviceOptions(
        phones.map((d, i) => ({
          deviceId: d.deviceId,
          label: friendlyDeviceName(d, i, "phone"),
        })),
      );
      setCamModalView("pick-phone");
    } catch (err) {
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        showToast("error", "Camera denied", "Allow camera access to list devices.");
      } else {
        showToast(
          "error",
          "Camera error",
          err?.message || "Could not list cameras.",
        );
      }
      setCamModalView("phone-missing");
    } finally {
      setEnumerating(false);
    }
  }

  async function handleBrowserCameraChoice() {
    setEnumerating(true);
    try {
      const devices = await listVideoDevices();
      if (devices.length === 0) {
        showToast("error", "No camera found", "Connect a camera or use Upload.");
        setCamModalOpen(false);
        return;
      }

      // Prefer real browser/laptop cams; don't force the phone into this list
      const browserCams = devices.filter((d) => isBrowserCameraLabel(d.label));
      const pool = browserCams.length > 0 ? browserCams : devices;

      if (pool.length === 1) {
        await startCameraWithDevice(
          pool[0].deviceId,
          friendlyDeviceName(pool[0], 0, "browser"),
        );
        return;
      }

      setDeviceOptions(
        pool.map((d, i) => ({
          deviceId: d.deviceId,
          label: friendlyDeviceName(d, i, "browser"),
        })),
      );
      setCamModalView("pick-browser");
    } catch (err) {
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        showToast("error", "Camera denied", "Allow camera access or use Upload.");
      } else {
        showToast(
          "error",
          "Camera error",
          err?.message || "Could not open browser camera.",
        );
      }
      setCamModalOpen(false);
    } finally {
      setEnumerating(false);
    }
  }

  async function retryPhoneCameraDetect() {
    await handlePhoneCameraChoice();
  }

  function capturePhoto() {
    const v = videoRef.current,
      c = canvasRef.current;
    if (!v?.videoWidth) return;
    // Downscale for preview circle — full native res is slow to encode
    const maxSide = 480;
    const scale = Math.min(1, maxSide / Math.max(v.videoWidth, v.videoHeight));
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.82);
    setPhotoSrc(dataUrl);
    setCamActive(false);
    setActiveCameraLabel("");
    stopStream();
    // TODO: Upload to storage:
    // const blob = await (await fetch(dataUrl)).blob();
    // const url = await uploadVisitorPhoto(blob);  // returns storage URL
    // setPhotoUrl(url);
  }

  function retakePhoto() {
    setPhotoSrc(null);
    setCamActive(false);
    setCamLoading(false);
    setActiveCameraLabel("");
    // setPhotoUrl(null);
    stopStream();
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    stopStream();
    setPhotoSrc(URL.createObjectURL(file));
    setCamActive(false);
    setActiveCameraLabel("");
    // TODO: Upload file:
    // const url = await uploadVisitorPhoto(file);
    // setPhotoUrl(url);
  }

  /* ── Submit ── */
  async function handleSubmit() {
    if (!name.trim() || !phone.trim() || !flat.trim()) {
      showToast(
        "error",
        "Missing fields",
        "Name, phone and flat are required.",
      );
      return;
    }
    if (phone.trim().length !== 10) {
      showToast("error", "Invalid phone", "Enter a valid 10-digit number.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        flat: flat.trim(),
        purpose,
        persons,
        vehicle,
        vtype,
        note,
        notify,
        preapprove,
        photoSrc,
      });

      setName("");
      setPhone("");
      setFlat("");
      setVehicle("");
      setVtype("");
      setNote("");
      setPersons(1);
      setPurpose("Guest");
      setNotify(true);
      setPreapprove(false);
      retakePhoto();
    } catch (err) {
      showToast(
        "error",
        "Failed to add visitor",
        err?.response?.data?.message || err.message || "Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="avf-root">
      {recentWalkIns.length > 0 ? (
        <div className="avf-card" style={{ marginBottom: 12 }}>
          <div className="avf-card-title">Recent walk-ins</div>
          <div className="avf-chips">
            {recentWalkIns.map((r) => (
              <button
                key={r.id}
                type="button"
                className="avf-chip"
                onClick={() => {
                  setName(r.name || "");
                  setPhone(String(r.phone || "").replace(/\D/g, "").slice(-10));
                  setFlat(r.flat && r.flat !== "—" ? r.flat : "");
                  if (r.purpose) setPurpose(r.purpose);
                }}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="avf-form-grid">
        {/* Photo — optional */}
        <div className="avf-card avf-card--photo">
          <div className="avf-card-title">
            Visitor photo
            <span className="avf-optional-tag">optional</span>
          </div>
          <div className="avf-photo-zone">
            <div
              className="avf-photo-circle"
              onClick={
                !camActive && !photoSrc && !camLoading ? openCameraPicker : undefined
              }
            >
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  display: camActive ? "block" : "none",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
              {photoSrc && !camActive && (
                <img
                  src={photoSrc}
                  alt="visitor"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              )}
              {!camActive && !photoSrc && (
                <>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--vp-tx3)"
                    strokeWidth="1.5"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span className="avf-photo-hint-text">
                    {camLoading ? "…" : "Tap"}
                  </span>
                </>
              )}
            </div>

            <div className="avf-photo-actions">
              {camActive && activeCameraLabel ? (
                <p className="avf-cam-using">
                  Using: <strong>{activeCameraLabel}</strong>
                </p>
              ) : null}
              <div className="avf-photo-btns">
                {!camActive && !photoSrc && (
                  <>
                    <button
                      type="button"
                      className="avf-btn-sm"
                      onClick={openCameraPicker}
                      disabled={camLoading}
                    >
                      <CamIcon /> {camLoading ? "Opening…" : "Take Photo"}
                    </button>
                    <button
                      type="button"
                      className="avf-btn-sm"
                      onClick={() => fileRef.current.click()}
                      disabled={camLoading}
                    >
                      <UploadIcon /> Upload
                    </button>
                  </>
                )}
                {camActive && (
                  <button
                    type="button"
                    className="avf-btn-sm avf-btn-capture"
                    onClick={capturePhoto}
                  >
                    <CircleIcon /> Capture now
                  </button>
                )}
                {(photoSrc || camActive) && (
                  <button type="button" className="avf-btn-sm" onClick={retakePhoto}>
                    <RetakeIcon /> Retake
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>

        {/* Personal details */}
        <div className="avf-card avf-card--personal">
          <div className="avf-card-title">Personal details</div>
          <div className="avf-grid-2">
            <div className="avf-field">
              <label>
                Full name <span className="avf-req">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amit Sharma"
              />
            </div>
            <div className="avf-field">
              <label>
                Phone <span className="avf-req">*</span>
              </label>
              <div className="avf-phone-wrap">
                <div className="avf-phone-cc">🇮🇳 +91</div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visit details */}
        <div className="avf-card avf-card--visit">
          <div className="avf-card-title">Visit details</div>
          <div className="avf-field">
            <label>
              Purpose <span className="avf-req">*</span>
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="avf-grid-2">
            <div className="avf-field">
              <label>
                Visiting flat <span className="avf-req">*</span>
              </label>
              <input
                type="text"
                value={flat}
                onChange={(e) => setFlat(e.target.value)}
                placeholder="e.g. B-102"
              />
            </div>
            <div className="avf-field">
              <label>No. of persons</label>
              <div className="avf-count-row">
                <button
                  type="button"
                  className="avf-cnt-btn"
                  onClick={() => setPersons((p) => Math.max(1, p - 1))}
                >
                  −
                </button>
                <div className="avf-cnt-val">{persons}</div>
                <button
                  type="button"
                  className="avf-cnt-btn"
                  onClick={() => setPersons((p) => Math.min(20, p + 1))}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle — optional */}
        <div className="avf-card avf-card--vehicle">
          <div className="avf-card-title">
            Vehicle <span className="avf-optional-tag">optional</span>
          </div>
          <div className="avf-grid-2">
            <div className="avf-field">
              <label>Vehicle number</label>
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value.toUpperCase())}
                placeholder="MH 01 AB 1234"
                style={{
                  fontFamily: "var(--vp-mono)",
                  letterSpacing: "0.05em",
                }}
              />
            </div>
            <div className="avf-field">
              <label>Vehicle type</label>
              <select value={vtype} onChange={(e) => setVtype(e.target.value)}>
                <option value="">Select</option>
                <option>2-wheeler</option>
                <option>4-wheeler</option>
                <option>Auto / Rickshaw</option>
                <option>Truck / Van</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="avf-card avf-card--notify">
          <div className="avf-card-title">Notifications</div>
          <div className="avf-toggle-row">
            <div className="avf-tr-left">
              <div className="avf-tr-icon avf-tr-icon--indigo">
                <PhoneIcon />
              </div>
              <div>
                <div className="avf-tr-title">Notify resident</div>
                <div className="avf-tr-sub">
                  Send approval request to flat owner
                </div>
              </div>
            </div>
            <div
              className={`avf-toggle${notify ? " avf-toggle--on" : ""}`}
              onClick={() => setNotify((v) => !v)}
            >
              <div className="avf-toggle-thumb" />
            </div>
          </div>
          <div className="avf-toggle-row">
            <div className="avf-tr-left">
              <div className="avf-tr-icon avf-tr-icon--amber">
                <ShieldIcon />
              </div>
              <div>
                <div className="avf-tr-title">Pre-approved</div>
                <div className="avf-tr-sub">
                  Allow entry without resident approval
                </div>
              </div>
            </div>
            <div
              className={`avf-toggle${preapprove ? " avf-toggle--on" : ""}`}
              onClick={() => setPreapprove((v) => !v)}
            >
              <div className="avf-toggle-thumb" />
            </div>
          </div>
        </div>

        {/* Remarks — optional */}
        <div className="avf-card avf-card--remarks">
          <div className="avf-card-title">
            Remarks <span className="avf-optional-tag">optional</span>
          </div>
          <div className="avf-field">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any special instructions or notes…"
              rows={3}
            />
          </div>
        </div>

        <button
          type="button"
          className="avf-submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          <SendIcon />
          {submitting ? "Adding…" : "Add & Notify Resident"}
        </button>
      </div>

      {camModalOpen ? (
        <div
          className="avf-cam-backdrop"
          role="presentation"
          onClick={closeCameraPicker}
        >
          <div
            className="avf-cam-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="avf-cam-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {camModalView === "choice" ? (
              <>
                <h3 id="avf-cam-modal-title" className="avf-cam-modal-title">
                  Choose camera
                </h3>
                <p className="avf-cam-modal-sub">
                  Select how you want to take the visitor photo.
                </p>
                <div className="avf-cam-choice-grid">
                  <button
                    type="button"
                    className="avf-cam-choice"
                    onClick={handlePhoneCameraChoice}
                    disabled={enumerating || camLoading}
                  >
                    <span className="avf-cam-choice-emoji" aria-hidden>
                      📱
                    </span>
                    <span className="avf-cam-choice-label">
                      Connected Phone Camera
                    </span>
                    <span className="avf-cam-choice-hint">
                      Uses phone if Windows exposes it as a camera
                    </span>
                  </button>
                  <button
                    type="button"
                    className="avf-cam-choice"
                    onClick={handleBrowserCameraChoice}
                    disabled={enumerating || camLoading}
                  >
                    <span className="avf-cam-choice-emoji" aria-hidden>
                      💻
                    </span>
                    <span className="avf-cam-choice-label">Browser Camera</span>
                    <span className="avf-cam-choice-hint">
                      Laptop / USB webcam in this browser
                    </span>
                  </button>
                </div>
                {(enumerating || camLoading) && (
                  <p className="avf-cam-modal-status">Checking cameras…</p>
                )}
                <button
                  type="button"
                  className="avf-btn-sm avf-cam-cancel"
                  onClick={closeCameraPicker}
                  disabled={enumerating || camLoading}
                >
                  Cancel
                </button>
              </>
            ) : null}

            {camModalView === "phone-missing" ? (
              <>
                <h3 id="avf-cam-modal-title" className="avf-cam-modal-title">
                  Phone Camera Not Available
                </h3>
                <p className="avf-cam-modal-sub">
                  Please connect your phone to this computer and make sure it is
                  available as a camera.
                </p>
                <div className="avf-cam-modal-actions">
                  <button
                    type="button"
                    className="avf-btn-sm"
                    onClick={retryPhoneCameraDetect}
                    disabled={enumerating || camLoading}
                  >
                    {enumerating ? "Checking…" : "Try Again"}
                  </button>
                  <button
                    type="button"
                    className="avf-btn-sm avf-btn-capture"
                    onClick={handleBrowserCameraChoice}
                    disabled={enumerating || camLoading}
                  >
                    Use Browser Camera
                  </button>
                </div>
              </>
            ) : null}

            {camModalView === "pick-phone" || camModalView === "pick-browser" ? (
              <>
                <h3 id="avf-cam-modal-title" className="avf-cam-modal-title">
                  {camModalView === "pick-phone"
                    ? "Select phone camera"
                    : "Select browser camera"}
                </h3>
                <p className="avf-cam-modal-sub">
                  Multiple cameras found — pick one to continue.
                </p>
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
                <button
                  type="button"
                  className="avf-btn-sm avf-cam-cancel"
                  onClick={() => setCamModalView("choice")}
                  disabled={camLoading}
                >
                  Back
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Icons ── */
const icon = (d) => () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    {d}
  </svg>
);
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
const CircleIcon = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
const RetakeIcon = icon(
  <>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-4" />
  </>,
);
const SendIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22 11 13 2 9l20-7z" />
  </svg>
);
const PhoneIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.9 1.17h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const ShieldIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// // client/src/components/guard/AddVisitorForm.jsx

// import { useState, useRef } from "react";

// const PURPOSES = [
//   "Guest",
//   "Work / Service",
//   "Delivery",
//   "Cab",
//   "Medical",
//   "Other",
// ];
// const AVATAR_COLORS = [
//   "#5b52f0",
//   "#20c997",
//   "#f5a623",
//   "#f05353",
//   "#a855f7",
//   "#3b82f6",
// ];

// function avColor(name) {
//   return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
// }
// function initials(name) {
//   const p = name.trim().split(" ");
//   return p.length >= 2 ? p[0][0] + p[p.length - 1][0] : p[0].substring(0, 2);
// }

// export default function AddVisitorForm({ onSubmit, showToast }) {
//   const [name, setName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [flat, setFlat] = useState("");
//   const [purpose, setPurpose] = useState("Guest");
//   const [persons, setPersons] = useState(1);
//   const [vehicle, setVehicle] = useState("");
//   const [vtype, setVtype] = useState("");
//   const [note, setNote] = useState("");
//   const [notify, setNotify] = useState(true);
//   const [preapprove, setPreapprove] = useState(false);

//   /* photo */
//   const [photoSrc, setPhotoSrc] = useState(null);
//   const [camActive, setCamActive] = useState(false);
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const fileRef = useRef(null);
//   const streamRef = useRef(null);

//   async function startCamera() {
//     if (photoSrc) return;
//     try {
//       const s = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: "user" },
//         audio: false,
//       });
//       streamRef.current = s;
//       videoRef.current.srcObject = s;
//       setCamActive(true);
//     } catch {
//       showToast("error", "Camera denied", "Use the upload option instead.");
//     }
//   }

//   function capturePhoto() {
//     const v = videoRef.current,
//       c = canvasRef.current;
//     c.width = v.videoWidth;
//     c.height = v.videoHeight;
//     c.getContext("2d").drawImage(v, 0, 0);
//     setPhotoSrc(c.toDataURL("image/jpeg", 0.88));
//     setCamActive(false);
//     if (streamRef.current)
//       streamRef.current.getTracks().forEach((t) => t.stop());
//   }

//   function retakePhoto() {
//     setPhotoSrc(null);
//     setCamActive(false);
//     if (streamRef.current)
//       streamRef.current.getTracks().forEach((t) => t.stop());
//   }

//   function handleFileUpload(e) {
//     const file = e.target.files[0];
//     if (!file) return;
//     setPhotoSrc(URL.createObjectURL(file));
//     setCamActive(false);
//   }

//   function handleSubmit() {
//     if (!name.trim() || !phone.trim() || !flat.trim()) {
//       showToast(
//         "error",
//         "Missing fields",
//         "Name, phone and flat are required.",
//       );
//       return;
//     }
//     const entry = {
//       id: Date.now(),
//       name: name.trim(),
//       phone: phone.trim(),
//       flat: flat.trim(),
//       purpose,
//       persons,
//       time: new Date().toLocaleTimeString("en-IN", {
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//       }),
//       wait: "0m",
//       vehicle,
//     };
//     onSubmit(entry);
//     /* reset */
//     setName("");
//     setPhone("");
//     setFlat("");
//     setVehicle("");
//     setVtype("");
//     setNote("");
//     setPersons(1);
//     setPurpose("Guest");
//     retakePhoto();
//   }

//   const prevInitials = name ? initials(name).toUpperCase() : "?";
//   const prevColor = name ? avColor(name) : "var(--vp-s4)";

//   return (
//     <div className="avf-root">
//       {/* ─── FORM COLUMN ─── */}
//       <div className="avf-form-col">
//         {/* Photo — optional */}
//         <div className="avf-card">
//           <div className="avf-card-title">
//             Visitor photo
//             <span className="avf-optional-tag">optional</span>
//           </div>
//           <div className="avf-photo-zone">
//             <div
//               className="avf-photo-circle"
//               onClick={!camActive && !photoSrc ? startCamera : undefined}
//             >
//               <canvas ref={canvasRef} style={{ display: "none" }} />
//               <video
//                 ref={videoRef}
//                 autoPlay
//                 playsInline
//                 muted
//                 style={{
//                   display: camActive ? "block" : "none",
//                   width: "100%",
//                   height: "100%",
//                   objectFit: "cover",
//                   borderRadius: "50%",
//                 }}
//               />
//               {photoSrc && !camActive && (
//                 <img
//                   src={photoSrc}
//                   alt="visitor"
//                   style={{
//                     width: "100%",
//                     height: "100%",
//                     objectFit: "cover",
//                     borderRadius: "50%",
//                   }}
//                 />
//               )}
//               {!camActive && !photoSrc && (
//                 <>
//                   <svg
//                     width="22"
//                     height="22"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="var(--vp-tx3)"
//                     strokeWidth="1.5"
//                   >
//                     <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
//                     <circle cx="12" cy="13" r="4" />
//                   </svg>
//                   <span className="avf-photo-hint-text">Tap to open</span>
//                 </>
//               )}
//             </div>

//             <div className="avf-photo-actions">
//               <p className="avf-photo-note">
//                 {photoSrc
//                   ? "Photo set — retake if needed."
//                   : "Photo is optional. You can still add the visitor without it."}
//               </p>
//               <div className="avf-photo-btns">
//                 {!camActive && !photoSrc && (
//                   <>
//                     <button className="avf-btn-sm" onClick={startCamera}>
//                       <CamIcon /> Camera
//                     </button>
//                     <button
//                       className="avf-btn-sm"
//                       onClick={() => fileRef.current.click()}
//                     >
//                       <UploadIcon /> Upload
//                     </button>
//                   </>
//                 )}
//                 {camActive && (
//                   <button
//                     className="avf-btn-sm avf-btn-capture"
//                     onClick={capturePhoto}
//                   >
//                     <CircleIcon /> Capture now
//                   </button>
//                 )}
//                 {(photoSrc || camActive) && (
//                   <button className="avf-btn-sm" onClick={retakePhoto}>
//                     <RetakeIcon /> Retake
//                   </button>
//                 )}
//               </div>
//               <input
//                 ref={fileRef}
//                 type="file"
//                 accept="image/*"
//                 style={{ display: "none" }}
//                 onChange={handleFileUpload}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Personal details */}
//         <div className="avf-card">
//           <div className="avf-card-title">Personal details</div>
//           <div className="avf-grid-2">
//             <div className="avf-field">
//               <label>
//                 Full name <span className="avf-req">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 placeholder="e.g. Amit Sharma"
//               />
//             </div>
//             <div className="avf-field">
//               <label>
//                 Phone <span className="avf-req">*</span>
//               </label>
//               <div className="avf-phone-wrap">
//                 <div className="avf-phone-cc">🇮🇳 +91</div>
//                 <input
//                   type="tel"
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value)}
//                   placeholder="98765 43210"
//                   maxLength={10}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Visit details */}
//         <div className="avf-card">
//           <div className="avf-card-title">Visit details</div>

//           <div className="avf-field" style={{ marginBottom: 12 }}>
//             <label>
//               Purpose <span className="avf-req">*</span>
//             </label>
//             <div className="avf-chips">
//               {PURPOSES.map((p) => (
//                 <div
//                   key={p}
//                   className={`avf-chip${purpose === p ? " avf-chip--sel" : ""}`}
//                   onClick={() => setPurpose(p)}
//                 >
//                   {p}
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="avf-grid-2">
//             <div className="avf-field">
//               <label>
//                 Visiting flat <span className="avf-req">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={flat}
//                 onChange={(e) => setFlat(e.target.value)}
//                 placeholder="e.g. B-102"
//               />
//             </div>
//             <div className="avf-field">
//               <label>No. of persons</label>
//               <div className="avf-count-row">
//                 <button
//                   className="avf-cnt-btn"
//                   onClick={() => setPersons((p) => Math.max(1, p - 1))}
//                 >
//                   −
//                 </button>
//                 <div className="avf-cnt-val">{persons}</div>
//                 <button
//                   className="avf-cnt-btn"
//                   onClick={() => setPersons((p) => Math.min(20, p + 1))}
//                 >
//                   +
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Vehicle */}
//         <div className="avf-card">
//           <div className="avf-card-title">
//             Vehicle
//             <span className="avf-optional-tag">optional</span>
//           </div>
//           <div className="avf-grid-2">
//             <div className="avf-field">
//               <label>Vehicle number</label>
//               <input
//                 type="text"
//                 value={vehicle}
//                 onChange={(e) => setVehicle(e.target.value.toUpperCase())}
//                 placeholder="MH 01 AB 1234"
//                 style={{
//                   fontFamily: "var(--vp-mono)",
//                   letterSpacing: "0.05em",
//                 }}
//               />
//             </div>
//             <div className="avf-field">
//               <label>Vehicle type</label>
//               <select value={vtype} onChange={(e) => setVtype(e.target.value)}>
//                 <option value="">Select</option>
//                 <option>2-wheeler</option>
//                 <option>4-wheeler</option>
//                 <option>Auto / Rickshaw</option>
//                 <option>Truck / Van</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Notifications */}
//         <div className="avf-card">
//           <div className="avf-card-title">Notifications</div>
//           <div className="avf-toggle-row">
//             <div className="avf-tr-left">
//               <div className="avf-tr-icon avf-tr-icon--indigo">
//                 <PhoneIcon />
//               </div>
//               <div>
//                 <div className="avf-tr-title">Notify resident</div>
//                 <div className="avf-tr-sub">
//                   Send approval request to flat owner
//                 </div>
//               </div>
//             </div>
//             <div
//               className={`avf-toggle${notify ? " avf-toggle--on" : ""}`}
//               onClick={() => setNotify((v) => !v)}
//             >
//               <div className="avf-toggle-thumb" />
//             </div>
//           </div>
//           <div className="avf-toggle-row" style={{ marginTop: 8 }}>
//             <div className="avf-tr-left">
//               <div className="avf-tr-icon avf-tr-icon--amber">
//                 <ShieldIcon />
//               </div>
//               <div>
//                 <div className="avf-tr-title">Pre-approved</div>
//                 <div className="avf-tr-sub">
//                   Allow entry without resident approval
//                 </div>
//               </div>
//             </div>
//             <div
//               className={`avf-toggle${preapprove ? " avf-toggle--on" : ""}`}
//               onClick={() => setPreapprove((v) => !v)}
//             >
//               <div className="avf-toggle-thumb" />
//             </div>
//           </div>
//         </div>

//         {/* Remarks */}
//         <div className="avf-card">
//           <div className="avf-card-title">
//             Remarks
//             <span className="avf-optional-tag">optional</span>
//           </div>
//           <div className="avf-field">
//             <textarea
//               value={note}
//               onChange={(e) => setNote(e.target.value)}
//               placeholder="Any special instructions or notes…"
//             />
//           </div>
//         </div>

//         <button className="avf-submit-btn" onClick={handleSubmit}>
//           <SendIcon />
//           Add &amp; Notify Resident
//         </button>
//       </div>

//       {/* ─── QUICK-FILL COLUMN ─── */}
//       <div className="avf-side-col">
//         {/* Mini preview card */}
//         <div className="avf-card avf-preview-card">
//           <div className="avf-card-title">Preview</div>
//           <div className="avf-prev-visitor">
//             <div
//               className="avf-prev-av"
//               style={{
//                 background: `${prevColor}22`,
//                 color: prevColor,
//                 borderColor: `${prevColor}55`,
//               }}
//             >
//               {prevInitials}
//             </div>
//             <div className="avf-prev-info">
//               <div className="avf-prev-name">{name || "Visitor name"}</div>
//               <div className="avf-prev-meta">
//                 {purpose} · Flat {flat || "—"} · {persons} person
//                 {persons > 1 ? "s" : ""}
//               </div>
//             </div>
//             <span className="avf-badge avf-badge--pending">Pending</span>
//           </div>
//           <div className="avf-sum-rows">
//             {[
//               ["Phone", phone ? `+91 ${phone}` : "—"],
//               ["Flat", flat || "—"],
//               ["Persons", String(persons)],
//               ["Guard", "Rajesh Kumar"], // TODO: replace with guard.name from useAuth()
//             ].map(([k, v]) => (
//               <div className="avf-sum-row" key={k}>
//                 <span className="avf-sum-key">{k}</span>
//                 <span className="avf-sum-val">{v}</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Recent visitors quick fill */}
//         <div className="avf-card">
//           <div className="avf-card-title">Recent visitors</div>
//           <div className="avf-qf-list">
//             {[
//               {
//                 name: "Amit Sharma",
//                 phone: "9876543210",
//                 flat: "B-102",
//                 purpose: "Guest",
//               },
//               {
//                 name: "Pooja Patel",
//                 phone: "8765432109",
//                 flat: "C-304",
//                 purpose: "Guest",
//               },
//               {
//                 name: "Suresh Nair",
//                 phone: "7654321098",
//                 flat: "A-205",
//                 purpose: "Work",
//               },
//               {
//                 name: "Meera Das",
//                 phone: "6654321987",
//                 flat: "F-101",
//                 purpose: "Guest",
//               },
//             ].map((r) => (
//               <div
//                 key={r.phone}
//                 className="avf-qf-item"
//                 onClick={() => {
//                   setName(r.name);
//                   setPhone(r.phone);
//                   setFlat(r.flat);
//                   setPurpose(r.purpose);
//                 }}
//               >
//                 <div
//                   className="avf-qf-av"
//                   style={{
//                     background: `${avColor(r.name)}22`,
//                     color: avColor(r.name),
//                     borderColor: `${avColor(r.name)}44`,
//                   }}
//                 >
//                   {initials(r.name)}
//                 </div>
//                 <div className="avf-qf-info">
//                   <div className="avf-qf-name">{r.name}</div>
//                   <div className="avf-qf-meta">{r.purpose}</div>
//                 </div>
//                 <div className="avf-qf-flat">{r.flat}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ── Icons ── */
// const icon = (d) => (p) => (
//   <svg
//     width="13"
//     height="13"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     {...p}
//   >
//     {d}
//   </svg>
// );
// const CamIcon = icon(
//   <>
//     <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
//     <circle cx="12" cy="13" r="4" />
//   </>,
// );
// const UploadIcon = icon(
//   <>
//     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
//     <polyline points="17 8 12 3 7 8" />
//     <line x1="12" y1="3" x2="12" y2="15" />
//   </>,
// );
// const CircleIcon = icon(
//   <>
//     <circle cx="12" cy="12" r="10" />
//     <circle cx="12" cy="12" r="3" />
//   </>,
// );
// const RetakeIcon = icon(
//   <>
//     <polyline points="1 4 1 10 7 10" />
//     <path d="M3.51 15a9 9 0 1 0 .49-4" />
//   </>,
// );
// const SendIcon = () => (
//   <svg
//     width="15"
//     height="15"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path d="M22 2L11 13" />
//     <path d="M22 2L15 22 11 13 2 9l20-7z" />
//   </svg>
// );
// const PhoneIcon = () => (
//   <svg
//     width="14"
//     height="14"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.9 1.17h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
//   </svg>
// );
// const ShieldIcon = () => (
//   <svg
//     width="14"
//     height="14"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
//   </svg>
// );
