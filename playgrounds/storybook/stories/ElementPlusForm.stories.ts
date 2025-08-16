import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ElementPlusForm from './ElementPlusForm.vue';

const meta = {
  title: 'Forms/ElementPlusForm',
  component: ElementPlusForm,
  render: () => ({
    components: { ElementPlusForm },
    template: '<ElementPlusForm />',
  }),
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ElementPlusForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const WithAllComponents: Story = {};