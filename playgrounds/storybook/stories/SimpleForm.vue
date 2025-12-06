<script lang="ts" setup>
import type { Metadata } from '../components/DynamicFormImplementation.vue';
import { DynamicForm, useDynamicForm,  } from '@bach.software/vue-dynamic-form';
import { reactive, ref } from 'vue';
import DynamicFormImplementation from '../components/DynamicFormImplementation.vue';

const loadedOptions = reactive<
  Partial<Record<string, { key: string, value: string }[]>>
>({});

// Async for example
loadedOptions.select = [
  { key: 'Option 1', value: 'option1' },
  { key: 'Option 2', value: 'option2' },
  { key: 'Option 3', value: 'option3' },
];
//

interface FormModel{
  text: string,
  select: string,
  checkbox: boolean,
  'weird name': string,
  heading2: {
    textComplexType: {
      value: string,
    },
    textAutomaticComplexType: {
      value: string,
      certainty: string,
    },
  }
}

const metadata: Metadata[] = [
  {
    name: 'text',
    type: 'text',
    label: 'Text Input',
    path: 'with.custom.structure',
    restrictions: { maxLength: 10 },
  },
  {
    name: 'heading',
    label: 'Heading without path',
    type: 'heading',
    path: '', // no path, means its children will be at this parent level
    children: [
      { name: 'text', label: 'Text Input', type: 'text' },
      {
        name: 'select',
        label: 'Select Input',
        type: 'select',
        transformReactively: [
          (thisField, _) => {
            thisField.options = loadedOptions.select || [];
            return thisField;
          },
        ],
      },
      { name: 'checkbox', label: 'Checkbox', type: 'checkbox' },
      // @ts-expect-error type is not correct, but that's what we want to demonstrate
      { name: 'notexisting', label: 'Not existing', type: 'notexisting' },
      { name: 'weird name', label: 'Weird name', type: 'text' },
      {
        name: 'heading2',
        label: 'Sub Heading',
        type: 'heading',
        children: [
          {
            name: 'textComplexType',
            label: 'Text Input 2',
            type: 'text',
            isComplexType: true,
          },{
            name: 'textNotComplexType',
            label: 'Text Input 3',
            type: 'text',
            attributes: [
              {
                name: 'certainty',
                type: 'select',
                options: [
                  { key: 'Unverified', value: 'unverified' },
                  { key: 'Verified', value: 'verified' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    choice: [
      { name: 'optional 1' },
      { name: 'optional 2' },
      { name: 'optional 3' },
    ],
  },
];

const { values } = useDynamicForm<FormModel>();

const modelValue = ref<FormModel>();
</script>

<template>
  <DynamicForm 
  :template="DynamicFormImplementation" 
  :metadata="metadata" 
  @update:modelValue="modelValue = $event"
  />
  <pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">{{ JSON.stringify(values, null, 2) }}</pre>

</template>
