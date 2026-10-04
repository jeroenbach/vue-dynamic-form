import type { TimelineItem } from '@/SubmissionSuccess.vue';

/** One finished step and one still in progress, the shape used across the success screen tests. */
export function timelineItems(): TimelineItem[] {
  return [
    { id: 'received', label: 'Request received', status: 'done' },
    { id: 'invite', label: 'Invitation pending', status: 'pending' },
  ];
}

export const emptyTimelineItems: TimelineItem[] = [];
