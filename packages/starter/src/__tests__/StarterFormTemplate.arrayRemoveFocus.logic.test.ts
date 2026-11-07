import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { addButton as addChoiceBranchButton, click as clickAndFlush } from './choice.test-helpers';
import { addButton, isDisabled, removeButtons, section } from './fixtures/arrayHelpers';
import { explicitChoiceArrayMetadata } from './fixtures/choiceMetadata';
import { groupArrayMetadata, headingArrayMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

const threeContacts = {
  contacts: [
    { first: 'Ann', last: 'Lee' },
    { first: 'Bob', last: 'Ray' },
    { first: 'Cho', last: 'Kim' },
  ],
};

/** Focuses a wrapped DOM node, simulating a keyboard user already tabbed onto it. */
function focus(wrapped: { element: Element }): void {
  (wrapped.element as HTMLElement).focus();
}

describe('component StarterFormTemplate - focus after removing an array item', () => {
  it('focuses the previous item\'s remove button when a middle item is removed', async () => {
    const { wrapper } = await mountInForm({ metadata: headingArrayMetadata, initialValues: threeContacts });

    const middle = removeButtons(wrapper, 'contacts')[1];
    focus(middle);
    expect(document.activeElement).toBe(middle.element);

    await middle.trigger('click');
    await flushPromises();

    expect(document.activeElement).toBe(removeButtons(wrapper, 'contacts')[0].element);
  });

  it('focuses the new last item\'s remove button when the last item is removed', async () => {
    const { wrapper } = await mountInForm({ metadata: headingArrayMetadata, initialValues: threeContacts });

    const last = removeButtons(wrapper, 'contacts')[2];
    focus(last);

    await last.trigger('click');
    await flushPromises();

    expect(document.activeElement).toBe(removeButtons(wrapper, 'contacts')[1].element);
  });

  it('focuses the section\'s add button when the first item is removed and others remain', async () => {
    const { wrapper } = await mountInForm({
      metadata: headingArrayMetadata,
      initialValues: { contacts: [{ first: 'Ann', last: 'Lee' }, { first: 'Bob', last: 'Ray' }] },
    });

    const first = removeButtons(wrapper, 'contacts')[0];
    focus(first);

    await first.trigger('click');
    await flushPromises();

    const add = addButton(wrapper, 'contacts');
    expect(document.activeElement).toBe(add.element);
    expect(isDisabled(add)).toBe(false);
  });

  it('focuses the empty-state add button when the only remaining item is removed', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...headingArrayMetadata, minOccurs: 0, autoAddMinOccurs: false },
      initialValues: { contacts: [{ first: 'Ann', last: 'Lee' }] },
    });

    const only = removeButtons(wrapper, 'contacts')[0];
    focus(only);

    await only.trigger('click');
    await flushPromises();

    const emptyAdd = wrapper.find('.sft-empty button');
    expect(document.activeElement).toBe(emptyAdd.element);
  });

  it('recomputes the target on a second removal rather than reusing a stale reference', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...headingArrayMetadata, minOccurs: 0, autoAddMinOccurs: false },
      initialValues: { contacts: [{ first: 'Ann', last: 'Lee' }, { first: 'Bob', last: 'Ray' }] },
    });

    const first = removeButtons(wrapper, 'contacts')[0];
    focus(first);
    await first.trigger('click');
    await flushPromises();

    expect(document.activeElement).toBe(addButton(wrapper, 'contacts').element);

    const onlyRemaining = removeButtons(wrapper, 'contacts')[0];
    focus(onlyRemaining);
    await onlyRemaining.trigger('click');
    await flushPromises();

    expect(document.activeElement).toBe(wrapper.find('.sft-empty button').element);
  });

  it('scopes focus restoration to the section the removal happened in', async () => {
    const { wrapper } = await mountInForm({
      metadata: [
        { ...headingArrayMetadata, name: 'contactsA' },
        { ...headingArrayMetadata, name: 'contactsB' },
      ],
      initialValues: {
        contactsA: [{ first: 'Ann', last: 'Lee' }, { first: 'Bob', last: 'Ray' }],
        contactsB: [{ first: 'Cho', last: 'Kim' }, { first: 'Dee', last: 'Fox' }],
      },
    });

    const beforeCountB = removeButtons(wrapper, 'contactsB').length;

    const firstA = removeButtons(wrapper, 'contactsA')[0];
    focus(firstA);
    await firstA.trigger('click');
    await flushPromises();

    const target = document.activeElement as HTMLElement;
    expect(section(wrapper, 'contactsA').element.contains(target)).toBe(true);
    expect(section(wrapper, 'contactsB').element.contains(target)).toBe(false);
    expect(removeButtons(wrapper, 'contactsB')).toHaveLength(beforeCountB);
  });

  it('focuses the previous item\'s own remove button in a default-slot (GroupField) array, not only a heading-array RepeaterCard', async () => {
    const { wrapper } = await mountInForm({
      metadata: groupArrayMetadata,
      initialValues: { members: [{ name: 'Ann' }, { name: 'Bob' }] },
    });

    const last = removeButtons(wrapper, 'members')[1];
    focus(last);

    await last.trigger('click');
    await flushPromises();

    expect(document.activeElement).toBe(removeButtons(wrapper, 'members')[0].element);
  });

  it('stays inside the form the removal happened in when two separate forms render the same array path', async () => {
    const formA = await mountInForm({ metadata: headingArrayMetadata, initialValues: threeContacts });
    const formB = await mountInForm({ metadata: headingArrayMetadata, initialValues: threeContacts });

    const middleOfB = removeButtons(formB.wrapper, 'contacts')[1];
    focus(middleOfB);
    await middleOfB.trigger('click');
    await flushPromises();

    const target = document.activeElement as HTMLElement;
    expect(section(formB.wrapper, 'contacts').element.contains(target)).toBe(true);
    expect(section(formA.wrapper, 'contacts').element.contains(target)).toBe(false);
  });

  it('focuses somewhere inside the section, not the document body, when removing a choice-array occurrence', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitChoiceArrayMetadata });

    await clickAndFlush(addChoiceBranchButton(wrapper, 'channels', 'email'));
    await clickAndFlush(addChoiceBranchButton(wrapper, 'channels', 'email'));

    const second = removeButtons(wrapper, 'channels.email')[1];
    focus(second);

    await second.trigger('click');
    await flushPromises();

    const target = document.activeElement as Node;
    expect(target).not.toBe(document.body);
    expect(section(wrapper, 'channels').element.contains(target)).toBe(true);
  });

  it('does not change the engine\'s array mutation, only adds a focus side effect', async () => {
    const { wrapper, values } = await mountInForm({ metadata: headingArrayMetadata, initialValues: threeContacts });

    const middle = removeButtons(wrapper, 'contacts')[1];
    await middle.trigger('click');
    await flushPromises();

    const contacts = values().contacts as Array<{ first: string, last: string }>;
    expect(contacts).toHaveLength(2);
    expect(contacts[0].first).toBe('Ann');
    expect(contacts[1].first).toBe('Cho');
  });
});
