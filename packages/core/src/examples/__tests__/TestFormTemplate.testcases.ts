import type { GenericObject } from 'vee-validate';
import type { PropType } from 'vue';
import type { DynamicFormSettings, Metadata } from '@/examples/TestFormTemplate.vue';

import { defineComponent, h, markRaw } from 'vue';
import TestForm from '@/examples/TestForm.vue';

export const defaultTestCase = createTestCase([{
  name: 'text',
  type: 'text',
  fieldOptions: { label: 'Text Input' },
  path: 'with.custom.structure',
  restriction: { maxLength: 10 },
}]);

export const defaultSampleValues = {
  with: { custom: { structure: 'Order A204' } },
};

export const arrayTestCase = createTestCase([{
  name: 'arrays',
  fieldOptions: { label: 'Array Fields' },
  type: 'heading',
  children: [
    { name: 'optionalItems', fieldOptions: { label: 'Optional field (max 3)' }, minOccurs: 0, maxOccurs: 3 },
    { name: 'requiredItems', fieldOptions: { label: 'Required field (max 3)' }, maxOccurs: 3 },
    { name: 'twoRequired', fieldOptions: { label: '2 Fields required' }, minOccurs: 2, maxOccurs: 4 },
    { name: 'sections', fieldOptions: { label: 'Section (2 sections required)' }, type: 'heading', minOccurs: 2, maxOccurs: 4, fullWidth: true, children: [
      { name: 'note', fieldOptions: { label: 'Nested field 1' } },
      { name: 'category', fieldOptions: { label: 'Required Nested field 2' }, type: 'select', options: [
        { key: 'option1', value: 'Option 1' },
        { key: 'option2', value: 'Option 2' },
        { key: 'option3', value: 'Option 3' },
      ] },
      { name: 'flag', fieldOptions: { label: 'Nested field 3' }, type: 'checkbox' },
    ] },
  ],
}]);

export const arraySampleValues = {
  arrays: {
    optionalItems: ['First note'],
    requiredItems: ['Alpha', 'Beta'],
    twoRequired: ['One', 'Two'],
    sections: [
      { note: 'Section one', category: 'option2', flag: true },
      { note: 'Section two', category: 'option1', flag: false },
    ],
  },
};

export const groupTestCase = createTestCase([{
  name: 'groups',
  fieldOptions: { label: 'Grouped Fields' },
  type: 'heading',
  children: [
    { name: 'requiredGroup', fieldOptions: { label: 'Required group' }, type: 'group', children: [
      { name: 'first', fieldOptions: { label: 'Required Nested field 1' }, fullWidth: true },
      { name: 'second', fieldOptions: { label: 'Required Nested field 2' }, fullWidth: true },
    ] },
    { name: 'optionalGroup', fieldOptions: { label: 'Optional group' }, type: 'group', minOccurs: 0, description: `The group is optional, therefore the children will only be required once 1 value is filled in.

You can test it by filling in one of the fields.`, children: [
      { name: 'first', fieldOptions: { label: 'Required Nested field 1' }, fullWidth: true },
      { name: 'second', fieldOptions: { label: 'Required Nested field 2' }, fullWidth: true },
    ] },
  ],
}, {
  name: 'groupArrays',
  fieldOptions: { label: 'Grouped Array Fields' },
  type: 'heading',
  children: [
    { name: 'requiredGroups', fieldOptions: { label: 'Required group' }, type: 'group', maxOccurs: 5, fullWidth: true, children: [
      { name: 'first', fieldOptions: { label: 'Required Nested field 1' } },
      { name: 'second', fieldOptions: { label: 'Required Nested field 2' } },
    ] },
    { name: 'optionalGroups', fieldOptions: { label: 'Optional group' }, type: 'group', minOccurs: 0, maxOccurs: 5, fullWidth: true, children: [
      { name: 'first', fieldOptions: { label: 'Required Nested field 1' } },
      { name: 'second', fieldOptions: { label: 'Required Nested field 2' } },
    ] },
  ],
}]);

