import type { Meta, StoryObj } from '@storybook/vue3-vite';
import StarterIconCatalogue from '../components/StarterIconCatalogue.vue';
import StarterSuccessPreview from '../components/StarterSuccessPreview.vue';

import {
  arrayExample,
  choiceArrayExample,
  choiceAutomaticExample,
  choiceExplicitExample,
  iconOverrideExample,
  plainExample,
  wizardExample,
} from './StarterForm.examples';
import StarterForm from './StarterForm.vue';

const meta = {
  title: 'Forms/StarterFormTemplate',
  component: StarterForm,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof StarterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A plain field (prototype.html#text-field), a select field (prototype.html#select-field), a switch field (prototype.html#switch-field), and a group (prototype.html#group), through the bare template with no overrides. */
export const Plain: Story = { args: plainExample };

/** An inline repeatable field, a repeatable group starting empty (prototype.html#array-empty), and one starting filled (prototype.html#array-filled). */
export const Arrays: Story = { args: arrayExample };

/** Automatic choice (prototype.html#choice-auto): the filled-in branch wins and the other clears. */
export const ChoiceAutomatic: Story = { args: choiceAutomaticExample };

/** Explicit choice with icon cards (prototype.html#choice-explicit): nothing renders until a branch is chosen. */
export const ChoiceExplicit: Story = { args: choiceExplicitExample };

/** A repeatable explicit choice with per-branch caps (prototype.html#choice-array). */
export const ChoiceRepeatable: Story = { args: choiceArrayExample };

/** A multi-step wizard (prototype.html#wizard) ending in a review step (prototype.html#review). */
export const Wizard: Story = { args: wizardExample };

/** The wrapper-component pattern overrides the #icon slot (prototype.html#icons), proving it reaches both the password toggle and a choice-card icon. */
export const IconOverride: Story = { args: iconOverrideExample };

/** The post-submit screen (prototype.html#success), the one loading state in the package: a mixed done/pending timeline and the spinning loader glyph on the pending item. Rendered standalone, outside DynamicForm, since the engine never dispatches to it. */
export const Success = {
  render: () => ({
    components: { StarterSuccessPreview },
    template: '<StarterSuccessPreview />',
  }),
};

/** The full icon registry (prototype.html#icons): every name `starterIconNames` exposes, rendered through the default Lucide-backed StarterIcon. */
export const Icons = {
  render: () => ({
    components: { StarterIconCatalogue },
    template: '<StarterIconCatalogue />',
  }),
};
