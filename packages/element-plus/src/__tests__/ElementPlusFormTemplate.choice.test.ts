import type { Slots } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { ElButton, ElCard, ElInput } from 'element-plus';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { addButton, addButtons, autoRepeatable, click, counterNumbers, explicitRepeatable, explicitSingle, inputValues, insertionOrderIndicator, kindBadge, occurrenceCards, occurrenceNumber, removeButton, removeButtons, sectionOf } from './choice.test-helpers';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { expectNoWarnings } from './fixtures/expectNoWarnings';
import { mountInForm } from './fixtures/mountInForm';

const marker = (testid: string) => (scope: any, slots: Slots) => h('div', { 'data-testid': testid }, slots.default?.(scope));

describe('component ElementPlusFormTemplate - single choice section', () => {
  expectNoWarnings();

  it('shows one add control per branch and no branch content before selection', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitSingle });

    const buttons = addButtons(wrapper, 'pick');
    expect(buttons.map(button => button.text())).toEqual(['Alpha', 'Beta', 'c']);
    expect(wrapper.findAll('input')).toHaveLength(0);
    expect(removeButtons(wrapper, 'pick')).toHaveLength(0);
    const card = wrapper.findAllComponents(ElCard).find(candidate => candidate.attributes('data-testid') === 'pick-choice-section');
    expect(card).toBeDefined();
  });

  it('titles the section with the choice label', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitSingle });

    expect(sectionOf(wrapper, 'pick').find('.epft-array-title').text()).toBe('Pick one');
  });

  it('renders the controls as buttons', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitSingle, initialValues: { pick: { b: 'x' } } });

    const buttons = sectionOf(wrapper, 'pick').findAllComponents(ElButton);
    expect(buttons).toHaveLength(4);
  });

  it('renders only the controls and the active branch for a loaded value', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitSingle, initialValues: { pick: { b: 'x' } } });

    expect(inputValues(wrapper)).toEqual(['x']);
    expect(removeButton(wrapper, 'pick', 'b').exists()).toBe(true);
    expect(removeButton(wrapper, 'pick', 'a').exists()).toBe(false);
  });

  it('shows the branch label and falls back to the branch name', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitSingle });

    expect(addButton(wrapper, 'pick', 'a').text()).toBe('Alpha');
    expect(addButton(wrapper, 'pick', 'c').text()).toBe('c');
  });
});

describe('component ElementPlusFormTemplate - repeatable choice section', () => {
  expectNoWarnings();

  it('shows per-branch add controls and a used-of-max counter', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitRepeatable });

    expect(addButtons(wrapper, 'pick')).toHaveLength(3);
    expect(counterNumbers(wrapper, 'pick')).toEqual({ used: 0, max: 3 });

    await click(addButton(wrapper, 'pick', 'a'));
    await click(addButton(wrapper, 'pick', 'b'));

    expect(counterNumbers(wrapper, 'pick')).toEqual({ used: 2, max: 3 });
    expect(sectionOf(wrapper, 'pick').findAllComponents(ElInput)).toHaveLength(2);
  });

  it('renders one card per occurrence with kind badge, number, and remove control', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitRepeatable });
    await click(addButton(wrapper, 'pick', 'a'));
    await click(addButton(wrapper, 'pick', 'b'));

    const cards = occurrenceCards(wrapper, 'pick');
    expect(cards.map(card => card.attributes('data-testid'))).toEqual(['pick.a[0]-choice-occurrence', 'pick.b[0]-choice-occurrence']);
    expect(kindBadge(wrapper, 'pick.a[0]').text()).toBe('Alpha');
    expect(kindBadge(wrapper, 'pick.b[0]').text()).toBe('Beta');
    expect(occurrenceNumber(wrapper, 'pick.a[0]')).toBe(1);
    expect(occurrenceNumber(wrapper, 'pick.b[0]')).toBe(2);
    for (const card of cards)
      expect(card.find('[data-testid$="-remove-choice-button"]').exists()).toBe(true);
  });

  it('falls back to the branch name in the kind badge when the branch has no label', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitRepeatable });
    await click(addButton(wrapper, 'pick', 'c'));

    expect(kindBadge(wrapper, 'pick.c[0]').text()).toBe('c');
  });

  it('uses the card primitive for occurrences and a button for the remove control', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitRepeatable, initialValues: { pick: { a: ['x'] } } });

    const card = wrapper.findAllComponents(ElCard).find(candidate => candidate.attributes('data-testid') === 'pick.a[0]-choice-occurrence');
    expect(card).toBeDefined();
    const remove = card!.findAllComponents(ElButton).find(button => button.attributes('data-testid') === 'pick.a[0]-remove-choice-button');
    expect(remove).toBeDefined();
  });

  it('shows the added-order indicator only for occurrences added this session', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitRepeatable, initialValues: { pick: { a: ['x'] } } });
    await click(addButton(wrapper, 'pick', 'b'));

    expect(occurrenceCards(wrapper, 'pick')).toHaveLength(2);
    expect(insertionOrderIndicator(wrapper, 'pick.a[0]').exists()).toBe(false);
    expect(insertionOrderIndicator(wrapper, 'pick.b[0]').text()).toBe('1');
  });

  it('renders an occurrence loaded from initial values without an indicator', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitRepeatable, initialValues: { pick: { a: ['x'], b: ['y'] } } });

    expect(occurrenceCards(wrapper, 'pick')).toHaveLength(2);
    expect(insertionOrderIndicator(wrapper, 'pick.a[0]').exists()).toBe(false);
    expect(insertionOrderIndicator(wrapper, 'pick.b[0]').exists()).toBe(false);
    expect(counterNumbers(wrapper, 'pick').used).toBe(2);
  });
});

