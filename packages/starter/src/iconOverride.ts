import type { InjectionKey } from 'vue';
import type { StarterIconName } from '@/icons';

export interface IconOverrideProps {
  name: StarterIconName | string
  size: number
  strokeWidth: number
}

export type IconOverride = (props: IconOverrideProps) => unknown;

/**
 * Internal provide/inject key linking a template's captured `#icon` slot
 * to every `StarterIcon` instance beneath it. Not part of the public API:
 * the slot is the contract, this key is just how it is threaded down.
 */
export const iconOverrideKey: InjectionKey<IconOverride | undefined> = Symbol('starterIconOverride');
