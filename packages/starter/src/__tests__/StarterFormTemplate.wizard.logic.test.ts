import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { choiceCard, section } from './choice.test-helpers';
import { explicitChoiceMetadata } from './fixtures/choiceMetadata';
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

describe('component StarterFormTemplate - wizard focus on step change', () => {
  it('focuses the new page container, named via aria-labelledby to the stepper\'s own step title', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata({ pages: 3 }));

    await click(nextButton(wrapper));

    const page1 = wrapper.find('[data-page="1"]');
    expect(document.activeElement).toBe(page1.element);
    expect(page1.attributes('tabindex')).toBe('-1');

    const labelledbyId = page1.attributes('aria-labelledby');
    expect(labelledbyId).toBeDefined();
    const labelEl = document.getElementById(labelledbyId!);
    expect(labelEl?.textContent).toBe('Page 2');
    expect(labelEl?.closest('.sft-stepper')).not.toBeNull();
    expect(stepButton(wrapper, 1).find('.sft-step-label').text()).toBe(labelEl?.textContent);
  });

  it('still names the new page container when the wizard has no dataTestid, such as a wizard with path: \'\' on its root', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata({ pages: 3, extra: { path: '' } }));

    await click(wrapper.find('.sft-wizard-footer button.sft-btn-primary'));

    const page1 = wrapper.find('[data-page="1"]');
    expect(document.activeElement).toBe(page1.element);

    const labelledbyId = page1.attributes('aria-labelledby');
    expect(labelledbyId).toBeDefined();
    const labelEl = document.getElementById(labelledbyId!);
    expect(labelEl?.textContent).toBe('Page 2');
    expect(wrapper.findAll('.sft-step-label')[1].text()).toBe(labelEl?.textContent);
  });
});

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

  it('keeps currentStepIndex and focuses the first invalid field on a blocked forward navigation, not the page container', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata({ pages: 2, requiredPages: [0] }));

    await click(nextButton(wrapper));

    expect(stepButton(wrapper, 0).classes()).toContain('is-error');
    expect(isHidden(wrapper.find('[data-testid="wizard.page0-page"]'))).toBe(false);
    const invalidInput = wrapper.find('[data-testid="wizard.page0.field0-input"]');
    expect(document.activeElement).toBe(invalidInput.element);
    expect(wrapper.find('[data-page="0"]').attributes('tabindex')).toBeUndefined();
  });

  it('focuses into a required choice group on a blocked forward navigation, when that group is the page\'s only invalid control', async () => {
    const { wrapper } = await mountWizardForm({
      name: 'wizard',
      fieldOptions: { label: 'Onboarding' },
      wizard: true,
      children: [
        { name: 'page0', fieldOptions: { label: 'Launch' }, children: [explicitChoiceMetadata] },
        { name: 'page1', fieldOptions: { label: 'Done' }, children: [{ name: 'field1', type: 'text', fieldOptions: { label: 'Field' }, minOccurs: 0 }] },
      ],
    });

    await click(nextButton(wrapper));

    const group = section(wrapper, 'wizard.page0.launch');
    expect(group.find('.sft-choice-grid').attributes('aria-invalid')).toBe('true');
    const target = document.activeElement as HTMLElement;
    expect(group.element.contains(target)).toBe(true);
    expect(choiceCard(wrapper, 'wizard.page0.launch', 'selfServe').element).toBe(target);
    expect(wrapper.find('[data-page="0"]').attributes('tabindex')).toBeUndefined();
  });
});

describe('component StarterFormTemplate - wizard focus on a failed final submit', () => {
  it('moves focus to the first invalid field when the consumer wires focusFirstInvalid into onInvalidSubmit', async () => {
    const { wrapper } = await mountWizardForm(
      wizardMetadata({ pages: 1, requiredPages: [0] }),
      { focusFirstInvalidOnSubmit: true },
    );

    await click(submitButton(wrapper));

    expect(document.activeElement).toBe(wrapper.find('[data-testid="wizard.page0.field0-input"]').element);
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
