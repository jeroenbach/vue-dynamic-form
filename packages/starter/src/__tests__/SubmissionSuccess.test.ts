import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { iconOverrideKey } from '@/iconOverride';
import StarterIcon from '@/StarterIcon.vue';
import SubmissionSuccess from '@/SubmissionSuccess.vue';
import { emptyTimelineItems, timelineItems } from './fixtures/timelineItems';

describe('component SubmissionSuccess', () => {
  it('renders the hero, timeline, and actions chrome', () => {
    const wrapper = mount(SubmissionSuccess, {
      props: {
        title: 'Onboarding submitted',
        referenceCode: 'ONB-2026-0417',
        timelineTitle: 'What happens next',
        timeline: timelineItems(),
        dataTestid: 'success',
      },
    });

    expect(wrapper.find('.sft-success-hero').exists()).toBe(true);
    expect(wrapper.find('.sft-success-badge').exists()).toBe(true);
    expect(wrapper.find('.sft-success-title').text()).toBe('Onboarding submitted');
    expect(wrapper.find('.sft-success-ref').text()).toContain('ONB-2026-0417');
    expect(wrapper.find('.sft-timeline').exists()).toBe(true);
    expect(wrapper.find('.sft-timeline-title').text()).toBe('What happens next');
    expect(wrapper.findAll('.sft-timeline-dot')).toHaveLength(2);
  });

  it('renders the done item with a static check glyph and the pending item with a spinning loader', () => {
    const wrapper = mount(SubmissionSuccess, { props: { timeline: timelineItems() } });

    const dots = wrapper.findAll('li');
    const doneIcon = dots[0].findComponent(StarterIcon);
    const pendingIcon = dots[1].findComponent(StarterIcon);

    expect(doneIcon.props('name')).toBe('checkCircle');
    expect(doneIcon.classes()).not.toContain('sft-spin');
    expect(pendingIcon.props('name')).toBe('loader');
    expect(pendingIcon.attributes('class')).toContain('sft-spin');
  });

  it('renders the hero without a timeline region when the timeline is empty', () => {
    const wrapper = mount(SubmissionSuccess, { props: { title: 'Done', timeline: emptyTimelineItems } });

    expect(wrapper.find('.sft-success-hero').exists()).toBe(true);
    expect(wrapper.find('.sft-timeline').exists()).toBe(false);
  });

  it('keeps the pending loader spinning when a consumer icon override is active', () => {
    const override = vi.fn(({ name }: { name: string }) => h('svg', { 'data-testid': `override-${name}` }));
    const wrapper = mount(SubmissionSuccess, {
      props: { timeline: timelineItems() },
      global: { provide: { [iconOverrideKey]: override } },
    });

    const pendingGlyph = wrapper.findAll('li')[1].find('[data-testid="override-loader"]');

    expect(pendingGlyph.exists()).toBe(true);
    expect(pendingGlyph.element.parentElement?.classList.contains('sft-spin')).toBe(true);
  });

  it('mounts standalone with no StarterFormTemplate ancestor and applies no wrapper class', () => {
    const wrapper = mount(SubmissionSuccess, { props: { title: 'Standalone' } });

    expect(wrapper.html()).not.toContain('sft-root');
  });
});
