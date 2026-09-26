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
import { useFieldArrayExtended } from '@/core/useFieldArrayExtended';
import { dynamicFormSettingsKey } from '@/types/DynamicFormSettings';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';
import { createValidation } from '@/utils/createValidation';
import { deepCloneValue } from '@/utils/deepCloneValue';
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
let _analytics_renderedChoiceOccurrencesCalculatedCount = 0;
// #endregion

// #region Computed state

// --- Path ---

const field = computed(() => props.fieldMetadata);

// A choice field itself has no path in the XML/json hierarchy, so we use the nearest ancestor's path
// for vee-validate registration and for passing down to children as pathOverride.
const closestPath = computed(() =>
  overridePath(field.value.path ?? '', props.pathOverride));

const normalizedPath = computed(() => normalizePath(closestPath.value));

// Read once at setup, not reactively: flipping the render mode mid-form would cause a
// mount-unmount storm, and a whole watcher below is only registered when it is true.
const explicitChoiceSelection = props.fieldMetadata?.explicitChoiceSelection === true;

// The ordering flags, by contrast, are read reactively: none of them changes the shape of the
// stored values or requires setup-time structure, so a consumer may flip them live through the
// metadata prop and the choice adjusts in place, without a remount. They stay excluded from
// ComputedPropsFieldType, so the metadata prop (not computedProps) is the sanctioned channel.
const preserveOnSwitch = computed(() => field.value?.preserveOnSwitch === true);
// Only 'added' is meaningful; absent or 'grouped' fall through to the identity path below.
const displayOrder = computed(() => field.value?.displayOrder === 'added');
const preserveOrderRequested = computed(() => field.value?.preserveOrder === true);

// preserveOrder is all-or-nothing: `order` can only live inside an object (a branch with
// children), and persisting it for some branches but not others would leave a sequence that is
// only half reconstructable after a reload. One scalar-leaf branch therefore disables the
// persisted tier for the whole choice (with a dev warning below); the ephemeral insertionOrder
// tier still covers every branch shape. The branch list is static metadata, so the shape gate is
// a plain setup-time constant.
const allBranchesObjectShaped = (field.value?.choice ?? []).every(child => (child.children?.length ?? 0) > 0);
const preserveOrderEffective = computed(() => preserveOrderRequested.value && allBranchesObjectShaped);

// Used to clear a deselected branch's data on switch. A plain useFormContext() resolves here
// since this component is always a descendant of the useForm() call in useDynamicForm.
const formContext = useFormContext();

// The three refs below are ephemeral UI state, never written to form `values`.

// Which branch is active in the maxOccurs:1 explicit case.
const explicitlySelectedBranch = ref<string | null>(null);

// preserve-on-switch stash, keyed by branchKey so its size stays bounded by the branch count.
const stashedBranchValues = ref<Record<string, unknown>>({});

// Add-press order for the repeatable explicit case, keyed by the stable occurrenceKey so it
// survives an ancestor reindex. insertionCounter is plain (like the analytics counters): only
// the Map write needs to be reactive, not the counter.
const insertionOrders = ref<Map<string, number>>(new Map());
let insertionCounter = 0;

// Per-branch value, read straight from the value tree so an unmounted branch's pre-loaded data
// still reads as selected (childValues only hears from a branch once it mounts). Via a getter,
// not a string, so it keeps tracking the right path when pathOverride reindexes.
const branchValueRefs = (field.value?.choice ?? []).map(child =>
  useFieldValue(() => child.path ? overridePath(child.path, props.pathOverride) : ''),
);

// Per-branch reactive path + field array for the repeatable case. Each path is a computed, not a
// setup-time string, so the field array keeps following a pathOverride that reindexes when an
// earlier sibling array item is removed.
const branchPaths = (field.value?.choice ?? []).map(child =>
  computed(() => child.path ? normalizePath(overridePath(child.path, props.pathOverride)) : ''));
const branchFieldArrays = branchPaths.map(branchPath => useFieldArrayExtended(branchPath));

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

