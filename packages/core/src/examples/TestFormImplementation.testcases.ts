import type { Metadata } from './TestFormImplementation.vue';
import { defineComponent, markRaw, ref } from 'vue';
import DynamicForm from '../components/DynamicForm.vue';
import { useDynamicForm } from '../core/useDynamicForm';
import TestFormImplementation from './TestFormImplementation.vue';

export const defaultTestCase = createTestCase([{
  name: 'text',
  type: 'text',
  label: 'Text Input',
  path: 'with.custom.structure',
  restrictions: { maxLength: 10 },
}]);

export const arrayTestCase = createTestCase([{
  label: 'Array Fields',
  type: 'heading',
  children: [
    { label: 'Optional field (max 3)', minOccurs: 0, maxOccurs: 3 },
    { label: 'Required field (max 3)', maxOccurs: 3 },
    { label: '2 Fields required', minOccurs: 2, maxOccurs: 4 },
    { label: 'Section (2 sections required)', type: 'heading', minOccurs: 2, maxOccurs: 4, fullWidth: true, children: [
      { label: 'Nested field 1' },
      { label: 'Required Nested field 2', type: 'select', options: [
        { key: 'option1', value: 'Option 1' },
        { key: 'option2', value: 'Option 2' },
        { key: 'option3', value: 'Option 3' },
      ] },
      { label: 'Nested field 3', type: 'checkbox' },
    ] },
  ],
}]);

export const groupTestCase = createTestCase([{
  label: 'Grouped Fields',
  type: 'heading',
  children: [
    { label: 'Required group', children: [
      { label: 'Required Nested field 1', fullWidth: true },
      { label: 'Required Nested field 2', fullWidth: true },
    ] },
    { label: 'Optional group', minOccurs: 0, description: `The group is optional, therefore the children will only be required once 1 value is filled in.
      
You can test it by filling in one of the fields.`, children: [
      { label: 'Required Nested field 1', fullWidth: true },
      { label: 'Required Nested field 2', fullWidth: true },
    ] },
  ],
}, {
  label: 'Grouped Array Fields',
  type: 'heading',
  children: [
    { label: 'Required group', maxOccurs: 5, fullWidth: true, children: [
      { label: 'Required Nested field 1' },
      { label: 'Required Nested field 2' },
    ] },
    { label: 'Optional group', minOccurs: 0, maxOccurs: 5, fullWidth: true, children: [
      { label: 'Required Nested field 1' },
      { label: 'Required Nested field 2' },
    ] },
  ],
}]);

export const choiceTestCase = createTestCase([
  {
    label: 'Choice Fields (minOccurs 1, maxOccurs 1)',
    type: 'heading',
    children: [
      { label: 'Simple Choice Field', fullWidth: true, description: `In a choice field, only 1 of the fields can be filled in.`, choice: [
        { label: 'Nested Field 1' },
        { label: 'Nested Field 2' },
      ] },
    ],
  },
  {
    label: 'Choice Grouped Fields (minOccurs 1, maxOccurs 3)',
    type: 'heading',
    children: [
      { label: 'Array Choice Field', maxOccurs: 3, fullWidth: true, description: `In a choice field, only 1 of the fields can be filled in.`, choice: [
        { label: 'Nested Field 1', children: [{ label: 'Nested Child Field 1', fullWidth: true }, { label: 'Nested Child Field 2', fullWidth: true }] },
        { label: 'Nested Field 2', children: [{ label: 'Nested Child Field 1', fullWidth: true }, { label: 'Nested Child Field 2', fullWidth: true }] },
      ] },
    ],
  },
  {
    label: 'Choice Array Fields (minOccurs 1, maxOccurs 3)',
    type: 'heading',
    children: [
      { label: 'Array Choice Field', maxOccurs: 3, fullWidth: true, description: `In a choice field, only 1 of the fields can be filled in.`, choice: [
        { label: 'Nested Field 1', maxOccurs: 3 },
        { label: 'Nested Field 2', maxOccurs: 3 },
      ] },
    ],
  },
]);

export function createTestCase(
  metadata: Metadata[],
) {
  return markRaw(
    defineComponent({
      components: { DynamicForm },
      data() {
        const { values, handleSubmit, errors: _errors } = useDynamicForm();
        const manualValues = ref();
        const errors = ref<Partial<Record<string, string>>>({});
        const isSubmitted = ref(false);

        function submit(e?: Event) {
          handleSubmit(
            (_values) => {
              // Reset errors
              errors.value = {};
              isSubmitted.value = true;
            },
            ({ errors: _errors }) => {
              errors.value = _errors;
              isSubmitted.value = true;
            },
          )(e);
        };

        const template = markRaw(TestFormImplementation); ;

        return {
          metadata,
          submit,
          errors,
          isSubmitted,
          values,
          manualValues,
          template,
        };
      },
      template: `
        <form @submit="submit">
          <div v-if="Object.values(errors).length" data-testid="errors" class="col-12" style="color: #F8285A;">
            Errors:
            <ul>
              <li v-for="(error, key) in errors" :key="key">
                <span v-html="error" />
              </li>
            </ul>
          </div>
          <DynamicForm
            :template
            :metadata
            @update:model-value="manualValues = $event"
          />
          <button type="submit" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded" data-testid="submit">Submit</button>
          <span v-if="isSubmitted" data-testid="isSubmitted" />
            <pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
// vee-validate updated values:  
{{ JSON.stringify(values, null, 2) }}
            </pre>
            <pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
// manual updated values:  
{{ JSON.stringify(manualValues, null, 2) }}
          </pre>
        </form>
      `,
    }),
  );
}
