<script lang="ts" setup>
import type { AppIconName } from './AppIcon.vue';
import type { Props as SectionCardProps } from './SectionCard.vue';
import { computed, ref } from 'vue';
import AppIcon from './AppIcon.vue';
import ChoiceCard from './ChoiceCard.vue';
import SectionCard from './SectionCard.vue';

export interface ChoiceOption {
  value: string
  title?: string
  description?: string
  icon?: AppIconName
}

export interface Props extends /* @vue-ignore */ SectionCardProps {
  options?: ChoiceOption[]
}

const { options } = defineProps<Props>();
const emits = defineEmits<{ select: [key: string] }>();
const selectedOption = ref(options?.[0]?.value);

const gridCols = computed(() => {
  const n = options?.length ?? 0;
  if (n % 3 === 0)
    return 'md:grid-cols-3';
  if (n % 2 === 0)
    return 'md:grid-cols-2';
  return 'md:grid-cols-1';
});
function changeSelectedOption(value: string) {
  selectedOption.value = value;
  emits('select', value);
}
</script>

<template>
  <SectionCard v-bind="$props">
    <div class="grid grid-cols-1 gap-3 md:col-span-2" :class="gridCols" role="radiogroup">
      <ChoiceCard
        v-for="option in options"
        :key="option.value"
        :title="option.title"
        :description="option.description"
        :selected="selectedOption === option.value"
        @select="changeSelectedOption(option.value)"
      >
        <template v-if="option.icon" #icon>
          <AppIcon :name="option.icon" />
        </template>
      </ChoiceCard>
    </div>

    <slot :selectedOption />
  </SectionCard>
</template>
