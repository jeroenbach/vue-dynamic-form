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

// `explicitChoiceSelection` is static metadata: captured once at setup rather than read
// reactively from `field`. `field` is the parent's `computedField`, so a `computedProps`
// mutation of `thisField.explicitChoiceSelection` (only possible via an `as any` cast, since
// the property is excluded from `ComputedPropsFieldType`) would otherwise still be visible here
// and could flip the render mode mid-form, causing an initial flash and a mount-unmount storm.
const explicitChoiceSelection = props.fieldMetadata?.explicitChoiceSelection === true;

// `preserveOnSwitch` is likewise static metadata, captured once at setup for the same
// reason as `explicitChoiceSelection` above: it is excluded from `ComputedPropsFieldType`, so
// this is purely defence in depth against an `as any` cast, not a reachable runtime mutation.
const preserveOnSwitch = props.fieldMetadata?.preserveOnSwitch === true;

// `displayOrder` is likewise static metadata, captured once at setup for the same reason as
// `explicitChoiceSelection`/`preserveOnSwitch` above: it is excluded from `ComputedPropsFieldType`,
// so this is defence in depth against an `as any` cast, not a reachable runtime mutation. Only
// `'added'` is meaningful here; absent or `'grouped'` both fall through to the identity path in
// renderedChoiceOccurrences below.
const displayOrder = props.fieldMetadata?.displayOrder === 'added';

// vee-validate form context, used to clear a deselected branch's data on switch.
// `DynamicFormItemChoice` is always a descendant of the `useForm()` call in `useDynamicForm`,
// so a plain `useFormContext()` resolves it here (unlike the same-instance quirk
// `useValidatePartialForm` has to guard against).
const formContext = useFormContext();

// Ephemeral UI state for the `maxOccurs: 1` explicit-selection case. Never written to
// form `values` — selection is tracked here and folded into the existing occurrence math below.
const explicitlySelectedBranch = ref<string | null>(null);

// Ephemeral, instance-local stash for preserve-on-switch, keyed by branchKey. Never written to
// form `values`, exactly like `explicitlySelectedBranch` above. Only populated/read when
// `preserveOnSwitch` is enabled; scoped to `maxOccurs: 1`. Keyed (not appended), so its size
// stays bounded by the number of branches no matter how often the user switches.
const stashedBranchValues = ref<Record<string, unknown>>({});

// Ephemeral, instance-local record of add-press order for a repeatable explicit choice
// (maxOccurs > 1), keyed by the stable occurrenceKey so it survives an ancestor reindex. Never
// written to form `values`, exactly like the refs above. `insertionCounter` is a plain (not
// reactive) variable, mirroring the _analytics_* counters: only the Map write below needs to
// trigger reactivity, not the counter itself.
const insertionOrders = ref<Map<string, number>>(new Map());
let insertionCounter = 0;

// Value-driven read per branch, independent of whether that branch's own DynamicFormItem is
// currently mounted. Needed for the "loading saved data still reads as selected" guarantee:
// in explicit mode only active branches are mounted, so an unmounted branch could
// never self-report a pre-loaded value through childValues (which only ever hears from a branch
// once it is mounted). Resolved through a getter (not a plain string) so it keeps tracking the
// right path if pathOverride changes reactively (e.g. an earlier array sibling being
// removed re-indexes this choice's own pathOverride). The branch list itself is static metadata,
// so a fixed number of useFieldValue() calls at setup satisfies the rules of hooks.
const branchValueRefs = (field.value?.choice ?? []).map(child =>
  useFieldValue(() => child.path ? overridePath(child.path, props.pathOverride) : ''),
);

// Per-branch reactive path + field array, used for the repeatable case (maxOccurs > 1 explicit
// selection). Created once per branch at setup (branches are static metadata), but each over a
// reactive computed path, never a setup-time string: a choice nested inside an array occurrence
// has a pathOverride that reindexes when an earlier sibling array item is removed, and the
// field array must keep following that change rather than staying bound to a stale path.
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

// A repeatable choice (declared maxOccurs > 1) renders through the -choice-array slot family;
// a single choice (maxOccurs: 1) through -choice. Based on the declared maxOccurs (like
// childrenAreArrays above), not the overridable budget, so a maxOccursOverride of 0 (disabled)
// cannot flip an otherwise repeatable choice into the single slot family.
const slotType = computed(() =>
  `${field.value?.type}${field.value?.maxOccurs > 1 ? '-choice-array' : '-choice'}`);

// --- Child value tracking ---

