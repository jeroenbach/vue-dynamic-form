import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { arrayTestCase, choiceTestCase, defaultTestCase, groupTestCase, individualTestCase } from '@bach.software/vue-dynamic-form/examples';

import { configure } from 'vee-validate';

/**
 * This should live in the app entry, not here (normally)
 */
// configure({
//   generateMessage: (context) => {
//     if (context.rule?.name === 'xsd_required')
//       return `The field ${context.field} is required`;

//     return `The field ${context.field} is invalid - Jeroen`;
//   },
// });

const meta = {
  title: 'Forms/TestCases',
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

export const GroupFields: Story = {
  render: () => ({
    components: { TestCase: groupTestCase },
    template: `<TestCase />`,
  }),
};

export const ChoiceFields: Story = {
  render: () => ({
    components: { TestCase: choiceTestCase },
    template: `<TestCase />`,
  }),
};

export const IndividualTest: Story = {
  render: () => ({
    components: { TestCase: individualTestCase },
    template: `<TestCase />`,
  }),
};