// A repeatable choice renders through the -choice-array slot family, a single one through
// -choice. Keyed off the declared maxOccurs (not the overridable budget) so disabling via a
// maxOccursOverride of 0 cannot flip an otherwise repeatable choice into the single family.
const slotType = computed(() =>
  `${field.value?.type}${field.value?.maxOccurs > 1 ? '-choice-array' : '-choice'}`);

// --- Child value tracking ---

// Each child reports its current value here so we can calculate the shared occurrence budget.
const childValues = ref<{ [index: string]: ChildValue }>({});

// Raw child values are emitted upward as-is; occurrence-aware counting happens below.
const values = computed(() => Object.values(childValues.value).map(x => x.value));

// --- Single-child shortcut ---

// One option means no real branching: skip the occurrence math and render it directly. Not
// applied under explicitChoiceSelection, where it behaves as an "add this block / remove it".
const singleChild = computed(() =>
  (!explicitChoiceSelection && field.value?.choice?.length === 1) ? field.value?.choice[0] as InternalMetadata : undefined,
);

// --- Occurrence budget calculation ---

/**
 * For each child, computes how many of the shared choice occurrences it consumes and the
 * min/max overrides to pass down. Children compete for one shared budget: with choice
 * maxOccurs=4 and two children each maxOccurs=2, every 2 child items count as 1 choice
 * occurrence, so the more one child uses the less the others may.
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
      // The branch's opt-in total cap, carried here so pass 2 can clamp to it directly.
      maxOccursTotal: number | undefined
    }
  } = {};

  // Initialise defaults for every child upfront so all indices exist even if no value arrived yet.
  field.value?.choice?.forEach((child, i) => {
    _occurrences[i] = {
      childValuesCount: 0,
      childOccurrences: 0,
      childMaxOccurrences: 1,
      choiceValuesCount: 0,
      choiceOccurrences: 0,
      overrideChildMaxOccurrences: undefined,
      overrideChildMinOccurrences: 0, // children are optional by default inside a choice
      maxOccursTotal: child.maxOccursTotal,
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

  // Pass 1: convert each child's raw item count into choice-occurrence units.
  for (const [key, child] of Object.entries(childValues.value ?? {})) {
    // e.g. choice.maxOccurs=4, child.maxOccurs=2: every 2 child items = 1 choice occurrence.
    let choiceOccurrences = Math.ceil(child.occurrences / child.maxOccurrences);
    const choiceValuesCount = Math.ceil(child.valuesCount / child.maxOccurrences);

    // A non-array child is always shown, so its occupancy is whether it has a value, not that
    // it is shown.
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
      maxOccursTotal: field.value?.choice?.[Number(key)]?.maxOccursTotal,
    };
  }

  const totalChoiceOccurrences = Object.values(_occurrences).reduce(
    (acc, value) => acc + value.choiceOccurrences,
    0,
  );

  // Pass 2: derive each child's remaining headroom from what the others are using. We work
  // backwards from the combined total to stay accurate despite the Math.ceil() rounding above.
  Object.values(_occurrences).forEach((value) => {
    const othersChoiceOccurrences = totalChoiceOccurrences - value.choiceOccurrences;
    const othersAsChildOccurrences = othersChoiceOccurrences * value.childMaxOccurrences;
    const totalChildOccurrences = _maxOccurs * value.childMaxOccurrences;

    let overrideChildMaxOccurrences = totalChildOccurrences - othersAsChildOccurrences;

    // maxOccursTotal is a raw-item cap independent of the shared budget; it can only tighten.
    if (value.maxOccursTotal !== undefined)
      overrideChildMaxOccurrences = Math.min(overrideChildMaxOccurrences, value.maxOccursTotal);

    value.overrideChildMaxOccurrences = overrideChildMaxOccurrences;
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

// --- Explicit selection (maxOccurs: 1) ---

// The active branch(es), merging the value-driven view (a branch that holds real data) with the
// explicit view (explicitlySelectedBranch). Loaded data reads as selected for free: a branch
// with a value appears here even if it was never explicitly selected.
const activeChoiceOccurrences = computed<ChoiceOccurrence[]>(() => {
  _analytics_activeChoiceOccurrencesCalculatedCount++;

  const active: ChoiceOccurrence[] = [];

  field.value?.choice?.forEach((child, index) => {
    // Repeatable case: every item in the branch's field array is an active occurrence, filled or
    // not (an empty placeholder is a committed occurrence, like an unfilled array item). Grouped
    // by branch order then by index, derived purely from the value tree.
    if (explicitChoiceSelection && maxOccurs.value > 1) {
      const branchFields = branchFieldArrays[index]?.fields.value ?? [];
      branchFields.forEach((_, occurrenceIndex) => {
        active.push({ branchKey: child.name as string, index: occurrenceIndex });
      });
      return;
    }

    const valueDriven = checkTreeHasValue(branchValueRefs[index]?.value);
    const isExplicitlySelected = explicitChoiceSelection && explicitlySelectedBranch.value === child.name;

    if (valueDriven || isExplicitlySelected) {
      active.push({ branchKey: child.name as string, index: 0 });
    }
  });

  return active;
});

// The list the `-choice-array-item` v-for renders. Identical to activeChoiceOccurrences unless
// displayOrder is 'added' (the early return adds no reactive dependency otherwise). When 'added':
// keyless occurrences (loaded data) sort first in grouped order, then keyed ones ascending. The
// key is the persisted `order` under preserveOrder (survives a remount), else insertionOrder.
const renderedChoiceOccurrences = computed<ChoiceOccurrence[]>(() => {
  _analytics_renderedChoiceOccurrencesCalculatedCount++;

  if (!displayOrder.value)
    return activeChoiceOccurrences.value;

  function sortKeyFor(occurrence: ChoiceOccurrence): number | undefined {
    if (preserveOrderEffective.value)
      return (occurrenceValue(occurrence) as { order?: number } | null)?.order;
    return insertionOrders.value.get(occurrenceKey(occurrence));
  }

  return activeChoiceOccurrences.value
    .map(occurrence => ({ occurrence, sortKey: sortKeyFor(occurrence) }))
    .sort((a, b) => {
      const aAdded = a.sortKey !== undefined;
      const bAdded = b.sortKey !== undefined;
      if (aAdded !== bAdded)
        return aAdded ? 1 : -1;
      if (!aAdded)
        return 0; // both keyless: keep grouped order (sort is stable)
      return a.sortKey! - b.sortKey!;
    })
    .map(entry => entry.occurrence);
});

// Choice-occurrence-unit count of what is consumed, derived from each branch's field array
// length. In the repeatable case a branch's maxOccurs batches its items into slots
// (ceil(items / branchMax)), the same unit xsd_choiceMinOccurs counts in, so an "N of maxOccurs"
// indicator built on this never over-counts.
const usedChoiceOccurrences = computed(() => {
  if (disabled.value)
    return 0;

  if (explicitChoiceSelection && maxOccurs.value > 1) {
    // maxOccurs is non-null: correctMetadataAndSetDefaults has defaulted every branch's.
    return branchFieldArrays.reduce((total, fieldArray, index) => {
      const branchMaxOccurrences = field.value!.choice![index].maxOccurs!;
      return total + Math.ceil(fieldArray.fields.value.length / branchMaxOccurrences);
    }, 0);
  }

  if (explicitChoiceSelection)
    return activeChoiceOccurrences.value.length;

  return valuesCount.value;
});

// In explicit mode a selected branch (maxOccurs:1) or an added occurrence (maxOccurs > 1) counts
// toward xsd_choiceMinOccurs even while empty; its own required fields validate separately. Auto
// mode stays value-driven.
const effectiveValuesCount = computed(() => {
  if (explicitChoiceSelection && maxOccurs.value === 1)
    return Math.max(valuesCount.value, explicitlySelectedBranch.value ? 1 : 0);

  if (explicitChoiceSelection && maxOccurs.value > 1)
    return Math.max(valuesCount.value, usedChoiceOccurrences.value);

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

// A choice field has no entry in the values tree, so validation anchors to the nearest parent
// path to give errors a home.
const { errors, errorMessage } = useField(normalizedPath, combinedValidation, field.value?.fieldOptions);
const fieldContext: LimitedFieldContext = { label: field.value?.fieldOptions?.label, errors, errorMessage, value: values };

// #endregion

// #region Watchers and lifecycle events

// Seed childValues so every child index exists from the start, so occurrences never returns
// undefined for a child that hasn't emitted yet. Existing indices are skipped so a metadata
// change (e.g. a recomputed metadataWithEdit) does not reset values the user has entered.
watch(field, (_field) => {
  if (!_field)
    return;

  _field.choice?.forEach((child, index) => {
    if (!(index in childValues.value))
      updateChildValue(undefined, index, child.maxOccurs);
  });
}, { immediate: true });

// Repeatable case: keep childValues in sync with each branch's field array so the occurrences /
// valuesCount machinery (and the shared budget it feeds) reflects reality without every
// occurrence emitting update:modelValue. The branch's maxOccurs is the batch size: every group of
// that many raw items consumes one shared choice slot, as a repeated element does in <xs:choice>.
if (explicitChoiceSelection) {
  watch(
    () => branchFieldArrays.map(fieldArray => fieldArray.values.value),
    (allBranchValues) => {
      if (maxOccurs.value <= 1)
        return;

      allBranchValues.forEach((branchValues, index) => {
        const branchMaxOccurrences = field.value!.choice![index].maxOccurs!;
        updateChildValue(branchValues, index, branchMaxOccurrences);
      });
    },
    { immediate: true },
  );
}

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

  // For a non-array child an undefined means "no value"; filter it out so it doesn't inflate
  // the occurrence count.
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

// --- Explicit selection primitives ---

function branchIndexOf(branchKey: string): number {
  return field.value?.choice?.findIndex(child => child.name === branchKey) ?? -1;
}

// Max-occurs override for the single active branch (maxOccurs:1). Only one branch is ever active,
// so there is no shared budget to contend for, only the branch's own maxOccursTotal. Read from
// static metadata, not the reactive `occurrences`, so it stays stable as the branch populates
// (no extra render) while still applying the cap.
function branchMaxOccursOverride(branchKey: string): number | undefined {
  if (_maxOccursOverride.value === 0)
    return 0; // whole choice disabled
  return branchByKey(branchKey)?.maxOccursTotal ?? _maxOccursOverride.value;
}

function branchByKey(branchKey: string): InternalMetadata | undefined {
  const index = branchIndexOf(branchKey);
  return index >= 0 ? (field.value?.choice?.[index] as InternalMetadata) : undefined;
}

// Clears a deselected branch's data through the form context. The residual undefined-valued key
// setInPath leaves behind is the accepted contract; callers wanting a clean tree run
// removeNullValues at submit time. The childValues entry is reset synchronously here (not left to
// the branch's unmount) so valuesCount/combinedValidation settle in one tick.
//
// When `stash` is true (only the switch-away path opts in) the branch's current values are
// deep-cloned into stashedBranchValues before the clear.
function clearBranch(branchKey: string, options: { stash?: boolean } = {}) {
  const index = branchIndexOf(branchKey);
  if (index < 0)
    return;

  const branchChild = field.value?.choice?.[index];
  const branchPath = branchChild?.path ? overridePath(branchChild.path, props.pathOverride) : undefined;

  if (options.stash) {
    // deepCloneValue, not structuredClone: a branch with children reads back as a reactive Proxy,
    // and structuredClone throws DataCloneError on a Proxy, which would abort the switch.
    stashedBranchValues.value[branchKey] = deepCloneValue(branchValueRefs[index]?.value ?? undefined);
  }
  else if (branchKey in stashedBranchValues.value) {
    // A non-preserving clear (explicit remove/deselect) drops any earlier stash, so re-selecting
    // the branch later starts empty instead of resurrecting discarded data.
    delete stashedBranchValues.value[branchKey];
  }

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

// Restores a stashed branch's values, if any, just before the branch is marked active again, so
// its DynamicFormItem mounts with the data already present (the value lands in the values tree
// before the branch reads it). shouldValidate: false mirrors clearBranch so a restored-but-empty
// required field does not flash an error. Membership is checked with `in`, not truthiness, since
// an empty branch can be stashed as `undefined`. No branchPath fallback: the only caller
// (addChoiceOccurrence) has already confirmed the branch exists.
function restoreStashedBranch(branchKey: string) {
  if (!preserveOnSwitch.value || !(branchKey in stashedBranchValues.value))
    return;

  const index = branchIndexOf(branchKey);
  const branchPath = overridePath(field.value!.choice![index].path as string, props.pathOverride);
  formContext?.setFieldValue(branchPath as any, stashedBranchValues.value[branchKey], false);
}

/** Mark a branch active (maxOccurs:1) or add one occurrence of it (maxOccurs > 1). No-op when canAddChoiceOccurrence is false, or the branchKey is unknown. */
function addChoiceOccurrence(branchKey: string) {
  // Also covers an unknown branchKey (canAddChoiceOccurrence returns false when branchIndexOf < 0).
  if (!canAddChoiceOccurrence(branchKey))
    return;

  const index = branchIndexOf(branchKey);

  if (maxOccurs.value > 1) {
    // Repeatable case: push a real (possibly empty) item into the branch's field array, mirroring
    // DynamicFormItemArray's _addItem. The pushed item IS the selection, so activeChoiceOccurrences
    // picks it up on the next recompute. Insertion order is assigned here, at press time, not
    // lazily over the grouped activeChoiceOccurrences list (which would encode grouped order).
    const newOccurrenceIndex = branchFieldArrays[index]?.fields.value.length ?? 0;

    // Cross-branch count before the push. When the persisted tier is active every branch is
    // object-shaped, and normalizeOrder keeps the existing orders contiguous 1..N, so count + 1
    // is always the next rank.
    const activeCountBeforePush = activeChoiceOccurrences.value.length;

    if (preserveOrderEffective.value) {
      // Seeded in the push so the entry is born holding `order`, with no null-to-object transition.
      branchFieldArrays[index]?.push({ order: activeCountBeforePush + 1 });
    }
    else {
      branchFieldArrays[index]?.push(null); // empty placeholder
    }

    insertionOrders.value.set(occurrenceKey({ branchKey, index: newOccurrenceIndex }), ++insertionCounter);
    return;
  }

  // maxOccurs: 1: mark a single branch active, clearing any other currently-active branch.
  if (explicitlySelectedBranch.value === branchKey)
    return; // idempotent: already selected

  // Iterate activeChoiceOccurrences, not explicitlySelectedBranch: a branch can be active purely
  // from loaded values, and switching away must still clear it or two branches end up active.
  for (const occurrence of activeChoiceOccurrences.value) {
    if (occurrence.branchKey !== branchKey) {
      clearBranch(occurrence.branchKey, { stash: preserveOnSwitch.value });
    }
  }

  restoreStashedBranch(branchKey);

  explicitlySelectedBranch.value = branchKey;
}

