import { t } from '@/i18n/i18n';
import type { TranslationKey } from '@/i18n/types';

const REASONING_LABELS: Readonly<Record<string, TranslationKey>> = {
  none: 'reasoning.none',
  off: 'reasoning.off',
  minimal: 'reasoning.minimal',
  low: 'reasoning.low',
  medium: 'reasoning.medium',
  high: 'reasoning.high',
  xhigh: 'reasoning.xhigh',
  max: 'reasoning.max',
  ultra: 'reasoning.ultra',
  default: 'reasoning.default',
};

export const DEFAULT_REASONING_VALUE = 'high';
export const STANDARD_REASONING_VALUES = ['low', 'medium', 'high'] as const;

export function formatReasoningValueLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const key = REASONING_LABELS[trimmed.toLowerCase()];
  if (Object.hasOwn(REASONING_LABELS, trimmed.toLowerCase())) return t(key);

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
