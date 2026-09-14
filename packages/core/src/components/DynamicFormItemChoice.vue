<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { ComputedRef } from 'vue';
import type { ChoiceOccurrence, LimitedFieldContext } from '@/components/DynamicFormTemplate.vue';
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { useField, useFieldValue, useFormContext } from 'vee-validate';
import { computed, inject, ref, watch } from 'vue';
import DynamicFormItem from '@/components/DynamicFormItem.vue';
import { dynamicFormSettingsKey } from '@/types/DynamicFormSettings';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';
import { createValidation } from '@/utils/createValidation';
import { normalizePath } from '@/utils/normalizePath';
import { overridePath } from '@/utils/overridePath';

// #region Interfaces
export interface Emit {
  /** Emitted whenever any child option's value changes; payload is the array of all child values in choice-option order. */
  (e: 'update:modelValue', value: unknown): void
  /** Bubbled up from child `DynamicFormItem` instances; carries the updated computed field metadata. */
  (e: 'update:computedField', field: InternalFieldMetadata<FieldMetadata>): void
}
type Props = DynamicFormItemProps<InternalMetadata>;

// Tracks how much of the choice "budget" each child is consuming.
interface ChildValue {
  value: any
  occurrences: number // how many instances of this child are currently shown
  valuesCount: number // how many of those instances actually have a value
  maxOccurrences: number // the child's own maxOccurs
}
// #endregion

// #region Props, Emits and inject
const props = defineProps<Props>();
const emits = defineEmits<Emit>();
const settings = inject<ComputedRef<DynamicFormSettings>>(dynamicFormSettingsKey);
// #endregion

// #region Internal tracking
// Plain variables (not reactive) to avoid triggering renders when measuring analytics.
let _analytics_updateCallCount = 0;
let _analytics_occurrencesCalculatedCount = 0;
let _analytics_activeChoiceOccurrencesCalculatedCount = 0;
// #endregion

// #region Computed state

// --- Path ---

const field = computed(() => props.fieldMetadata);

// A choice field itself has no path in the XML/json hierarchy, so we use the nearest ancestor's path
// for vee-validate registration and for passing down to children as pathOverride.
const closestPath = computed(() =>
  overridePath(field.value.path ?? '', props.pathOverride));

const normalizedPath = computed(() => normalizePath(closestPath.value));

// `explicitChoiceSelection` is static metadata (ADR-2, DECIDED finding 4): captured once at
// setup rather than read reactively from `field`. `field` is the parent's `computedField`, so a
// `computedProps` mutation of `thisField.explicitChoiceSelection` (only possible via an `as any`
// cast, since the property is excluded from `ComputedPropsFieldType`) would otherwise still be
// visible here and could flip the render mode mid-form, causing the exact initial-flash /
// mount-unmount storm ADR-2 exists to prevent.
const explicitChoiceSelection = props.fieldMetadata?.explicitChoiceSelection === true;

// vee-validate form context, used to clear a deselected branch's data on switch (ADR-3).
// `DynamicFormItemChoice` is always a descendant of the `useForm()` call in `useDynamicForm`,
// so a plain `useFormContext()` resolves it here (unlike the same-instance quirk
// `useValidatePartialForm` has to guard against).
const formContext = useFormContext();

// Ephemeral UI state for the `maxOccurs: 1` explicit-selection case (ADR-1). Never written to
// form `values` — selection is tracked here and folded into the existing occurrence math below.
const explicitlySelectedBranch = ref<string | null>(null);

// Value-driven read per branch, independent of whether that branch's own DynamicFormItem is
// currently mounted. Needed for the "loading saved data still reads as selected" guarantee
// (decision 4): in explicit mode only active branches are mounted, so an unmounted branch could
// never self-report a pre-loaded value through childValues (which only ever hears from a branch
// once it is mounted). Resolved through a getter (not a plain string) so it keeps tracking the
// right path if pathOverride changes reactively (decision 6, e.g. an earlier array sibling being
// removed re-indexes this choice's own pathOverride). The branch list itself is static metadata,
// so a fixed number of useFieldValue() calls at setup satisfies the rules of hooks.
const branchValueRefs = (field.value?.choice ?? []).map(child =>
  useFieldValue(() => child.path ? overridePath(child.path, props.pathOverride) : ''),
);