export const groupSampleValues = {
  groups: {
    requiredGroup: { first: 'Ada', second: 'Lovelace' },
    optionalGroup: { first: 'Grace', second: 'Hopper' },
  },
  groupArrays: {
    requiredGroups: [
      { first: 'Alan', second: 'Turing' },
      { first: 'Edsger', second: 'Dijkstra' },
    ],
    optionalGroups: [
      { first: 'Barbara', second: 'Liskov' },
    ],
  },
};

export const choiceTestCase = createTestCase([
  {
    name: 'simpleChoiceSection',
    fieldOptions: { label: 'Choice Fields (minOccurs 1, maxOccurs 1)' },
    type: 'heading',
    children: [
      { name: 'contactMethod', fieldOptions: { label: 'Simple Choice Field' }, fullWidth: true, description: `In a choice field, only 1 of the fields can be filled in.`, choice: [
        { name: 'primary', fieldOptions: { label: 'Nested Field 1' } },
        { name: 'secondary', fieldOptions: { label: 'Nested Field 2' } },
      ] },
    ],
  },
  {
    name: 'groupedChoiceSection',
    fieldOptions: { label: 'Choice Grouped Fields (minOccurs 1, maxOccurs 3)' },
    type: 'heading',
    children: [
      { name: 'pick', fieldOptions: { label: 'Array Choice Field' }, type: 'group', maxOccurs: 3, fullWidth: true, description: `In a choice field, only 1 of the fields can be filled in.`, choice: [
        { name: 'optionA', fieldOptions: { label: 'Nested Field 1' }, type: 'group', children: [
          { name: 'detail1', fieldOptions: { label: 'Nested Child Field 1' }, fullWidth: true },
          { name: 'detail2', fieldOptions: { label: 'Nested Child Field 2' }, fullWidth: true },
        ] },
        { name: 'optionB', fieldOptions: { label: 'Nested Field 2' }, type: 'group', children: [
          { name: 'detail1', fieldOptions: { label: 'Nested Child Field 1' }, fullWidth: true },
          { name: 'detail2', fieldOptions: { label: 'Nested Child Field 2' }, fullWidth: true },
        ] },
      ] },
    ],
  },
  {
    name: 'arrayChoiceSection',
    fieldOptions: { label: 'Choice Array Fields (minOccurs 1, maxOccurs 3)' },
    type: 'heading',
    children: [
      { name: 'pick', fieldOptions: { label: 'Array Choice Field' }, type: 'group', maxOccurs: 3, fullWidth: true, description: `In a choice field, only 1 of the fields can be filled in.`, choice: [
        { name: 'optionA', fieldOptions: { label: 'Nested Field 1' }, maxOccurs: 3 },
        { name: 'optionB', fieldOptions: { label: 'Nested Field 2' }, maxOccurs: 3 },
      ] },
    ],
  },
]);

export const choiceSampleValues = {
  // Only one branch per choice carries a value, honouring the mutually exclusive rule.
  simpleChoiceSection: { contactMethod: { primary: 'Picked the first branch' } },
  groupedChoiceSection: {
    pick: { optionA: [{ detail1: 'Group A, item 1a', detail2: 'Group A, item 1b' }] },
  },
  arrayChoiceSection: {
    pick: { optionA: ['First entry', 'Second entry'] },
  },
};

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

export const childFieldsSampleValues = {
  person: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
  },
  address: {
    street: 'Baker Street 221B',
    city: 'London',
    country: 'United Kingdom',
  },
};

