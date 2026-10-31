<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { GenericValidateFunction } from 'vee-validate';
import type { ComputedRef } from 'vue';
import type { FieldContext } from '@/components/DynamicFormTemplate.vue';
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import type { ComputedPropsFieldOf, FieldMetadata, ReadOnlyFieldOf } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { useField, useFieldValue, useFormContext, useSubmitCount } from 'vee-validate';
import { computed, inject, onBeforeUnmount, onMounted, ref, toValue, watch, watchEffect } from 'vue';
import DynamicFormItemArray from '@/components/DynamicFormItemArray.vue';
import DynamicFormItemChoice from '@/components/DynamicFormItemChoice.vue';
import DynamicFormItemWizard from '@/components/DynamicFormItemWizard.vue';
import { useIsValidationSuppressed } from '@/core/useIsValidationSuppressed';
import { dynamicFormSettingsKey } from '@/types/DynamicFormSettings';
import { buildRestrictionValidations } from '@/utils/buildRestrictionValidations';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';
import { createValidation } from '@/utils/createValidation';
import { deepCloneValue } from '@/utils/deepCloneValue';
import { deepEqual } from '@/utils/deepEqual';
import { hashField } from '@/utils/hashField';
import { normalizePath } from '@/utils/normalizePath';
import { overridePath } from '@/utils/overridePath';

// #region Interfaces
export interface Emit {
  /** Emitted by leaf input fields whenever their value changes; payload is the new field value. */
  (e: 'update:modelValue', value: unknown): void
  /** Forwarded from vee-validate's `handleBlur`; lets parent array/choice fields trigger validation on blur. */
  (e: 'blur', event?: Event | undefined, shouldValidate?: boolean | undefined): void
  /** Emitted on mount and whenever the field's computed hash changes, so the parent keeps `childFields` in sync. */
  (e: 'update:computedField', field: InternalFieldMetadata<FieldMetadata>): void
}
type Props = DynamicFormItemProps<InternalMetadata>;
// #endregion

// #region Props, Emits and inject
const props = defineProps<Props>();
const emits = defineEmits<Emit>();
const settings = inject<ComputedRef<DynamicFormSettings>>(dynamicFormSettingsKey);
// #endregion

// #region Internal tracking

// Plain variables (not reactive) to avoid triggering renders when measuring analytics.
// eslint-disable-next-line prefer-const
let _analytics_renderCount = 0;
let _analytics_constructValidationCount = 0;
let _analytics_fieldChangedCount = 0;
let _analytics_fieldComputeCount = 0;
let _analytics_valueChangedCount = 0;
let _analytics_notifyValueUpdateCount = 0;
let _analytics_subtreeValidateCount = 0;

// Detects non-idempotent writes inside computedProps that would cause an infinite recomputation
// loop. Loops that stay inside one reactive flush are already broken by Vue's own recursive-update
// guard; this one catches loops that self-perpetuate through async watchers (a compute whose write
// re-triggers itself a microtask later) and therefore never let the event loop turn. The counter
// resets on a macrotask and the limit is deliberately generous (matching Vue's recursion limit):
// input bursts faster than a macrotask (paste, autofill, IME, automated typing) can starve the
// reset timer, and a tight limit miscounted such legitimate once-per-update recomputes as a loop,
// killing the field's render effect on a false positive and freezing it with stale metadata.
const COMPUTE_LOOP_MAX = 100;
let _computeLoopCount = 0;
let _computeLoopResetTimer: ReturnType<typeof setTimeout> | undefined;

function assertNoComputeLoop(fieldPath: string) {
  _computeLoopCount++;

  if (_computeLoopResetTimer == null) {
    _computeLoopResetTimer = setTimeout(() => {
      _computeLoopCount = 0;
      _computeLoopResetTimer = undefined;
    }, 0);
  }
  if (_computeLoopCount > COMPUTE_LOOP_MAX) {
    throw new Error(
      `[DynamicFormItem] Possible infinite loop detected in computedProps for field "${fieldPath}". `
      + `computedProps recomputed more than ${COMPUTE_LOOP_MAX} times without the event loop turning. `
      + `Ensure value writes inside computedProps are idempotent (the same input always produces the same output).`,
    );
  }
}

