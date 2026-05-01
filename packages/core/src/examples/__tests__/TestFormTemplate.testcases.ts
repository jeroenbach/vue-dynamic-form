import type { GenericObject } from 'vee-validate';
import type { Metadata } from '@/examples/TestFormTemplate.vue';

import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import { defineComponent, h, markRaw } from 'vue';
import TestForm from '@/examples/TestForm.vue';

export const defaultTestCase = createTestCase([{
  name: 'text',
  type: 'text',
  fieldOptions: { label: 'Text Input' },
  path: 'with.custom.structure',
  restriction: { maxLength: 10 },
}]);

export const arrayTestCase = createTestCase([{
  fieldOptions: { label: 'Array Fields' },
  type: 'heading',
  children: [
    { fieldOptions: { label: 'Optional field (max 3)' }, minOccurs: 0, maxOccurs: 3 },
    { fieldOptions: { label: 'Required field (max 3)' }, maxOccurs: 3 },
    { fieldOptions: { label: '2 Fields required' }, minOccurs: 2, maxOccurs: 4 },
    { fieldOptions: { label: 'Section (2 sections required)' }, type: 'heading', minOccurs: 2, maxOccurs: 4, fullWidth: true, children: [
      { fieldOptions: { label: 'Nested field 1' } },
      { fieldOptions: { label: 'Required Nested field 2' }, type: 'select', options: [
        { key: 'option1', value: 'Option 1' },
        { key: 'option2', value: 'Option 2' },
        { key: 'option3', value: 'Option 3' },
      ] },
      { fieldOptions: { label: 'Nested field 3' }, type: 'checkbox' },
    ] },
  ],
}]);

export const groupTestCase = createTestCase([{
  fieldOptions: { label: 'Grouped Fields' },
  type: 'heading',
  children: [
    { fieldOptions: { label: 'Required group' }, type: 'group', children: [
      { fieldOptions: { label: 'Required Nested field 1' }, fullWidth: true },
      { fieldOptions: { label: 'Required Nested field 2' }, fullWidth: true },
    ] },
    { fieldOptions: { label: 'Optional group' }, type: 'group', minOccurs: 0, description: `The group is optional, therefore the children will only be required once 1 value is filled in.
      
You can test it by filling in one of the fields.`, children: [
      { fieldOptions: { label: 'Required Nested field 1' }, fullWidth: true },
      { fieldOptions: { label: 'Required Nested field 2' }, fullWidth: true },
    ] },
  ],
}, {
  fieldOptions: { label: 'Grouped Array Fields' },
  type: 'heading',
  children: [
    { fieldOptions: { label: 'Required group' }, type: 'group', maxOccurs: 5, fullWidth: true, children: [
      { fieldOptions: { label: 'Required Nested field 1' } },
      { fieldOptions: { label: 'Required Nested field 2' } },
    ] },
    { fieldOptions: { label: 'Optional group' }, type: 'group', minOccurs: 0, maxOccurs: 5, fullWidth: true, children: [
      { fieldOptions: { label: 'Required Nested field 1' } },
      { fieldOptions: { label: 'Required Nested field 2' } },
    ] },
  ],
}]);

export const choiceTestCase = createTestCase([
  {
    fieldOptions: { label: 'Choice Fields (minOccurs 1, maxOccurs 1)' },
    type: 'heading',
    children: [
      { fieldOptions: { label: 'Simple Choice Field' }, fullWidth: true, description: `In a choice field, only 1 of the fields can be filled in.`, choice: [
        { fieldOptions: { label: 'Nested Field 1' } },
        { fieldOptions: { label: 'Nested Field 2' } },
      ] },
    ],
  },
  {
    fieldOptions: { label: 'Choice Grouped Fields (minOccurs 1, maxOccurs 3)' },
    type: 'heading',
    children: [
      { fieldOptions: { label: 'Array Choice Field' }, type: 'group', maxOccurs: 3, fullWidth: true, description: `In a choice field, only 1 of the fields can be filled in.`, choice: [
        { fieldOptions: { label: 'Nested Field 1' }, type: 'group', children: [
          { fieldOptions: { label: 'Nested Child Field 1' }, fullWidth: true },
          { fieldOptions: { label: 'Nested Child Field 2' }, fullWidth: true },
        ] },
        { fieldOptions: { label: 'Nested Field 2' }, type: 'group', children: [
          { fieldOptions: { label: 'Nested Child Field 1' }, fullWidth: true },
          { fieldOptions: { label: 'Nested Child Field 2' }, fullWidth: true },
        ] },
      ] },
    ],
  },
  {
    fieldOptions: { label: 'Choice Array Fields (minOccurs 1, maxOccurs 3)' },
    type: 'heading',
    children: [
      { fieldOptions: { label: 'Array Choice Field' }, type: 'group', maxOccurs: 3, fullWidth: true, description: `In a choice field, only 1 of the fields can be filled in.`, choice: [
        { fieldOptions: { label: 'Nested Field 1' }, maxOccurs: 3 },
        { fieldOptions: { label: 'Nested Field 2' }, maxOccurs: 3 },
      ] },
    ],
  },
]);

export const childFieldsTestCase = createTestCase([
  {
    fieldOptions: { label: 'Personal Info' },
    type: 'heading',
    name: 'person',
    description: 'Only showing the fields that have a value. Click edit to change.',
    fullWidth: true,
    children: [
      { name: 'firstName', fieldOptions: { label: 'First Name' } },
      { name: 'lastName', fieldOptions: { label: 'Last Name' } },
      { name: 'email', fieldOptions: { label: 'Email' } },
    ],
  },
  {
    fieldOptions: { label: 'Address' },
    type: 'heading',
    name: 'address',
    fullWidth: true,
    children: [
      { name: 'street', fieldOptions: { label: 'Street' }, minOccurs: 0 },
      { name: 'city', fieldOptions: { label: 'City' }, minOccurs: 0 },
      { name: 'country', fieldOptions: { label: 'Country' }, minOccurs: 0 },
    ],
  },
], undefined, {
  initialEdit: false,
  hideFieldsWithoutValue: true,
  initialValues: {
    person: {
      firstName: 'Jack',
      lastName: 'Smit',
    },
  },
});

export const individualTestCase = createTestCase(
  [{
    name: 'items',
    type: 'text',
    fieldOptions: { label: 'Items' },
    maxOccurs: 3,
    attributes: [{ name: 'lang', type: 'text', minOccurs: 0 }],
  }],
  {
    // validateOnValueUpdate: false,
    // validateOnValueUpdateAfterSubmit: false,
    // validateWhenInError: true,
    // validateOnBlur: true,
  },
);

export function createTestCase(
  metadata: Metadata[],
  settings?: DynamicFormSettings,
  testCaseConfig: {
    initialEdit?: boolean
    hideFieldsWithoutValue?: boolean
    initialValues?: GenericObject
  } = {},
) {
  return markRaw(defineComponent({
    render: () => h(TestForm, { ...testCaseConfig, metadata, settings, showDebugState: true }),
  }));
}
