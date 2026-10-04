import { describe, expect, it } from 'vitest';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { headingMetadata, textMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - forwards of the engine renders', () => {
  it('renders every field identically with and without the wrapper', async () => {
    const bare = await mountInForm({ metadata: textMetadata });
    const wrapped = await mountInForm({ metadata: textMetadata, template: createConsumerWrapper() });

    expect(wrapped.wrapper.html()).toBe(bare.wrapper.html());
  });

  it('keeps the children of a heading when wrapped with default forwards', async () => {
    const { wrapper } = await mountInForm({ metadata: headingMetadata, template: createConsumerWrapper() });

    expect(wrapper.findAll('input.sft-input')).toHaveLength(2);
  });

  it('mounts without throwing when the input forward is disabled', async () => {
    await expect(
      mountInForm({ metadata: headingMetadata, template: createConsumerWrapper({ forwardInput: false }) }),
    ).resolves.toBeDefined();
  });
});
