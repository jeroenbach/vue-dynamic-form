import type { Mail, Rule } from '../inboxRoutingMath';
import { describe, expect, it } from 'vitest';
import { findUnreachableRules, matches } from '../inboxRoutingMath';
import { fromSenderRule, hasAttachmentRule, largerThanRule, subjectContainsRule } from '../inboxRoutingMath.fixtures';

function mail(overrides: Partial<Mail> = {}): Mail {
  return {
    key: 'mail',
    from: 'someone@example.com',
    subject: 'Hello there',
    sizeBytes: 1024,
    sizeLabel: '1 KB',
    hasAttachment: false,
    ...overrides,
  };
}

describe('matches: From sender', () => {
  it('matches an exact sender address', () => {
    expect(matches(fromSenderRule({ email: 'billing@cloudhost.example' }), mail({ from: 'billing@cloudhost.example' }))).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(matches(fromSenderRule({ email: 'BILLING@CLOUDHOST.EXAMPLE' }), mail({ from: 'billing@cloudhost.example' }))).toBe(true);
  });

  it('matches any address on a given @domain', () => {
    expect(matches(fromSenderRule({ email: '@cloudhost.example' }), mail({ from: 'billing@cloudhost.example' }))).toBe(true);
  });

  it('does not match a different domain', () => {
    expect(matches(fromSenderRule({ email: '@cloudhost.example' }), mail({ from: 'billing@otherhost.example' }))).toBe(false);
  });

  it('does not match a different exact address', () => {
    expect(matches(fromSenderRule({ email: 'billing@cloudhost.example' }), mail({ from: 'someone.else@cloudhost.example' }))).toBe(false);
  });
});

describe('matches: Subject contains', () => {
  it('matches a substring anywhere in the subject', () => {
    expect(matches(subjectContainsRule({ text: 'Invoice' }), mail({ subject: 'Invoice #4821 attached' }))).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(matches(subjectContainsRule({ text: 'invoice' }), mail({ subject: 'INVOICE #4821 ATTACHED' }))).toBe(true);
  });

  it('does not match when the substring is absent', () => {
    expect(matches(subjectContainsRule({ text: 'Invoice' }), mail({ subject: 'Your Monday digest' }))).toBe(false);
  });
});

describe('matches: Larger than', () => {
  it('does not match a message exactly at the threshold', () => {
    expect(matches(largerThanRule({ size: 1, unit: 'KB' }), mail({ sizeBytes: 1024 }))).toBe(false);
  });

  it('matches a message one byte over the threshold', () => {
    expect(matches(largerThanRule({ size: 1, unit: 'KB' }), mail({ sizeBytes: 1025 }))).toBe(true);
  });

  it('converts a KB threshold to bytes', () => {
    expect(matches(largerThanRule({ size: 300, unit: 'KB' }), mail({ sizeBytes: 340 * 1024 }))).toBe(true);
    expect(matches(largerThanRule({ size: 400, unit: 'KB' }), mail({ sizeBytes: 340 * 1024 }))).toBe(false);
  });

  it('converts an MB threshold to bytes', () => {
    expect(matches(largerThanRule({ size: 1, unit: 'MB' }), mail({ sizeBytes: Math.round(2.4 * 1024 * 1024) }))).toBe(true);
    expect(matches(largerThanRule({ size: 3, unit: 'MB' }), mail({ sizeBytes: Math.round(2.4 * 1024 * 1024) }))).toBe(false);
  });
});

describe('matches: Has attachment', () => {
  it('matches a message that carries an attachment', () => {
    expect(matches(hasAttachmentRule(), mail({ hasAttachment: true }))).toBe(true);
  });

  it('does not match a message with no attachment', () => {
    expect(matches(hasAttachmentRule(), mail({ hasAttachment: false }))).toBe(false);
  });

  it('ignores any value on the rule itself, since it has none of its own', () => {
    expect(matches({ ...hasAttachmentRule(), email: 'irrelevant@example.com' }, mail({ hasAttachment: true }))).toBe(true);
  });
});

