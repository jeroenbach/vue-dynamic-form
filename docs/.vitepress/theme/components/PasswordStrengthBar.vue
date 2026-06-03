<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  password?: string | unknown
}>();

type Strength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

const strength = computed<Strength>(() => {
  const val = String(props.password ?? '');
  if (!val) return 'empty';
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[a-z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  if (score <= 2) return 'weak';
  if (score === 3) return 'fair';
  if (score === 4) return 'good';
  return 'strong';
});

const config = computed(() => {
  const map: Record<Strength, { label: string; segments: number; colorClass: string; labelClass: string }> = {
    empty: { label: '', segments: 0, colorClass: '', labelClass: '' },
    weak: { label: 'Weak', segments: 1, colorClass: 'bg-red-500', labelClass: 'text-red-500' },
    fair: { label: 'Fair', segments: 2, colorClass: 'bg-amber-400', labelClass: 'text-amber-500' },
    good: { label: 'Good', segments: 3, colorClass: 'bg-sky-400', labelClass: 'text-sky-500' },
    strong: { label: 'Strong', segments: 4, colorClass: 'bg-emerald-500', labelClass: 'text-emerald-600 dark:text-emerald-400' },
  };
  return map[strength.value];
});
</script>

<template>
  <Transition name="fade">
    <div v-if="password" class="mt-2 flex flex-col gap-1">
      <div class="flex gap-1">
        <div
          v-for="i in 4"
          :key="i"
          class="h-1.5 flex-1 rounded-full transition-all duration-300"
          :class="i <= config.segments ? config.colorClass : 'bg-slate-200 dark:bg-slate-700'"
        />
      </div>
      <p class="text-xs font-medium transition-colors duration-300" :class="config.labelClass">
        {{ config.label }}
      </p>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
