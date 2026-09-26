import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { restrictionsSampleValues, restrictionsTestCase } from '@bach.software/vue-dynamic-form/examples';
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
