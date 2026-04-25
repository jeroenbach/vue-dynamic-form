import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    vue(),
    // cssInjectedByJsPlugin()
  ],
  resolve: {
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
  },

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/test-setup.ts'],
  },

  build: {
    cssCodeSplit: true,
    target: 'esnext',
    sourcemap: true,
    lib: {
      entry: {
        'vue-dynamic-form': path.resolve(__dirname, 'src/index.ts'),
        'examples': path.resolve(__dirname, 'src/examples/index.ts'),
      },
      name: 'VueDynamicForm',
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },

    rollupOptions: {
      external: ['vue', 'vee-validate'],
      output: {
        globals: {
          'vue': 'Vue',
          'vee-validate': 'VeeValidate',
        },
      },
    },
  },
});
