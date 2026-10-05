import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import '@/styles/landing.css';

export default function FeaturesPage() {
  return (
    <div className="auth-bg features-page">
      <div className="features-page-overlay grid-overlay" aria-hidden="true" />

      <motion.div
        className="glass-card features-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="features-card-icon" aria-hidden="true">
          <Sparkles size={28} strokeWidth={2} />
        </div>

        <h1 className="features-card-title">Features coming soon</h1>
        <p className="features-card-copy">
          Sign in, panels, and full module access are on the way. We&apos;re
          finishing the experience for Admins, Residents, Security, and Finance.
        </p>

        <Link to="/" className="btn btn-primary features-card-cta">
          <ArrowLeft size={16} strokeWidth={2} />
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
