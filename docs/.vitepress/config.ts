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
      { text: 'Reference', link: '/reference/' },
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
            { text: '1. Define Your Field Types', link: '/guide/define-metadata' },
            { text: '2. Build a Template', link: '/guide/building-templates' },
            { text: '3. Wire Up a Form', link: '/guide/your-first-form' },
            { text: '4. Dynamic Fields', link: '/guide/dynamic-fields' },
            { text: '5. Advanced Fields', link: '/guide/advanced-fields' },
            { text: 'Validation', link: '/guide/validation' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Overview', link: '/reference/' },
            { text: 'defineMetadata()', link: '/reference/define-metadata' },
            { text: 'DynamicFormTemplate', link: '/reference/dynamic-form-template' },
            { text: 'DynamicForm', link: '/reference/dynamic-form' },
            { text: 'FieldMetadata', link: '/reference/field-metadata' },
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
