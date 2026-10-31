/**
 * Pure arithmetic for the workout plan summary. Kept free of any form or component dependency
 * so the headline figures can be reasoned about, and read by both the summary rail and each
 * row, entirely on their own. Mirrors splitPaymentLedgerMath.ts.
 */

export type IntensityLevel = 'low' | 'moderate' | 'high';

export interface WorkoutBranchShape {
  /** The branch's own name, e.g. 'warmUp'. */
  name: string
}

export interface Block {
  /** Stable, branch-scoped key, e.g. 'cardio[0]'. */
  key: string
  branchKey: string
  order: number
  duration?: number
  sets?: number
  reps?: number
  name?: string
  muscle?: string
  /** Movement type, strength blocks only: compound or isolation. */
  type?: string
  /** Cardio equipment type, cardio blocks only: rowing, running, ... */
  kind?: string
  intensity?: IntensityLevel
}

export interface IntensityProfileRow {
  branchKey: string
  label: string
  count: number
  /** Only set when every block in this row shares one intensity; cardio only, since it is the one branch with an intensity field. */
  intensity?: IntensityLevel
  /** One dot per block, in display order; only populated for the cardio row. A block whose intensity is not filled in yet gets an 'unset' dot, never an invented level. */
  dots?: (IntensityLevel | 'unset')[]
}

export type ViolationRule
  = | 'warmUpFirst'
    | 'cooldownLast'
    | 'compoundBeforeIsolation'
    | 'noBackToBackMuscle'
    | 'noAdjacentHighCardio';

export interface Violation {
  rule: ViolationRule
  /** Short rule name, shown in bold in the rail. */
  label: string
  /** Plain-language reason, shown next to the rule name. */
  reason: string
  /** Displayed positions (the blocks' own `order`) this violation names, ascending. */
  positions: number[]
}

export interface PlanSummary {
  totalDuration: number
  blockCount: number
  profile: IntensityProfileRow[]
  muscleGroups: string[]
  violations: Violation[]
}

const BRANCH_LABELS: Record<string, string> = {
  warmUp: 'Warm-up',
  strength: 'Strength',
  cardio: 'Cardio',
  cooldown: 'Cooldown',
};

// The order the rail lists block types in. Kept separate from the branches' own declaration
// order in the metadata (warmUp, strength, cardio, cooldown), since the rail reads better with
// cardio last.
const PROFILE_ORDER = ['warmUp', 'strength', 'cooldown', 'cardio'];

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '')
    return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// #region summary-module
/**
 * Flattens the plan choice's branch arrays (e.g. `{ warmUp: [...], strength: [...] }`) into one
 * list of blocks, ordered by each occurrence's persisted `order`. Every numeric leaf
 * (duration, sets, reps) is coerced here, once, since a number input always stores its value
 * as a string. `order` itself is left alone: it is engine-managed and already numeric.
 */
export function collectBlocks(planValues: unknown, branches: WorkoutBranchShape[]): Block[] {
  const container = planValues as Record<string, unknown[] | undefined> | undefined;
  const blocks: Block[] = [];
  for (const branch of branches) {
    const items = container?.[branch.name];
    if (!items)
      continue;
    items.forEach((item, index) => {
      const record = item as Record<string, unknown> | undefined;
      blocks.push({
        key: `${branch.name}[${index}]`,
        branchKey: branch.name,
        order: (record?.order as number | undefined) ?? index + 1,
        duration: toNumber(record?.duration),
        sets: toNumber(record?.sets),
        reps: toNumber(record?.reps),
        name: record?.name as string | undefined,
        muscle: record?.muscle as string | undefined,
        type: record?.type as string | undefined,
        kind: record?.kind as string | undefined,
        intensity: record?.intensity as IntensityLevel | undefined,
      });
    });
  }
  return blocks.sort((a, b) => a.order - b.order);
}

/**
 * Computes the rail's headline figures from an already-collected block list: total timed
 * duration, a per-branch intensity profile (count-only, except cardio which also carries its
 * own intensity word and dot sequence), and the distinct muscle groups in play.
 */
