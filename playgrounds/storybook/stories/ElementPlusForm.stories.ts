import type { Meta, StoryObj } from '@storybook/vue3-vite';

import {
  arrayExample,
  automaticChoiceExample,
  bareComparisonExample,
  explicitChoiceExample,
  overrideAndExtensionExample,
  plainExample,
  repeatableChoiceExample,
  wizardExample,
} from './ElementPlusForm.examples';
import ElementPlusForm from './ElementPlusForm.vue';

const meta = {
  title: 'Forms/ElementPlusFormTemplate',
  component: ElementPlusForm,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ElementPlusForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Groups and leaf fields through the bare template: no wrapper, no overrides. */
export const Plain: Story = { args: plainExample };

/** A repeatable field and a repeatable group. */
export const Arrays: Story = { args: arrayExample };

/** Automatic choice: the filled-in branch wins and the other clears. */
export const ChoiceAutomatic: Story = { args: automaticChoiceExample };

/** Explicit choice: a branch renders only after it is chosen. */
export const ChoiceExplicit: Story = { args: explicitChoiceExample };

/** A repeatable explicit choice with per-branch caps. */
export const ChoiceRepeatable: Story = { args: repeatableChoiceExample };

/** A multi-step wizard with a step indicator and per-page validation. */
export const Wizard: Story = { args: wizardExample };

/** The wrapper pattern: one overridden slot, one overridden chrome slot, and one extended field type. */
export const OverrideAndExtension: Story = { args: overrideAndExtensionExample };

/** The override example's metadata rendered through the bare template. */
export const BareComparison: Story = { args: bareComparisonExample };
