import type { Rule } from '../inboxRoutingMath';
import { describe, expect, it } from 'vitest';
import { collectRules, destinationLabel, matches, planReorderSwap, routeInbox, TEST_INBOX } from '../inboxRoutingMath';

describe('collectRules', () => {
  it('flattens every branch into one list, ordered by each occurrence\'s own order', () => {
    const rules = collectRules({
      fromSender: [{ order: 2, email: 'a@example.com' }],
      subjectContains: [{ order: 1, text: 'Invoice' }],
    });
    expect(rules.map(rule => rule.key)).toEqual(['subjectContains[0]', 'fromSender[0]']);
    expect(rules.map(rule => rule.order)).toEqual([1, 2]);
  });

  it('falls back to the occurrence\'s own array position plus one when order is missing', () => {
    const rules = collectRules({ hasAttachment: [{}, {}] });
    expect(rules.map(rule => rule.order)).toEqual([1, 2]);
  });

  it('returns an empty list for an undefined or empty rules container', () => {
    expect(collectRules(undefined)).toEqual([]);
    expect(collectRules({})).toEqual([]);
  });

  it('treats a null array entry as an empty rule instead of throwing', () => {
    const rules = collectRules({ hasAttachment: [null] });
    expect(rules).toEqual([{ key: 'hasAttachment[0]', branchKey: 'hasAttachment', order: 1 }]);
  });
});

/** The prototype's four authored rules, in their initial order. Not live host state: see the story notes. */
function initialRules(): Rule[] {
  return [
    { key: 'fromSender[0]', branchKey: 'fromSender', order: 1, email: 'newsletter@weeklydigest.example', action: 'label', label: 'Newsletters' },
    { key: 'largerThan[0]', branchKey: 'largerThan', order: 2, size: 1, unit: 'MB', action: 'folder', folder: 'Large files' },
    { key: 'hasAttachment[0]', branchKey: 'hasAttachment', order: 3, action: 'folder', folder: 'Attachments' },
    { key: 'subjectContains[0]', branchKey: 'subjectContains', order: 4, text: 'Invoice', action: 'forward', forwardTo: 'accounting@mycompany.example' },
  ];
}

describe('routeInbox', () => {
  it('routes the fixed six-message inbox against the initial rule order: three matched, three not', () => {
    const routed = routeInbox(initialRules(), TEST_INBOX);
    const matched = routed.filter(entry => entry.rule);
    const unmatched = routed.filter(entry => !entry.rule);
    expect(matched).toHaveLength(3);
    expect(unmatched).toHaveLength(3);

    const invoice = routed.find(entry => entry.mail.key === 'invoice')!;
    expect(invoice.rule?.branchKey).toBe('hasAttachment');
    expect(invoice.ruleDisplayPosition).toBe(3);

    // The reorder teaching case: a later rule would also have caught the same message.
    const subjectRule = initialRules().find(rule => rule.branchKey === 'subjectContains')!;
    expect(matches(subjectRule, invoice.mail)).toBe(true);
  });

  it('leaves every message unmatched when there are no rules', () => {
    const routed = routeInbox([], TEST_INBOX);
    expect(routed.every(entry => !entry.rule)).toBe(true);
  });

  it('flips a message from matched to unmatched once its sole catching rule is removed', () => {
    // newsletter is only caught by the From sender rule, unlike invoice which two rules would catch.
    const rules = initialRules();
    const withRule = routeInbox(rules, TEST_INBOX).find(entry => entry.mail.key === 'newsletter');
    const withoutRule = routeInbox(rules.filter(rule => rule.branchKey !== 'fromSender'), TEST_INBOX).find(entry => entry.mail.key === 'newsletter');
    expect(withRule?.rule).toBeDefined();
    expect(withoutRule?.rule).toBeUndefined();
  });

  it('reorder payoff: moving the Subject contains rule above Has attachment changes the invoice\'s destination', () => {
    const before = routeInbox(initialRules(), TEST_INBOX).find(entry => entry.mail.key === 'invoice')!;
    expect(before.rule?.branchKey).toBe('hasAttachment');
    expect(before.rule?.folder).toBe('Attachments');

    const swap = planReorderSwap(initialRules(), 'subjectContains[0]', 'up')!;
    const reordered = initialRules()
      .map((rule) => {
        const write = swap.find(entry => entry.key === rule.key);
        return write ? { ...rule, order: write.order } : rule;
      })
      // routeInbox walks its input in the order given, mirroring how the live form always feeds
      // it collectRules' already order-sorted output, never a raw, unsorted array.
      .sort((a, b) => a.order - b.order);

    const after = routeInbox(reordered, TEST_INBOX).find(entry => entry.mail.key === 'invoice')!;
    expect(after.rule?.branchKey).toBe('subjectContains');
    expect(after.rule?.forwardTo).toBe('accounting@mycompany.example');
  });
});

