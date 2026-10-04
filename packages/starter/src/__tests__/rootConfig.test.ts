import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { packageDirectory } from './helpers/sourceScan';

const rootEslintConfig = readFileSync(path.join(packageDirectory, '../../eslint.config.js'), 'utf8');

describe('root eslint hyphenation override', () => {
  it('keeps the pre-existing entries and adds the starter package', () => {
    const filesLine = /files:\s*\[([^\]]*)\]/.exec(rootEslintConfig)?.[1] ?? '';

    expect(filesLine).toContain('docs/**/*.vue');
    expect(filesLine).toContain('packages/element-plus/**/*.vue');
    expect(filesLine).toContain('playgrounds/storybook/**/*.vue');
    expect(filesLine).toContain('packages/starter/**/*.vue');
  });
});
