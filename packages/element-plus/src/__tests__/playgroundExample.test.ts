import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractClassTokens, packageDirectory } from './helpers/sourceScan';

const playgroundDirectory = path.resolve(packageDirectory, '../../playgrounds/storybook');

function readPlayground(relativePath: string) {
  return readFileSync(path.join(playgroundDirectory, relativePath), 'utf8');
}

const wrapperPath = 'components/ElementPlusFormTemplateImplementation.vue';

const exampleFiles = [
  wrapperPath,
  ...readdirSync(path.join(playgroundDirectory, 'stories'))
    .filter(name => name.startsWith('ElementPlusForm'))
    .map(name => `stories/${name}`),
  '.storybook/preview.ts',
];

const sources = exampleFiles.map(file => ({ file, content: readPlayground(file) }));
const wrapper = readPlayground(wrapperPath);
const story = readPlayground('stories/ElementPlusForm.vue');

// Built from pieces so this file does not match its own patterns.
const removedComponentName = `${'ElementPlus'}${'DynamicForm'}`;
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
  it('scans the wrapper, the story files, and the storybook preview', () => {
    expect(exampleFiles).toEqual(expect.arrayContaining([
      wrapperPath,
      'stories/ElementPlusForm.vue',
      'stories/ElementPlusForm.stories.ts',
      '.storybook/preview.ts',
    ]));
  });

  it('does not reference the removed component name in any playground source', () => {
    const hits = sources.filter(source => source.content.toLowerCase().includes(removedComponentName.toLowerCase())).map(source => source.file);
    expect(hits).toEqual([]);
  });

  it('has no implementation wrapper under the old file name', () => {
    expect(existsSync(path.join(playgroundDirectory, `components/${removedComponentName}Implementation.vue`))).toBe(false);
    expect(existsSync(path.join(playgroundDirectory, wrapperPath))).toBe(true);
  });
});

describe('wrapper forwarding pattern', () => {
  it('forwards the input and attributes slots to the template', () => {
    expect(wrapper).toMatch(/<template #input="s">\s*<slot v-bind="s" \/>\s*<\/template>/);
    expect(wrapper).toMatch(/<template #attributes="s">\s*<slot name="attributes" v-bind="s" \/>\s*<\/template>/);
  });

  it('does not blanket-forward every slot', () => {
    expect(wrapper).not.toMatch(/v-for="[^"]*\bin \$slots"/);
    expect(wrapper).not.toContain('$slots');
  });

  it('destructures fieldMetadata and required in the default override', () => {
    const override = wrapper.match(/<template #default="\{([^}]*)\}">/);
    expect(override).not.toBeNull();
    const destructured = override![1].split(',').map(part => part.trim());
    expect(destructured).toEqual(expect.arrayContaining(['fieldMetadata', 'required']));
    expect(destructured).not.toContain('field');
  });

  it('renders the forwarded slot instead of the named input slot', () => {
    const start = wrapper.indexOf('<template #default="');
    const override = wrapper.slice(start, wrapper.indexOf('<template #date-input='));
    expect(start).toBeGreaterThan(-1);
    expect(override).toContain('<slot v-bind="s" />');
    expect(override).not.toContain('<slot name="input"');
    expect(override).toContain('fieldMetadata.label');
  });
});

describe('styling', () => {
  it('uses no Tailwind utility classes in the Element Plus example', () => {
    const hits = sources
      .filter(source => source.file !== '.storybook/preview.ts')
      .flatMap(source => extractClassTokens(source.content)
        .filter(token => utilityPatterns.some(pattern => pattern.test(token)))
        .map(token => `${source.file}: ${token}`));
    expect(hits).toEqual([]);
  });

  it('imports the package stylesheet through the exported subpath, next to the Element Plus one', () => {
    const importing = sources.filter(source => source.content.includes('@bach.software/vue-dynamic-form-element-plus/style.css'));
    expect(importing.length).toBeGreaterThan(0);
    expect(importing.some(source => source.content.includes('element-plus/dist/index.css'))).toBe(true);
    expect(sources.filter(source => /dist\/style\.css/.test(source.content)).map(source => source.file)).toEqual([]);
  });
});

describe('overrides and extension', () => {
  it('extends the built-in metadata and passes it as metadataConfiguration', () => {
    expect(wrapper).toContain('extendMetadata<');
    expect(wrapper).toMatch(/<ElementPlusFormTemplate\s+:metadataConfiguration="/);
    expect(wrapper).toContain('<template #richText-input=');
  });

  it('does not use the reserved slot names as extended field types', () => {
    const generics = wrapper.match(/extendMetadata<([\s\S]*?)>\(\)/)?.[1] ?? '';
    expect(generics).not.toBe('');
    expect(generics).not.toMatch(/\b(?:input|attributes)\s*\??:/);
  });

  it('overrides the date input with a marked replacement', () => {
    expect(wrapper).toContain('<template #date-input=');
    expect(wrapper).toContain('data-testid="customDateInput"');
  });

  it('wraps each form in a submit handler that shows an outcome', () => {
    expect(story).toContain('<form');
    expect(story).toContain('@submit.prevent');
    expect(story).toContain('handleSubmit');
    expect(story).toContain('data-testid="submit-result"');
    expect(story).toContain('data-testid="submit-errors"');
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
