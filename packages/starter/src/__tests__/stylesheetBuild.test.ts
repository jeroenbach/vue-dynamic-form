// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { build, resolveConfig } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { packageDirectory } from './helpers/sourceScan';

const configFile = path.join(packageDirectory, 'vite.config.ts');
const packageName = '@bach.software/vue-dynamic-form-starter';

let workDirectory: string;
let outDirectory: string;
let stylesheet: string;

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? listFiles(path.join(directory, entry.name)) : [path.join(directory, entry.name)],
  );
}

beforeAll(async () => {
  workDirectory = mkdtempSync(path.join(os.tmpdir(), 'sft-style-build-'));
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
  it('names the library bundle', async () => {
    const config = await resolveConfig({ root: packageDirectory, configFile, logLevel: 'silent' }, 'build', 'production');
    expect(config.build.lib && config.build.lib.name).toBe('VueDynamicFormStarter');
    const fileName = config.build.lib && config.build.lib.fileName;
    expect(typeof fileName === 'function' ? fileName('es', 'vue-dynamic-form-starter') : fileName).toBe('vue-dynamic-form-starter.es.js');
  });

  it('pins the stylesheet file name and disables css code splitting', async () => {
    const config = await resolveConfig({ root: packageDirectory, configFile, logLevel: 'silent' }, 'build', 'production');
    expect(config.build.lib && config.build.lib.cssFileName).toBe('style');
    expect(config.build.cssCodeSplit).not.toBe(true);
  });

  it('externalizes only the framework peers, bundling @lucide/vue', async () => {
    const config = await resolveConfig({ root: packageDirectory, configFile, logLevel: 'silent' }, 'build', 'production');
    const external = config.build.rollupOptions?.external;
    expect(external).toEqual(['vue', 'vee-validate', '@bach.software/vue-dynamic-form']);
  });

  it('gives every external a matching UMD global, no stale element-plus entry', async () => {
    const config = await resolveConfig({ root: packageDirectory, configFile, logLevel: 'silent' }, 'build', 'production');
    const output = config.build.rollupOptions?.output;
    const globals = Array.isArray(output) ? output[0]?.globals : output?.globals;
    expect(globals).toEqual({
      'vue': 'Vue',
      'vee-validate': 'VeeValidate',
      '@bach.software/vue-dynamic-form': 'VueDynamicForm',
    });
    expect((globals as Record<string, string> | undefined)?.['element-plus']).toBeUndefined();
  });
});

describe('build output', () => {
  it('emits a non-empty style.css', () => {
    expect(stylesheet.length).toBeGreaterThan(0);
  });

  it('emits no other stylesheet', () => {
    const stylesheets = listFiles(outDirectory).filter(file => file.endsWith('.css')).map(file => path.basename(file));
    expect(stylesheets).toEqual(['style.css']);
  });

  it('keeps styles out of the javascript bundles', () => {
    const bundles = listFiles(outDirectory).filter(file => file.endsWith('.js'));
    expect(bundles.map(file => path.basename(file)).sort()).toEqual([
      'vue-dynamic-form-starter.es.js',
      'vue-dynamic-form-starter.umd.js',
    ]);
    for (const bundle of bundles) {
      const content = readFileSync(bundle, 'utf8');
      expect(content).not.toMatch(/createElement\(\s*["']style["']\s*\)/);
      expect(content).not.toMatch(/import\s*["'][^"']*\.css["']/);
      expect(content).not.toMatch(/from\s*["'][^"']*\.css["']/);
    }
  });

  it('bundles the lucide icons used by the registry into the javascript, not externalized', () => {
    const bundles = listFiles(outDirectory).filter(file => file.endsWith('.js'));
    const esBundle = bundles.find(file => file.endsWith('.es.js'));
    expect(esBundle).toBeDefined();
    const content = readFileSync(esBundle!, 'utf8');
    expect(content).not.toMatch(/from\s*["']@lucide\/vue["']/);
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
    expect(path.basename(consumerRequire.resolve(packageName))).toBe('vue-dynamic-form-starter.umd.js');
  });

  it('still resolves the main entry for the import condition', () => {
    const script = path.join(consumerDirectory, 'resolveImport.mjs');
    writeFileSync(script, `console.log(import.meta.resolve(${JSON.stringify(packageName)}));`);
    const resolved = execFileSync(process.execPath, [script], { encoding: 'utf8' }).trim();
    expect(path.basename(resolved)).toBe('vue-dynamic-form-starter.es.js');
  });
});
