/**
 * Pure arithmetic for the split-payment ledger. Kept free of any form or component dependency so
 * the per-row and aggregate math (what each source applies, what is left, whether the order is
 * covered) can be reasoned about, and tested, entirely on its own.
 */

export interface SplitPaymentBranchShape {
  /** The branch's own name, e.g. 'giftCard'. */
  name: string
  /** True for a branch with no fixed amount of its own (card, PayPal): it applies whatever is left after every row above it. */
  coversRemainder: boolean
}

export interface SplitPaymentOccurrenceSource {
  /** Stable, branch-scoped key, e.g. 'giftCard[0]'. */
  key: string
  branchKey: string
  order: number
  /** Undefined for a remainder-covering source: its applied amount is derived, never stored. */
  amount: number | undefined
}

export interface SplitPaymentLedgerEntry {
  key: string
  appliedAmount: number
  remainingAfter: number
}

export interface SplitPaymentLedgerResult {
  /** Same order as the given occurrences, not the order-sorted display sequence. */
  entries: SplitPaymentLedgerEntry[]
  /** Order total minus every row's applied amount. Positive is a shortfall, negative an overshoot, zero is covered. */
  remainingToAssign: number
}

/**
 * Walks the occurrences in their persisted order, running total down from the order total. A
 * remainder-covering source applies whatever is left at its own position; a fixed-amount source
 * applies its own amount regardless of position, which is exactly how a fixed row placed below an
 * already-exhausted remainder-covering row produces a negative running total (an overshoot).
 * Every displayed figure is clamped at zero; only the final `remainingToAssign` carries the sign.
 */
export function computeSplitPaymentLedger(
  occurrences: SplitPaymentOccurrenceSource[],
  orderTotal: number,
): SplitPaymentLedgerResult {
  const byOrder = [...occurrences].sort((a, b) => a.order - b.order);
  const entriesByKey = new Map<string, SplitPaymentLedgerEntry>();
  let runningRemaining = orderTotal;

  for (const occurrence of byOrder) {
    const appliedAmount = Math.max(0, occurrence.amount ?? Math.max(0, runningRemaining));
    runningRemaining -= appliedAmount;
    entriesByKey.set(occurrence.key, {
      key: occurrence.key,
      appliedAmount,
      remainingAfter: Math.max(0, runningRemaining),
    });
  }

  return {
    entries: occurrences.map(occurrence => entriesByKey.get(occurrence.key)!),
    remainingToAssign: runningRemaining,
  };
}

function parseAmount(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Flattens the split-payment branch arrays under a choice's own values (e.g.
 * `{ giftCard: [...], card: [...] }`) into the occurrence list the ledger math consumes.
 * Takes `unknown` deliberately: the shape of a form's own values object is whatever the metadata
 * declares it to be, and this function only ever reads a handful of optional, loosely-typed
 * fields off it.
 */
export function collectSplitPaymentOccurrences(
  splitPaymentValues: unknown,
  branches: SplitPaymentBranchShape[],
): SplitPaymentOccurrenceSource[] {
  const container = splitPaymentValues as Record<string, unknown[] | undefined> | undefined;
  const occurrences: SplitPaymentOccurrenceSource[] = [];
  for (const branch of branches) {
    const items = container?.[branch.name];
    if (!items)
      continue;
    items.forEach((item, index) => {
      const record = item as { order?: number, amount?: unknown } | undefined;
      occurrences.push({
        key: `${branch.name}[${index}]`,
        branchKey: branch.name,
        order: record?.order ?? index + 1,
        amount: branch.coversRemainder ? undefined : parseAmount(record?.amount),
      });
    });
  }
  return occurrences;
}

/** Reads a dot-path off a plain object; used wherever a field only knows a relative path at render time. */
export function readPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value == null || typeof value !== 'object')
      return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}
