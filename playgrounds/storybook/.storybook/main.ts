import type { StorybookConfig } from '@storybook/vue3-vite';
import { mergeConfig } from 'vite';
import viteConfig from './vite.config';

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {},
  viteFinal: async (config) => {
    const mergedConfig = mergeConfig(viteConfig, config);

    const tailwindcss = (await import('@tailwindcss/vite')).default;
    mergedConfig.plugins = [...(mergedConfig.plugins || []), tailwindcss()];
    return mergedConfig;
  },
};
export default config;
