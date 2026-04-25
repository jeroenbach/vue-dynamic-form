<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { ComputedRef } from 'vue';
import type { LimitedFieldContext } from '@/components/DynamicFormTemplate.vue';
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { useField } from 'vee-validate';
import { computed, inject, ref, watch } from 'vue';
import DynamicFormItem from '@/components/DynamicFormItem.vue';
import { dynamicFormSettingsKey } from '@/types/DynamicFormSettings';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';
import { createValidation } from '@/utils/createValidation';
import { normalizePath } from '@/utils/normalizePath';
import { overridePath } from '@/utils/overridePath';

// #region Interfaces
export interface Emit {
  (e: 'update:modelValue', value: unknown): void
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
// #endregion

// #region Computed state

// --- Path ---

const field = computed(() => props.fieldMetadata);

// A choice field itself has no path in the XML/json hierarchy, so we use the nearest ancestor's path
// for vee-validate registration and for passing down to children as pathOverride.
const closestPath = computed(() =>
  overridePath(field.value.path ?? '', props.pathOverride));

const normalizedPath = computed(() => normalizePath(closestPath.value));

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
const singleChild = computed(() =>
  field.value?.choice?.length === 1 ? field.value?.choice[0] as InternalMetadata : undefined,
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

// --- Vee-Validate field context ---

// Only validate when the total filled choices fall below the minimum required.
const combinedValidation = computed(() => {
  if (singleChild.value)
    return; // single-child choices are validated by the child itself

  if (disabled.value)
    return;

  if (valuesCount.value >= minOccurs.value)
    return;

  const _messages = settings?.value?.messages;
  return [createValidation('xsd_choiceMinOccurs', minOccurs.value, _messages?.choiceMinOccurs)];
});

// A choice field has no entry in the vee-validate values tree, so we anchor validation
// to the nearest parent path instead of a dedicated path. This gives errors a home.
const { errors, errorMessage } = useField(normalizedPath, combinedValidation, field.value?.fieldOptions);
const fieldContext: LimitedFieldContext = { label: field.value?.fieldOptions?.label, errors, errorMessage };

// #endregion

// #region Watchers and lifecycle events

// Seed childValues so every child index exists from the start; prevents occurrences
// from returning undefined for children that haven't emitted an update yet.
watch(field, (_field) => {
  if (!_field)
    return;

  _field.choice?.forEach((child, index) => {
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

// #endregion
</script>

<template>
  <component
    :is="template"
    v-slot="slotProps"
    type="choice"
    :field-metadata
    :field-context
    :required
    :index
    :disabled
    :slot-props
    :can-add-items
    :can-remove-items
    :add-item
    :remove-item
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
    />
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
      />
    </template>
  </component>
</template>
