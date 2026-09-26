import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { childFieldsSampleValues, childFieldsTestCase, computedPropsSampleValues, computedPropsTestCase } from '@bach.software/vue-dynamic-form/examples';
import { sampleDataStory } from './sampleDataStory';

const meta = {
  title: 'Forms/TestCases/DynamicProps',
  component: computedPropsTestCase,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof computedPropsTestCase>;

export default meta;
type Story = StoryObj<typeof meta>;

/** computedProps reacting to the field's own value, a parent reacting to child values (computeOnChildValueChange) and a parent reacting to child computed state (childFields). Toggle "Load sample data" to pre-fill it. */
export const ComputedProps: Story = sampleDataStory(computedPropsTestCase, computedPropsSampleValues);

/** View mode with initial values: fields without a value are hidden until you click edit. Off shows the baked person; "Load sample data" loads a fuller person and address. */
export const ViewModeWithInitialValues: Story = sampleDataStory(childFieldsTestCase, childFieldsSampleValues);
