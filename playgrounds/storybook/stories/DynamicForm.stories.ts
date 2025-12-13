import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { arrayTestCase, defaultTestCase } from '@bach.software/vue-dynamic-form/examples';

const meta = {
  title: 'Forms/DynamicForm',
  component: defaultTestCase,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof defaultTestCase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { TestCase: defaultTestCase },
    template: `<TestCase />`,
  }),
};

export const ArrayFields: Story = {
  render: () => ({
    components: { TestCase: arrayTestCase },
    template: `<TestCase />`,
  }),
};
