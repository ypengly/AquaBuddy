'use client';

import { motion } from 'framer-motion';

const COLORS = ['#25c6e3', '#67dff3', '#a5eefa', '#ffd166', '#ff8fab', '#b8a1ff'];

export function Confetti({ reduced }: { reduced: boolean }) {
  if (reduced) return null;
  const pieces = Array.from({ length: 44 }, (_, i) => ({
    left: (i * 37) % 100,
    delay: (i % 11) * 0.08,
    dur: 2.4 + (i % 7) * 0.25,
    rot: (i % 2 ? 1 : -1) * (180 + (i % 5) * 90),
    size: 6 + (i % 4) * 3,
    color: COLORS[i % COLORS.length],
  }));
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0 block rounded-sm"
          style={{ left: `${p.left}%`, width: p.size, height: p.size * 1.6, background: p.color }}
          initial={{ y: -30, opacity: 1, rotate: 0 }}
          animate={{ y: '105vh', opacity: [1, 1, 0], rotate: p.rot }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