/** Remove a previously added occurrence. In maxOccurs > 1 the index selects which occurrence to remove; omitting it removes the last one, mirroring addChoiceOccurrence(branchKey) which appends with only a branchKey. In maxOccurs:1 the index is ignored and it deselects the active branch. No-op for an unknown branchKey, an inactive branch, an empty branch, or an out-of-range index. */
function removeChoiceOccurrence(branchKey: string, index?: number) {
  const branchIdx = branchIndexOf(branchKey);
  if (branchIdx < 0)
    return;

  if (maxOccurs.value > 1) {
    const fieldsLength = branchFieldArrays[branchIdx]?.fields.value.length ?? 0;

    // Default to the last occurrence so a template can offer a plain "remove one" control
    // symmetric with addChoiceOccurrence(branchKey), without tracking indices itself.
    const targetIndex = index ?? fieldsLength - 1;
    if (targetIndex < 0 || targetIndex >= fieldsLength)
      return; // empty branch or out-of-range: no-op, no throw

    // Drop the removed occurrence's ephemeral add-order before it leaves the field array, so the
    // Map stays bounded by the live occurrence count over a long add/remove session instead of
    // accumulating an entry per press. Resolved off the still-present entry's stable key.
    const removedKey = occurrenceKey({ branchKey, index: targetIndex });

    branchFieldArrays[branchIdx]?.remove(targetIndex);
    insertionOrders.value.delete(removedKey);

    if (preserveOrderEffective.value)
      normalizeOrder();

    return;
  }

  // maxOccurs: 1: index is ignored; deselect the active branch.
  const isActive = activeChoiceOccurrences.value.some(occurrence => occurrence.branchKey === branchKey);
  if (!isActive)
    return;

  clearBranch(branchKey);

  if (explicitlySelectedBranch.value === branchKey) {
    explicitlySelectedBranch.value = null;
  }
}

