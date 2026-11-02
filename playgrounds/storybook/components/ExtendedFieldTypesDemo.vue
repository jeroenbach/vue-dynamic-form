<script lang="ts" setup>
import type { ExtendedMetadata } from './ExtendedFormTemplate';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import ExtendedFormTemplate from './ExtendedFormTemplate.vue';
import '@bach.software/vue-dynamic-form-starter/style.css';

const metadata: ExtendedMetadata[] = [
  {
    name: 'review',
    type: 'heading',
    fieldOptions: { label: 'Project review' },
    children: [
      { name: 'projectName', type: 'text', fieldOptions: { label: 'Project name' }, placeholder: 'e.g. Apollo' },
      { name: 'rating', type: 'rating', fieldOptions: { label: 'Overall rating' }, maxRating: 5 },
      { name: 'summary', type: 'textarea', fieldOptions: { label: 'What went well?' }, rows: 4, colSpan: 'full', minOccurs: 0 },
    ],
  },
];

const { values, handleSubmit } = useDynamicForm();
const onSubmit = handleSubmit(() => {});
</script>

<template>
  <section class="exampleRoot" data-testid="example-extendedFieldTypes">
    <h2 class="exampleTitle">
      Extending the template with custom field types
    </h2>
    <p class="exampleNote" data-testid="exampleNote">
      extendMetadata layers a project-specific "textarea" and star "rating" type on top of the starter catalogue. A thin wrapper around StarterFormTemplate supplies their "-input" slots; every other field type, and all of the built-in chrome, keeps rendering exactly as before.
    </p>

    <form class="exampleForm" novalidate data-testid="form-extendedFieldTypes" @submit.prevent="onSubmit">
      <DynamicForm :metadata="metadata" :template="ExtendedFormTemplate" />
      <div class="exampleActions">
        <button type="submit" class="sft-btn sft-btn-primary" data-testid="submit-button">
          Submit
        </button>
      </div>
    </form>

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
