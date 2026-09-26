import type { StoryObj } from '@storybook/vue3-vite';
import type { Component } from 'vue';

interface SampleDataStoryOptions {
  /** Extra props forwarded to the test case component (e.g. initialEdit, hideFieldsWithoutValue). */
  extraProps?: Record<string, unknown>
}

/**
 * Wraps a test case in a story with a "Load sample data" boolean control in the Controls panel.
 * Off renders the form empty; on remounts it pre-filled with the curated sample values. The :key
 * forces a clean remount on toggle so vee-validate re-seeds from the new initialValues instead of
 * patching the already-mounted form (which would ignore the changed initial values).
 */
export function sampleDataStory(
  testCase: Component,
  sampleValues: Record<string, unknown>,
  options: SampleDataStoryOptions = {},
): StoryObj {
  return {
    args: { loadSampleData: false },
    argTypes: {
      loadSampleData: { control: 'boolean', name: 'Load sample data' },
    },
    render: (args: { loadSampleData?: boolean }) => ({
      components: { TestCase: testCase },
      setup: () => ({ args, sampleValues, extraProps: options.extraProps ?? {} }),
      template: `<TestCase
        :key="args.loadSampleData ? 'withData' : 'empty'"
        :initialValues="args.loadSampleData ? sampleValues : undefined"
        v-bind="extraProps"
      />`,
    }),
  };
}
