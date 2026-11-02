import type { GridColumnCount, Responsive } from '@/metadata';

type Tier = 'base' | 'md' | 'lg';

/**
 * Turns one responsive value into its utility class names. A bare value lands on the `md`
 * tier, matching the "one column below 768px" default of every built-in grid. The md class
 * carries no tier infix (`sft-cols-3`); base and lg carry theirs (`sft-cols-base-3`,
 * `sft-cols-lg-3`). The classes themselves are generated in `style.scss`.
 */
function tierClasses(prefix: string, value: Responsive<number | string> | undefined): string[] {
  if (value === undefined)
    return [];
  const perTier: Partial<Record<Tier, number | string>>
    = typeof value === 'object' ? value : { md: value };
  const classes: string[] = [];
  if (perTier.base !== undefined)
    classes.push(`${prefix}-base-${perTier.base}`);
  if (perTier.md !== undefined)
    classes.push(`${prefix}-${perTier.md}`);
  if (perTier.lg !== undefined)
    classes.push(`${prefix}-lg-${perTier.lg}`);
  return classes;
}

/** Utility classes for a field's own children grid, from its `columns` property. */
export function gridColumnsClasses(columns?: Responsive<GridColumnCount>): string[] {
  return tierClasses('sft-cols', columns);
}

/** Utility classes for a field's placement in its parent's grid, from `colSpan` and `colStart`. */
export function gridItemClasses(
  colSpan?: Responsive<GridColumnCount | 'full'>,
  colStart?: Responsive<GridColumnCount>,
): string[] {
  return [...tierClasses('sft-span', colSpan), ...tierClasses('sft-col-start', colStart)];
}