describe('matches: empty rule value matches nothing', () => {
  it('an unfilled From sender rule never matches', () => {
    expect(matches(fromSenderRule({ email: undefined }), mail({ from: 'anyone@example.com' }))).toBe(false);
    expect(matches(fromSenderRule({ email: '' }), mail({ from: 'anyone@example.com' }))).toBe(false);
  });

  it('an unfilled Subject contains rule never matches', () => {
    expect(matches(subjectContainsRule({ text: undefined }), mail({ subject: 'anything at all' }))).toBe(false);
    expect(matches(subjectContainsRule({ text: '' }), mail({ subject: 'anything at all' }))).toBe(false);
  });

  it('an unfilled Larger than rule never matches', () => {
    expect(matches(largerThanRule({ size: undefined, unit: 'KB' }), mail({ sizeBytes: Number.MAX_SAFE_INTEGER }))).toBe(false);
  });
});

describe('findUnreachableRules: Has attachment exact duplicate', () => {
  it('flags the later of two identical Has attachment rules', () => {
    const earlier = hasAttachmentRule({ key: 'hasAttachment[0]', order: 1 });
    const later = hasAttachmentRule({ key: 'hasAttachment[1]', order: 2 });
    expect(findUnreachableRules([earlier, later])).toEqual(new Map([['hasAttachment[1]', 'hasAttachment[0]']]));
  });

  it('names the earliest subsuming rule when more than one earlier rule would qualify', () => {
    const first = hasAttachmentRule({ key: 'hasAttachment[0]', order: 1 });
    const second = hasAttachmentRule({ key: 'hasAttachment[1]', order: 2 });
    const third = hasAttachmentRule({ key: 'hasAttachment[2]', order: 3 });
    const result = findUnreachableRules([first, second, third]);
    expect(result.get('hasAttachment[1]')).toBe('hasAttachment[0]');
    expect(result.get('hasAttachment[2]')).toBe('hasAttachment[0]');
  });
});

describe('findUnreachableRules: From sender', () => {
  it('flags a full address covered by an earlier @domain rule', () => {
    const earlier = fromSenderRule({ key: 'fromSender[0]', order: 1, email: '@example.com' });
    const later = fromSenderRule({ key: 'fromSender[1]', order: 2, email: 'billing@example.com' });
    expect(findUnreachableRules([earlier, later]).get('fromSender[1]')).toBe('fromSender[0]');
  });

  it('does not flag either rule in the reverse order, since a full address does not subsume a domain', () => {
    const earlier = fromSenderRule({ key: 'fromSender[0]', order: 1, email: 'billing@example.com' });
    const later = fromSenderRule({ key: 'fromSender[1]', order: 2, email: '@example.com' });
    expect(findUnreachableRules([earlier, later]).size).toBe(0);
  });

  it('flags an exact same-value duplicate, case-insensitively', () => {
    const earlier = fromSenderRule({ key: 'fromSender[0]', order: 1, email: 'Billing@Example.com' });
    const later = fromSenderRule({ key: 'fromSender[1]', order: 2, email: 'billing@example.com' });
    expect(findUnreachableRules([earlier, later]).get('fromSender[1]')).toBe('fromSender[0]');
  });

  it('does not flag when the earlier rule is unfilled', () => {
    const earlier = fromSenderRule({ key: 'fromSender[0]', order: 1, email: undefined });
    const later = fromSenderRule({ key: 'fromSender[1]', order: 2, email: 'billing@example.com' });
    expect(findUnreachableRules([earlier, later]).size).toBe(0);
  });
});

describe('findUnreachableRules: Subject contains', () => {
  it('flags a later value that contains the earlier value as a substring', () => {
    const earlier = subjectContainsRule({ key: 'subjectContains[0]', order: 1, text: 'Invoice' });
    const later = subjectContainsRule({ key: 'subjectContains[1]', order: 2, text: 'Invoice #4821' });
    expect(findUnreachableRules([earlier, later]).get('subjectContains[1]')).toBe('subjectContains[0]');
  });

  it('does not flag when the later value is not a superset of the earlier one', () => {
    const earlier = subjectContainsRule({ key: 'subjectContains[0]', order: 1, text: 'Invoice #4821' });
    const later = subjectContainsRule({ key: 'subjectContains[1]', order: 2, text: 'Invoice' });
    expect(findUnreachableRules([earlier, later]).size).toBe(0);
  });

  it('does not flag when the earlier rule is unfilled', () => {
    const earlier = subjectContainsRule({ key: 'subjectContains[0]', order: 1, text: undefined });
    const later = subjectContainsRule({ key: 'subjectContains[1]', order: 2, text: 'Invoice' });
    expect(findUnreachableRules([earlier, later]).size).toBe(0);
  });
});

