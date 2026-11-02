<script
  lang="ts"
  setup
  generic="TMetadataConfiguration extends MetadataConfiguration = typeof starterMetadata"
>
import type { DynamicFormTemplate as _DynamicFormTemplate, MetadataConfiguration } from '@bach.software/vue-dynamic-form';
import type { IconOverrideProps } from '@/iconOverride';
import { DynamicFormTemplate, isPathInSection } from '@bach.software/vue-dynamic-form';
import { useFormErrors } from 'vee-validate';
import { provide, toValue, useSlots } from 'vue';
import ArrayField from '@/ArrayField.vue';
import ArraySectionCard from '@/ArraySectionCard.vue';
import CheckboxField from '@/CheckboxField.vue';
import ChoiceArraySectionCard from '@/ChoiceArraySectionCard.vue';
import ChoiceField from '@/ChoiceField.vue';
import ChoiceSectionCard from '@/ChoiceSectionCard.vue';
import FormField from '@/FormField.vue';
import FormWizard from '@/FormWizard.vue';
import { gridColumnsClasses, gridItemClasses } from '@/gridClasses';
import GroupField from '@/GroupField.vue';
import { iconOverrideKey } from '@/iconOverride';
import { starterMetadata } from '@/metadata';
import PasswordInput from '@/PasswordInput.vue';
import PasswordStrengthBar from '@/PasswordStrengthBar.vue';
import RepeaterCard from '@/RepeaterCard.vue';
import ReviewGroup from '@/ReviewGroup.vue';
import SectionCard from '@/SectionCard.vue';
import SelectInput from '@/SelectInput.vue';
import TextInput from '@/TextInput.vue';
import ToggleSwitch from '@/ToggleSwitch.vue';

type TemplateSlots<T extends MetadataConfiguration>
  = NonNullable<ReturnType<typeof _DynamicFormTemplate<T>>['__ctx']>['slots'];

/**
 * The slots of `StarterFormTemplate`: every slot the dispatcher understands, scoped by the
 * metadata configuration, plus `input` (the generic chrome escape hatch) and `icon` (the
 * glyph override threaded to every `StarterIcon` beneath this template).
 */
type StarterFormTemplateSlots<T extends MetadataConfiguration>
  = TemplateSlots<T> & {
    input: (props: any) => any
    icon: (props: IconOverrideProps) => any
  } & Record<string, (props: any) => any>;

const props = defineProps<{
  /** Defaults to `starterMetadata`. Pass an `extendMetadata` result to type your own field types and properties. */
  metadataConfiguration?: TMetadataConfiguration
}>();

defineSlots<StarterFormTemplateSlots<TMetadataConfiguration>>();
const slots = useSlots();

// The fallback markup is written against the built-in catalogue; the generic only widens the slot scopes consumers see.
const metadata = (props.metadataConfiguration ?? starterMetadata) as typeof starterMetadata;

// #region wizard-step-errors
const formErrors = useFormErrors();

// A wizard page is in error when any registered field at or under its path currently has a
// validation error.
function pageHasErrors(pagePath: string): boolean {
  return Object.entries(formErrors.value).some(([path, message]) =>
    !!message && isPathInSection(path, pagePath));
}
// #endregion wizard-step-errors

// #region input-field-state
// A field is pristine until touched once; after that it is either invalid (an error message
// is showing) or valid.
function inputFieldState(meta: { valid: boolean, touched: boolean }, hasError: boolean): 'pristine' | 'invalid' | 'valid' {
  if (hasError)
    return 'invalid';
  if (meta.touched && meta.valid)
    return 'valid';
  return 'pristine';
}
// #endregion input-field-state

// Only reachable when a consumer wraps this template in their own component and supplies
// `#icon` there: `DynamicForm` never forwards its own `#icon` slot to a bare `:template` usage.
provide(iconOverrideKey, slots.icon ? (iconProps: IconOverrideProps) => slots.icon!(iconProps) : undefined);

