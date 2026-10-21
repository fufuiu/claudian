import { Menu, Notice, setIcon } from 'obsidian';

import type { ConversationMeta } from '@/core/types';
import type { ChatFeatureHost } from '@/features/chat/ChatFeatureHost';
import type { SessionListSectionKind } from '@/features/chat/session-manager/SessionListOrganizer';
import type { SessionMultiSelection } from '@/features/chat/session-manager/SessionMultiSelection';
import type { HistoryConversationStatus } from '@/features/chat/session-manager/SessionStatusPresentation';
import { t } from '@/i18n/i18n';
import type { TranslationKey } from '@/i18n/types';
import { confirmDelete } from '@/shared/modals/ConfirmModal';

/** Runs a session action, reporting any failure once as a notice. */
export function runSessionAction(
  action: () => unknown,
  failureMessage: string,
): void {
  void (async () => {
    try {
      await action();
    } catch {
      new Notice(failureMessage);
    }
  })();
}

/**
 * Surface flags and callbacks that decide which session actions are offered. `active` manages
 * live sessions (pin/archive), `archived` manages archived ones (restore/delete), and no mode
 * keeps the compact history's rename/delete.
 */
export interface SessionActionOptions {
  sessionActionMode?: 'active' | 'archived';
  showOpenStateActions?: boolean;
  showInlinePinAction?: boolean;
  onSelectConversation: (id: string) => Promise<void>;
  onOpenConversationInNewTab?: (id: string, activate?: boolean) => Promise<void>;
  onAssignConversationToDevice?: (id: string) => Promise<void>;
  onSetLinkedContentPinned?: (contentPath: string, isPinned: boolean) => Promise<void>;
  onRerender: () => void;
}

export type SessionRowActionKind =
  | 'open-in-new-tab'
  | 'open-in-background-tab'
  | 'switch-to-open'
  | 'assign-device'
  | 'pin'
  | 'unpin'
  | 'rename'
  | 'archive'
  | 'restore'
  | 'delete';

export interface SessionRowAction {
  kind: SessionRowActionKind;
  /** Offered but unavailable, such as archiving a running session. */
  disabled: boolean;
}

/** Inline buttons sit on the row; the menu is its context menu. */
export type SessionRowActionSurface = 'inline' | 'menu';

export interface SessionRowActionInput {
  conversation: ConversationMeta;
  status: Pick<HistoryConversationStatus, 'openState' | 'isRunning'>;
  /** Rows presenting attention hide their inline management actions. */
  hasAttention: boolean;
}

/** A rendered row; its surface decides where the rename editor appears. */
export interface SessionRow extends SessionRowActionInput {
  beginRename: () => void;
}

const ROW_ACTION_TITLES: Readonly<Record<SessionRowActionKind, TranslationKey>> = {
  'open-in-new-tab': 'chat.sessions.openNewTab',
  'open-in-background-tab': 'chat.sessions.openBackgroundTab',
  'switch-to-open': 'chat.sessions.switchOpen',
  'assign-device': 'chat.sessions.assignDevice',
  pin: 'chat.sessions.pin',
  unpin: 'chat.sessions.unpin',
  rename: 'chat.sessions.rename',
  archive: 'chat.sessions.archive',
  restore: 'chat.sessions.restore',
  delete: 'common.delete',
};

const INLINE_BUTTONS: Readonly<Partial<Record<SessionRowActionKind, { cls: string; icon: string }>>> = {
  'open-in-new-tab': { cls: 'claudian-open-new-tab-btn', icon: 'square-plus' },
  'assign-device': { cls: 'claudian-assign-device-btn', icon: 'monitor-down' },
  pin: { cls: 'claudian-pin-btn', icon: 'pin' },
  unpin: { cls: 'claudian-pin-btn', icon: 'pin-off' },
  rename: { cls: '', icon: 'pencil' },
  archive: { cls: 'claudian-archive-btn', icon: 'archive' },
  restore: { cls: 'claudian-restore-btn', icon: 'undo-2' },
  delete: { cls: 'claudian-delete-btn', icon: 'trash-2' },
};

