import type { Unit } from '../types';

export const ML_PER_FLOZ = 29.5735;
export const UNIT_LABEL: Record<Unit, string> = { ml: 'mL', l: 'L', floz: 'fl oz' };

/** Convert a user-entered value to integer millilitres. */
export function toMl(value: number, unit: Unit): number {
  const ml = unit === 'ml' ? value : unit === 'l' ? value * 1000 : value * ML_PER_FLOZ;
  return Math.round(ml);
}

export function fromMl(ml: number, unit: Unit): number {
  if (unit === 'ml') return ml;
  if (unit === 'l') return ml / 1000;
  return ml / ML_PER_FLOZ;
}

export function formatMl(ml: number): string {
  return `${ml.toLocaleString('en-US')} mL`;
}

export function formatVolume(ml: number, unit: Unit): string {
  if (unit === 'ml') return formatMl(ml);
  if (unit === 'l') return `${(ml / 1000).toFixed(2).replace(/\.?0+$/, '')} L`;
  return `${(ml / ML_PER_FLOZ).toFixed(1).replace(/\.0$/, '')} fl oz`;
}

export function inputStep(unit: Unit): number {
  return unit === 'ml' ? 10 : unit === 'l' ? 0.05 : 1;
}
