import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { wizardMetadata } from './fixtures/wizardMetadata';
import {
  click,
  isHidden,
  mountWizardForm,
  nextButton,
  reviewPageWrapper,
  stepButton,
  submitButton,
} from './wizard.test-helpers';

describe('component StarterFormTemplate - wizard page registration', () => {
  it('keeps a page field registered with vee-validate while it is hidden, never deregistering it', async () => {
    const { wrapper, isRegistered } = await mountWizardForm(wizardMetadata({ pages: 2 }));

    expect(isRegistered('wizard.page0.field0')).toBe(true);

    await click(nextButton(wrapper));

    expect(isHidden(wrapper.find('[data-testid="wizard.page0-page"]'))).toBe(true);
    expect(isRegistered('wizard.page0.field0')).toBe(true);
    expect(isRegistered('wizard.page1.field1')).toBe(true);
  });

  it('submits the surrounding form from the last page', async () => {
    const { wrapper, onSubmit } = await mountWizardForm(wizardMetadata({ pages: 2 }));

    await click(nextButton(wrapper));
    await click(submitButton(wrapper));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('component StarterFormTemplate - wizard step errors', () => {
  it('marks a step red and disables submit once its required field fails validation, clearing once fixed', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata({
      pages: 2,
      wizard: { allowForwardJump: true },
      requiredPages: [0],
    }));

    await click(nextButton(wrapper));

    expect(stepButton(wrapper, 0).classes()).toContain('is-error');
    expect(wrapper.find('.sft-wizard-alert').exists()).toBe(true);
    expect(submitButton(wrapper).attributes('disabled')).toBeDefined();

    await wrapper.find('[data-testid="wizard.page0.field0-input"]').setValue('filled in');
    await flushPromises();

    expect(stepButton(wrapper, 0).classes()).not.toContain('is-error');
    expect(wrapper.find('.sft-wizard-alert').exists()).toBe(false);
    expect(submitButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('shows no step errors and an enabled submit button when every required field is filled in', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata({ pages: 2, requiredPages: [0] }), {
      initialValues: { wizard: { page0: { field0: 'already filled' } } },
    });

    await click(nextButton(wrapper));

    expect(stepButton(wrapper, 0).classes()).not.toContain('is-error');
    expect(wrapper.find('.sft-wizard-alert').exists()).toBe(false);
    expect(submitButton(wrapper).attributes('disabled')).toBeUndefined();
  });
});

describe('component StarterFormTemplate - wizard icon override', () => {
  function iconOverride() {
    return ({ name }: { name: string }) => h('svg', { 'data-testid': `icon-${name}` });
  }

  it('reaches the stepper, footer, and review edit glyphs through the override', async () => {
    const override = iconOverride();
    const template = createConsumerWrapper({ icon: override });
    const { wrapper } = await mountWizardForm(wizardMetadata({
      pages: 1,
      summaryGroups: [{ title: 'Company', rows: [['Company name', 'Acme Industries']] }],
    }), { template });

    expect(wrapper.find('[data-testid="icon-chevronLeft"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="icon-chevronRight"]').exists()).toBe(true);

    await click(nextButton(wrapper));

    expect(wrapper.find('[data-testid="icon-check"]').exists()).toBe(true);
    expect(reviewPageWrapper(wrapper).find('[data-testid="icon-pencil"]').exists()).toBe(true);
  });
});
