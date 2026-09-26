import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { groupSampleValues, groupTestCase } from '@bach.software/vue-dynamic-form/examples';
import { sampleDataStory } from './sampleDataStory';

const meta = {
  title: 'Forms/TestCases/Groups',
  component: groupTestCase,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof groupTestCase>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Required and optional groups, plus repeatable (array) groups in both variants. Toggle "Load sample data" to pre-fill every group. */
export const GroupFields: Story = sampleDataStory(groupTestCase, groupSampleValues);
