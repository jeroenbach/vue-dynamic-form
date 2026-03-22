<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { ComputedRef } from 'vue';
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { computed, inject, ref } from 'vue';
import DynamicFormItem from '@/components/DynamicFormItem.vue';
import { dynamicFormSettingsKey } from '@/types/DynamicFormSettings';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';

// #region Interfaces
export interface Emit {
  (e: 'update:modelValue', value: unknown, index?: number): void
}
type Props = DynamicFormItemProps<InternalMetadata>;
// #endregion

// #region Props, Emits and inject
const props = defineProps<Props>();
const emits = defineEmits<Emit>();
const settings = inject<ComputedRef<DynamicFormSettings>>(dynamicFormSettingsKey);
// #endregion

// #region Analytics: to test reactivity and prevent unnecessary rerenders.
// They're not reactive to avoid infinite loops.

let _analytics_updateCallCount = 0;
let _analytics_occurrencesCalculatedCount = 0;

// #region Computed properties and state

const field = computed(() => props.fieldMetadata);

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

// When the minOccurs = 0, we use that to make a field optional. We need to pass this down to its children
const _minOccursOverride = computed(() =>
  minOccurs.value === 0 ? 0 : undefined,
);

// When the maxOccurs = 0, we use that to disable fields. We need to pass this down to its children
const _maxOccursOverride = computed(() =>
  maxOccurs.value === 0 ? 0 : undefined,
);

// Depending on the original maxOccurs of this choice field, we make the all children fieldArray's (if necessary)
const childrenAreArrays = computed(() => field.value?.maxOccurs > 1);

const disabled = computed(() => maxOccurs.value === 0);

const required = computed(() => minOccurs.value >= 1 && !disabled.value);

interface ChildValue {
  value: any
  occurrences: number // this is how often a child is visible
  valuesCount: number // this is how many of them have a value
  maxOccurrences: number
};
const childValues = ref<{
  [index: string]: ChildValue
}>({});

const values = computed(() => Object.values(childValues.value).map(x => x.value));

