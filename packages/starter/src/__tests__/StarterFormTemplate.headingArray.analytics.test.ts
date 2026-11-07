import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { removeButtons } from './fixtures/arrayHelpers';
import { headingArrayMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';
import { renderCount } from './fixtures/renderCount';

describe('component StarterFormTemplate - heading-array render counts', () => {
  it('renders each item once on mount and does not re-render items when a sibling field changes', async () => {
    const { wrapper } = await mountInForm({
      metadata: [headingArrayMetadata, { name: 'sibling', type: 'text' }],
      initialValues: { contacts: [{ first: 'Ann', last: 'Lee' }, { first: 'Bob', last: 'Ray' }] },
      settings: { analytics: true },
    });

    expect(renderCount(wrapper, 'contacts[0].first')).toBe(1);
    expect(renderCount(wrapper, 'contacts[1].first')).toBe(1);

    await wrapper.find('[data-testid="sibling-input"]').setValue('x');
    await flushPromises();

    expect(renderCount(wrapper, 'contacts[0].first')).toBe(1);
    expect(renderCount(wrapper, 'contacts[1].first')).toBe(1);
  });

  it('clicking the empty-state Add button does not re-render an unrelated sibling field', async () => {
    const { wrapper } = await mountInForm({
      metadata: [
        { ...headingArrayMetadata, minOccurs: 0, autoAddMinOccurs: false },
        { name: 'sibling', type: 'text' },
      ],
      settings: { analytics: true },
    });

    expect(renderCount(wrapper, 'sibling')).toBe(1);

    await wrapper.find('.sft-empty button').trigger('click');
    await flushPromises();

    expect(renderCount(wrapper, 'sibling')).toBe(1);
  });

  it('removing the last item adds no render cost beyond the engine own re-render, and leaves an unrelated sibling untouched', async () => {
    const { wrapper } = await mountInForm({
      metadata: [headingArrayMetadata, { name: 'sibling', type: 'text' }],
      initialValues: {
        contacts: [{ first: 'Ann', last: 'Lee' }, { first: 'Bob', last: 'Ray' }, { first: 'Cho', last: 'Kim' }],
      },
      settings: { analytics: true },
    });

    const before = [renderCount(wrapper, 'contacts[0].first'), renderCount(wrapper, 'contacts[1].first')];
    const siblingBefore = renderCount(wrapper, 'sibling');

    await removeButtons(wrapper, 'contacts')[2].trigger('click');
    await flushPromises();

    // The engine's own array mutation re-renders the surviving items once; the focus side effect adds no extra cost.
    expect(renderCount(wrapper, 'contacts[0].first')).toBeLessThanOrEqual(before[0] + 1);
    expect(renderCount(wrapper, 'contacts[1].first')).toBeLessThanOrEqual(before[1] + 1);
    expect(renderCount(wrapper, 'sibling')).toBe(siblingBefore);
  });
});
