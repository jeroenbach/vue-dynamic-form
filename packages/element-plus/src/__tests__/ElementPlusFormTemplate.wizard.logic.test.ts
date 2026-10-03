import { flushPromises } from '@vue/test-utils';
import { ElSteps } from 'element-plus';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { expectNoWarnings } from './fixtures/expectNoWarnings';
import {
  activeStep,
  click,
  fieldPath,
  isDisabled,
  mountWizardContainer,
  mountWizardForm,
  mountWizardPage,
  nextButton,
  pageWrappers,
  prevButton,
  stepButton,
  stepStatuses,
  stepTitles,
  submitButton,
  visiblePages,
  wizardMetadata,
} from './wizard.test-helpers';

describe('component ElementPlusFormTemplate - wizard container', () => {
  expectNoWarnings();

  describe('step indicator', () => {
    it('renders one step per page with the active step following the current step index', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata());

      expect(wrapper.findComponent(ElSteps).props('active')).toBe(0);
      expect(stepTitles(wrapper)).toEqual(['Page 1', 'Page 2', 'Page 3']);

      await click(nextButton(wrapper));
      expect(wrapper.findComponent(ElSteps).props('active')).toBe(1);
      expect(activeStep(wrapper)).toBe(1);
      expect(stepStatuses(wrapper)).toEqual(['success', 'process', 'wait']);
    });

    it('builds the steps from the pages prop and not from the field metadata children', () => {
      const { wrapper } = mountWizardContainer({
        fieldMetadata: { children: [{ name: 'ignored', label: 'Ignored' }] },
        pages: [{ name: 'x', path: 'wizard.x', label: 'From pages' }, { name: 'y', path: 'wizard.y' }],
      });

      expect(stepTitles(wrapper)).toEqual(['From pages', 'y']);
    });

    it('falls back to a numbered title when a page has neither a label nor a name', () => {
      const { wrapper } = mountWizardContainer({ pages: [{ path: 'wizard.0' }, { path: 'wizard.1', label: 'Second' }] });

      expect(stepTitles(wrapper)).toEqual(['Step 1', 'Second']);
    });
  });

  describe('navigation buttons', () => {
    it('does not render Previous on the first page', () => {
      const { wrapper } = mountWizardContainer({ currentStepIndex: 0 });

      expect(prevButton(wrapper).exists()).toBe(false);
      expect(nextButton(wrapper).exists()).toBe(true);
    });

    it('renders Previous and Next on a middle page', () => {
      const { wrapper } = mountWizardContainer({ currentStepIndex: 1 });

      expect(prevButton(wrapper).exists()).toBe(true);
      expect(nextButton(wrapper).exists()).toBe(true);
      expect(submitButton(wrapper).exists()).toBe(false);
    });

    it('renders Previous and Submit instead of Next on the last page', () => {
      const { wrapper } = mountWizardContainer({ currentStepIndex: 2 });

      expect(prevButton(wrapper).exists()).toBe(true);
      expect(nextButton(wrapper).exists()).toBe(false);
      expect(submitButton(wrapper).exists()).toBe(true);
    });

    it('calls next exactly once per click on Next', async () => {
      const { wrapper, next } = mountWizardContainer();

      await click(nextButton(wrapper));

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('calls prev once per click on Previous', async () => {
      const { wrapper, prev } = mountWizardContainer({ currentStepIndex: 1 });

      await click(prevButton(wrapper));

      expect(prev).toHaveBeenCalledTimes(1);
    });

    it('renders Previous and Next as plain buttons and Submit as a native submit button', () => {
      const middle = mountWizardContainer({ currentStepIndex: 1 }).wrapper;
      const last = mountWizardContainer({ currentStepIndex: 2 }).wrapper;

      expect(prevButton(middle).attributes('type')).toBe('button');
      expect(nextButton(middle).attributes('type')).toBe('button');
      expect(submitButton(last).attributes('type')).toBe('submit');
    });

    it('does not call next when Submit is clicked', async () => {
      const { wrapper, next } = mountWizardContainer({ currentStepIndex: 2 });

      await click(submitButton(wrapper));

      expect(next).not.toHaveBeenCalled();
    });

    it('submits the surrounding form from the last page', async () => {
      const { wrapper, onSubmit } = await mountWizardForm(wizardMetadata({ pages: 2 }));
      await click(nextButton(wrapper));

      await click(submitButton(wrapper));

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('does not submit the surrounding form when Next or Previous is clicked', async () => {
      const { wrapper, onSubmit } = await mountWizardForm(wizardMetadata({ pages: 3 }));

      await click(nextButton(wrapper));
      await click(prevButton(wrapper));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('jumping between steps', () => {
    it('calls gotoStep with exactly the index when a later step is clicked and forward jumps are allowed', async () => {
      const { wrapper, gotoStep } = mountWizardContainer({ wizardConfig: { allowForwardJump: true, validateOnJump: true } });

      await click(stepButton(wrapper, 2));

      expect(gotoStep).toHaveBeenCalledTimes(1);
      expect(gotoStep).toHaveBeenCalledWith(2);
    });

    it('does not call gotoStep when a later step is clicked and forward jumps are not allowed', async () => {
      const { wrapper, gotoStep } = mountWizardContainer({ wizardConfig: { allowForwardJump: false, validateOnJump: true } });

      await click(stepButton(wrapper, 2));

      expect(gotoStep).not.toHaveBeenCalled();
    });

    it('reads the jump policy from the wizard config and not from the field metadata', async () => {
      const { wrapper, gotoStep } = mountWizardContainer({
        fieldMetadata: { wizard: { allowForwardJump: true } },
        wizardConfig: { allowForwardJump: false, validateOnJump: true },
      });

      await click(stepButton(wrapper, 1));

      expect(gotoStep).not.toHaveBeenCalled();
    });

    it.each([false, true])('goes back when an earlier step is clicked (forward jumps allowed: %s)', async (allowForwardJump) => {
      const { wrapper, gotoStep } = mountWizardContainer({ currentStepIndex: 2, wizardConfig: { allowForwardJump, validateOnJump: true } });

      await click(stepButton(wrapper, 0));

      expect(gotoStep).toHaveBeenCalledWith(0);
    });

    it('does nothing when the current step is clicked', async () => {
      const { wrapper, gotoStep } = mountWizardContainer({ currentStepIndex: 1, wizardConfig: { allowForwardJump: true, validateOnJump: true } });

      await click(stepButton(wrapper, 1));

      expect(gotoStep).not.toHaveBeenCalled();
    });

    it('marks only the steps that can be jumped to as clickable', () => {
      const closed = mountWizardContainer({ currentStepIndex: 1 }).wrapper;
      const open = mountWizardContainer({ currentStepIndex: 1, wizardConfig: { allowForwardJump: true, validateOnJump: true } }).wrapper;

      expect([0, 1, 2].map(index => stepButton(closed, index).classes('epft-wizard-step-clickable'))).toEqual([true, false, false]);
      expect([0, 1, 2].map(index => stepButton(open, index).classes('epft-wizard-step-clickable'))).toEqual([true, false, true]);
    });

    it('moves to a later step in the engine when the wizard allows forward jumps', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata({ wizard: { allowForwardJump: true } }));

      await click(stepButton(wrapper, 2));

      expect(visiblePages(wrapper)).toEqual([2]);
    });

    it('stays on the page in the engine when forward jumps are not allowed', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata());

      await click(stepButton(wrapper, 2));

      expect(visiblePages(wrapper)).toEqual([0]);
    });

    it('goes back in the engine from a later step', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata());
      await click(nextButton(wrapper));
      await click(nextButton(wrapper));

      await click(stepButton(wrapper, 0));

      expect(visiblePages(wrapper)).toEqual([0]);
    });
  });

  describe('own validation message', () => {
    it('shows the wizard message above the navigation', () => {
      const { wrapper } = mountWizardContainer({ errorMessage: 'Complete the wizard' });

      const error = wrapper.find('[data-testid="wizard-error-message"]');
      expect(error.text()).toBe('Complete the wizard');
      expect(wrapper.find('.epft-wizard-navigation').exists()).toBe(true);
    });

    it('renders nothing extra without a message', () => {
      const { wrapper } = mountWizardContainer();

      expect(wrapper.find('[data-testid="wizard-error-message"]').exists()).toBe(false);
    });
  });

  describe('disabled wizard', () => {
    it('disables Previous, Next, and Submit and ignores step clicks', async () => {
      const middle = mountWizardContainer({ currentStepIndex: 1, disabled: true, wizardConfig: { allowForwardJump: true, validateOnJump: true } });
      const last = mountWizardContainer({ currentStepIndex: 2, disabled: true });

      expect(isDisabled(prevButton(middle.wrapper))).toBe(true);
      expect(isDisabled(nextButton(middle.wrapper))).toBe(true);
      expect(isDisabled(submitButton(last.wrapper))).toBe(true);

      await click(stepButton(middle.wrapper, 0));
      await click(stepButton(middle.wrapper, 2));
      await click(nextButton(middle.wrapper));
      expect(middle.gotoStep).not.toHaveBeenCalled();
      expect(middle.next).not.toHaveBeenCalled();
    });

    it('renders the pages of a wizard with maxOccurs zero without error', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata({ extra: { maxOccurs: 0 } }));

      expect(pageWrappers(wrapper)).toHaveLength(3);
      expect(isDisabled(nextButton(wrapper))).toBe(true);
    });
  });

  describe('empty and single page wizards', () => {
    it('renders no steps, no Previous, no Next, and a Submit button for a wizard without pages', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata({ pages: 0 }));

      expect(wrapper.findAll('.el-step')).toHaveLength(0);
      expect(prevButton(wrapper).exists()).toBe(false);
      expect(nextButton(wrapper).exists()).toBe(false);
      expect(submitButton(wrapper).exists()).toBe(true);
    });

    it('renders only the chrome without throwing when the pages prop is empty', () => {
      const { wrapper } = mountWizardContainer({ pages: [] });

      expect(wrapper.findAll('.el-step')).toHaveLength(0);
      expect(prevButton(wrapper).exists()).toBe(false);
      expect(nextButton(wrapper).exists()).toBe(false);
      expect(submitButton(wrapper).exists()).toBe(true);
    });

    it('submits the surrounding form from a wizard without pages', async () => {
      const { wrapper, onSubmit } = await mountWizardForm(wizardMetadata({ pages: 0 }));

      await click(submitButton(wrapper));

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('shows Submit immediately and no Previous or Next for a wizard with one page', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata({ pages: 1 }));

      expect(prevButton(wrapper).exists()).toBe(false);
      expect(nextButton(wrapper).exists()).toBe(false);
      expect(submitButton(wrapper).exists()).toBe(true);
    });
  });
});

