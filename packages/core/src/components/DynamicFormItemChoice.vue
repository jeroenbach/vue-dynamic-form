<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { GenericObject, Path } from 'vee-validate';
import type { ComputedRef } from 'vue';
import type { LimitedFieldContext } from '@/components/DynamicFormTemplate.vue';
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { FormContextKey, useField } from 'vee-validate';
import { computed, inject, isRef, ref, toValue, watch } from 'vue';
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
// The vee-validate form context; used to clear/restore branch values on explicit (de)activation.
const form = inject(FormContextKey, undefined);
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

// --- Explicit branch activation ---

// Branch names that have been explicitly activated (through activateChoice/changeChoice,
// the activeChoices metadata property, or by entering a value while in explicit mode).
const explicitlyActive = ref<string[]>([]);

// Explicit-selection mode is engaged the first time activation is driven explicitly.
// Outside this mode branch activity stays purely value-derived (backwards compatible).
const explicitModeEngaged = ref(false);
const explicitMode = computed(() =>
  explicitModeEngaged.value || field.value?.activeChoices !== undefined);

// Cached values of deactivated branches; only used when keepValuesOnDeactivate is set.
const deactivatedValuesCache = new Map<string, unknown>();

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
    let choiceValuesCount = Math.ceil(child.valuesCount / child.maxOccurrences);

    // For a non-array child (totalChildOccurrences=1) the field is always shown, so its
    // "occupancy" should be based on whether it actually has a value, not on it being shown.
    const totalChildOccurrences = _maxOccurs * child.maxOccurrences;
    if (totalChildOccurrences === 1) {
      choiceOccurrences = choiceValuesCount;
    }

    // Whether this branch's own validation should be active; outside explicit mode this is
    // purely value-derived (a branch with no values stays optional).
    let branchIsActive = child.valuesCount > 0;

    // In explicit mode the explicit selection is the source of truth for occupancy: an active
    // branch consumes at least one occurrence (even while empty) and satisfies one choice
    // occurrence; an inactive branch consumes none (any leftover values are being cleared).
    if (explicitMode.value) {
      branchIsActive = isBranchActive(field.value?.choice?.[Number(key)]?.name);
      if (branchIsActive) {
        choiceOccurrences = Math.max(1, choiceOccurrences);
        choiceValuesCount = Math.max(1, choiceValuesCount);
      }
      else {
        choiceOccurrences = 0;
        choiceValuesCount = 0;
      }
    }

    _occurrences[key] = {
      childValuesCount: child.valuesCount,
      childOccurrences: child.occurrences,
      childMaxOccurrences: child.maxOccurrences,
      choiceOccurrences,
      choiceValuesCount,
      overrideChildMinOccurrences: branchIsActive ? undefined : 0, // optional while inactive
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

// Total consumed choice occurrences; determines the remaining budget for further activations.
const totalChoiceOccurrences = computed(() =>
  Object.values(occurrences.value).reduce(
    (acc, c) => acc + c.choiceOccurrences,
    0,
  ),
);

// The currently active branch names, exposed to the template slot. In explicit mode this is
// the explicit selection; otherwise it reflects which branches currently hold a value.
const activeChoiceNames = computed(() => {
  if (singleChild.value)
    return [];

  return field.value?.choice
    ?.filter((child, index) => explicitMode.value
      ? isBranchActive(child.name)
      : (occurrences.value[index]?.choiceValuesCount ?? 0) > 0)
    .map(child => child.name ?? '') ?? [];
});

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

// Keep the explicit selection in sync with the activeChoices metadata property.
// A plain array sets the initial selection; a Ref creates a two-way binding.
watch(
  () => toValue(field.value?.activeChoices),
  (names) => {
    if (!names || sameBranchNames(names, explicitlyActive.value))
      return;

    // Route external changes through the activation API so value clearing/caching applies.
    [...explicitlyActive.value]
      .filter(name => !names.includes(name))
      .forEach(name => activateChoice(name, false));
    names
      .filter(name => !isBranchActive(name))
      .forEach(name => activateChoice(name));
  },
  { immediate: true, deep: true },
);

// Write selection changes back into a user-provided activeChoices ref (two-way binding).
watch(explicitlyActive, (names) => {
  const target = field.value?.activeChoices;
  if (!isRef(target) || sameBranchNames(names, target.value))
    return;

  target.value = [...names];
});

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

  // In explicit-selection mode, entering a value in an inactive branch activates it explicitly,
  // keeping the selection consistent (and sticky) with what the user typed.
  if (explicitMode.value && valuesCount > 0) {
    const name = field.value?.choice?.[childIndex]?.name;
    if (name && !isBranchActive(name))
      explicitlyActive.value = [...explicitlyActive.value, name];
  }

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

// --- Explicit branch activation ---

function isBranchActive(name: string | undefined) {
  return name !== undefined && explicitlyActive.value.includes(name);
}

function sameBranchNames(a: string[], b: string[]) {
  return a.length === b.length && a.every(name => b.includes(name));
}

function findBranchIndex(name: string) {
  return field.value?.choice?.findIndex(child => child.name === name) ?? -1;
}

function branchPath(index: number) {
  const child = field.value?.choice?.[index];
  return normalizePath(overridePath(child?.path ?? '', props.pathOverride));
}

/**
 * Engages explicit-selection mode. When the choice was value-driven until now, the branches
 * that currently hold values are adopted into the explicit selection, so that a subsequent
 * deactivation clears them correctly.
 */
function engageExplicitMode() {
  if (!explicitMode.value) {
    explicitlyActive.value = field.value?.choice
      ?.filter((_, index) => (childValues.value[index]?.valuesCount ?? 0) > 0)
      .map(child => child.name ?? '') ?? [];
  }
  explicitModeEngaged.value = true;
}

/**
 * Whether the given branch can be activated *in addition to* the currently active branches,
 * i.e. without deactivating another branch first. Use changeChoice to switch branches instead.
 */
function canActivateChoice(name: string): boolean {
  if (disabled.value || singleChild.value)
    return false;

  const index = findBranchIndex(name);
  if (index === -1)
    return false;

  const alreadyActive = explicitMode.value
    ? isBranchActive(name)
    : (occurrences.value[index]?.choiceValuesCount ?? 0) > 0;
  if (alreadyActive)
    return true;

  return totalChoiceOccurrences.value < (maxOccurs.value ?? 1);
}

/**
 * Explicitly activates (or deactivates) a choice branch by name. Multiple branches can be
 * active at the same time, as long as the choice's maxOccurs budget allows it.
 * Deactivating a branch removes its values from the form; with keepValuesOnDeactivate set on
 * the choice field, the values are cached and restored when the branch is activated again.
 */
function activateChoice(name: string, active: boolean = true) {
  if (singleChild.value)
    return;

  const index = findBranchIndex(name);
  if (index === -1)
    return;

  engageExplicitMode();

  if (active) {
    if (isBranchActive(name) || !canActivateChoice(name))
      return;

    explicitlyActive.value = [...explicitlyActive.value, name];
    restoreBranchValues(name, index);
  }
  else {
    if (!isBranchActive(name))
      return;

    explicitlyActive.value = explicitlyActive.value.filter(n => n !== name);
    clearBranchValues(name, index);
  }
}

/**
 * Single-select convenience: activates the given branch and deactivates all others.
 */
function changeChoice(name: string) {
  if (singleChild.value)
    return;

  engageExplicitMode();

  [...explicitlyActive.value]
    .filter(activeName => activeName !== name)
    .forEach(activeName => activateChoice(activeName, false));
  activateChoice(name);
}

function clearBranchValues(name: string, index: number) {
  const path = branchPath(index);
  if (!path || !form)
    return;

  const currentValue = childValues.value[index]?.value;
  if (field.value?.keepValuesOnDeactivate && checkTreeHasValue(currentValue))
    deactivatedValuesCache.set(name, currentValue);

  form.setFieldValue(path as Path<GenericObject>, undefined, false);
}

function restoreBranchValues(name: string, index: number) {
  if (!field.value?.keepValuesOnDeactivate || !deactivatedValuesCache.has(name))
    return;

  const cached = deactivatedValuesCache.get(name);
  deactivatedValuesCache.delete(name);

  const path = branchPath(index);
  if (!path || !form)
    return;

  form.setFieldValue(path as Path<GenericObject>, cached, false);
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
    :choice-active
    :active-choices="activeChoiceNames"
    :change-choice="changeChoice"
    :activate-choice="activateChoice"
    :can-activate-choice="canActivateChoice"
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
        :choice-active="explicitMode ? isBranchActive(child.name) : undefined"
        part-of-choice-field

        @update:model-value="updateChildValue($event, index, child.maxOccurs)"
        @update:computed-field="emits('update:computedField', $event)"
      />
    </template>
  </component>
</template>
