import { t } from '@/i18n/i18n';

import type {
  ProviderPermissionModeOption,
  ProviderPermissionModePolicy,
} from '../../core/providers/types';

/** Stored values; `normal` (ask) and `yolo` (always-approve) predate the full native set. */
export const GROK_PERMISSION_MODES = ['auto', 'normal', 'acceptEdits', 'yolo'] as const;

export const GROK_PERMISSION_MODE_POLICY: ProviderPermissionModePolicy = Object.freeze({
  values: GROK_PERMISSION_MODES,
  fallbackValue: 'normal',
  defaultValue: 'auto',
});

export const GROK_PERMISSION_MODE_OPTIONS: readonly ProviderPermissionModeOption[] = Object.freeze([
  { value: 'auto', get label() { return t('permissions.grok.auto.label'); }, get description() { return t('permissions.grok.auto.description'); } },
  { value: 'normal', get label() { return t('permissions.grok.normal.label'); }, get description() { return t('permissions.grok.normal.description'); } },
  { value: 'acceptEdits', get label() { return t('permissions.grok.acceptEdits.label'); }, get description() { return t('permissions.grok.acceptEdits.description'); } },
  {
    value: 'yolo',
    get label() { return t('permissions.grok.yolo.label'); },
    get description() { return t('permissions.grok.yolo.description'); },
    bypassesApprovals: true,
  },
]);

/**
 * ACP session metadata reaches only Grok's auto and always-approve modes, so
 * accept-edits approves native `default` edit prompts the way Grok's own mode would.
 */
export function shouldAutoApproveGrokPermission(
  permissionMode: string | undefined,
  toolKind: string | null | undefined,
): boolean {
  return permissionMode === 'acceptEdits' && toolKind === 'edit';
}
