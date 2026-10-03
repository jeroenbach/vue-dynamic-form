import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { expectNoWarnings } from './fixtures/expectNoWarnings';
import {
  click,
  deferredRule,
  fieldPath,
  isDisabled,
  isHidden,
  mountWizardContainer,
  mountWizardForm,
  nextButton,
  pageWrappers,
  prevButton,
  stepButton,
  submitButton,
  visiblePages,
  wizardMetadata,
} from './wizard.test-helpers';

const messages = { required: 'This field is required' };

function pageError(wrapper: { find: (selector: string) => { exists: () => boolean, text: () => string } }, pageIndex: number) {
  return wrapper.find(`[data-page="${pageIndex}"] .epft-field-error`);
}

describe('component ElementPlusFormTemplate - wizard validation', () => {
  expectNoWarnings();

  describe('blocked and allowed navigation', () => {
    it('keeps the page and shows its errors when the current page is invalid', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata({ requiredPages: [0] }), { settings: { messages } });

      await click(nextButton(wrapper));

      expect(visiblePages(wrapper)).toEqual([0]);
      expect(pageError(wrapper, 0).text()).toBe('This field is required');
      expect(isHidden(wrapper.find('[data-page="1"]'))).toBe(true);
    });

    it('does not show the errors of pages that are not visited yet', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata({ requiredPages: [0, 1] }), { settings: { messages } });

      await click(nextButton(wrapper));

      expect(pageError(wrapper, 1).exists()).toBe(false);
    });

    it('moves to the next page when the current page is valid', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata({ requiredPages: [0] }), { settings: { messages } });

      await wrapper.find('[data-page="0"] input').setValue('filled');
      await click(nextButton(wrapper));

      expect(visiblePages(wrapper)).toEqual([1]);
      expect(pageError(wrapper, 0).exists()).toBe(false);
    });

    it('lets the user leave an invalid page backward', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata({ requiredPages: [0, 1] }), { settings: { messages } });
      await wrapper.find('[data-page="0"] input').setValue('filled');
      await click(nextButton(wrapper));
      expect(visiblePages(wrapper)).toEqual([1]);

      await click(nextButton(wrapper));
      expect(visiblePages(wrapper)).toEqual([1]);
      await click(prevButton(wrapper));

      expect(visiblePages(wrapper)).toEqual([0]);
    });

    it('lets the user leave an invalid page backward through the step indicator', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata({ requiredPages: [0, 1] }));
      await wrapper.find('[data-page="0"] input').setValue('filled');
      await click(nextButton(wrapper));

      await click(stepButton(wrapper, 0));

      expect(visiblePages(wrapper)).toEqual([0]);
    });
  });

  describe('busy state', () => {
    it('disables Next and Submit while the wizard validates', () => {
      const middle = mountWizardContainer({ currentStepIndex: 1, isValidating: true }).wrapper;
      const last = mountWizardContainer({ currentStepIndex: 2, isValidating: true }).wrapper;

      expect(isDisabled(nextButton(middle))).toBe(true);
      expect(nextButton(middle).classes()).toContain('is-loading');
      expect(isDisabled(submitButton(last))).toBe(true);
    });

    it('enables Next and Submit when the wizard is idle', () => {
      const middle = mountWizardContainer({ currentStepIndex: 1 }).wrapper;
      const last = mountWizardContainer({ currentStepIndex: 2 }).wrapper;

      expect(isDisabled(nextButton(middle))).toBe(false);
      expect(isDisabled(submitButton(last))).toBe(false);
    });

    it('keeps Next disabled while the page validates and moves on once it settles', async () => {
      const { rule, settle } = deferredRule();
      const metadata = wizardMetadata();
      (metadata.children[0].children[0] as Record<string, unknown>).validation = rule;
      const { wrapper } = await mountWizardForm(metadata);

      await nextButton(wrapper).trigger('click');
      await flushPromises();
      expect(isDisabled(nextButton(wrapper))).toBe(true);
      expect(visiblePages(wrapper)).toEqual([0]);

      settle(true);
      await flushPromises();

      expect(visiblePages(wrapper)).toEqual([1]);
      expect(isDisabled(nextButton(wrapper))).toBe(false);
    });
  });

  describe('values and registration across navigation', () => {
    it('keeps every page mounted and hides the others with display none', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata());

      expect(pageWrappers(wrapper)).toHaveLength(3);
      expect(pageWrappers(wrapper).map(isHidden)).toEqual([false, true, true]);

      await click(nextButton(wrapper));

      expect(pageWrappers(wrapper)).toHaveLength(3);
      expect(pageWrappers(wrapper).map(isHidden)).toEqual([true, false, true]);
    });

    it('keeps all page fields registered across navigation', async () => {
      const { wrapper, isRegistered, values } = await mountWizardForm(wizardMetadata(), { initialValues: { wizard: { page0: { field0: 'a' }, page2: { field2: 'c' } } } });
      const paths = [0, 1, 2].map(index => fieldPath(index));
      expect(paths.map(isRegistered)).toEqual([true, true, true]);

      await click(nextButton(wrapper));
      await click(nextButton(wrapper));
      await click(prevButton(wrapper));

      expect(paths.map(isRegistered)).toEqual([true, true, true]);
      expect(values().wizard.page0.field0).toBe('a');
      expect(values().wizard.page2.field2).toBe('c');
    });

    it('keeps a typed value across a round trip and still validates it', async () => {
      const { wrapper, values } = await mountWizardForm(wizardMetadata({ requiredPages: [0] }), { settings: { messages } });
      const input = () => wrapper.find('[data-page="0"] input');

      await input().setValue('typed');
      await click(nextButton(wrapper));
      await click(prevButton(wrapper));

      expect((input().element as HTMLInputElement).value).toBe('typed');
      expect(values().wizard.page0.field0).toBe('typed');

      await input().setValue('');
      await click(nextButton(wrapper));

      expect(visiblePages(wrapper)).toEqual([0]);
      expect(pageError(wrapper, 0).text()).toBe('This field is required');
    });

    it('validates fields on hidden pages when the whole form is validated', async () => {
      const { wrapper, validate, errors } = await mountWizardForm(wizardMetadata({ requiredPages: [2] }), { settings: { messages } });

      await validate();
      await flushPromises();

      expect(errors()[fieldPath(2)]).toBe('This field is required');
      expect(visiblePages(wrapper)).toEqual([0]);
    });
  });
});