// --- Occurrence limits ---

const minOccurs = computed(() =>
  props.minOccursOverride !== undefined
    ? props.minOccursOverride
    : (field.value?.minOccurs ?? 1),
);

const maxOccurs = computed(() =>
  props.maxOccursOverride !== undefined
    ? props.maxOccursOverride
    : (field.value?.maxOccurs ?? 1),
);

const disabled = computed(() => maxOccurs.value === 0);
const required = computed(() => minOccurs.value >= 1 && !disabled.value);

// Propagate optional/disabled state to children.
const _minOccursOverride = computed(() =>
  minOccurs.value === 0 ? 0 : undefined,
);
const _maxOccursOverride = computed(() =>
  maxOccurs.value === 0 ? 0 : undefined,
);

// When the choice itself may occur more than once, its children become array fields too.
const childrenAreArrays = computed(() => field.value?.maxOccurs > 1 ? 'array' : undefined);

// --- Child value tracking ---

// Each child reports its current value here so we can calculate the shared occurrence budget.
const childValues = ref<{ [index: string]: ChildValue }>({});

// Raw child values are emitted upward as-is; occurrence-aware counting happens below.
const values = computed(() => Object.values(childValues.value).map(x => x.value));

// --- Single-child shortcut ---

// When a choice field has exactly one option there is no meaningful branching — skip
// all occurrence math and render that one child directly.
// Bypassed when explicitChoiceSelection is set (DECIDED finding 5): a single-branch explicit
// choice behaves as an explicit "add this block / remove it" selection instead.
const singleChild = computed(() =>
  (!explicitChoiceSelection && field.value?.choice?.length === 1) ? field.value?.choice[0] as InternalMetadata : undefined,
);

// --- Occurrence budget calculation ---

/**
 * For each child, calculates:
 *  - how many of the shared choice occurrences it is currently consuming
 *  - the resulting min/max occurrence overrides to pass down
 *
 * Background: a choice with maxOccurs=4 and two children each with maxOccurs=2 means
 * every 2 child items count as 1 choice occurrence. Children compete for the shared budget,
 * so the more one child uses, the less the others may use.
 */
