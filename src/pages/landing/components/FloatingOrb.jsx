import { motion } from 'framer-motion';
import '@/styles/landing.css';

export default function FloatingOrb({ size, color, top, left, delay = 0 }) {
  return (
    <motion.div
      className="floating-orb"
      style={{
        width: size,
        height: size,
        top,
        left,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
      animate={{ scale: [1, 1.25, 1], opacity: [0.28, 0.55, 0.28] }}
      transition={{
        duration: 6 + delay,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
