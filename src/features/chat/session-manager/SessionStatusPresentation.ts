import type { TabAttention } from '@/features/chat/state/types';
import { getCurrentLocale, t } from '@/i18n/i18n';
import type { TranslationKey } from '@/i18n/types';

export type HistoryConversationOpenState = 'closed' | 'open' | 'current';

export type HistoryConversationStatus = {
  openState: HistoryConversationOpenState;
  isRunning: boolean;
  attention?: TabAttention;
  location?: 'current-view' | 'other-view';
  tabIndex?: number;
};

export type SessionStatusIndicatorKind = 'action-required' | 'error' | 'running' | 'unread';

/** Surface flags that decide how a session row presents its status. */
export interface SessionStatusDisplay {
  showAttentionState?: boolean;
  showOpenStateLabels?: boolean;
  sessionScope?: 'active' | 'archived';
}

/** A null icon is drawn by the indicator's own styles. */
const INDICATOR_PRESENTATION: Readonly<Record<SessionStatusIndicatorKind, {
  icon: string | null;
  label: TranslationKey;
}>> = {
  'action-required': { icon: 'alert-circle', label: 'chat.status.needsInput' },
  error: { icon: 'x-circle', label: 'chat.status.stoppedError' },
  running: { icon: 'loader-2', label: 'common.running' },
  unread: { icon: null, label: 'chat.sessions.unread' },
};

/** Archived rows never present attention, even when their tab still carries it. */
export function canShowAttention(display: SessionStatusDisplay): boolean {
  return display.showAttentionState === true && display.sessionScope !== 'archived';
}

export function isCompletedReview(attention: TabAttention | undefined): boolean {
  return attention?.kind === 'review' && attention.outcome === 'completed';
}

/**
 * Badges replace open-state labels; they only appear when the surface hides those labels. A row
 * shows its most urgent badge: waiting, then running, then error, then unread.
 */
export function sessionIndicatorKind(
  status: HistoryConversationStatus,
  display: SessionStatusDisplay,
): SessionStatusIndicatorKind | null {
  if (display.showOpenStateLabels !== false) return null;

  const showAttention = canShowAttention(display);
  if (showAttention && status.attention?.kind === 'action-required') {
    return 'action-required';
  }
  if (status.isRunning) return 'running';
  if (showAttention && status.attention?.kind === 'review') {
    return status.attention.outcome === 'error' ? 'error' : 'unread';
  }
  return null;
}

/** A group shows its most urgent member badge, in the same order as a row. */
export function groupIndicatorKind(
  statuses: readonly HistoryConversationStatus[],
  display: SessionStatusDisplay,
): SessionStatusIndicatorKind | null {
  const kinds = statuses.map(status => sessionIndicatorKind(status, display));
  if (kinds.includes('action-required')) return 'action-required';
  if (kinds.includes('running')) return 'running';
  if (kinds.includes('error')) return 'error';
  if (kinds.includes('unread')) return 'unread';
  return null;
}

export function indicatorPresentation(kind: SessionStatusIndicatorKind): {
  icon: string | null;
  label: string;
} {
  const presentation = INDICATOR_PRESENTATION[kind];
  return { ...presentation, label: t(presentation.label) };
}

export function sessionItemIcon(
  openState: HistoryConversationOpenState,
  isRunning: boolean,
): string {
  if (isRunning) return 'loader-2';
  if (openState === 'current') return 'message-square-dot';
  return 'message-square';
}

function tabLabel(status: HistoryConversationStatus): string {
  if (typeof status.tabIndex === 'number') return t('chat.sessions.tabNumber', { index: status.tabIndex });
  if (status.openState === 'current') return t('chat.sessions.currentTab');
  return t('chat.sessions.tab');
}

export function sessionStatusText(
  status: HistoryConversationStatus,
  timestamp: number,
  showOpenStateLabels: boolean,
): string {
  const { openState, isRunning } = status;
  const location = status.location ?? 'current-view';

  if (!showOpenStateLabels) return formatSessionDate(timestamp);
  if (status.attention?.kind === 'action-required') return t('chat.sideChat.statusActionRequired');

  if (openState !== 'closed' && location === 'other-view') {
    return isRunning ? t('chat.sessions.runningOtherPane') : t('chat.sessions.openOtherPane');
  }

  if (isRunning) {
    if (openState === 'closed') return t('common.running');
    return t('chat.sessions.runningIn', { tab: tabLabel(status) });
  }

  switch (openState) {
    case 'current':
      return typeof status.tabIndex === 'number'
        ? t('chat.sessions.currentTabNumber', { index: status.tabIndex })
        : t('chat.sessions.current');
    case 'open':
      return t('chat.sessions.openIn', { tab: tabLabel(status) });
    case 'closed':
      return formatSessionDate(timestamp);
  }
}

/** Today's sessions show their time; older sessions show their month and day. */
export function formatSessionDate(timestamp: number, now: Date = new Date()): string {
  const date = new Date(timestamp);
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(getCurrentLocale(), { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return date.toLocaleDateString(getCurrentLocale(), { month: 'short', day: 'numeric' });
}