const occurrences = computed(() => {
  _analytics_occurrencesCalculatedCount++;

  const _occurrences: {
    [index: string]: {
      childValuesCount: number
      childOccurrences: number
      childMaxOccurrences: number
      choiceValuesCount: number
      choiceOccurrences: number
      overrideChildMaxOccurrences: number | undefined
      overrideChildMinOccurrences: number | undefined
    }
  } = {};

  // Initialise defaults for every child upfront so all indices exist even if no value arrived yet.
  field.value?.choice?.forEach((_, i) => {
    _occurrences[i] = {
      childValuesCount: 0,
      childOccurrences: 0,
      childMaxOccurrences: 1,
      choiceValuesCount: 0,
      choiceOccurrences: 0,
      overrideChildMaxOccurrences: undefined,
      overrideChildMinOccurrences: 0, // children are optional by default inside a choice
    };
  });

  const _maxOccurs = maxOccurs.value ?? 1;

  // When the whole choice is disabled (maxOccurs=0), disable all children immediately.
  if (_maxOccurs === 0) {
    field.value?.choice?.forEach((_, i) => {
      _occurrences[i].overrideChildMaxOccurrences = 0;
      _occurrences[i].overrideChildMinOccurrences = 0;
    });
    return _occurrences;
  }

  // Pass 1: convert each child's raw occurrence count into choice-occurrence units.
  for (const [key, child] of Object.entries(childValues.value ?? {})) {
    // How many choice occurrences does this child consume?
    // e.g. choice.maxOccurs=4, child.maxOccurs=2: every 2 child items = 1 choice occurrence.
    let choiceOccurrences = Math.ceil(child.occurrences / child.maxOccurrences);
    const choiceValuesCount = Math.ceil(child.valuesCount / child.maxOccurrences);

    // For a non-array child (totalChildOccurrences=1) the field is always shown, so its
    // "occupancy" should be based on whether it actually has a value, not on it being shown.
    const totalChildOccurrences = _maxOccurs * child.maxOccurrences;
    if (totalChildOccurrences === 1) {
      choiceOccurrences = choiceValuesCount;
    }

    _occurrences[key] = {
      childValuesCount: child.valuesCount,
      childOccurrences: child.occurrences,
      childMaxOccurrences: child.maxOccurrences,
      choiceOccurrences,
      choiceValuesCount,
      overrideChildMinOccurrences: child.valuesCount === 0 ? 0 : undefined, // optional when empty
      overrideChildMaxOccurrences: undefined, // calculated in pass 2
    };
  }

  const totalChoiceOccurrences = Object.values(_occurrences).reduce(
    (acc, value) => acc + value.choiceOccurrences,
    0,
  );

  // Pass 2: for each child, derive how many more items it may add given what the others are using.
  // Because Math.ceil() was used above we work backwards from the combined total to stay accurate.
  Object.values(_occurrences).forEach((value) => {
    const othersChoiceOccurrences = totalChoiceOccurrences - value.choiceOccurrences;
    const othersAsChildOccurrences = othersChoiceOccurrences * value.childMaxOccurrences;
    const totalChildOccurrences = _maxOccurs * value.childMaxOccurrences;

    value.overrideChildMaxOccurrences = totalChildOccurrences - othersAsChildOccurrences;
  });

  return _occurrences;
});

// Total number of filled choices (in choice-occurrence units, not raw item counts).
const valuesCount = computed(() =>
  Object.values(occurrences.value).reduce(
    (acc, c) => acc + c.choiceValuesCount,
    0,
  ),
);

// --- Explicit selection (maxOccurs:1, ST-01 foundation) ---

// The active branch(es), merging the value-driven view (a branch with real data, the existing
// childValues-based logic) with the explicit view (explicitlySelectedBranch). This is what makes
// "loading saved data still reads as selected" fall out for free: a loaded-but-not-explicitly-
// selected branch still appears here because it already has a value.
const activeChoiceOccurrences = computed<ChoiceOccurrence[]>(() => {
  _analytics_activeChoiceOccurrencesCalculatedCount++;

  const active: ChoiceOccurrence[] = [];

  field.value?.choice?.forEach((child, index) => {
    const valueDriven = checkTreeHasValue(branchValueRefs[index]?.value);
    const isExplicitlySelected = explicitChoiceSelection && explicitlySelectedBranch.value === child.name;

    if (valueDriven || isExplicitlySelected) {
      active.push({ branchKey: child.name as string, index: 0 });
    }
  });

  return active;
});

// In explicit mode, an explicitly selected branch counts toward xsd_choiceMinOccurs even before
// any of its fields hold a value (parity, DECIDED finding 2): the branch's own required fields
// then drive their own validation independently. Auto mode stays value-driven, unchanged.
const effectiveValuesCount = computed(() => {
  if (explicitChoiceSelection && maxOccurs.value === 1)
    return Math.max(valuesCount.value, explicitlySelectedBranch.value ? 1 : 0);

  // Auto mode stays value-driven, unchanged. maxOccurs > 1 explicit parity (folding in
  // activeChoiceOccurrences.length) is ST-02's addition; it stays value-driven for now too.
  return valuesCount.value;
});

// --- Vee-Validate field context ---

// Only validate when the total filled choices fall below the minimum required.
const combinedValidation = computed(() => {
  if (singleChild.value)
    return; // single-child choices are validated by the child itself

  if (disabled.value)
    return;

  if (effectiveValuesCount.value >= minOccurs.value)
    return;

  const _messages = settings?.value?.messages;
  return [createValidation('xsd_choiceMinOccurs', minOccurs.value, _messages?.choiceMinOccurs)];
});

