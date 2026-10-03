import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json', 'html', 'lcov'],
      exclude: [...coverageConfigDefaults.exclude, 'src/tests/**'],
    },
  },
  build: {
    // Keep the declarations emitted by vue-tsc; the build script cleans dist itself.
    emptyOutDir: false,
    // A single stylesheet that consumers import explicitly; per-chunk css would bypass `cssFileName`.
    cssCodeSplit: false,
    target: 'esnext',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'VueDynamicFormElementPlus',
      cssFileName: 'style',
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
