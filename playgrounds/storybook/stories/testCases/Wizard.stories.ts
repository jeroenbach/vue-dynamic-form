import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { choiceOfWizardsSampleValues, choiceOfWizardsTestCase, repeatedWizardSampleValues, repeatedWizardTestCase, wizardCompositePagesSampleValues, wizardCompositePagesTestCase, wizardForwardJumpSampleValues, wizardForwardJumpTestCase, wizardKeepValuesSampleValues, wizardKeepValuesTestCase, wizardSampleValues, wizardTestCase, wizardValidateOnJumpSampleValues, wizardValidateOnJumpTestCase } from '@bach.software/vue-dynamic-form/examples';
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

/** allowForwardJump: true. Stepper buttons now jump forward to not-yet-visited pages too; skipped pages are not validated (validateOnJump is off). Toggle "Load sample data" to pre-fill it. */
export const ForwardJump: Story = sampleDataStory(wizardForwardJumpTestCase, wizardForwardJumpSampleValues);

/** allowForwardJump + validateOnJump: every stepper jump is gated on the current page's validation. Jumping away from an invalid page is blocked and shows the error, exactly like "Next". Toggle "Load sample data" to pre-fill it. */
export const ValidateOnJump: Story = sampleDataStory(wizardValidateOnJumpTestCase, wizardValidateOnJumpSampleValues);

/** Heterogeneous pages behind one wizard: a group page, a repeatable array page, a choice page, and a field-less summary page. Each renders through its own shape inside the shape-agnostic wizard-page wrapper. Toggle "Load sample data" to pre-fill it. */
export const CompositePages: Story = sampleDataStory(wizardCompositePagesTestCase, wizardCompositePagesSampleValues);

/** A choice of wizards: an explicit choice whose branches are each a wizard. Selecting a branch mounts one independent wizard with its own step state, with no wizard-specific composition code. Loading sample data auto-selects the branch that carries a value. */
export const ChoiceOfWizards: Story = sampleDataStory(choiceOfWizardsTestCase, choiceOfWizardsSampleValues);

/** A repeated wizard: an array whose item children contain a wizard, so each occurrence runs its own wizard with independent step state. Toggle "Load sample data" to pre-fill two teams. */
export const RepeatedWizard: Story = sampleDataStory(repeatedWizardTestCase, repeatedWizardSampleValues);

/**
 * Page-gating contract, hands-on. Type into "Company name" on page 1, jump to page 2, then back.
 * - Gate with v-show (default, correct): the value is always preserved; pages stay mounted.
 * - Gate with v-if: navigating away unmounts page 1 and clears its value (watch the debug panel), unless keepValuesOnUnmount is on, which preserves it.
 * Note: even with keepValuesOnUnmount, a v-if page's fields are deregistered while unmounted, so they are not validated on submit — v-show remains the correct choice for form pages.
 */
export const VIfAndKeepValues: Story = {
  args: { loadSampleData: false, useVIf: true, keepValuesOnUnmount: false },
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
