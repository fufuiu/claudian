import type { PermissionMode as SDKPermissionMode } from '@anthropic-ai/claude-agent-sdk';

import { t } from '@/i18n/i18n';

import { getProviderConfig } from '../../core/providers/providerConfig';
import type {
  ProviderPermissionModeOption,
  ProviderPermissionModePolicy,
} from '../../core/providers/types';

export const CLAUDE_PERMISSION_MODES = ['auto', 'manual', 'acceptEdits', 'yolo'] as const;
export type ClaudePermissionMode = typeof CLAUDE_PERMISSION_MODES[number];

const SDK_PERMISSION_MODES: Record<ClaudePermissionMode, SDKPermissionMode> = {
  auto: 'auto',
  manual: 'default',
  acceptEdits: 'acceptEdits',
  yolo: 'bypassPermissions',
};

/** Retired Safe-toggle targets, stored as `providerConfigs.claude.safeMode`. */
const LEGACY_SAFE_MODES: Readonly<Record<string, ClaudePermissionMode>> = {
  auto: 'auto',
  default: 'manual',
  acceptEdits: 'acceptEdits',
};

export const CLAUDE_PERMISSION_MODE_POLICY: ProviderPermissionModePolicy = Object.freeze({
  values: CLAUDE_PERMISSION_MODES,
  fallbackValue: 'manual',
  defaultValue: 'auto',
  migrateValue(value: string, settings: Record<string, unknown>): string | undefined {
    if (value !== 'normal') return undefined;
    // The retired Safe toggle ran the configured safe mode, which defaulted to acceptEdits.
    const safeMode = getProviderConfig(settings, 'claude').safeMode;
    return safeMode === undefined ? 'acceptEdits' : typeof safeMode === 'string' ? LEGACY_SAFE_MODES[safeMode] : undefined;
  },
});

export const CLAUDE_PERMISSION_MODE_OPTIONS: readonly ProviderPermissionModeOption[] = Object.freeze([
  { value: 'auto', get label() { return t('permissions.claude.auto.label'); }, get description() { return t('permissions.claude.auto.description'); } },
  { value: 'manual', get label() { return t('permissions.claude.manual.label'); }, get description() { return t('permissions.claude.manual.description'); } },
  { value: 'acceptEdits', get label() { return t('permissions.claude.acceptEdits.label'); }, get description() { return t('permissions.claude.acceptEdits.description'); } },
  {
    value: 'yolo',
    get label() { return t('permissions.claude.yolo.label'); },
    get description() { return t('permissions.claude.yolo.description'); },
    bypassesApprovals: true,
  },
]);

export function isClaudePermissionMode(value: unknown): value is ClaudePermissionMode {
  return (CLAUDE_PERMISSION_MODES as readonly unknown[]).includes(value);
}

export function toClaudeSDKPermissionMode(mode: ClaudePermissionMode): SDKPermissionMode {
  return SDK_PERMISSION_MODES[mode];
}

/** Native modes outside the four offered (plan, dontAsk, ...) have no toolbar value. */
export function fromClaudeSDKPermissionMode(mode: unknown): ClaudePermissionMode | null {
  return CLAUDE_PERMISSION_MODES.find(value => SDK_PERMISSION_MODES[value] === mode) ?? null;
}
