import type { ActiveChoiceOccurrence, ChoiceOption } from '@/ChoiceSectionCard.vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import ChoiceSectionCard from '@/ChoiceSectionCard.vue';
import { focusElement as focus } from './choice.test-helpers';

/**
 * Mounts behind a reactive host so a selection made through `addChoiceOccurrence` actually
 * flows back into `activeChoiceOccurrences`, matching how the real engine wires the two.
 */
function mountRoving(options: ChoiceOption[], initialActive: ActiveChoiceOccurrence[] = []) {
  const active = ref(initialActive);
  const addChoiceOccurrence = vi.fn((value: string) => {
    active.value = [{ branchKey: value, index: 0 }];
  });
  const Host = defineComponent({
    setup() {
      return () => h(ChoiceSectionCard, {
        options,
        activeChoiceOccurrences: active.value,
        addChoiceOccurrence,
      });
    },
  });
  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, addChoiceOccurrence, active, cards: () => wrapper.findAll('.sft-choice-card') };
}

const threeOptions: ChoiceOption[] = [
  { value: 'a', title: 'Alpha' },
  { value: 'b', title: 'Beta' },
  { value: 'c', title: 'Gamma' },
];

describe('component ChoiceSectionCard - roving tabindex', () => {
  it('seats exactly one Tab stop on the first card when nothing is selected', () => {
    const { cards } = mountRoving(threeOptions);

    expect(cards()[0].attributes('tabindex')).toBe('0');
    expect(cards()[1].attributes('tabindex')).toBe('-1');
    expect(cards()[2].attributes('tabindex')).toBe('-1');
  });

  it('seats the Tab stop on the selected card instead of the first one', () => {
    const { cards } = mountRoving(threeOptions, [{ branchKey: 'b', index: 0 }]);

    expect(cards()[0].attributes('tabindex')).toBe('-1');
    expect(cards()[1].attributes('tabindex')).toBe('0');
    expect(cards()[2].attributes('tabindex')).toBe('-1');
  });

  it('moves focus, the Tab stop, and selection to the next card on ArrowRight', async () => {
    const { cards, addChoiceOccurrence } = mountRoving(threeOptions);

    focus(cards()[0]);
    await cards()[0].trigger('keydown.right');

    expect(document.activeElement).toBe(cards()[1].element);
    expect(cards()[1].attributes('tabindex')).toBe('0');
    expect(cards()[0].attributes('tabindex')).toBe('-1');
    expect(addChoiceOccurrence).toHaveBeenCalledWith('b');

    // Roles, aria-checked, and the ring-dependent class surface stay untouched by the move.
    expect(cards()[1].attributes('role')).toBe('radio');
    expect(cards()[1].attributes('aria-checked')).toBe('true');
    expect(cards()[0].attributes('aria-checked')).toBe('false');
    expect(cards()[1].classes()).toContain('sft-choice-card');
    expect(cards()[1].classes()).toContain('is-selected');
    expect(cards()[1].attributes('style')).toBeUndefined();
  });

  it('moves focus and selection to the next card on ArrowDown', async () => {
    const { cards, addChoiceOccurrence } = mountRoving(threeOptions);

    focus(cards()[0]);
    await cards()[0].trigger('keydown.down');

    expect(document.activeElement).toBe(cards()[1].element);
    expect(addChoiceOccurrence).toHaveBeenCalledWith('b');
  });

  it('wraps from the first card to the last on ArrowLeft and ArrowUp', async () => {
    const left = mountRoving(threeOptions);
    focus(left.cards()[0]);
    await left.cards()[0].trigger('keydown.left');
    expect(document.activeElement).toBe(left.cards()[2].element);
    expect(left.cards()[2].attributes('tabindex')).toBe('0');
    expect(left.cards()[0].attributes('tabindex')).toBe('-1');

    const up = mountRoving(threeOptions);
    focus(up.cards()[0]);
    await up.cards()[0].trigger('keydown.up');
    expect(document.activeElement).toBe(up.cards()[2].element);
  });

  it('wraps from the last card back to the first on ArrowRight and ArrowDown', async () => {
    const right = mountRoving(threeOptions);
    focus(right.cards()[2]);
    await right.cards()[2].trigger('keydown.right');
    expect(document.activeElement).toBe(right.cards()[0].element);

    const down = mountRoving(threeOptions);
    focus(down.cards()[2]);
    await down.cards()[2].trigger('keydown.down');
    expect(document.activeElement).toBe(down.cards()[0].element);
  });

  it('skips a disabled card when roving and never seats it as the Tab stop', async () => {
    const withDisabled: ChoiceOption[] = [
      { value: 'a', title: 'A' },
      { value: 'b', title: 'B', disabled: true },
      { value: 'c', title: 'C' },
      { value: 'd', title: 'D' },
    ];
    const { cards } = mountRoving(withDisabled);

    expect(cards()[0].attributes('tabindex')).toBe('0');
    expect(cards()[1].attributes('tabindex')).toBe('-1');

    focus(cards()[0]);
    await cards()[0].trigger('keydown.right');
    expect(document.activeElement).toBe(cards()[2].element);
    expect(cards()[1].attributes('tabindex')).toBe('-1');

    await cards()[2].trigger('keydown.right');
    expect(document.activeElement).toBe(cards()[3].element);
    expect(cards()[1].attributes('tabindex')).toBe('-1');

    await cards()[3].trigger('keydown.right');
    expect(document.activeElement).toBe(cards()[0].element);
    expect(cards()[1].attributes('tabindex')).toBe('-1');

    // Approach the disabled card from the other direction too.
    await cards()[0].trigger('keydown.left');
    expect(document.activeElement).toBe(cards()[3].element);
    await cards()[3].trigger('keydown.left');
    expect(document.activeElement).toBe(cards()[2].element);
    await cards()[2].trigger('keydown.left');
    expect(document.activeElement).toBe(cards()[0].element);
    expect(cards()[1].attributes('tabindex')).toBe('-1');
  });

  it('has no Tab stop and ignores arrow keys when every card is disabled', async () => {
    const allDisabled: ChoiceOption[] = [
      { value: 'a', title: 'A', disabled: true },
      { value: 'b', title: 'B', disabled: true },
    ];
    const { cards, addChoiceOccurrence } = mountRoving(allDisabled);

    expect(cards().some(card => card.attributes('tabindex') === '0')).toBe(false);

    focus(cards()[0]);
    await cards()[0].trigger('keydown.right');

    expect(addChoiceOccurrence).not.toHaveBeenCalled();
  });

  it('leaves a single enabled card as a no-op Tab stop for arrow keys', async () => {
    const singleEnabled: ChoiceOption[] = [
      { value: 'a', title: 'A' },
      { value: 'b', title: 'B', disabled: true },
    ];
    const { cards, addChoiceOccurrence } = mountRoving(singleEnabled);

    expect(cards()[0].attributes('tabindex')).toBe('0');

    focus(cards()[0]);
    await cards()[0].trigger('keydown.right');

    expect(document.activeElement).toBe(cards()[0].element);
    expect(addChoiceOccurrence).not.toHaveBeenCalled();
  });

  it('seats the Tab stop on the first enabled card when the first card is disabled', () => {
    const firstDisabled: ChoiceOption[] = [
      { value: 'a', title: 'A', disabled: true },
      { value: 'b', title: 'B' },
    ];
    const { cards } = mountRoving(firstDisabled);

    expect(cards()[0].attributes('tabindex')).toBe('-1');
    expect(cards()[1].attributes('tabindex')).toBe('0');
  });
});
