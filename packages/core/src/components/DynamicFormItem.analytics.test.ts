import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import TestForm from '@/examples/TestForm.vue';

/** Reads the render count for a field from the analytics DOM span. */
function renderCount(wrapper: ReturnType<typeof mount>, path: string): number {
  return Number(wrapper.find(`[data-testid="${path}-analytics-render-count"]`).text());
}

/**
 * Accesses the internal `<script setup>` state of the DynamicFormItem for a given field path.
 * Uses `vm.$.setupState` — an internal Vue API that exposes all setup variables, including
 * private `let` declarations that are not exposed via `defineExpose`.
 */
function setupState(wrapper: ReturnType<typeof mount>, path: string): Record<string, any> | undefined {
  const item = wrapper.findAllComponents({ name: 'DynamicFormItem' })
    .find(c => c.vm.$.setupState.path === path);
  return item?.vm.$.setupState;
}

/** Reads the number of times `combinedValidation` was recomputed for a given field. Returns -1 if the field is not found. */
function constructValidationCount(wrapper: ReturnType<typeof mount>, path: string): number {
  return setupState(wrapper, path)?._analytics_constructValidationCount ?? -1;
}

/** Reads the number of times `computedField` was recomputed for a given field. Returns -1 if the field is not found. */
function fieldComputeCount(wrapper: ReturnType<typeof mount>, path: string): number {
  return setupState(wrapper, path)?._analytics_fieldComputeCount ?? -1;
}

/** Reads the number of times the `field` computed (bound to `props.fieldMetadata`) was recomputed. Returns -1 if the field is not found. */
function fieldChangedCount(wrapper: ReturnType<typeof mount>, path: string): number {
  return setupState(wrapper, path)?._analytics_fieldChangedCount ?? -1;
}