export function summarizePlan(blocks: Block[]): PlanSummary {
  const totalDuration = blocks.reduce((sum, block) => sum + (block.duration ?? 0), 0);

  const profile: IntensityProfileRow[] = [];
  for (const branchKey of PROFILE_ORDER) {
    const branchBlocks = blocks.filter(block => block.branchKey === branchKey);
    if (!branchBlocks.length)
      continue;

    if (branchKey === 'cardio') {
      const dots = branchBlocks.map(block => block.intensity ?? 'unset');
      const sharedIntensity = branchBlocks.every(block => block.intensity === branchBlocks[0].intensity)
        ? branchBlocks[0].intensity
        : undefined;
      profile.push({ branchKey, label: BRANCH_LABELS[branchKey], count: branchBlocks.length, intensity: sharedIntensity, dots });
    }
    else {
      profile.push({ branchKey, label: BRANCH_LABELS[branchKey], count: branchBlocks.length });
    }
  }

  const muscleGroups = [...new Set(
    blocks.filter(block => block.branchKey === 'strength' && block.muscle).map(block => block.muscle!),
  )];

  return { totalDuration, blockCount: blocks.length, profile, muscleGroups, violations: checkConventions(blocks) };
}
// #endregion summary-module

const RULE_LABELS: Record<ViolationRule, string> = {
  warmUpFirst: 'Warm-up first',
  cooldownLast: 'Cooldown last',
  compoundBeforeIsolation: 'Compound before isolation',
  noBackToBackMuscle: 'No back-to-back same muscle group',
  noAdjacentHighCardio: 'No adjacent high-intensity cardio',
};

function describeBlock(block: Block): string {
  return block.name ?? BRANCH_LABELS[block.branchKey] ?? block.branchKey;
}

// #region convention-checks
/**
 * Checks the five published ordering conventions against the plan's blocks, in their current
 * displayed order. Every rule is order-only: it never looks at whether a block is present, only
 * at where it sits relative to the others that are present. A block type that is missing
 * entirely never causes a violation, since there is nothing to put out of order.
 */
export function checkConventions(blocks: Block[]): Violation[] {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  const violations: Violation[] = [];

  if (sorted.length && sorted.some(block => block.branchKey === 'warmUp') && sorted[0].branchKey !== 'warmUp') {
    violations.push({
      rule: 'warmUpFirst',
      label: RULE_LABELS.warmUpFirst,
      reason: 'A Warm-up block is in the plan but is not the first block.',
      positions: [sorted[0].order],
    });
  }

  if (sorted.length && sorted.some(block => block.branchKey === 'cooldown') && sorted[sorted.length - 1].branchKey !== 'cooldown') {
    violations.push({
      rule: 'cooldownLast',
      label: RULE_LABELS.cooldownLast,
      reason: 'A Cooldown / stretch block is in the plan but is not the last block.',
      positions: [sorted[sorted.length - 1].order],
    });
  }

  // A whole-list scan, not an adjacent-only check: once an isolation block has been seen, any
  // compound block later in the list is out of order, however far apart they sit.
  let seenIsolation = false;
  for (const block of sorted) {
    if (block.branchKey !== 'strength')
      continue;
    if (block.type === 'isolation') {
      seenIsolation = true;
    }
    else if (block.type === 'compound' && seenIsolation) {
      violations.push({
        rule: 'compoundBeforeIsolation',
        label: RULE_LABELS.compoundBeforeIsolation,
        reason: `"${describeBlock(block)}" (compound) follows an isolation exercise earlier in the plan.`,
        positions: [block.order],
      });
    }
  }

  // Reads the strength subsequence, not directly-adjacent rows: two strength blocks count as
  // consecutive here even when a cardio, warm-up, or cooldown block sits between them.
  const strengthBlocks = sorted.filter(block => block.branchKey === 'strength');
  for (let i = 1; i < strengthBlocks.length; i++) {
    const previous = strengthBlocks[i - 1];
    const current = strengthBlocks[i];
    if (previous.muscle && previous.muscle === current.muscle) {
      violations.push({
        rule: 'noBackToBackMuscle',
        label: RULE_LABELS.noBackToBackMuscle,
        reason: `"${describeBlock(previous)}" and "${describeBlock(current)}" are consecutive strength exercises that target the same muscle group.`,
        positions: [previous.order, current.order].sort((a, b) => a - b),
      });
    }
  }

  // Directly-adjacent rows only: cardio blocks separated by another block type never trigger
  // this rule, unlike the strength-subsequence rule above.
  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    if (previous.branchKey === 'cardio' && current.branchKey === 'cardio' && previous.intensity === 'high' && current.intensity === 'high') {
      violations.push({
        rule: 'noAdjacentHighCardio',
        label: RULE_LABELS.noAdjacentHighCardio,
        reason: `"${describeBlock(previous)}" and "${describeBlock(current)}" are adjacent cardio blocks both at high intensity.`,
        positions: [previous.order, current.order].sort((a, b) => a - b),
      });
    }
  }

  return violations;
}
// #endregion convention-checks

/** Reads a dot-path off a plain object; used wherever a field only knows a relative path at render time. */
export function readPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value == null || typeof value !== 'object')
      return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}
