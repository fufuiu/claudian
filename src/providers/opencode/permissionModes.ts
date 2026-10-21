import { t } from '@/i18n/i18n';

import type {
  ProviderPermissionModeOption,
  ProviderPermissionModePolicy,
} from '../../core/providers/types';

/** OpenCode's native client modes: prompt for `ask` rules, or accept them (`--auto`). */
export const OPENCODE_PERMISSION_MODE_POLICY: ProviderPermissionModePolicy = Object.freeze({
  values: Object.freeze(['normal', 'yolo']),
  fallbackValue: 'normal',
  defaultValue: 'normal',
});

export const OPENCODE_PERMISSION_MODE_OPTIONS: readonly ProviderPermissionModeOption[] = Object.freeze([
  { value: 'normal', get label() { return t('permissions.opencode.normal.label'); }, get description() { return t('permissions.opencode.normal.description'); } },
  {
    value: 'yolo',
    get label() { return t('permissions.opencode.yolo.label'); },
    get description() { return t('permissions.opencode.yolo.description'); },
    bypassesApprovals: true,
  },
]);
