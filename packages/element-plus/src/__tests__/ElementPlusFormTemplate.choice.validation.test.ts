import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { addButton, click, errorMessage, explicitSingle, occurrenceCards, requiredExplicit, requiredRepeatable, sectionOf } from './choice.test-helpers';
import { mountInForm } from './fixtures/mountInForm';

const settings = { messages: { choiceMinOccurs: 'Pick a branch', minLength: 'Too short' }, validateOnValueUpdate: true };

describe('component ElementPlusFormTemplate - choice validation', () => {
  it('shows the choice error when a required choice has no selection and clears it once a branch holds a value', async () => {
    const { wrapper, validate } = await mountInForm({ metadata: requiredExplicit, settings });

    await validate();
    await flushPromises();
    expect(errorMessage(wrapper, 'pick').exists()).toBe(true);
    expect(errorMessage(wrapper, 'pick').text()).not.toBe('');

    await click(addButton(wrapper, 'pick', 'b'));
    await wrapper.find('input').setValue('filled');
    await flushPromises();
    await validate();
    await flushPromises();

    expect(errorMessage(wrapper, 'pick').exists()).toBe(false);
  });

  it('shows the choice error again when the only occurrence of a required repeatable choice is removed', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: requiredRepeatable,
      initialValues: { pick: { a: ['x'] } },
      settings,
    });
    await validate();
    await flushPromises();
    expect(errorMessage(wrapper, 'pick').exists()).toBe(false);

    await click(wrapper.find('[data-testid="pick.a[0]-remove-choice-button"]'));
    await validate();
    await flushPromises();

    expect(errorMessage(wrapper, 'pick').exists()).toBe(true);
    expect(errorMessage(wrapper, 'pick').text()).not.toBe('');
  });

  it('shows an occurrence error inside its own card and not in its siblings', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: {
        ...requiredRepeatable,
        choice: [{ name: 'a', type: 'text', label: 'Alpha', restriction: { minLength: 3 } }],
      },
      initialValues: { pick: { a: ['x', 'long enough'] } },
      settings,
    });

    await validate();
    await flushPromises();

    const [first, second] = occurrenceCards(wrapper, 'pick');
    expect(first.find('.epft-array-error').text()).toBe('Too short');
    expect(second.find('.epft-array-error').exists()).toBe(false);
  });

  it('does not show a choice error for an optional choice', async () => {
    const { wrapper, validate } = await mountInForm({ metadata: { ...explicitSingle, minOccurs: 0 }, settings });

    await validate();
    await flushPromises();

    expect(errorMessage(wrapper, 'pick').exists()).toBe(false);
  });

  it('marks the section title as required for a required choice only', async () => {
    const { wrapper } = await mountInForm({ metadata: [requiredExplicit, { ...explicitSingle, name: 'optional', minOccurs: 0 }] });

    expect(sectionOf(wrapper, 'pick').find('.epft-array-title').classes()).toContain('is-required');
    expect(sectionOf(wrapper, 'optional').find('.epft-array-title').classes()).not.toContain('is-required');
  });

  it('keeps the field chrome and the required marker for a required field inside the active branch', async () => {
    const { wrapper } = await mountInForm({
      metadata: {
        ...explicitSingle,
        choice: [{ name: 'a', type: 'text', label: 'Alpha', minOccurs: 1 }],
      },
      initialValues: { pick: { a: 'x' } },
      settings,
    });

    const item = sectionOf(wrapper, 'pick').find('.el-form-item');
    expect(item.classes()).toContain('is-required');
    expect(item.find('.el-form-item__label').text()).toBe('Alpha');
  });
});
