import type { WorkoutBranchShape } from '../workoutPlanMath';
import { describe, expect, it } from 'vitest';
import { checkConventions, collectBlocks, readPath, summarizePlan } from '../workoutPlanMath';

const BRANCHES: WorkoutBranchShape[] = [
  { name: 'warmUp' },
  { name: 'strength' },
  { name: 'cardio' },
  { name: 'cooldown' },
];

// The same seven-block plan the example page seeds: interleaved via explicit order values,
// numeric leaves stored as strings the way a number input stores them.
function defaultPlan(): Record<string, Record<string, unknown>[]> {
  return {
    warmUp: [
      { order: 1, duration: '10' },
    ],
    cardio: [
      { order: 2, kind: 'rowing', intensity: 'high', duration: '15' },
      { order: 4, kind: 'jumpRope', intensity: 'high', duration: '12' },
    ],
    strength: [
      { order: 3, name: 'Barbell back squat', muscle: 'legs', type: 'compound', sets: '4', reps: '6' },
      { order: 5, name: 'Bench press', muscle: 'chest', type: 'compound', sets: '4', reps: '8' },
      { order: 6, name: 'Seated leg curl', muscle: 'legs', type: 'isolation', sets: '3', reps: '12' },
    ],
    cooldown: [
      { order: 7, duration: '8' },
    ],
  };
}

// Swaps the order values of the two occurrences currently displayed at those positions,
// exactly what one click of an up/down chevron does.
function swapOrders(plan: Record<string, Record<string, unknown>[]>, a: number, b: number): void {
  for (const items of Object.values(plan)) {
    for (const item of items) {
      if (item.order === a)
        item.order = b;
      else if (item.order === b)
        item.order = a;
    }
  }
}

function violationsAfterSwap(a: number, b: number) {
  const plan = defaultPlan();
  swapOrders(plan, a, b);
  return checkConventions(collectBlocks(plan, BRANCHES));
}