/**
 * A calculation for each child on how much its value means in terms of choice occurrences.
 * And what dynamic max & min occurrences override we should configure.
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
  // Setup a default for each child
  field.value?.choice?.forEach((_, i) => {
    _occurrences[i] = {
      childValuesCount: 0,
      childOccurrences: 0,
      childMaxOccurrences: 1,
      choiceValuesCount: 0,
      choiceOccurrences: 0,
      overrideChildMaxOccurrences: undefined,
      overrideChildMinOccurrences: 0, // make required fields by default optional
    };
  });

  const _maxOccurs = maxOccurs.value ?? 1;

  // In case the maxOccurs = 0, we need to disable this field and the fields below.
  // Continuing with the calculations therefore doesn't make any sense, just return a 0 for both min & max occurrences.
  if (_maxOccurs === 0) {
    field.value?.choice?.forEach((_, i) => {
      _occurrences[i].overrideChildMaxOccurrences = 0;
      _occurrences[i].overrideChildMinOccurrences = 0;
    });
    return _occurrences;
  }

  for (const [key, child] of Object.entries(childValues.value ?? {})) {
    // Calculate how much this child's occurrences will take up the choice occurrences
    // For example: choice.maxOccurs = 4 & child.maxOccurs = 2
    // then only every 2x the child has an occurrence, it will count as 1x choice occurrence
    let choiceOccurrences = Math.ceil(child.occurrences / child.maxOccurrences);

    // Do the same for the values
    const choiceValuesCount = Math.ceil(
      child.valuesCount / child.maxOccurrences,
    );

    // In case the totalChildOccurrences = 1, we know that the child is not a fieldArray but a normal item.
    // And for normal items we always show all fields, making it always take up 1 occurrence. This is unwanted.
    // Therefore for these cases we don't look at the occurrences but at the valuesCount.
    const totalChildOccurrences = _maxOccurs * child.maxOccurrences; // Calculate how many occurrences we can have
    if (totalChildOccurrences === 1) {
      choiceOccurrences = choiceValuesCount;
    }

    _occurrences[key] = {
      childValuesCount: child.valuesCount,
      childOccurrences: child.occurrences,
      childMaxOccurrences: child.maxOccurrences,
      choiceOccurrences,
      choiceValuesCount,
      // Only override the minOccurrences (making a required field optional) when there is no value in that child
      overrideChildMinOccurrences: child.valuesCount === 0 ? 0 : undefined,
      // will be calculated below, once all child values are present
      overrideChildMaxOccurrences: undefined,
    };
  }

  const totalChoiceOccurrences = Object.values(_occurrences).reduce(
    (acc, value) => acc + value.choiceOccurrences,
    0,
  );

  // Now, loop through each child and calculate its override of maxOccurrences
  Object.values(_occurrences).forEach((value) => {
    // As the choiceOccurrences are rounded upwards (Match.ceil()), we don't know whether it was a full count or not
    // for example: choice.maxOccurs = 2 & child.maxOccurs = 2
    // if we have 3 children, this counts already as 2 choice occurrences, but we can still add 1 child to get to 4.
    // Therefore we need to calculate the occurrences based on the combined occurrences.
    const othersChoiceOccurrences
      = totalChoiceOccurrences - value.choiceOccurrences; // Remove the child's choiceCount from the total
    const othersAsChildOccurrences
      = othersChoiceOccurrences * value.childMaxOccurrences; // Convert the other choiceCounts to the combined child count
    const totalChildOccurrences = _maxOccurs * value.childMaxOccurrences; // Calculate how many occurrences we can have

    value.overrideChildMaxOccurrences
      = totalChildOccurrences - othersAsChildOccurrences; // convert to a new childMaxOccurrence
  });

  return _occurrences;
});

const valuesCount = computed(() =>
  Object.values(occurrences.value).reduce(
    (acc, c) => acc + c.choiceValuesCount,
    0,
  ),
);

// In case there is only one child in a choice field, don't add any logic and just display the child
const singleChild = computed(() =>
  field.value?.choice?.length === 1 ? field.value?.choice[0] as InternalMetadata : undefined,
);

// #endregion

// #region Methods

function updateChildValue(
  value: any,
  childIndex: number | undefined,
  maxOccurrences: number = 1,
  skipCalculations: boolean = false,
) {
  // In some cases we just need to forward the fact that the value was updated
  if (skipCalculations) {
    emits('update:modelValue', values.value);
    return;
  }

  _analytics_updateCallCount++;

  if (childIndex === undefined)
    return;

  let calculateValues = Array.isArray(value) ? value : [value];

  // A normal field updates the parent by emitting an undefined when it is cleared, this means it doesn't have a value
  // and we want to filter those out. In case of an arrayField, we don't want to filter those values out.
  // Therefore we check whether the maxOccurs = 1 (== normal field)
  const _maxOccurs = maxOccurs.value ?? 1;
  const totalChildOccurrences = _maxOccurs * maxOccurrences; // Calculate how many occurrences we can have
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
    type="choice"
    :field-metadata
    :template-attrs
    :value="childValues"
    :required
    :disabled
    :can-add-items
    :can-remove-items
    :add-item
    :remove-item
  >
    <template #children>
      <DynamicFormItem
        v-if="singleChild"
        :field-metadata="singleChild"
        :path-override
        :template
        :min-occurs-override="_minOccursOverride"
        :max-occurs-override="_maxOccursOverride"
        @update:model-value="updateChildValue($event, 0, singleChild!.maxOccurs, true)"
      />
      <template v-else>
        <DynamicFormItem
          v-for="(child, index) in fieldMetadata.choice"
          :key="child.name"
          :field-metadata="(child as InternalMetadata)"
          :path-override
          :template
          :min-occurs-override="occurrences[index]?.overrideChildMinOccurrences"
          :max-occurs-override="occurrences[index]?.overrideChildMaxOccurrences"
          :is-array-override="childrenAreArrays"
          :part-of-choice-field

          @update:model-value="updateChildValue($event, index, child.maxOccurs)"
        />
      </template>
    </template>
  </component>
</template>