describe('findUnreachableRules: Larger than', () => {
  it('flags a higher later threshold in the same unit', () => {
    const earlier = largerThanRule({ key: 'largerThan[0]', order: 1, size: 1, unit: 'MB' });
    const later = largerThanRule({ key: 'largerThan[1]', order: 2, size: 2, unit: 'MB' });
    expect(findUnreachableRules([earlier, later]).get('largerThan[1]')).toBe('largerThan[0]');
  });

  it('flags an equal threshold across units after byte conversion', () => {
    const earlier = largerThanRule({ key: 'largerThan[0]', order: 1, size: 1024, unit: 'KB' });
    const later = largerThanRule({ key: 'largerThan[1]', order: 2, size: 1, unit: 'MB' });
    expect(findUnreachableRules([earlier, later]).get('largerThan[1]')).toBe('largerThan[0]');
  });

  it('does not flag a lower later threshold, since messages in between still reach it', () => {
    const earlier = largerThanRule({ key: 'largerThan[0]', order: 1, size: 2, unit: 'MB' });
    const later = largerThanRule({ key: 'largerThan[1]', order: 2, size: 1, unit: 'MB' });
    expect(findUnreachableRules([earlier, later]).size).toBe(0);
  });

  it('does not flag when the earlier rule is unfilled', () => {
    const earlier = largerThanRule({ key: 'largerThan[0]', order: 1, size: undefined, unit: 'MB' });
    const later = largerThanRule({ key: 'largerThan[1]', order: 2, size: 1, unit: 'MB' });
    expect(findUnreachableRules([earlier, later]).size).toBe(0);
  });
});

describe('findUnreachableRules: no cross-type subsumption', () => {
  it('never flags a From sender rule against a Has attachment rule that would overlap', () => {
    const fromSender = fromSenderRule({ key: 'fromSender[0]', order: 1, email: '@example.com' });
    const hasAttachment = hasAttachmentRule({ key: 'hasAttachment[0]', order: 2 });
    expect(findUnreachableRules([fromSender, hasAttachment]).size).toBe(0);
  });

  it('never flags a Subject contains rule against a Larger than rule that would overlap', () => {
    const subjectContains = subjectContainsRule({ key: 'subjectContains[0]', order: 1, text: 'export' });
    const largerThan = largerThanRule({ key: 'largerThan[0]', order: 2, size: 1, unit: 'MB' });
    expect(findUnreachableRules([subjectContains, largerThan]).size).toBe(0);
  });
});

describe('findUnreachableRules: edge cases', () => {
  it('returns an empty map for zero or one rule', () => {
    expect(findUnreachableRules([]).size).toBe(0);
    expect(findUnreachableRules([hasAttachmentRule({ key: 'hasAttachment[0]', order: 1 })]).size).toBe(0);
  });

  it('flags every rule in a subsumption chain, not only the last one', () => {
    // Has attachment rules always subsume each other, so this also exercises "A alone subsumes
    // both B and C": the earliest rule (A) is named for both, per the lowest-order tie-break.
    const a = hasAttachmentRule({ key: 'hasAttachment[0]', order: 1 });
    const b = hasAttachmentRule({ key: 'hasAttachment[1]', order: 2 });
    const c = hasAttachmentRule({ key: 'hasAttachment[2]', order: 3 });
    const result = findUnreachableRules([a, b, c]);
    expect(result.get('hasAttachment[1]')).toBe('hasAttachment[0]');
    expect(result.get('hasAttachment[2]')).toBe('hasAttachment[0]');
  });

  it('does not mutate its input', () => {
    const rules: Rule[] = [
      hasAttachmentRule({ key: 'hasAttachment[0]', order: 2 }),
      hasAttachmentRule({ key: 'hasAttachment[1]', order: 1 }),
    ];
    const snapshot = rules.map(rule => ({ ...rule }));
    findUnreachableRules(rules);
    expect(rules).toEqual(snapshot);
  });
});
