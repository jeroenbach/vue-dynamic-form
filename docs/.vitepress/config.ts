import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitepress';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));
const coreSrcDir = fileURLToPath(new URL('../../packages/core/src', import.meta.url));

export default defineConfig({
  title: 'Vue Dynamic Form',
  description: 'Schema-driven Vue forms powered by vee-validate.',
  cleanUrls: true,
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': coreSrcDir,
      },
    },
    server: {
      fs: {
        allow: [rootDir],
      },
    },
  },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Core README', link: '/core-readme' },
      { text: 'GitHub', link: 'https://github.com/jeroenbach/dynamic-form' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Define Metadata', link: '/guide/define-metadata' },
            { text: 'Templates', link: '/guide/templates' },
            { text: 'DynamicForm', link: '/guide/dynamic-form' },
            { text: 'How It Works', link: '/guide/how-it-works' },
            { text: 'Validation', link: '/guide/validation' },
            { text: 'Metadata Reference', link: '/guide/metadata-reference' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Basic Form', link: '/examples/basic' },
            { text: 'Arrays And Groups', link: '/examples/arrays-and-groups' },
            { text: 'Choices', link: '/examples/choices' },
            { text: 'Client Onboarding', link: '/examples/client-onboarding' },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/jeroenbach/dynamic-form' },
    ],
    footer: {
      message: 'Built for schema-driven Vue forms.',
      copyright: 'Copyright © Jeroen Bach',
    },
  },
});
