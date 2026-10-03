import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { choiceOfWizardsSampleValues, choiceOfWizardsTestCase, repeatedWizardSampleValues, repeatedWizardTestCase, wizardCompositePagesSampleValues, wizardCompositePagesTestCase, wizardDisabledAncestorSampleValues, wizardDisabledAncestorTestCase, wizardForwardJumpSampleValues, wizardForwardJumpTestCase, wizardKeepValuesSampleValues, wizardKeepValuesTestCase, wizardOptionalAncestorSampleValues, wizardOptionalAncestorTestCase, wizardSampleValues, wizardTestCase, wizardValidateOnJumpSampleValues, wizardValidateOnJumpTestCase } from '@bach.software/vue-dynamic-form/examples';
import { sampleDataStory } from './sampleDataStory';

const meta = {
  title: 'Forms/TestCases/Wizard',
  component: wizardTestCase,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof wizardTestCase>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Backward-only wizard (the default). "Next" validates the current page and only advances on success; the stepper buttons jump only to already-visited earlier pages. On the last page "isLast" is true, so the form's own Submit takes over. Toggle "Load sample data" to pre-fill every page. */
export const Wizard: Story = sampleDataStory(wizardTestCase, wizardSampleValues);

/** `wizard: { allowForwardJump: true, validateOnJump: false}`. This story isolates the direction flag on its own: stepper buttons now jump forward to not-yet-visited pages, not just back to visited ones. Because `validateOnJump` is left off (its default), a jump never validates, so you can leave an invalid page and skipped pages are not validated either. Compare with ValidateOnJump, which is this same config plus `validateOnJump: true`. Toggle "Load sample data" to pre-fill it. */
export const ForwardJump: Story = sampleDataStory(wizardForwardJumpTestCase, wizardForwardJumpSampleValues);

/** `wizard: { allowForwardJump: true, validateOnJump: true }`. This is the ForwardJump config with the validation flag added, so it isolates what `validateOnJump` adds: every stepper jump is now gated on the current page's validation. Jumping away from an invalid page is blocked and shows the error, exactly like "Next". (`allowForwardJump` is still on so there are forward jumps to gate.) Toggle "Load sample data" to pre-fill it. */
export const ValidateOnJump: Story = sampleDataStory(wizardValidateOnJumpTestCase, wizardValidateOnJumpSampleValues);

/** Heterogeneous pages behind one wizard: a group page, a repeatable array page, a choice page, and a field-less summary page. Each renders through its own shape inside the shape-agnostic wizard-page wrapper. Toggle "Load sample data" to pre-fill it. */
export const CompositePages: Story = sampleDataStory(wizardCompositePagesTestCase, wizardCompositePagesSampleValues);

/** A choice of wizards: an explicit choice whose branches are each a wizard. Selecting a branch mounts one independent wizard with its own step state, with no wizard-specific composition code. Loading sample data auto-selects the branch that carries a value. */
export const ChoiceOfWizards: Story = sampleDataStory(choiceOfWizardsTestCase, choiceOfWizardsSampleValues);

/** A repeated wizard: an array whose item children contain a wizard, so each occurrence runs its own wizard with independent step state. Toggle "Load sample data" to pre-fill two teams. */
export const RepeatedWizard: Story = sampleDataStory(repeatedWizardTestCase, repeatedWizardSampleValues);

/** A wizard inside an optional (minOccurs: 0) section. While the section is untouched, its relaxation reaches through the wizard: Submit passes right away and "Next" never blocks, even though the pages declare required fields. Type into any field (or toggle "Load sample data") and the required fields gate "Next" and Submit again. */
export const OptionalAncestor: Story = sampleDataStory(wizardOptionalAncestorTestCase, wizardOptionalAncestorSampleValues);

/** A wizard inside a disabled (maxOccurs: 0) section. The disabled state reaches through the wizard into every page field: navigate the steps and each input renders disabled, and Submit passes because disabled fields are never validated. Toggle "Load sample data" to view pre-filled values in the disabled fields. */
export const DisabledAncestor: Story = sampleDataStory(wizardDisabledAncestorTestCase, wizardDisabledAncestorSampleValues);

/**
 * Page-gating contract, hands-on. Type into "Company name" on page 1, jump to page 2, then back.
 * - Gate with v-show (default, correct): the value is always preserved; pages stay mounted.
 * - Gate with v-if: navigating away unmounts page 1 and clears its value (watch the debug panel), unless keepValuesOnUnmount is on, which preserves it.
 * Note: even with keepValuesOnUnmount, a v-if page's fields are deregistered while unmounted, so they are not validated on submit — v-show remains the correct choice for form pages.
 */
// Typed as a bare StoryObj: its args are custom story controls, not props of the component.
export const VIfAndKeepValues: StoryObj = {
  args: { loadSampleData: false, useVIf: true, keepValuesOnUnmount: true },
  argTypes: {
    loadSampleData: { control: 'boolean', name: 'Load sample data' },
    useVIf: { control: 'boolean', name: 'Gate pages with v-if (instead of v-show)' },
    keepValuesOnUnmount: { control: 'boolean', name: 'keepValuesOnUnmount' },
  },
  render: (args: { loadSampleData?: boolean, useVIf?: boolean, keepValuesOnUnmount?: boolean }) => ({
    components: { TestCase: wizardKeepValuesTestCase },
    setup: () => ({ args, sampleValues: wizardKeepValuesSampleValues }),
    template: `<TestCase
      :key="\`\${args.loadSampleData}-\${args.useVIf}-\${args.keepValuesOnUnmount}\`"
      :initialValues="args.loadSampleData ? sampleValues : undefined"
      :settings="{ wizardPageUseVIf: args.useVIf }"
      :keepValuesOnUnmount="args.keepValuesOnUnmount"
    />`,
  }),
};