/**
 * Per-branch "may add" guard: false when the choice is disabled or branchKey is unknown.
 * maxOccurs:1 has no per-branch budget. maxOccurs > 1 checks the shared budget via the
 * occurrences computed's overrideChildMaxOccurrences, which already folds in the branch's
 * maxOccurs batch size and its optional maxOccursTotal cap, so no separate check is needed.
 */
function canAddChoiceOccurrence(branchKey: string): boolean {
  if (disabled.value)
    return false;

  const index = branchIndexOf(branchKey);
  if (index < 0)
    return false;

  if (maxOccurs.value <= 1)
    return true; // no per-branch budget in the single case

  const branchCount = branchFieldArrays[index].fields.value.length;

  const remainingSharedBudget = occurrences.value[index]?.overrideChildMaxOccurrences;
  return remainingSharedBudget === undefined || branchCount < remainingSharedBudget;
}

// Per-branch field array helper for a branchKey. An unknown key yields undefined via plain
// negative-index semantics (branchFieldArrays[-1]), no explicit guard needed.
function branchFieldArrayFor(branchKey: string) {
  return branchFieldArrays[branchIndexOf(branchKey)];
}

// The raw field-array key of an occurrence. Each branch generates these independently, so the same
// raw key can recur across branches; namespace it (see occurrenceKey) for a whole-list-unique key.
function rawOccurrenceKey(occurrence: ChoiceOccurrence): string | number {
  return branchFieldArrayFor(occurrence.branchKey).fields.value[occurrence.index].key;
}