export const inputTypesTestCase = createTestCase([
  {
    name: 'inputs',
    fieldOptions: { label: 'All Input Types' },
    type: 'heading',
    description: 'Every dedicated input slot plus the default fallback, in both handleChange and v-model binding styles.',
    children: [
      { name: 'text', type: 'text', fieldOptions: { label: 'Text' } },
      { name: 'textBoundByVModel', type: 'textBoundByVModel', fieldOptions: { label: 'Text (v-model)' } },
      { name: 'select', type: 'select', fieldOptions: { label: 'Select' }, options: [
        { key: 'option1', value: 'Option 1' },
        { key: 'option2', value: 'Option 2' },
        { key: 'option3', value: 'Option 3' },
      ] },
      { name: 'selectBoundByVModel', type: 'selectBoundByVModel', fieldOptions: { label: 'Select (v-model)' }, options: [
        { key: 'option1', value: 'Option 1' },
        { key: 'option2', value: 'Option 2' },
        { key: 'option3', value: 'Option 3' },
      ] },
      { name: 'checkbox', type: 'checkbox', minOccurs: 0, fieldOptions: { label: 'Checkbox' } },
      { name: 'checkboxBoundByVModel', type: 'checkboxBoundByVModel', minOccurs: 0, fieldOptions: { label: 'Checkbox (v-model)' } },
      { name: 'noType', fieldOptions: { label: 'No type (default-input fallback)' } },
    ],
  },
  {
    name: 'staticProps',
    fieldOptions: { label: 'Static Field Props' },
    type: 'heading',
    description: 'One field here has hidden: true and should not render at all.',
    children: [
      { name: 'optionalField', minOccurs: 0, fieldOptions: { label: 'Optional field (minOccurs 0)' } },
      { name: 'disabledField', minOccurs: 0, disabled: true, fieldOptions: { label: 'Disabled field' } },
      { name: 'hiddenField', minOccurs: 0, hidden: true, fieldOptions: { label: 'Hidden field (should not be visible)' } },
      { name: 'fullWidthField', minOccurs: 0, fullWidth: true, fieldOptions: { label: 'Full width field' } },
      { name: 'describedField', minOccurs: 0, description: 'A per-field description rendered below the input.', fieldOptions: { label: 'Field with description' } },
    ],
  },
]);

export const inputTypesSampleValues = {
  inputs: {
    text: 'Hello world',
    textBoundByVModel: 'Two-way bound',
    select: 'option2',
    selectBoundByVModel: 'option3',
    checkbox: true,
    checkboxBoundByVModel: false,
    noType: 'Fallback input',
  },
  staticProps: {
    optionalField: 'Filled optional',
    disabledField: 'Preset while disabled',
    fullWidthField: 'Spans the full width',
    describedField: 'Described value',
  },
};

export const restrictionsTestCase = createTestCase([
  {
    name: 'strings',
    fieldOptions: { label: 'String Restrictions' },
    type: 'heading',
    description: 'All fields are optional so only the restriction errors surface.',
    children: [
      { name: 'minLength', minOccurs: 0, restriction: { minLength: 3 }, fieldOptions: { label: 'minLength 3' } },
      { name: 'maxLength', minOccurs: 0, restriction: { maxLength: 5 }, fieldOptions: { label: 'maxLength 5' } },
      { name: 'length', minOccurs: 0, restriction: { length: 4 }, fieldOptions: { label: 'length 4 (exact)' } },
      { name: 'pattern', minOccurs: 0, restriction: { pattern: '^[A-Z]{2}-\\d{3}$' }, description: 'Two uppercase letters, a dash, three digits (e.g. AB-123).', fieldOptions: { label: 'pattern' } },
      { name: 'enumeration', minOccurs: 0, restriction: { enumeration: ['red', 'green', 'blue'] }, description: 'Only red, green or blue are allowed.', fieldOptions: { label: 'enumeration' } },
      { name: 'whiteSpace', minOccurs: 0, restriction: { whiteSpace: 'collapse' }, description: 'Leading, trailing or double spaces are invalid.', fieldOptions: { label: 'whiteSpace collapse' } },
    ],
  },
  {
    name: 'numbers',
    fieldOptions: { label: 'Numeric Restrictions' },
    type: 'heading',
    children: [
      { name: 'minInclusive', minOccurs: 0, restriction: { minInclusive: 5 }, fieldOptions: { label: 'minInclusive 5 (value >= 5)' } },
      { name: 'maxInclusive', minOccurs: 0, restriction: { maxInclusive: 10 }, fieldOptions: { label: 'maxInclusive 10 (value <= 10)' } },
      { name: 'minExclusive', minOccurs: 0, restriction: { minExclusive: 0 }, fieldOptions: { label: 'minExclusive 0 (value > 0)' } },
      { name: 'maxExclusive', minOccurs: 0, restriction: { maxExclusive: 100 }, fieldOptions: { label: 'maxExclusive 100 (value < 100)' } },
      { name: 'fractionDigits', minOccurs: 0, restriction: { fractionDigits: 2 }, fieldOptions: { label: 'fractionDigits 2 (max 2 decimals)' } },
      { name: 'totalDigits', minOccurs: 0, restriction: { totalDigits: 5 }, fieldOptions: { label: 'totalDigits 5' } },
    ],
  },
  {
    name: 'mixed',
    fieldOptions: { label: 'Combined & Custom' },
    type: 'heading',
    children: [
      { name: 'combined', minOccurs: 0, restriction: { minLength: 2, maxLength: 6, pattern: '^[a-z]+$' }, description: 'minLength 2, maxLength 6 and lowercase-only pattern combined.', fieldOptions: { label: 'Combined restrictions' } },
      { name: 'requiredWithRestriction', restriction: { minLength: 3 }, fieldOptions: { label: 'Required + minLength 3' } },
      { name: 'customValidation', minOccurs: 0, validation: (value: unknown) => !value || String(value).startsWith('A') || 'Value must start with "A"', description: 'Custom vee-validate function via the validation property.', fieldOptions: { label: 'Custom validation function' } },
    ],
  },
]);

