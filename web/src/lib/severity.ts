import type { SeverityBand } from '@shared/types';
import { bandForScore, BAND_LABELS } from '@shared/types';

export const BAND_HEX: Record<SeverityBand, string> = {
  minimal: '#2dd4bf',
  moderate: '#fbbf24',
  high: '#fb923c',
  severe: '#f87171',
  critical: '#ef4444',
};

export function colorForScore(score: number): string {
  return BAND_HEX[bandForScore(score)];
}

export { bandForScore, BAND_LABELS };
