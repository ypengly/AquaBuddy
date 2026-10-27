'use client';

import { motion } from 'framer-motion';

const BODY = 'M70 40 H130 V60 C130 75 170 85 170 120 V320 C170 340 155 352 135 352 H65 C45 352 30 340 30 320 V120 C30 85 70 75 70 60 Z';
const WAVE = 'M-200 0 Q-175 -9 -150 0 T-100 0 T-50 0 T0 0 T50 0 T100 0 T150 0 T200 0 T250 0 T300 0 T350 0 V400 H-200 Z';
const BOTTOM = 352;
const TOP = 96;

export function Bottle({ fill, percent }: { fill: number; percent: number }) {
  const y = BOTTOM - (BOTTOM - TOP) * Math.max(0, Math.min(1, fill));
  return (
    <div className="relative mx-auto w-full max-w-[240px]">
      <svg viewBox="0 0 200 370" className="w-full drop-shadow-xl" role="img" aria-label={`Water bottle, ${percent}% of today's target`}>
        <defs>
          <clipPath id="bottle-clip"><path d={BODY} /></clipPath>
          <linearGradient id="water-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#67dff3" /><stop offset="1" stopColor="#0aa9c9" /></linearGradient>
          <linearGradient id="water-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a5eefa" stopOpacity=".75" /><stop offset="1" stopColor="#25c6e3" stopOpacity=".75" /></linearGradient>
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".5" stopColor="#fff" stopOpacity=".08" /><stop offset="1" stopColor="#fff" stopOpacity=".3" /></linearGradient>
        </defs>
        <rect x="78" y="12" width="44" height="26" rx="7" fill="#25c6e3" opacity=".9" />
        <path d={BODY} fill="rgba(255,255,255,.28)" />
        <g clipPath="url(#bottle-clip)">
          <motion.g initial={{ y: BOTTOM }} animate={{ y }} transition={{ type: 'spring', stiffness: 38, damping: 14 }}>
            <g className="wave-slow"><path d={WAVE} fill="url(#water-b)" transform="translate(0 4)" /></g>
            <g className="wave-fast"><path d={WAVE} fill="url(#water-a)" /></g>
            {[50, 90, 125, 70, 108].map((cx, i) => (
              <circle key={i} className="bubble" cx={cx} cy={110 + i * 22} r={3 + (i % 3)} fill="#fff" opacity=".55" style={{ animationDelay: `${i * 0.9}s`, animationDuration: `${4 + i}s` }} />
            ))}
          </motion.g>
        </g>
        <path d={BODY} fill="url(#glass)" stroke="#67dff3" strokeWidth="3" />
        <path d="M46 130 V310" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".5" />
        {[0.25, 0.5, 0.75].map((m) => (
          <line key={m} x1="150" x2="166" y1={BOTTOM - (BOTTOM - TOP) * m} y2={BOTTOM - (BOTTOM - TOP) * m} stroke="#0b87a8" strokeWidth="2" opacity=".45" />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-[48%] text-center">
        <span className="font-display text-4xl font-bold text-white [text-shadow:0_2px_10px_rgba(11,135,168,.7)]">{percent}%</span>
      </div>
    </div>
  );
}
