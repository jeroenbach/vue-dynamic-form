import { describe, expect, it } from 'vitest';
import { gridColumnsClasses, gridItemClasses } from '@/gridClasses';
import { itemCards } from './fixtures/arrayHelpers';
import { autoChoiceMetadata, explicitChoiceArrayMetadata } from './fixtures/choiceMetadata';
import { headingArrayMetadata } from './fixtures/metadata';
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

  it('spans everything that is not an input field over the full row by default', async () => {
    const { wrapper } = await mountInForm({
      metadata: {
        name: 'layout',
        type: 'grid',
        columns: 2,
        children: [
          { name: 'intro', type: 'heading', fieldOptions: { label: 'Intro' }, minOccurs: 0 },
          { name: 'a', type: 'text', fieldOptions: { label: 'A' } },
        ],
      },
    });

    // a heading without children still takes the full row; only input fields flow per column
    expect(wrapper.find('[data-testid="layout.intro"]').classes()).toContain('sft-span-full');
    expect(wrapper.find('[data-testid="layout.a"]').classes()).not.toContain('sft-span-full');
  });

  it('spans a choice group over the full row by default, unless colSpan narrows it', async () => {
    const { wrapper } = await mountInForm({ metadata: autoChoiceMetadata });
    expect(wrapper.find('[data-testid="payment"]').classes()).toContain('sft-span-full');

    const { wrapper: narrowed } = await mountInForm({ metadata: { ...autoChoiceMetadata, colSpan: 2 } });
    const classes = narrowed.find('[data-testid="payment"]').classes();
    // both classes land on the element; the numeric utility wins because sft-span-full
    // is declared before the numeric spans in the stylesheet
    expect(classes).toContain('sft-span-full');
    expect(classes).toContain('sft-span-2');
  });

  it('spans repeater item cards over the full row by default', async () => {
    const { wrapper } = await mountInForm({
      metadata: headingArrayMetadata,
      initialValues: { contacts: [{ first: 'Ann' }] },
    });
    expect(itemCards(wrapper, 'contacts')[0].classes()).toContain('sft-span-full');

    const { wrapper: choiceArray } = await mountInForm({
      metadata: explicitChoiceArrayMetadata,
      initialValues: { channels: { email: ['ops@acme.example'] } },
    });
    expect(choiceArray.find('.sft-repeater').classes()).toContain('sft-span-full');
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