describe('destinationLabel', () => {
  it('names the folder for a folder action with a filled-in folder name', () => {
    expect(destinationLabel({ key: 'r', branchKey: 'hasAttachment', order: 1, action: 'folder', folder: 'Attachments' })).toBe('Folder "Attachments"');
  });

  it('names the label for a label action with a filled-in label name', () => {
    expect(destinationLabel({ key: 'r', branchKey: 'hasAttachment', order: 1, action: 'label', label: 'Newsletters' })).toBe('Label "Newsletters"');
  });

  it('names the forward address for a forward action with a filled-in address', () => {
    expect(destinationLabel({ key: 'r', branchKey: 'hasAttachment', order: 1, action: 'forward', forwardTo: 'accounting@mycompany.example' })).toBe('Forward to accounting@mycompany.example');
  });

  it('reads as Delete for a delete action, which has no companion field', () => {
    expect(destinationLabel({ key: 'r', branchKey: 'hasAttachment', order: 1, action: 'delete' })).toBe('Delete');
  });

  it('falls back to a plain Matched when the companion field is undefined', () => {
    expect(destinationLabel({ key: 'r', branchKey: 'hasAttachment', order: 1, action: 'folder', folder: undefined })).toBe('Matched');
    expect(destinationLabel({ key: 'r', branchKey: 'hasAttachment', order: 1, action: 'forward', forwardTo: undefined })).toBe('Matched');
  });

  it('falls back to a plain Matched when the companion field is an empty or blank string', () => {
    expect(destinationLabel({ key: 'r', branchKey: 'hasAttachment', order: 1, action: 'label', label: '' })).toBe('Matched');
    expect(destinationLabel({ key: 'r', branchKey: 'hasAttachment', order: 1, action: 'folder', folder: '   ' })).toBe('Matched');
  });

  it('falls back to a plain Matched when no action has been chosen yet', () => {
    expect(destinationLabel({ key: 'r', branchKey: 'hasAttachment', order: 1 })).toBe('Matched');
  });

  it('falls back to a plain Matched when there is no rule at all', () => {
    expect(destinationLabel(undefined)).toBe('Matched');
  });
});

describe('planReorderSwap', () => {
  it('returns null when moving the first rule up', () => {
    expect(planReorderSwap(initialRules(), 'fromSender[0]', 'up')).toBeNull();
  });

  it('returns null when moving the last rule down', () => {
    expect(planReorderSwap(initialRules(), 'subjectContains[0]', 'down')).toBeNull();
  });

  it('disables both directions on the only rule in a one-rule list', () => {
    const single = initialRules().slice(0, 1);
    expect(planReorderSwap(single, single[0].key, 'up')).toBeNull();
    expect(planReorderSwap(single, single[0].key, 'down')).toBeNull();
  });

  it('swaps a rule with its order-sorted neighbor, not a raw array neighbor', () => {
    const swap = planReorderSwap(initialRules(), 'largerThan[0]', 'down')!;
    expect(swap).toEqual([
      { key: 'largerThan[0]', order: 3 },
      { key: 'hasAttachment[0]', order: 2 },
    ]);
  });

  it('finds the correct neighbor when order values are not contiguous, e.g. after a removal', () => {
    const rules: Rule[] = [
      { key: 'fromSender[0]', branchKey: 'fromSender', order: 1 },
      { key: 'largerThan[0]', branchKey: 'largerThan', order: 5 },
      { key: 'hasAttachment[0]', branchKey: 'hasAttachment', order: 9 },
    ];
    const swap = planReorderSwap(rules, 'hasAttachment[0]', 'up')!;
    expect(swap).toEqual([
      { key: 'hasAttachment[0]', order: 5 },
      { key: 'largerThan[0]', order: 9 },
    ]);
  });
});
