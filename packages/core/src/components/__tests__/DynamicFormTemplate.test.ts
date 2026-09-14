import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DynamicFormTemplate from '@/components/DynamicFormTemplate.vue';
import { defineMetadata } from '@/core/defineMetadata';

// Standalone unit tests of DynamicFormTemplate.vue's slot-resolution (typeWithFallback), mounted
// directly (not through TestForm/TestFormTemplate) so each test controls exactly which slots are
// defined. This is the only way to exercise all three tiers of the new *-choice-item fallback
// chain without adding slot-priority permutations to the shared TestFormTemplate.vue fixture
// (flagged by ST-01's QA plan as the suite's highest-risk touchpoint). See ST-02's QA plan for
// the full rationale; accepted on adversarial review.

const metadata = defineMetadata<{ text: string }>();

// The component's entire render is gated by `v-if="attrs.fieldMetadata"` (DynamicFormTemplate.vue),
// so every mount below must supply a truthy fieldMetadata attr, or all three fallback tiers would
// render empty and a "falls back to default" assertion would pass vacuously instead of actually
// exercising typeWithFallback (adversarial-review finding 1, routed as a PROPOSED edit and applied here).
function mountTemplate(type: string, slots: Record<string, string>) {
  return mount(DynamicFormTemplate, {
    props: {
      metadataConfiguration: metadata as any,
    },
    attrs: {
      type,
      fieldMetadata: { path: 'field', type: 'text' },
    },
    slots: slots as any,
  });
}

describe('component DynamicFormTemplate — slot fallback priority', () => {
  describe('*-choice-item / default-choice-item fallback chain (ST-02, AC6)', () => {
    it('renders the dedicated per-type slot when both it and default-choice-item are defined', () => {
      const wrapper = mountTemplate('text-choice-item', {
        'text-choice-item': '<div data-testid="dedicated" />',
        'default-choice-item': '<div data-testid="fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="dedicated"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="fallback"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('renders default-choice-item when only that fallback is defined', () => {
      const wrapper = mountTemplate('text-choice-item', {
        'default-choice-item': '<div data-testid="fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="fallback"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('falls back to default when neither the dedicated slot nor default-choice-item is defined', () => {
      const wrapper = mountTemplate('text-choice-item', {
        default: '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
    });
  });

  // Regression guard: a misplaced -choice-item branch could shadow an existing dispatch family.
  describe('regression — the other dispatch families are not shadowed by -choice-item', () => {
    it('-array still resolves to default-array', () => {
      const wrapper = mountTemplate('text-array', {
        'default-array': '<div data-testid="array" />',
        'default': '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="array"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('-array-item still resolves to default-array-item', () => {
      const wrapper = mountTemplate('text-array-item', {
        'default-array-item': '<div data-testid="array-item" />',
        'default': '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="array-item"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('-choice still resolves to default-choice', () => {
      const wrapper = mountTemplate('text-choice', {
        'default-choice': '<div data-testid="choice" />',
        'default': '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="choice"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('a plain (non-suffixed) type still resolves to default', () => {
      const wrapper = mountTemplate('text', {
        default: '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
    });
  });

  // Pre-existing gap this story's new standalone-mount pattern also closes for the sibling
  // -input/-array/-choice tiers (the shared TestFormTemplate.vue fixture always defines their
  // default-* fallback slot, so the "neither defined, falls all the way to default" side of these
  // three ternaries was never exercised anywhere in the suite before this file existed).
  describe('falls back all the way to default when the tier-specific default-* slot is absent too', () => {
    it('-input falls back to default when default-input is not defined', () => {
      const wrapper = mountTemplate('text-input', {
        default: '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
    });

    it('-array falls back to default when default-array is not defined', () => {
      const wrapper = mountTemplate('text-array', {
        default: '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
    });

    it('-choice falls back to default when default-choice is not defined', () => {
      const wrapper = mountTemplate('text-choice', {
        default: '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
    });
  });
});
