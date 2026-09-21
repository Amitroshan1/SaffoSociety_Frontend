

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Mail, Lock, ArrowLeft, KeyRound, CheckCircle2, Sparkles } from 'lucide-react';
import { authService } from '@/services/auth.service';

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

const ForgotPassword = () => {
  const [step,     setStep]     = useState('email'); // email | otp | done
  const [email,    setEmail]    = useState('');
  const [otp,      setOtp]      = useState('');
  const [password, setPassword] = useState('');
  const [message,  setMessage]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authService.forgotPassword({ email });
      setStep('otp');
      setMessage('OTP sent to your registered email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  // ── Step 2: Reset Password ──────────────────────────────────────────────────
  const resetPass = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authService.resetPassword({ email, otp, password });
      setStep('done');
      setMessage('Password reset! You can now log in.');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  const stepConfig = {
    email: { title: 'Forgot Password', subtitle: 'Enter your email to receive an OTP', icon: Mail },
    otp:   { title: 'Reset Password',  subtitle: `OTP sent to ${email}`,               icon: KeyRound },
    done:  { title: 'Password Reset!', subtitle: 'You can now sign in',                 icon: CheckCircle2 },
  };
  const cfg = stepConfig[step];

  return (
    <div className="auth-bg relative flex items-center justify-center p-4 overflow-hidden">
      <FloatingOrb size={500} color="rgba(139,92,246,0.12)" top="-10%" left="-15%" delay={0} />
      <FloatingOrb size={400} color="rgba(56,189,248,0.08)"  top="60%"  left="60%"  delay={2} />
      <div className="absolute inset-0 pointer-events-none grid-overlay" />

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <Link to="/login" className="auth-back-link flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          className="glass-card rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ boxShadow: '0 30px 60px rgba(139,92,246,0.15), 0 0 0 1px rgba(255,255,255,0.05)' }}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-indigo-600" />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                key={step}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl ${
                  step === 'done'
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                    : 'bg-gradient-to-br from-violet-500 to-indigo-600'
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <cfg.icon className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-black text-white mb-1">{cfg.title}</h1>
              <p className="text-slate-400 text-sm">{cfg.subtitle}</p>
            </div>

            {/* Status messages */}
            {message && (
              <motion.div
                className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center"
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              >
                {message}
              </motion.div>
            )}
            {error && (
              <motion.div
                className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            {/* ── Step 1: Email form ────────────────────────────────────────── */}
            {step === 'email' && (
              <form onSubmit={sendOtp} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@society.com" required
                      className="auth-input pl-11"
                    />
                  </div>
                </div>
                <motion.button
                  type="submit" disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-violet-500 to-indigo-600 shadow-xl"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ boxShadow: '0 10px 30px rgba(139,92,246,0.4)' }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" /> Send OTP
                    </div>
                  )}
                </motion.button>
              </form>
            )}

            {/* ── Step 2: OTP + new password form ──────────────────────────── */}
            {step === 'otp' && (
              <form onSubmit={resetPass} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    Enter OTP (6 digits)
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)}
                      placeholder="123456" required
                      className="auth-input pl-11 tracking-widest text-center text-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" required
                      className="auth-input pl-11"
                    />
                  </div>
                </div>
                <motion.button
                  type="submit" disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-violet-500 to-indigo-600 shadow-xl"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ boxShadow: '0 10px 30px rgba(139,92,246,0.4)' }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                      Resetting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" /> Reset Password
                    </div>
                  )}
                </motion.button>
              </form>
            )}

            {/* ── Step 3: Done ──────────────────────────────────────────────── */}
            {step === 'done' && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-emerald-500 to-green-600 shadow-xl"
                  style={{ boxShadow: '0 10px 30px rgba(52,211,153,0.4)' }}
                >
                  <Building2 className="w-4 h-4" /> Back to Login
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;


