<script lang="ts" setup>
import { ref } from 'vue';

export interface Props {
  id?: string
  value?: string | unknown
  placeholder?: string
  disabled?: boolean
  errorMessage?: string
  dataTestid?: string
}

defineProps<Props>();
const emit = defineEmits<{
  input: [event: Event]
  blur: []
}>();

const showPassword = ref(false);
</script>

<template>
  <div :data-testid="dataTestid" class="relative">
    <input
      :data-testid="dataTestid ? `${dataTestid}-input` : undefined"
      :type="showPassword ? 'text' : 'password'"
      :id
      :value="(value as string | undefined)"
      :placeholder
      :disabled
      class="h-10 w-full rounded-lg border bg-white dark:bg-slate-900 !px-3 !py-2 pr-10 md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400"
      :class="{
        'border-gray-200 focus:border-sky-500 focus:ring-sky-200': !errorMessage,
        'border-red-500 dark:border-rose-600 focus:border-red-500 dark:focus:border-rose-500 focus:ring-red-200 dark:focus:ring-rose-900': errorMessage,
      }"
      :aria-invalid="!!errorMessage"
      @input="emit('input', $event)"
      @blur="emit('blur')"
    >
    <button
      type="button"
      tabindex="-1"
      :data-testid="dataTestid ? `${dataTestid}-toggle` : undefined"
      class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      :aria-label="showPassword ? 'Hide password' : 'Show password'"
      @click="showPassword = !showPassword"
    >
      <svg v-if="showPassword" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
      </svg>
      <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    </button>
  </div>
</template>