// A choice field has no entry in the vee-validate values tree, so we anchor validation
// to the nearest parent path instead of a dedicated path. This gives errors a home.
const { errors, errorMessage } = useField(normalizedPath, combinedValidation, field.value?.fieldOptions);
const fieldContext: LimitedFieldContext = { label: field.value?.fieldOptions?.label, errors, errorMessage, value: values };

// #endregion

// #region Watchers and lifecycle events

// Seed childValues so every child index exists from the start; prevents occurrences
// from returning undefined for children that haven't emitted an update yet.
watch(field, (_field) => {
  if (!_field)
    return;

  // Initialize tracking entries for choice children that haven't been set up yet.
  // We skip indices that are already present so that a metadata-reference change
  // (e.g. from a recomputed metadataWithEdit) does not reset values that users have already entered.
  _field.choice?.forEach((child, index) => {
    if (!(index in childValues.value))
      updateChildValue(undefined, index, child.maxOccurs);
  });
}, { immediate: true });

// #endregion

// #region Methods

function updateChildValue(
  value: any,
  childIndex: number | undefined,
  maxOccurrences: number = 1,
  skipCalculations: boolean = false,
) {
  // Used by singleChild to forward value updates without recalculating the occurrence budget.
  if (skipCalculations) {
    emits('update:modelValue', values.value);
    return;
  }

  _analytics_updateCallCount++;

  if (childIndex === undefined)
    return;

  let calculateValues = Array.isArray(value) ? value : [value];

  // For non-array children (totalChildOccurrences=1) an undefined means "no value".
  // Filter those out so they don't inflate the occurrence count.
  const _maxOccurs = maxOccurs.value ?? 1;
  const totalChildOccurrences = _maxOccurs * maxOccurrences;
  if (totalChildOccurrences === 1) {
    calculateValues = calculateValues.filter(x => x !== undefined);
  }

  const occurrences = calculateValues.length;
  const valuesCount = calculateValues.filter(v => checkTreeHasValue(v)).length;

  const childValue = childValues.value[childIndex] ?? ({} as ChildValue);
  childValue.value = value;
  childValue.occurrences = occurrences;
  childValue.valuesCount = valuesCount;
  childValue.maxOccurrences = maxOccurrences;

  if (!childValues.value[childIndex]) {
    childValues.value[childIndex] = childValue;
  }

  emits('update:modelValue', values.value);
};

// --- Explicit selection primitives (maxOccurs:1, ST-01 foundation) ---

function branchIndexOf(branchKey: string): number {
  return field.value?.choice?.findIndex(child => child.name === branchKey) ?? -1;
}

function branchByKey(branchKey: string): InternalMetadata | undefined {
  const index = branchIndexOf(branchKey);
  return index >= 0 ? (field.value?.choice?.[index] as InternalMetadata) : undefined;
}

// Clears a deselected branch's data through the vee-validate form context (ADR-3), resolved via
// the same overridePath the rest of the component uses so this is correct through array indices
// (decision 6). The residual `undefined`-valued key that setInPath leaves behind is the accepted
// contract; consumers who need a byte-clean tree call the exported removeNullValues at submit time.
// The childValues entry is also reset synchronously here (not left to the branch's own unmount),
// so valuesCount/combinedValidation settle in one tick instead of oscillating.
function clearBranch(branchKey: string) {
  const index = branchIndexOf(branchKey);
  if (index < 0)
    return;

  const branchChild = field.value?.choice?.[index];
  const branchPath = branchChild?.path ? overridePath(branchChild.path, props.pathOverride) : undefined;
  if (branchPath) {
    formContext?.setFieldValue(branchPath as any, undefined, false);
  }

  const existing = childValues.value[index];
  if (existing) {
    existing.value = undefined;
    existing.occurrences = 0;
    existing.valuesCount = 0;
  }
}

