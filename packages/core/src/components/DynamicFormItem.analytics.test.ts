import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import TestForm from '@/examples/TestForm.vue';
import { constructValidationCount, fieldChangedCount, fieldComputeCount, notifyValueUpdateCount, renderCount, valueChangedCount } from './DynamicFormItem.test-helpers';

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

    it('re-computes when the field value changes and computedProp reads value.value', async () => {
      // The value is always passed to computedProps. Reading value.value creates a reactive dependency,
      // so the computed automatically re-runs when the field value changes — no flag required.
      let updatedValue: string | undefined;
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [{ name: 'text', type: 'text', computedProps: [
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

    it('re-computes when a child value changes and computeOnChildValueChange is true', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            type: 'text',
            fieldOptions: { label: 'Person' },
            computeOnChildValueChange: true,
            computedProps: [],
            children: [{ name: 'firstName', type: 'text' }],
          }],
        },
      });
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'person')).toBe(1);
      await wrapper.find('#person\\.firstName').setValue('John');
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'person')).toBe(2);

      await wrapper.find('#person\\.firstName').setValue('John update');
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'person')).toBe(3);

      await wrapper.find('#person\\.firstName').setValue('John');
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'person')).toBe(4);

      await wrapper.find('#person\\.firstName').setValue('John');
      await flushPromises();

      expect(fieldComputeCount(wrapper, 'person')).toBe(4);
    });

    it('does not re-compute when a child value changes and computeOnChildValueChange is not set', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            type: 'text',
            fieldOptions: { label: 'Person' },
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

    it('re-computes when an external ref changes, providing access to the current field value', async () => {
      // Both value.value and externalRef are deps — the compute runs on either change.
      let updatedValue: string | undefined;
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

      // Setting the value re-computes because computedProp reads value.value
      await wrapper.find('#text').setValue('hello');
      await flushPromises();

      expect(updatedValue).toBe('hello');
      expect(fieldComputeCount(wrapper, 'text')).toBe(2);
      expect(wrapper.find('#text').attributes('disabled')).toBeUndefined(); // externalRef still false

      // Updating the external ref also re-computes, and the current value is available
      externalRef.value = true;
      await flushPromises();

      expect(updatedValue).toBe('hello');
      expect(wrapper.find('#text').attributes('disabled')).toBeDefined();
      expect(fieldComputeCount(wrapper, 'text')).toBe(3);
      expect(renderCount(wrapper, 'text')).toBe(3);
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
      // No flag needed — reading value.value in computedProp creates the reactive dependency automatically.
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
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
       *  1. User types 'hel#lo' → syncedValue = 'hel#lo' → run 2: sanitizes → writes syncedValue =
       *     'hello' (different value) → invalidates computedField
       *  2. Run 3: syncedValue is now 'hello' → sanitizes → writes 'hello' (same) → Object.is = true → no
       *     trigger → stable
       *
       * Run 3 is Vue's mandatory stabilization pass after the value changed.
       */
      expect(fieldComputeCount(wrapper, 'text')).toBe(3);
    });

    it('throws when computedProps causes a synchronous infinite loop by writing a non-idempotent value', async () => {
      // The loop is triggered on the initial render, so mount() itself throws.
      let caughtError: unknown;

      try {
        mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'text',
              type: 'text',
              computedProps: [(_, value) => {
                // Non-idempotent: always appends, so the value never stabilizes
                value.value = `${value.value ?? ''}!`;
              }],
            }],
          },
        });
        await flushPromises();
      }
      catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toContain('[DynamicFormItem] Possible infinite loop');
    });
  });

  describe('value changed count', () => {
    it('fires once on mount for a simple field (immediate watcher)', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ name: 'text', type: 'text' }],
        },
      });
      await flushPromises();

      expect(valueChangedCount(wrapper, 'text')).toBe(1);
      expect(notifyValueUpdateCount(wrapper, 'text')).toBe(0); // initial empty update is skipped
    });

    it('increments only the changed field when its value changes', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ name: 'text', type: 'text' }],
        },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();

      expect(valueChangedCount(wrapper, 'text')).toBe(2);
      expect(notifyValueUpdateCount(wrapper, 'text')).toBe(1);
    });

    it('does not increment a sibling field when another field changes', async () => {
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

      expect(valueChangedCount(wrapper, 'firstName')).toBe(2);
      expect(valueChangedCount(wrapper, 'lastName')).toBe(1); // unchanged
    });

    it('increments only the child when a child value changes, not the parent', async () => {
      // vee-validate stores all form values in a single reactive object. When person.firstName
      // is set, Vue's deep reactivity also invalidates the watcher on person — so both fire.
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            type: 'text',
            children: [{ name: 'firstName', type: 'text' }],
          }],
        },
      });
      await flushPromises();

      /**
       * When person.firstName mounts and calls useField('person.firstName'), vee-validate initializes
       * that field's path in the shared form values object (form.values.person.firstName = undefined).
       * Because form.values is deeply reactive, that write to a nested property invalidates the person
       * watcher — so it fires a second time before you've even touched anything.
       */
      expect(valueChangedCount(wrapper, 'person')).toBe(2);
      expect(notifyValueUpdateCount(wrapper, 'person')).toBe(0);
      expect(valueChangedCount(wrapper, 'person.firstName')).toBe(1);
      expect(notifyValueUpdateCount(wrapper, 'person.firstName')).toBe(0);

      await wrapper.find('#person\\.firstName').setValue('John');
      await flushPromises();

      expect(valueChangedCount(wrapper, 'person.firstName')).toBe(2);
      expect(notifyValueUpdateCount(wrapper, 'person.firstName')).toBe(1);
      expect(valueChangedCount(wrapper, 'person')).toBe(2); // parent does not update anymore after the first time the child is added
      expect(notifyValueUpdateCount(wrapper, 'person')).toBe(1); // we do receive a notify from the children

      await wrapper.find('#person\\.firstName').setValue('John update');
      await flushPromises();

      expect(valueChangedCount(wrapper, 'person.firstName')).toBe(3);
      expect(notifyValueUpdateCount(wrapper, 'person.firstName')).toBe(2);
      expect(valueChangedCount(wrapper, 'person')).toBe(2);
      expect(notifyValueUpdateCount(wrapper, 'person')).toBe(2);
    });

    it('increments only the attribute when an attribute value changes, not the parent or child', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            type: 'text',
            children: [{
              name: 'firstName',
              type: 'text',
              attributes: [{ name: 'lang', type: 'text', minOccurs: 0 }],
            }],
          }],
        },
      });
      await flushPromises();

      // Set child value first so attributes become visible
      await wrapper.find('#person\\.firstName').setValue('John');
      await flushPromises();

      expect(valueChangedCount(wrapper, 'person')).toBe(2);
      expect(notifyValueUpdateCount(wrapper, 'person')).toBe(1);
      expect(valueChangedCount(wrapper, 'person.firstName')).toBe(2);
      expect(notifyValueUpdateCount(wrapper, 'person.firstName')).toBe(1);
      expect(valueChangedCount(wrapper, 'person.firstName.lang')).toBe(1);
      expect(notifyValueUpdateCount(wrapper, 'person.firstName.lang')).toBe(0);

      await wrapper.find('#person\\.firstName\\.lang').setValue('en');
      await flushPromises();

      expect(valueChangedCount(wrapper, 'person.firstName.lang')).toBe(2);
      expect(notifyValueUpdateCount(wrapper, 'person')).toBe(2);
      expect(valueChangedCount(wrapper, 'person.firstName')).toBe(2); // child unchanged
      expect(notifyValueUpdateCount(wrapper, 'person.firstName')).toBe(2);
      expect(valueChangedCount(wrapper, 'person')).toBe(2); // parent unchanged
      expect(notifyValueUpdateCount(wrapper, 'person.firstName.lang')).toBe(1);
    });
  });
});
