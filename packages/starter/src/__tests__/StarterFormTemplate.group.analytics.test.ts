import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { groupMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';
import { renderCount } from './fixtures/renderCount';

describe('component StarterFormTemplate - group render counts', () => {
  it('renders each child once and does not re-render a sibling child when typing', async () => {
    const { wrapper } = await mountInForm({ metadata: groupMetadata, settings: { analytics: true } });

    expect(renderCount(wrapper, 'address.street')).toBe(1);
    expect(renderCount(wrapper, 'address.city')).toBe(1);

    await wrapper.find('[data-testid="address.street-input"]').setValue('1 Main St');
    await flushPromises();

    expect(renderCount(wrapper, 'address.city')).toBe(1);
  });
});
