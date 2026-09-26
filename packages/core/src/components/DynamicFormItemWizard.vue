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
const { errors, errorMessage } = useField(normalizedPath, undefined, field.value?.fieldOptions);
const fieldContext: LimitedFieldContext = { label: field.value?.fieldOptions?.label, errors, errorMessage, value: computed(() => undefined) };

// A non-empty choice or a maxOccurs > 1 alongside wizard is inert: pages come from children only.
// The node explicitly opted into being a wizard, so that reading always wins; a genuine choice of
// wizards or a repeated wizard is expressed instead by nesting wizard: true nodes inside a plain
// choice branch or an array item's children. Dev-only, matching DynamicFormItemChoice's warnings.
if (import.meta.env.DEV) {
  if (field.value?.choice?.length) {
    console.warn(`[DynamicFormItemWizard] "${field.value.path}": "choice" is ignored on a wizard node; wizard pages come from "children" only.`);
  }
  if ((field.value?.maxOccurs ?? 1) > 1) {
    console.warn(`[DynamicFormItemWizard] "${field.value.path}": "maxOccurs" is ignored on a wizard node; wizard pages come from "children" only.`);
  }
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
    validateOnJump: config.validateOnJump === true,
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

  if (await validateCurrentPage())
    currentStepIndex.value++;
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
  if (target === currentStepIndex.value)
    return;

  const allowForwardJump = options?.allowForwardJump ?? wizardConfig.allowForwardJump;
  if (target > currentStepIndex.value && !allowForwardJump)
    return;

  const validateOnJump = options?.validateOnJump ?? wizardConfig.validateOnJump;
  if (validateOnJump && !(await validateCurrentPage()))
    return;

  currentStepIndex.value = target;
}

// #endregion

// #region Methods

function onChildComputedFieldUpdate(childField: InternalFieldMetadata<FieldMetadata>) {
  emits('update:computedField', childField);
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
    :can-add-items="canAddItems"
    :can-remove-items="canRemoveItems"
    :add-item="addItem"
    :remove-item="removeItem"
    :current-step-index="currentStepIndex"
    :pages="pages"
    :page-count="pageCount"
    :is-first="isFirst"
    :is-last="isLast"
    :is-validating="isValidating"
    :next="next"
    :prev="prev"
    :goto-step="gotoStep"
  >
    <template #default>
      <template v-for="(page, pageIndex) in pages" :key="page.path">
        <component
          :is="template"
          :type="`${page.type}-wizard-page`"
          :field-metadata="page"
          :field-context
          :slot-props
          :settings
          :required="false"
          :disabled="false"
          :index="pageIndex"
          :is-current="pageIndex === currentStepIndex"
          :page-index="pageIndex"
          :current-step-index="currentStepIndex"
          :is-first="isFirst"
          :is-last="isLast"
          :next="next"
          :prev="prev"
          :goto-step="gotoStep"
        >
          <template #default>
            <DynamicFormItem
              :field-metadata="(page as InternalMetadata)"
              :path-override="pathOverride"
              :index="pageIndex"
              :template
              :slot-props

              @update:model-value="emits('update:modelValue', $event)"
              @update:computed-field="onChildComputedFieldUpdate"
            />
          </template>
        </component>
      </template>
    </template>
  </component>
</template>