// `default` collides with the engine's own unnamed slot, always present on this component
// (DynamicFormItem gives every per-node template instance a default slot for its content),
// so checking it directly would make bare usage mistake the engine's render for a consumer
// override. Gate it behind `input`, a name only a wrapper ever supplies, instead. `heading`
// and `checkbox` have no such collision: the engine never uses those names itself.
function chromeSlotName(name: 'default' | 'heading' | 'checkbox' | 'grid') {
  if (name === 'default')
    return slots.input ? 'default' : '';
  return slots[name] ? name : '';
}

// Every name the explicit blocks below consult, plus the reserved names: `input` and
// `attributes` carry the engine's renders, `icon` is the wrapper-only glyph override.
const handledSlotNames = new Set([
  'default',
  'heading',
  'checkbox',
  'default-array',
  'heading-array',
  'heading-array-item',
  'grid',
  'default-choice',
  'heading-choice',
  'heading-choice-array',
  'default-choice-array-item',
  'default-input',
  'select-input',
  'checkbox-input',
  'password-input',
  'default-wizard',
  'default-wizard-page',
  'wizardSummaryPage',
  'input',
  'attributes',
  'icon',
]);

// Any other consumer slot (a per-type slot like `richText-input`, or a dedicated slot for a
// built-in type like `text-input`) must be handed to the dispatcher itself, or it would never
// be considered and the field would silently fall back to the built-in markup. Resolved at
// render time, so a slot the consumer adds after mounting is picked up too.
function passthroughSlotNames() {
  return Object.keys(slots).filter(name => !handledSlotNames.has(name));
}
</script>