describe('component DynamicFormItem - analytics', () => {
  describe('render count', () => {
    describe('initial render', () => {
      it('renders a single field exactly once on mount', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{ name: 'text', type: 'text' }],
          },
        });
        await flushPromises();

        expect(renderCount(wrapper, 'text')).toBe(1);
      });

      it('renders each field exactly once when mounting multiple fields', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [
              { name: 'firstName', type: 'text' },
              { name: 'lastName', type: 'text' },
            ],
          },
        });
        await flushPromises();

        expect(renderCount(wrapper, 'firstName')).toBe(1);
        expect(renderCount(wrapper, 'lastName')).toBe(1);
      });
    });

    describe('value changes', () => {
      it('does not re-render when its own value changes', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{ name: 'text', type: 'text' }],
          },
        });
        await flushPromises();

        await wrapper.find('#text').setValue('hello');
        await flushPromises();

        expect(renderCount(wrapper, 'text')).toBe(1);
      });

      it('does not re-render a sibling field when another field changes', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [
              { name: 'firstName', type: 'text' },
              { name: 'lastName', type: 'text' },
            ],
          },
        });
        await flushPromises();

        const lastNameCountBefore = renderCount(wrapper, 'lastName');
        await wrapper.find('#firstName').setValue('John');
        await flushPromises();

        expect(renderCount(wrapper, 'lastName')).toBe(lastNameCountBefore);
      });

      it('does not re-render a sibling field across multiple keystrokes', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [
              { name: 'firstName', type: 'text' },
              { name: 'lastName', type: 'text' },
            ],
          },
        });
        await flushPromises();

        const lastNameCountBefore = renderCount(wrapper, 'lastName');
        for (const char of ['J', 'o', 'h', 'n']) {
          await wrapper.find('#firstName').setValue(char);
          await flushPromises();
        }

        expect(renderCount(wrapper, 'lastName')).toBe(lastNameCountBefore);
      });

      it('only re-renders the child when an externalRef in child computedProp changes, not the parent', async () => {
        const externalRef = ref('initial');

        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'person',
              type: 'text',
              children: [{
                name: 'text',
                type: 'text',
                computedProps: [(field) => {
                  field.minOccurs = externalRef.value === 'initial' ? 0 : 1;
                }],
              }],
            }],
          },
        });
        await flushPromises();

        expect(renderCount(wrapper, 'person')).toBe(1);
        expect(renderCount(wrapper, 'person.text')).toBe(1);

        externalRef.value = 'updated';
        await flushPromises();

        expect(renderCount(wrapper, 'person')).toBe(1);
        expect(renderCount(wrapper, 'person.text')).toBe(2);
      });
    });

    describe('settings changes', () => {
      // Known behavior: changing messages causes 1 re-render because combinedValidation depends on
      // settings.messages. When it recomputes, useField detects the new validator and triggers a
      // state update. Potential optimization: decouple message interpolation from the validator
      // functions so messages can change without rebuilding the validator array.
      it('re-renders once when the messages change', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{ name: 'text', type: 'text' }],
            settings: { analytics: true, messages: { required: 'This field is required' } },
          },
        });
        await flushPromises();

        await wrapper.setProps({ settings: { analytics: true, messages: { required: 'Please fill in this field' } } });
        await flushPromises();

        expect(renderCount(wrapper, 'text')).toBe(2);
      });
    });

    describe('nested fields', () => {
      it('does not re-render a child field when a sibling child changes', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'person',
              type: 'text',
              children: [
                { name: 'firstName', type: 'text' },
                { name: 'lastName', type: 'text' },
              ],
            }],
          },
        });
        await flushPromises();

        const lastNameCountBefore = renderCount(wrapper, 'person.lastName');
        await wrapper.find('#person\\.firstName').setValue('John');
        await flushPromises();

        expect(renderCount(wrapper, 'person.lastName')).toBe(lastNameCountBefore);
      });
    });

    it('re-render when the label changes', async () => {
      const externalRef = ref('initial');

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            fieldOptions: { label: externalRef },
          }],
        },
      });
      await flushPromises();

      expect(wrapper.find('label[for="text"]').text()).toContain('initial');
      expect(renderCount(wrapper, 'text')).toBe(1);
      expect(fieldChangedCount(wrapper, 'text')).toBe(1);

      externalRef.value = 'updated';
      await flushPromises();

      // when the label changes, the ui is updated
      expect(wrapper.find('label[for="text"]').text()).toContain('updated');

      expect(fieldComputeCount(wrapper, 'text')).toBe(1); // no recompute of the computedField
      expect(renderCount(wrapper, 'text')).toBe(1); // doesn't update the current component
      expect(fieldChangedCount(wrapper, 'text')).toBe(1); // original field never updated
    });
  });

  describe('construct validation count', () => {
    it('constructs validation exactly once on mount', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [{ name: 'text', type: 'text' }] },
      });
      await flushPromises();

      expect(constructValidationCount(wrapper, 'text')).toBe(1);
    });

    it('does not reconstruct validation when the field value changes', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [{ name: 'text', type: 'text' }] },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();

      expect(constructValidationCount(wrapper, 'text')).toBe(1);
    });

    it('does not reconstruct validation when a sibling field value changes', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            { name: 'firstName', type: 'text' },
            { name: 'lastName', type: 'text' },
          ],
        },
      });
      await flushPromises();

      await wrapper.find('#firstName').setValue('John');
      await flushPromises();

      expect(constructValidationCount(wrapper, 'lastName')).toBe(1);
    });

    it('reconstructs validation when the field restriction changes', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [{ name: 'text', type: 'text', minOccurs: 0 }] },
      });
      await flushPromises();

      await wrapper.setProps({
        metadata: [{ name: 'text', type: 'text', minOccurs: 0, restriction: { minLength: 5 } }],
      });
      await flushPromises();

      expect(constructValidationCount(wrapper, 'text')).toBe(2);
    });

    it('reconstructs validation when the settings messages change', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ name: 'text', type: 'text' }],
          settings: { messages: { required: 'This field is required' } },
        },
      });
      await flushPromises();

      await wrapper.setProps({ settings: { messages: { required: 'Please fill in this field' } } });
      await flushPromises();

      expect(constructValidationCount(wrapper, 'text')).toBe(2);
    });
  });

  describe('field compute count', () => {
    it('compute the field exactly once on mount', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [{ name: 'text', type: 'text' }] },
      });
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'text')).toBe(1);
    });

    it('does not re-compute when the field value changes', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [{ name: 'text', type: 'text' }] },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'text')).toBe(1);
    });

    it('does not re-compute when a sibling field value changes', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            { name: 'firstName', type: 'text' },
            { name: 'lastName', type: 'text' },
          ],
        },
      });
      await flushPromises();

      await wrapper.find('#firstName').setValue('John');
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'lastName')).toBe(1);
    });

    it('re-computes when the field metadata changes', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [{ name: 'text', type: 'text' }] },
      });
      await flushPromises();

      await wrapper.setProps({ metadata: [{ name: 'text', type: 'text', fieldOptions: { label: 'Updated' } }] });
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'text')).toBe(2);
    });

    it('re-compute when the field value changes and computeOnValueChange is true', async () => {
      let updatedValue = ''; // will be overridden the first time the computedProp runs
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [{ name: 'text', type: 'text', computeOnValueChange: true, computedProps: [
          (_, value) => {
            updatedValue = value?.value as string;
          },
        ] }] },
      });
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'text')).toBe(1);
      expect(updatedValue).toBe(undefined);

      await wrapper.find('#text').setValue('hello');
      await flushPromises();

      expect(updatedValue).toBe('hello');
      expect(fieldComputeCount(wrapper, 'text')).toBe(2);
    });

    it('does not re-compute the when a child value changes and computeOnValueChange is true', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            type: 'text',
            fieldOptions: { label: 'Person' },
            computeOnValueChange: true,
            computedProps: [],
            children: [{ name: 'firstName', type: 'text' }],
          }],
        },
      });
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'person')).toBe(1);
      await wrapper.find('#person\\.firstName').setValue('John');
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'person')).toBe(1);
    });

    it('re-computes when an external ref read by a computedProp changes, without changing the field', async () => {
      let updatedValue = ''; // will be overridden the first time the computedProp runs with undefined
      const externalRef = ref(false);

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            disabled: false,
            computedProps: [(field, value) => {
              updatedValue = value.value as string;
              if (externalRef.value)
                field.disabled = true;
            }],
          }],
        },
      });
      await flushPromises();

      expect(wrapper.find('#text').attributes('disabled')).toBeUndefined();

      expect(renderCount(wrapper, 'text')).toBe(1);
      expect(fieldChangedCount(wrapper, 'text')).toBe(1);

      // update the value, but because computeOnValueChange is false, will not trigger the computedProps
      await wrapper.find('#text').setValue('hello');
      await flushPromises();

      expect(updatedValue).toBe(undefined);

      // update the externalRef, which should trigger the computedProps
      externalRef.value = true;
      await flushPromises();

      expect(updatedValue).toBe('hello');

      expect(wrapper.find('#text').attributes('disabled')).toBeDefined();

      expect(fieldComputeCount(wrapper, 'text')).toBe(2);
      expect(renderCount(wrapper, 'text')).toBe(2); // when the computedField updates, the component re-renders
      expect(fieldChangedCount(wrapper, 'text')).toBe(1);
    });

    it('only re-computes the child when an externalRef in child computedProp changes, not the parent', async () => {
      const externalRef = ref('initial');

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            type: 'text',
            children: [{
              name: 'text',
              type: 'text',
              computedProps: [(field) => {
                field.minOccurs = externalRef.value === 'initial' ? 0 : 1;
              }],
            }],
          }],
        },
      });
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'person')).toBe(1);
      expect(fieldComputeCount(wrapper, 'person.text')).toBe(1);

      externalRef.value = 'updated';
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'person')).toBe(1);
      expect(fieldComputeCount(wrapper, 'person.text')).toBe(2);
    });

    it('computedProp can sanitize the value by removing disallowed characters', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            computeOnValueChange: true,
            computedProps: [(_, value) => {
              if (typeof value.value === 'string')
                value.value = value.value.replace(/#/g, '');
            }],
          }],
        },
      });
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'text')).toBe(1);

      await wrapper.find('#text').setValue('hel#lo');
      await flushPromises();

      expect((wrapper.find('#text').element as HTMLInputElement).value).toBe('hello');
      /**
       * After the value is updated in the computedProps, the computedProps are run again as a stabilize run, unavoidable with vue's architecture.
       *
       *  1. User types 'hel#lo' → trackedValue = 'hel#lo' → run 2: sanitizes → writes trackedValue =
       * 'hello' (different value) → invalidates computedField
       * 2. Run 3: trackedValue is now 'hello' → sanitizes → writes 'hello' (same) → Object.is = true → no
       *  trigger → stable
       *
       * Run 3 is Vue's mandatory stabilization pass after the value changed.
       */
      expect(fieldComputeCount(wrapper, 'text')).toBe(3);
    });
  });
});
