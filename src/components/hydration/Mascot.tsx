'use client';

import { stageName } from '../../lib/stats';

type Mood = 'thirsty' | 'curious' | 'happy' | 'excited' | 'celebrate';

export function moodFor(percent: number): Mood {
  if (percent >= 100) return 'celebrate';
  if (percent >= 75) return 'excited';
  if (percent >= 50) return 'happy';
  if (percent >= 25) return 'curious';
  return 'thirsty';
}

const MOUTH: Record<Mood, string> = {
  thirsty: 'M66 138 q14 -8 28 0',
  curious: 'M68 136 h24',
  happy: 'M64 132 q16 16 32 0',
  excited: 'M62 130 q18 22 36 0 z',
  celebrate: 'M60 128 q20 28 40 0 z',
};

export const MOOD_TEXT: Record<Mood, string> = {
  thirsty: 'A little thirsty. A sip would be lovely.',
  curious: 'Nice start! Keep a relaxed pace.',
  happy: 'Halfway there. Looking good!',
  excited: 'Almost at your target!',
  celebrate: 'Target reached! Anything extra is optional.',
};

export function Mascot({ percent, level, size = 150 }: { percent: number; level: number; size?: number }) {
  const mood = moodFor(percent);
  return (
    <svg viewBox="0 0 160 190" width={size} height={size * 1.19} className="float" role="img" aria-label={`${stageName(level)} mascot feeling ${mood}`}>
      <defs>
        <linearGradient id="mascot-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8be8f8" /><stop offset="1" stopColor="#1fb7d8" /></linearGradient>
      </defs>
      <ellipse cx="80" cy="180" rx="38" ry="6" fill="#0b87a8" opacity=".15" />
      <path d="M80 14 C80 14 24 84 24 120 a56 56 0 0 0 112 0 C136 84 80 14 80 14Z" fill="url(#mascot-g)" stroke="#0b87a8" strokeWidth="3" />
      <ellipse cx="54" cy="96" rx="9" ry="18" fill="#fff" opacity=".5" transform="rotate(22 54 96)" />
      <circle cx="62" cy="112" r={mood === 'celebrate' ? 0 : 7} fill="#0f3a4a" />
      <circle cx="98" cy="112" r={mood === 'celebrate' ? 0 : 7} fill="#0f3a4a" />
      {mood === 'celebrate' && (
        <>
          <path d="M54 112 q8 -10 16 0" stroke="#0f3a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M90 112 q8 -10 16 0" stroke="#0f3a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )}
      <circle cx="48" cy="128" r="7" fill="#ff8fab" opacity=".45" />
      <circle cx="112" cy="128" r="7" fill="#ff8fab" opacity=".45" />
      <path d={MOUTH[mood]} stroke="#0f3a4a" strokeWidth="4" fill={mood === 'excited' || mood === 'celebrate' ? '#ff8fab' : 'none'} strokeLinecap="round" strokeLinejoin="round" />
      {level >= 3 && <path d="M132 46 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill="#ffd166" />}
      {level >= 6 && <path d="M52 74 q28 -14 56 0 l-6 10 q-22 -10 -44 0z" fill="#ff8fab" stroke="#fff" strokeWidth="2" />}
      {level >= 10 && <path d="M58 40 l8 -18 14 14 14 -14 8 18z" fill="#ffd166" stroke="#e8a900" strokeWidth="2" />}
    </svg>
  );
}
