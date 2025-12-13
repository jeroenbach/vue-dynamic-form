<script lang="ts" setup>
interface Props {
  icon: 'plus' | 'minus'
  color?: 'blue' | 'red'
}
interface Emits {
  (e: 'click'): void
}
const {
  icon,
  color = 'blue',
} = defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <button
    class="cursor-pointer inline-flex items-center justify-center rounded-full size-5 text-white-800"
    :class="{
      'bg-blue-200 hover:bg-blue-300': color === 'blue',
      'bg-red-200 hover:bg-red-300': color === 'red',
    }"
    @click="$emit('click')"
  >
    <svg v-if="icon === 'plus'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
    <svg v-if="icon === 'minus'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
    </svg>
  </button>
</template>
