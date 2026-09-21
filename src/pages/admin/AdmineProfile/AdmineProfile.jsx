//AdmineProfile.jsx 

import React, { useState, useEffect } from "react";
import {
  Mail, Phone, MapPin, Calendar, User, Droplet, Home, Building2, Hospital,
  Shield, Briefcase, BadgeCheck, Clock, LogOut, KeyRound, Camera,
  Pencil, AlertCircle, ChevronRight, Lock, Eye, EyeOff, Check, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, updateProfile, changePassword } from "@/services/admin.service";
import "@/pages/admin/AdmineProfile/AdmineProfile.css";

/* ─── Avatar ─────────────────────────────────────────────── */
const Avatar = ({ name = "", size = 96 }) => {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="ap-avatar-fallback"
      style={{ width: size, height: size, background: `hsl(${hue},60%,48%)`, fontSize: size * 0.35 }}
    >
      {initials || "?"}
    </div>
  );
};

const Badge = ({ type, children }) => (
  <span className={`ap-badge ap-badge-${type}`}>{children}</span>
);

/* ─── Editable field ─────────────────────────────────────── */
const EditField = ({ icon: Icon, label, value, editing, name, onChange, type = "text", options }) => {
  if (editing) {
    if (options) {
      return (
        <div className="ap-field">
          <div className="ap-field-icon"><Icon size={16} /></div>
          <div className="ap-field-text">
            <span className="ap-field-label">{label}</span>
            <select className="ap-input" name={name} value={value || ""} onChange={onChange}>
              <option value="">Select…</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      );
    }
    return (
      <div className="ap-field">
        <div className="ap-field-icon"><Icon size={16} /></div>
        <div className="ap-field-text">
          <span className="ap-field-label">{label}</span>
          <input className="ap-input" type={type} name={name} value={value || ""} onChange={onChange} />
        </div>
      </div>
    );
  }
  return (
    <div className="ap-field">
      <div className="ap-field-icon"><Icon size={16} /></div>
      <div className="ap-field-text">
        <span className="ap-field-label">{label}</span>
        <span className="ap-field-value">{value || <em className="ap-empty">Not set</em>}</span>
      </div>
    </div>
  );
};