describe('component ElementPlusFormTemplate - wizard input chain', () => {
  expectNoWarnings();

  it('renders the pages inside the wizard chrome', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata());

    const chrome = wrapper.find('[data-testid="wizard-wizard"]');
    expect(chrome.findAll('[data-page]')).toHaveLength(3);
    expect(chrome.find('.el-steps').exists()).toBe(true);
  });

  it('renders the pages inside the chrome when the wrapper forwards the input slot', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata(), { template: createConsumerWrapper() });

    expect(wrapper.find('[data-testid="wizard-wizard"]').findAll('[data-page]')).toHaveLength(3);
    expect(wrapper.find('.el-steps').exists()).toBe(true);
  });

  it('renders the page content through the input slot when given directly', () => {
    const { wrapper } = mountWizardContainer();

    expect(wrapper.find('.epft-wizard-pages [data-testid="pages-content"]').exists()).toBe(true);
  });

  it('renders the field of a page through the same chain', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata({ pages: 2 }));

    expect(wrapper.find('[data-page="1"]').findAll('input')).toHaveLength(1);
  });
});

describe('component ElementPlusFormTemplate - wizard page', () => {
  expectNoWarnings();

  it('shows the current page and hides the others', () => {
    const current = mountWizardPage({ isCurrent: true });
    const other = mountWizardPage({ isCurrent: false });

    expect(current.find('[data-page]').isVisible()).toBe(true);
    expect(other.find('[data-page]').isVisible()).toBe(false);
    expect(other.find('[data-testid="page-content"]').exists()).toBe(true);
  });

  it('marks every page wrapper with its zero-based index and shows exactly the current one', async () => {
    const { wrapper } = await mountWizardForm(wizardMetadata());

    expect(pageWrappers(wrapper).map(page => page.attributes('data-page'))).toEqual(['0', '1', '2']);
    expect(visiblePages(wrapper)).toEqual([0]);

    await click(nextButton(wrapper));
    expect(visiblePages(wrapper)).toEqual([1]);
  });
});