export const restrictionsSampleValues = {
  // Every value here satisfies its restriction, so loading the sample form validates cleanly.
  strings: {
    minLength: 'abcd',
    maxLength: 'abc',
    length: 'code',
    pattern: 'AB-123',
    enumeration: 'green',
    whiteSpace: 'clean text',
  },
  numbers: {
    minInclusive: '7',
    maxInclusive: '9',
    minExclusive: '3',
    maxExclusive: '42',
    fractionDigits: '3.14',
    totalDigits: '12345',
  },
  mixed: {
    combined: 'hello',
    requiredWithRestriction: 'valid',
    customValidation: 'Apple',
  },
};

export const arrayOccurrenceTestCase = createTestCase([
  {
    name: 'occurrences',
    fieldOptions: { label: 'Occurrence Variants' },
    type: 'heading',
    children: [
      { name: 'manualFirstItem', minOccurs: 1, maxOccurs: 3, autoAddMinOccurs: false, description: 'Starts empty even though 1 item is required (autoAddMinOccurs: false). Add the first item yourself; submitting while empty shows the minOccurs error.', fieldOptions: { label: 'No auto first item' } },
      { name: 'prefilledToMin', minOccurs: 2, maxOccurs: 4, description: 'Auto-fills 2 empty items on first render (the default behaviour).', fieldOptions: { label: 'Pre-filled to minOccurs 2' } },
      { name: 'manyAllowed', minOccurs: 0, maxOccurs: 10, fieldOptions: { label: 'Optional, up to 10 items' } },
    ],
  },
  {
    name: 'typedArrays',
    fieldOptions: { label: 'Arrays of Other Input Types' },
    type: 'heading',
    children: [
      { name: 'selects', type: 'select', minOccurs: 0, maxOccurs: 3, fieldOptions: { label: 'Select array (max 3)' }, options: [
        { key: 'option1', value: 'Option 1' },
        { key: 'option2', value: 'Option 2' },
      ] },
      { name: 'checkboxes', type: 'checkbox', minOccurs: 0, maxOccurs: 3, fieldOptions: { label: 'Checkbox array (max 3)' } },
      { name: 'vModelTexts', type: 'textBoundByVModel', minOccurs: 0, maxOccurs: 3, fieldOptions: { label: 'v-model text array (max 3)' } },
    ],
  },
]);

export const arrayOccurrenceSampleValues = {
  occurrences: {
    manualFirstItem: ['Added by hand'],
    prefilledToMin: ['First', 'Second'],
    manyAllowed: ['One', 'Two', 'Three'],
  },
  typedArrays: {
    selects: ['option1', 'option2'],
    checkboxes: [true, false],
    vModelTexts: ['Alpha', 'Beta'],
  },
};

