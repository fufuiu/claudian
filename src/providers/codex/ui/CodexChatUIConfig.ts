import { t } from '@/i18n/i18n';

import type { ProviderChatUIConfig } from '../../../core/providers/types';
import { OPENAI_PROVIDER_ICON } from '../../../shared/icons';
import { codexModelPolicy } from '../CodexModelPolicy';
import { getCodexProviderSettings } from '../settings';

export const codexChatUIConfig: ProviderChatUIConfig = {
  ...codexModelPolicy,
  getPermissionModeOptions(settings = {}) {
    const readOnly = getCodexProviderSettings(settings).safeMode === 'read-only';
    return [
      {
        value: 'auto-review', label: t('permissions.codex.approve'),
        description: t('permissions.codex.review'),
      },
      {
        value: 'normal', label: t('permissions.codex.ask'),
        description: readOnly
          ? t('permissions.codex.askReadOnly')
          : t('permissions.codex.askExtra'),
      },
      {
        value: 'yolo', label: t('permissions.codex.full'), bypassesApprovals: true,
        description: t('permissions.codex.fullDescription'),
      },
    ];
  },
  getServiceTierToggle: settings => codexModelPolicy.getServiceTierPolicy?.(settings) ?? null,
  getProviderIcon() {
    return OPENAI_PROVIDER_ICON;
  },
};