/* ─── Section card ───────────────────────────────────────── */
const Section = ({ title, icon: Icon, children, sectionKey, editingSection, onEdit, onSave, onCancel, saving }) => {
  const isEditing = editingSection === sectionKey;
  return (
    <section className="ap-card">
      <header className="ap-card-head">
        <div className="ap-card-title"><Icon size={17} /><h3>{title}</h3></div>
        <div className="ap-card-actions">
          {isEditing ? (
            <>
              <button className="ap-btn ap-btn-save" onClick={() => onSave(sectionKey)} disabled={saving}>
                <Check size={13} /> {saving ? "Saving…" : "Save"}
              </button>
              <button className="ap-btn ap-btn-ghost" onClick={onCancel} disabled={saving}>
                <X size={13} /> Cancel
              </button>
            </>
          ) : (
            <button className="ap-btn ap-btn-ghost" onClick={() => onEdit(sectionKey)}>
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>
      </header>
      <div className="ap-card-body">{children}</div>
    </section>
  );
};

/* ─── Change Password Modal ──────────────────────────────── */
const PasswordModal = ({ onClose, onSubmit, saving }) => {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [err,  setErr]  = useState("");

  const toggle = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = () => {
    if (!form.current || !form.next || !form.confirm) return setErr("All fields are required.");
    if (form.next.length < 8) return setErr("New password must be at least 8 characters.");
    if (form.next !== form.confirm) return setErr("Passwords do not match.");
    setErr("");
    onSubmit(form.current, form.next); // ← matches changePassword(currentPassword, newPassword)
  };

  return (
    <div className="ap-modal-backdrop" onClick={onClose}>
      <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal-head">
          <div className="ap-modal-title"><Lock size={17} /> Change Password</div>
          <button className="ap-icon-btn" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="ap-modal-body">
          {["current", "next", "confirm"].map((k) => (
            <div className="ap-pw-field" key={k}>
              <label>
                {k === "current" ? "Current Password" : k === "next" ? "New Password" : "Confirm New Password"}
              </label>
              <div className="ap-pw-wrap">
                <input
                  className="ap-input"
                  type={show[k] ? "text" : "password"}
                  name={k}
                  value={form[k]}
                  onChange={change}
                  placeholder="••••••••"
                />
                <button className="ap-pw-eye" type="button" onClick={() => toggle(k)}>
                  {show[k] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          {err && <p className="ap-error"><AlertCircle size={13} /> {err}</p>}
        </div>
        <div className="ap-modal-foot">
          <button className="ap-btn ap-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="ap-btn ap-btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Updating…" : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   SECTION → FIELDS MAP
   Only the fields belonging to that section are sent to DB.
   This prevents one section's edit accidentally overwriting another.
═══════════════════════════════════════════════════════════ */
const SECTION_FIELDS = {
  personal: ["dob", "gender", "bloodGroup"],
  society:  ["flatNo", "wing", "building"],
  admin:    ["designation", "officeContact", "officeAddress"],
  address:  ["address", "emergencyName", "emergencyPhone"],
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function AdminProfile() {
  const { user: authUser, logout } = useAuth();

  // ── Read-only fields from registration / auth context ────
  const registeredName  = authUser?.name  || "Admin User";
  const registeredEmail = authUser?.email || "—";
  const registeredPhone = authUser?.phone || "—";
  const registeredRole  = authUser?.role  || "admin";
  const joinedDate      = authUser?.createdAt
    ? new Date(authUser.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  const EMPTY = {
    dob: "", gender: "", bloodGroup: "",
    flatNo: "", wing: "", building: "",
    designation: "", officeContact: "", officeAddress: "",
    address: "", emergencyName: "", emergencyPhone: "",
  };

  const [profile,        setProfile]  = useState(EMPTY);
  const [draft,          setDraft]    = useState(EMPTY);
  const [editingSection, setEditing]  = useState(null);
  const [saving,         setSaving]   = useState(false);
  const [showPwModal,    setPwModal]  = useState(false);
  const [pwSaving,       setPwSaving] = useState(false);
  const [toast,          setToast]    = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Map DB user object → local flat state ─────────────── */
  const mapUser = (u) => ({
    dob:            u.dob ? new Date(u.dob).toISOString().split("T")[0] : "",
    gender:         u.gender         || "",
    bloodGroup:     u.bloodGroup     || "",
    flatNo:         u.flatNo         || "",
    wing:           u.wing           || "",
    building:       u.building       || "",
    designation:    u.designation    || "",
    officeContact:  u.officeContact  || "",
    officeAddress:  u.officeAddress  || "",
    address:        u.address        || "",
    emergencyName:  u.emergencyName  || "",
    emergencyPhone: u.emergencyPhone || "",
  });

  /* ── Load profile from DB on mount ─────────────────────── */
  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        // Your existing admin.service: api.get('/admin/profile')
        // Backend responds: { status, data: { user } }
        const mapped = mapUser(data.data.user);
        setProfile(mapped);
        setDraft(mapped);
      })
      .catch(() => {}); // silently keep EMPTY state if fetch fails
  }, []);

  /* ── Edit helpers ───────────────────────────────────────── */
  const handleEdit = (section) => {
    setDraft({ ...profile }); // always reset draft to last saved values
    setEditing(section);
  };

  const handleCancel = () => {
    setDraft({ ...profile }); // discard unsaved changes
    setEditing(null);
  };

  const handleChange = (e) =>
    setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));

  /* ── Save only this section's fields to DB ──────────────── */
  const handleSave = async (sectionKey) => {
    setSaving(true);
    try {
      // Build payload with only this section's fields
      const fields = SECTION_FIELDS[sectionKey] || [];
      const payload = Object.fromEntries(
        fields.map((k) => [k, draft[k] || null])
      );

      // Your existing admin.service: api.patch('/admin/profile', fields)
      const { data } = await updateProfile(payload);

      // Update state from DB response
      const updated = mapUser(data.data.user);
      setProfile(updated);
      setDraft(updated);
      setEditing(null);
      showToast("Profile updated successfully.");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Change password ────────────────────────────────────── */
  const handlePasswordSubmit = async (currentPw, newPw) => {
    setPwSaving(true);
    try {
      // Your existing admin.service: api.patch('/admin/change-password', { currentPassword, newPassword })
      await changePassword(currentPw, newPw);
      setPwModal(false);
      showToast("Password changed successfully.");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to change password.", "error");
    } finally {
      setPwSaving(false);
    }
  };

  /* ── Profile completion % ───────────────────────────────── */
  const allFields = [
    registeredName, registeredEmail, registeredPhone,
    profile.dob, profile.gender, profile.bloodGroup,
    profile.flatNo, profile.wing, profile.building, profile.address,
  ];
  const completion = Math.round((allFields.filter(Boolean).length / allFields.length) * 100);

  /* ── Render helpers ─────────────────────────────────────── */
  const isEditing = (s) => editingSection === s;
  // When section is open → show draft; otherwise show saved profile
  const val = (key, section) => isEditing(section) ? draft[key] : profile[key];

  /* ═══════════════════════════════════════════════════════ */
  return (
    <div className="ap-root">

      {/* Toast notification */}
      {toast && (
        <div className={`ap-toast ap-toast-${toast.type}`}>
          {toast.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Password Modal */}
      {showPwModal && (
        <PasswordModal
          onClose={() => setPwModal(false)}
          onSubmit={handlePasswordSubmit}
          saving={pwSaving}
        />
      )}

      <div className="ap-container">

        {/* ── HEADER CARD ── */}
        <div className="ap-header ap-card">
          <div className="ap-header-left">
            <div className="ap-avatar-wrap">
              <Avatar name={registeredName} size={88} />
              <button className="ap-avatar-btn" title="Upload photo (coming soon)">
                <Camera size={13} />
              </button>
            </div>
            <div className="ap-header-info">
              <h1>{registeredName}</h1>
              <p className="ap-role-line">
                <span className="ap-role-chip">{registeredRole}</span>
                {profile.designation && <><ChevronRight size={13} />{profile.designation}</>}
              </p>
              <div className="ap-badges">
                <Badge type="success"><span className="ap-dot" /> Active</Badge>
                {authUser?.isVerified && <Badge type="info"><BadgeCheck size={11} /> Verified</Badge>}
                <Badge type="muted"><Shield size={11} /> Super Admin</Badge>
              </div>
            </div>
          </div>

          <div className="ap-header-right">
            <div className="ap-progress">
              <div className="ap-progress-head">
                <span>Profile Completion</span>
                <strong>{completion}%</strong>
              </div>
              <div className="ap-progress-track">
                <div className="ap-progress-fill" style={{ width: `${completion}%` }} />
              </div>
              {completion < 100 && (
                <p className="ap-progress-hint">Complete your profile to unlock all features</p>
              )}
            </div>
            <div className="ap-actions">
              <button className="ap-btn ap-btn-outline" onClick={() => setPwModal(true)}>
                <KeyRound size={13} /> Change Password
              </button>
              <button className="ap-btn ap-btn-danger" onClick={logout}>
                <LogOut size={13} /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* ── SECTIONS GRID ── */}
        <div className="ap-grid">

          {/* 1 — Personal Information */}
          <Section
            title="Personal Information" icon={User}
            sectionKey="personal" editingSection={editingSection}
            onEdit={handleEdit} onSave={handleSave} onCancel={handleCancel} saving={saving}
          >
            {/* Read-only: from registration, never editable here */}
            {[
              { icon: User,  label: "Full Name",   value: registeredName  },
              { icon: Mail,  label: "Email",        value: registeredEmail },
              { icon: Phone, label: "Phone Number", value: registeredPhone },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="ap-field ap-field-readonly">
                <div className="ap-field-icon"><Icon size={16} /></div>
                <div className="ap-field-text">
                  <span className="ap-field-label">
                    {label} <span className="ap-locked"><Lock size={10} /> from registration</span>
                  </span>
                  <span className="ap-field-value">{value}</span>
                </div>
              </div>
            ))}

            {/* Editable fields */}
            <EditField icon={Calendar} label="Date of Birth" name="dob" type="date"
              value={val("dob", "personal")} editing={isEditing("personal")} onChange={handleChange} />
            <EditField icon={User} label="Gender" name="gender"
              value={val("gender", "personal")} editing={isEditing("personal")} onChange={handleChange}
              options={["Male", "Female", "Other", "Prefer not to say"]} />
            <EditField icon={Droplet} label="Blood Group" name="bloodGroup"
              value={val("bloodGroup", "personal")} editing={isEditing("personal")} onChange={handleChange}
              options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
          </Section>

          {/* 2 — Society Information */}
          <Section
            title="Society Information" icon={Hospital}
            sectionKey="society" editingSection={editingSection}
            onEdit={handleEdit} onSave={handleSave} onCancel={handleCancel} saving={saving}
          >
            <EditField icon={Home} label="Flat Number" name="flatNo"
              value={val("flatNo", "society")} editing={isEditing("society")} onChange={handleChange} />
            <EditField icon={Building2} label="Wing" name="wing"
              value={val("wing", "society")} editing={isEditing("society")} onChange={handleChange} />
            <EditField icon={Building2} label="Building Name" name="building"
              value={val("building", "society")} editing={isEditing("society")} onChange={handleChange} />
          </Section>

          {/* 3 — Admin Details */}
          <Section
            title="Admin Details" icon={Briefcase}
            sectionKey="admin" editingSection={editingSection}
            onEdit={handleEdit} onSave={handleSave} onCancel={handleCancel} saving={saving}
          >
            <EditField icon={Briefcase} label="Designation" name="designation"
              value={val("designation", "admin")} editing={isEditing("admin")} onChange={handleChange} />
            <EditField icon={Phone} label="Office Contact" name="officeContact"
              value={val("officeContact", "admin")} editing={isEditing("admin")} onChange={handleChange} />
            <EditField icon={MapPin} label="Office Address" name="officeAddress"
              value={val("officeAddress", "admin")} editing={isEditing("admin")} onChange={handleChange} />
          </Section>

          {/* 4 — Address & Emergency */}
          <Section
            title="Address & Emergency" icon={MapPin}
            sectionKey="address" editingSection={editingSection}
            onEdit={handleEdit} onSave={handleSave} onCancel={handleCancel} saving={saving}
          >
            <EditField icon={MapPin} label="Residential Address" name="address"
              value={val("address", "address")} editing={isEditing("address")} onChange={handleChange} />
            <EditField icon={AlertCircle} label="Emergency Contact Name" name="emergencyName"
              value={val("emergencyName", "address")} editing={isEditing("address")} onChange={handleChange} />
            <EditField icon={Phone} label="Emergency Contact Phone" name="emergencyPhone"
              value={val("emergencyPhone", "address")} editing={isEditing("address")} onChange={handleChange} />
          </Section>

          {/* 5 — Account & Security (always read-only) */}
          <section className="ap-card ap-card-full">
            <header className="ap-card-head">
              <div className="ap-card-title"><Shield size={17} /><h3>Account & Security</h3></div>
            </header>
            <div className="ap-card-body ap-security-body">
              <div className="ap-field">
                <div className="ap-field-icon"><Shield size={16} /></div>
                <div className="ap-field-text">
                  <span className="ap-field-label">Role</span>
                  <span className="ap-field-value" style={{ textTransform: "capitalize" }}>{registeredRole}</span>
                </div>
              </div>
              <div className="ap-field">
                <div className="ap-field-icon"><BadgeCheck size={16} /></div>
                <div className="ap-field-text">
                  <span className="ap-field-label">Account Status</span>
                  <Badge type="success"><span className="ap-dot" /> Active</Badge>
                </div>
              </div>
              <div className="ap-field">
                <div className="ap-field-icon"><Mail size={16} /></div>
                <div className="ap-field-text">
                  <span className="ap-field-label">Email Verified</span>
                  {authUser?.isVerified
                    ? <Badge type="info"><BadgeCheck size={11} /> Verified</Badge>
                    : <Badge type="warn"><AlertCircle size={11} /> Pending</Badge>}
                </div>
              </div>
              <div className="ap-field">
                <div className="ap-field-icon"><Calendar size={16} /></div>
                <div className="ap-field-text">
                  <span className="ap-field-label">Joined Date</span>
                  <span className="ap-field-value">{joinedDate}</span>
                </div>
              </div>
              <div className="ap-field">
                <div className="ap-field-icon"><Clock size={16} /></div>
                <div className="ap-field-text">
                  <span className="ap-field-label">Last Login</span>
                  <span className="ap-field-value">Today</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}



// import React, { useState, useEffect } from "react";
// import {
//   Mail, Phone, MapPin, Calendar, User, Droplet, Home, Building2,
//   Shield, Briefcase, BadgeCheck, Clock, LogOut, KeyRound, Camera,
//   Pencil, AlertCircle, ChevronRight, Lock, Eye, EyeOff, Check, X,
// } from "lucide-react";
// import { useAuth } from "@/hooks/useAuth";
// import { getProfile, updateProfile, changePassword } from "@/services/admin.service";
// import "@/pages/admin/AdmineProfile/AdmineProfile.css";

// /* ─── Avatar ─────────────────────────────────────────────── */
// const Avatar = ({ name = "", size = 96 }) => {
//   const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
//   const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
//   return (
//     <div
//       className="ap-avatar-fallback"
//       style={{ width: size, height: size, background: `hsl(${hue},60%,48%)`, fontSize: size * 0.35 }}
//     >
//       {initials || "?"}
//     </div>
//   );
// };

// const Badge = ({ type, children }) => (
//   <span className={`ap-badge ap-badge-${type}`}>{children}</span>
// );

// /* ─── Editable field ─────────────────────────────────────── */
// const EditField = ({ icon: Icon, label, value, editing, name, onChange, type = "text", options }) => {
//   if (editing) {
//     if (options) {
//       return (
//         <div className="ap-field">
//           <div className="ap-field-icon"><Icon size={16} /></div>
//           <div className="ap-field-text">
//             <span className="ap-field-label">{label}</span>
//             <select className="ap-input" name={name} value={value || ""} onChange={onChange}>
//               <option value="">Select…</option>
//               {options.map((o) => <option key={o} value={o}>{o}</option>)}
//             </select>
//           </div>
//         </div>
//       );
//     }
//     return (
//       <div className="ap-field">
//         <div className="ap-field-icon"><Icon size={16} /></div>
//         <div className="ap-field-text">
//           <span className="ap-field-label">{label}</span>
//           <input
//             className="ap-input"
//             type={type}
//             name={name}
//             value={value || ""}
//             onChange={onChange}
//           />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="ap-field">
//       <div className="ap-field-icon"><Icon size={16} /></div>
//       <div className="ap-field-text">
//         <span className="ap-field-label">{label}</span>
//         <span className="ap-field-value">{value || <em className="ap-empty">Not set</em>}</span>
//       </div>
//     </div>
//   );
// };

// /* ─── Section card ───────────────────────────────────────── */
// const Section = ({ title, icon: Icon, children, sectionKey, editingSection, onEdit, onSave, onCancel, saving }) => {
//   const isEditing = editingSection === sectionKey;
//   return (
//     <section className="ap-card">
//       <header className="ap-card-head">
//         <div className="ap-card-title"><Icon size={17} /><h3>{title}</h3></div>
//         <div className="ap-card-actions">
//           {isEditing ? (
//             <>
//               <button className="ap-btn ap-btn-save" onClick={() => onSave(sectionKey)} disabled={saving}>
//                 <Check size={13} /> {saving ? "Saving…" : "Save"}
//               </button>
//               <button className="ap-btn ap-btn-ghost" onClick={onCancel} disabled={saving}>
//                 <X size={13} /> Cancel
//               </button>
//             </>
//           ) : (
//             <button className="ap-btn ap-btn-ghost" onClick={() => onEdit(sectionKey)}>
//               <Pencil size={13} /> Edit
//             </button>
//           )}
//         </div>
//       </header>
//       <div className="ap-card-body">{children}</div>
//     </section>
//   );
// };

// /* ─── Change Password Modal ──────────────────────────────── */
// const PasswordModal = ({ onClose, onSubmit, saving }) => {
//   const [form, setForm] = useState({ current: "", next: "", confirm: "" });
//   const [show, setShow] = useState({ current: false, next: false, confirm: false });
//   const [err, setErr] = useState("");

//   const toggle = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));
//   const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

//   const submit = () => {
//     if (!form.current || !form.next || !form.confirm) return setErr("All fields are required.");
//     if (form.next.length < 8) return setErr("New password must be at least 8 characters.");
//     if (form.next !== form.confirm) return setErr("Passwords do not match.");
//     setErr("");
//     onSubmit(form.current, form.next);
//   };

//   return (
//     <div className="ap-modal-backdrop" onClick={onClose}>
//       <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
//         <div className="ap-modal-head">
//           <div className="ap-modal-title"><Lock size={17} /> Change Password</div>
//           <button className="ap-icon-btn" onClick={onClose}><X size={17} /></button>
//         </div>
//         <div className="ap-modal-body">
//           {["current", "next", "confirm"].map((k) => (
//             <div className="ap-pw-field" key={k}>
//               <label>
//                 {k === "current" ? "Current Password" : k === "next" ? "New Password" : "Confirm New Password"}
//               </label>
//               <div className="ap-pw-wrap">
//                 <input
//                   className="ap-input"
//                   type={show[k] ? "text" : "password"}
//                   name={k}
//                   value={form[k]}
//                   onChange={change}
//                   placeholder="••••••••"
//                 />
//                 <button className="ap-pw-eye" type="button" onClick={() => toggle(k)}>
//                   {show[k] ? <EyeOff size={15} /> : <Eye size={15} />}
//                 </button>
//               </div>
//             </div>
//           ))}
//           {err && <p className="ap-error"><AlertCircle size={13} /> {err}</p>}
//         </div>
//         <div className="ap-modal-foot">
//           <button className="ap-btn ap-btn-ghost" onClick={onClose}>Cancel</button>
//           <button className="ap-btn ap-btn-primary" onClick={submit} disabled={saving}>
//             {saving ? "Updating…" : "Update Password"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// /* ═══════════════════════════════════════════════════════════
//    MAIN COMPONENT
// ═══════════════════════════════════════════════════════════ */
// export default function AdminProfile() {
//   const { user: authUser, logout } = useAuth();

//   const registeredName  = authUser?.name  || "Admin User";
//   const registeredEmail = authUser?.email || "—";
//   const registeredPhone = authUser?.phone || "—";
//   const registeredRole  = authUser?.role  || "admin";
//   const joinedDate      = authUser?.createdAt
//     ? new Date(authUser.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
//     : "—";

//   const EMPTY = {
//     dob: "", gender: "", bloodGroup: "",
//     flatNo: "", wing: "", building: "",
//     designation: "", officeContact: "", officeAddress: "",
//     address: "", emergencyName: "", emergencyPhone: "",
//   };

//   const [profile,        setProfile]  = useState(EMPTY);
//   const [draft,          setDraft]    = useState(EMPTY);
//   const [editingSection, setEditing]  = useState(null);
//   const [saving,         setSaving]   = useState(false);
//   const [showPwModal,    setPwModal]  = useState(false);
//   const [pwSaving,       setPwSaving] = useState(false);
//   const [toast,          setToast]    = useState(null);

//   const showToast = (msg, type = "success") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast(null), 3500);
//   };

//   /* ── Map DB user → local state ─────────────────────────── */
//   const mapUser = (u) => ({
//     dob:            u.dob ? new Date(u.dob).toISOString().split("T")[0] : "",
//     gender:         u.gender         || "",
//     bloodGroup:     u.bloodGroup     || "",
//     flatNo:         u.flatNo         || "",
//     wing:           u.wing           || "",
//     building:       u.building       || "",
//     designation:    u.designation    || "",
//     officeContact:  u.officeContact  || "",
//     officeAddress:  u.officeAddress  || "",
//     address:        u.address        || "",
//     emergencyName:  u.emergencyName  || "",
//     emergencyPhone: u.emergencyPhone || "",
//   });

//   /* ── Load profile on mount ─────────────────────────────── */
//   useEffect(() => {
//     getProfile()
//       .then(({ data }) => {
//         const mapped = mapUser(data.data.user);
//         setProfile(mapped);
//         setDraft(mapped);
//       })
//       .catch(() => {}); // stays as EMPTY if fetch fails
//   }, []);

//   /* ── Edit / Cancel ─────────────────────────────────────── */
//   const handleEdit = (section) => {
//     setDraft({ ...profile }); // always reset draft to last saved state
//     setEditing(section);
//   };

//   const handleCancel = () => {
//     setDraft({ ...profile }); // discard any in-progress changes
//     setEditing(null);
//   };

//   const handleChange = (e) =>
//     setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));

//   /* ── Save section to DB ────────────────────────────────── */
//   // FIX: sectionKey tells us WHICH fields to send — only send that section's fields
//   const SECTION_FIELDS = {
//     personal: ["dob", "gender", "bloodGroup"],
//     society:  ["flatNo", "wing", "building"],
//     admin:    ["designation", "officeContact", "officeAddress"],
//     address:  ["address", "emergencyName", "emergencyPhone"],
//   };

//   const handleSave = async (sectionKey) => {
//     setSaving(true);
//     try {
//       // Only send fields belonging to the section being saved
//       const fields = SECTION_FIELDS[sectionKey] || Object.keys(EMPTY);
//       const payload = Object.fromEntries(
//         fields.map((k) => [k, draft[k] || null])
//       );

//       const { data } = await updateProfile(payload);
//       const updated = mapUser(data.data.user);
//       setProfile(updated);
//       setDraft(updated);
//       setEditing(null);
//       showToast("Profile updated successfully.");
//     } catch (err) {
//       showToast(err?.response?.data?.message || "Failed to update profile.", "error");
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* ── Change password ───────────────────────────────────── */
//   const handlePasswordSubmit = async (currentPw, newPw) => {
//     setPwSaving(true);
//     try {
//       await changePassword(currentPw, newPw);
//       setPwModal(false);
//       showToast("Password changed successfully.");
//     } catch (err) {
//       showToast(err?.response?.data?.message || "Failed to change password.", "error");
//     } finally {
//       setPwSaving(false);
//     }
//   };

//   /* ── Profile completion % ──────────────────────────────── */
//   const allFields = [
//     registeredName, registeredEmail, registeredPhone,
//     profile.dob, profile.gender, profile.bloodGroup,
//     profile.flatNo, profile.wing, profile.building, profile.address,
//   ];
//   const completion = Math.round((allFields.filter(Boolean).length / allFields.length) * 100);

//   /* ── Helpers for rendering ─────────────────────────────── */
//   const isEditing = (s) => editingSection === s;

//   // When a section is open: show draft values; otherwise show saved profile values
//   const val = (key, section) => isEditing(section) ? draft[key] : profile[key];

//   return (
//     <div className="ap-root">

//       {/* Toast notification */}
//       {toast && (
//         <div className={`ap-toast ap-toast-${toast.type}`}>
//           {toast.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
//           {toast.msg}
//         </div>
//       )}

//       {/* Password Modal */}
//       {showPwModal && (
//         <PasswordModal
//           onClose={() => setPwModal(false)}
//           onSubmit={handlePasswordSubmit}
//           saving={pwSaving}
//         />
//       )}

//       <div className="ap-container">

//         {/* ── HEADER CARD ── */}
//         <div className="ap-header ap-card">
//           <div className="ap-header-left">
//             <div className="ap-avatar-wrap">
//               <Avatar name={registeredName} size={88} />
//               <button className="ap-avatar-btn" title="Upload photo (coming soon)">
//                 <Camera size={13} />
//               </button>
//             </div>
//             <div className="ap-header-info">
//               <h1>{registeredName}</h1>
//               <p className="ap-role-line">
//                 <span className="ap-role-chip">{registeredRole}</span>
//                 {profile.designation && <><ChevronRight size={13} />{profile.designation}</>}
//               </p>
//               <div className="ap-badges">
//                 <Badge type="success"><span className="ap-dot" /> Active</Badge>
//                 {authUser?.isVerified && <Badge type="info"><BadgeCheck size={11} /> Verified</Badge>}
//                 <Badge type="muted"><Shield size={11} /> Super Admin</Badge>
//               </div>
//             </div>
//           </div>

//           <div className="ap-header-right">
//             <div className="ap-progress">
//               <div className="ap-progress-head">
//                 <span>Profile Completion</span>
//                 <strong>{completion}%</strong>
//               </div>
//               <div className="ap-progress-track">
//                 <div className="ap-progress-fill" style={{ width: `${completion}%` }} />
//               </div>
//               {completion < 100 && (
//                 <p className="ap-progress-hint">Complete your profile to unlock all features</p>
//               )}
//             </div>
//             <div className="ap-actions">
//               <button className="ap-btn ap-btn-outline" onClick={() => setPwModal(true)}>
//                 <KeyRound size={13} /> Change Password
//               </button>
//               <button className="ap-btn ap-btn-danger" onClick={logout}>
//                 <LogOut size={13} /> Logout
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* ── GRID ── */}
//         <div className="ap-grid">

//           {/* 1 — Personal Information */}
//           <Section
//             title="Personal Information" icon={User}
//             sectionKey="personal" editingSection={editingSection}
//             onEdit={handleEdit} onSave={handleSave} onCancel={handleCancel} saving={saving}
//           >
//             {/* Read-only registered fields */}
//             {[
//               { icon: User,  label: "Full Name",    value: registeredName },
//               { icon: Mail,  label: "Email",         value: registeredEmail },
//               { icon: Phone, label: "Phone Number",  value: registeredPhone },
//             ].map(({ icon: Icon, label, value }) => (
//               <div key={label} className="ap-field ap-field-readonly">
//                 <div className="ap-field-icon"><Icon size={16} /></div>
//                 <div className="ap-field-text">
//                   <span className="ap-field-label">
//                     {label} <span className="ap-locked"><Lock size={10} /> from registration</span>
//                   </span>
//                   <span className="ap-field-value">{value}</span>
//                 </div>
//               </div>
//             ))}

//             {/* Editable fields — pass section so val() picks draft or profile correctly */}
//             <EditField icon={Calendar} label="Date of Birth" name="dob" type="date"
//               value={val("dob", "personal")} editing={isEditing("personal")} onChange={handleChange} />
//             <EditField icon={User} label="Gender" name="gender"
//               value={val("gender", "personal")} editing={isEditing("personal")} onChange={handleChange}
//               options={["Male", "Female", "Other", "Prefer not to say"]} />
//             <EditField icon={Droplet} label="Blood Group" name="bloodGroup"
//               value={val("bloodGroup", "personal")} editing={isEditing("personal")} onChange={handleChange}
//               options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
//           </Section>

//           {/* 2 — Society Information */}
//           <Section
//             title="Society Information" icon={Building2}
//             sectionKey="society" editingSection={editingSection}
//             onEdit={handleEdit} onSave={handleSave} onCancel={handleCancel} saving={saving}
//           >
//             <EditField icon={Home} label="Flat Number" name="flatNo"
//               value={val("flatNo", "society")} editing={isEditing("society")} onChange={handleChange} />
//             <EditField icon={Building2} label="Wing" name="wing"
//               value={val("wing", "society")} editing={isEditing("society")} onChange={handleChange} />
//             <EditField icon={Building2} label="Building Name" name="building"
//               value={val("building", "society")} editing={isEditing("society")} onChange={handleChange} />
//           </Section>

//           {/* 3 — Admin Details */}
//           <Section
//             title="Admin Details" icon={Briefcase}
//             sectionKey="admin" editingSection={editingSection}
//             onEdit={handleEdit} onSave={handleSave} onCancel={handleCancel} saving={saving}
//           >
//             <EditField icon={Briefcase} label="Designation" name="designation"
//               value={val("designation", "admin")} editing={isEditing("admin")} onChange={handleChange} />
//             <EditField icon={Phone} label="Office Contact" name="officeContact"
//               value={val("officeContact", "admin")} editing={isEditing("admin")} onChange={handleChange} />
//             <EditField icon={MapPin} label="Office Address" name="officeAddress"
//               value={val("officeAddress", "admin")} editing={isEditing("admin")} onChange={handleChange} />
//           </Section>

//           {/* 4 — Address & Emergency */}
//           <Section
//             title="Address & Emergency" icon={MapPin}
//             sectionKey="address" editingSection={editingSection}
//             onEdit={handleEdit} onSave={handleSave} onCancel={handleCancel} saving={saving}
//           >
//             <EditField icon={MapPin} label="Residential Address" name="address"
//               value={val("address", "address")} editing={isEditing("address")} onChange={handleChange} />
//             <EditField icon={AlertCircle} label="Emergency Contact Name" name="emergencyName"
//               value={val("emergencyName", "address")} editing={isEditing("address")} onChange={handleChange} />
//             <EditField icon={Phone} label="Emergency Contact Phone" name="emergencyPhone"
//               value={val("emergencyPhone", "address")} editing={isEditing("address")} onChange={handleChange} />
//           </Section>

//           {/* 5 — Account & Security (always read-only) */}
//           <section className="ap-card ap-card-full">
//             <header className="ap-card-head">
//               <div className="ap-card-title"><Shield size={17} /><h3>Account & Security</h3></div>
//             </header>
//             <div className="ap-card-body ap-security-body">
//               <div className="ap-field">
//                 <div className="ap-field-icon"><Shield size={16} /></div>
//                 <div className="ap-field-text">
//                   <span className="ap-field-label">Role</span>
//                   <span className="ap-field-value" style={{ textTransform: "capitalize" }}>{registeredRole}</span>
//                 </div>
//               </div>
//               <div className="ap-field">
//                 <div className="ap-field-icon"><BadgeCheck size={16} /></div>
//                 <div className="ap-field-text">
//                   <span className="ap-field-label">Account Status</span>
//                   <Badge type="success"><span className="ap-dot" /> Active</Badge>
//                 </div>
//               </div>
//               <div className="ap-field">
//                 <div className="ap-field-icon"><Mail size={16} /></div>
//                 <div className="ap-field-text">
//                   <span className="ap-field-label">Email Verified</span>
//                   {authUser?.isVerified
//                     ? <Badge type="info"><BadgeCheck size={11} /> Verified</Badge>
//                     : <Badge type="warn"><AlertCircle size={11} /> Pending</Badge>}
//                 </div>
//               </div>
//               <div className="ap-field">
//                 <div className="ap-field-icon"><Calendar size={16} /></div>
//                 <div className="ap-field-text">
//                   <span className="ap-field-label">Joined Date</span>
//                   <span className="ap-field-value">{joinedDate}</span>
//                 </div>
//               </div>
//               <div className="ap-field">
//                 <div className="ap-field-icon"><Clock size={16} /></div>
//                 <div className="ap-field-text">
//                   <span className="ap-field-label">Last Login</span>
//                   <span className="ap-field-value">Today</span>
//                 </div>
//               </div>
//             </div>
//           </section>

//         </div>
//       </div>
//     </div>
//   );
// }

