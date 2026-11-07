<script lang="ts" setup>
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{
  password?: string | unknown
  /** Overrides the tier labels shown under the bar. */
  labels?: { weak?: string, fair?: string, good?: string, strong?: string }
  /** When the live region text is refreshed. Only 'blur' is supported today: the caller must call announce() itself, since this component cannot observe the real input's blur. */
  announce?: 'blur'
  dataTestid?: string
}>(), {
  announce: 'blur',
});

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
    weak: { label: props.labels?.weak ?? 'Weak', segments: 1, tier: 'weak' },
    fair: { label: props.labels?.fair ?? 'Fair', segments: 2, tier: 'fair' },
    good: { label: props.labels?.good ?? 'Good', segments: 3, tier: 'good' },
    strong: { label: props.labels?.strong ?? 'Strong', segments: 4, tier: 'strong' },
  };
  return map[strength.value];
});

function segmentClass(index: number) {
  return index <= config.value.segments ? `is-on-${config.value.tier}` : '';
}

const labelClass = computed(() => config.value.tier ? `is-${config.value.tier}` : '');

// Snapshot, not a computed: the live region must only change when announce()
// runs, not on every keystroke, or a screen reader would be talked over.
const announcedLabel = ref(config.value.label);
const announcedText = computed(() => announcedLabel.value ? `Password strength: ${announcedLabel.value}` : '');

function announce() {
  announcedLabel.value = config.value.label;
}

defineExpose({ announce });
</script>

<template>
  <Transition name="sft-fade">
    <div v-if="password" :data-testid="dataTestid" class="sft-strength" aria-hidden="true">
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
  </Transition>
  <span
    class="sft-sr-only"
    aria-live="polite"
    :data-testid="dataTestid ? `${dataTestid}-strength-announcement` : undefined"
  >{{ announcedText }}</span>
</template>
