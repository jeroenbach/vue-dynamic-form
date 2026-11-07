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
      '## Accessibility',
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

  it('lists the textarea-input slot among the supported input slots', () => {
    expect(readme).toContain('textarea-input');
  });

  it('lists the radio-input slot among the supported input slots', () => {
    expect(readme).toContain('radio-input');
  });

  it('lists the file-input slot among the supported input slots', () => {
    expect(readme).toContain('file-input');
  });

  it('states that every control is keyboard-operable with no opt-out', () => {
    expect(readme).toContain('full keyboard operability');
    expect(readme).toContain('with no setting to turn it off');
  });
});
