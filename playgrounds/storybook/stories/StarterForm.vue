<script lang="ts" setup>
import type { StarterFormExample } from './StarterForm.examples';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import { computed, ref } from 'vue';
import StarterFormTemplateImplementation from '../components/StarterFormTemplateImplementation.vue';
import '@bach.software/vue-dynamic-form-starter/style.css';

const { exampleId, title, description, metadata, initialValues, bare = false, hideSubmit = false } = defineProps<StarterFormExample>();

const { values, handleSubmit } = useDynamicForm({ initialValues });

// The playground and the linked package can resolve different Vue type versions, so the component type is widened.
const template = computed<any>(() => (bare ? StarterFormTemplate : StarterFormTemplateImplementation));

// Dark mode is driven entirely by the document root, matching the committed `:root.dark` / `html.dark` variable
// scope: a class toggled on a story-local wrapper would leave every --sft-* variable at its light value.
const isDark = ref(document.documentElement.classList.contains('dark'));
function toggleDarkMode() {
  isDark.value = document.documentElement.classList.toggle('dark');
}

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
    <button class="darkModeToggle" type="button" data-testid="dark-mode-toggle" @click="toggleDarkMode">
      {{ isDark ? 'Switch to light' : 'Switch to dark' }}
    </button>

    <h2 class="exampleTitle">
      {{ title }}
    </h2>
    <p class="exampleNote" data-testid="exampleNote">
      {{ description }}
    </p>

    <form class="exampleForm" novalidate :data-testid="`form-${exampleId}`" @submit.prevent="onSubmit">
      <DynamicForm :metadata="metadata" :template="template" />
      <div v-if="!hideSubmit" class="exampleActions">
        <button type="submit" class="sft-btn sft-btn-primary" data-testid="submit-button">
          Submit
        </button>
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
  position: relative;
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.darkModeToggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 50;
  padding: 8px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:global(html.dark) .darkModeToggle {
  background: #0f172a;
  color: #e2e8f0;
  border-color: #334155;
}

.exampleTitle {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.exampleNote {
  margin: 0 0 1rem;
}

.exampleForm {
  padding: 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}

.exampleActions {
  margin-top: 1rem;
}

.resultPanel {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
}

.resultSuccess {
  background-color: #dcfce7;
  color: #166534;
}

.resultFailure {
  background-color: #fee2e2;
  color: #991b1b;
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
  border-radius: 8px;
  background-color: #f1f5f9;
  font-size: 0.875rem;
}
</style>
