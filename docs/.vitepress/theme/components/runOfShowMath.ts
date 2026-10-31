/**
 * Pure arithmetic for the run-of-show program. Kept free of any form or component dependency,
 * modeled on `splitPaymentLedgerMath.ts`, so the clock cascade (what time each item starts and
 * ends, given the event start and every duration above it) can be reasoned about on its own.
 */

export interface ProgramBranchShape {
  /** The branch's own name, e.g. 'speech'. */
  name: string
  /** True for a branch that is amplified regardless of its own fields (band, dance floor). */
  amplifiedByDefault: boolean
}

export interface ProgramOccurrenceSource {
  /** Stable, branch-scoped key, e.g. 'speech[0]'. */
  key: string
  branchKey: string
  /**
   * This occurrence's position in the program's rendered order, read from its own persisted
   * `order` child once `preserveOrder` is on. Falls back to its grouped (branch-declaration-
   * order, then per-branch array index) position for an occurrence that has no `order` yet,
   * matching the engine's own fallback so the two never disagree.
   */
  order: number
  durationMinutes: number
  /** True when this item must end before the amplified-music curfew. */
  amplified: boolean
}

export interface ProgramTimelineEntry {
  key: string
  branchKey: string
  amplified: boolean
  /** Minutes since midnight, counted forward from the event start without wrapping at 1440. */
  startMinutes: number
  endMinutes: number
}

export interface ProgramTimelineResult {
  /** Sorted by `order`, the same sequence the rows render in. */
  entries: ProgramTimelineEntry[]
  /** The minute the whole program ends, same unwrapped frame as every entry's `endMinutes`. */
  programEndMinutes: number
}

function parseDurationMinutes(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Flattens the program branch arrays under the choice's own values (e.g.
 * `{ speech: [...], dinner: [...] }`) into the occurrence list the timeline math consumes. Takes
 * `unknown` deliberately: the shape of a form's own values object is whatever the metadata
 * declares it to be, and this function only ever reads a handful of optional, loosely-typed
 * fields off it.
 */
export function collectProgramOccurrences(
  programValues: unknown,
  branches: ProgramBranchShape[],
): ProgramOccurrenceSource[] {
  const container = programValues as Record<string, unknown[] | undefined> | undefined;
  const occurrences: ProgramOccurrenceSource[] = [];
  let groupedPosition = 0;
  for (const branch of branches) {
    const items = container?.[branch.name];
    if (!items)
      continue;
    items.forEach((item, index) => {
      groupedPosition += 1;
      const record = item as { order?: number, duration?: unknown, onMic?: unknown } | undefined;
      occurrences.push({
        key: `${branch.name}[${index}]`,
        branchKey: branch.name,
        order: record?.order ?? groupedPosition,
        durationMinutes: parseDurationMinutes(record?.duration),
        amplified: branch.amplifiedByDefault || record?.onMic === true,
      });
    });
  }
  return occurrences;
}

// #region clock-cascade
/**
 * Walks the occurrences in their rendered order, running the clock forward from the event start.
 * Every entry's `startMinutes`/`endMinutes` stay in one unwrapped frame (they can exceed 1440 for
 * a program that crosses midnight); `formatTime` is what wraps a value back to a 24-hour label.
 * This is the clock analogue of the split-payment ledger's running-remainder fold.
 */
export function computeTimeline(
  occurrences: ProgramOccurrenceSource[],
  eventStartMinutes: number,
): ProgramTimelineResult {
  const byOrder = [...occurrences].sort((a, b) => a.order - b.order);
  let clock = eventStartMinutes;
  const entries: ProgramTimelineEntry[] = byOrder.map((occurrence) => {
    const startMinutes = clock;
    clock += occurrence.durationMinutes;
    return {
      key: occurrence.key,
      branchKey: occurrence.branchKey,
      amplified: occurrence.amplified,
      startMinutes,
      endMinutes: clock,
    };
  });
  return { entries, programEndMinutes: clock };
}

/**
 * Lifts a raw minutes-from-midnight clock reading (an anchor like the curfew) into the same
 * unwrapped frame the timeline's `startMinutes`/`endMinutes` use, exactly like a venue-close time
 * past midnight: a reading lower than the event start is on the next calendar day, not earlier
 * the same day.
 */
export function liftToEventFrame(minutes: number, eventStartMinutes: number): number {
  return minutes < eventStartMinutes ? minutes + 1440 : minutes;
}

/** Names every amplified occurrence that ends after the curfew, in the same unwrapped frame. */
export function findCurfewBreaches(
  timeline: ProgramTimelineResult,
  curfewMinutes: number,
  eventStartMinutes: number,
): string[] {
  const curfewAbsolute = liftToEventFrame(curfewMinutes, eventStartMinutes);
  return timeline.entries
    .filter(entry => entry.amplified && entry.endMinutes > curfewAbsolute)
    .map(entry => entry.key);
}
// #endregion clock-cascade

export interface ProgramKindCount {
  branchKey: string
  count: number
}

/**
 * Counts occurrences per branch, always emitting one entry per declared branch even when its
 * count is zero, so a kind with nothing in the program still shows a "0" chip rather than being
 * left out of the row entirely.
 */
export function countOccurrencesByKind(
  occurrences: ProgramOccurrenceSource[],
  branches: ProgramBranchShape[],
): ProgramKindCount[] {
  return branches.map(branch => ({
    branchKey: branch.name,
    count: occurrences.filter(occurrence => occurrence.branchKey === branch.name).length,
  }));
}

const CAKE_BRANCH_KEY = 'cake';
const DINNER_BRANCH_KEY = 'dinner';
const BREAK_BRANCH_KEY = 'break';

/**
 * Names every cake-cutting item that sits before the earliest dinner course in the program's
 * rendered order. Reads only the timeline, never the curfew anchor or `findCurfewBreaches`'s
 * output, so this stays a convention check with no bearing on `meta.valid`. A program with no
 * dinner course at all has nothing for cake to come before, so nothing is flagged.
 */
export function findCakeBeforeDinner(timeline: ProgramTimelineResult): string[] {
  const entries = timeline.entries;
  const firstDinnerIndex = entries.findIndex(entry => entry.branchKey === DINNER_BRANCH_KEY);
  if (firstDinnerIndex === -1)
    return [];
  return entries
    .slice(0, firstDinnerIndex)
    .filter(entry => entry.branchKey === CAKE_BRANCH_KEY)
    .map(entry => entry.key);
}

/**
 * Names the program's first displayed item when it is a break, the one position "leading break"
 * can ever apply to. Same convention-only reasoning as `findCakeBeforeDinner`: timeline only, no
 * curfew involvement.
 */
export function findLeadingBreak(timeline: ProgramTimelineResult): string[] {
  const first = timeline.entries[0];
  return first && first.branchKey === BREAK_BRANCH_KEY ? [first.key] : [];
}

/** Parses a 24-hour `HH:MM` string (the native `<input type="time">` value shape) to minutes from midnight. */
export function parseTime(value: unknown): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim());
  if (!match)
    return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

/** Renders a minute count (possibly past 1440, i.e. past midnight) as a wrapped 24-hour `HH:MM` label. */
export function formatTime(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const mins = wrapped % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
