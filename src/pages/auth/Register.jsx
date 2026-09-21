import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Eye,
  EyeOff,
  ArrowLeft,
  Lock,
  Mail,
  User,
  Phone,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { authService } from "@/services/auth.service";

const ROLES = [
  {
    value: "admin",
    label: "Admin",
    desc: "Manage the full system",
    color: "from-violet-500 to-indigo-600",
    glow: "rgba(139,92,246,0.4)",
    note: null,
  },
  {
    value: "finance",
    label: "Finance",
    desc: "Track payments & records",
    color: "from-cyan-500 to-blue-600",
    glow: "rgba(56,189,248,0.4)",
    note: null,
  },
  {
    value: "resident",
    label: "Resident",
    desc: "Manage your home",
    color: "from-emerald-500 to-green-600",
    glow: "rgba(52,211,153,0.4)",
    note: null,
  },
  {
    value: "guard",
    label: "Guard",
    desc: "Gate & visitor control",
    color: "from-amber-500 to-orange-500",
    glow: "rgba(251,191,36,0.4)",
    note: null,
  },
];

function FloatingOrb({ size, color, top, left, delay }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        top,
        left,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(50px)",
      }}
      animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 7 + delay, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

const getStrength = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[@$!%*?&_#^()\-+=]/.test(pw)) s++;
  return s;
};
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "bg-red-500", "bg-amber-500", "bg-yellow-400", "bg-emerald-500"];

