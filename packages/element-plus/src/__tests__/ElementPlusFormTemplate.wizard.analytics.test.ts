import { describe, expect, it } from 'vitest';
import { renderCount } from './fixtures/renderCount';
import {
  click,
  fieldPath,
  mountWizardForm,
  nextButton,
  prevButton,
  stepButton,
  wizardMetadata,
} from './wizard.test-helpers';

const settings = { analytics: true };

describe('component ElementPlusFormTemplate - wizard render counts', () => {
  it('does not re-render fields on untouched pages when another page becomes current', async () => {
    const { wrapper } = await mountWizardForm(
      [{ name: 'sibling', type: 'text', label: 'Sibling' }, wizardMetadata({ wizard: { allowForwardJump: true } })],
      { settings },
    );
    const lastPageBefore = renderCount(wrapper, fieldPath(2));
    const siblingBefore = renderCount(wrapper, 'sibling');

    await click(stepButton(wrapper, 1));

    expect(renderCount(wrapper, fieldPath(2))).toBe(lastPageBefore);
    expect(renderCount(wrapper, 'sibling')).toBe(siblingBefore);
  });

  it('does not remount or re-render the first page field on a round trip', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata(), { settings });
    const before = renderCount(wrapper, fieldPath(0));

    await click(nextButton(wrapper));
    await click(prevButton(wrapper));

    expect(renderCount(wrapper, fieldPath(0))).toBe(before);
  });

  it('shows the error of a blocked page without re-rendering the other pages', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata({ requiredPages: [0] }), { settings });
    const otherBefore = renderCount(wrapper, fieldPath(1));

    await click(nextButton(wrapper));

    expect(wrapper.find(`[data-testid="${fieldPath(0)}-error-message"]`).exists()).toBe(true);
    expect(renderCount(wrapper, fieldPath(1))).toBe(otherBefore);
  });
});
