// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { build, resolveConfig } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { collectSourceFiles, packageDirectory } from './helpers/sourceScan';

const configFile = path.join(packageDirectory, 'vite.config.ts');
const packageName = '@bach.software/vue-dynamic-form-element-plus';

let workDirectory: string;
let outDirectory: string;
let stylesheet: string;

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? listFiles(path.join(directory, entry.name)) : [path.join(directory, entry.name)],
  );
}

/** The declaration block of the one rule whose selector is the given class carrying a scope attribute. */
function declarationsOf(className: string) {
  const rule = new RegExp(`\\.${className}\\[data-v-[\\w-]+\\]\\s*\\{([^}]*)\\}`).exec(stylesheet);
  return rule?.[1] ?? '';
}

beforeAll(async () => {
  workDirectory = mkdtempSync(path.join(os.tmpdir(), 'epft-style-build-'));
  outDirectory = path.join(workDirectory, 'dist');

  await build({
    root: packageDirectory,
    configFile,
    mode: 'production',
    logLevel: 'silent',
    build: { outDir: outDirectory, emptyOutDir: true },
  });

  const stylesheetPath = path.join(outDirectory, 'style.css');
  stylesheet = existsSync(stylesheetPath) ? readFileSync(stylesheetPath, 'utf8') : '';
}, 60_000);

afterAll(() => {
  rmSync(workDirectory, { recursive: true, force: true });
});

describe('build configuration', () => {
  it('pins the stylesheet file name', async () => {
    const config = await resolveConfig({ root: packageDirectory, configFile, logLevel: 'silent' }, 'build', 'production');
    expect(config.build.lib && config.build.lib.cssFileName).toBe('style');
  });

  it('does not split css per chunk', async () => {
    const config = await resolveConfig({ root: packageDirectory, configFile, logLevel: 'silent' }, 'build', 'production');
    expect(config.build.cssCodeSplit).not.toBe(true);
  });
});

describe('build output', () => {
  it('emits style.css', () => {
    expect(stylesheet.length).toBeGreaterThan(0);
  });

  it('emits no other stylesheet', () => {
    const stylesheets = listFiles(outDirectory).filter(file => file.endsWith('.css')).map(file => path.basename(file));
    expect(stylesheets).toEqual(['style.css']);
  });

  it('keeps styles out of the javascript bundles', () => {
    const bundles = listFiles(outDirectory).filter(file => file.endsWith('.js'));
    expect(bundles.map(file => path.basename(file)).sort()).toEqual([
      'vue-dynamic-form-element-plus.es.js',
      'vue-dynamic-form-element-plus.umd.js',
    ]);
    for (const bundle of bundles) {
      const content = readFileSync(bundle, 'utf8');
      expect(content).not.toMatch(/createElement\(\s*["']style["']\s*\)/);
      expect(content).not.toMatch(/import\s*["'][^"']*\.css["']/);
      expect(content).not.toMatch(/from\s*["'][^"']*\.css["']/);
    }
  });
});

describe('stylesheet content', () => {
  it('scopes the component styles', () => {
    expect(stylesheet).toMatch(/\[data-v-[\w-]+\]/);
  });

  it('lays out the switch row inline and vertically centered', () => {
    const declarations = declarationsOf('epft-switch-row');
    expect(declarations).toMatch(/display:\s*(?:inline-)?flex/);
    expect(declarations).toMatch(/align-items:\s*center/);
    expect(declarations).toMatch(/gap:[^;]*\d/);
  });

  it('gives the heading block spacing and a semibold larger title', () => {
    expect(declarationsOf('epft-heading')).toMatch(/margin:[^;]*[1-9]/);

    const title = declarationsOf('epft-heading-title');
    expect(title).toMatch(/font-weight:\s*600/);
    const fontSize = /font-size:\s*([^;}]+)/.exec(title)?.[1].trim();
    expect(fontSize).toBeDefined();
    expect(['inherit', '1em', '100%']).not.toContain(fontSize);
  });

  it('lays out an array item as a row with a growing content area', () => {
    expect(declarationsOf('epft-array-item-row')).toMatch(/display:\s*flex/);
    expect(declarationsOf('epft-array-item-row')).toMatch(/gap:[^;]*\d/);
    expect(declarationsOf('epft-array-item-content')).toMatch(/flex:\s*1/);
  });

  it('stacks the array items with a gap and colors the array error', () => {
    expect(declarationsOf('epft-array-items')).toMatch(/flex-direction:\s*column/);
    expect(declarationsOf('epft-array-items')).toMatch(/gap:[^;]*\d/);
    expect(declarationsOf('epft-array-error')).toMatch(/color:[^;]*danger/);
  });

  it('does not bundle element plus styles', () => {
    expect(stylesheet).not.toContain('--el-color-primary:');
    expect(stylesheet).not.toContain('.el-button');
    expect(stylesheet.length).toBeLessThan(20 * 1024);
  });

  it('has no orphan class selectors', () => {
    const selectors = stylesheet.replace(/\{[^}]*\}/g, '{}');
    const classNames = new Set([...selectors.matchAll(/\.([a-z_][\w-]*)/gi)].map(match => match[1]));
    const templates = collectSourceFiles()
      .filter(file => file.path.endsWith('.vue') && !file.path.includes(`${path.sep}__tests__${path.sep}`))
      .map(file => file.content.replace(/<style[\s\S]*?<\/style>/g, ''))
      .join('\n');

    expect(classNames.size).toBeGreaterThan(0);
    expect([...classNames].filter(name => !templates.includes(name))).toEqual([]);
  });
});

describe('package resolution', () => {
  let consumerDirectory: string;
  let consumerRequire: NodeRequire;

  beforeAll(() => {
    consumerDirectory = path.join(workDirectory, 'consumer');
    const installed = path.join(consumerDirectory, 'node_modules', ...packageName.split('/'));
    mkdirSync(installed, { recursive: true });
    cpSync(path.join(packageDirectory, 'package.json'), path.join(installed, 'package.json'));
    cpSync(outDirectory, path.join(installed, 'dist'), { recursive: true });
    writeFileSync(path.join(consumerDirectory, 'index.js'), '');
    consumerRequire = createRequire(path.join(consumerDirectory, 'index.js'));
  });

  it('resolves the documented stylesheet path to the built file', () => {
    const resolved = consumerRequire.resolve(`${packageName}/style.css`);
    expect(resolved.split(path.sep).slice(-2)).toEqual(['dist', 'style.css']);
    expect(statSync(resolved).isFile()).toBe(true);
  });

  it('does not resolve the deep dist path', () => {
    expect(() => consumerRequire.resolve(`${packageName}/dist/style.css`)).toThrow(
      expect.objectContaining({ code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' }),
    );
  });

  it('still resolves the main entry for the require condition', () => {
    expect(path.basename(consumerRequire.resolve(packageName))).toBe('vue-dynamic-form-element-plus.umd.js');
  });

  it('still resolves the main entry for the import condition', () => {
    const script = path.join(consumerDirectory, 'resolveImport.mjs');
    writeFileSync(script, `console.log(import.meta.resolve(${JSON.stringify(packageName)}));`);
    const resolved = execFileSync(process.execPath, [script], { encoding: 'utf8' }).trim();
    expect(path.basename(resolved)).toBe('vue-dynamic-form-element-plus.es.js');
  });
});