describe('component ElementPlusFormTemplate - wizard overrides', () => {
  expectNoWarnings();

  const customPage = (scope: any, slots: any) => h('section', {
    'data-testid': 'custom-page',
    'data-page': scope.pageIndex,
    'style': scope.isCurrent ? undefined : { display: 'none' },
  }, slots.default?.(scope));

  it('keeps the built-in indicator and buttons when only the page wrapper is overridden', async () => {
    const template = createConsumerWrapper({ overrides: { 'default-wizard-page': customPage } });
    const { wrapper } = await mountWizardForm(wizardMetadata(), { template });

    expect(wrapper.find('.el-steps').exists()).toBe(true);
    expect(nextButton(wrapper).exists()).toBe(true);
    expect(wrapper.findAll('[data-testid="custom-page"]')).toHaveLength(3);
    expect(wrapper.find('.epft-wizard-page').exists()).toBe(false);
    expect(visiblePages(wrapper)).toEqual([0]);
  });

  it('keeps the built-in page wrapper when only the wizard container is overridden', async () => {
    const template = createConsumerWrapper({
      overrides: { 'default-wizard': (scope, slots) => h('div', { 'data-testid': 'custom-wizard' }, [h('span', `at ${scope.currentStepIndex}`), slots.default?.(scope)]) },
    });
    const { wrapper } = await mountWizardForm(wizardMetadata(), { template });

    expect(wrapper.find('[data-testid="custom-wizard"]').text()).toContain('at 0');
    expect(wrapper.find('.el-steps').exists()).toBe(false);
    expect(wrapper.findAll('.epft-wizard-page')).toHaveLength(3);
  });

  it('shows every page when an overriding page wrapper omits the visibility gate', async () => {
    const template = createConsumerWrapper({
      overrides: { 'default-wizard-page': (scope, slots) => h('section', { 'data-page': scope.pageIndex }, slots.default?.(scope)) },
    });
    const { wrapper } = await mountWizardForm(wizardMetadata(), { template });

    expect(visiblePages(wrapper)).toEqual([0, 1, 2]);
  });

  it('forwards a per-type wizard slot the template does not enumerate', async () => {
    const template = createConsumerWrapper({
      overrides: { 'text-wizard': scope => h('div', { 'data-testid': 'text-wizard-custom' }, `custom ${scope.pageCount}`) },
    });
    const textWizard = { ...wizardMetadata(), type: 'text' };
    const { wrapper } = await mountWizardForm([textWizard, { ...wizardMetadata({ name: 'other' }), type: 'number' }], { template });

    expect(wrapper.find('[data-testid="text-wizard-custom"]').text()).toBe('custom 3');
    expect(wrapper.find('[data-testid="wizard-wizard"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="other-wizard"]').exists()).toBe(true);
  });
});

