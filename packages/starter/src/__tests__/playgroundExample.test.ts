import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractClassTokens, packageDirectory } from './helpers/sourceScan';

const playgroundDirectory = path.resolve(packageDirectory, '../../playgrounds/storybook');

function readPlayground(relativePath: string) {
  return readFileSync(path.join(playgroundDirectory, relativePath), 'utf8');
}

const wrapperPath = 'components/StarterFormTemplateImplementation.vue';
const shellPath = 'stories/StarterForm.vue';
const examplesPath = 'stories/StarterForm.examples.ts';
const storiesPath = 'stories/StarterForm.stories.ts';
const packageJsonPath = path.join(playgroundDirectory, 'package.json');

const exampleFiles = [
  wrapperPath,
  ...readdirSync(path.join(playgroundDirectory, 'stories'))
    .filter(name => name.startsWith('StarterForm'))
    .map(name => `stories/${name}`),
];

const sources = exampleFiles.map(file => ({ file, content: readPlayground(file) }));
const wrapper = readPlayground(wrapperPath);
const shell = readPlayground(shellPath);
const examples = readPlayground(examplesPath);
const stories = readPlayground(storiesPath);

// Built from pieces so this file does not match its own patterns.
const emDash = String.fromCodePoint(0x2014);
const processReferences = [
  new RegExp(`${'FEAT'}-\\d`),
  new RegExp(`\\b${'ST'}-\\d`),
  new RegExp(`\\b${'AC'}\\d`),
  new RegExp(`${'ADR'}-\\d`),
  new RegExp(`${'finding'} \\d`, 'i'),
  new RegExp(`${'QA'} ${'plan'}`, 'i'),
  new RegExp(`${'decision'} \\d`, 'i'),
];

const utilityPatterns = [
  /^(?:flex|grid)$/,
  /^(?:gap|space-[xy]|[pm][xy]?|mb|mt|border|rounded|bg|overflow|[wh])(?:-|$)/,
  /^text-(?:xs|sm|base|lg|xl|\dxl)$/,
  /^font-(?:bold|semibold|medium)$/,
];

describe('playground example sources', () => {
  it('scans the wrapper and every StarterForm story file', () => {
    expect(exampleFiles).toEqual(expect.arrayContaining([
      wrapperPath,
      shellPath,
      examplesPath,
      storiesPath,
    ]));
  });

  it('has an implementation component and a stories entry under the expected names', () => {
    expect(existsSync(path.join(playgroundDirectory, wrapperPath))).toBe(true);
    expect(existsSync(path.join(playgroundDirectory, shellPath))).toBe(true);
    expect(existsSync(path.join(playgroundDirectory, storiesPath))).toBe(true);
  });
});

describe('workspace dependency', () => {
  it('package.json links the starter package as a workspace dependency', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    expect(packageJson.dependencies['@bach.software/vue-dynamic-form-starter']).toBe('link:../../packages/starter');
  });

  it('imports the stylesheet exactly once across the new files', () => {
    const matches = sources.flatMap(source => [...source.content.matchAll(/@bach\.software\/vue-dynamic-form-starter\/style\.css/g)]);
    expect(matches.length).toBe(1);
  });
});

describe('wrapper forwarding pattern', () => {
  it('forwards the input slot to the template', () => {
    expect(wrapper).toMatch(/<template #input="s">\s*<slot v-bind="s" \/>\s*<\/template>/);
  });

  it('does not blanket-forward every slot', () => {
    expect(wrapper).not.toMatch(/v-for="[^"]*\bin \$slots"/);
    expect(wrapper).not.toContain('$slots');
  });

  it('supplies a #icon template slot on the wrapper, not on DynamicForm directly', () => {
    expect(wrapper).toContain('<template #icon=');
    expect(wrapper).toContain('<StarterFormTemplate>');
    expect(shell).not.toMatch(/<DynamicForm[^>]*>[\s\S]*?#icon/);
  });

  it('passes the wrapper as :template, never directly to DynamicForm as an icon slot host', () => {
    expect(shell).toContain('StarterFormTemplateImplementation');
    expect(shell).toMatch(/<DynamicForm\s+:metadata="metadata"\s+:template="template"\s*\/>/);
  });
});

describe('dark mode toggle', () => {
  it('toggles the dark class on document.documentElement, not on a story-local wrapper', () => {
    expect(shell).toContain('document.documentElement.classList.toggle(\'dark\')');
  });

  it('ships a visible button that drives the toggle', () => {
    expect(shell).toMatch(/<button[^>]*data-testid="dark-mode-toggle"[^>]*@click="toggleDarkMode"/);
  });
});

describe('structural shape coverage', () => {
  it('example metadata includes a plain field, a group, an array, a choice, and a wizard node', () => {
    expect(examples).toMatch(/type:\s*'text'/);
    expect(examples).toMatch(/type:\s*'heading'/);
    expect(examples).toMatch(/maxOccurs:\s*\d/);
    expect(examples).toMatch(/choice:\s*[[{]/);
    expect(examples).toMatch(/wizard:\s*true/);
  });
});

describe('prototype deep links', () => {
  const anchors = [
    'text-field',
    'select-field',
    'switch-field',
    'group',
    'array-empty',
    'array-filled',
    'choice-auto',
    'choice-explicit',
    'choice-array',
    'wizard',
    'review',
    'icons',
  ];

  it.each(anchors)('links prototype.html#%s somewhere in the examples or the stories descriptions', (anchor) => {
    const combined = `${examples}\n${stories}`;
    expect(combined).toContain(`prototype.html#${anchor}`);
  });
});

describe('styling', () => {
  it('uses no Tailwind utility classes in the starter example', () => {
    const hits = sources
      .flatMap(source => extractClassTokens(source.content)
        .filter(token => utilityPatterns.some(pattern => pattern.test(token)))
        .map(token => `${source.file}: ${token}`));
    expect(hits).toEqual([]);
  });
});

describe('source hygiene', () => {
  it('has no em dashes', () => {
    expect(sources.filter(source => source.content.includes(emDash)).map(source => source.file)).toEqual([]);
  });

  it('has no process-artifact references', () => {
    const hits = sources
      .filter(source => processReferences.some(pattern => pattern.test(source.content)))
      .map(source => source.file);
    expect(hits).toEqual([]);
  });

  it('does not use kebab-case bound props or events', () => {
    const boundProp = /(?<![\w-])(?::|v-bind:)(?!data-|aria-)[a-z]+(?:-[a-z]+)+\s*=/;
    const event = /(?<![\w-])@[\w:]*[a-z]-[a-z][\w:-]*\s*=/;
    const hits = sources
      .filter(source => source.file.endsWith('.vue'))
      .filter(source => boundProp.test(source.content) || event.test(source.content))
      .map(source => source.file);
    expect(hits).toEqual([]);
  });
});
