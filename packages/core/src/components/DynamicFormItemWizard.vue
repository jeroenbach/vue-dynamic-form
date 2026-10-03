<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { ComputedRef } from 'vue';
import type { LimitedFieldContext } from '@/components/DynamicFormTemplate.vue';
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import type { FieldMetadata, WizardGotoStepOptions } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { useField } from 'vee-validate';
import { computed, inject, ref } from 'vue';
import DynamicFormItem from '@/components/DynamicFormItem.vue';
import { useValidatePartialForm } from '@/core/useValidatePartialForm';
import { dynamicFormSettingsKey } from '@/types/DynamicFormSettings';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';
import { normalizePath } from '@/utils/normalizePath';
import { overridePath } from '@/utils/overridePath';

// #region Interfaces
export interface Emit {
  /** Bubbled up from a page's own value changes; payload is unused (a wizard has no leaf value of its own). */
  (e: 'update:modelValue', value: unknown): void
  /** Bubbled up from child `DynamicFormItem` instances; carries the updated computed field metadata. */
  (e: 'update:computedField', field: InternalFieldMetadata<FieldMetadata>): void
}
type Props = DynamicFormItemProps<InternalMetadata>;
// #endregion

// #region Props, Emits and inject
const props = defineProps<Props>();
const emits = defineEmits<Emit>();
const settings = inject<ComputedRef<DynamicFormSettings>>(dynamicFormSettingsKey);
const { validateSection } = useValidatePartialForm();
// #endregion

// #region Computed state

const field = computed(() => props.fieldMetadata);

const path = computed(() => overridePath(field.value?.path ?? '', props.pathOverride));
const normalizedPath = computed(() => normalizePath(path.value));

// Anchors a LimitedFieldContext (label/errors) at the wizard's own path, mirroring how
// DynamicFormItemChoice anchors its own useField call at the same path its owning DynamicFormItem
// already registered. No validation rules of its own: the wizard's requiredness is already
// validated by the owning DynamicFormItem's own combinedValidation.
const { errors, errorMessage, value } = useField(normalizedPath, undefined, field.value?.fieldOptions);
const fieldContext: LimitedFieldContext = { label: field.value?.fieldOptions?.label, errors, errorMessage, value: computed(() => undefined) };

// A non-empty choice or a maxOccurs > 1 alongside wizard is inert: pages come from children only.
// The node explicitly opted into being a wizard, so that reading always wins; a genuine choice of
// wizards or a repeated wizard is expressed instead by nesting wizard: true nodes inside a plain
// choice branch or an array item's children.
if (import.meta.env.DEV && field.value?.choice?.length) {
  console.warn(`[DynamicFormItemWizard] "${field.value.path}": "choice" is ignored on a wizard node; wizard pages come from "children" only.`);
}
// Always warned, not just in dev: rendering a single occurrence for maxOccurs > 1 silently
// drops data for XSD-derived or generated metadata, so production needs the signal too.
if ((field.value?.maxOccurs ?? 1) > 1) {
  console.warn(`[DynamicFormItemWizard] "${field.value.path}": "maxOccurs" is ignored on a wizard node; wizard pages come from "children" only.`);
}

const pages = computed(() => field.value?.children ?? []);
const pageCount = computed(() => pages.value.length);

// Static wizard configuration, captured once at setup (mirrors explicitChoiceSelection):
// `wizard` is excluded from ComputedPropsFieldType, so this can never change mid-form.
const wizardConfig = (() => {
  const raw = props.fieldMetadata?.wizard;
  const config = typeof raw === 'object' && raw !== null ? raw : {};
  return {
    allowForwardJump: config.allowForwardJump === true,
    // Defaults on: forward movement runs validation so page errors surface. `false` opts into a
    // silent jump. Only meaningful when the move does not block (non-linear mode or a jump);
    // linear `next` always validates because it needs the result to decide whether to block.
    validateOnJump: config.validateOnJump !== false,
  };
})();

const currentStepIndex = ref(0);
const isValidating = ref(false);

const isFirst = computed(() => currentStepIndex.value === 0);
// A wizard with no pages has nothing to navigate to: treated as both first and last so no
// "next" affordance is offered, rather than degenerating to isLast: false (0 === -1).
const isLast = computed(() =>
  pageCount.value === 0 ? true : currentStepIndex.value === pageCount.value - 1);

// minOccurs/maxOccurs still govern required/disabled on the wizard node itself; maxOccurs is
// only inert for page derivation, not for the ordinary "disable this whole field" meaning of 0.
const minOccurs = computed(() =>
  props.minOccursOverride !== undefined ? props.minOccursOverride : (field.value?.minOccurs ?? 1));
const maxOccurs = computed(() =>
  props.maxOccursOverride !== undefined ? props.maxOccursOverride : (field.value?.maxOccurs ?? 1));
const disabled = computed(() => maxOccurs.value === 0);
const required = computed(() => minOccurs.value >= 1 && !disabled.value);

// Propagate optional/disabled state to the pages, exactly like a plain parent group: an
// untouched optional wizard must not demand its required page fields, and a disabled wizard
// disables its pages too.
const _minOccursOverride = computed(() => {
  // An ancestor already relaxed the subtree: keep propagating it.
  if (props.minOccursOverride === 0)
    return 0;

  // The wizard itself is required: pages keep their own requirements.
  if (minOccurs.value > 0)
    return undefined;

  // Optional and untouched: pages stay optional. Once any value exists, page requirements apply.
  return checkTreeHasValue(value.value) ? undefined : 0;
});
const _maxOccursOverride = computed(() =>
  maxOccurs.value === 0 ? 0 : undefined,
);

