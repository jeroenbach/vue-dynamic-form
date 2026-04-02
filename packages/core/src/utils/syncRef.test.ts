import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { syncRef } from '@/utils/syncRef';

describe('syncRef', () => {
  describe('no infinite loops', () => {
    it('does not loop when a changes', () => {
      const a = ref(0);
      const b = ref(0);
      syncRef(a, b);

      a.value = 1;

      expect(a.value).toBe(1);
      expect(b.value).toBe(1);
    });

    it('does not loop when b changes', () => {
      const a = ref(0);
      const b = ref(0);
      syncRef(a, b);

      b.value = 2;

      expect(a.value).toBe(2);
      expect(b.value).toBe(2);
    });
  });

  describe('bidirectional sync', () => {
    it('syncs a → b when a changes', () => {
      const a = ref(1);
      const b = ref(0);
      syncRef(a, b);

      a.value = 42;

      expect(b.value).toBe(42);
    });

    it('syncs b → a when b changes', () => {
      const a = ref(1);
      const b = ref(0);
      syncRef(a, b);

      b.value = 99;

      expect(a.value).toBe(99);
    });

    it('syncs master (a) to slave (b) on setup when master has a value', () => {
      const a = ref(1);
      const b = ref<number | undefined>(undefined);
      syncRef(a, b);

      expect(a.value).toBe(1);
      expect(b.value).toBe(1);
    });

    it('syncs slave (b) to master (a) on setup when only slave has a value', () => {
      const a = ref<number | undefined>(undefined);
      const b = ref(2);
      syncRef(a, b);

      expect(a.value).toBe(2);
      expect(b.value).toBe(2);
    });

    it('master (a) wins on setup when both have a value', () => {
      const a = ref(1);
      const b = ref(2);
      syncRef(a, b);

      expect(a.value).toBe(1);
      expect(b.value).toBe(1);
    });

    it('does nothing on setup when neither has a value', () => {
      const a = ref<number | undefined>(undefined);
      const b = ref<number | undefined>(undefined);
      syncRef(a, b);

      expect(a.value).toBeUndefined();
      expect(b.value).toBeUndefined();
    });
  });

  describe('master: a (default)', () => {
    it('a wins when both change in the same tick and a changes last', () => {
      const a = ref<string | number>(0);
      const b = ref<string | number>(0);
      syncRef(a, b);

      b.value = 'slave';
      a.value = 'master';

      expect(a.value).toBe('master');
      expect(b.value).toBe('master');
    });

    it('b propagates to a when only b changes', () => {
      const a = ref(0);
      const b = ref(0);
      syncRef(a, b);

      b.value = 99;

      expect(a.value).toBe(99);
      expect(b.value).toBe(99);
    });
  });

  describe('master: b', () => {
    it('b wins when both change in the same tick and b changes last', () => {
      const a = ref<string | number>(0);
      const b = ref<string | number>(0);
      syncRef(a, b, { master: 'b' });

      a.value = 'slave';
      b.value = 'master';

      expect(a.value).toBe('master');
      expect(b.value).toBe('master');
    });

    it('a propagates to b when only a changes', () => {
      const a = ref(0);
      const b = ref(0);
      syncRef(a, b, { master: 'b' });

      a.value = 42;

      expect(a.value).toBe(42);
      expect(b.value).toBe(42);
    });
  });
});
