import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { arrayMaxOccursSampleValues, arrayMaxOccursTestCase, arrayOccurrenceSampleValues, arrayOccurrenceTestCase, arraySampleValues, arrayTestCase } from '@bach.software/vue-dynamic-form/examples';
import { sampleDataStory } from './sampleDataStory';

const meta = {
  title: 'Forms/TestCases/Arrays',
  component: arrayTestCase,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof arrayTestCase>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Repeatable fields: optional and required arrays, minOccurs 2 pre-fill and a repeatable nested section. Toggle "Load sample data" to pre-fill every array. */
export const ArrayFields: Story = sampleDataStory(arrayTestCase, arraySampleValues);

/** Occurrence edge cases (autoAddMinOccurs: false, pre-fill to minOccurs, large maxOccurs) and arrays of select, checkbox and v-model inputs. Toggle "Load sample data" to pre-fill it. */
export const OccurrenceVariants: Story = sampleDataStory(arrayOccurrenceTestCase, arrayOccurrenceSampleValues);

/** Arrays loaded already over their maxOccurs (as from an API response or import), which the Add button prevents going forward but never flagged once reached. Turn on "Load sample data" and submit to see the xsd_maxOccurs error on both a required and a non-required array. */
export const OverLimitData: Story = sampleDataStory(arrayMaxOccursTestCase, arrayMaxOccursSampleValues);