// #endregion

// #region Computed state

// --- Path ---

const field = computed(() => {
  _analytics_fieldChangedCount++;
  return props.fieldMetadata;
});

const path = computed(() => {
  if (!field.value?.path)
    return '';

  return overridePath(field.value.path, props.pathOverride);
});

// If the field has attributes, it is treated as a complex type: the user-visible value lives
// at a nested property (e.g. `path['value']`) instead of directly at `path`.
const isComplexType = computed(() => field.value?.isComplexType || field.value?.attributes?.length);

// The path vee-validate binds to. For complex types we append the value property key
// using bracket notation so segment counting by '.' still works correctly.
const itemPath = computed(() => {
  let _path = path.value;
  if (isComplexType.value && _path) {
    const complexTypeValueProperty = settings?.value?.complexTypeValueProperty ?? 'value';
    _path = `${_path}['${complexTypeValueProperty}']`;
  }
  return _path;
});

const normalizedPath = computed(() => normalizePath(itemPath.value));

const isArray = computed(() => {
  if (props.isArrayOverride === 'array')
    return true;

  if (props.isArrayOverride === 'single')
    return false;

  return (field.value?.maxOccurs ?? 1) > 1;
});

// A choice-hosting field is rendered entirely by a nested DynamicFormItemChoice, which anchors
// its own vee-validate registration at this same path (a choice node has no path of its own).
// Read here, at setup time, rather than inside the "Field type flags" section below, because
// the useField call site right underneath needs it before that section runs.
const isChoice = computed(() => !!field.value?.choice?.length);

// --- Vee-Validate field context ---

// Initialized empty; populated by the watchEffect below.
// This indirection breaks a circular dependency:
//   combinedValidation → computedField → value → fieldContext → combinedValidation
const combinedValidation = ref<GenericValidateFunction[]>([]);

// Each field shape gets a different kind of field context (called synchronously during setup,
// so the vee-validate composables inside still bind to this component instance).
function createFieldContext(): FieldContext {
  // A choice-hosting field must not register its own useField here: the nested
  // DynamicFormItemChoice already registers one at the identical path, and vee-validate does not
  // merge two registrations sharing a path (only checkbox/radio get that treatment), so the one
  // registered first never cleanly unregisters when it unmounts. Its own restriction/validation
  // rules are folded into DynamicFormItemChoice's own validation instead; its value is read here
  // through the read-only accessor rather than owned by a second registration.
  if (isChoice.value)
    return { value: useFieldValue(normalizedPath) } as unknown as FieldContext;

  // An array field also skips useField: the nested DynamicFormItemArray owns the field array,
  // and its value arrives here through updateArrayValue instead.
  if (isArray.value)
    return { value: ref(undefined) } as FieldContext;

  // A regular field registers itself with vee-validate.
  return useField(normalizedPath, combinedValidation, {
    ...(field.value?.fieldOptions ?? {}),
    validateOnValueUpdate: false, // validation timing is owned by this component
  }) as FieldContext;
}

const fieldContext = createFieldContext();

const value = fieldContext.value;

// Used only to read the form-level keepValuesOnUnmount flag for the unmount cleanup below;
// DynamicFormItem is always a descendant of the useForm() call in useDynamicForm, so a plain
// useFormContext() resolves it here (unlike the same-instance quirk useValidatePartialForm has
// to guard against). keepValuesOnUnmount is deliberately left off vee-validate's public
// FormContext type, so it is read through a loosely typed access rather than a cast to a type
// that does not carry it.
const formContext = useFormContext() as { keepValuesOnUnmount?: boolean | (() => boolean) } | undefined;

const isValidationSuppressed = useIsValidationSuppressed(normalizedPath);

// Lazily evaluated — only computed when accessed, safe to use on deep field trees.
fieldContext.hasValue = computed(() => checkTreeHasValue(value.value));

