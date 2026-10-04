<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  password?: string | unknown
  dataTestid?: string
}>();

type Strength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

const strength = computed<Strength>(() => {
  const val = String(props.password ?? '');
  if (!val)
    return 'empty';
  let score = 0;
  if (val.length >= 8)
    score++;
  if (/[A-Z]/.test(val))
    score++;
  if (/[a-z]/.test(val))
    score++;
  if (/\d/.test(val))
    score++;
  if (/[^A-Z0-9]/i.test(val))
    score++;
  if (score <= 2)
    return 'weak';
  if (score === 3)
    return 'fair';
  if (score === 4)
    return 'good';
  return 'strong';
});

const config = computed(() => {
  const map: Record<Strength, { label: string, segments: number, tier: string }> = {
    empty: { label: '', segments: 0, tier: '' },
    weak: { label: 'Weak', segments: 1, tier: 'weak' },
    fair: { label: 'Fair', segments: 2, tier: 'fair' },
    good: { label: 'Good', segments: 3, tier: 'good' },
    strong: { label: 'Strong', segments: 4, tier: 'strong' },
  };
  return map[strength.value];
});

function segmentClass(index: number) {
  return index <= config.value.segments ? `is-on-${config.value.tier}` : '';
}

const labelClass = computed(() => config.value.tier ? `is-${config.value.tier}` : '');
</script>

<template>
  <div v-if="password" :data-testid="dataTestid" class="sft-strength">
    <div class="sft-strength-track">
      <span
        v-for="i in 4"
        :key="i"
        class="sft-strength-seg"
        :class="segmentClass(i)"
      />
    </div>
    <p
      :data-testid="dataTestid ? `${dataTestid}-strength` : undefined"
      class="sft-strength-label"
      :class="labelClass"
    >
      {{ config.label }}
    </p>
  </div>
</template>
