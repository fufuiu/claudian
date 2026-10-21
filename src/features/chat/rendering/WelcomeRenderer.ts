import { t } from '@/i18n/i18n';

const WELCOME_BRAND_NAME = 'Claudian';

export function renderWelcomeContent(
  welcomeEl: HTMLElement,
  greeting?: string,
): void {
  welcomeEl.empty();
  welcomeEl.createDiv({
    cls: 'claudian-welcome-brand claudian-welcome-text',
    text: WELCOME_BRAND_NAME,
  });

  if (greeting) {
    welcomeEl.createDiv({
      cls: 'claudian-welcome-greeting claudian-welcome-text',
      text: greeting,
    });
  }

  welcomeEl.createDiv({ cls: 'claudian-welcome-linked-content' });
}

export function createWelcomeElement(
  parentEl: HTMLElement,
  greeting?: string,
): HTMLElement {
  const welcomeEl = parentEl.createDiv({ cls: 'claudian-welcome' });
  renderWelcomeContent(welcomeEl, greeting);
  return welcomeEl;
}

/**
 * Picks a welcome greeting for the day and hour of `now`, personalized when a name is set.
 * `random` is a number in [0, 1) that selects among the candidates.
 */
export function pickWelcomeGreeting(name: string | undefined, now: Date, random: number): string {
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday

  const personalize = (base: string, noNameFallback?: string): string =>
    name ? t('chat.greetings.personalized', { greeting: base, name }) : (noNameFallback ?? base);

  const dayGreetings: Record<number, string[]> = {
    0: [personalize(t('chat.greetings.sunday')), t('chat.greetings.sundaySession'), t('chat.greetings.weekend')],
    1: [personalize(t('chat.greetings.monday')), personalize(t('chat.greetings.backAtIt'), t('chat.greetings.backAtItBang'))],
    2: [personalize(t('chat.greetings.tuesday'))],
    3: [personalize(t('chat.greetings.wednesday'))],
    4: [personalize(t('chat.greetings.thursday'))],
    5: [personalize(t('chat.greetings.friday')), personalize(t('chat.greetings.fridayFeeling'))],
    6: [personalize(t('chat.greetings.saturday'), t('chat.greetings.saturdayBang')), personalize(t('chat.greetings.weekend'))],
  };

  const timeGreetings = (): string[] => {
    if (hour >= 5 && hour < 12) {
      return [personalize(t('chat.greetings.morning')), t('chat.greetings.coffee')];
    } else if (hour >= 12 && hour < 18) {
      return [personalize(t('chat.greetings.afternoon')), personalize(t('chat.greetings.hey')), personalize(t('chat.greetings.howGoing')) + '?'];
    } else if (hour >= 18 && hour < 22) {
      return [personalize(t('chat.greetings.evening')), personalize(t('chat.greetings.eveningShort')), personalize(t('chat.greetings.yourDay')) + '?'];
    }
    return [t('chat.greetings.nightOwl'), personalize(t('chat.greetings.eveningShort'))];
  };

  const generalGreetings = [
    personalize(t('chat.greetings.hey')),
    name ? t('chat.greetings.hiName', { name }) : t('chat.greetings.hi'),
    personalize(t('chat.greetings.howGoing')) + '?',
    personalize(t('chat.greetings.welcomeBack')) + '!',
    personalize(t('chat.greetings.whatsNew')) + '?',
    ...(name ? [t('chat.greetings.returns', { name })] : []),
    t('chat.greetings.right'),
  ];

  const greetings = [
    ...(dayGreetings[day] || []),
    ...timeGreetings(),
    ...generalGreetings,
  ];

  return greetings[Math.floor(random * greetings.length)];
}
