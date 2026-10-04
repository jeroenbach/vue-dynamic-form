import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { registry } from '@/icons';
import { starterIconNames } from '@/index';
import { packageDirectory } from './helpers/sourceScan';

const orderedNames = [
  'chevronLeft',
  'chevronRight',
  'check',
  'trash',
  'plus',
  'zap',
  'users',
  'grid',
  'pencil',
  'checkCircle',
  'loader',
  'refreshCw',
  'eye',
  'eyeOff',
  'building2',
  'rocket',
  'calendar',
  'briefcase',
  'shield',
  'sparkles',
];

const iconsSource = readFileSync(path.join(packageDirectory, 'src/icons.ts'), 'utf8');

describe('icon registry matches the canonical Lucide import list', () => {
  it('imports exactly the canonical v1 names, not the deprecated aliases', () => {
    const imported = [...iconsSource.matchAll(/^\s{2}(\w+),?$/gm)].map(match => match[1]);
    expect(imported.sort()).toEqual([
      'Briefcase',
      'Building2',
      'Calendar',
      'Check',
      'ChevronLeft',
      'ChevronRight',
      'CircleCheck',
      'Eye',
      'EyeOff',
      'LayoutGrid',
      'LoaderCircle',
      'Pencil',
      'Plus',
      'RefreshCw',
      'Rocket',
      'Shield',
      'Sparkles',
      'Trash2',
      'Users',
      'Zap',
    ].sort());
    expect(iconsSource).not.toContain('CheckCircle2');
    expect(iconsSource).not.toContain('Loader2');
  });

  it('keys the registry by the exact stable name list, in order', () => {
    expect(Object.keys(registry)).toEqual(orderedNames);
  });
});

describe('starterIconNames', () => {
  it('is exported from the package entry, matching the registry key order', () => {
    expect(starterIconNames).toEqual(Object.keys(registry));
    expect(starterIconNames).toEqual(orderedNames);
  });
});
