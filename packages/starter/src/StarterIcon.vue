<script lang="ts">
import type { PropType } from 'vue';
import type { StarterIconName } from '@/icons';
import { defineComponent, h, inject } from 'vue';
import { iconOverrideKey } from '@/iconOverride';
import { registry } from '@/icons';

export default defineComponent({
  name: 'StarterIcon',
  props: {
    name: { type: String as PropType<StarterIconName>, required: true },
    size: { type: Number, default: 16 },
    strokeWidth: { type: Number, default: 2 },
  },
  setup(props) {
    const override = inject(iconOverrideKey, undefined);

    return () => {
      const { name, size, strokeWidth } = props;

      if (override) {
        const rendered = override({ name, size, strokeWidth }) ?? null;
        if (!rendered)
          return null;
        // A consumer's override markup may not forward attrs itself, so wrap it
        // in a host that always receives fall-through attrs such as a spin class.
        return h('span', { class: 'sft-icon-host' }, [rendered as any]);
      }

      const component = registry[name as StarterIconName];
      if (!component) {
        if (import.meta.env.DEV)
          console.warn(`StarterIcon: unknown icon name "${name}"`);
        return null;
      }

      return h(component, {
        size,
        strokeWidth,
        'stroke': 'currentColor',
        'aria-hidden': 'true',
      });
    };
  },
});
</script>
