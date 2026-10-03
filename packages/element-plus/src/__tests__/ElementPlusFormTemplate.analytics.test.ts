import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { mountInForm } from './fixtures/mountInForm';
import { renderCount } from './fixtures/renderCount';

const metadata = [{ name: 'a', type: 'text' }, { name: 'b', type: 'text' }];

async function typeIntoFirstField(template?: ReturnType<typeof createConsumerWrapper>) {
  const { wrapper } = await mountInForm({ metadata, template, settings: { analytics: true } });
  const afterMount = { a: renderCount(wrapper, 'a'), b: renderCount(wrapper, 'b') };

  await wrapper.findAll('input')[0].setValue('x');
  await flushPromises();

  return {
    afterMount,
    deltaA: renderCount(wrapper, 'a') - afterMount.a,
    deltaB: renderCount(wrapper, 'b') - afterMount.b,
  };
}

describe('component ElementPlusFormTemplate - render counts', () => {
  it('renders each field once on mount, bare and wrapped', async () => {
    const bare = await typeIntoFirstField();
    const wrapped = await typeIntoFirstField(createConsumerWrapper());

    expect(bare.afterMount).toEqual({ a: 1, b: 1 });
    expect(wrapped.afterMount).toEqual({ a: 1, b: 1 });
  });

  it('costs wrapped usage no extra renders when a value changes', async () => {
    const bare = await typeIntoFirstField();
    const wrapped = await typeIntoFirstField(createConsumerWrapper());

    expect(bare.deltaB).toBe(0);
    expect(wrapped.deltaB).toBe(bare.deltaB);
    expect(wrapped.deltaA).toBe(bare.deltaA);
  });
});
