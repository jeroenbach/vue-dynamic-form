import { describe, expect, it } from 'vitest';
import { wizardMetadata } from './fixtures/wizardMetadata';
import {
  click,
  isHidden,
  mountWizardForm,
  nextButton,
  prevButton,
  reviewPageWrapper,
  stepButton,
  submitButton,
} from './wizard.test-helpers';

describe('component StarterFormTemplate - wizard chrome', () => {
  it('renders the head, stepper, and footer chrome with the done/current step modifiers', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata({ pages: 3 }));

    expect(wrapper.find('.sft-wizard-head').exists()).toBe(true);
    expect(wrapper.find('.sft-wizard-eyebrow').text()).toBe('Client Onboarding');
    expect(wrapper.find('.sft-wizard-title').text()).toBe('Launch approach');
    expect(wrapper.find('.sft-stepper').exists()).toBe(true);
    expect(wrapper.findAll('.sft-step')).toHaveLength(3);
    expect(wrapper.findAll('.sft-step-dot')).toHaveLength(3);
    expect(wrapper.findAll('.sft-step-label')).toHaveLength(3);
    expect(wrapper.findAll('.sft-step-connector')).toHaveLength(2);
    expect(wrapper.find('.sft-wizard-footer').exists()).toBe(true);
    expect(wrapper.find('.sft-wizard-helper').text()).toContain('Step 1 of 3');

    expect(stepButton(wrapper, 0).classes()).not.toContain('is-done');
    expect(stepButton(wrapper, 0).classes()).toContain('is-current');

    await click(nextButton(wrapper));

    expect(stepButton(wrapper, 0).classes()).toContain('is-done');
    expect(stepButton(wrapper, 1).classes()).toContain('is-current');
    expect(stepButton(wrapper, 1).classes()).not.toContain('is-done');
  });

  it('falls back to the page name for a step label when the page has no fieldOptions label', async () => {
    const metadata = wizardMetadata({ pages: 1 });
    delete (metadata.children[0] as { fieldOptions?: unknown }).fieldOptions;

    const { wrapper } = await mountWizardForm(metadata);

    expect(wrapper.find('.sft-step-label').text()).toBe('page0');
  });

  it('renders a single step with no is-done step and no visible Back for a one-page wizard', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata({ pages: 1 }));

    expect(wrapper.findAll('.sft-step')).toHaveLength(1);
    expect(wrapper.find('.sft-step').classes()).toContain('is-current');
    expect(wrapper.find('.sft-step').classes()).not.toContain('is-done');
    expect(wrapper.findAll('.sft-step-connector')).toHaveLength(0);

    expect(prevButton(wrapper).classes()).toContain('is-hidden');
    expect(submitButton(wrapper).exists()).toBe(true);
    expect(nextButton(wrapper).exists()).toBe(false);
  });

  it('hides every page except the current one with an inline display:none style, never by removing it', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata({ pages: 2 }));

    expect(isHidden(wrapper.find('[data-testid="wizard.page0-page"]'))).toBe(false);
    expect(isHidden(wrapper.find('[data-testid="wizard.page1-page"]'))).toBe(true);
    expect(wrapper.find('[data-testid="wizard.page1-page"]').exists()).toBe(true);

    await click(nextButton(wrapper));

    expect(isHidden(wrapper.find('[data-testid="wizard.page0-page"]'))).toBe(true);
    expect(isHidden(wrapper.find('[data-testid="wizard.page1-page"]'))).toBe(false);
  });
});

describe('component StarterFormTemplate - review page', () => {
  it('renders one review card per summary group plus the confirmation banner', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata({
      pages: 1,
      summaryGroups: [
        { title: 'Company', rows: [['Company name', 'Acme Industries'], ['Secondary contact', '']], dataTestid: 'company-review' },
        { title: 'Contacts', rows: [['Primary contact', 'Jordan Fay']] },
      ],
      confirmation: 'We will email you within one business day.',
    }));

    await click(nextButton(wrapper));

    const review = reviewPageWrapper(wrapper);
    expect(review.findAll('.sft-review-group')).toHaveLength(2);
    expect(review.findAll('.sft-review-header')).toHaveLength(2);
    expect(review.findAll('.sft-review-title').map(node => node.text())).toEqual(['Company', 'Contacts']);
    expect(review.findAll('.sft-review-list')).toHaveLength(2);
    expect(review.findAll('.sft-review-row')).toHaveLength(3);
    expect(review.find('.sft-confirm').exists()).toBe(true);
    expect(review.find('.sft-confirm-strong').text()).toBe('Ready to submit?');
    expect(review.find('.sft-confirm').text()).toContain('We will email you within one business day.');
  });

  it('renders no confirmation banner when none is configured', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata({
      pages: 1,
      summaryGroups: [{ title: 'Company', rows: [] }],
    }));

    await click(nextButton(wrapper));

    expect(reviewPageWrapper(wrapper).find('.sft-confirm').exists()).toBe(false);
  });
});
