import type { StorybookConfig } from '@storybook/vue3-vite'
import { mergeConfig } from 'vite'
import viteConfig from './vite.config'

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
  viteFinal: async (config) => {
    const mergedConfig = mergeConfig(viteConfig, config)
    return mergedConfig
  },
}
export default config
