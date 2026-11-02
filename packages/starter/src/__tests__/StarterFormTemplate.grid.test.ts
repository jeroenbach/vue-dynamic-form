import { describe, expect, it } from 'vitest';
import { gridColumnsClasses, gridItemClasses } from '@/gridClasses';
import { mountInForm } from './fixtures/mountInForm';

const gridMetadata = {
  name: 'layout',
  type: 'grid',
  columns: 3,
  children: [
    { name: 'a', type: 'text', fieldOptions: { label: 'A' } },
    { name: 'b', type: 'text', fieldOptions: { label: 'B' }, colSpan: 2 },
  ],
};

describe('component StarterFormTemplate - grid field type', () => {
  it('renders a bare grid div with the configured columns, no card chrome', async () => {
    const { wrapper } = await mountInForm({ metadata: gridMetadata });

    const grid = wrapper.find('[data-testid="layout"]');
    expect(grid.element.tagName).toBe('DIV');
    expect(grid.classes()).toContain('sft-grid-plain');
    expect(grid.classes()).toContain('sft-cols-3');
    expect(grid.find('.sft-section').exists()).toBe(false);
    expect(grid.find('.sft-group').exists()).toBe(false);
  });

  it('renders the children as regular fields inside the grid', async () => {
    const { wrapper } = await mountInForm({ metadata: gridMetadata });

    const grid = wrapper.find('[data-testid="layout"]');
    expect(grid.find('[data-testid="layout.a"] input').exists()).toBe(true);
    expect(grid.find('[data-testid="layout.b"] input').exists()).toBe(true);
  });

  it('places a child through its colSpan', async () => {
    const { wrapper } = await mountInForm({ metadata: gridMetadata });

    const spanning = wrapper.find('[data-testid="layout.b"]');
    expect(spanning.classes()).toContain('sft-span-2');

    const regular = wrapper.find('[data-testid="layout.a"]');
    expect(regular.classes().some(name => name.startsWith('sft-span'))).toBe(false);
  });

  it('passes the columns of a heading section down to its own children grid', async () => {
    const { wrapper } = await mountInForm({
      metadata: {
        name: 'details',
        type: 'heading',
        fieldOptions: { label: 'Details' },
        columns: 4,
        children: [{ name: 'a', type: 'text', fieldOptions: { label: 'A' } }],
      },
    });

    const sectionRoot = wrapper.find('[data-testid="details"]');
    expect(sectionRoot.find('.sft-grid.sft-cols-4').exists()).toBe(true);
    expect(sectionRoot.classes()).not.toContain('sft-cols-4');
  });
});

describe('gridColumnsClasses', () => {
  it('maps a bare value to the md-tier class', () => {
    expect(gridColumnsClasses(2)).toEqual(['sft-cols-2']);
  });

  it('maps a responsive value to one class per declared tier', () => {
    expect(gridColumnsClasses({ base: 2, lg: 6 })).toEqual(['sft-cols-base-2', 'sft-cols-lg-6']);
    expect(gridColumnsClasses({ base: 1, md: 2, lg: 3 })).toEqual(['sft-cols-base-1', 'sft-cols-2', 'sft-cols-lg-3']);
  });

  it('returns no classes without a value', () => {
    expect(gridColumnsClasses()).toEqual([]);
    expect(gridColumnsClasses({})).toEqual([]);
  });
});

describe('gridItemClasses', () => {
  it('maps bare values to md-tier classes', () => {
    expect(gridItemClasses(3)).toEqual(['sft-span-3']);
    expect(gridItemClasses('full')).toEqual(['sft-span-full']);
    expect(gridItemClasses(2, 2)).toEqual(['sft-span-2', 'sft-col-start-2']);
    expect(gridItemClasses(undefined, 3)).toEqual(['sft-col-start-3']);
  });

  it('maps responsive values to one class per declared tier', () => {
    expect(gridItemClasses({ base: 2, md: 3, lg: 'full' })).toEqual(['sft-span-base-2', 'sft-span-3', 'sft-span-lg-full']);
    expect(gridItemClasses(undefined, { base: 1, lg: 4 })).toEqual(['sft-col-start-base-1', 'sft-col-start-lg-4']);
  });

  it('returns no classes without values', () => {
    expect(gridItemClasses()).toEqual([]);
    expect(gridItemClasses({}, {})).toEqual([]);
  });
});