// Apply the global validateOnBlur setting when shouldValidate is not explicitly provided.
const originalHandleBlur = fieldContext.handleBlur;
fieldContext.handleBlur = function (e?: Event | undefined, shouldValidate?: boolean | undefined) {
  shouldValidate = shouldValidate ?? settings?.value?.validateOnBlur;
  originalHandleBlur(e, shouldValidate);
  emits('blur', e, shouldValidate); // lets array fields know when a blur occurred
};

// Validation is handled in the value watcher; only pass through when explicitly requested.
const originalHandleChange = fieldContext.handleChange;
fieldContext.handleChange = function (e: unknown, shouldValidate?: boolean | undefined) {
  originalHandleChange(e, shouldValidate === true);
};

// --- Field type flags ---

const isWizard = computed(() => !!field.value?.wizard);
const isParent = computed(() => !!field.value?.children?.length);
// An input is any leaf field — not a repeating array, not a branching choice, not a parent group,
// and not a wizard (a wizard always has its own delegated rendering, even with no children yet).
const isInput = computed(() => !isArray.value && !isChoice.value && !isParent.value && !isWizard.value);

// --- Reactive field and dynamic state ---
const initialUpdate = ref(true);

/**
 * In case of an object, the useFieldValue() in vee-validate doesn't react on an update of a value of its children.
 * Therefore we keep track of an reactive value, that is updated by the children. That re-triggers reactivity
 */
const childValueReactivity = ref(0);

/**
 * Stores the latest computedField of each direct child, keyed by path.
 * Updated when a child emits update:computedField and the hash differs from the stored one.
 * When accessed inside a computedProps function, changes to child computed fields will
 * reactively re-trigger the parent's computedField computation.
 */
const childFields = ref<Record<string, ReadOnlyFieldOf<FieldMetadata>>>({});
const childFieldsArray = computed(() => Object.values(childFields.value));

const computedField = computed(() => {
  _analytics_fieldComputeCount++;
  assertNoComputeLoop(path.value);

  if (field.value?.computeOnChildValueChange === true) {
    void childValueReactivity.value; // subscribe to child value changes
  }

  const _computedField = (field.value?.computedProps ?? []).reduce(
    (field, compute) => {
      // We allow to transform the field metadata reactively based on the current value. In case the value is not
      // called upon in any of the computedProps, it will not be part of the reactivity that triggers a re-compute.
      // The childFieldsArray ref is passed so computedProps can subscribe to children's computed field changes.
      compute(field, value, childFieldsArray);
      return field;
    },
    { ...field.value, path: path.value } as ComputedPropsFieldOf<FieldMetadata>,
  );

  // Always restore our calculated path plus the static choice-selection flags, then the hash —
  // computedProps may read these but must not override them. Both flags are excluded from
  // ComputedPropsFieldType, so this only defends against an `as any` cast; restoring them keeps
  // the hash (and thus the render mode) stable if one is mutated that way.
  const _internalMetadata = _computedField as InternalMetadata;
  _internalMetadata.path = path.value;
  _internalMetadata.explicitChoiceSelection = field.value?.explicitChoiceSelection;
  _internalMetadata.preserveOnSwitch = field.value?.preserveOnSwitch;
  _internalMetadata.wizard = field.value?.wizard;
  _internalMetadata._hash = hashField(_internalMetadata);

  return _internalMetadata;
});

// --- Occurrence limits ---

// minOccurs determines how many times this field must appear at minimum.
const minOccurs = computed(() => {
  if (props.minOccursOverride !== undefined)
    return props.minOccursOverride;

  // Array items themselves control multiplicity; individual items are always optional.
  if (props.partOfArrayField)
    return 0;

  return computedField.value?.minOccurs ?? 1;
});

// maxOccurs determines how many times this field may appear at maximum.
const maxOccurs = computed(() =>
  props.maxOccursOverride !== undefined
    ? props.maxOccursOverride
    : (computedField.value?.maxOccurs ?? 1),
);

const disabled = computed(() => maxOccurs.value === 0);
const required = computed(() => minOccurs.value >= 1 && !disabled.value);

