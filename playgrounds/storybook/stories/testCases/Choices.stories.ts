import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { choiceDisplayOrderAddedSampleValues, choiceDisplayOrderAddedTestCase, choiceOccurrenceSampleValues, choiceOccurrenceTestCase, choicePreserveOrderSampleValues, choicePreserveOrderScalarBranchSampleValues, choicePreserveOrderScalarBranchTestCase, choicePreserveOrderTestCase, choiceSampleValues, choiceTestCase, explicitChoiceSampleValues, explicitChoiceTestCase, explicitRepeatableChoiceSampleValues, explicitRepeatableChoiceTestCase, preserveOnSwitchSampleValues, preserveOnSwitchTestCase } from '@bach.software/vue-dynamic-form/examples';
import { sampleDataStory } from './sampleDataStory';

const meta = {
  title: 'Forms/TestCases/Choices',
  component: choiceTestCase,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof choiceTestCase>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Value-driven (auto mode) choices: simple, grouped and array branches. Toggle "Load sample data" to pre-fill one branch per choice. */
export const ChoiceFields: Story = sampleDataStory(choiceTestCase, choiceSampleValues);

/** Choice occurrence combinations: optional choice, minOccurs 2, branches with different per-iteration limits and a maxOccursTotal branch cap in auto mode. Toggle "Load sample data" to pre-fill it. */
export const OccurrenceVariants: Story = sampleDataStory(choiceOccurrenceTestCase, choiceOccurrenceSampleValues);

/** explicitChoiceSelection: no branch renders until one is added; switching clears the other branch. Loading sample data auto-selects the branch that carries a value. */
export const ExplicitChoice: Story = sampleDataStory(explicitChoiceTestCase, explicitChoiceSampleValues);

/** explicitChoiceSelection + preserveOnSwitch: switching away stashes the branch values, switching back restores them. Toggle "Load sample data" to pre-fill it. */
export const PreserveOnSwitch: Story = sampleDataStory(preserveOnSwitchTestCase, preserveOnSwitchSampleValues);

/** Repeatable explicit choice (maxOccurs 5) with per-branch maxOccursTotal caps, rendered through the choice-array slot family. Loading sample data shows a mix of both kinds. */
export const ExplicitRepeatableChoice: Story = sampleDataStory(explicitRepeatableChoiceTestCase, explicitRepeatableChoiceSampleValues);

/** displayOrder: 'added': occurrences render in add-press order interleaved across both kinds instead of grouped by kind. The global-index badge follows the rendered order; the insertion-order badge appears only on items added this session. Loaded sample data sorts first (no add-order) and is lost on reload. */
export const DisplayOrderAdded: Story = sampleDataStory(choiceDisplayOrderAddedTestCase, choiceDisplayOrderAddedSampleValues);

/** preserveOrder + displayOrder: 'added': each added occurrence persists a 1-based "order" into its own values (see debug output), counted across both kinds; removing compacts survivors back to 1..N. Loaded sample data lacks "order" and is backfilled once from its grouped position. */
export const PreserveOrder: Story = sampleDataStory(choicePreserveOrderTestCase, choicePreserveOrderSampleValues);

/** preserveOrder on a choice mixing an object branch and a scalar-leaf branch: the object branch gets an "order" field, the scalar branch is a no-op (nowhere to attach it) and logs a console.warn in development. */
export const PreserveOrderScalarBranch: Story = sampleDataStory(choicePreserveOrderScalarBranchTestCase, choicePreserveOrderScalarBranchSampleValues);