// Each child reports its current value here so we can calculate the shared occurrence budget.
const childValues = ref<{ [index: string]: ChildValue }>({});

// Raw child values are emitted upward as-is; occurrence-aware counting happens below.
const values = computed(() => Object.values(childValues.value).map(x => x.value));

// --- Single-child shortcut ---

// When a choice field has exactly one option there is no meaningful branching — skip
// all occurrence math and render that one child directly.
// Bypassed when explicitChoiceSelection is set: a single-branch explicit
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
      // The branch's own opt-in non-XSD total-occurrence cap, carried alongside the shared-budget
      // numbers above so pass 2 can clamp to it without a second pass over field.value.choice.
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
      maxOccursTotal: field.value?.choice?.[Number(key)]?.maxOccursTotal,
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

    let overrideChildMaxOccurrences = totalChildOccurrences - othersAsChildOccurrences;

    // maxOccursTotal is a raw-item cap independent of the shared XSD budget above; it can only
    // tighten the result, never loosen it.
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

// The active branch(es), merging the value-driven view (a branch with real data, the existing
// childValues-based logic) with the explicit view (explicitlySelectedBranch). This is what makes
// "loading saved data still reads as selected" fall out for free: a loaded-but-not-explicitly-
// selected branch still appears here because it already has a value.
const activeChoiceOccurrences = computed<ChoiceOccurrence[]>(() => {
  _analytics_activeChoiceOccurrencesCalculatedCount++;

  const active: ChoiceOccurrence[] = [];

  field.value?.choice?.forEach((child, index) => {
    // Repeatable case: every item currently in this branch's own field array is an active
    // occurrence, whether or not it holds a value yet. An empty placeholder is a real,
    // already-committed occurrence ("selected" means "a placeholder item exists"), the same
    // way an unfilled array item is still an item. Grouped by branch declaration order, then
    // by index within the branch, derived purely from the value tree with no separate
    // ordering list.
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

// The list the `-choice-array-item` v-for actually renders. Equal to activeChoiceOccurrences
// (same membership, same order) whenever displayOrder is not 'added': the falsy branch returns
// early without reading insertionOrders, so it introduces no extra reactive dependency and stays
// byte-identical to the pre-existing behaviour. When displayOrder is 'added', occurrences with no
// insertionOrder entry (loaded, pre-existing data) sort first, in their grouped order, followed by
// occurrences that do have one, ascending by that value: a deterministic two-key comparator that
// never compares undefined numerically, so no NaN/implementation-defined ordering can occur for a
// mixed loaded-and-added set.
const renderedChoiceOccurrences = computed<ChoiceOccurrence[]>(() => {
  _analytics_renderedChoiceOccurrencesCalculatedCount++;

  if (!displayOrder)
    return activeChoiceOccurrences.value;

  return activeChoiceOccurrences.value
    .map(occurrence => ({ occurrence, insertionOrder: insertionOrders.value.get(occurrenceKey(occurrence)) }))
    .sort((a, b) => {
      const aAdded = a.insertionOrder !== undefined;
      const bAdded = b.insertionOrder !== undefined;
      if (aAdded !== bAdded)
        return aAdded ? 1 : -1;
      if (!aAdded)
        return 0; // both loaded: keep grouped (activeChoiceOccurrences) order, sort is stable
      return a.insertionOrder! - b.insertionOrder!;
    })
    .map(entry => entry.occurrence);
});

// Choice-occurrence-unit count of what is currently consumed, derived structurally from each
// branch's own field array length rather than from values. In the repeatable explicit case a
// branch's maxOccurs batches its raw items into slots (ceil(items / branchMax) per branch), the
// same unit xsd_choiceMinOccurs counts in, so an "N of maxOccurs" indicator built on this never
// silently over-counts once a branch's items and its choice slots diverge.
const usedChoiceOccurrences = computed(() => {
  if (disabled.value)
    return 0;

  if (explicitChoiceSelection && maxOccurs.value > 1) {
    // Non-null: correctMetadataAndSetDefaults has already defaulted every branch's maxOccurs.
    return branchFieldArrays.reduce((total, fieldArray, index) => {
      const branchMaxOccurrences = field.value!.choice![index].maxOccurs!;
      return total + Math.ceil(fieldArray.fields.value.length / branchMaxOccurrences);
    }, 0);
  }

  if (explicitChoiceSelection)
    return activeChoiceOccurrences.value.length;

  return valuesCount.value;
});

// In explicit mode, an explicitly selected branch (maxOccurs: 1) or an added occurrence
// (maxOccurs > 1) counts toward xsd_choiceMinOccurs even before any of its fields hold a value;
// the branch's own required fields then drive their own validation independently. Auto mode
// stays value-driven, unchanged.
const effectiveValuesCount = computed(() => {
  if (explicitChoiceSelection && maxOccurs.value === 1)
    return Math.max(valuesCount.value, explicitlySelectedBranch.value ? 1 : 0);

  if (explicitChoiceSelection && maxOccurs.value > 1)
    return Math.max(valuesCount.value, usedChoiceOccurrences.value);

  // Auto mode stays value-driven, unchanged.
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

// Repeatable case: keep childValues in sync with each branch's own field array, so the
// existing occurrences/valuesCount machinery (and, through it, the shared choice-level budget in
// overrideChildMaxOccurrences) reflects reality without needing every occurrence's DynamicFormItem
// to individually emit update:modelValue. The branch's own maxOccurs is used as the batch size,
// exactly like the auto-mode template branch below: every group of up to that many raw items
// consumes one shared choice slot, matching how a repeated element behaves inside <xs:choice>.
if (explicitChoiceSelection) {
  watch(
    () => branchFieldArrays.map(fieldArray => fieldArray.values.value),
    (allBranchValues) => {
      if (maxOccurs.value <= 1)
        return;

      allBranchValues.forEach((branchValues, index) => {
        // Non-null: correctMetadataAndSetDefaults has already defaulted every branch's maxOccurs.
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

// --- Explicit selection primitives ---

function branchIndexOf(branchKey: string): number {
  return field.value?.choice?.findIndex(child => child.name === branchKey) ?? -1;
}

// Max-occurs override for the single active branch in the maxOccurs:1 explicit case. There is no
// shared cross-branch budget to contend for here (only one branch is ever active), so the only
// extra ceiling is the branch's own opt-in maxOccursTotal. Read from static metadata rather than
// the reactive `occurrences` computed so it does not change as the branch's value populates:
// that keeps a restored branch's first render stable (no extra recompute-driven render), and
// still applies the cap the auto-mode path applies through overrideChildMaxOccurrences.
function branchMaxOccursOverride(branchKey: string): number | undefined {
  if (_maxOccursOverride.value === 0)
    return 0; // whole choice disabled
  return branchByKey(branchKey)?.maxOccursTotal ?? _maxOccursOverride.value;
}

function branchByKey(branchKey: string): InternalMetadata | undefined {
  const index = branchIndexOf(branchKey);
  return index >= 0 ? (field.value?.choice?.[index] as InternalMetadata) : undefined;
}

// Clears a deselected branch's data through the vee-validate form context, resolved via the
// same overridePath the rest of the component uses so this is correct through array indices.
// The residual `undefined`-valued key that setInPath leaves behind is the accepted
// contract; consumers who need a byte-clean tree call the exported removeNullValues at submit time.
// The childValues entry is also reset synchronously here (not left to the branch's own unmount),
// so valuesCount/combinedValidation settle in one tick instead of oscillating.
//
// `stash` is passed by the caller (only the switch-away path in addChoiceOccurrence opts in)
// and, when true, deep-clones the branch's current values into `stashedBranchValues` BEFORE the
// clear below, using the same value-driven read (`branchValueRefs`, backed by vee-validate's
// `useFieldValue` at this exact branchPath) already used for the value-driven active-branch view.
function clearBranch(branchKey: string, options: { stash?: boolean } = {}) {
  const index = branchIndexOf(branchKey);
  if (index < 0)
    return;

  const branchChild = field.value?.choice?.[index];
  const branchPath = branchChild?.path ? overridePath(branchChild.path, props.pathOverride) : undefined;

  if (options.stash) {
    // deepCloneValue, not structuredClone: a branch with children reads back as a Vue reactive
    // Proxy here, and structuredClone throws a DataCloneError on a Proxy, which would abort the
    // switch entirely (the previously selected branch could then never be deselected).
    stashedBranchValues.value[branchKey] = deepCloneValue(branchValueRefs[index]?.value ?? undefined);
  }
  else if (branchKey in stashedBranchValues.value) {
    // A non-preserving clear (an explicit remove/deselect, not a switch-away) forgets any earlier
    // stash for this branch, so re-selecting it later starts empty instead of resurrecting data
    // the user has since discarded.
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

// Restores a previously stashed branch's values, if a stash entry exists for it. Called right
// before the branch is marked active again, so its DynamicFormItem mounts with the restored
// data already present on its very first render (no oscillation: the value is committed to the
// vee-validate values tree before the branch mounts and reads it). `shouldValidate: false`
// mirrors clearBranch's own clear call, so a restored-but-still-empty required field does not
// flash an error immediately after restore.
// A no-op, no-throw when no stash entry exists yet for this branch (e.g. its first-ever
// selection); checked with `in` rather than a truthiness check, since an empty branch can be
// legitimately stashed as `undefined`. No defensive branchPath fallback is needed here (unlike
// clearBranch, which is also reachable from removeChoiceOccurrence with less upstream
// validation): restoreStashedBranch is only ever called from addChoiceOccurrence, immediately
// after canAddChoiceOccurrence(branchKey) has already confirmed branchIndexOf(branchKey) >= 0,
// so the branch (and its `path`, always set by correctMetadataAndSetDefaults) is guaranteed to
// exist.
function restoreStashedBranch(branchKey: string) {
  if (!preserveOnSwitch || !(branchKey in stashedBranchValues.value))
    return;

  const index = branchIndexOf(branchKey);
  const branchPath = overridePath(field.value!.choice![index].path as string, props.pathOverride);
  formContext?.setFieldValue(branchPath as any, stashedBranchValues.value[branchKey], false);
}

/** Mark a branch active (maxOccurs:1) or add one occurrence of it (maxOccurs > 1). No-op when canAddChoiceOccurrence is false, or the branchKey is unknown. */
function addChoiceOccurrence(branchKey: string) {
  // canAddChoiceOccurrence already returns false for an unknown branchKey (branchIndexOf < 0),
  // so no separate existence check is needed here.
  if (!canAddChoiceOccurrence(branchKey))
    return;

  const index = branchIndexOf(branchKey);

  if (maxOccurs.value > 1) {
    // Repeatable case: an occurrence is a real (possibly empty) item pushed into the
    // branch's own field array via useFieldArrayExtended, mirroring DynamicFormItemArray's own
    // _addItem. No separate ephemeral selection ref is needed: the pushed item IS the
    // selection, so activeChoiceOccurrences picks it up on the next recompute.
    //
    // The occurrence's position in its own branch (before the push) is what its key resolves to
    // right after the push, so the insertion order is assigned here, at add-press time, rather
    // than lazily while iterating the grouped activeChoiceOccurrences list: that list is grouped
    // by branch, so a lazy assignment would encode grouped order, not press order.
    const newOccurrenceIndex = branchFieldArrays[index]?.fields.value.length ?? 0;
    branchFieldArrays[index]?.push(null); // empty placeholder
    insertionOrders.value.set(occurrenceKey({ branchKey, index: newOccurrenceIndex }), ++insertionCounter);
    return;
  }

  // maxOccurs: 1: mark a single branch active, clearing any other currently-active branch.
  if (explicitlySelectedBranch.value === branchKey)
    return; // idempotent: already selected

  // Clear every other active branch, derived from activeChoiceOccurrences rather than from
  // explicitlySelectedBranch alone: a branch can be active purely because loaded values put a
  // value in it (value-driven, never explicitly selected), and switching away from such a branch
  // must still clear it, or a single-occurrence choice would end up with two branches active.
  for (const occurrence of activeChoiceOccurrences.value) {
    if (occurrence.branchKey !== branchKey) {
      // Stash the deselected branch's values before clearing when preserveOnSwitch is on.
      clearBranch(occurrence.branchKey, { stash: preserveOnSwitch });
    }
  }

  // Restore any stash for the newly selected branch before it mounts.
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

    // Default to the last occurrence so a template can offer a plain "remove one of this branch"
    // control symmetric with addChoiceOccurrence(branchKey), without tracking indices itself.
    const targetIndex = index ?? fieldsLength - 1;
    if (targetIndex < 0 || targetIndex >= fieldsLength)
      return; // empty branch or out-of-range: no-op, no throw

    branchFieldArrays[branchIdx]?.remove(targetIndex);
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
 * maxOccurs:1 has no per-branch budget to exhaust. maxOccurs > 1 checks the shared
 * choice-level budget, read from the existing occurrences computed's overrideChildMaxOccurrences.
 * That value is fed a batch size equal to the branch's own maxOccurs (see the childValues-sync
 * watch above), so it already expresses the branch's true XSD headroom in raw-item units;
 * a branch's optional maxOccursTotal (a non-XSD total-count cap) is folded into the same
 * overrideChildMaxOccurrences by the occurrences computed's pass 2, so no separate check is
 * needed here.
 */
function canAddChoiceOccurrence(branchKey: string): boolean {
  if (disabled.value)
    return false;

  const index = branchIndexOf(branchKey);
  if (index < 0)
    return false;

  if (maxOccurs.value <= 1)
    return true; // no per-branch budget in the single case

  // Safe without further guards: `index` was already validated above, and `branchFieldArrays`
  // is built from (and stays the same length as) the same static branch list as field.value.choice.
  const branchCount = branchFieldArrays[index].fields.value.length;

  const remainingSharedBudget = occurrences.value[index]?.overrideChildMaxOccurrences;
  return remainingSharedBudget === undefined || branchCount < remainingSharedBudget;
}

/**
 * Looks up the per-branch field array helper for a given branchKey. Relies on plain
 * negative-index array semantics (`branchFieldArrays[-1]` is `undefined` at runtime) rather than
 * an explicit guard, for an unknown branchKey.
 */
function branchFieldArrayFor(branchKey: string) {
  return branchFieldArrays[branchIndexOf(branchKey)];
}

/**
 * The raw vee-validate field-array key of an occurrence. Only ever called with a real occurrence
 * from `activeChoiceOccurrences`, which is itself derived directly from these same field arrays,
 * so `branchKey`/`index` are always valid here — no defensive fallback needed. Each branch's own
 * `useFieldArrayExtended` generates these keys independently, so the same raw value can be
 * assigned to occurrences in *different* branches (e.g. both branches' first-ever item); callers
 * that need a value unique across the whole merged, all-branches list must namespace it with the
 * branchKey (see occurrenceKey below).
 */
function rawOccurrenceKey(occurrence: ChoiceOccurrence): string | number {
  return branchFieldArrayFor(occurrence.branchKey).fields.value[occurrence.index].key;
}

/**
 * The Vue :key for an occurrence, namespaced with its branchKey so it stays unique across the
 * merged, all-branches list (see rawOccurrenceKey) — without the namespace, two different
 * branches' occurrences could collide on the same raw key and Vue's v-for would wrongly reuse one
 * branch's component instance for another branch's occurrence instead of mounting a new one.
 */
function occurrenceKey(occurrence: ChoiceOccurrence): string {
  return `${occurrence.branchKey}:${rawOccurrenceKey(occurrence)}`;
}

/** The resolved pathOverride for a single repeatable-choice occurrence, e.g. `pick.apiEndpoint[0]`. */
function occurrencePathOverride(occurrence: ChoiceOccurrence): string {
  return `${branchPaths[branchIndexOf(occurrence.branchKey)].value}[${occurrence.index}]`;
}

// Memoized per-occurrence remove-item handlers, keyed by the same namespaced key used for
// the Vue :key (occurrenceKey). Vue's v-for regenerates every item's inline bindings whenever the
// list itself changes (an occurrence is added/removed anywhere in the choice), so a plain inline
// arrow function here would hand every *other*, unaffected occurrence a brand new removeItem
// reference on every add/remove, forcing an avoidable re-render of each of them. Memoizing keeps the
// reference identical across renders for any occurrence whose own position hasn't changed. The
// handler itself resolves the occurrence's CURRENT index within its own branch by the occurrence's
// raw (unnamespaced) field-array key at call time (not a snapshot), so it still removes the right
// item even after an earlier removal has reindexed it.
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

// Memoized per-branch add-item handlers, for the same render-stability reason as
// occurrenceRemoveHandlers above. "Add" on an occurrence appends another occurrence of its own
// branch, so a generic -array-item template reached through the fallback chain behaves like a
// real array item: its addItem/canAddItems are the choice primitives scoped to that branch.
// Keyed by branchKey only (not per occurrence), so the map stays bounded by the branch count.
const branchAddHandlers = new Map<string, () => void>();
function addItemHandlerFor(branchKey: string): () => void {
  let handler = branchAddHandlers.get(branchKey);
  if (!handler) {
    handler = () => addChoiceOccurrence(branchKey);
    branchAddHandlers.set(branchKey, handler);
  }
  return handler;
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
        One DynamicFormItem per active occurrence across every branch, rendered through
        the *-choice-array-item / default-choice-array-item slot (mirrors DynamicFormItemArray's own items).
        The source list is renderedChoiceOccurrences, not activeChoiceOccurrences directly: the two
        are identical unless displayOrder is 'added', in which case this is the sorted, actually
        displayed sequence, and globalIndex is this loop's index over it.
        part-of-array-field lets DynamicFormItem's own onBeforeUnmount skip its usual "write
        undefined back to my path" cleanup, since removal already goes through the branch's
        useFieldArrayExtended remove() above (writing here too would target a since-reindexed
        path — the same fragility DynamicFormItemArray's items already guard against).
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
