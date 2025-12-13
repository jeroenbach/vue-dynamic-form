import { mount } from '@vue/test-utils';
// tests/DynamicForm.test.ts
import { describe, expect, it } from 'vitest';
import { defaultTestCase } from '@/examples/TestFormImplementation.testcases';

describe('dynamicForm Stories', () => {
  it('renders Default story', () => {
    const wrapper = mount(defaultTestCase);
    expect(wrapper.exists()).toBe(true);
  });
});