/** Mark a branch active (maxOccurs:1). No-op when canAddChoiceOccurrence is false, the branchKey is unknown, or it is already the active branch. */
function addChoiceOccurrence(branchKey: string) {
  // canAddChoiceOccurrence already returns false for an unknown branchKey (branchIndexOf < 0),
  // so no separate existence check is needed here.
  if (!canAddChoiceOccurrence(branchKey))
    return;

  if (explicitlySelectedBranch.value === branchKey)
    return; // idempotent: already selected

  const previousBranch = explicitlySelectedBranch.value;
  if (previousBranch && previousBranch !== branchKey) {
    clearBranch(previousBranch);
  }

  explicitlySelectedBranch.value = branchKey;
}

/** Deselect a branch. index is ignored in maxOccurs:1 (there is only ever one active occurrence). No-op for an unknown or inactive branchKey. */
function removeChoiceOccurrence(branchKey: string, _index?: number) {
  if (branchIndexOf(branchKey) < 0)
    return;

  const isActive = activeChoiceOccurrences.value.some(occurrence => occurrence.branchKey === branchKey);
  if (!isActive)
    return;

  clearBranch(branchKey);

  if (explicitlySelectedBranch.value === branchKey) {
    explicitlySelectedBranch.value = null;
  }
}

/** Per-branch "may add" guard: false when the choice is disabled or branchKey is unknown. Budget-aware behaviour (maxOccurs > 1) is ST-02's concern. */
function canAddChoiceOccurrence(branchKey: string): boolean {
  if (disabled.value)
    return false;

  return branchIndexOf(branchKey) >= 0;
}

// #endregion
</script>

<template>
  <component
    :is="template"
    v-slot="slotProps"
    :type="`${fieldMetadata.type}-choice`"
    :field-metadata
    :field-context
    :slot-props
    :settings
    :required
    :index
    :disabled
    :can-add-items
    :can-remove-items
    :add-item
    :remove-item
    :add-choice-occurrence="addChoiceOccurrence"
    :remove-choice-occurrence="removeChoiceOccurrence"
    :can-add-choice-occurrence="canAddChoiceOccurrence"
    :active-choice-occurrences="activeChoiceOccurrences"
  >
    <DynamicFormItem
      v-if="singleChild"
      :field-metadata="singleChild"
      :path-override
      :template
      :slot-props
      :min-occurs-override="_minOccursOverride"
      :max-occurs-override="_maxOccursOverride"
      part-of-choice-field

      @update:model-value="updateChildValue($event, 0, singleChild!.maxOccurs, true)"
      @update:computed-field="emits('update:computedField', $event)"
    />
    <template v-else-if="explicitChoiceSelection">
      <DynamicFormItem
        v-for="occurrence in activeChoiceOccurrences"
        :key="occurrence.branchKey"
        :field-metadata="(branchByKey(occurrence.branchKey) as InternalMetadata)"
        :path-override
        :index="branchIndexOf(occurrence.branchKey)"
        :template
        :slot-props
        :min-occurs-override="_minOccursOverride"
        :max-occurs-override="_maxOccursOverride"
        :is-array-override="childrenAreArrays"
        part-of-choice-field

        @update:model-value="updateChildValue($event, branchIndexOf(occurrence.branchKey), branchByKey(occurrence.branchKey)!.maxOccurs)"
        @update:computed-field="emits('update:computedField', $event)"
      />
    </template>
    <template v-else>
      <DynamicFormItem
        v-for="(child, index) in field.choice"
        :key="child.name"
        :field-metadata="(child as InternalMetadata)"
        :path-override
        :index
        :template
        :slot-props
        :min-occurs-override="occurrences[index]?.overrideChildMinOccurrences"
        :max-occurs-override="occurrences[index]?.overrideChildMaxOccurrences"
        :is-array-override="childrenAreArrays"
        part-of-choice-field

        @update:model-value="updateChildValue($event, index, child.maxOccurs)"
        @update:computed-field="emits('update:computedField', $event)"
      />
    </template>
  </component>
</template>