describe('collectBlocks', () => {
  it('flattens the branch arrays into one list sorted by order, coercing string numerics', () => {
    const blocks = collectBlocks(defaultPlan(), BRANCHES);

    expect(blocks.map(block => block.branchKey)).toEqual(
      ['warmUp', 'cardio', 'strength', 'cardio', 'strength', 'strength', 'cooldown'],
    );
    expect(blocks.map(block => block.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(blocks[0].duration).toBe(10);
    expect(blocks[2].sets).toBe(4);
    expect(blocks[2].reps).toBe(6);
  });

  it('returns an empty list for an undefined or empty plan', () => {
    expect(collectBlocks(undefined, BRANCHES)).toEqual([]);
    expect(collectBlocks({}, BRANCHES)).toEqual([]);
  });

  it('drops a garbage numeric instead of leaking NaN', () => {
    const blocks = collectBlocks({ warmUp: [{ order: 1, duration: 'abc' }] }, BRANCHES);
    expect(blocks[0].duration).toBeUndefined();
    expect(summarizePlan(blocks).totalDuration).toBe(0);
  });
});

describe('summarizePlan', () => {
  it('computes the default plan figures: 45 timed minutes over 7 blocks', () => {
    const summary = summarizePlan(collectBlocks(defaultPlan(), BRANCHES));

    expect(summary.totalDuration).toBe(45);
    expect(summary.blockCount).toBe(7);
    expect(summary.muscleGroups).toEqual(['legs', 'chest']);
    expect(summary.violations).toEqual([]);
  });

  it('gives the cardio row a shared intensity word and one dot per occurrence', () => {
    const summary = summarizePlan(collectBlocks(defaultPlan(), BRANCHES));
    const cardio = summary.profile.find(row => row.branchKey === 'cardio');

    expect(cardio).toMatchObject({ count: 2, intensity: 'high', dots: ['high', 'high'] });
  });

  it('keeps the other rows count-only, with no intensity word or dots', () => {
    const summary = summarizePlan(collectBlocks(defaultPlan(), BRANCHES));
    const rows = summary.profile.filter(row => row.branchKey !== 'cardio');

    expect(rows.map(row => [row.branchKey, row.count])).toEqual([['warmUp', 1], ['strength', 3], ['cooldown', 1]]);
    expect(rows.every(row => row.intensity === undefined && row.dots === undefined)).toBe(true);
  });

  it('renders an unset dot and drops the intensity word while a cardio intensity is not filled in', () => {
    const plan = defaultPlan();
    plan.cardio.push({ order: 8, kind: 'running', duration: '5' });

    const cardio = summarizePlan(collectBlocks(plan, BRANCHES)).profile.find(row => row.branchKey === 'cardio');

    expect(cardio?.dots).toEqual(['high', 'high', 'unset']);
    expect(cardio?.intensity).toBeUndefined();
  });

  it('summarizes an empty plan to all-zero neutral figures', () => {
    const summary = summarizePlan([]);

    expect(summary).toEqual({ totalDuration: 0, blockCount: 0, profile: [], muscleGroups: [], violations: [] });
  });
});

describe('checkConventions', () => {
  it('reports no violation on the seeded default plan', () => {
    expect(checkConventions(collectBlocks(defaultPlan(), BRANCHES))).toEqual([]);
  });

  it('fires warmUpFirst when the warm-up is swapped off the top', () => {
    const violations = violationsAfterSwap(1, 2);

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ rule: 'warmUpFirst', positions: [1] });
  });

  it('fires cooldownLast when the cooldown is swapped off the bottom', () => {
    const violations = violationsAfterSwap(6, 7);

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ rule: 'cooldownLast', positions: [7] });
  });

  it('fires compoundBeforeIsolation and noBackToBackMuscle together from the bench/leg-curl swap', () => {
    const violations = violationsAfterSwap(5, 6);

    expect(violations.map(violation => violation.rule).sort()).toEqual(['compoundBeforeIsolation', 'noBackToBackMuscle']);
    expect(violations.find(violation => violation.rule === 'compoundBeforeIsolation')?.positions).toEqual([6]);
    // Squat and leg curl become consecutive strength blocks (both legs) even though a cardio
    // block sits between them: the rule reads the strength subsequence, not adjacent rows.
    expect(violations.find(violation => violation.rule === 'noBackToBackMuscle')?.positions).toEqual([3, 5]);
  });

  it('fires only noAdjacentHighCardio from the squat/jump-rope swap', () => {
    const violations = violationsAfterSwap(3, 4);

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ rule: 'noAdjacentHighCardio', positions: [2, 3] });
  });

  it('fires nothing from the one inert swap (jump rope and bench press)', () => {
    expect(violationsAfterSwap(4, 5)).toEqual([]);
  });

  it('never reports a boundary violation for an absent warm-up or cooldown', () => {
    const noWarmUp = defaultPlan();
    noWarmUp.warmUp = [];
    expect(checkConventions(collectBlocks(noWarmUp, BRANCHES)).map(violation => violation.rule)).toEqual([]);

    const noCooldown = defaultPlan();
    noCooldown.cooldown = [];
    expect(checkConventions(collectBlocks(noCooldown, BRANCHES)).map(violation => violation.rule)).toEqual([]);
  });

  it('keeps working on gapped order values without inventing adjacency', () => {
    const blocks = collectBlocks({
      cardio: [
        { order: 2, kind: 'rowing', intensity: 'high' },
        { order: 9, kind: 'running', intensity: 'high' },
      ],
      strength: [
        { order: 5, name: 'Bench press', muscle: 'chest', type: 'compound' },
      ],
    }, BRANCHES);

    expect(checkConventions(blocks)).toEqual([]);
  });
});

describe('readPath', () => {
  it('reads a nested dot path and returns undefined for a missing segment', () => {
    expect(readPath({ a: { b: 1 } }, 'a.b')).toBe(1);
    expect(readPath({ a: { b: 1 } }, 'a.c.d')).toBeUndefined();
  });
});
