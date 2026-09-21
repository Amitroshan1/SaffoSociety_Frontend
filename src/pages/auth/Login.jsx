import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/common/ThemeToggle';

const ROLE_REDIRECT = {
  admin: '/admin/dashboard',
  finance: '/finance/dashboard',
  resident: '/resident/dashboard',
  guard: '/guard/dashboard',
  super_admin: '/superadmin/dashboard',
  platform_support: '/superadmin/dashboard',
  platform_auditor: '/superadmin/dashboard',
  platform_billing: '/superadmin/dashboard',
};

const ACCENT = {
  color: 'from-violet-500 to-indigo-600',
  glow: 'rgba(139,92,246,0.4)',
};

function FloatingOrb({ size, color, top, left, delay }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size, height: size, top, left,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: 'blur(50px)',
      }}
      animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 7 + delay, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

const Login = () => {
  const { login, clearLocalSession, user, ROLE_REDIRECT: authRedirects } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]                 = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  const redirects = authRedirects || ROLE_REDIRECT;

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = form.email.trim();
    const password = form.password;
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Drop any previous session so login always requires credentials.
      if (user) {
        await clearLocalSession();
      }
      const loggedIn = await login(email, password);
      navigate(redirects[loggedIn.role] || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg auth-login-shell relative flex items-center justify-center p-4 overflow-hidden">
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 20 }}>
        <ThemeToggle variant="nav" />
      </div>
      <FloatingOrb size={600} color="rgba(139,92,246,0.12)" top="-10%" left="-15%" delay={0} />
      <FloatingOrb size={500} color="rgba(56,189,248,0.08)"  top="50%"  left="60%"  delay={3} />
      <FloatingOrb size={350} color="rgba(52,211,153,0.06)"  top="80%"  left="5%"   delay={1.5} />

      <div className="absolute inset-0 pointer-events-none grid-overlay" />

      <div className="w-full max-w-md relative z-10 auth-login-wrap">
        <motion.div
          className="glass-card rounded-3xl overflow-hidden auth-login-card"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ boxShadow: `0 30px 60px ${ACCENT.glow}30, 0 0 0 1px rgba(255,255,255,0.05)` }}
        >
          <div className={`h-1.5 w-full bg-gradient-to-r ${ACCENT.color}`} />

          <div className="p-8 auth-login-content">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="auth-login-back-row"
            >
              <Link to="/" className="auth-back-link flex items-center gap-2 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Link>
            </motion.div>

            <div className="text-center mb-8 auth-login-hero">
              <motion.div
                className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 shadow-xl pulse-glow"
                style={{ boxShadow: `0 0 30px ${ACCENT.glow}` }}
              >
                <img src="/logo.png" alt="Saffo Society" className="w-full h-full object-cover" />
              </motion.div>
              <h1 className="text-2xl font-black text-white mb-1">Welcome Back</h1>
              <p className="text-slate-400 text-sm">Sign in to your Saffo Society account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 auth-login-form" noValidate>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    name="email"
                    type="text"
                    placeholder="you@society.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="auth-input pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="auth-input pl-11 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Forgot Password?
                </Link>
              </div>

              {error && (
                <motion.p
                  className="text-red-400 text-xs text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r ${ACCENT.color} shadow-xl`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ boxShadow: `0 10px 30px ${ACCENT.glow}` }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Sign In
                  </div>
                )}
              </motion.button>
            </form>

            <div className="flex items-center gap-4 my-6 auth-login-divider">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-slate-600 text-xs">Don't have an account?</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Link
                to="/register"
                className="block w-full py-3.5 rounded-xl font-semibold text-slate-300 text-sm glass-card-light text-center border border-white/10 hover:border-white/20 hover:text-white transition-all"
              >
                Create New Account
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
