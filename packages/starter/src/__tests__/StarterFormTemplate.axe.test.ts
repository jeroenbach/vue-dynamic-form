import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { axeFormMetadata } from './fixtures/axeMetadata';
import { mountInForm } from './fixtures/mountInForm';
import { expectNoAxeViolations } from './helpers/axe';

describe('component StarterFormTemplate - whole-template accessibility', () => {
  it('has no violations for a pristine render combining every field type this feature touched', async () => {
    const { wrapper } = await mountInForm({ metadata: axeFormMetadata });

    await expectNoAxeViolations(wrapper.element);
  });

  it('has no violations once validation fails and every field shows its error', async () => {
    const { wrapper, validate } = await mountInForm({ metadata: axeFormMetadata });

    await validate();
    await flushPromises();

    expect(wrapper.find('.sft-error').exists()).toBe(true);
    await expectNoAxeViolations(wrapper.element);
  });
});
