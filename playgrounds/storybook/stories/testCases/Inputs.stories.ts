import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { defaultSampleValues, defaultTestCase, inputTypesSampleValues, inputTypesTestCase } from '@bach.software/vue-dynamic-form/examples';
import { sampleDataStory } from './sampleDataStory';

const meta = {
  title: 'Forms/TestCases/Inputs',
  component: defaultTestCase,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof defaultTestCase>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single text field with a custom path and a maxLength restriction. Toggle "Load sample data" to pre-fill it. */
export const Default: Story = sampleDataStory(defaultTestCase, defaultSampleValues);

/** Every input slot (text, select, checkbox, v-model variants, default fallback) plus the static field props: optional, disabled, hidden, fullWidth and description. Toggle "Load sample data" to pre-fill it. */
export const AllInputTypes: Story = sampleDataStory(inputTypesTestCase, inputTypesSampleValues);
