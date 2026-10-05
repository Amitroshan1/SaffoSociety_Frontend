import { motion } from 'framer-motion';
import { PARTICLES } from '@/pages/landing/landingData';
import '@/styles/landing.css';

export default function ParticleField() {
  return (
    <div className="particle-field">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="particle-dot"
          style={{
            left: `${p.x}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background:
              p.id % 3 === 0
                ? 'rgba(124,58,237,0.35)'
                : p.id % 3 === 1
                  ? 'rgba(14,165,233,0.35)'
                  : 'rgba(16,185,129,0.35)',
          }}
          animate={{
            y: [0, -1100],
            x: [0, (Math.random() - 0.5) * 220],
            opacity: [0, 0.55, 0.55, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
