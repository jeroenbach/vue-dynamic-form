import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { mountInForm } from './fixtures/mountInForm';
import { renderCount } from './fixtures/renderCount';

const fieldTypes: [string, Record<string, unknown>][] = [
  ['text', { type: 'text' }],
  ['select', { type: 'select', options: [{ key: 'a', value: 'A' }] }],
  ['checkbox', { type: 'checkbox' }],
  ['password', { type: 'password' }],
];

describe('component StarterFormTemplate - render counts', () => {
  it.each(fieldTypes)('%s: renders once on mount and does not re-render a sibling field when typing', async (_label, extra) => {
    const metadata = [{ name: 'a', ...extra }, { name: 'b', type: 'text' }];
    const { wrapper } = await mountInForm({ metadata, settings: { analytics: true } });

    expect(renderCount(wrapper, 'a')).toBe(1);
    expect(renderCount(wrapper, 'b')).toBe(1);

    await wrapper.find('[data-testid="b-input"]').setValue('x');
    await flushPromises();

    expect(renderCount(wrapper, 'a')).toBe(1);
  });
});