// When this optional field has no value yet, propagate minOccurs=0 to children so their
// required validation doesn't fire until the user starts filling in values.
const _minOccursOverride = computed(() => {
  // If an ancestor already set the override to 0, keep propagating it.
  if (props.minOccursOverride === 0)
    return props.minOccursOverride;

  // Field is required — nothing to override.
  if (minOccurs.value > 0)
    return undefined;

  // Field is optional but already has a value — keep children required.
  if (checkTreeHasValue(value.value))
    return undefined;

  // Optional field with no value: make all children optional too.
  return 0;
});

// When maxOccurs=0 (disabled), propagate the disabled state to children.
const _maxOccursOverride = computed(() =>
  maxOccurs.value === 0 ? 0 : undefined,
);

const _canRemoveItems = computed(() => {
  // Array items with a value can always be removed via the × button to clear them.
  if (props.partOfArrayField && checkTreeHasValue(value.value))
    return true;

  return props.canRemoveItems;
});

// --- Validation helpers ---

const submitCount = useSubmitCount();
const shouldValidateOnValueUpdate = computed(() => {
  // Only check validateOnValueUpdateAfterSubmit when it is explicitly true; otherwise leave
  // the decision to the next check (undefined means "defer to next rule").
  const validateOnValueUpdateAfterSubmit = settings?.value?.validateOnValueUpdateAfterSubmit === true
    ? (submitCount.value > 0 && settings?.value?.validateOnValueUpdateAfterSubmit)
    : undefined;

  const validateWhenInError = settings?.value?.validateWhenInError && fieldContext?.errors.value?.length > 0
    ? true
    : undefined;

  // Priority: field-level option → in-error state → after-submit setting → global setting
  return field.value?.fieldOptions?.validateOnValueUpdate
    ?? validateWhenInError
    ?? validateOnValueUpdateAfterSubmit
    ?? settings?.value?.validateOnValueUpdate;
});

const showAttributes = computed(
  () => field.value?.attributes?.length && checkTreeHasValue(value.value),
);

// #endregion

// #region Watchers and lifecycle events

// Equality-guard state for the rules watchEffect below. Plain variables, not refs: comparing
// against the previous run must not itself be a reactive dependency of the effect.
let _hasBuiltCombinedValidation = false;
let _previousRestriction: NonNullable<FieldMetadata['restriction']> = {};
let _previousValidation: FieldMetadata['validation'];
let _previousRequired = false;
let _previousMessages: DynamicFormSettings['messages'];

// Build the validation array reactively so it stays in sync with field metadata and settings.
// watchEffect (rather than computed) is used here to avoid the circular dependency described
// at the combinedValidation declaration above. restriction/validation/required are read off
// computedField (rather than the raw field prop) so a computedProps function that swaps either
// one is actually validated against. computedField recomputes with a fresh identity on every
// keystroke it subscribes to, so this effect would otherwise re-run (and rebuild) on every such
// keystroke; the equality guard below only rebuilds, and only counts, when something that
// actually affects the rule set changed.
watchEffect(() => {
  const _restriction = computedField.value.restriction ?? {};
  const _validation = computedField.value.validation;
  const _required = required.value;
  const _messages = settings?.value?.messages;

  // Compared by content (deepEqual) rather than by reference: computedProps functions commonly
  // rebuild restriction/validation on every run even when nothing actually changed, and only a
  // real change should rebuild the rules. Validation functions are compared by reference, which
  // is the only meaningful comparison for functions.
  if (
    _hasBuiltCombinedValidation
    && deepEqual(_restriction, _previousRestriction)
    && deepEqual(_validation, _previousValidation)
    && _required === _previousRequired
    && _messages === _previousMessages
  ) {
    return;
  }

  _hasBuiltCombinedValidation = true;
  // Cloned rather than assigned by reference: a computedProps function that mutates the
  // restriction or validation in place would otherwise also change these snapshots, so the
  // comparison above would never see a difference.
  _previousRestriction = deepCloneValue(_restriction);
  _previousValidation = deepCloneValue(_validation);
  _previousRequired = _required;
  _previousMessages = _messages;

  _analytics_constructValidationCount++;

  const _validations = buildRestrictionValidations(_restriction, _validation, _messages);

  // The required rule goes first, so an empty field reports "required" before any other error.
  if (_required)
    _validations.unshift(createValidation('xsd_required', undefined, _messages?.required));

  combinedValidation.value = _validations;
});

