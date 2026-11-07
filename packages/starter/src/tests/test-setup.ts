import { enableAutoUnmount } from '@vue/test-utils';
import { afterEach } from 'vitest';

enableAutoUnmount(afterEach);

// jsdom has no canvas backend. Without this stub, axe-core's icon-ligature
// detection logs a noisy "not implemented" error on every run; it already
// handles a null context gracefully, so stubbing it keeps the real failures
// visible in the test output.
if (typeof HTMLCanvasElement !== 'undefined')
  HTMLCanvasElement.prototype.getContext = () => null;
