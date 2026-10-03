import { config, enableAutoUnmount } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import { afterEach } from 'vitest';

enableAutoUnmount(afterEach);

// The template only imports the El* components as types, so they resolve through global registration.
config.global.plugins = [ElementPlus];

// jsdom has no object URLs, which the upload list creates and revokes for its files.
URL.createObjectURL ??= () => 'blob:test';
URL.revokeObjectURL ??= () => {};
