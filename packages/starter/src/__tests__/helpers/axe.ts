import axe from 'axe-core';

/**
 * Runs axe-core against a mounted container and throws a readable error (rule id, impact,
 * and the affected node) if it finds a violation, instead of a bare boolean assertion.
 *
 * `color-contrast` is disabled explicitly: jsdom has no layout engine, so the rule cannot
 * compute contrast and otherwise comes back `incomplete` or errors. Contrast is verified
 * instead by the manual/screenshot checklist that covers this template's color tokens.
 */
export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
    },
  });

  if (results.violations.length === 0)
    return;

  const message = results.violations
    .map((violation) => {
      const nodes = violation.nodes
        .map(node => node.target.join(' '))
        .join(', ');
      return `[${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help} (${nodes})`;
    })
    .join('\n');

  throw new Error(`axe-core found ${results.violations.length} accessibility violation(s):\n${message}`);
}
