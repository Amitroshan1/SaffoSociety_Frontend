import { AnimatePresence, motion } from 'framer-motion';

export default function ComingSoonToast({ open, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="coming-soon-toast"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          role="status"
        >
          <div>
            <strong>Not published yet</strong>
            <p>This page is not available in the current build.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Dismiss">
            ×
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
