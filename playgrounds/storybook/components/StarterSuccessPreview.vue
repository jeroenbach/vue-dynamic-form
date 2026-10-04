<script lang="ts" setup>
import type { TimelineItem } from '@bach.software/vue-dynamic-form-starter';
import { SubmissionSuccess } from '@bach.software/vue-dynamic-form-starter';
import '@bach.software/vue-dynamic-form-starter/style.css';

const timeline: TimelineItem[] = [
  { id: 'received', label: 'Request received', status: 'done' },
  { id: 'reviewed', label: 'Team reviewed submission', status: 'done' },
  { id: 'invite', label: 'Invitation pending', status: 'pending' },
];
</script>

<template>
  <section style="max-width: 32rem; margin: 2rem auto;">
    <SubmissionSuccess
      title="Onboarding submitted"
      referenceCode="REQ-20481"
      timelineTitle="What happens next"
      :timeline="timeline"
      submittedJson="{ &quot;company&quot;: &quot;Acme&quot; }"
      dataTestid="success-preview"
    />
  </section>
</template>
