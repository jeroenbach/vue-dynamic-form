<script lang="ts" setup>
import { ref } from 'vue';
import { DynamicForm } from '@bach.software/vue-dynamic-form';
import { ElementPlusDynamicForm } from '@bach.software/vue-dynamic-form-element-plus';
import 'element-plus/dist/index.css';

const formData = ref({});

const basicMetadata = [
  {
    name: 'firstName',
    type: 'text',
    label: 'First Name',
    placeholder: 'Enter your first name',
    minOccurs: 1,
  },
  {
    name: 'email',
    type: 'text',
    label: 'Email',
    placeholder: 'Enter your email',
    minOccurs: 1,
  },
  {
    name: 'age',
    type: 'number',
    label: 'Age',
    min: 18,
    max: 120,
  },
];

const advancedMetadata = [
  {
    name: 'profile',
    type: 'heading',
    label: 'Profile Information',
    children: [
      {
        name: 'firstName',
        type: 'text',
        label: 'First Name',
        placeholder: 'Enter your first name',
        minOccurs: 1,
      },
      {
        name: 'lastName',
        type: 'text',
        label: 'Last Name',
        placeholder: 'Enter your last name',
        minOccurs: 1,
      },
      {
        name: 'email',
        type: 'text',
        label: 'Email',
        placeholder: 'Enter your email',
        minOccurs: 1,
      },
    ],
  },
  {
    name: 'preferences',
    type: 'heading',
    label: 'Preferences',
    children: [
      {
        name: 'theme',
        type: 'select',
        label: 'Theme',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
          { label: 'Auto', value: 'auto' },
        ],
      },
      {
        name: 'language',
        type: 'radio',
        label: 'Language',
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
        ],
      },
      {
        name: 'notifications',
        type: 'checkbox',
        label: 'Enable Notifications',
      },
      {
        name: 'newsletter',
        type: 'switch',
        label: 'Subscribe to Newsletter',
      },
    ],
  },
  {
    name: 'details',
    type: 'heading',
    label: 'Additional Details',
    children: [
      {
        name: 'birthDate',
        type: 'date',
        label: 'Birth Date',
        placeholder: 'Select your birth date',
      },
      {
        name: 'rating',
        type: 'rate',
        label: 'Rate our service',
        max: 5,
      },
      {
        name: 'satisfaction',
        type: 'slider',
        label: 'Satisfaction Level',
        min: 0,
        max: 100,
        showStops: true,
      },
    ],
  },
];
</script>

<template>
  <div class="p-6 space-y-8">
    <h1 class="text-2xl font-bold">Element Plus Dynamic Form Examples</h1>
    
    <!-- Basic Form -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Basic Form</h2>
      <div class="border border-gray-200 rounded-lg p-4">
        <DynamicForm :metadata="basicMetadata" :template="ElementPlusDynamicForm" />
      </div>
    </div>

    <!-- Advanced Form -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Advanced Form with All Components</h2>
      <div class="border border-gray-200 rounded-lg p-4">
        <DynamicForm :metadata="advancedMetadata" :template="ElementPlusDynamicForm" />
      </div>
    </div>

    <!-- Form Data Display -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Form Data (JSON)</h2>
      <pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">{{ JSON.stringify(formData, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
/* Add any custom styles if needed */
</style>