// The Vue :key for an occurrence, namespaced with branchKey so two branches' occurrences can't
// collide on the same raw key and make v-for reuse one branch's instance for another's.
function occurrenceKey(occurrence: ChoiceOccurrence): string {
  return `${occurrence.branchKey}:${rawOccurrenceKey(occurrence)}`;
}

/** The resolved pathOverride for a single repeatable-choice occurrence, e.g. `pick.apiEndpoint[0]`. */
function occurrencePathOverride(occurrence: ChoiceOccurrence): string {
  return `${branchPaths[branchIndexOf(occurrence.branchKey)].value}[${occurrence.index}]`;
}

/** The occurrence's own current value, read directly off its branch's field array. */
function occurrenceValue(occurrence: ChoiceOccurrence): unknown {
  return branchFieldArrayFor(occurrence.branchKey).fields.value[occurrence.index].value;
}

// Re-ranks every occurrence's `order` to a contiguous 1..N, preserving the relative order the
// existing values encode: an occurrence keeps its position by its current `order`, one missing
// it seeds from this session's add-order (insertionOrder) when it has one, else from its grouped
// position. The stable sort keeps grouped order between equal keys, so gapped, duplicated and
// missing values all resolve deterministically. Only occurrences whose rank changed are written.
// Runs at mount, after a removal, and when preserveOrder flips on, so `order` is contiguous
// 1..N at every point the add path relies on it.
//
// Seeding a missing `order` from insertionOrder is what makes a live preserveOrder flip-on keep
// the sequence the user built rather than snapping back to grouped order. The two seed sources
// never clash: an occurrence added this session under an active persisted tier is born holding
// `order`, so an occurrence with an insertionOrder but no `order` only exists while the tier is
// off, and at that moment no occurrence has an `order` at all. Offsetting session seeds past
// `total` keeps a loaded occurrence (no add-press this session) ahead of session-added ones, in
// its grouped position, matching the ephemeral tier's fallback. With no session adds (mount /
// reload) every seed is grouped position, unchanged.
function normalizeOrder() {
  const occurrences = activeChoiceOccurrences.value;
  const total = occurrences.length;

  const ranked = occurrences
    .map((occurrence, position) => {
      const currentOrder = (occurrenceValue(occurrence) as { order?: number } | null)?.order;
      const insertionOrder = insertionOrders.value.get(occurrenceKey(occurrence));
      const sortKey = currentOrder
        ?? (insertionOrder !== undefined ? total + insertionOrder : position + 1);
      return { occurrence, currentOrder, sortKey };
    })
    .sort((a, b) => a.sortKey - b.sortKey);

  ranked.forEach(({ occurrence, currentOrder }, position) => {
    const newRank = position + 1;
    if (currentOrder === newRank)
      return;

    formContext?.setFieldValue(`${occurrencePathOverride(occurrence)}.order` as any, newRank, false);
  });
}

