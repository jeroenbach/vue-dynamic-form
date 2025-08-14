<script lang="ts" setup>
import { DynamicForm } from '@bach.software/vue-dynamic-form';
import DynamicFormImplementation, { type Metadata } from "../components/DynamicFormImplementation.vue";

const metadata: Metadata[] = [
  { name: "text", type: "text", label: "Text Input" },
  {
    name: "heading",
    label: "Heading",
    type: "heading",
    children: [
      { name: "text", label: "Text Input", type: "text" },
      {
        name: "select",
        label: "Select Input",
        options: [{ key: "Option 1", value: "option1" }, { key: "Option 2", value: "option2" }, { key: "Option 3", value: "option3" }],
        type: "select",
      },
      { name: "checkbox", label: "Checkbox", type: "checkbox" },
      // @ts-ignore type is not correct, but that's what we want to demonstrate
      { name: "notexisting", label: "Not existing", type: 'notexisting' },
      {
        name: "heading2",
        label: "Sub Heading",
        type: "heading",
        children: [{ name: "text", label: "Text Input 2", type: "text" }],
      },
    ],
  },
];
</script>
<template>
  <DynamicForm
    :template="DynamicFormImplementation"
    :metadata="metadata"
  />
</template>