describe('component ElementPlusFormTemplate - choice dispatch precedence', () => {
  it('renders repeatable choice occurrences as choice cards and not through the array fallbacks', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitRepeatable, initialValues: { pick: { a: ['x'], b: ['y'] } } });

    expect(kindBadge(wrapper, 'pick.a[0]').exists()).toBe(true);
    expect(wrapper.findAll('[data-testid$="-array-section"]')).toHaveLength(0);
    expect(wrapper.findAll('[data-testid*="-array-item-"]')).toHaveLength(0);
    expect(wrapper.findAll('.epft-array-item')).toHaveLength(0);
  });

  it('ignores consumer array overrides for a repeatable choice', async () => {
    const { wrapper } = await mountInForm({
      metadata: explicitRepeatable,
      initialValues: { pick: { a: ['x'] } },
      template: createConsumerWrapper({
        overrides: {
          'default-array': marker('array-section-override'),
          'default-array-item': marker('array-item-override'),
        },
      }),
    });

    expect(wrapper.findAll('[data-testid="array-section-override"]')).toHaveLength(0);
    expect(wrapper.findAll('[data-testid="array-item-override"]')).toHaveLength(0);
    expect(kindBadge(wrapper, 'pick.a[0]').exists()).toBe(true);
  });
});

describe('component ElementPlusFormTemplate - overriding choice slots', () => {
  expectNoWarnings();

  const initialValues = { pick: { a: ['x'], b: ['y'] } };

  it('keeps the built-in section when only the occurrence slot is overridden', async () => {
    const { wrapper } = await mountInForm({
      metadata: explicitRepeatable,
      initialValues,
      template: createConsumerWrapper({ overrides: { 'default-choice-array-item': marker('custom-occurrence') } }),
    });

    expect(sectionOf(wrapper, 'pick').exists()).toBe(true);
    expect(addButtons(wrapper, 'pick')).toHaveLength(3);
    expect(counterNumbers(wrapper, 'pick').max).toBe(3);
    expect(wrapper.findAll('[data-testid="custom-occurrence"]')).toHaveLength(2);
    expect(occurrenceCards(wrapper, 'pick')).toHaveLength(0);
    expect(inputValues(wrapper)).toEqual(['x', 'y']);
  });

  it('keeps the built-in occurrence cards when only the repeatable section slot is overridden', async () => {
    const { wrapper } = await mountInForm({
      metadata: explicitRepeatable,
      initialValues,
      template: createConsumerWrapper({ overrides: { 'default-choice-array': marker('custom-section') } }),
    });

    const custom = wrapper.find('[data-testid="custom-section"]');
    expect(custom.exists()).toBe(true);
    expect(sectionOf(wrapper, 'pick').exists()).toBe(false);
    expect(custom.findAll('[data-testid$="-choice-occurrence"]')).toHaveLength(2);
  });

  it('applies a single-choice override to single choices only', async () => {
    const { wrapper } = await mountInForm({
      metadata: [explicitSingle, { ...explicitRepeatable, name: 'many' }],
      template: createConsumerWrapper({ overrides: { 'default-choice': marker('custom-single') } }),
    });

    expect(wrapper.findAll('[data-testid="custom-single"]')).toHaveLength(1);
    expect(sectionOf(wrapper, 'pick').exists()).toBe(false);
    expect(sectionOf(wrapper, 'many').exists()).toBe(true);
    expect(counterNumbers(wrapper, 'many').max).toBe(3);
  });

  it('applies a repeatable-choice override to repeatable choices only', async () => {
    const { wrapper } = await mountInForm({
      metadata: [explicitSingle, { ...explicitRepeatable, name: 'many' }],
      template: createConsumerWrapper({ overrides: { 'default-choice-array': marker('custom-many') } }),
    });

    expect(wrapper.findAll('[data-testid="custom-many"]')).toHaveLength(1);
    expect(sectionOf(wrapper, 'many').exists()).toBe(false);
    expect(sectionOf(wrapper, 'pick').exists()).toBe(true);
  });
});