export const choiceOccurrenceTestCase = createTestCase([
  {
    name: 'optionalChoice',
    fieldOptions: { label: 'Optional Choice (minOccurs 0)' },
    type: 'heading',
    children: [
      { name: 'contact', fieldOptions: { label: 'Optional choice' }, minOccurs: 0, fullWidth: true, description: 'Valid when left completely empty; still only one branch may hold a value.', choice: [
        { name: 'email', fieldOptions: { label: 'Email' } },
        { name: 'phone', fieldOptions: { label: 'Phone' } },
      ] },
    ],
  },
  {
    name: 'twoOccurrence',
    fieldOptions: { label: 'Choice Requiring 2 Occurrences (minOccurs 2, maxOccurs 4)' },
    type: 'heading',
    children: [
      { name: 'contact', fieldOptions: { label: 'At least 2 occurrences' }, minOccurs: 2, maxOccurs: 4, fullWidth: true, description: 'Submit with fewer than 2 filled occurrences to see the choiceMinOccurs error.', choice: [
        { name: 'email', fieldOptions: { label: 'Email' } },
        { name: 'phone', fieldOptions: { label: 'Phone' } },
      ] },
    ],
  },
  {
    name: 'differentLimits',
    fieldOptions: { label: 'Branches With Different Limits (maxOccurs 3)' },
    type: 'heading',
    children: [
      { name: 'entries', fieldOptions: { label: 'Per-iteration branch limits' }, maxOccurs: 3, fullWidth: true, description: 'Branch A allows 2 items per choice iteration, branch B only 1; the choice itself may repeat 3 times.', choice: [
        { name: 'branchA', maxOccurs: 2, fieldOptions: { label: 'Branch A (maxOccurs 2)' } },
        { name: 'branchB', maxOccurs: 1, fieldOptions: { label: 'Branch B (maxOccurs 1)' } },
      ] },
    ],
  },
  {
    name: 'totalCap',
    fieldOptions: { label: 'Branch Total Cap (maxOccursTotal, maxOccurs 4)' },
    type: 'heading',
    children: [
      { name: 'entries', fieldOptions: { label: 'Capped branch totals' }, maxOccurs: 4, fullWidth: true, description: 'The capped branch may reach at most 3 items in total across the whole choice, even though the shared budget would allow more.', choice: [
        { name: 'capped', maxOccurs: 2, maxOccursTotal: 3, fieldOptions: { label: 'Capped (maxOccurs 2, maxOccursTotal 3)' } },
        { name: 'uncapped', maxOccurs: 2, fieldOptions: { label: 'Uncapped (maxOccurs 2)' } },
      ] },
    ],
  },
]);

export const choiceOccurrenceSampleValues = {
  optionalChoice: { contact: { email: 'ada@example.com' } },
  // Two filled email occurrences satisfy the minOccurs 2 requirement.
  twoOccurrence: { contact: { email: ['ada@example.com', 'grace@example.com'] } },
  differentLimits: { entries: { branchA: ['A-one', 'A-two'] } },
  totalCap: { entries: { capped: ['C-one', 'C-two'] } },
};

export const explicitChoiceTestCase = createTestCase([
  {
    name: 'explicitSection',
    fieldOptions: { label: 'Explicit Choice (selection-first)' },
    type: 'heading',
    children: [
      { name: 'contact', fieldOptions: { label: 'Contact method' }, fullWidth: true, explicitChoiceSelection: true, description: 'No branch renders until one is chosen via the add buttons; switching to the other branch clears the current one.', choice: [
        { name: 'email', type: 'group', fieldOptions: { label: 'Email' }, children: [
          { name: 'address', fullWidth: true, fieldOptions: { label: 'Email address' } },
        ] },
        { name: 'phone', type: 'group', fieldOptions: { label: 'Phone' }, children: [
          { name: 'number', fullWidth: true, fieldOptions: { label: 'Phone number' } },
          { name: 'allowSms', type: 'checkbox', minOccurs: 0, fieldOptions: { label: 'Allow SMS' } },
        ] },
      ] },
    ],
  },
]);

export const explicitChoiceSampleValues = {
  // A loaded value auto-selects its branch, even though nothing was clicked.
  explicitSection: { contact: { email: { address: 'jane@example.com' } } },
};

