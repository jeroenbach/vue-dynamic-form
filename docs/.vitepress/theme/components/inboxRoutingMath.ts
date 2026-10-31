/**
 * Pure routing logic for the inbox rules example. Kept free of any form or component dependency
 * so the matching and reordering math can be reasoned about, and tested, entirely on its own.
 */

export type RuleBranchKey = 'fromSender' | 'subjectContains' | 'largerThan' | 'hasAttachment';

/** One rule, flattened out of its branch array and tagged with its own persisted order. */
export interface Rule {
  /** Stable, branch-scoped key, e.g. 'subjectContains[2]'. */
  key: string
  branchKey: RuleBranchKey
  order: number
  email?: string
  text?: string
  size?: number
  unit?: string
  action?: string
  folder?: string
  label?: string
  forwardTo?: string
}

export interface Mail {
  key: string
  from: string
  subject: string
  sizeBytes: number
  /** Shown next to the size in the inbox rail, e.g. '340 KB'. Display only, never read by matches(). */
  sizeLabel: string
  hasAttachment: boolean
}

export interface RoutedMail {
  mail: Mail
  rule?: Rule
  /** The catching rule's 1-based position within the rules array that was routed against. */
  ruleDisplayPosition?: number
}

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;

/** The six fixed demo messages. Entirely fictional, authored only for this page. */
export const TEST_INBOX: Mail[] = [
  {
    key: 'newsletter',
    from: 'newsletter@weeklydigest.example',
    subject: 'Your Monday digest',
    sizeBytes: 12 * BYTES_PER_KB,
    sizeLabel: '12 KB',
    hasAttachment: false,
  },
  {
    key: 'invoice',
    from: 'billing@cloudhost.example',
    subject: 'Invoice #4821 attached',
    sizeBytes: 340 * BYTES_PER_KB,
    sizeLabel: '340 KB',
    hasAttachment: true,
  },
  {
    key: 'personalReply',
    from: 'maria.chen@example.com',
    subject: 'Re: lunch Friday?',
    sizeBytes: 8 * BYTES_PER_KB,
    sizeLabel: '8 KB',
    hasAttachment: false,
  },
  {
    key: 'socialNotification',
    from: 'noreply@social.example',
    subject: '5 new notifications',
    sizeBytes: 15 * BYTES_PER_KB,
    sizeLabel: '15 KB',
    hasAttachment: false,
  },
  {
    key: 'largeExport',
    from: 'team@projecttools.example',
    subject: 'Large export ready',
    sizeBytes: Math.round(2.4 * BYTES_PER_MB),
    sizeLabel: '2.4 MB',
    hasAttachment: true,
  },
  {
    key: 'unknownSender',
    from: 'hello@random.example',
    subject: 'hello',
    sizeBytes: 3 * BYTES_PER_KB,
    sizeLabel: '3 KB',
    hasAttachment: false,
  },
];

const RULE_BRANCH_KEYS: RuleBranchKey[] = ['fromSender', 'subjectContains', 'largerThan', 'hasAttachment'];

/**
 * Flattens the choice's per-branch arrays (e.g. `{ fromSender: [...], largerThan: [...] }`) into
 * one list, ordered by each occurrence's own persisted `order`. Takes a loosely-typed container
 * deliberately: a form's own values object is whatever the metadata declares it to be, and this
 * only ever reads a handful of optional fields off it.
 */
export function collectRules(rulesValues: unknown): Rule[] {
  const container = rulesValues as Record<string, unknown[] | undefined> | undefined;
  const rules: Rule[] = [];
  for (const branchKey of RULE_BRANCH_KEYS) {
    const items = container?.[branchKey];
    if (!items)
      continue;
    items.forEach((item, index) => {
      const record = (item ?? {}) as Partial<Rule>;
      rules.push({
        ...record,
        key: `${branchKey}[${index}]`,
        branchKey,
        order: record.order ?? index + 1,
      });
    });
  }
  return rules.sort((a, b) => a.order - b.order);
}

/** Converts a rule's own size+unit pair to bytes. KB defaults when the unit is missing or unknown. */
function thresholdBytes(size: number | undefined, unit: string | undefined): number | undefined {
  if (size == null || !Number.isFinite(size))
    return undefined;
  return unit === 'MB' ? size * BYTES_PER_MB : size * BYTES_PER_KB;
}

// #region matches
/**
 * Whether a single rule catches a single message. An empty or unfilled rule value never matches,
 * so a half-filled rule can never silently act as a catch-all.
 */
export function matches(rule: Rule, mail: Mail): boolean {
  switch (rule.branchKey) {
    case 'fromSender': {
      const ruleValue = rule.email?.trim().toLowerCase();
      if (!ruleValue)
        return false;
      const from = mail.from.toLowerCase();
      return ruleValue.startsWith('@') ? from.endsWith(ruleValue) : from === ruleValue;
    }
    case 'subjectContains': {
      const ruleValue = rule.text?.trim().toLowerCase();
      if (!ruleValue)
        return false;
      return mail.subject.toLowerCase().includes(ruleValue);
    }
    case 'largerThan': {
      const threshold = thresholdBytes(rule.size, rule.unit);
      if (threshold == null)
        return false;
      return mail.sizeBytes > threshold;
    }
    case 'hasAttachment':
      return mail.hasAttachment;
    default:
      return false;
  }
}
// #endregion matches