const ROW_ACTION_FAILURES: Readonly<Record<Exclude<SessionRowActionKind, 'rename'>, TranslationKey>> = {
  'open-in-new-tab': 'chat.errors.loadConversation',
  'open-in-background-tab': 'chat.errors.loadConversation',
  'switch-to-open': 'chat.errors.loadConversation',
  'assign-device': 'chat.errors.assignDevice',
  pin: 'chat.errors.pinSession',
  unpin: 'chat.errors.unpinSession',
  archive: 'chat.errors.archiveSession',
  restore: 'chat.errors.restoreSession',
  delete: 'chat.errors.deleteConversation',
};

function action(kind: SessionRowActionKind, disabled = false): SessionRowAction {
  return { kind, disabled };
}

/** The single policy for which actions a session row offers on each surface. */
export function resolveRowActions(
  surface: SessionRowActionSurface,
  input: SessionRowActionInput,
  options: SessionActionOptions,
): SessionRowAction[] {
  const { conversation, status } = input;
  const mode = options.sessionActionMode;
  const pinAction = action(conversation.isPinned === true ? 'unpin' : 'pin');
  // A running session cannot be archived; bulk actions skip it instead.
  const archiveAction = action('archive', status.isRunning);
  const actions: SessionRowAction[] = [];

  if (surface === 'inline') {
    if (status.openState === 'closed' && options.onOpenConversationInNewTab) {
      actions.push(action('open-in-new-tab'));
    }
    if (conversation.isLegacySession && options.onAssignConversationToDevice) {
      actions.push(action('assign-device'));
    }
    if (mode === 'active') {
      if (!input.hasAttention) {
        if (options.showInlinePinAction !== false) actions.push(pinAction);
        actions.push(archiveAction);
      }
    } else if (mode === 'archived') {
      actions.push(action('restore'), action('delete'));
    } else {
      actions.push(action('rename'), action('delete'));
    }
    return actions;
  }

  if (options.showOpenStateActions !== false && status.openState !== 'current') {
    if (status.openState === 'closed' && options.onOpenConversationInNewTab) {
      actions.push(action('open-in-new-tab'), action('open-in-background-tab'));
    } else if (status.openState === 'open') {
      actions.push(action('switch-to-open'));
    }
  }
  if (mode === 'archived') {
    actions.push(action('restore'), action('delete'));
    return actions;
  }
  if (mode === 'active') actions.push(pinAction);
  actions.push(action('rename'), mode === 'active' ? archiveAction : action('delete'));
  return actions;
}

/** Multi-selection exists only where a bulk action can act on it. */
export function canMultiSelect(options: SessionActionOptions): boolean {
  return options.sessionActionMode === 'archived' || options.sessionActionMode === 'active';
}

/** A session group: a Linked content section or a recency divider's sessions. */
export interface SessionGroupActionTarget {
  conversations: readonly ConversationMeta[];
  linkedContent?: {
    path: string;
    kind: SessionListSectionKind;
    isPinned: boolean;
  };
}

export interface SessionActionsDeps {
  plugin: Pick<ChatFeatureHost, 'app' | 'getConversationList' | 'conversationLifecycle'>;
  selection: SessionMultiSelection;
}

function sessionCount(count: number): string {
  return t('chat.sessions.count', { count, unit: count === 1 ? 'session' : 'sessions' });
}

/** Offers and runs session actions for rows, multi-selections, and groups. */
export class SessionActions {
  constructor(private readonly deps: SessionActionsDeps) {}