// FIX: Use a proper email regex — never rely on browser/normalizeEmail
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("panel") || "";
  const defaultRole = ROLES.some((role) => role.value === initialRole) ? initialRole : "";
  const [step, setStep] = useState(defaultRole ? "form" : "role");
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleData = ROLES.find((r) => r.value === selectedRole) || ROLES[0];

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    // FIX: Validate against raw trimmed value — do NOT mutate the email before sending
    if (!EMAIL_REGEX.test(form.email.trim())) e.email = "Valid email required";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Valid 10-digit mobile number";
    if (
      form.password.length < 8 ||
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#^()\-+=])/.test(form.password)
    )
      e.password = "8+ chars, uppercase, lowercase, number & special char";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleChange = (e) => {
    // FIX: Store exactly what the user types — no trimming on change (trim only on submit)
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setFieldErrors((p) => ({ ...p, [e.target.name]: "" }));
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setFieldErrors({});

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      // FIX: Send the email exactly as typed (trimmed only) — no normalizeEmail transformation
      const emailToSend = form.email.trim();

      await authService.register({
        name: form.name.trim(),
        email: emailToSend,
        phone: form.phone,
        password: form.password,
        role: selectedRole,
      });

      setStep("done");
      setTimeout(() => {
        navigate(`/login?panel=${selectedRole}`, { replace: true });
      }, 2000);
    } catch (err) {
      const data = err.response?.data;

      if (data?.errors?.length > 0) {
        const backendFieldErrors = {};
        const generalErrors = [];
        data.errors.forEach((error) => {
          const field = error.param || error.path;
          if (field && field in form) {
            backendFieldErrors[field] = error.msg;
          } else {
            generalErrors.push(error.msg);
          }
        });
        if (Object.keys(backendFieldErrors).length > 0) setFieldErrors(backendFieldErrors);
        if (generalErrors.length > 0) setApiError(generalErrors.join(" · "));
      } else {
        setApiError(data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(form.password);

  // ── Step 1: Role picker ────────────────────────────────────────────────────
  if (step === "role") {
    return (
      <div className="auth-bg relative flex items-center justify-center p-4 overflow-hidden py-16">
        <FloatingOrb size={600} color="rgba(56,189,248,0.10)" top="-10%" left="60%" delay={0} />
        <FloatingOrb size={500} color="rgba(139,92,246,0.08)" top="50%" left="-15%" delay={2} />
        <div className="absolute inset-0 pointer-events-none grid-overlay" />
        <div className="w-full max-w-lg relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <Link to="/" className="auth-back-link flex items-center gap-2 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </motion.div>
          <motion.div
            className="glass-card rounded-3xl overflow-hidden"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-amber-500" />
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-black text-white mb-1">Create Account</h1>
                <p className="text-slate-400 text-sm">Choose your role to get started</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {ROLES.map((role) => (
                  <motion.button
                    key={role.value}
                    type="button"
                    onClick={() => { setSelectedRole(role.value); setStep("form"); }}
                    className="py-4 px-4 rounded-xl text-left glass-card-light border border-white/5 hover:border-white/20 transition-all"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center mb-3`}>
                      <span className="text-white text-sm font-bold">{role.label[0]}</span>
                    </div>
                    <div className="font-semibold text-white text-sm">{role.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{role.desc}</div>
                    {role.note && (
                      <span className="inline-block mt-2 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                        Requires activation
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
              <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-slate-500 text-xs">Choose the panel where you want to create your account.</p>
              </div>
              <p className="text-center text-slate-500 text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-violet-400 hover:text-violet-300">Sign in</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Step 3: Success ────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="auth-bg relative flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-md relative z-10">
          <motion.div
            className="glass-card rounded-3xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={`h-1.5 w-full bg-gradient-to-r ${roleData.color}`} />
            <div className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="mb-6"
              >
                <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-black text-white mb-3">
                Account Created!
              </h2>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Your {roleData.label} account is ready. Redirecting you to login...
              </p>

              <motion.button
                onClick={() => navigate(`/login?panel=${selectedRole}`, { replace: true })}
                className={`w-full py-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r ${roleData.color} shadow-xl`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Go to {roleData.label} Login
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Step 2: Registration form ──────────────────────────────────────────────
  return (
    <div className="auth-bg relative flex items-center justify-center p-4 overflow-hidden py-16">
      <FloatingOrb size={600} color="rgba(56,189,248,0.10)" top="-10%" left="60%" delay={0} />
      <FloatingOrb size={500} color="rgba(139,92,246,0.08)" top="50%" left="-15%" delay={2} />
      <div className="absolute inset-0 pointer-events-none grid-overlay" />

      <div className="w-full max-w-lg relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <button onClick={() => setStep("role")} className="auth-back-link flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Change Role
          </button>
        </motion.div>

        <motion.div
          className="glass-card rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ boxShadow: `0 30px 60px ${roleData.glow}25, 0 0 0 1px rgba(255,255,255,0.05)` }}
        >
          <motion.div className={`h-1.5 w-full bg-gradient-to-r ${roleData.color}`} layout transition={{ duration: 0.4 }} />

          <div className="p-8">
            <div className="text-center mb-8">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roleData.color} flex items-center justify-center mx-auto mb-4 shadow-xl`}
                style={{ boxShadow: `0 0 30px ${roleData.glow}` }}
              >
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white mb-1">Register as {roleData.label}</h1>
              <p className="text-slate-400 text-sm">Create your panel-based account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    name="name"
                    type="text"
                    placeholder="Rahul Sharma"
                    value={form.name}
                    onChange={handleChange}
                    disabled={loading}
                    className={`auth-input pl-11 ${fieldErrors.name ? "border-red-500/50" : ""}`}
                  />
                </div>
                {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    name="email"
                    type="text"
                    autoComplete="email"
                    placeholder="you@society.com"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    className={`auth-input pl-11 ${fieldErrors.email ? "border-red-500/50" : ""}`}
                  />
                  {/* FIX: type="text" instead of type="email" — browser auto-corrects email fields
                      which can silently transform/strip characters before React sees the value.
                      We do our own regex validation anyway. */}
                </div>
                {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    name="phone"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={form.phone}
                    onChange={handleChange}
                    disabled={loading}
                    className={`auth-input pl-11 ${fieldErrors.phone ? "border-red-500/50" : ""}`}
                  />
                </div>
                {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 chars, upper, lower, number, symbol"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    className={`auth-input pl-11 pr-12 ${fieldErrors.password ? "border-red-500/50" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
                {form.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map((s) => (
                        <div
                          key={s}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            s <= strength ? STRENGTH_COLORS[strength] : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">{STRENGTH_LABELS[strength]}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className={`auth-input pl-11 ${fieldErrors.confirmPassword ? "border-red-500/50" : ""}`}
                  />
                </div>
                {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
              </div>

              {apiError && (
                <motion.p
                  className="text-red-400 text-xs text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {apiError}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r ${roleData.color} shadow-xl mt-2`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ boxShadow: `0 10px 30px ${roleData.glow}` }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Create Account
                  </div>
                )}
              </motion.button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-slate-600 text-xs">Already registered?</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Link
                to={`/login?panel=${selectedRole}`}
                className="block w-full py-3.5 rounded-xl font-semibold text-slate-300 text-sm glass-card-light text-center border border-white/10 hover:border-white/20 hover:text-white transition-all"
              >
                Sign In Instead
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;






// import { useState } from "react";
// import { useNavigate, Link, useSearchParams } from "react-router-dom";
// import { motion } from "framer-motion";
// import {
//   Building2,
//   Eye,
//   EyeOff,
//   ArrowLeft,
//   Lock,
//   Mail,
//   User,
//   Phone,
//   Sparkles,
//   CheckCircle2,
// } from "lucide-react";
// import { authService } from "@/services/auth.service";
// import "@/pages/auth/Register.css";

// // ─── Color key → CSS class suffix mapping ────────────────────────────────────
// // Keeps gradient/glow classes consistent across stripe, icon, button, etc.
// const COLOR_MAP = {
//   "from-violet-500 to-indigo-600": "violet-indigo",
//   "from-cyan-500 to-blue-600":     "cyan-blue",
//   "from-emerald-500 to-green-600": "emerald-green",
//   "from-amber-500 to-orange-500":  "amber-orange",
// };

// const ROLES = [
//   {
//     value: "admin",
//     label: "Admin",
//     desc: "Manage the full system",
//     colorKey: "violet-indigo",
//     glow: "rgba(139,92,246,0.4)",
//     note: null,
//   },
//   {
//     value: "finance",
//     label: "Finance",
//     desc: "Track payments & records",
//     colorKey: "cyan-blue",
//     glow: "rgba(56,189,248,0.4)",
//     note: null,
//   },
//   {
//     value: "resident",
//     label: "Resident",
//     desc: "Manage your home",
//     colorKey: "emerald-green",
//     glow: "rgba(52,211,153,0.4)",
//     note: null,
//   },
//   {
//     value: "guard",
//     label: "Guard",
//     desc: "Gate & visitor control",
//     colorKey: "amber-orange",
//     glow: "rgba(251,191,36,0.4)",
//     note: null,
//   },
// ];

// function FloatingOrb({ size, colorKey, top, left, delay }) {
//   return (
//     <motion.div
//       className={`orb orb--${colorKey}`}
//       style={{ width: size, height: size, top, left }}
//       animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
//       transition={{ duration: 7 + delay, delay, repeat: Infinity, ease: "easeInOut" }}
//     />
//   );
// }

// const getStrength = (pw) => {
//   if (!pw) return 0;
//   let s = 0;
//   if (pw.length >= 8) s++;
//   if (/[A-Z]/.test(pw)) s++;
//   if (/[0-9]/.test(pw)) s++;
//   if (/[@$!%*?&_#^()\-+=]/.test(pw)) s++;
//   return s;
// };

// const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

// // Active segment class per strength level
// const STRENGTH_SEG_CLASS = [
//   "",
//   "strength-bar__seg--active-red",
//   "strength-bar__seg--active-amber",
//   "strength-bar__seg--active-yellow",
//   "strength-bar__seg--active-green",
// ];

// const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// const Register = () => {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const initialRole = searchParams.get("panel") || "";
//   const defaultRole = ROLES.some((r) => r.value === initialRole) ? initialRole : "";

//   const [step, setStep] = useState(defaultRole ? "form" : "role");
//   const [selectedRole, setSelectedRole] = useState(defaultRole);
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirmPassword: "",
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [fieldErrors, setFieldErrors] = useState({});
//   const [apiError, setApiError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const roleData = ROLES.find((r) => r.value === selectedRole) || ROLES[0];

//   const validate = () => {
//     const e = {};
//     if (!form.name.trim()) e.name = "Full name is required";
//     if (!EMAIL_REGEX.test(form.email.trim())) e.email = "Valid email required";
//     if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Valid 10-digit mobile number";
//     if (
//       form.password.length < 8 ||
//       !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#^()\-+=])/.test(form.password)
//     )
//       e.password = "8+ chars, uppercase, lowercase, number & special char";
//     if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
//     return e;
//   };

//   const handleChange = (e) => {
//     setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
//     setFieldErrors((p) => ({ ...p, [e.target.name]: "" }));
//     setApiError("");
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setApiError("");
//     setFieldErrors({});

//     const errs = validate();
//     if (Object.keys(errs).length > 0) {
//       setFieldErrors(errs);
//       return;
//     }

//     setLoading(true);
//     try {
//       const emailToSend = form.email.trim();
//       await authService.register({
//         name: form.name.trim(),
//         email: emailToSend,
//         phone: form.phone,
//         password: form.password,
//         role: selectedRole,
//       });

//       setStep("done");
//       setTimeout(() => {
//         navigate(`/login?panel=${selectedRole}`, { replace: true });
//       }, 2000);
//     } catch (err) {
//       const data = err.response?.data;
//       if (data?.errors?.length > 0) {
//         const backendFieldErrors = {};
//         const generalErrors = [];
//         data.errors.forEach((error) => {
//           const field = error.param || error.path;
//           if (field && field in form) {
//             backendFieldErrors[field] = error.msg;
//           } else {
//             generalErrors.push(error.msg);
//           }
//         });
//         if (Object.keys(backendFieldErrors).length > 0) setFieldErrors(backendFieldErrors);
//         if (generalErrors.length > 0) setApiError(generalErrors.join(" · "));
//       } else {
//         setApiError(data?.message || "Registration failed. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const strength = getStrength(form.password);

//   // ── Step 1: Role picker ────────────────────────────────────────────────────
//   if (step === "role") {
//     return (
//       <div className="auth-bg register-page">
//         <FloatingOrb size={600} colorKey="cyan"   top="-10%" left="60%" delay={0} />
//         <FloatingOrb size={500} colorKey="violet" top="50%"  left="-15%" delay={2} />
//         <div className="register-page__overlay grid-overlay" />

//         <div className="register-page__inner">
//           <motion.div
//             className="register-back"
//             initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
//           >
//             <Link to="/" className="auth-back-link">
//               <ArrowLeft />
//               Back to Home
//             </Link>
//           </motion.div>

//           <motion.div
//             className="register-card glass-card"
//             initial={{ opacity: 0, y: 40, scale: 0.95 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             transition={{ duration: 0.6, ease: "easeOut" }}
//           >
//             <div className="register-card__stripe register-card__stripe--emerald-amber" />

//             <div className="register-card__body">
//               <div className="register-card__header">
//                 <div className="register-card__icon register-card__icon--emerald-green">
//                   <Building2 />
//                 </div>
//                 <h1 className="register-card__title">Create Account</h1>
//                 <p className="register-card__subtitle">Choose your role to get started</p>
//               </div>

//               <div className="role-grid">
//                 {ROLES.map((role) => (
//                   <motion.button
//                     key={role.value}
//                     type="button"
//                     onClick={() => { setSelectedRole(role.value); setStep("form"); }}
//                     className="role-btn"
//                     whileHover={{ scale: 1.02, y: -2 }}
//                     whileTap={{ scale: 0.98 }}
//                   >
//                     <div className={`role-btn__icon role-btn__icon--${role.colorKey}`}>
//                       <span>{role.label[0]}</span>
//                     </div>
//                     <div className="role-btn__label">{role.label}</div>
//                     <div className="role-btn__desc">{role.desc}</div>
//                     {role.note && (
//                       <span className="role-btn__note">Requires activation</span>
//                     )}
//                   </motion.button>
//                 ))}
//               </div>

//               <div className="role-hint">
//                 <p>Choose the panel where you want to create your account.</p>
//               </div>

//               <p className="register-signin">
//                 Already have an account?{" "}
//                 <Link to="/login">Sign in</Link>
//               </p>
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     );
//   }

//   // ── Step 3: Success ────────────────────────────────────────────────────────
//   if (step === "done") {
//     return (
//       <div className="auth-bg success-page">
//         <div className="success-page__inner">
//           <motion.div
//             className="register-card glass-card"
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//           >
//             <div className={`register-card__stripe register-card__stripe--${roleData.colorKey}`} />
//             <div className="success-card__body">
//               <motion.div
//                 className="success-card__icon"
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
//               >
//                 <CheckCircle2 />
//               </motion.div>

//               <h2 className="success-card__title">Account Created!</h2>
//               <p className="success-card__subtitle">
//                 Your {roleData.label} account is ready. Redirecting you to login...
//               </p>

//               <motion.button
//                 onClick={() => navigate(`/login?panel=${selectedRole}`, { replace: true })}
//                 className={`success-card__btn btn-gradient--${roleData.colorKey}`}
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//               >
//                 Go to {roleData.label} Login
//               </motion.button>
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     );
//   }

//   // ── Step 2: Registration form ──────────────────────────────────────────────
//   return (
//     <div className="auth-bg register-page">
//       <FloatingOrb size={600} colorKey="cyan"   top="-10%" left="60%" delay={0} />
//       <FloatingOrb size={500} colorKey="violet" top="50%"  left="-15%" delay={2} />
//       <div className="register-page__overlay grid-overlay" />

//       <div className="register-page__inner">
//         <motion.div
//           className="register-back"
//           initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
//         >
//           <button onClick={() => setStep("role")} className="auth-back-link">
//             <ArrowLeft />
//             Change Role
//           </button>
//         </motion.div>

//         <motion.div
//           className="register-card glass-card"
//           initial={{ opacity: 0, y: 40, scale: 0.95 }}
//           animate={{ opacity: 1, y: 0, scale: 1 }}
//           transition={{ duration: 0.6, ease: "easeOut" }}
//           /* box-shadow uses roleData.glow which is a runtime value — kept as inline style */
//           style={{ boxShadow: `0 30px 60px ${roleData.glow}25, 0 0 0 1px rgba(255,255,255,0.05)` }}
//         >
//           <motion.div
//             className={`register-card__stripe register-card__stripe--${roleData.colorKey}`}
//             layout
//             transition={{ duration: 0.4 }}
//           />

//           <div className="register-card__body">
//             <div className="register-card__header">
//               <div
//                 className={`register-card__icon register-card__icon--${roleData.colorKey}`}
               
//                 style={{ boxShadow: `0 0 30px ${roleData.glow}` }}
//               >
//                 <Building2 />
//               </div>
//               <h1 className="register-card__title">Register as {roleData.label}</h1>
//               <p className="register-card__subtitle">Create your panel-based account</p>
//             </div>

//             <form onSubmit={handleSubmit} className="register-form" noValidate>

//               {/* Name */}
//               <div className="form-field">
//                 <label className="form-field__label">Full Name</label>
//                 <div className="form-field__input-wrap">
//                   <User className="form-field__icon" />
//                   <input
//                     name="name"
//                     type="text"
//                     placeholder="Rahul Sharma"
//                     value={form.name}
//                     onChange={handleChange}
//                     disabled={loading}
//                     className={`auth-input pl-11${fieldErrors.name ? " border-red-500/50" : ""}`}
//                   />
//                 </div>
//                 {fieldErrors.name && <p className="form-field__error">{fieldErrors.name}</p>}
//               </div>

//               {/* Email */}
//               <div className="form-field">
//                 <label className="form-field__label">Email Address</label>
//                 <div className="form-field__input-wrap">
//                   <Mail className="form-field__icon" />
//                   <input
//                     name="email"
//                     type="text"
//                     autoComplete="email"
//                     placeholder="you@society.com"
//                     value={form.email}
//                     onChange={handleChange}
//                     disabled={loading}
//                     className={`auth-input pl-11${fieldErrors.email ? " border-red-500/50" : ""}`}
//                   />
//                 </div>
//                 {fieldErrors.email && <p className="form-field__error">{fieldErrors.email}</p>}
//               </div>

//               {/* Phone */}
//               <div className="form-field">
//                 <label className="form-field__label">Mobile Number</label>
//                 <div className="form-field__input-wrap">
//                   <Phone className="form-field__icon" />
//                   <input
//                     name="phone"
//                     type="tel"
//                     placeholder="9876543210"
//                     maxLength={10}
//                     value={form.phone}
//                     onChange={handleChange}
//                     disabled={loading}
//                     className={`auth-input pl-11${fieldErrors.phone ? " border-red-500/50" : ""}`}
//                   />
//                 </div>
//                 {fieldErrors.phone && <p className="form-field__error">{fieldErrors.phone}</p>}
//               </div>

//               {/* Password */}
//               <div className="form-field">
//                 <label className="form-field__label">Password</label>
//                 <div className="form-field__input-wrap">
//                   <Lock className="form-field__icon" />
//                   <input
//                     name="password"
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Min 8 chars, upper, lower, number, symbol"
//                     value={form.password}
//                     onChange={handleChange}
//                     disabled={loading}
//                     className={`auth-input pl-11 pr-12${fieldErrors.password ? " border-red-500/50" : ""}`}
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="form-field__eye"
//                   >
//                     {showPassword ? <EyeOff /> : <Eye />}
//                   </button>
//                 </div>
//                 {fieldErrors.password && <p className="form-field__error">{fieldErrors.password}</p>}
//                 {form.password && (
//                   <div className="strength-bar">
//                     <div className="strength-bar__segments">
//                       {[1, 2, 3, 4].map((s) => (
//                         <div
//                           key={s}
//                           className={`strength-bar__seg${s <= strength ? ` ${STRENGTH_SEG_CLASS[strength]}` : ""}`}
//                         />
//                       ))}
//                     </div>
//                     <span className="strength-bar__label">{STRENGTH_LABELS[strength]}</span>
//                   </div>
//                 )}
//               </div>

//               {/* Confirm Password */}
//               <div className="form-field">
//                 <label className="form-field__label">Confirm Password</label>
//                 <div className="form-field__input-wrap">
//                   <Lock className="form-field__icon" />
//                   <input
//                     name="confirmPassword"
//                     type="password"
//                     placeholder="Re-enter your password"
//                     value={form.confirmPassword}
//                     onChange={handleChange}
//                     disabled={loading}
//                     className={`auth-input pl-11${fieldErrors.confirmPassword ? " border-red-500/50" : ""}`}
//                   />
//                 </div>
//                 {fieldErrors.confirmPassword && (
//                   <p className="form-field__error">{fieldErrors.confirmPassword}</p>
//                 )}
//               </div>

//               {apiError && (
//                 <motion.p
//                   className="api-error"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                 >
//                   {apiError}
//                 </motion.p>
//               )}

//               <motion.button
//                 type="submit"
//                 disabled={loading}
//                 className={`register-submit btn-gradient--${roleData.colorKey}`}
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//               >
//                 {loading ? (
//                   <div className="register-submit__loading">
//                     <motion.div
//                       className="register-submit__spinner"
//                       animate={{ rotate: 360 }}
//                       transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
//                     />
//                     Creating Account...
//                   </div>
//                 ) : (
//                   <div className="register-submit__label">
//                     <Sparkles />
//                     Create Account
//                   </div>
//                 )}
//               </motion.button>
//             </form>

//             <div className="register-divider">
//               <div className="register-divider__line" />
//               <span className="register-divider__text">Already registered?</span>
//               <div className="register-divider__line" />
//             </div>

//             <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
//               <Link
//                 to={`/login?panel=${selectedRole}`}
//                 className="register-signin-link"
//               >
//                 Sign In Instead
//               </Link>
//             </motion.div>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default Register;
