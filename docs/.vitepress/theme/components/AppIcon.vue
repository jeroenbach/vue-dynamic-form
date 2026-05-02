<script lang="ts" setup>
export type AppIconName = 'chevronLeft' | 'chevronRight' | 'check' | 'bin' | 'plus' | 'bolt' | 'users' | 'grid' | 'edit' | 'checkCircle' | 'spinner' | 'refresh';

withDefaults(defineProps<{ name: AppIconName; size?: number }>(), { size: 16 });
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline v-if="name === 'chevronLeft'" points="15 18 9 12 15 6" />
    <polyline v-else-if="name === 'chevronRight'" points="9 18 15 12 9 6" />
    <polyline v-else-if="name === 'check'" points="20 6 9 17 4 12" />
    <template v-else-if="name === 'bin'">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
    </template>
    <template v-else-if="name === 'plus'">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </template>
    <polyline v-else-if="name === 'bolt'" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    <template v-else-if="name === 'users'">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </template>
    <template v-else-if="name === 'grid'">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </template>
    <template v-else-if="name === 'edit'">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </template>
    <template v-else-if="name === 'checkCircle'">
      <circle cx="12" cy="12" r="10" />
      <polyline points="16 10 11 15 8 12" />
    </template>
    <path v-else-if="name === 'spinner'" d="M21 12a9 9 0 1 1-6.219-8.56" />
    <template v-else-if="name === 'refresh'">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </template>
  </svg>
</template>
