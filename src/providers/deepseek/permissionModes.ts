import type { ProviderPermissionModeOption, ProviderPermissionModePolicy } from '@/core/providers/types';
import { t } from '@/i18n/i18n';

export const DEEPSEEK_PERMISSION_MODES = ['normal', 'yolo'] as const;

export const DEEPSEEK_PERMISSION_MODE_POLICY: ProviderPermissionModePolicy = Object.freeze({
  values: DEEPSEEK_PERMISSION_MODES,
  defaultValue: 'normal',
  fallbackValue: 'normal',
});

export const DEEPSEEK_PERMISSION_MODE_OPTIONS: readonly ProviderPermissionModeOption[] = Object.freeze([
  { value: 'normal', get label() { return t('settings.codex.safeMode.workspaceWrite'); }, get description() { return t('permissions.codex.askExtra'); } },
  {
    value: 'yolo',
    get label() { return t('permissions.codex.full'); },
    get description() { return t('permissions.codex.fullDescription'); },
    bypassesApprovals: true,
  },
]);