// #region route-inbox
/**
 * Routes every message against the rules in the order given (first match wins), reporting the
 * catching rule and its 1-based display position, or none if nothing matches.
 */
export function routeInbox(rules: Rule[], inbox: Mail[]): RoutedMail[] {
  return inbox.map((mail) => {
    const index = rules.findIndex(rule => matches(rule, mail));
    if (index === -1)
      return { mail };
    return { mail, rule: rules[index], ruleDisplayPosition: index + 1 };
  });
}
// #endregion route-inbox

// #region destination-label
/**
 * Describes where a matched rule sends a message. A rule can match before its action's companion
 * field (folder / label / forward address) is filled in, so this always falls back to a plain
 * "Matched" rather than printing an empty or undefined value.
 */
export function destinationLabel(rule: Rule | undefined): string {
  switch (rule?.action) {
    case 'folder':
      return rule.folder?.trim() ? `Folder "${rule.folder}"` : 'Matched';
    case 'label':
      return rule.label?.trim() ? `Label "${rule.label}"` : 'Matched';
    case 'forward':
      return rule.forwardTo?.trim() ? `Forward to ${rule.forwardTo}` : 'Matched';
    case 'delete':
      return 'Delete';
    default:
      return 'Matched';
  }
}
// #endregion destination-label

/** Whether an earlier rule of the same type catches every message a later rule of that type would. */
function fromSenderSubsumes(earlier: Rule, later: Rule): boolean {
  const earlierValue = earlier.email?.trim().toLowerCase();
  const laterValue = later.email?.trim().toLowerCase();
  if (!earlierValue || !laterValue)
    return false;
  if (earlierValue === laterValue)
    return true;
  return earlierValue.startsWith('@') && laterValue.endsWith(earlierValue);
}

function subjectContainsSubsumes(earlier: Rule, later: Rule): boolean {
  const earlierValue = earlier.text?.trim().toLowerCase();
  const laterValue = later.text?.trim().toLowerCase();
  if (!earlierValue || !laterValue)
    return false;
  return laterValue.includes(earlierValue);
}

function largerThanSubsumes(earlier: Rule, later: Rule): boolean {
  const earlierBytes = thresholdBytes(earlier.size, earlier.unit);
  const laterBytes = thresholdBytes(later.size, later.unit);
  if (earlierBytes == null || laterBytes == null)
    return false;
  return earlierBytes <= laterBytes;
}

/** Two "Has attachment" rules always catch the exact same messages: there is no value to compare. */
function hasAttachmentSubsumes(): boolean {
  return true;
}

function subsumes(earlier: Rule, later: Rule): boolean {
  if (earlier.branchKey !== later.branchKey)
    return false;
  switch (earlier.branchKey) {
    case 'fromSender':
      return fromSenderSubsumes(earlier, later);
    case 'subjectContains':
      return subjectContainsSubsumes(earlier, later);
    case 'largerThan':
      return largerThanSubsumes(earlier, later);
    case 'hasAttachment':
      return hasAttachmentSubsumes();
    default:
      return false;
  }
}

// #region find-unreachable-rules
/**
 * Finds every rule that can never fire because an earlier rule of the same condition type already
 * catches everything it would catch. Only same-type subsumption counts, never across condition
 * types. Returns a map from each unreachable rule's own key to the key of the rule that subsumes
 * it, so a caller can name the catching rule by its own displayed position. When more than one
 * earlier rule would subsume the same later rule, the earliest one wins, since that is the rule
 * that actually fires first. Reads its input only, never mutates it.
 */
export function findUnreachableRules(rules: Rule[]): Map<string, string> {
  const sorted = [...rules].sort((a, b) => a.order - b.order);
  const unreachable = new Map<string, string>();
  for (let laterIndex = 1; laterIndex < sorted.length; laterIndex++) {
    const later = sorted[laterIndex];
    for (let earlierIndex = 0; earlierIndex < laterIndex; earlierIndex++) {
      const earlier = sorted[earlierIndex];
      if (subsumes(earlier, later)) {
        unreachable.set(later.key, earlier.key);
        break;
      }
    }
  }
  return unreachable;
}
// #endregion find-unreachable-rules

export type ReorderDirection = 'up' | 'down';

/** One occurrence's new persisted order, ready to hand to a form's own field writer. */
export interface ReorderWrite {
  key: string
  order: number
}

// #region plan-reorder-swap
/**
 * Works out which two occurrences swap order values when a rule moves up or down, operating on
 * the order-sorted rule list rather than raw +-1 arithmetic. This is what keeps the swap correct
 * even when order values are not contiguous, for example right after a removal elsewhere in the
 * list. Returns null at a boundary (no neighbor in that direction), which a caller uses to decide
 * whether its own up/down control is disabled.
 */
export function planReorderSwap(rules: Rule[], targetKey: string, direction: ReorderDirection): [ReorderWrite, ReorderWrite] | null {
  const sorted = [...rules].sort((a, b) => a.order - b.order);
  const targetIndex = sorted.findIndex(rule => rule.key === targetKey);
  if (targetIndex === -1)
    return null;
  const neighborIndex = direction === 'up' ? targetIndex - 1 : targetIndex + 1;
  if (neighborIndex < 0 || neighborIndex >= sorted.length)
    return null;
  const target = sorted[targetIndex];
  const neighbor = sorted[neighborIndex];
  return [
    { key: target.key, order: neighbor.order },
    { key: neighbor.key, order: target.order },
  ];
}
// #endregion plan-reorder-swap
