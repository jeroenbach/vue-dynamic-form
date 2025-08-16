import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
  },
  build: {
    cssCodeSplit: true,
    target: 'esnext',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'VueDynamicFormElementPlus',
      fileName: format => `vue-dynamic-form-element-plus.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'element-plus', '@bach.software/vue-dynamic-form'],
      output: {
        globals: {
          'vue': 'Vue',
          'element-plus': 'ElementPlus',
          '@bach.software/vue-dynamic-form': 'VueDynamicForm',
        },
      },
    },
  },
});