// Removes `order` from every occurrence when preserveOrder flips off while mounted, so opting
// out actually takes the persisted data out of the submitted shape. The write leaves the same
// residual undefined-valued key clearBranch's contract accepts; removeNullValues strips it at
// submit time. Only ever runs on an observed flip, never on mounting with the flag absent, so
// loaded data is never touched by a flag that merely is not set.
function stripOrder() {
  activeChoiceOccurrences.value.forEach((occurrence) => {
    const value = occurrenceValue(occurrence) as { order?: number } | null;
    if (value && typeof value === 'object' && 'order' in value)
      formContext?.setFieldValue(`${occurrencePathOverride(occurrence)}.order` as any, undefined, false);
  });
}

// Memoized per-occurrence remove handlers, keyed by occurrenceKey, so an unaffected occurrence
// keeps the same handler reference across an add/remove elsewhere and doesn't needlessly re-render
// (a plain inline arrow would hand each one a fresh reference). The handler resolves the
// occurrence's current index by its raw key at call time, so it removes the right item even after
// an earlier removal reindexed it.
const occurrenceRemoveHandlers = new Map<string, () => void>();
function removeItemHandlerFor(occurrence: ChoiceOccurrence): () => void {
  const mapKey = occurrenceKey(occurrence);
  const cached = occurrenceRemoveHandlers.get(mapKey);
  if (cached)
    return cached;

  const rawKey = rawOccurrenceKey(occurrence);
  const handler = () => {
    const currentIndex = branchFieldArrayFor(occurrence.branchKey).fields.value.findIndex(entry => entry.key === rawKey);
    if (currentIndex >= 0) {
      removeChoiceOccurrence(occurrence.branchKey, currentIndex);
    }
    occurrenceRemoveHandlers.delete(mapKey);
  };
  occurrenceRemoveHandlers.set(mapKey, handler);
  return handler;
}

