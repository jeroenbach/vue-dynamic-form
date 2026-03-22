import { flushPromises, mount } from '@vue/test-utils';
import { configure } from 'vee-validate';
import { afterEach, describe, expect, it } from 'vitest';
import TestForm from '@/examples/TestForm.vue';

describe('component DynamicForm', () => {
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

      expect(wrapper.find('[data-testid="errors"]').text()).toContain(expected);
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
          settings: {},
        },
      });

      await wrapper.find('input').setValue(inputValue);
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="errors"]').text()).toContain(expected);
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

      expect(wrapper.find('[data-testid="errors"]').text()).toContain(expected);
    });

    // Note: ctx.rule.params in generateMessage is always an array for defineRule-based rules,
    // so named placeholders like {length} or {min} cannot be resolved from ctx.rule.params.
    // Use settings.messages for named placeholder support with restriction params (see test above).
    it.each`
    restriction         | minOccurs | fieldRestriction                    | inputValue             | messageTemplate                                  | expected
    ${'required'}       | ${1}      | ${{}}                               | ${''}                  | ${'The {field} field is required'}               | ${'The Text Input field is required'}
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

      expect(wrapper.find('[data-testid="errors"]').text()).toContain(expected);
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

      expect(wrapper.find('[data-testid="errors"]').text()).toContain(expected);
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

      expect(wrapper.find('[data-testid="errors"]').exists()).toBe(false);
    });
  });
});
