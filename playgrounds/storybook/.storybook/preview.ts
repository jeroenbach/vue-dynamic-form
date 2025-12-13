import type { Preview } from '@storybook/vue3-vite';
import { setup } from '@storybook/vue3';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './input.css';

setup((app) => {
  app.use(ElementPlus);
});

const preview: Preview = {
  parameters: {
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
