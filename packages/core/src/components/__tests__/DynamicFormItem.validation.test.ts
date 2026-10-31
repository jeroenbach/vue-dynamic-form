import { flushPromises, mount } from '@vue/test-utils';
import { configure } from 'vee-validate';
import { afterEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';
import TestForm from '@/examples/TestForm.vue';

describe('component DynamicFormItem', () => {
  describe('xSD build in restrictions', () => {
    afterEach(() => {
    // Reset vee-validate's generateMessage after each test so tests don't bleed into each other
      configure({ generateMessage: undefined as any });
    });

    it.each`
    restriction         | minOccurs | fieldRestriction                    | messageKey            | message                                    | inputValue             | expected
    ${'required'}       | ${1}      | ${{}}                               | ${'required'}         | ${'The {field} field is required'}         | ${''}                  | ${'The Text Input field is required'}
    ${'minLength'}      | ${0}      | ${{ minLength: 5 }}                 | ${'minLength'}        | ${'Min length of {field} is {0}'}          | ${'abc'}               | ${'Min length of Text Input is 5'}
    ${'maxLength'}      | ${0}      | ${{ maxLength: 10 }}                | ${'maxLength'}        | ${'Max length of {field} is {0}'}          | ${'this is too long'}  | ${'Max length of Text Input is 10'}
    ${'length'}         | ${0}      | ${{ length: 5 }}                    | ${'length'}           | ${'{field} must be exactly {0} chars'}     | ${'abc'}               | ${'Text Input must be exactly 5 chars'}
    ${'pattern'}        | ${0}      | ${{ pattern: '^[0-9]+$' }}          | ${'pattern'}          | ${'{field} must match the pattern'}        | ${'abc'}               | ${'Text Input must match the pattern'}
    ${'minInclusive'}   | ${0}      | ${{ minInclusive: 10 }}             | ${'minInclusive'}     | ${'{field} must be at least {0}'}          | ${'5'}                 | ${'Text Input must be at least 10'}
    ${'maxInclusive'}   | ${0}      | ${{ maxInclusive: 10 }}             | ${'maxInclusive'}     | ${'{field} must be at most {0}'}           | ${'15'}                | ${'Text Input must be at most 10'}
    ${'minExclusive'}   | ${0}      | ${{ minExclusive: 10 }}             | ${'minExclusive'}     | ${'{field} must be greater than {0}'}      | ${'10'}                | ${'Text Input must be greater than 10'}
    ${'maxExclusive'}   | ${0}      | ${{ maxExclusive: 10 }}             | ${'maxExclusive'}     | ${'{field} must be less than {0}'}         | ${'10'}                | ${'Text Input must be less than 10'}
    ${'enumeration'}    | ${0}      | ${{ enumeration: ['a', 'b', 'c'] }} | ${'enumeration'}      | ${'{field} must be one of the values'}     | ${'x'}                 | ${'Text Input must be one of the values'}
    ${'whiteSpace'}     | ${0}      | ${{ whiteSpace: 'collapse' }}       | ${'whiteSpace'}       | ${'{field} has invalid whitespace'}        | ${'  extra  spaces'}   | ${'Text Input has invalid whitespace'}
    ${'fractionDigits'} | ${0}      | ${{ fractionDigits: 2 }}            | ${'fractionDigits'}   | ${'{field} has too many decimals ({0})'}   | ${'3.141'}             | ${'Text Input has too many decimals (2)'}
    ${'totalDigits'}    | ${0}      | ${{ totalDigits: 3 }}               | ${'totalDigits'}      | ${'{field} has too many digits ({0})'}     | ${'1234'}              | ${'Text Input has too many digits (3)'}
  `('shows custom settings message for $restriction restriction', async ({ minOccurs, fieldRestriction, messageKey, message, inputValue, expected }: any) => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            fieldOptions: { label: 'Text Input' },
            minOccurs,
            restriction: fieldRestriction,
          }] as any,
          settings: {
            messages: { [messageKey]: message },
          },
        },
      });

      await wrapper.find('input').setValue(inputValue);
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain(expected);
    });

    it.each`
    restriction         | minOccurs | fieldRestriction                    | inputValue             | messageTemplate                              | expected
    ${'required'}       | ${1}      | ${{}}                               | ${''}                  | ${'The {field} field is required'}           | ${'The Text Input field is required'}
    ${'minLength'}      | ${0}      | ${{ minLength: 5 }}                 | ${'abc'}               | ${'Min length of {field} is {0}'}            | ${'Min length of Text Input is 5'}
    ${'maxLength'}      | ${0}      | ${{ maxLength: 10 }}                | ${'this is too long'}  | ${'Max length of {field} is {0}'}            | ${'Max length of Text Input is 10'}
    ${'length'}         | ${0}      | ${{ length: 5 }}                    | ${'abc'}               | ${'{field} must be exactly {0} chars'}       | ${'Text Input must be exactly 5 chars'}
    ${'pattern'}        | ${0}      | ${{ pattern: '^[0-9]+$' }}          | ${'abc'}               | ${'{field} must match the pattern'}          | ${'Text Input must match the pattern'}
    ${'minInclusive'}   | ${0}      | ${{ minInclusive: 10 }}             | ${'5'}                 | ${'{field} must be at least {0}'}            | ${'Text Input must be at least 10'}
    ${'maxInclusive'}   | ${0}      | ${{ maxInclusive: 10 }}             | ${'15'}                | ${'{field} must be at most {0}'}             | ${'Text Input must be at most 10'}
    ${'minExclusive'}   | ${0}      | ${{ minExclusive: 10 }}             | ${'10'}                | ${'{field} must be greater than {0}'}        | ${'Text Input must be greater than 10'}
    ${'maxExclusive'}   | ${0}      | ${{ maxExclusive: 10 }}             | ${'10'}                | ${'{field} must be less than {0}'}           | ${'Text Input must be less than 10'}
    ${'enumeration'}    | ${0}      | ${{ enumeration: ['a', 'b', 'c'] }} | ${'x'}                 | ${'{field} must be one of the values'}       | ${'Text Input must be one of the values'}
    ${'whiteSpace'}     | ${0}      | ${{ whiteSpace: 'collapse' }}       | ${'  extra  spaces'}   | ${'{field} has invalid whitespace'}          | ${'Text Input has invalid whitespace'}
    ${'fractionDigits'} | ${0}      | ${{ fractionDigits: 2 }}            | ${'3.141'}             | ${'{field} has too many decimals ({0})'}     | ${'Text Input has too many decimals (2)'}
    ${'totalDigits'}    | ${0}      | ${{ totalDigits: 3 }}               | ${'1234'}              | ${'{field} has too many digits ({0})'}       | ${'Text Input has too many digits (3)'}
  `('shows configure.generateMessage for $restriction restriction', async ({ minOccurs, fieldRestriction, inputValue, messageTemplate, expected }: any) => {
      configure({
        generateMessage: ctx =>
          (messageTemplate as string)
            .replace('{field}', ctx.field)
            .replace('{0}', String((ctx.rule?.params as unknown[])?.[0] ?? '')),
      });

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            fieldOptions: { label: 'Text Input' },
            minOccurs,
            restriction: fieldRestriction,
          }] as any,
          // No settings.messages — falls back to configure.generateMessage
          settings: { messages: {} },
        },
      });

      await wrapper.find('input').setValue(inputValue);
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain(expected);
    });
    it.each`
    restriction         | minOccurs | fieldRestriction                    | messageKey            | message                                          | inputValue             | expected
    ${'required'}       | ${1}      | ${{}}                               | ${'required'}         | ${'The {field} field is required'}               | ${''}                  | ${'The Text Input field is required'}
    ${'minLength'}      | ${0}      | ${{ minLength: 5 }}                 | ${'minLength'}        | ${'Min length of {field} is {length}'}           | ${'abc'}               | ${'Min length of Text Input is 5'}
    ${'maxLength'}      | ${0}      | ${{ maxLength: 10 }}                | ${'maxLength'}        | ${'Max length of {field} is {length}'}           | ${'this is too long'}  | ${'Max length of Text Input is 10'}
    ${'length'}         | ${0}      | ${{ length: 5 }}                    | ${'length'}           | ${'{field} must be exactly {length} chars'}      | ${'abc'}               | ${'Text Input must be exactly 5 chars'}
    ${'pattern'}        | ${0}      | ${{ pattern: '^[0-9]+$' }}          | ${'pattern'}          | ${'{field} must match {pattern}'}                | ${'abc'}               | ${'Text Input must match ^[0-9]+$'}
    ${'minInclusive'}   | ${0}      | ${{ minInclusive: 10 }}             | ${'minInclusive'}     | ${'{field} must be at least {min}'}              | ${'5'}                 | ${'Text Input must be at least 10'}
    ${'maxInclusive'}   | ${0}      | ${{ maxInclusive: 10 }}             | ${'maxInclusive'}     | ${'{field} must be at most {max}'}               | ${'15'}                | ${'Text Input must be at most 10'}
    ${'minExclusive'}   | ${0}      | ${{ minExclusive: 10 }}             | ${'minExclusive'}     | ${'{field} must be greater than {min}'}          | ${'10'}                | ${'Text Input must be greater than 10'}
    ${'maxExclusive'}   | ${0}      | ${{ maxExclusive: 10 }}             | ${'maxExclusive'}     | ${'{field} must be less than {max}'}             | ${'10'}                | ${'Text Input must be less than 10'}
    ${'enumeration'}    | ${0}      | ${{ enumeration: ['a', 'b', 'c'] }} | ${'enumeration'}      | ${'{field} must be one of the values'}           | ${'x'}                 | ${'Text Input must be one of the values'}
    ${'whiteSpace'}     | ${0}      | ${{ whiteSpace: 'collapse' }}       | ${'whiteSpace'}       | ${'{field} has invalid whitespace ({mode})'}     | ${'  extra  spaces'}   | ${'Text Input has invalid whitespace (collapse)'}
    ${'fractionDigits'} | ${0}      | ${{ fractionDigits: 2 }}            | ${'fractionDigits'}   | ${'{field} has too many decimals ({digits})'}    | ${'3.141'}             | ${'Text Input has too many decimals (2)'}
    ${'totalDigits'}    | ${0}      | ${{ totalDigits: 3 }}               | ${'totalDigits'}      | ${'{field} has too many digits ({digits})'}      | ${'1234'}              | ${'Text Input has too many digits (3)'}
  `('shows custom settings message with named placeholders for $restriction restriction', async ({ minOccurs, fieldRestriction, messageKey, message, inputValue, expected }: any) => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            fieldOptions: { label: 'Text Input' },
            minOccurs,
            restriction: fieldRestriction,
          }] as any,
          settings: {
            messages: { [messageKey]: message },
          },
        },
      });

      await wrapper.find('input').setValue(inputValue);
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain(expected);
    });

    // Note: ctx.rule.params in generateMessage is always an array for defineRule-based rules,
    // so named placeholders like {length} or {min} cannot be resolved from ctx.rule.params.
    // Use settings.messages for named placeholder support with restriction params (see test above).
    it.each`
    restriction         | minOccurs | fieldRestriction                    | inputValue             | messageTemplate                                  | expected
    ${'required'}       | ${1}      | ${{}}                               | ${''}                  | ${'The {field} field is required'}               | ${'Text Input is required'}
  `('shows configure.generateMessage with named placeholders for $restriction restriction', async ({ minOccurs, fieldRestriction, inputValue, messageTemplate, expected }: any) => {
      configure({
        generateMessage: (ctx) => {
          const params = ctx.rule?.params;
          return (messageTemplate as string).replace(/\{(\w+)\}/g, (match, key) => {
            if (key === 'field')
              return ctx.field;
            if (params && !Array.isArray(params) && key in (params as object))
              return String((params as Record<string, unknown>)[key]);
            return match;
          });
        },
      });

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            fieldOptions: { label: 'Text Input' },
            minOccurs,
            restriction: fieldRestriction,
          }] as any,
          settings: {},
        },
      });

      await wrapper.find('input').setValue(inputValue);
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain(expected);
    });
  });
  describe('custom vee-validate validations', () => {
    afterEach(() => {
      configure({ generateMessage: undefined as any });
    });

    it.each`
      description                      | validation                                                                                           | inputValue              | expected
      ${'function returning a string'} | ${(v: unknown) => String(v ?? '').startsWith('hello') || 'Must start with hello'}                    | ${'world'}              | ${'Must start with hello'}
      ${'function returning false'}    | ${(v: unknown) => String(v ?? '').startsWith('hello') || false}                                      | ${'world'}              | ${'Text Input is invalid'}
      ${'array of functions'}          | ${[(v: unknown) => !!v || 'Required', (v: unknown) => String(v ?? '').length >= 5 || 'Min 5 chars']} | ${'abc'}                | ${'Min 5 chars'}
      ${'string with multiple rules'}  | ${'xsd_minLength:3|xsd_maxLength:10'}                                                                | ${'ab'}                 | ${'Text Input: xsd_minLength'}
      ${'object with multiple rules'}  | ${{ xsd_minLength: 3, xsd_maxLength: 10 }}                                                           | ${'this is way too long'} | ${'Text Input: xsd_maxLength'}
    `('validates correctly using $description', async ({ validation, inputValue, expected }: any) => {
      // Named rules include the rule name in the message; anonymous functions fall back to 'is invalid'
      configure({ generateMessage: ctx => ctx.rule?.name ? `${ctx.field}: ${ctx.rule.name}` : `${ctx.field} is invalid` });

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            fieldOptions: { label: 'Text Input' },
            minOccurs: 0,
            validation,
          }] as any,
          settings: {},
        },
      });

      await wrapper.find('input').setValue(inputValue);
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain(expected);
    });
  });

  describe('computedProps-driven rule rebuild', () => {
    it('validates against a computedProps-swapped restriction once it actually changes', async () => {
      const maxLength = ref(10);

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            fieldOptions: { label: 'Text Input' },
            minOccurs: 0,
            computedProps: [(field) => {
              field.restriction = { maxLength: maxLength.value };
            }],
          }],
          settings: {
            messages: { maxLength: 'Max length of {field} is {length}' },
          },
        },
      });
      await flushPromises();

      // Six characters is valid under the initial maxLength of 10.
      await wrapper.find('input').setValue('123456');
      await flushPromises();
      expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);

      // computedProps swaps the restriction in response to another field's value.
      maxLength.value = 5;
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain('Max length of Text Input is 5');
    });

    it('validates against a restriction mutated in place by computedProps once it actually changes', async () => {
      const maxLength = ref(10);

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            fieldOptions: { label: 'Text Input' },
            minOccurs: 0,
            restriction: { maxLength: 10 },
            computedProps: [(field) => {
              field.restriction!.maxLength = maxLength.value;
            }],
          }],
          settings: {
            messages: { maxLength: 'Max length of {field} is {length}' },
          },
        },
      });
      await flushPromises();

      // Six characters is valid under the initial maxLength of 10.
      await wrapper.find('input').setValue('123456');
      await flushPromises();
      expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);

      // computedProps mutates the restriction object in place rather than assigning a new one.
      maxLength.value = 5;
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain('Max length of Text Input is 5');
    });

    it('validates against a computedProps-swapped validation once it actually changes', async () => {
      const requireHelloPrefix = ref(false);

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            fieldOptions: { label: 'Text Input' },
            minOccurs: 0,
            computedProps: [(field) => {
              field.validation = requireHelloPrefix.value
                ? (v: unknown) => String(v ?? '').startsWith('hello') || 'Must start with hello'
                : undefined;
            }],
          }],
          settings: {},
        },
      });
      await flushPromises();

      await wrapper.find('input').setValue('world');
      await flushPromises();
      expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);

      // computedProps swaps the validation in response to another field's value.
      requireHelloPrefix.value = true;
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain('Must start with hello');
    });
  });

  describe('combined restriction and custom validation', () => {
    it('shows both restriction and custom validation errors', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            fieldOptions: { label: 'Text Input' },
            minOccurs: 0,
            restriction: { minLength: 5 },
            validation: (v: unknown) => String(v ?? '').startsWith('hello') || 'Must start with hello',
          }] as any,
          settings: {
            messages: { minLength: 'Min length of {field} is {length}' },
          },
        },
      });

      // 'ab' fails minLength (< 5) and custom validation
      await wrapper.find('input').setValue('ab');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="errors"]').text()).toContain('Min length of Text Input is 5');

      // 'world' passes minLength (>= 5) but fails custom validation
      await wrapper.find('input').setValue('world');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="errors"]').text()).toContain('Must start with hello');

      // 'hello world' passes both
      await wrapper.find('input').setValue('hello world');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
    });
  });

  describe('validation trigger settings', () => {
    describe('text', () => {
      describe('validateOnBlur', () => {
        it('validates on blur when validateOnBlur is true', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'text',
                type: 'text',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 1,
              }] as any,
              settings: {
                validateOnBlur: true,
                validateOnValueUpdate: false,
                messages: { required: '{field} is required' },
              },
            },
          });

          await wrapper.find('input').trigger('blur');
          await flushPromises();

          expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain('Text Input is required');
        });

        it('does not validate on blur when validateOnBlur is not set', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'text',
                type: 'text',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 1,
              }] as any,
              settings: {
                validateOnValueUpdate: false,
                messages: { required: '{field} is required' },
              },
            },
          });

          await wrapper.find('input').trigger('blur');
          await flushPromises();

          expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
        });
      });

      describe('validateOnValueUpdate', () => {
        it('validates immediately on value change without submit (default: true)', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'text',
                type: 'text',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 0,
                restriction: { minLength: 3 },
              }] as any,
              settings: {
                messages: { minLength: '{field} must be at least {0} characters' },
              },
            },
          });

          // Typing an invalid value should show an error immediately — no submit needed
          await wrapper.find('input').setValue('a');
          await flushPromises();
          expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(true);

          // Fixing the value should immediately clear the error
          await wrapper.find('input').setValue('abc');
          await flushPromises();
          expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
        });

        it('does not validate on value change when validateOnValueUpdate is false', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'text',
                type: 'text',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 0,
                restriction: { minLength: 3 },
              }] as any,
              settings: {
                validateOnValueUpdate: false,
                validateWhenInError: false,
                messages: { minLength: '{field} must be at least {0} characters' },
              },
            },
          });

          // Typing an invalid value should not show an error immediately
          await wrapper.find('input').setValue('a');
          await flushPromises();
          expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);

          // Submit with an invalid value to show the error
          await wrapper.find('input').setValue('a');
          await wrapper.find('[data-testid="submit"]').trigger('click');
          await flushPromises();
          expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(true);

          // Fixing the value should NOT clear the error — re-validation on change is disabled
          await wrapper.find('input').setValue('abc');
          await flushPromises();
          expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(true);

          // Only a new submit should reflect the corrected value
          await wrapper.find('[data-testid="submit"]').trigger('click');
          await flushPromises();
          expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
        });
      });

      describe('validateWhenInError', () => {
        it('does not validate on value change when there is no error yet', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'text',
                type: 'text',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 0,
                restriction: { minLength: 3 },
              }] as any,
              settings: {
                validateOnValueUpdate: false,
                validateWhenInError: true,
                messages: { minLength: '{field} must be at least {0} characters' },
              },
            },
          });

          // Typing invalid value does NOT show an error — no prior error exists yet
          await wrapper.find('input').setValue('a');
          await flushPromises();
          expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
        });

        it('re-validates on value change once an error exists, and clears when fixed', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'text',
                type: 'text',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 0,
                restriction: { minLength: 3 },
              }] as any,
              settings: {
                validateWhenInError: true,
                messages: { minLength: '{field} must be at least {0} characters' },
              },
            },
          });

          // Trigger the first error via submit
          await wrapper.find('input').setValue('a');
          await wrapper.find('[data-testid="submit"]').trigger('click');
          await flushPromises();
          expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(true);

          // Now that an error exists, fixing the value should re-validate and clear the error
          await wrapper.find('input').setValue('abc');
          await flushPromises();
          expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
        });
      });

      describe('validateOnValueUpdateAfterSubmit', () => {
        it('does not validate on value change before the first submit', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'text',
                type: 'text',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 0,
                restriction: { minLength: 3 },
              }] as any,
              settings: {
                validateOnValueUpdateAfterSubmit: true,
                messages: { minLength: '{field} must be at least {0} characters' },
              },
            },
          });

          // Typing an invalid value should NOT show an error — no submit yet
          await wrapper.find('input').setValue('a');
          await flushPromises();
          expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
        });

        it('validates on value change after the first submit', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'text',
                type: 'text',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 0,
                restriction: { minLength: 3 },
              }] as any,
              settings: {
                validateOnValueUpdateAfterSubmit: true,
                messages: { minLength: '{field} must be at least {0} characters' },
              },
            },
          });

          // Submit with an invalid value to trigger the first submit
          await wrapper.find('input').setValue('a');
          await wrapper.find('[data-testid="submit"]').trigger('click');
          await flushPromises();
          expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(true);

          // After the first submit, fixing the value should re-validate and clear the error
          await wrapper.find('input').setValue('abc');
          await flushPromises();
          expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // textBoundByVModel uses v-model to bind value directly instead of handleChange/handleInput.
    // Validation trigger behaviour should be identical to 'text'.
    // ─────────────────────────────────────────────────────────────────────────
    describe('textBoundByVModel', () => {
      describe('validateOnBlur', () => {
        it('validates on blur when validateOnBlur is true', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'textBoundByVModel',
                type: 'textBoundByVModel',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 1,
              }] as any,
              settings: {
                validateOnBlur: true,
                validateOnValueUpdate: false,
                messages: { required: '{field} is required' },
              },
            },
          });

          await wrapper.find('input').trigger('blur');
          await flushPromises();

          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').text()).toContain('Text Input is required');
        });

        it('does not validate on blur when validateOnBlur is not set', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'textBoundByVModel',
                type: 'textBoundByVModel',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 1,
              }] as any,
              settings: {
                validateOnValueUpdate: false,
                messages: { required: '{field} is required' },
              },
            },
          });

          await wrapper.find('input').trigger('blur');
          await flushPromises();

          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').exists()).toBe(false);
        });
      });

      describe('validateOnValueUpdate', () => {
        it('validates immediately on value change without submit (default: true)', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'textBoundByVModel',
                type: 'textBoundByVModel',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 0,
                restriction: { minLength: 3 },
              }] as any,
              settings: {
                messages: { minLength: '{field} must be at least {0} characters' },
              },
            },
          });

          await wrapper.find('input').setValue('a');
          await flushPromises();
          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').exists()).toBe(true);

          await wrapper.find('input').setValue('abc');
          await flushPromises();
          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').exists()).toBe(false);
        });

        it('does not validate on value change when validateOnValueUpdate is false', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'textBoundByVModel',
                type: 'textBoundByVModel',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 0,
                restriction: { minLength: 3 },
              }] as any,
              settings: {
                validateOnValueUpdate: false,
                validateWhenInError: false,
                messages: { minLength: '{field} must be at least {0} characters' },
              },
            },
          });

          await wrapper.find('input').setValue('a');
          await flushPromises();
          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').exists()).toBe(false);

          await wrapper.find('[data-testid="submit"]').trigger('click');
          await flushPromises();
          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').exists()).toBe(true);

          await wrapper.find('input').setValue('abc');
          await flushPromises();
          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').exists()).toBe(true);

          await wrapper.find('[data-testid="submit"]').trigger('click');
          await flushPromises();
          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').exists()).toBe(false);
        });
      });

      describe('validateWhenInError', () => {
        it('does not validate on value change when there is no error yet', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'textBoundByVModel',
                type: 'textBoundByVModel',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 0,
                restriction: { minLength: 3 },
              }] as any,
              settings: {
                validateOnValueUpdate: false,
                validateWhenInError: true,
                messages: { minLength: '{field} must be at least {0} characters' },
              },
            },
          });

          await wrapper.find('input').setValue('a');
          await flushPromises();
          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').exists()).toBe(false);
        });

        it('re-validates on value change once an error exists, and clears when fixed', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'textBoundByVModel',
                type: 'textBoundByVModel',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 0,
                restriction: { minLength: 3 },
              }] as any,
              settings: {
                validateWhenInError: true,
                messages: { minLength: '{field} must be at least {0} characters' },
              },
            },
          });

          await wrapper.find('input').setValue('a');
          await wrapper.find('[data-testid="submit"]').trigger('click');
          await flushPromises();
          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').exists()).toBe(true);

          await wrapper.find('input').setValue('abc');
          await flushPromises();
          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').exists()).toBe(false);
        });
      });

      describe('validateOnValueUpdateAfterSubmit', () => {
        it('does not validate on value change before the first submit', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'textBoundByVModel',
                type: 'textBoundByVModel',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 0,
                restriction: { minLength: 3 },
              }] as any,
              settings: {
                validateOnValueUpdateAfterSubmit: true,
                messages: { minLength: '{field} must be at least {0} characters' },
              },
            },
          });

          await wrapper.find('input').setValue('a');
          await flushPromises();
          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').exists()).toBe(false);
        });

        it('validates on value change after the first submit', async () => {
          const wrapper = mount(TestForm, {
            attachTo: document.body,
            props: {
              metadata: [{
                name: 'textBoundByVModel',
                type: 'textBoundByVModel',
                fieldOptions: { label: 'Text Input' },
                minOccurs: 0,
                restriction: { minLength: 3 },
              }] as any,
              settings: {
                validateOnValueUpdateAfterSubmit: true,
                messages: { minLength: '{field} must be at least {0} characters' },
              },
            },
          });

          await wrapper.find('input').setValue('a');
          await wrapper.find('[data-testid="submit"]').trigger('click');
          await flushPromises();
          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').exists()).toBe(true);

          await wrapper.find('input').setValue('abc');
          await flushPromises();
          expect(wrapper.find('[data-testid="textBoundByVModel-error-message"]').exists()).toBe(false);
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // select uses @change="handleChange" — validation is driven by the value
    // watcher in DynamicFormItem, not by handleChange itself.
    // ─────────────────────────────────────────────────────────────────────────
    describe('select', () => {
      function mountSelect(settings = {}) {
        return mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'select',
              type: 'select',
              fieldOptions: { label: 'Select Input' },
              minOccurs: 1,
              options: [
                { key: 'a', value: 'Option A' },
                { key: 'b', value: 'Option B' },
              ],
            }] as any,
            settings: { messages: { required: '{field} is required' }, ...settings },
          },
        });
      }

      it('shows required error on submit when no option is selected', async () => {
        const wrapper = mountSelect();

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[data-testid="select-error-message"]').text()).toContain('Select Input is required');
      });

      it('clears required error when an option is selected', async () => {
        const wrapper = mountSelect();

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="select-error-message"]').exists()).toBe(true);

        await wrapper.find('select').setValue('a');
        await flushPromises();
        expect(wrapper.find('[data-testid="select-error-message"]').exists()).toBe(false);
      });

      it('validates on blur when validateOnBlur is true', async () => {
        const wrapper = mountSelect({ validateOnBlur: true, validateOnValueUpdate: false });

        await wrapper.find('select').trigger('blur');
        await flushPromises();

        expect(wrapper.find('[data-testid="select-error-message"]').text()).toContain('Select Input is required');
      });

      it('does not validate on blur when validateOnBlur is not set', async () => {
        const wrapper = mountSelect({ validateOnValueUpdate: false });

        await wrapper.find('select').trigger('blur');
        await flushPromises();

        expect(wrapper.find('[data-testid="select-error-message"]').exists()).toBe(false);
      });

      it('validates immediately on value change (default: validateOnValueUpdate=true)', async () => {
        const wrapper = mountSelect();

        // No error before any interaction
        expect(wrapper.find('[data-testid="select-error-message"]').exists()).toBe(false);

        // After submit the error appears
        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="select-error-message"]').exists()).toBe(true);

        // Selecting a valid option immediately clears the error
        await wrapper.find('select').setValue('a');
        await flushPromises();
        expect(wrapper.find('[data-testid="select-error-message"]').exists()).toBe(false);
      });

      it('does not validate on value change when validateOnValueUpdate is false', async () => {
        const wrapper = mountSelect({ validateOnValueUpdate: false, validateWhenInError: false });

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="select-error-message"]').exists()).toBe(true);

        // Selecting a valid option does NOT clear the error — re-validation on change is disabled
        await wrapper.find('select').setValue('a');
        await flushPromises();
        expect(wrapper.find('[data-testid="select-error-message"]').exists()).toBe(true);

        // Only a new submit clears it
        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="select-error-message"]').exists()).toBe(false);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // checkbox uses @change="handleChange" — same validation trigger mechanics
    // as select. Note: vee-validate's `required` passes for `false`, so the
    // initial `undefined` (not yet interacted with) is what triggers the error.
    // ─────────────────────────────────────────────────────────────────────────
    describe('checkbox', () => {
      function mountCheckbox(settings = {}) {
        return mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'checkbox',
              type: 'checkbox',
              fieldOptions: { label: 'Checkbox Input' },
              minOccurs: 1,
            }] as any,
            settings: { messages: { required: '{field} is required' }, ...settings },
          },
        });
      }

      it('shows required error on submit when not interacted with', async () => {
        const wrapper = mountCheckbox();

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[data-testid="checkbox-error-message"]').text()).toContain('Checkbox Input is required');
      });

      it('clears required error when the checkbox is checked', async () => {
        const wrapper = mountCheckbox();

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="checkbox-error-message"]').exists()).toBe(true);

        await wrapper.find('input[type="checkbox"]').setValue(true);
        await flushPromises();
        expect(wrapper.find('[data-testid="checkbox-error-message"]').exists()).toBe(false);
      });

      it('validates on blur when validateOnBlur is true', async () => {
        const wrapper = mountCheckbox({ validateOnBlur: true, validateOnValueUpdate: false });

        await wrapper.find('input[type="checkbox"]').trigger('blur');
        await flushPromises();

        expect(wrapper.find('[data-testid="checkbox-error-message"]').text()).toContain('Checkbox Input is required');
      });

      it('does not validate on blur when validateOnBlur is not set', async () => {
        const wrapper = mountCheckbox({ validateOnValueUpdate: false });

        await wrapper.find('input[type="checkbox"]').trigger('blur');
        await flushPromises();

        expect(wrapper.find('[data-testid="checkbox-error-message"]').exists()).toBe(false);
      });

      it('does not validate on value change when validateOnValueUpdate is false', async () => {
        const wrapper = mountCheckbox({ validateOnValueUpdate: false, validateWhenInError: false });

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="checkbox-error-message"]').exists()).toBe(true);

        // Checking the box does NOT clear the error — re-validation on change is disabled
        await wrapper.find('input[type="checkbox"]').setValue(true);
        await flushPromises();
        expect(wrapper.find('[data-testid="checkbox-error-message"]').exists()).toBe(true);

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="checkbox-error-message"]').exists()).toBe(false);
      });
    });
  });

  describe('attribute validation', () => {
    it('does not validate a required attribute when the main field has no value', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            minOccurs: 0,
            attributes: [{ name: 'lang', type: 'text', minOccurs: 1 }],
          }] as any,
          settings: { messages: { required: '{field} is required' } },
        },
      });
      await flushPromises();

      // Submit with nothing filled in — attribute is not rendered so its validation never runs
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="text.lang-error-message"]').exists()).toBe(false);
    });

    it('validates a required attribute once the main field has a value', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            minOccurs: 0,
            attributes: [{ name: 'lang', type: 'text', minOccurs: 1, fieldOptions: { label: 'Language' } }],
          }] as any,
          settings: { messages: { required: '{field} is required' } },
        },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();

      // Attribute is now visible — submitting without a value should trigger the required rule
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="text.lang-error-message"]').text()).toContain('Language is required');
    });

    it('validates attribute restriction rules when the attribute is visible', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            minOccurs: 0,
            attributes: [{
              name: 'lang',
              type: 'text',
              minOccurs: 0,
              fieldOptions: { label: 'Language' },
              restriction: { minLength: 2 },
            }],
          }] as any,
          settings: { messages: { minLength: '{field} must be at least {0} characters' } },
        },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();

      await wrapper.find('#text\\.lang').setValue('x');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="text.lang-error-message"]').text()).toContain('Language must be at least 2 characters');
    });

    it('clears the attribute error after the main field value is removed', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            minOccurs: 0,
            attributes: [{ name: 'lang', type: 'text', minOccurs: 1, fieldOptions: { label: 'Language' } }],
          }] as any,
          settings: { messages: { required: '{field} is required' } },
        },
      });
      await flushPromises();

      // Trigger the attribute validation error
      await wrapper.find('#text').setValue('hello');
      await flushPromises();
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="text.lang-error-message"]').exists()).toBe(true);

      // Clearing the main field unmounts the attribute — its error disappears with it
      await wrapper.find('#text').setValue('');
      await flushPromises();

      expect(wrapper.find('[data-testid="text.lang-error-message"]').exists()).toBe(false);
    });
  });

  describe('resetForm', () => {
    const metadata = [{
      name: 'text',
      type: 'text',
      minOccurs: 1,
      fieldOptions: { label: 'Text Input' },
    }] as any;

    it('does not show validation errors after resetForm', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata,
          settings: { messages: { required: '{field} is required' } },
        },
      });

      await wrapper.find('input').setValue('hello');
      await flushPromises();

      await wrapper.find('[data-testid="reset"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="errors"]').exists()).toBe(false);
    });

    it('still validates value changes after a reset', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata,
          settings: { messages: { required: '{field} is required' } },
        },
      });

      await wrapper.find('input').setValue('hello');
      await flushPromises();
      await wrapper.find('[data-testid="reset"]').trigger('click');
      await flushPromises();

      // Entering and clearing a value again must re-trigger the required error.
      await wrapper.find('input').setValue('world');
      await wrapper.find('input').setValue('');
      await flushPromises();

      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain('Text Input is required');
    });

    it('restores non-empty initial values without showing validation errors', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata,
          initialValues: { text: 'initial' },
          settings: { messages: { required: '{field} is required' } },
        },
      });
      await flushPromises();

      // Clearing the initial value triggers the required error
      await wrapper.find('input').setValue('');
      await flushPromises();
      expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(true);

      await wrapper.find('[data-testid="reset"]').trigger('click');
      await flushPromises();

      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('initial');
      expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="errors"]').exists()).toBe(false);
    });

    it('does not show validation errors after resetField', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          // maxLength makes a non-empty value invalid, so the reset actually changes
          // the value (invalid text back to undefined) while an error is showing
          metadata: [{
            name: 'text',
            type: 'text',
            minOccurs: 1,
            restriction: { maxLength: 3 },
            fieldOptions: { label: 'Text Input' },
          }] as any,
          settings: { messages: { required: '{field} is required', maxLength: 'Max length of {field} is {length}' } },
        },
      });

      await wrapper.find('input').setValue('too long');
      await flushPromises();
      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain('Max length of Text Input is 3');

      await wrapper.find('[data-testid="resetField"]').trigger('click');
      await flushPromises();

      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
      expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="errors"]').exists()).toBe(false);
    });

    it('keeps errors passed explicitly to resetForm', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata,
          settings: { messages: { required: '{field} is required' } },
        },
      });

      await wrapper.find('input').setValue('hello');
      await flushPromises();

      (wrapper.vm as any).$.setupState.resetForm({ errors: { text: 'Explicit error' } });
      await flushPromises();

      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain('Explicit error');
    });
  });

  describe('setFieldValue', () => {
    // maxLength makes the written value itself invalid, so any validation run on the
    // write is directly observable as an error message.
    const metadata = [{
      name: 'text',
      type: 'text',
      minOccurs: 1,
      restriction: { maxLength: 3 },
      fieldOptions: { label: 'Text Input' },
    }] as any;
    const settings = { messages: { required: '{field} is required', maxLength: 'Max length of {field} is {length}' } };

    it('validates the written value by default', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, settings },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setFieldValue('text', 'too long');
      await flushPromises();

      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('too long');
      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain('Max length of Text Input is 3');
    });

    it('does not validate when called with shouldValidate: false', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, settings },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setFieldValue('text', 'too long', false);
      await flushPromises();

      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('too long');
      expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="errors"]').exists()).toBe(false);
    });

    it('still validates user input after a write with shouldValidate: false', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, settings },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setFieldValue('text', 'too long', false);
      await flushPromises();

      await wrapper.find('input').setValue('also too long');
      await flushPromises();

      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain('Max length of Text Input is 3');
    });

    it('does not validate setValues called with shouldValidate: false', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, settings },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setValues({ text: 'too long' }, false);
      await flushPromises();

      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('too long');
      expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="errors"]').exists()).toBe(false);
    });
  });

  describe('live form-level meta.valid for group/array shapes', () => {
    function formMetaValid(wrapper: ReturnType<typeof mount>): boolean {
      return (wrapper.vm as any).$.setupState.meta.valid;
    }

    it('a cross-field validation container flips the form-level meta.valid back to false on a fill-then-clear, with no submit', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            type: 'heading',
            minOccurs: 0,
            validation: (value: unknown) => !!(value as { firstName?: string })?.firstName || 'First name required',
            children: [{ name: 'firstName', type: 'text', minOccurs: 0 }],
          }] as any,
        },
      });
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(false);

      await wrapper.find('#person\\.firstName').setValue('Ada');
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(true);

      await wrapper.find('#person\\.firstName').setValue('');
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(false);
    });

    it('a group whose computedProps swaps a cross-field validation stays live against both the swap and a child fill, with no submit', async () => {
      const requireFirstName = ref(true);
      const validateRequireFirstName = (value: unknown) => !!(value as { firstName?: string })?.firstName || 'First name required';
      const validateAlwaysPasses = () => true;

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            type: 'heading',
            minOccurs: 0,
            computedProps: [(field) => {
              field.validation = requireFirstName.value ? validateRequireFirstName : validateAlwaysPasses;
            }],
            children: [{ name: 'firstName', type: 'text', minOccurs: 0 }],
          }],
        },
      });
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(false);

      // Fill under the currently active swapped validation: exercises the subtree watcher.
      await wrapper.find('#person\\.firstName').setValue('Ada');
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(true);

      // Swap the active validation with the value unchanged: exercises the guarded rule rebuild.
      requireFirstName.value = false;
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(true);

      await wrapper.find('#person\\.firstName').setValue('');
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(true);

      // Swap back while empty, then fill again: both mechanisms acting together.
      requireFirstName.value = true;
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(false);

      await wrapper.find('#person\\.firstName').setValue('Ada');
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(true);
    });

    it('a required array flips the form-level meta.valid back to false once cleared below minOccurs, with no submit', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            type: 'text',
            minOccurs: 1,
            maxOccurs: 3,
          }] as any,
        },
      });
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(false);

      await wrapper.find('input[id="items[0]"]').setValue('first');
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(true);

      await wrapper.find('input[id="items[0]"]').setValue('');
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(false);
    });

    it('a plain-required group with only optional children stays meta.valid: true after a touch-then-clear, by design: xsd_required passes any object', async () => {
      // Pinned so a future reader does not mistake this for a regression: a container's own
      // xsd_required check is `value !== null && value !== undefined && value !== ''`, which any
      // object satisfies, including one whose only child is undefined or absent.
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            type: 'heading',
            children: [{ name: 'firstName', type: 'text', minOccurs: 0 }],
          }] as any,
        },
      });
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(true);

      await wrapper.find('#person\\.firstName').setValue('Ada');
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(true);

      await wrapper.find('#person\\.firstName').setValue('');
      await flushPromises();
      expect(formMetaValid(wrapper)).toBe(true);
    });
  });

  describe('a leaf field needs no dedicated live-validity watcher', () => {
    it('a filled leaf\'s own meta.valid, and the form-level aggregate, go live immediately regardless of validateOnValueUpdate', async () => {
      // DynamicFormItem hardcodes vee-validate's own validateOnValueUpdate option to false on every
      // useField call ("validation timing is owned by this component") and its handleChange
      // override always calls the original handler with shouldValidate effectively false. vee-
      // validate's own setValue still runs a silent validate in that case (it never skips
      // validating outright), so a leaf's own meta.valid is live independent of the
      // settings.validateOnValueUpdate value: only the VISIBLE error message is actually deferred
      // to submit, which is the pre-existing, separately covered behaviour ("does not validate on
      // value change when validateOnValueUpdate is false" above).
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            minOccurs: 1,
            fieldOptions: { label: 'Text Input' },
          }] as any,
          settings: { validateOnValueUpdate: false, messages: { required: '{field} is required' } },
        },
      });
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.valid).toBe(false);

      await wrapper.find('input').setValue('filled in');
      await flushPromises();

      expect((wrapper.vm as any).$.setupState.meta.valid).toBe(true);
      // No submit was needed to get there, and the visible error stays deferred regardless.
      expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
    });
  });
});