<template>
  <DynamicFormTemplate :metadataConfiguration="metadata">
    <template #default="s">
      <slot :name="chromeSlotName('default')" v-bind="s">
        <GroupField
          v-if="s.fieldMetadata.children?.length"
          v-show="!s.fieldMetadata.hide"
          :columns="s.fieldMetadata.columns"
          :colSpan="s.fieldMetadata.colSpan"
          :colStart="s.fieldMetadata.colStart"
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :required="s.required"
          :show-required-or-optional="s.settings.showRequiredOrOptional"
          :optionalText="s.settings.optionalText"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :canAddItems="s.canAddItems"
          :canRemoveItems="s.canRemoveItems"
          :addButtonText="s.fieldMetadata.array?.addButtonText"
          :removeButtonText="s.fieldMetadata.array?.removeButtonText"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
          @add="s.addItem"
          @remove="s.removeItem"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </GroupField>
        <!-- A childless branch with a presenceValue is fully represented by its picker card:
        selecting it writes the presence value, so there is nothing left to render here. -->
        <FormField
          v-else-if="s.fieldMetadata.presenceValue === undefined"
          v-show="!s.fieldMetadata.hide"
          :colSpan="s.fieldMetadata.colSpan"
          :colStart="s.fieldMetadata.colStart"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :input-id="s.fieldMetadata.path"
          :dataTestid="s.fieldMetadata.path"
          :description="s.fieldMetadata.description"
          :label="s.fieldContext.label"
          :required="s.required"
          :show-required-or-optional="s.settings.showRequiredOrOptional"
          :optionalText="s.settings.optionalText"
          :removeButtonText="s.fieldMetadata.array?.removeButtonText"
          :dependentOnMessage="s.fieldMetadata.dependentOnMessage"
          :errorMessage="s.fieldContext.errorMessage.value"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </FormField>
      </slot>
    </template>

    <template #heading="s">
      <slot :name="chromeSlotName('heading')" v-bind="s">
        <SectionCard
          v-if="s.fieldMetadata.children?.length"
          v-show="!s.fieldMetadata.hide"
          :columns="s.fieldMetadata.columns"
          :colSpan="s.fieldMetadata.colSpan"
          :colStart="s.fieldMetadata.colStart"
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </SectionCard>
        <!-- Same presence rule as the default slot above: the picker card already says it all.
        FormField is per-column by nature (it wraps inputs), so this heading usage opts into
        the full row here instead of inside the component. -->
        <FormField
          v-else-if="s.fieldMetadata.presenceValue === undefined"
          v-show="!s.fieldMetadata.hide"
          class="sft-span-full"
          :colSpan="s.fieldMetadata.colSpan"
          :colStart="s.fieldMetadata.colStart"
          :input-id="s.fieldMetadata.path"
          :dataTestid="s.fieldMetadata.path"
          :description="s.fieldMetadata.description"
          :label="s.fieldContext.label"
          :errorMessage="s.fieldContext.errorMessage.value"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </FormField>
      </slot>
    </template>

    <!-- A bare layout container: children in a plain CSS-grid div, no card chrome. -->
    <template #grid="s">
      <slot :name="chromeSlotName('grid')" v-bind="s">
        <div
          v-show="!s.fieldMetadata.hide"
          class="sft-grid-plain sft-span-full"
          :class="[gridColumnsClasses(s.fieldMetadata.columns), gridItemClasses(s.fieldMetadata.colSpan, s.fieldMetadata.colStart)]"
          :data-testid="s.fieldMetadata.path"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </div>
      </slot>
    </template>

    <template #default-array="s">
      <slot name="default-array" v-bind="s">
        <ArrayField
          v-show="!s.fieldMetadata.hide"
          :columns="s.fieldMetadata.columns"
          :colSpan="s.fieldMetadata.colSpan"
          :colStart="s.fieldMetadata.colStart"
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :canAddItems="s.canAddItems"
          :itemsLength="(s.fieldContext.value.value as unknown[] | undefined)?.length ?? 0"
          :itemsName="s.fieldMetadata.array?.itemName"
          :itemsNamePlural="s.fieldMetadata.array?.itemNamePlural"
          :addButtonText="s.fieldMetadata.array?.addButtonText"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
          @add="s.addItem"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </ArrayField>
      </slot>
    </template>

    <template #heading-array="s">
      <slot name="heading-array" v-bind="s">
        <ArraySectionCard
          :columns="s.fieldMetadata.columns"
          :colSpan="s.fieldMetadata.colSpan"
          :colStart="s.fieldMetadata.colStart"
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :noItemsMessage="s.fieldMetadata.array?.noItemsMessage"
          :noItemsTitle="s.fieldMetadata.array?.noItemsTitle"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
          :canAddItems="s.canAddItems"
          :itemsCount="(s.fieldContext.value.value as unknown[] | undefined)?.length ?? 0"
          :itemsName="s.fieldMetadata.array?.itemName"
          :itemsNamePlural="s.fieldMetadata.array?.itemNamePlural"
          :addButtonText="s.fieldMetadata.array?.addButtonText"
          :addFirstButtonText="s.fieldMetadata.array?.addFirstButtonText"
          @addItem="s.addItem"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </ArraySectionCard>
      </slot>
    </template>

    <template #heading-array-item="s">
      <slot name="heading-array-item" v-bind="s">
        <RepeaterCard
          class="sft-hide-tag"
          :columns="s.fieldMetadata.columns"
          :colSpan="s.fieldMetadata.colSpan"
          :colStart="s.fieldMetadata.colStart"
          :index="s.index"
          :title="s.fieldMetadata.array?.itemFieldForTitle && (s.fieldContext.value.value as any)?.[s.fieldMetadata.array?.itemFieldForTitle]"
          :placeholderTitle="s.fieldMetadata.array?.newItemTitle ?? `New ${s.fieldMetadata.array?.itemName}`"
          :canRemove="s.canRemoveItems"
          :removeButtonText="s.fieldMetadata.array?.removeButtonText"
          :removeAriaLabel="s.fieldMetadata.array?.removeAriaLabel"
          :dataTestid="s.fieldMetadata.path"
          @remove="s.removeItem"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </RepeaterCard>
      </slot>
    </template>

    <template #default-choice="s">
      <slot name="default-choice" v-bind="s">
        <ChoiceField
          v-show="!s.fieldMetadata.hide"
          :columns="s.fieldMetadata.columns"
          :colSpan="s.fieldMetadata.colSpan"
          :colStart="s.fieldMetadata.colStart"
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :required="s.required"
          :show-required-or-optional="s.settings.showRequiredOrOptional"
          :optionalText="s.settings.optionalText"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </ChoiceField>
      </slot>
    </template>

    <template #heading-choice="s">
      <slot name="heading-choice" v-bind="s">
        <ChoiceSectionCard
          v-slot="{ selectedOption }"
          :columns="s.fieldMetadata.columns"
          :colSpan="s.fieldMetadata.colSpan"
          :colStart="s.fieldMetadata.colStart"
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
          :options="s.fieldMetadata.choicePicker?.show ? s.fieldMetadata.choice.map((x: any) => ({ value: x.name, title: toValue(x.fieldOptions?.label), description: x.description, icon: x.iconName })) : undefined"
          :activeChoiceOccurrences="s.activeChoiceOccurrences"
          :addChoiceOccurrence="s.addChoiceOccurrence"
          :removeChoiceOccurrence="s.removeChoiceOccurrence"
          :ariaLabel="s.fieldMetadata.choicePicker?.ariaLabel"
          :disabled="s.fieldMetadata.disabled || s.disabled"
        >
          <slot name="input" :selectedOption v-bind="s.slotProps ?? {}">
            <slot :selectedOption v-bind="s.slotProps ?? {}" />
          </slot>
        </ChoiceSectionCard>
      </slot>
    </template>

    <template #heading-choice-array="s">
      <slot name="heading-choice-array" v-bind="s">
        <ChoiceArraySectionCard
          :columns="s.fieldMetadata.columns"
          :colSpan="s.fieldMetadata.colSpan"
          :colStart="s.fieldMetadata.colStart"
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
          :options="s.fieldMetadata.choicePicker?.show ? s.fieldMetadata.choice.map((x: any) => ({ value: x.name, title: toValue(x.fieldOptions?.label), description: x.description, icon: x.iconName })) : undefined"
          :addChoiceOccurrence="s.addChoiceOccurrence"
          :canAddChoiceOccurrence="s.canAddChoiceOccurrence"
          :usedChoiceOccurrences="s.usedChoiceOccurrences"
          :maxOccurs="s.fieldMetadata.maxOccurs"
          :addButtonText="s.fieldMetadata.choicePicker?.addButtonText"
          :limitReachedText="s.fieldMetadata.choicePicker?.limitReachedText"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </ChoiceArraySectionCard>
      </slot>
    </template>

    <template #default-choice-array-item="s">
      <slot name="default-choice-array-item" v-bind="s">
        <RepeaterCard
          class="sft-hide-tag"
          :columns="s.fieldMetadata.columns"
          :colSpan="s.fieldMetadata.colSpan"
          :colStart="s.fieldMetadata.colStart"
          :index="s.index"
          :displayNumber="s.globalIndex + 1"
          :title="s.fieldContext.label"
          :placeholderTitle="s.fieldMetadata.array?.newItemTitle ?? `New ${s.branchKey}`"
          :canRemove="s.canRemoveItems"
          :removeButtonText="s.fieldMetadata.array?.removeButtonText"
          :removeAriaLabel="s.fieldMetadata.array?.removeAriaLabel"
          :dataTestid="s.fieldMetadata.path"
          @remove="s.removeItem"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </RepeaterCard>
      </slot>
    </template>

    <template #checkbox="s">
      <slot :name="chromeSlotName('checkbox')" v-bind="s">
        <CheckboxField
          v-show="!s.fieldMetadata.hide"
          :input-id="s.fieldMetadata.path"
          :colSpan="s.fieldMetadata.colSpan"
          :colStart="s.fieldMetadata.colStart"
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :required="s.required"
          :show-required-or-optional="s.settings.showRequiredOrOptional"
          :optionalText="s.settings.optionalText"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </CheckboxField>
      </slot>
    </template>

    <!--
      Passes the raw string from the input event instead of letting vee-validate's handleChange
      read the native input's own value: a native number input hands handleChange a JS number
      (valueAsNumber), which would store a number in the model instead of a string.
    -->
    <template #default-input="s">
      <slot name="default-input" v-bind="s">
        <div v-if="s.fieldMetadata.suffix" class="sft-input-suffix-row">
          <TextInput
            :id="s.fieldMetadata.path"
            :dataTestid="`${s.fieldMetadata.path}-input`"
            :value="s.fieldContext.value.value"
            :type="s.fieldMetadata.type"
            :disabled="s.fieldMetadata.disabled || s.disabled"
            :errorMessage="s.fieldContext.errorMessage.value"
            :placeholder="s.fieldMetadata.placeholder"
            :data-field-state="s.settings.showValidState ? inputFieldState(s.fieldContext.meta, !!s.fieldContext.errorMessage.value) : undefined"
            :class="{ 'is-valid': s.settings.showValidState && inputFieldState(s.fieldContext.meta, !!s.fieldContext.errorMessage.value) === 'valid' }"
            class="sft-input-suffix-input"
            @input="s.fieldContext.handleChange(($event.target as HTMLInputElement).value)"
            @blur="s.fieldContext.handleBlur"
          />
          <span class="sft-input-suffix">{{ s.fieldMetadata.suffix }}</span>
        </div>
        <TextInput
          v-else
          :id="s.fieldMetadata.path"
          :dataTestid="`${s.fieldMetadata.path}-input`"
          :value="s.fieldContext.value.value"
          :type="s.fieldMetadata.type"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :errorMessage="s.fieldContext.errorMessage.value"
          :placeholder="s.fieldMetadata.placeholder"
          :data-field-state="s.settings.showValidState ? inputFieldState(s.fieldContext.meta, !!s.fieldContext.errorMessage.value) : undefined"
          :class="{ 'is-valid': s.settings.showValidState && inputFieldState(s.fieldContext.meta, !!s.fieldContext.errorMessage.value) === 'valid' }"
          @input="s.fieldContext.handleChange(($event.target as HTMLInputElement).value)"
          @blur="s.fieldContext.handleBlur"
        />
      </slot>
    </template>

    <template #select-input="s">
      <slot name="select-input" v-bind="s">
        <SelectInput
          :id="s.fieldMetadata.path"
          :dataTestid="`${s.fieldMetadata.path}-input`"
          :value="s.fieldContext.value.value"
          :options="s.fieldMetadata.options"
          :placeholder="s.fieldMetadata.placeholder"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :errorMessage="s.fieldContext.errorMessage.value"
          :data-field-state="s.settings.showValidState ? inputFieldState(s.fieldContext.meta, !!s.fieldContext.errorMessage.value) : undefined"
          :class="{ 'is-valid': s.settings.showValidState && inputFieldState(s.fieldContext.meta, !!s.fieldContext.errorMessage.value) === 'valid' }"
          @change="s.fieldContext.handleChange"
          @blur="s.fieldContext.handleBlur"
        />
      </slot>
    </template>

    <template #checkbox-input="s">
      <slot name="checkbox-input" v-bind="s">
        <ToggleSwitch
          :dataTestid="`${s.fieldMetadata.path}-input`"
          :checked="s.fieldContext.value.value"
          :label="toValue(s.fieldContext.label)"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :falseAsUndefined="s.fieldMetadata.checkbox?.falseAsUndefined"
          @change="s.fieldContext.handleChange"
          @blur="s.fieldContext.handleBlur"
        />
      </slot>
    </template>

    <template #password-input="s">
      <slot name="password-input" v-bind="s">
        <PasswordInput
          :id="s.fieldMetadata.path"
          :dataTestid="`${s.fieldMetadata.path}-input`"
          :value="s.fieldContext.value.value"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :errorMessage="s.fieldContext.errorMessage.value"
          :placeholder="s.fieldMetadata.placeholder"
          :showPasswordAriaLabel="s.fieldMetadata.password?.showAriaLabel"
          :hidePasswordAriaLabel="s.fieldMetadata.password?.hideAriaLabel"
          :data-field-state="s.settings.showValidState ? inputFieldState(s.fieldContext.meta, !!s.fieldContext.errorMessage.value) : undefined"
          :class="{ 'is-valid': s.settings.showValidState && inputFieldState(s.fieldContext.meta, !!s.fieldContext.errorMessage.value) === 'valid' }"
          @input="s.fieldContext.handleChange"
          @blur="s.fieldContext.handleBlur"
        />
        <PasswordStrengthBar
          v-if="s.fieldMetadata.password?.showStrengthBar"
          :dataTestid="`${s.fieldMetadata.path}-input`"
          :password="s.fieldContext.value.value"
          :labels="s.fieldMetadata.password?.strengthLabels"
        />
      </slot>
    </template>

    <template #default-wizard="s">
      <slot name="default-wizard" v-bind="s">
        <FormWizard
          :title="s.fieldContext.label"
          :subTitle="s.fieldMetadata.description"
          :dataTestid="s.fieldMetadata.path"
          :steps="s.pages.map((page: any) => ({ title: toValue(page.fieldOptions?.label) ?? page.name, description: page.helpText, hasError: pageHasErrors(page.path) }))"
          :currentStepIndex="s.currentStepIndex"
          :isFirst="s.isFirst"
          :isLast="s.isLast"
          :isValidating="s.isValidating"
          :allowForwardJump="s.wizardConfig.allowForwardJump"
          :next="s.next"
          :prev="s.prev"
          :gotoStep="s.gotoStep"
          :nextButton="s.fieldMetadata.wizardTexts?.nextButtonText"
          :prevButton="s.fieldMetadata.wizardTexts?.prevButtonText"
          :submitButton="s.fieldMetadata.wizardTexts?.submitButtonText"
          :stepText="s.fieldMetadata.wizardTexts?.stepText"
          :stepErrorsText="s.fieldMetadata.wizardTexts?.stepErrorsText"
          :stepperAriaLabel="s.fieldMetadata.wizardTexts?.stepperAriaLabel"
          :stepAriaLabel="s.fieldMetadata.wizardTexts?.stepAriaLabel"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </FormWizard>
      </slot>
    </template>

    <!--
      Shape-agnostic visibility wrapper for a single wizard page: gates with v-show (never v-if,
      or navigating away deregisters the page's fields from vee-validate, so submit sends them
      unvalidated; it also clears their values unless keepValuesOnUnmount is set, but the
      deregistration happens regardless, so v-show stays required for any page with fields).
      Binds gotoStep onto its slot so it lands in the page content's slotProps (used below by
      the summary page's edit links).
    -->
    <template #default-wizard-page="s">
      <slot name="default-wizard-page" v-bind="s">
        <div
          v-show="s.isCurrent"
          :data-page="s.pageIndex"
          :data-testid="`${s.fieldMetadata.path}-page`"
        >
          <slot name="input" :gotoStep="s.gotoStep">
            <slot :gotoStep="s.gotoStep" />
          </slot>
        </div>
      </slot>
    </template>

    <template #wizardSummaryPage="s">
      <slot name="wizardSummaryPage" v-bind="s">
        <SectionCard
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
        >
          <ReviewGroup
            v-for="(group, i) in (s.fieldMetadata.wizardSummary?.groups ?? [])"
            :key="group.title"
            v-bind="group"
            @edit="s.slotProps?.gotoStep?.(i)"
          />
          <div v-if="s.fieldMetadata.wizardSummary?.confirmation" class="sft-confirm">
            <p class="sft-confirm-strong">
              {{ s.fieldMetadata.wizardSummary?.confirmationTitle ?? 'Ready to submit?' }}
            </p>
            <p>
              {{ s.fieldMetadata.wizardSummary?.confirmation }}
            </p>
          </div>
        </SectionCard>
      </slot>
    </template>

    <template v-for="name in passthroughSlotNames()" :key="name" #[name]="s">
      <slot :name="name" v-bind="s" />
    </template>
  </DynamicFormTemplate>
</template>