  renderRowButtons(
    actionsEl: HTMLElement,
    row: SessionRow,
    options: SessionActionOptions,
  ): void {
    for (const rowAction of resolveRowActions('inline', row, options)) {
      const presentation = INLINE_BUTTONS[rowAction.kind];
      if (!presentation) continue;
      const button = actionsEl.createEl('button', {
        cls: ['claudian-action-btn', presentation.cls].filter(Boolean).join(' '),
        attr: { type: 'button' },
      });
      setIcon(button, presentation.icon);
      button.setAttribute(
        'aria-label',
        rowAction.kind === 'archive' && rowAction.disabled
          ? t('chat.sessions.cannotArchiveRunning')
          : t(ROW_ACTION_TITLES[rowAction.kind]),
      );
      if (rowAction.disabled) {
        button.setAttribute('disabled', '');
        continue;
      }
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.#runRowAction(rowAction.kind, row, options);
      });
    }
  }

  rowMenu(row: SessionRow, options: SessionActionOptions): Menu {
    const menu = new Menu().setUseNativeMenu(false);
    for (const rowAction of resolveRowActions('menu', row, options)) {
      menu.addItem((menuItem) => {
        menuItem.setTitle(t(ROW_ACTION_TITLES[rowAction.kind]));
        if (rowAction.disabled) {
          menuItem.setDisabled(true);
          return;
        }
        menuItem.onClick(() => {
          this.#runRowAction(rowAction.kind, row, options);
        });
      });
    }
    return menu;
  }

  /** Bulk actions for the selected sessions of the current scope; running sessions are skipped. */
  selectionMenu(
    options: SessionActionOptions,
    isRunning: (conversation: ConversationMeta) => boolean,
  ): Menu {
    const { selection } = this.deps;
    const lifecycle = this.deps.plugin.conversationLifecycle;
    const isArchivedView = options.sessionActionMode === 'archived';
    const selected = this.deps.plugin.getConversationList()
      .filter(conversation => (
        selection.has(conversation.id)
        && (conversation.isArchived === true) === isArchivedView
      ));
    const menu = new Menu().setUseNativeMenu(false);

    if (isArchivedView) {
      const ids = selected.map(conversation => conversation.id);
      menu.addItem(menuItem => menuItem
        .setTitle(t('chat.sessions.restoreCount', { count: sessionCount(ids.length) }))
        .onClick(() => {
          selection.clear();
          runSessionAction(() => lifecycle.restore(ids), t('chat.errors.restoreSessions'));
        }));
      menu.addItem(menuItem => menuItem
        .setTitle(t('chat.sessions.deleteCount', { count: sessionCount(ids.length) }))
        .onClick(() => {
          selection.clear();
          runSessionAction(
            () => this.deleteSessions(ids, { confirm: true, rerender: options.onRerender }),
            t('chat.errors.deleteSessions'),
          );
        }));
      return menu;
    }

    if (options.sessionActionMode === 'active') {
      const unpinnedIds = selected
        .filter(conversation => !conversation.isPinned)
        .map(conversation => conversation.id);
      const isPinning = unpinnedIds.length > 0;
      const pinIds = isPinning ? unpinnedIds : selected.map(conversation => conversation.id);
      menu.addItem(menuItem => menuItem
        .setTitle(`${isPinning ? t('chat.sessions.pin') : t('chat.sessions.unpin')} ${sessionCount(pinIds.length)}`)
        .onClick(() => {
          selection.clear();
          runSessionAction(
            () => lifecycle.setPinned(pinIds, isPinning),
            isPinning ? t('chat.errors.pinSessions') : t('chat.errors.unpinSessions'),
          );
        }));
    }

    const archivableIds = selected
      .filter(conversation => !isRunning(conversation))
      .map(conversation => conversation.id);
    menu.addItem((menuItem) => {
      menuItem
        .setTitle(t('chat.sessions.archiveCount', { count: sessionCount(archivableIds.length) }))
        .setDisabled(archivableIds.length === 0);
      if (archivableIds.length > 0 && options.sessionActionMode === 'active') {
        menuItem.onClick(() => {
          selection.clear();
          runSessionAction(
            () => lifecycle.archive(archivableIds),
            t('chat.errors.archiveSessions'),
          );
        });
      }
    });
    return menu;
  }

  /**
   * Builds the group's action menu on demand, or returns null when the group offers none.
   * Linked content may be pinned; active groups archive their idle sessions; archived groups
   * restore or permanently delete every session.
   */
  groupMenu(
    target: SessionGroupActionTarget,
    options: SessionActionOptions,
    isRunning: (conversation: ConversationMeta) => boolean,
  ): (() => Menu) | null {
    const { conversations, linkedContent } = target;
    const { onSetLinkedContentPinned } = options;
    const lifecycle = this.deps.plugin.conversationLifecycle;
    const isArchivedView = options.sessionActionMode === 'archived';
    const canTogglePin = !!(
      linkedContent
      && onSetLinkedContentPinned
      && !isArchivedView
      && (linkedContent.kind === 'content' || linkedContent.kind === 'missing' || linkedContent.isPinned)
    );
    const canArchive = options.sessionActionMode === 'active';
    if (!canTogglePin && !canArchive && !isArchivedView) return null;

    return () => {
      const menu = new Menu().setUseNativeMenu(false);
      if (canTogglePin && linkedContent && onSetLinkedContentPinned) {
        const { path, isPinned } = linkedContent;
        menu.addItem(menuItem => menuItem
          .setTitle(isPinned ? t('chat.sessions.unpinContent') : t('chat.sessions.pinContent'))
          .onClick(() => {
            runSessionAction(
              () => onSetLinkedContentPinned(path, !isPinned),
              isPinned ? t('chat.errors.unpinContent') : t('chat.errors.pinContent'),
            );
          }));
      }
      if (canArchive) {
        if (canTogglePin) menu.addSeparator();
        const archivableIds = conversations
          .filter(conversation => !isRunning(conversation))
          .map(conversation => conversation.id);
        const failureMessage = linkedContent
          ? t('chat.errors.archiveContent')
          : t('chat.errors.archiveSessions');
        menu.addItem((menuItem) => {
          menuItem
            .setTitle(t('chat.sessions.archiveAll'))
            .setDisabled(archivableIds.length === 0);
          if (archivableIds.length > 0) {
            menuItem.onClick(() => {
              runSessionAction(() => lifecycle.archive(archivableIds), failureMessage);
            });
          }
        });
      }
      if (isArchivedView) {
        this.#addRestoreAndDeleteAll(menu, conversations, options);
      }
      return menu;
    };
  }

  /**
   * Deletes sessions, after one confirmation when requested. The conversation lifecycle owns the
   * running guard.
   */
  async deleteSessions(
    conversationIds: readonly string[],
    options: { confirm: boolean; rerender: () => void },
  ): Promise<void> {
    const { plugin } = this.deps;
    if (!options.confirm) {
      await plugin.conversationLifecycle.delete(conversationIds);
      options.rerender();
      return;
    }

    const count = conversationIds.length;
    const confirmed = await confirmDelete(
      plugin.app,
      t('chat.sessions.confirmDelete', { count: sessionCount(count) }),
    );
    if (!confirmed) return;

    try {
      await plugin.conversationLifecycle.delete(conversationIds);
    } finally {
      options.rerender();
    }
  }

  #addRestoreAndDeleteAll(
    menu: Menu,
    conversations: readonly ConversationMeta[],
    options: SessionActionOptions,
  ): void {
    const ids = conversations.map(conversation => conversation.id);
    const lifecycle = this.deps.plugin.conversationLifecycle;
    menu.addItem(menuItem => menuItem
      .setTitle(t('chat.sessions.restoreAll'))
      .setDisabled(ids.length === 0)
      .onClick(() => {
        runSessionAction(() => lifecycle.restore(ids), t('chat.errors.restoreSessions'));
      }));
    menu.addItem(menuItem => menuItem
      .setTitle(t('chat.sessions.deleteAll'))
      .setDisabled(ids.length === 0)
      .onClick(() => {
        runSessionAction(
          () => this.deleteSessions(ids, { confirm: true, rerender: options.onRerender }),
          t('chat.errors.deleteSessions'),
        );
      }));
  }

  #runRowAction(kind: SessionRowActionKind, row: SessionRow, options: SessionActionOptions): void {
    const { id } = row.conversation;
    if (kind === 'rename') {
      row.beginRename();
      return;
    }
    const failureMessage = t(ROW_ACTION_FAILURES[kind]);
    runSessionAction((): Promise<void> | undefined => {
      switch (kind) {
        case 'open-in-new-tab':
          return options.onOpenConversationInNewTab?.(id, true);
        case 'open-in-background-tab':
          return options.onOpenConversationInNewTab?.(id, false);
        case 'switch-to-open':
          return options.onSelectConversation(id);
        case 'assign-device':
          return options.onAssignConversationToDevice?.(id);
        case 'pin':
        case 'unpin':
          return this.deps.plugin.conversationLifecycle.setPinned([id], kind === 'pin');
        case 'archive':
        case 'restore':
          return this.deps.plugin.conversationLifecycle.setArchived(id, kind === 'archive');
        case 'delete':
          return this.deleteSessions([id], { confirm: false, rerender: options.onRerender });
      }
    }, failureMessage);
  }
}
