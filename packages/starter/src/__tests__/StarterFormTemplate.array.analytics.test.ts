import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { addButton } from './fixtures/arrayHelpers';
import { inlineArrayMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';
import { renderCount } from './fixtures/renderCount';

describe('component StarterFormTemplate - inline array render counts', () => {
  it('renders each item once on mount and does not re-render items when a sibling field changes', async () => {
    const { wrapper } = await mountInForm({
      metadata: [inlineArrayMetadata, { name: 'sibling', type: 'text' }],
      initialValues: { tags: ['a', 'b'] },
      settings: { analytics: true },
    });

    expect(renderCount(wrapper, 'tags[0]')).toBe(1);
    expect(renderCount(wrapper, 'tags[1]')).toBe(1);

    await wrapper.find('[data-testid="sibling-input"]').setValue('x');
    await flushPromises();

    expect(renderCount(wrapper, 'tags[0]')).toBe(1);
    expect(renderCount(wrapper, 'tags[1]')).toBe(1);
  });

  it('renders the new item once added, and does not multiply existing items beyond the engine own array-mutation cost', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...inlineArrayMetadata, maxOccurs: 5 },
      initialValues: { tags: ['a', 'b'] },
      settings: { analytics: true },
    });

    const before = [renderCount(wrapper, 'tags[0]'), renderCount(wrapper, 'tags[1]')];

    await addButton(wrapper, 'tags').trigger('click');
    await flushPromises();

    // The engine's own array mutation re-renders existing items once; the chrome adds no extra cost on top.
    expect(renderCount(wrapper, 'tags[0]')).toBeLessThanOrEqual(before[0] + 1);
    expect(renderCount(wrapper, 'tags[1]')).toBeLessThanOrEqual(before[1] + 1);
    expect(renderCount(wrapper, 'tags[2]')).toBe(1);
  });
});
