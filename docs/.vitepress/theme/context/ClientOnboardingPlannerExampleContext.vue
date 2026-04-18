<script setup lang="ts">
import type { LoadOptionsParams, OptionName, OptionStore, SelectOption } from '../components/ClientOnboardingPlannerExample.vue';
import { reactive } from 'vue';
import ClientOnboardingPlannerExample from '../components/ClientOnboardingPlannerExample.vue';

const optionStore = reactive<OptionStore>({
  industry: [],
  teamSize: [],
  role: [],
  trainingFormat: [],
});

const teamSizeOptionsByIndustry: Record<string, SelectOption[]> = {
  saas: [
    { key: '1-10', value: '1 to 10 people' },
    { key: '11-50', value: '11 to 50 people' },
    { key: '51-250', value: '51 to 250 people' },
  ],
  retail: [
    { key: '1-20', value: '1 to 20 store staff' },
    { key: '21-100', value: '21 to 100 store staff' },
    { key: '101-500', value: '101 to 500 store staff' },
  ],
  healthcare: [
    { key: 'clinic', value: 'Single clinic team' },
    { key: 'regional', value: 'Regional care team' },
    { key: 'network', value: 'Multi-site care network' },
  ],
  logistics: [
    { key: 'warehouse', value: 'Warehouse crew' },
    { key: 'multi-depot', value: 'Multi-depot operation' },
    { key: 'global', value: 'Global logistics team' },
  ],
};

/**
 * Simulate an external API.
 */
function loadOptions(optionName: OptionName, params?: LoadOptionsParams) {
  if (optionName === 'industry') {
    optionStore.industry = [
      { key: 'saas', value: 'SaaS' },
      { key: 'retail', value: 'Retail' },
      { key: 'healthcare', value: 'Healthcare' },
      { key: 'logistics', value: 'Logistics' },
    ];
    return;
  }

  if (optionName === 'teamSize') {
    const industry = params?.industry;

    optionStore.teamSize = industry ? (teamSizeOptionsByIndustry[industry] ?? []) : [];
    return;
  }

  if (optionName === 'role') {
    optionStore.role = [
      { key: 'admin', value: 'System admin' },
      { key: 'ops', value: 'Operations lead' },
      { key: 'finance', value: 'Finance owner' },
      { key: 'support', value: 'Support manager' },
    ];
    return;
  }

  optionStore.trainingFormat = [
    { key: 'remote', value: 'Remote workshop' },
    { key: 'onsite', value: 'On-site training' },
    { key: 'async', value: 'Recorded training' },
  ];
}
</script>

<template>
  <ClientOnboardingPlannerExample :option-store="optionStore" @load-options="loadOptions" />
</template>