export const preserveOnSwitchTestCase = createTestCase([
  {
    name: 'preserveSection',
    fieldOptions: { label: 'Explicit Choice With preserveOnSwitch' },
    type: 'heading',
    children: [
      { name: 'contact', fieldOptions: { label: 'Contact method' }, fullWidth: true, explicitChoiceSelection: true, preserveOnSwitch: true, description: 'Fill in Email, switch to Phone and back: the Email value is restored from the stash, with fresh touched/validation state.', choice: [
        { name: 'email', type: 'group', fieldOptions: { label: 'Email' }, children: [
          { name: 'address', fullWidth: true, fieldOptions: { label: 'Email address' } },
        ] },
        { name: 'phone', type: 'group', fieldOptions: { label: 'Phone' }, children: [
          { name: 'number', fullWidth: true, fieldOptions: { label: 'Phone number' } },
        ] },
      ] },
    ],
  },
]);

export const preserveOnSwitchSampleValues = {
  preserveSection: { contact: { email: { address: 'restore@example.com' } } },
};

export const explicitRepeatableChoiceTestCase = createTestCase([
  {
    name: 'integrationsSection',
    fieldOptions: { label: 'Explicit Repeatable Choice (maxOccurs 5)' },
    type: 'heading',
    children: [
      { name: 'integrations', fieldOptions: { label: 'Integrations' }, fullWidth: true, maxOccurs: 5, explicitChoiceSelection: true, description: 'Add up to 5 occurrences in any mix; each kind is additionally capped at 3 in total (maxOccursTotal), so its add button disables independently.', choice: [
        { name: 'crmExport', maxOccurs: 1, maxOccursTotal: 3, fullWidth: true, fieldOptions: { label: 'CRM export' }, children: [
          { name: 'crmSystem', fieldOptions: { label: 'CRM system' } },
          { name: 'exportSchedule', fieldOptions: { label: 'Export schedule' } },
        ] },
        { name: 'apiEndpoint', maxOccurs: 1, maxOccursTotal: 3, fullWidth: true, fieldOptions: { label: 'API endpoint' }, children: [
          { name: 'url', fieldOptions: { label: 'Endpoint URL' } },
          { name: 'apiKey', fieldOptions: { label: 'API key' } },
        ] },
      ] },
    ],
  },
]);

export const explicitRepeatableChoiceSampleValues = {
  // A mix of both kinds; each branch is its own array of occurrences.
  integrationsSection: {
    integrations: {
      crmExport: [
        { crmSystem: 'Salesforce', exportSchedule: 'Nightly' },
      ],
      apiEndpoint: [
        { url: 'https://api.example.com/orders', apiKey: 'key-1234' },
        { url: 'https://api.example.com/customers', apiKey: 'key-5678' },
      ],
    },
  },
};

export const computedPropsTestCase = createTestCase([
  {
    name: 'ownValue',
    fieldOptions: { label: 'Reacting to Own Value' },
    type: 'heading',
    children: [
      { name: 'charCounter', minOccurs: 0, restriction: { maxLength: 10 }, fieldOptions: { label: 'Character counter' }, computedProps: [
        (field, value) => {
          const length = typeof value.value === 'string' ? value.value.length : 0;
          field.description = `${10 - length} character(s) remaining`;
        },
      ] },
      { name: 'selfHiding', minOccurs: 0, fieldOptions: { label: 'Type "hide" to hide me' }, computedProps: [
        (field, value) => {
          if (value.value === 'hide')
            field.hidden = true;
        },
      ] },
      { name: 'selfDisabling', minOccurs: 0, fieldOptions: { label: 'Type "lock" to disable me' }, computedProps: [
        (field, value) => {
          if (value.value === 'lock')
            field.disabled = true;
        },
      ] },
    ],
  },
  {
    name: 'progress',
    fieldOptions: { label: 'Parent Reacting to Child Values (computeOnChildValueChange)' },
    type: 'heading',
    computeOnChildValueChange: true,
    computedProps: [
      (field, value) => {
        const childValues = Object.values((value.value ?? {}) as Record<string, unknown>);
        const filled = childValues.filter(v => v !== undefined && v !== null && v !== '').length;
        field.description = `${filled} of 3 fields filled in`;
      },
    ],
    children: [
      { name: 'first', minOccurs: 0, fieldOptions: { label: 'First' } },
      { name: 'second', minOccurs: 0, fieldOptions: { label: 'Second' } },
      { name: 'third', minOccurs: 0, fieldOptions: { label: 'Third' } },
    ],
  },
  {
    name: 'childFieldsDemo',
    fieldOptions: { label: 'Parent Reacting to Child Computed State (childFields)' },
    type: 'heading',
    description: 'Each child hides itself when its value is "hide"; once every child is hidden the parent heading hides too.',
    computedProps: [
      (field, _value, childFields) => {
        if (childFields.value.length > 0 && childFields.value.every(c => c.hidden))
          field.hidden = true;
      },
    ],
    children: [
      { name: 'childA', minOccurs: 0, fieldOptions: { label: 'Child A (type "hide")' }, computedProps: [
        (field, value) => {
          if (value.value === 'hide')
            field.hidden = true;
        },
      ] },
      { name: 'childB', minOccurs: 0, fieldOptions: { label: 'Child B (type "hide")' }, computedProps: [
        (field, value) => {
          if (value.value === 'hide')
            field.hidden = true;
        },
      ] },
    ],
  },
]);

