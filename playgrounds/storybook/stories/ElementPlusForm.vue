<script lang="ts" setup>
import type { ElementPlusExample } from './ElementPlusForm.examples';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { ElementPlusFormTemplate } from '@bach.software/vue-dynamic-form-element-plus';
import { ElButton } from 'element-plus';
import { computed, ref } from 'vue';
import ElementPlusFormTemplateImplementation from '../components/ElementPlusFormTemplateImplementation.vue';
import '@bach.software/vue-dynamic-form-element-plus/style.css';
import 'element-plus/dist/index.css';

const { exampleId, title, description, metadata, initialValues, bare = false, hideSubmit = false } = defineProps<ElementPlusExample>();

const { values, handleSubmit } = useDynamicForm({ initialValues });

// The playground and the linked packages can resolve different Vue type versions, so the component type is widened.
const template = computed<any>(() => (bare ? ElementPlusFormTemplate : ElementPlusFormTemplateImplementation));

const settings = {
  messages: {
    required: '{field} is required',
    minOccurs: 'At least {min} items required',
    choiceMinOccurs: 'The following fields need to occur at least {min} time(s): {field}',
  },
};

const submitState = ref<'idle' | 'submitted' | 'failed'>('idle');
const submittedValues = ref<unknown>();
const failedErrors = ref<Record<string, string | undefined>>({});

const onSubmit = handleSubmit(
  (formValues) => {
    submitState.value = 'submitted';
    submittedValues.value = formValues;
  },
  (context) => {
    submitState.value = 'failed';
    failedErrors.value = context.errors;
  },
);
</script>

<template>
  <section class="exampleRoot" :data-testid="`example-${exampleId}`">
    <h2 class="exampleTitle">
      {{ title }}
    </h2>
    <p class="exampleNote" data-testid="exampleNote">
      {{ description }}
    </p>

    <form class="exampleForm" novalidate :data-testid="`form-${exampleId}`" @submit.prevent="onSubmit">
      <DynamicForm :metadata="metadata" :template="template" :settings="settings" />
      <div v-if="!hideSubmit" class="exampleActions">
        <ElButton type="primary" nativeType="submit" data-testid="submit-button">
          Submit
        </ElButton>
      </div>
    </form>

    <div v-if="submitState === 'submitted'" class="resultPanel resultSuccess" data-testid="submit-result">
      <strong>Submitted</strong>
      <pre class="jsonPanel" data-testid="submitted-json">{{ JSON.stringify(submittedValues, null, 2) }}</pre>
    </div>
    <div v-else-if="submitState === 'failed'" class="resultPanel resultFailure" data-testid="submit-errors">
      <strong>Submit failed</strong>
      <ul>
        <li v-for="(error, path) in failedErrors" :key="path">
          {{ path }}: {{ error }}
        </li>
      </ul>
    </div>

    <h3 class="jsonTitle">
      Form data (JSON)
    </h3>
    <pre class="jsonPanel" data-testid="form-json">{{ JSON.stringify(values, null, 2) }}</pre>
  </section>
</template>

<style scoped>
.exampleRoot {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.exampleTitle {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.exampleNote {
  margin: 0 0 1rem;
  color: var(--el-text-color-secondary);
}

.exampleForm {
  padding: 1rem;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}

.exampleActions {
  margin-top: 1rem;
}

.resultPanel {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: var(--el-border-radius-base);
}

.resultSuccess {
  background-color: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.resultFailure {
  background-color: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.jsonTitle {
  margin: 1.5rem 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}

.jsonPanel {
  margin: 0.5rem 0 0;
  padding: 1rem;
  overflow: auto;
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-fill-color-light);
  font-size: 0.875rem;
}
</style>
