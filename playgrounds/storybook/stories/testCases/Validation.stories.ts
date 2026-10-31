import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { liveValiditySampleValues, liveValidityTestCase, restrictionsSampleValues, restrictionsTestCase } from '@bach.software/vue-dynamic-form/examples';
import { sampleDataStory } from './sampleDataStory';

const meta = {
  title: 'Forms/TestCases/Validation',
  component: restrictionsTestCase,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof restrictionsTestCase>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every XSD restriction (string, numeric, whiteSpace, enumeration), a combined restriction and a custom vee-validate validation function. Toggle "Load sample data" to fill in values that all pass. */
export const Restrictions: Story = sampleDataStory(restrictionsTestCase, restrictionsSampleValues);

/** The form-level meta.valid is live without a submit: watch the "Valid" line in the debug state flip as the group's "at least one contact method" rule is satisfied or broken. Toggle "Load sample data" to start valid. */
export const LiveValidity: Story = sampleDataStory(liveValidityTestCase, liveValiditySampleValues);
