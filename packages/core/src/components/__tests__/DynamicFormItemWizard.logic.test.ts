import type { Metadata } from '@/examples/TestFormTemplate.vue';
import type { ComputedPropsFieldOf } from '@/types/FieldMetadata';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import TestForm from '@/examples/TestForm.vue';
import { setupState as itemSetupState } from './DynamicFormItem.test-helpers';
import {
  clickGotoStep,
  clickNext,
  clickPrev,
  currentStepIndex,
  findDynamicFormItemWizardByPath,
  isFirst,
  isLast,
  isPageVisible,
  pageCount,
  setupState,
} from './DynamicFormItemWizard.test-helpers';

// Fields default to minOccurs: 0 (optional) so next()/gotoStep() succeed without filling data in
// tests that are not specifically exercising the validation gate; AC5/AC6/AC10 opt individual
// fields back into minOccurs: 1 where a required field is the point of the test.
function twoPageWizard(overrides: Partial<Metadata> = {}): Metadata {
  return {
    name: 'wizard',
    wizard: true,
    fieldOptions: { label: 'Onboarding wizard' },
    children: [
      {
        name: 'company',
        children: [{ name: 'companyName', minOccurs: 0, fieldOptions: { label: 'Company Name' } }],
      },
      {
        name: 'plan',
        children: [{ name: 'planName', minOccurs: 0, fieldOptions: { label: 'Plan Name' } }],
      },
    ],
    ...overrides,
  } as Metadata;
}