// Normalise empty strings to undefined (or null for array items) so the field is cleanly
// removed from the form values object rather than left as an empty string.
// flush: 'sync' ensures the value is corrected before any other watchers or computeds read it.
let _transforming = false;
watch(value, (newValue) => {
  if (_transforming)
    return;

  _transforming = true;
  if (newValue === '')
    value.value = props.partOfArrayField ? null : undefined;
  _transforming = false;
}, {
  flush: 'sync',
});

// Notify the parent and conditionally trigger validation whenever the value changes.
// vee-validate does not provide a built-in update event, so we implement it here.
watch(
  value,
  (v) => {
    _analytics_valueChangedCount++;

    // Only leaf inputs emit; parent/array/choice fields are updated by their children.
    if (!isInput.value)
      return;

    // Skip notification on the initial render if there is no value yet.
    if (!initialUpdate.value || v) {
      notifyValueUpdate();

      // Skipped while a programmatic write that asked not to validate is flushing: a
      // resetForm/resetField (its value change would write the just-cleared errors back)
      // or a setFieldValue/setValues call with shouldValidate: false.
      if (shouldValidateOnValueUpdate.value && !isValidationSuppressed())
        fieldContext?.validate();
    }

    initialUpdate.value = false;
  },
  {
    immediate: true,
  },
);

// Re-validate a group/choice whenever a field inside it changes, so its own meta.valid stays
// up to date. The value watcher above can't do this: a group's value is one object that keeps
// the same reference while its children change, so that watcher misses those edits. The
// childValueReactivity counter does go up on every child change, so we watch that instead.
// Validation on mount is already handled by vee-validate; this watcher only fires on changes.
if (!isInput.value) {
  watch(childValueReactivity, () => {
    if (isValidationSuppressed())
      return;

    _analytics_subtreeValidateCount++;
    fieldContext.validate?.({ mode: 'silent' });
  });
}

// Emit the initial computedField after mounting (children mount before parents, so the parent
// template listener is already in place). Then watch for hash changes to keep the parent in sync.
// Deferring to onMounted avoids accessing computedField during setup, which would make it a
// synchronous dep and break the infinite-loop guard test.
onMounted(() => {
  emits('update:computedField', computedField.value);
  watch(() => computedField.value._hash, (newHash, oldHash) => {
    if (newHash === oldHash)
      return;
    emits('update:computedField', computedField.value);
  });
});

onBeforeUnmount(() => {
  if (_computeLoopResetTimer != null)
    clearTimeout(_computeLoopResetTimer);

  // Array items are cleaned up by useFieldArray's remove() — setting value to undefined here
  // would write back to form.values at the (now-removed) index, causing useFieldArray's sync
  // watcher to detect a mismatch and re-add the entry via initFields().
  if (props.partOfArrayField)
    return;

  // A choice-hosting field has no vee-validate registration of its own, so its value here is
  // read-only (see the fieldContext setup above) and there is nothing for it to write back.
  // Clearing a deselected branch's value is already handled explicitly by the choice itself.
  if (isChoice.value)
    return;

  // Attribute fields are conditionally mounted based on whether the owning field has a value.
  // When the owner is empty, the attribute belongs to a value that is itself gone: there is
  // nothing left to keep, so it clears regardless of keepValuesOnUnmount/keepValueOnUnmount.
  // When the owner still has a value, the attribute honours the same keep flags as any other
  // field, by skipping this explicit clear and deferring to vee-validate's own unmount handling.
  const ownerValueIsGone = props.partOfAttributeField && !props.attributeOwnerHasValue?.();

  if (!ownerValueIsGone) {
    const keepValue = field.value?.fieldOptions?.keepValueOnUnmount
      ?? toValue(formContext?.keepValuesOnUnmount);
    if (keepValue)
      return;
  }

  if (value.value !== undefined) {
    value.value = undefined;
    notifyValueUpdate();
  }
});

// #endregion

// #region Methods

