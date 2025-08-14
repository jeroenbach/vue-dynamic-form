import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SimpleForm from './SimpleForm.vue';

const meta = {
  title: 'Forms/SimpleForm',
  component: SimpleForm,
  render: () => ({
    components: { SimpleForm },
    template: '<SimpleForm />',
  }),
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SimpleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
};