describe('component ElementPlusFormTemplate - per-type choice slots', () => {
  expectNoWarnings();

  const textSingle = { ...explicitSingle, type: 'text' };
  const textRepeatable = { ...explicitRepeatable, type: 'text', name: 'many' };
  const initialValues = { many: { a: ['x'] } };

  it('replaces the built-in section for that type only', async () => {
    const { wrapper } = await mountInForm({
      metadata: [textSingle, { ...explicitSingle, type: 'number', name: 'other' }],
      template: createConsumerWrapper({ overrides: { 'text-choice': marker('text-choice-override') } }),
    });

    expect(wrapper.findAll('[data-testid="text-choice-override"]')).toHaveLength(1);
    expect(sectionOf(wrapper, 'pick').exists()).toBe(false);
    expect(sectionOf(wrapper, 'other').exists()).toBe(true);
  });

  it('does not let a single-choice type override reach a repeatable choice', async () => {
    const { wrapper } = await mountInForm({
      metadata: textRepeatable,
      initialValues,
      template: createConsumerWrapper({ overrides: { 'text-choice': marker('text-choice-override') } }),
    });

    expect(wrapper.findAll('[data-testid="text-choice-override"]')).toHaveLength(0);
    expect(sectionOf(wrapper, 'many').exists()).toBe(true);
  });

  it('forwards the per-type repeatable section and occurrence slots', async () => {
    const { wrapper } = await mountInForm({
      metadata: [textRepeatable, { ...explicitRepeatable, type: 'number', name: 'other' }],
      initialValues: { many: { a: ['x'] }, other: { a: [1] } },
      template: createConsumerWrapper({
        overrides: {
          'text-choice-array': marker('typed-section'),
          'text-choice-array-item': marker('typed-occurrence'),
        },
      }),
    });
    await flushPromises();

    expect(wrapper.findAll('[data-testid="typed-section"]')).toHaveLength(1);
    expect(sectionOf(wrapper, 'many').exists()).toBe(false);
    expect(sectionOf(wrapper, 'other').exists()).toBe(true);
  });

  it('forwards a per-type occurrence slot while keeping the built-in section', async () => {
    const { wrapper } = await mountInForm({
      metadata: textRepeatable,
      initialValues,
      template: createConsumerWrapper({ overrides: { 'text-choice-array-item': marker('typed-occurrence') } }),
    });

    expect(sectionOf(wrapper, 'many').exists()).toBe(true);
    expect(wrapper.findAll('[data-testid="typed-occurrence"]')).toHaveLength(1);
    expect(occurrenceCards(wrapper, 'many')).toHaveLength(0);
  });
});

describe('component ElementPlusFormTemplate - automatic mode structure', () => {
  it('renders the section chrome without selection controls', async () => {
    const { wrapper } = await mountInForm({ metadata: autoRepeatable });

    expect(sectionOf(wrapper, 'pick').exists()).toBe(true);
    expect(addButtons(wrapper, 'pick')).toHaveLength(0);
    expect(wrapper.findAll('[data-testid$="-array-section"]')).toHaveLength(3);
  });
});