export const computedPropsSampleValues = {
  // Values that stay visible/enabled (typing "hide"/"lock" would trigger the self-hiding demos).
  ownValue: { charCounter: 'Counting', selfHiding: 'still shown', selfDisabling: 'still on' },
  progress: { first: 'Filled one', second: 'Filled two' },
  childFieldsDemo: { childA: 'kept visible' },
};

export const attributesTestCase = createTestCase([
  {
    name: 'attributes',
    fieldOptions: { label: 'Attributes' },
    type: 'heading',
    description: 'Attributes render once the parent field has a value; the value becomes an object like { value, ...attributes }. Check the debug output below.',
    children: [
      { name: 'nickname', minOccurs: 0, fullWidth: true, fieldOptions: { label: 'Optional attribute (lang)' }, attributes: [
        { name: 'lang', minOccurs: 0, fieldOptions: { label: 'Language' } },
      ] },
      { name: 'verifiedPhone', fullWidth: true, fieldOptions: { label: 'Required attribute (certainty)' }, attributes: [
        { name: 'certainty', type: 'select', fieldOptions: { label: 'Certainty' }, options: [
          { key: 'verified', value: 'Verified' },
          { key: 'unverified', value: 'Unverified' },
        ] },
      ] },
    ],
  },
  {
    name: 'complexTypes',
    fieldOptions: { label: 'Complex Types' },
    type: 'heading',
    children: [
      { name: 'complexValue', minOccurs: 0, fullWidth: true, isComplexType: true, description: 'isComplexType without attributes: the value is stored as { value: ... }.', fieldOptions: { label: 'isComplexType' } },
    ],
  },
]);

export const attributesSampleValues = {
  attributes: {
    // A complex type stores its value plus each attribute under one object.
    nickname: { value: 'Ace', lang: 'en' },
    verifiedPhone: { value: '+31 6 1234 5678', certainty: 'verified' },
  },
  complexTypes: {
    complexValue: { value: 'Wrapped in { value }' },
  },
};

export const complexTypeValuePropertyTestCase = createTestCase([
  {
    name: 'customValueProp',
    fieldOptions: { label: 'Custom complexTypeValueProperty' },
    type: 'heading',
    description: 'The settings rename the complex type value property to "val", so the debug output shows { val: ..., lang: ... }.',
    children: [
      { name: 'title', minOccurs: 0, fullWidth: true, fieldOptions: { label: 'Title with lang attribute' }, attributes: [
        { name: 'lang', minOccurs: 0, fieldOptions: { label: 'Language' } },
      ] },
    ],
  },
], {
  complexTypeValueProperty: 'val',
});

export const complexTypeValuePropertySampleValues = {
  // The value lives under "val" (not "value") because of the complexTypeValueProperty setting.
  customValueProp: { title: { val: 'Hello world', lang: 'en' } },
};

function createValidationTimingTestCase(description: string, settings: DynamicFormSettings) {
  return createTestCase([
    {
      name: 'timing',
      fieldOptions: { label: 'Validation Timing' },
      type: 'heading',
      description,
      children: [
        { name: 'requiredField', fieldOptions: { label: 'Required field' } },
        { name: 'maxLengthField', minOccurs: 0, restriction: { maxLength: 5 }, fieldOptions: { label: 'maxLength 5' } },
      ],
    },
  ], settings);
}

