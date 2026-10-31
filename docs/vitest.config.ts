import { defineConfig } from 'vitest/config';

// Tests here cover the docs site's own pure logic modules (no DOM, no Vue mounting),
// so a plain node environment is enough and the VitePress config stays untouched.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['.vitepress/theme/components/__tests__/**/*.test.ts'],
  },
});
