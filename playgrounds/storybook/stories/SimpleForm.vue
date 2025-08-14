<script lang="ts" setup>
import { DynamicForm } from '@bach.software/vue-dynamic-form';
import DynamicFormImplementation, { type Metadata } from "../components/DynamicFormImplementation.vue";
import { reactive } from 'vue';

const loadedOptions = reactive<Partial<Record<string, { key: string, value: string }[]>>>({});

// Async for example
loadedOptions['select'] = [
  { key: "Option 1", value: "option1" },
  { key: "Option 2", value: "option2" },
  { key: "Option 3", value: "option3" }
];
// 

const metadata: Metadata[] = [
  { name: "text", type: "text", label: "Text Input", restrictions: { maxLength: 10 } },
  {
    name: "heading",
    label: "Heading",
    type: "heading",
    children: [
      { name: "text", label: "Text Input", type: "text" },
      {
        name: "select",
        label: "Select Input",
        type: "select",
        transformReactively: [
          (thisField, fieldValue) => {
            thisField.options = loadedOptions['select'] || [];
            return thisField;
          }
        ]
      },
      { name: "checkbox", label: "Checkbox", type: "checkbox" },
      // @ts-ignore type is not correct, but that's what we want to demonstrate
      { name: "notexisting", label: "Not existing", type: 'notexisting' },
      {
        name: "heading2",
        label: "Sub Heading",
        type: "heading",
        children: [
          { name: "text", label: "Text Input 2", type: "text", 
          attributes:[
            { name:'certainty', type: 'select', options: [
              { key: 'Unverified', value: 'unverified' },
              { key: 'Verified', value: 'verified' }
            ]}
          ]}
        ],
      },
    ]
  },
  { 
    choice: [
      { name: 'optional 1' },
      { name: 'optional 2' },
      { name: 'optional 3' },
    ] 
  }
];
</script>
<template>
  <DynamicForm
    :template="DynamicFormImplementation"
    :metadata="metadata"
  />
</template>