// All four timing variants share the same two-field shape.
export const validationTimingSampleValues = {
  timing: { requiredField: 'Filled in', maxLengthField: 'abc' },
};

export const validateOnSubmitOnlyTestCase = createValidationTimingTestCase(
  'validateOnValueUpdate: false, validateWhenInError: false. Errors only appear on submit and stay unchanged while typing until the next submit.',
  { validateOnValueUpdate: false, validateWhenInError: false },
);

export const validateOnBlurTestCase = createValidationTimingTestCase(
  'validateOnBlur: true, validateOnValueUpdate: false. Errors appear when leaving a field, not while typing.',
  { validateOnBlur: true, validateOnValueUpdate: false },
);

export const validateAfterSubmitTestCase = createValidationTimingTestCase(
  'validateOnValueUpdateAfterSubmit: true, validateOnValueUpdate: false. Typing does not validate until the first submit; after that every change validates.',
  { validateOnValueUpdateAfterSubmit: true, validateOnValueUpdate: false },
);

export const validateWhenInErrorTestCase = createValidationTimingTestCase(
  'validateOnValueUpdate: false, validateWhenInError: true. A field only starts live-validating once it is in error (after a submit).',
  { validateOnValueUpdate: false, validateWhenInError: true },
);

export const showOptionalInsteadOfRequiredTestCase = createTestCase([
  {
    name: 'optionalMarkers',
    fieldOptions: { label: 'Show "(optional)" Instead of "*"' },
    type: 'heading',
    description: 'With showOptionalInsteadOfRequired the required markers disappear and optional fields are marked instead.',
    children: [
      { name: 'requiredField', fieldOptions: { label: 'Required field' } },
      { name: 'optionalField', minOccurs: 0, fieldOptions: { label: 'Optional field' } },
    ],
  },
], {
  showOptionalInsteadOfRequired: true,
});

export const showOptionalInsteadOfRequiredSampleValues = {
  optionalMarkers: { requiredField: 'Required value', optionalField: 'Optional value' },
};

export const customMessagesTestCase = createTestCase([
  {
    name: 'messages',
    fieldOptions: { label: 'Custom Validation Messages' },
    type: 'heading',
    description: 'The settings override the required, maxLength and minInclusive messages; rules without an override fall back to the library defaults.',
    children: [
      { name: 'requiredField', fieldOptions: { label: 'Required field' } },
      { name: 'maxLengthField', minOccurs: 0, restriction: { maxLength: 5 }, fieldOptions: { label: 'maxLength 5' } },
      { name: 'minInclusiveField', minOccurs: 0, restriction: { minInclusive: 10 }, fieldOptions: { label: 'minInclusive 10' } },
    ],
  },
], {
  messages: {
    required: 'Custom message: please fill in {field}',
    maxLength: 'Custom message: {field} must stay under {length} characters',
    minInclusive: 'Custom message: {field} must be {min} or higher',
  },
});

export const customMessagesSampleValues = {
  messages: { requiredField: 'Filled in', maxLengthField: 'abcd', minInclusiveField: '15' },
};

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

export const individualSampleValues = {
  // Each repeatable item is a complex type: its text under "value" plus the lang attribute.
  items: [
    { value: 'First item', lang: 'en' },
    { value: 'Second item', lang: 'nl' },
  ],
};

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
    // Overridable at runtime so a Storybook control can flip a case between empty and pre-filled
    // without a second component; an unset prop falls back to the baked testCaseConfig.
    props: {
      initialValues: { type: Object as PropType<GenericObject>, default: undefined },
      initialEdit: { type: Boolean as PropType<boolean | undefined>, default: undefined },
      hideFieldsWithoutValue: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    },
    setup: props => () => h(TestForm, {
      metadata,
      settings,
      showDebugState: true,
      initialValues: props.initialValues ?? testCaseConfig.initialValues,
      initialEdit: props.initialEdit ?? testCaseConfig.initialEdit,
      hideFieldsWithoutValue: props.hideFieldsWithoutValue ?? testCaseConfig.hideFieldsWithoutValue,
    }),
  }));
}