/**
 * Called when a direct child (or a DynamicFormItemArray/Choice that wraps a child) emits update:computedField.
 * Only updates childFields when the child's hash has changed, so the parent's computedProps
 * that access childFields are only re-evaluated when something meaningful changed.
 * When childFields is updated, the parent's own computedField may re-run (if it accesses childFields),
 * and the watch above will emit update:computedField upward, notifying the entire ancestor chain.
 */
function onChildComputedFieldUpdate(field: InternalFieldMetadata<FieldMetadata>) {
  if (!field.path)
    return;
  const existing = childFields.value[field.path] as InternalFieldMetadata<FieldMetadata>;
  if (existing?._hash === field._hash)
    return;
  childFields.value[field.path] = field as ReadOnlyFieldOf<FieldMetadata>;
}

function notifyValueUpdate() {
  _analytics_notifyValueUpdateCount++;
  childValueReactivity.value++;
  emits('update:modelValue', value.value);
};

// Array fields bypass useField and manage their own field array; when their value changes
// we receive it here and write it directly so the parent can pick it up via its own watcher.
function updateArrayValue(_value: unknown) {
  value.value = _value;
  emits('update:modelValue', value.value);
};

// #endregion
</script>

<template>
  <div v-if="settings?.analytics" v-show="false">
    <span :data-testid="`${path}-analytics-render-count`">{{
      ++_analytics_renderCount
    }}</span>
  </div>
  <template v-if="isWizard">
    <DynamicFormItemWizard
      v-bind="props"
      :field-metadata="computedField"

      @update:model-value="notifyValueUpdate"
      @update:computed-field="onChildComputedFieldUpdate"
    />
  </template>
  <template v-else-if="isChoice">
    <DynamicFormItemChoice
      v-bind="props"
      :field-metadata="computedField"

      @update:model-value="notifyValueUpdate"
      @update:computed-field="onChildComputedFieldUpdate"
    />
  </template>
  <template v-else-if="isArray">
    <DynamicFormItemArray
      v-bind="props"
      :part-of-choice-field
      :field-metadata="computedField"

      @update:model-value="updateArrayValue"
      @update:computed-field="onChildComputedFieldUpdate"
    />
  </template>
  <template v-else>
    <component
      :is="template"
      :type="branchKey !== undefined ? `${computedField.type}-choice-array-item` : partOfArrayField ? `${computedField.type}-array-item` : computedField.type"
      :field-metadata="computedField"
      :field-context
      :slot-props
      :settings
      :required
      :disabled
      :index
      :can-add-items
      :can-remove-items="_canRemoveItems"
      :add-item
      :remove-item
      :branch-key="branchKey"
      :global-index="globalIndex"
      :insertion-order="insertionOrder"
    >
      <template #default="slotProps">
        <template v-if="isParent">
          <DynamicFormItem
            v-for="(child, index) in computedField.children"
            :key="child.path"
            :field-metadata="(child as InternalMetadata)"
            :path-override="itemPath"
            :index
            :template
            :slot-props
            :min-occurs-override="_minOccursOverride"
            :max-occurs-override="_maxOccursOverride"

            @update:model-value="notifyValueUpdate"
            @update:computed-field="onChildComputedFieldUpdate"
          />
        </template>
        <template v-if="!isParent">
          <component
            :is="template"
            :type="`${computedField.type}-input`"
            :field-metadata="computedField"
            :field-context
            :slot-props
            :settings
            :required
            :disabled
            :index
            :can-add-items
            :can-remove-items="_canRemoveItems"
            :add-item
            :remove-item
          />
        </template>
      </template>
      <template #attributes="slotProps">
        <template v-if="showAttributes">
          <DynamicFormItem
            v-for="(attribute, index) in computedField.attributes"
            :key="attribute.path"
            :field-metadata="(attribute as InternalMetadata)"
            :path-override="path"
            :index
            :template
            :slot-props
            :min-occurs-override="_minOccursOverride"
            :max-occurs-override="_maxOccursOverride"
            :part-of-attribute-field="true"
            :attribute-owner-has-value="() => checkTreeHasValue(value)"

            @update:model-value="notifyValueUpdate"
            @update:computed-field="onChildComputedFieldUpdate"
          />
        </template>
      </template>
    </component>
  </template>
</template>
