import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const srcDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const packageDirectory = path.resolve(srcDirectory, '..');

export interface SourceFile {
  path: string
  content: string
}

/** Reads every `.vue` and `.ts` file under `src`, minus the given files. */
export function collectSourceFiles(excluding: string[] = []): SourceFile[] {
  const excluded = new Set(excluding.map(file => path.resolve(file)));
  const files: SourceFile[] = [];

  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      }
      else if (/\.(?:vue|ts)$/.test(entry.name) && !excluded.has(fullPath)) {
        files.push({ path: fullPath, content: readFileSync(fullPath, 'utf8') });
      }
    }
  };

  walk(srcDirectory);
  return files;
}

const quotedStrings = /'([^']*)'|`([^`]*)`/g;

function splitTokens(value: string) {
  return value.split(/\s+/).filter(Boolean);
}

/** Class tokens from static `class` attributes, `:class` string and array literals, and `class: '...'` render code. */
export function extractClassTokens(source: string): string[] {
  const tokens: string[] = [];

  for (const match of source.matchAll(/(?<![:\w-])class\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    tokens.push(...splitTokens(match[1] ?? match[2] ?? ''));
  }

  for (const match of source.matchAll(/(?:v-bind)?:class\s*=\s*"([^"]*)"/g)) {
    for (const literal of match[1].matchAll(quotedStrings)) {
      tokens.push(...splitTokens(literal[1] ?? literal[2] ?? ''));
    }
  }

  for (const match of source.matchAll(/\bclass\s*:\s*(['"`])([^'"`]*)\1/g)) {
    tokens.push(...splitTokens(match[2]));
  }

  return tokens;
}
