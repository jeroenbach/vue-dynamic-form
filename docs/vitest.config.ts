import { defineConfig } from 'vitest/config';

// Scoped to plain .ts modules only (no jsdom, no @vue/test-utils, no Vue plugin).
// docs/ has no component test harness; this only runs pure, framework-free logic
// such as inboxRoutingMath.ts, mirroring how splitPaymentLedgerMath.ts is written
// to be testable without a form, even though it has no test file of its own yet.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['.vitepress/theme/components/**/*.test.ts'],
  },
});
