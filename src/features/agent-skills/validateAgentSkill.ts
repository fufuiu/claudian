import type { AgentSkillInput } from '@/features/agent-skills/AgentSkill';
import { t } from '@/i18n/i18n';

const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;
const PORTABLE_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YAML_RESERVED_NAMES = new Set(['true', 'false', 'null', 'yes', 'no', 'on', 'off']);

export type AgentSkillValidationField = 'name' | 'description' | 'instructions';

export class AgentSkillValidationError extends Error {
  constructor(
    readonly field: AgentSkillValidationField,
    message: string,
  ) {
    super(message);
    this.name = 'AgentSkillValidationError';
  }
}

export function validateAgentSkillName(name: string, label = t('settings.agentSkills.modal.name')): string | null {
  if (!name) {
    return t('settings.agentSkills.errors.nameRequired', { label });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return t('settings.agentSkills.errors.nameLength', { label, max: MAX_NAME_LENGTH });
  }
  if (!PORTABLE_NAME_PATTERN.test(name)) {
    return t('settings.agentSkills.errors.nameFormat', { label });
  }
  if (YAML_RESERVED_NAMES.has(name)) {
    return t('settings.agentSkills.errors.reserved', { label });
  }
  return null;
}

/** Every field error, in name, description, instructions order. */
export function collectAgentSkillInputErrors(input: AgentSkillInput): AgentSkillValidationError[] {
  const errors: AgentSkillValidationError[] = [];
  const nameError = validateAgentSkillName(input.name);
  if (nameError) {
    errors.push(new AgentSkillValidationError('name', nameError));
  }

  const description = input.description.trim();
  if (!description) {
    errors.push(new AgentSkillValidationError('description', t('settings.agentSkills.errors.descriptionRequired')));
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(new AgentSkillValidationError(
      'description',
      t('settings.agentSkills.errors.descriptionLength', { max: MAX_DESCRIPTION_LENGTH }),
    ));
  }

  if (!input.instructions.trim()) {
    errors.push(new AgentSkillValidationError('instructions', t('settings.agentSkills.errors.instructionsRequired')));
  }
  return errors;
}

export function validateAgentSkillInput(input: AgentSkillInput): void {
  const [first] = collectAgentSkillInputErrors(input);
  if (first) throw first;
}
