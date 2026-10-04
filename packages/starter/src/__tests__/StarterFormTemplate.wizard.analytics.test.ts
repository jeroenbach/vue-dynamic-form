import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { renderCount } from './fixtures/renderCount';
import { wizardMetadata } from './fixtures/wizardMetadata';
import { click, mountWizardForm, nextButton, prevButton } from './wizard.test-helpers';

describe('component StarterFormTemplate - wizard page-switch render counts', () => {
  it('does not bump an untouched page or an out-of-wizard sibling when switching the current step', async () => {
    const { wrapper } = await mountWizardForm(
      [wizardMetadata({ pages: 3 }), { name: 'sibling', type: 'text' }],
      { settings: { analytics: true } },
    );

    const untouchedBefore = renderCount(wrapper, 'wizard.page1.field1');
    const siblingBefore = renderCount(wrapper, 'sibling');

    await click(nextButton(wrapper));

    expect(renderCount(wrapper, 'wizard.page1.field1')).toBe(untouchedBefore);
    expect(renderCount(wrapper, 'sibling')).toBe(siblingBefore);
  });

  it('does not bump the first page on a forward-then-back round trip', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata({ pages: 3 }), { settings: { analytics: true } });

    const before = renderCount(wrapper, 'wizard.page0.field0');

    await click(nextButton(wrapper));
    await click(prevButton(wrapper));

    expect(renderCount(wrapper, 'wizard.page0.field0')).toBe(before);
  });

  it('surfaces a blocked page error without bumping a different page render count', async () => {
    const { wrapper } = await mountWizardForm(
      wizardMetadata({ pages: 2, requiredPages: [0] }),
      { settings: { analytics: true } },
    );

    const otherBefore = renderCount(wrapper, 'wizard.page1.field1');

    await click(nextButton(wrapper));
    await flushPromises();

    expect(wrapper.find('[data-testid="wizard.page0.field0-error"]').exists()).toBe(true);
    expect(renderCount(wrapper, 'wizard.page1.field1')).toBe(otherBefore);
  });

  it('does not bump an unrelated page when navigating through the review page gotoStep edit link', async () => {
    const { wrapper } = await mountWizardForm(
      wizardMetadata({
        pages: 2,
        summaryGroups: [{ title: 'Page 1', rows: [['Field 1', 'x']], dataTestid: 'page1-review' }],
      }),
      { settings: { analytics: true } },
    );

    await click(nextButton(wrapper));
    await click(nextButton(wrapper));

    const otherBefore = renderCount(wrapper, 'wizard.page1.field1');

    await click(wrapper.find('[data-testid="page1-review-edit-button"]'));

    expect(renderCount(wrapper, 'wizard.page1.field1')).toBe(otherBefore);
  });
});
