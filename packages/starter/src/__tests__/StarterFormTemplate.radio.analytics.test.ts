import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { mountInForm } from './fixtures/mountInForm';
import { renderCount } from './fixtures/renderCount';

const metadata = {
  name: 'root',
  children: [
    { name: 'contactMethod', type: 'radio', fieldOptions: { label: 'How should we contact you?' }, options: [{ key: 'email', value: 'Email' }, { key: 'phone', value: 'Phone' }] },
    { name: 'nickname', type: 'text', fieldOptions: { label: 'Nickname' } },
  ],
};

describe('component StarterFormTemplate - radio render counts', () => {
  it('renders once on mount and does not bump an unrelated sibling when a different option is chosen', async () => {
    const { wrapper } = await mountInForm({ metadata, settings: { analytics: true } });

    expect(renderCount(wrapper, 'root.contactMethod')).toBe(1);
    expect(renderCount(wrapper, 'root.nickname')).toBe(1);

    await wrapper.findAll('input[type="radio"]')[1].setValue();
    await flushPromises();

    expect(renderCount(wrapper, 'root.nickname')).toBe(1);
  });
});