describe('component DynamicFormItemWizard - logic', () => {
  describe('shape detection and precedence (AC1)', () => {
    it('a node with wizard set delegates to DynamicFormItemWizard, not choice/array/plain parent', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: [twoPageWizard()] } });
      await flushPromises();

      expect(itemSetupState(wrapper, 'wizard')?.isWizard).toBe(true);
      expect(wrapper.findAllComponents({ name: 'DynamicFormItemWizard' })).toHaveLength(1);
      expect(wrapper.findAllComponents({ name: 'DynamicFormItemChoice' })).toHaveLength(0);
      expect(wrapper.findAllComponents({ name: 'DynamicFormItemArray' })).toHaveLength(0);
    });
  });

  describe('children-only pages; co-declared choice/maxOccurs are inert with one warning each (AC2)', () => {
    it('warns once per ignored property and derives pages from children only', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [twoPageWizard({
            maxOccurs: 3,
            choice: [{ name: 'ignoredBranch', fieldOptions: { label: 'Ignored' } }],
          })],
        },
      });
      await flushPromises();

      const choiceWarnings = warnSpy.mock.calls.filter(call => String(call[0]).includes('wizard') && String(call[0]).includes('choice'));
      const maxOccursWarnings = warnSpy.mock.calls.filter(call => String(call[0]).includes('wizard') && String(call[0]).includes('maxOccurs'));
      expect(choiceWarnings).toHaveLength(1);
      expect(maxOccursWarnings).toHaveLength(1);

      expect(pageCount(wrapper, 'wizard')).toBe(2);
      warnSpy.mockRestore();
    });

    it('renders identically to the same node with choice/maxOccurs stripped', async () => {
      const withInert = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [twoPageWizard({
            maxOccurs: 3,
            choice: [{ name: 'ignoredBranch', fieldOptions: { label: 'Ignored' } }],
          })],
        },
      });
      const clean = mount(TestForm, { attachTo: document.body, props: { metadata: [twoPageWizard()] } });
      await flushPromises();

      expect(pageCount(withInert, 'wizard')).toBe(pageCount(clean, 'wizard'));
      expect(withInert.findAll('[data-testid^="wizard-goto-"]')).toHaveLength(clean.findAll('[data-testid^="wizard-goto-"]').length);
    });
  });

  describe('a choice of wizards falls out of the existing choice mechanism (AC3)', () => {
    it('each branch is an independent wizard once selected', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            explicitChoiceSelection: true,
            fieldOptions: { label: 'Pick a wizard' },
            choice: [
              { ...twoPageWizard(), name: 'wizA', wizard: { allowForwardJump: true } },
              { ...twoPageWizard(), name: 'wizB', wizard: { allowForwardJump: true } },
            ],
          }] as unknown as Metadata[],
        },
      });
      await flushPromises();

      await wrapper.find('[data-testid="pick.wizA-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.findAllComponents({ name: 'DynamicFormItemWizard' })).toHaveLength(1);
      expect(currentStepIndex(wrapper, 'pick.wizA')).toBe(0);

      await clickGotoStep(wrapper, 'pick.wizA', 1);
      expect(currentStepIndex(wrapper, 'pick.wizA')).toBe(1);
    });
  });

  describe('a repeated wizard falls out of the existing array mechanism (AC4)', () => {
    it('each occurrence has an independent currentStepIndex', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'teams',
            maxOccurs: 2,
            minOccurs: 2,
            autoAddMinOccurs: true,
            children: [twoPageWizard({ name: 'wiz', wizard: { allowForwardJump: true } })],
          }] as unknown as Metadata[],
        },
      });
      await flushPromises();

      expect(currentStepIndex(wrapper, 'teams[0].wiz')).toBe(0);
      expect(currentStepIndex(wrapper, 'teams[1].wiz')).toBe(0);

      await clickGotoStep(wrapper, 'teams[0].wiz', 1);

      expect(currentStepIndex(wrapper, 'teams[0].wiz')).toBe(1);
      expect(currentStepIndex(wrapper, 'teams[1].wiz')).toBe(0);
    });
  });

  describe('prev() moves back unconditionally (AC7)', () => {
    it('decrements with no validation gate and no-ops on the first page', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [twoPageWizard({
            wizard: { allowForwardJump: true },
            children: [
              { name: 'company', children: [{ name: 'companyName', minOccurs: 1, fieldOptions: { label: 'Company Name' } }] },
              { name: 'plan', children: [{ name: 'planName', minOccurs: 1, fieldOptions: { label: 'Plan Name' } }] },
            ],
          })],
        },
      });
      await flushPromises();

      await clickGotoStep(wrapper, 'wizard', 1);
      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      // Leave the required field on page 1 empty and move back — prev() must not validate it.
      await clickPrev(wrapper, 'wizard');
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
      expect(wrapper.find('[data-testid="wizard.plan.planName-error-message"]').exists()).toBe(false);

      await clickPrev(wrapper, 'wizard');
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
    });
  });

  describe('gotoStep() is backward-only by default (AC8)', () => {
    it('allows a backward jump and blocks a forward jump', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: [twoPageWizard({ children: [
        { name: 'company', children: [{ name: 'a', minOccurs: 0 }] },
        { name: 'plan', children: [{ name: 'b', minOccurs: 0 }] },
        { name: 'launch', children: [{ name: 'c', minOccurs: 0 }] },
      ] })] } });
      await flushPromises();

      await clickGotoStep(wrapper, 'wizard', 2);
      // allowForwardJump is unset (default false), so the forward jump to page 2 does nothing yet.
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);

      await clickNext(wrapper, 'wizard');
      await clickNext(wrapper, 'wizard');
      expect(currentStepIndex(wrapper, 'wizard')).toBe(2);

      await clickGotoStep(wrapper, 'wizard', 0);
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
    });
  });

  describe('gotoStep() honors allowForwardJump at config and call-time-option level (AC9)', () => {
    function threePageWizard(wizard: Metadata['wizard']): Metadata {
      return twoPageWizard({
        wizard,
        children: [
          { name: 'company', children: [{ name: 'a' }] },
          { name: 'plan', children: [{ name: 'b' }] },
          { name: 'launch', children: [{ name: 'c' }] },
        ],
      });
    }

    it('config allowForwardJump: true lets a forward jump succeed', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: [threePageWizard({ allowForwardJump: true })] } });
      await flushPromises();

      await clickGotoStep(wrapper, 'wizard', 2);
      expect(currentStepIndex(wrapper, 'wizard')).toBe(2);
    });

    it('call-time allowForwardJump: true overrides a config false', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: [threePageWizard({ allowForwardJump: false })] } });
      await flushPromises();

      const state = setupState(wrapper, 'wizard')!;
      await state.gotoStep(2, { allowForwardJump: true });
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(2);
    });

    it('call-time allowForwardJump: false overrides a config true', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: [threePageWizard({ allowForwardJump: true })] } });
      await flushPromises();

      const state = setupState(wrapper, 'wizard')!;
      await state.gotoStep(2, { allowForwardJump: false });
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
    });
  });

  describe('gotoStep() clamps out-of-range indices (AC11)', () => {
    it('clamps below zero to 0 and above range to the last page', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [twoPageWizard({
            wizard: { allowForwardJump: true },
            children: [
              { name: 'company', children: [{ name: 'a' }] },
              { name: 'plan', children: [{ name: 'b' }] },
              { name: 'launch', children: [{ name: 'c' }] },
            ],
          })],
        },
      });
      await flushPromises();

      // Index 99 has no corresponding stepper button (only 3 pages exist), so the out-of-range
      // call is made directly against the exposed gotoStep method, exactly as a template would
      // if it computed an index arithmetically rather than from the rendered stepper list.
      const state = setupState(wrapper, 'wizard')!;
      await state.gotoStep(99);
      await flushPromises();
      expect(currentStepIndex(wrapper, 'wizard')).toBe(2);

      await state.gotoStep(-1);
      await flushPromises();
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
    });
  });

  describe('edge case: gotoStep(currentStepIndex) is a no-op', () => {
    it('does not validate and does not change currentStepIndex', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [twoPageWizard({
            wizard: { validateOnJump: true },
            children: [
              { name: 'company', children: [{ name: 'companyName', minOccurs: 1, fieldOptions: { label: 'Company Name' } }] },
              { name: 'plan', children: [{ name: 'planName', fieldOptions: { label: 'Plan Name' } }] },
            ],
          })],
        },
      });
      await flushPromises();

      await clickGotoStep(wrapper, 'wizard', 0);
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);
    });
  });

  describe('edge case: single-page wizard', () => {
    it('is both first and last; next()/prev() are no-ops', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'wizard',
            wizard: true,
            children: [{ name: 'onlyPage', children: [{ name: 'field' }] }],
          }] as unknown as Metadata[],
        },
      });
      await flushPromises();

      expect(isFirst(wrapper, 'wizard')).toBe(true);
      expect(isLast(wrapper, 'wizard')).toBe(true);

      await clickNext(wrapper, 'wizard');
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
      await clickPrev(wrapper, 'wizard');
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
    });
  });

  describe('edge case: empty/absent children (pages.length === 0)', () => {
    it('does not crash on mount or navigation, and reports isFirst/isLast as true with no warning', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [{ name: 'wizard', wizard: true }] as unknown as Metadata[] },
      });
      await flushPromises();

      expect(isFirst(wrapper, 'wizard')).toBe(true);
      expect(isLast(wrapper, 'wizard')).toBe(true);
      expect(warnSpy).not.toHaveBeenCalled();

      await clickNext(wrapper, 'wizard');
      await clickGotoStep0IfPresent();
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);

      async function clickGotoStep0IfPresent() {
        const state = setupState(wrapper, 'wizard')!;
        await state.gotoStep(0);
        await flushPromises();
      }

      warnSpy.mockRestore();
    });
  });

  describe('page slot receives WizardPageAttributes for every page, dispatched through each page\'s own shape (AC13)', () => {
    it('renders array and choice pages through their own DynamicFormItemArray/DynamicFormItemChoice, all pages present in the DOM', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'wizard',
            wizard: true,
            children: [
              { name: 'company', children: [{ name: 'companyName' }] },
              { name: 'contacts', maxOccurs: 3, children: [{ name: 'email' }] },
              {
                name: 'launchApproach',
                choice: [
                  { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
                  { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
                ],
              },
            ],
          }] as unknown as Metadata[],
        },
      });
      await flushPromises();

      expect(wrapper.findAllComponents({ name: 'DynamicFormItemArray' }).some(c => (c.vm as any).$.setupState.path === 'wizard.contacts')).toBe(true);
      expect(wrapper.findAllComponents({ name: 'DynamicFormItemChoice' }).some(c => (c.vm as any).$.setupState.normalizedPath === 'wizard.launchApproach')).toBe(true);

      // All three pages are present in the DOM (visibility-gated, not unmounted).
      expect(wrapper.find('[data-testid="wizard.company-page"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="wizard.contacts-page"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="wizard.launchApproach-page"]').exists()).toBe(true);
    });
  });

  describe('non-current pages stay mounted; values and validation state survive navigation (AC19)', () => {
    it('preserves a filled field\'s value and visibility state across a round trip', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [twoPageWizard()] },
      });
      await flushPromises();

      await wrapper.find('[id="wizard.company.companyName"]').setValue('Acme');
      await flushPromises();

      expect(isPageVisible(wrapper, 'wizard.company')).toBe(true);
      expect(isPageVisible(wrapper, 'wizard.plan')).toBe(false);

      await clickNext(wrapper, 'wizard');
      expect(isPageVisible(wrapper, 'wizard.company')).toBe(false);
      expect(isPageVisible(wrapper, 'wizard.plan')).toBe(true);
      // Still registered, not remounted — the field's DynamicFormItem is still findable at its path.
      expect(itemSetupState(wrapper, 'wizard.company.companyName')).toBeDefined();

      await clickPrev(wrapper, 'wizard');
      expect(isPageVisible(wrapper, 'wizard.company')).toBe(true);

      const input = wrapper.find<HTMLInputElement>('[id="wizard.company.companyName"]');
      expect(input.element.value).toBe('Acme');
    });

    it('contrast: a v-if-gated page slot deregisters its fields on navigation away', async () => {
      const { default: DynamicForm } = await import('@/components/DynamicForm.vue');
      const { default: DynamicFormTemplate } = await import('@/components/DynamicFormTemplate.vue');
      const { useDynamicForm } = await import('@/core/useDynamicForm');
      const { defineComponent, h } = await import('vue');

      // A minimal template mirroring TestFormTemplate's contract, but gating the wizard page with
      // v-if instead of v-show — the exact mistake the v-show-not-v-if contract warns against.
      // Built with render functions (not an SFC/string template) so this test-only stand-in
      // sidesteps DynamicFormTemplate's generic slot typing entirely.
      const AnyDynamicFormTemplate = DynamicFormTemplate as any;
      const BadTemplate = defineComponent({
        inheritAttrs: false,
        setup: (_props: any, { attrs, slots }: any) => () => h(AnyDynamicFormTemplate, { metadataConfiguration: {}, ...attrs }, {
          'default-wizard': (slotProps: any) =>
            h('div', [
              ...slotProps.pages.map((p: any, i: number) =>
                h('button', { 'type': 'button', 'data-testid': `goto-${i}`, 'onClick': () => slotProps.gotoStep(i) }, p.name)),
              slots.default?.(),
            ]),
          'default-wizard-page': (slotProps: any) => slotProps.isCurrent ? h('div', slots.default?.()) : null,
          'default': (slotProps: any) =>
            h('div', [
              h('input', {
                id: slotProps.fieldMetadata.path,
                value: slotProps.fieldContext.value.value,
                onInput: slotProps.fieldContext.handleChange,
                onBlur: slotProps.fieldContext.handleBlur,
              }),
              slots.default?.(),
            ]),
        }),
      });

      const Host = defineComponent({
        setup() {
          useDynamicForm();
          const metadata = [{
            name: 'wizard',
            wizard: { allowForwardJump: true },
            children: [
              { name: 'company', children: [{ name: 'companyName', minOccurs: 0 }] },
              { name: 'plan', children: [{ name: 'planName', minOccurs: 0 }] },
            ],
          }];
          return () => h(DynamicForm as any, { template: BadTemplate, metadata });
        },
      });

      const wrapper2 = mount(Host, { attachTo: document.body });
      await flushPromises();

      await wrapper2.find('[id="wizard.company.companyName"]').setValue('Acme');
      await flushPromises();
      expect(itemSetupState(wrapper2, 'wizard.company.companyName')).toBeDefined();

      await wrapper2.find('[data-testid="goto-1"]').trigger('click');
      await flushPromises();

      // The v-if unmounted page 0's field: it is no longer registered/findable.
      expect(itemSetupState(wrapper2, 'wizard.company.companyName')).toBeUndefined();
      expect(wrapper2.find('[id="wizard.company.companyName"]').exists()).toBe(false);
    });
  });

  describe('wizard is static, not computed (AC17)', () => {
    it('runtime: a computedProps mutation of wizard (via an as any cast) has no effect on the render mode', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            ...twoPageWizard(),
            computedProps: [(thisField: any) => {
              thisField.wizard = false;
            }],
          }] as unknown as Metadata[],
        },
      });
      await flushPromises();

      expect(wrapper.findAllComponents({ name: 'DynamicFormItemWizard' })).toHaveLength(1);
    });

    it('type-level: wizard is not assignable inside computedProps', () => {
      function typeCheckOnly(thisField: ComputedPropsFieldOf<Metadata>) {
        // @ts-expect-error wizard is excluded from ComputedPropsFieldType
        thisField.wizard = true;
      }
      expect(typeof typeCheckOnly).toBe('function');
    });
  });

  describe('maxOccurs still governs the ordinary disabled meaning of 0 on the wizard node itself', () => {
    it('maxOccurs: 0 disables the wizard container', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [twoPageWizard({ maxOccurs: 0 })] },
      });
      await flushPromises();

      expect(setupState(wrapper, 'wizard')?.disabled).toBe(true);
    });
  });

  describe('minOccursOverride/maxOccursOverride propagate from an ordinary optional/disabled parent, the same way they do for any other child', () => {
    it('an empty, optional parent propagates minOccursOverride: 0 to a wizard child', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'section',
            minOccurs: 0,
            children: [twoPageWizard()],
          }] as unknown as Metadata[],
        },
      });
      await flushPromises();

      expect(setupState(wrapper, 'section.wizard')?.required).toBe(false);
    });

    it('a disabled (maxOccurs: 0) parent propagates maxOccursOverride: 0 to a wizard child', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'section',
            maxOccurs: 0,
            children: [twoPageWizard()],
          }] as unknown as Metadata[],
        },
      });
      await flushPromises();

      expect(setupState(wrapper, 'section.wizard')?.disabled).toBe(true);
    });
  });

  describe('stepper built purely from the pages slot prop always matches the actually-rendered page set (AC12)', () => {
    it('the number of goto buttons equals the number of rendered page wrappers', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: [twoPageWizard()] } });
      await flushPromises();

      const gotoButtons = wrapper.findAll('[data-testid^="wizard-goto-"]');
      const pageWrappers = wrapper.findAll('[data-testid$="-page"]').filter(w => w.attributes('data-testid')?.startsWith('wizard.'));
      expect(gotoButtons).toHaveLength(2);
      expect(pageWrappers).toHaveLength(2);
    });
  });

  describe('field-less summary page using v-if (acceptable exception)', () => {
    it('renders and hides correctly across navigation with no error', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [twoPageWizard({
            children: [
              { name: 'company', children: [{ name: 'companyName', minOccurs: 0 }] },
              { name: 'summary' }, // field-less page: no children, nothing to lose on unmount
            ],
          })],
        },
      });
      await flushPromises();

      expect(findDynamicFormItemWizardByPath(wrapper, 'wizard')).toBeDefined();

      await clickNext(wrapper, 'wizard');
      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(wrapper.find('[data-testid="wizard.summary-page"]').exists()).toBe(true);
    });
  });
});
