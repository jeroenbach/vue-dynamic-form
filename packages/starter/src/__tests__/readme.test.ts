import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { packageDirectory } from './helpers/sourceScan';

const readme = readFileSync(path.join(packageDirectory, 'README.md'), 'utf8');

describe('package readme', () => {
  it('covers every required section heading', () => {
    const headings = [
      '## Install',
      '## Stylesheet',
      '## Bare usage',
      '## Overriding a control',
      '## Icons',
      '## Customization guidance',
    ];
    for (const heading of headings)
      expect(readme).toContain(heading);
  });

  it('states explicitly that this is an installable dependency, not a cloneable scaffold', () => {
    expect(readme).toContain('This is an installable dependency, not a cloneable scaffold.');
  });

  it('states explicitly that #icon is only reachable through the wrapper pattern', () => {
    expect(readme).toContain('`#icon` is only reachable through this wrapper pattern, never by passing it directly to `DynamicForm`.');
  });
});
