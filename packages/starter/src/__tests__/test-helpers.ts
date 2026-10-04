import type { ComponentMountingOptions } from '@vue/test-utils';
import type { IconOverride } from '@/iconOverride';
import { mount } from '@vue/test-utils';
import { iconOverrideKey } from '@/iconOverride';
import StarterIcon from '@/StarterIcon.vue';

/** Mounts `StarterIcon` with the internal icon-override key pre-provided, the same way `StarterFormTemplate` provides it from its captured `#icon` slot. */
export function mountWithIconOverride(
  override: IconOverride,
  props: ComponentMountingOptions<typeof StarterIcon>['props'] = { name: 'chevronLeft' },
) {
  return mount(StarterIcon, {
    props,
    global: {
      provide: {
        [iconOverrideKey]: override,
      },
    },
  });
}