// #endregion

// #region Navigation

/** The current page's vee-validate path, read from the corrected metadata tree, never re-derived. */
function currentPagePath(): string | undefined {
  const page = pages.value[currentStepIndex.value];
  return page?.path ? overridePath(page.path, props.pathOverride) : undefined;
}

async function validateCurrentPage(): Promise<boolean> {
  const sectionPath = currentPagePath();
  if (!sectionPath)
    return true;

  isValidating.value = true;
  try {
    const result = await validateSection(sectionPath);
    return result.valid;
  }
  finally {
    isValidating.value = false;
  }
}

async function next() {
  if (pageCount.value === 0 || isLast.value)
    return;

  // Non-linear wizard: identical policy to a forward jump, so it lives in one place.
  if (wizardConfig.allowForwardJump)
    return gotoStep(currentStepIndex.value + 1);

  // Linear wizard: the current page must be valid before advancing. Validation is async, so
  // re-check that no other navigation landed meanwhile (e.g. a double click); a blind
  // increment could skip a page's validation or run past the last page.
  const from = currentStepIndex.value;
  if (await validateCurrentPage() && currentStepIndex.value === from)
    currentStepIndex.value = from + 1;
}

function prev() {
  if (pageCount.value === 0 || currentStepIndex.value === 0)
    return;

  currentStepIndex.value--;
}

async function gotoStep(index: number, options?: WizardGotoStepOptions) {
  if (pageCount.value === 0)
    return;

  const target = Math.min(Math.max(index, 0), pageCount.value - 1);
  const from = currentStepIndex.value;
  if (target === from)
    return;

  // Backward jumps are always free and silent. Forward jumps require the non-linear opt-in, then
  // surface page errors (unless silenced) without blocking, mirroring next().
  if (target > from) {
    const allowForwardJump = options?.allowForwardJump ?? wizardConfig.allowForwardJump;
    if (!allowForwardJump)
      return;

    const validateOnJump = options?.validateOnJump ?? wizardConfig.validateOnJump;
    if (validateOnJump) {
      await validateCurrentPage();
      // Another navigation landed while validating: the first one wins.
      if (currentStepIndex.value !== from)
        return;
    }
  }

  currentStepIndex.value = target;
}

// #endregion

// #region Methods

function onChildComputedFieldUpdate(childField: InternalFieldMetadata<FieldMetadata>) {
  emits('update:computedField', childField);
}

// The wizard re-renders on every navigation (currentStepIndex lives here), and Vue builds a fresh
// slot-scope object per render even when the template's <slot> bindings are unchanged. Forwarding
// that fresh object as :slotProps would change every page child's prop identity and re-render all
// mounted fields on each step change. This cache keeps the previous scope object alive while its
// contents are shallow-equal, so children only re-render when a bound value actually changed.
// Deliberately non-reactive: the slot function re-runs on exactly the renders where a new scope
// could appear, so plain Map reads during render always see the latest comparison result.
const slotScopeCache = new Map<string, Record<string, unknown>>();

function stableSlotProps(cacheKey: string, scope: object | undefined): object {
  const current = (scope ?? {}) as Record<string, unknown>;
  const previous = slotScopeCache.get(cacheKey);
  if (previous && shallowEqual(previous, current))
    return previous;

  slotScopeCache.set(cacheKey, current);
  return current;
}

function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return aKeys.length === bKeys.length && aKeys.every(key => Object.is(a[key], b[key]));
}

// #endregion
</script>

<template>
  <component
    :is="template"
    :type="`${fieldMetadata.type}-wizard`"
    :field-metadata
    :field-context
    :slot-props
    :settings
    :required
    :disabled
    :index
    :can-add-items
    :can-remove-items
    :add-item
    :remove-item
    :current-step-index
    :pages
    :page-count
    :is-first
    :is-last
    :is-validating
    :wizard-config="wizardConfig"
    :next
    :prev
    :goto-step
  >
    <template #default="wizardScope">
      <template v-for="(page, pageIndex) in pages" :key="page.path">
        <component
          :is="template"
          :type="`${page.type}-wizard-page`"
          :field-metadata="page"
          :field-context
          :slot-props="stableSlotProps('wizard', wizardScope)"
          :settings
          :required="false"
          :disabled="false"
          :index="pageIndex"
          :is-current="pageIndex === currentStepIndex"
          :page-index
          :current-step-index
          :is-first
          :is-last
          :wizard-config="wizardConfig"
          :next
          :prev
          :goto-step
        >
          <template #default="pageScope">
            <DynamicFormItem
              :field-metadata="(page as InternalMetadata)"
              :path-override
              :index="pageIndex"
              :template
              :slot-props="stableSlotProps(`page:${page.path}`, pageScope)"
              :min-occurs-override="_minOccursOverride"
              :max-occurs-override="_maxOccursOverride"

              @update:model-value="emits('update:modelValue', $event)"
              @update:computed-field="onChildComputedFieldUpdate"
            />
          </template>
        </component>
      </template>
    </template>
  </component>
</template>