// Memoized per-branch add handlers, for the same render-stability reason as the remove handlers.
// "Add" on an occurrence appends another occurrence of its own branch, so a generic -array-item
// template behaves like a real array item. Keyed by branchKey, so the map stays bounded by the
// branch count.
const branchAddHandlers = new Map<string, () => void>();
function addItemHandlerFor(branchKey: string): () => void {
  let handler = branchAddHandlers.get(branchKey);
  if (!handler) {
    handler = () => addChoiceOccurrence(branchKey);
    branchAddHandlers.set(branchKey, handler);
  }
  return handler;
}

// Whether the persisted tier is running right now: the effective flag, in the repeatable
// explicit case, with the choice not disabled.
const persistedTierActive = computed(() =>
  preserveOrderEffective.value && explicitChoiceSelection && maxOccurs.value > 1);

// Whenever the persisted tier becomes active (mount with the flag on, a live flip-on, or the
// choice re-enabling), normalize existing occurrences so `order` is contiguous 1..N before the
// next add-press relies on it. immediate: true makes the mount case run synchronously during
// setup, before the template mounts and any add-press can occur.
watch(persistedTierActive, (isActive) => {
  if (isActive)
    normalizeOrder();
}, { immediate: true });

// Strip `order` only when the flag itself flips off while the choice is still repeatable, not
// when the tier merely deactivates because the choice got disabled (a maxOccursOverride of 0 is
// often temporary, and stripping there would destroy data on a disable).
watch(preserveOrderEffective, (isOn, wasOn) => {
  if (!explicitChoiceSelection || maxOccurs.value <= 1)
    return;

  if (!isOn && wasOn)
    stripOrder();
});