describe('component ElementPlusFormTemplate - wizards in other shapes', () => {
  expectNoWarnings();

  it('navigates a wizard inside a choice branch', async () => {
    const metadata = {
      name: 'pick',
      label: 'Pick',
      explicitChoiceSelection: true,
      choice: [{ ...wizardMetadata({ name: 'wiz', pages: 2 }) }, { name: 'note', type: 'text' }],
    };
    const { wrapper } = await mountWizardForm(metadata);

    await click(wrapper.find('[data-testid="pick.wiz-add-choice-button"]'));
    expect(wrapper.find('[data-testid="pick.wiz-wizard"]').exists()).toBe(true);

    await click(nextButton(wrapper, 'pick.wiz'));
    expect(visiblePages(wrapper)).toEqual([1]);
    expect(submitButton(wrapper, 'pick.wiz').exists()).toBe(true);
  });

  it('navigates repeated wizards independently', async () => {
    const metadata = {
      name: 'teams',
      minOccurs: 2,
      maxOccurs: 2,
      autoAddMinOccurs: true,
      children: [wizardMetadata({ name: 'wiz', pages: 3 })],
    };
    const { wrapper } = await mountWizardForm(metadata);
    await flushPromises();

    const wizards = wrapper.findAll('[data-testid$="-wizard"]');
    expect(wizards).toHaveLength(2);
    const [firstPath, secondPath] = wizards.map(element => element.attributes('data-testid')!.replace(/-wizard$/, ''));

    await click(nextButton(wrapper, firstPath));

    const firstPages = wizards[0].findAll('[data-page]').filter(page => page.isVisible()).map(page => page.attributes('data-page'));
    const secondPages = wizards[1].findAll('[data-page]').filter(page => page.isVisible()).map(page => page.attributes('data-page'));
    expect(firstPages).toEqual(['1']);
    expect(secondPages).toEqual(['0']);
    expect(prevButton(wrapper, firstPath).exists()).toBe(true);
    expect(prevButton(wrapper, secondPath).exists()).toBe(false);
  });
});

describe('component ElementPlusFormTemplate - forward jump with invalid pages', () => {
  it('lets the engine decide: the jump lands and the page errors surface', async () => {
    const { wrapper, errors } = await mountWizardForm(
      wizardMetadata({ requiredPages: [0], wizard: { allowForwardJump: true } }),
    );

    await click(stepButton(wrapper, 2));

    expect(visiblePages(wrapper)).toEqual([2]);
    expect(errors()[fieldPath(0)]).toBeTruthy();
  });
});
