import type { Rule } from './inboxRoutingMath';

/** Small builders for hand-authored rule fixtures, one per branch, used across the test files. */

export function fromSenderRule(overrides: Partial<Rule> = {}): Rule {
  return { key: 'fromSender[0]', branchKey: 'fromSender', order: 1, ...overrides };
}

export function subjectContainsRule(overrides: Partial<Rule> = {}): Rule {
  return { key: 'subjectContains[0]', branchKey: 'subjectContains', order: 1, ...overrides };
}

export function largerThanRule(overrides: Partial<Rule> = {}): Rule {
  return { key: 'largerThan[0]', branchKey: 'largerThan', order: 1, ...overrides };
}

export function hasAttachmentRule(overrides: Partial<Rule> = {}): Rule {
  return { key: 'hasAttachment[0]', branchKey: 'hasAttachment', order: 1, ...overrides };
}