if (import.meta.env.DEV) {
  // Misconfiguration warnings, once per condition per component lifetime.
  let warnedScalarBranches = false;
  let warnedOrderCollision = false;
  watch(preserveOrderRequested, (requested) => {
    if (!requested || !explicitChoiceSelection || (field.value?.maxOccurs ?? 1) <= 1)
      return;

    if (!allBranchesObjectShaped && !warnedScalarBranches) {
      warnedScalarBranches = true;
      const scalarBranches = (field.value?.choice ?? [])
        .filter(child => (child.children?.length ?? 0) === 0)
        .map(child => `"${child.name}"`)
        .join(', ');
      console.warn(`[vue-dynamic-form] preserveOrder is disabled for this whole choice: branch(es) ${scalarBranches} have no children, so their occurrences have nowhere to attach an "order" field. Give every branch children to enable preserveOrder.`);
    }

    if (allBranchesObjectShaped && !warnedOrderCollision) {
      const collidingBranches = (field.value?.choice ?? [])
        .filter(child => child.children?.some(grandChild => grandChild.name === 'order'))
        .map(child => `"${child.name}"`)
        .join(', ');
      if (collidingBranches) {
        warnedOrderCollision = true;
        console.warn(`[vue-dynamic-form] preserveOrder writes an "order" field into each occurrence, and branch(es) ${collidingBranches} declare a child with that same name; the child's value will be overwritten by the ordering. Rename the child or do not enable preserveOrder on this choice.`);
      }
    }
  }, { immediate: true });
}

// #endregion
</script>

<template>
  <component
    :is="template"
    v-slot="slotProps"
    :type="slotType"
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
    :used-choice-occurrences="usedChoiceOccurrences"
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
    <template v-else-if="explicitChoiceSelection && maxOccurs === 1">
      <!-- Exactly one active branch, rendered directly (no -choice-array-item wrapping). -->
      <DynamicFormItem
        v-for="occurrence in activeChoiceOccurrences"
        :key="occurrence.branchKey"
        :field-metadata="(branchByKey(occurrence.branchKey) as InternalMetadata)"
        :path-override
        :index="branchIndexOf(occurrence.branchKey)"
        :template
        :slot-props
        :min-occurs-override="_minOccursOverride"
        :max-occurs-override="branchMaxOccursOverride(occurrence.branchKey)"
        :is-array-override="childrenAreArrays"
        part-of-choice-field

        @update:model-value="updateChildValue($event, branchIndexOf(occurrence.branchKey), branchByKey(occurrence.branchKey)!.maxOccurs)"
        @update:computed-field="emits('update:computedField', $event)"
      />
    </template>
    <template v-else-if="explicitChoiceSelection">
      <!--
        One DynamicFormItem per active occurrence across every branch, through the
        *-choice-array-item slot (mirrors DynamicFormItemArray's items). Iterated over
        renderedChoiceOccurrences (the displayed order); globalIndex is this loop's index over it.
        partOfArrayField makes DynamicFormItem skip its onBeforeUnmount "write undefined back"
        cleanup, since removal already goes through the branch's field array (writing here too
        would hit a since-reindexed path).
      -->
      <DynamicFormItem
        v-for="(occurrence, globalIndex) in renderedChoiceOccurrences"
        :key="occurrenceKey(occurrence)"
        :field-metadata="(branchByKey(occurrence.branchKey) as InternalMetadata)"
        :path-override="occurrencePathOverride(occurrence)"
        :index="occurrence.index"
        :template
        :slot-props
        :max-occurs-override="1"
        is-array-override="single"
        part-of-array-field
        part-of-choice-field
        :branch-key="occurrence.branchKey"
        :global-index="globalIndex"
        :insertion-order="insertionOrders.get(occurrenceKey(occurrence))"
        :can-add-items="canAddChoiceOccurrence(occurrence.branchKey)"
        :add-item="addItemHandlerFor(occurrence.branchKey)"
        :can-remove-items="true"
        :remove-item="removeItemHandlerFor(occurrence)"

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
