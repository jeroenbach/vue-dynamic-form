<script lang="ts" setup>
import { StarterIcon, starterIconNames } from '@bach.software/vue-dynamic-form-starter';
import '@bach.software/vue-dynamic-form-starter/style.css';
</script>

<template>
  <section style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1.5rem; max-width: 56rem; margin: 2rem auto;">
    <div v-for="name in starterIconNames" :key="name" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
      <StarterIcon :name="name" :size="24" />
      <span style="font-size: 0.75rem;">{{ name }}</span>
    </div>
  </section>
</template>
