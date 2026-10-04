<script
  lang="ts"
  setup
  generic="TMetadataConfiguration extends MetadataConfiguration = typeof starterMetadata"
>
import type { DynamicFormTemplate as _DynamicFormTemplate, MetadataConfiguration } from '@bach.software/vue-dynamic-form';
import type { IconOverrideProps } from '@/iconOverride';
import { DynamicFormTemplate } from '@bach.software/vue-dynamic-form';
import { provide, toValue, useSlots } from 'vue';
import ArrayField from '@/ArrayField.vue';
import ArraySectionCard from '@/ArraySectionCard.vue';
import CheckboxField from '@/CheckboxField.vue';
import ChoiceArraySectionCard from '@/ChoiceArraySectionCard.vue';
import ChoiceField from '@/ChoiceField.vue';
import ChoiceSectionCard from '@/ChoiceSectionCard.vue';
import FormField from '@/FormField.vue';
import FormWizard from '@/FormWizard.vue';
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

const wizardNextButton = 'Continue';
const wizardPrevButton = 'Back';
const wizardSubmitButton = 'Submit';

// The fallback markup is written against the built-in catalogue; the generic only widens the slot scopes consumers see.
const metadata = (props.metadataConfiguration ?? starterMetadata) as typeof starterMetadata;

// Only reachable when a consumer wraps this template in their own component and supplies
// `#icon` there: `DynamicForm` never forwards its own `#icon` slot to a bare `:template` usage.
provide(iconOverrideKey, slots.icon ? (iconProps: IconOverrideProps) => slots.icon!(iconProps) : undefined);

// `default` collides with the engine's own unnamed slot, always present on this component
// (DynamicFormItem gives every per-node template instance a default slot for its content),
// so checking it directly would make bare usage mistake the engine's render for a consumer
// override. Gate it behind `input`, a name only a wrapper ever supplies, instead. `heading`
// and `checkbox` have no such collision: the engine never uses those names itself.
function chromeSlotName(name: 'default' | 'heading' | 'checkbox') {
  if (name === 'default')
    return slots.input ? 'default' : '';
  return slots[name] ? name : '';
}
</script>

<template>
  <DynamicFormTemplate :metadataConfiguration="metadata">
    <template #default="s">
      <slot :name="chromeSlotName('default')" v-bind="s">
        <GroupField
          v-if="s.fieldMetadata.children?.length"
          v-show="!s.fieldMetadata.hide"
          class="sft-col-span"
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :required="s.required"
          :show-required-or-optional="s.settings.showRequiredOrOptional"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :canAddItems="s.canAddItems"
          :canRemoveItems="s.canRemoveItems"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
          @add="s.addItem"
          @remove="s.removeItem"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </GroupField>
        <FormField
          v-else
          v-show="!s.fieldMetadata.hide"
          :class="{ 'sft-col-span': s.fieldMetadata.fullWidth }"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :input-id="s.fieldMetadata.path"
          :dataTestid="s.fieldMetadata.path"
          :description="s.fieldMetadata.description"
          :label="s.fieldContext.label"
          :required="s.required"
          :show-required-or-optional="s.settings.showRequiredOrOptional"
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
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
        >
          <slot name="input" v-bind="s.slotProps ?? {}">
            <slot v-bind="s.slotProps ?? {}" />
          </slot>
        </SectionCard>
        <FormField
          v-else
          v-show="!s.fieldMetadata.hide"
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

    <template #default-array="s">
      <slot name="default-array" v-bind="s">
        <ArrayField
          v-show="!s.fieldMetadata.hide"
          :class="{ 'sft-col-span': s.fieldMetadata.fullWidth }"
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :canAddItems="s.canAddItems"
          :itemsLength="(s.fieldContext.value.value as unknown[] | undefined)?.length ?? 0"
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
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :noItemsMessage="s.fieldMetadata.arrayNoItemsMessage"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
          :canAddItems="s.canAddItems"
          :itemsCount="(s.fieldContext.value.value as unknown[] | undefined)?.length ?? 0"
          :itemsName="s.fieldMetadata.arrayItemName"
          :itemsNamePlural="s.fieldMetadata.arrayItemNamePlural"
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
          :class="{ 'sft-col-span': s.fieldMetadata.fullWidth }"
          class="sft-hide-tag"
          :index="s.index"
          :title="s.fieldMetadata.arrayItemFieldForTitle && (s.fieldContext.value.value as any)?.[s.fieldMetadata.arrayItemFieldForTitle]"
          :placeholderTitle="`New ${s.fieldMetadata.arrayItemName}`"
          :canRemove="s.canRemoveItems"
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
          :class="{ 'sft-col-span': s.fieldMetadata.fullWidth }"
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :required="s.required"
          :show-required-or-optional="s.settings.showRequiredOrOptional"
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
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
          :options="s.fieldMetadata.choiceShowChoiceSelect ? s.fieldMetadata.choice.map((x: any) => ({ value: x.name, title: toValue(x.fieldOptions?.label), description: x.description, icon: x.iconName })) : undefined"
          :activeChoiceOccurrences="s.activeChoiceOccurrences"
          :addChoiceOccurrence="s.addChoiceOccurrence"
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
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :errorMessage="s.fieldContext.errorMessage.value"
          :dataTestid="s.fieldMetadata.path"
          :options="s.fieldMetadata.choiceShowChoiceSelect ? s.fieldMetadata.choice.map((x: any) => ({ value: x.name, title: toValue(x.fieldOptions?.label), description: x.description, icon: x.iconName })) : undefined"
          :addChoiceOccurrence="s.addChoiceOccurrence"
          :canAddChoiceOccurrence="s.canAddChoiceOccurrence"
          :usedChoiceOccurrences="s.usedChoiceOccurrences"
          :maxOccurs="s.fieldMetadata.maxOccurs"
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
          :class="{ 'sft-col-span': s.fieldMetadata.fullWidth }"
          class="sft-hide-tag"
          :index="s.index"
          :displayNumber="s.globalIndex + 1"
          :title="s.fieldContext.label"
          :placeholderTitle="`New ${s.branchKey}`"
          :canRemove="s.canRemoveItems"
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
          :class="{ 'sft-col-span': s.fieldMetadata.fullWidth }"
          :label="s.fieldContext.label"
          :description="s.fieldMetadata.description"
          :required="s.required"
          :show-required-or-optional="s.settings.showRequiredOrOptional"
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

    <template #default-input="s">
      <slot name="default-input" v-bind="s">
        <TextInput
          :id="s.fieldMetadata.path"
          :dataTestid="`${s.fieldMetadata.path}-input`"
          :value="s.fieldContext.value.value"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :errorMessage="s.fieldContext.errorMessage.value"
          :placeholder="s.fieldMetadata.placeholder"
          @input="s.fieldContext.handleChange"
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
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :errorMessage="s.fieldContext.errorMessage.value"
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
          :falseAsUndefined="s.fieldMetadata.falseAsUndefined"
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
          @input="s.fieldContext.handleChange"
          @blur="s.fieldContext.handleBlur"
        />
        <PasswordStrengthBar
          v-if="s.fieldMetadata.showStrengthBar"
          :dataTestid="`${s.fieldMetadata.path}-input`"
          :password="s.fieldContext.value.value"
        />
      </slot>
    </template>

    <template #default-wizard="s">
      <slot name="default-wizard" v-bind="s">
        <FormWizard
          :title="s.fieldContext.label"
          :subTitle="s.fieldMetadata.description"
          :dataTestid="s.fieldMetadata.path"
          :steps="s.pages.map((page: any) => ({ title: toValue(page.fieldOptions?.label) ?? page.name, description: page.helpText }))"
          :currentStepIndex="s.currentStepIndex"
          :isFirst="s.isFirst"
          :isLast="s.isLast"
          :isValidating="s.isValidating"
          :allowForwardJump="s.wizardConfig.allowForwardJump"
          :next="s.next"
          :prev="s.prev"
          :gotoStep="s.gotoStep"
          :nextButton="wizardNextButton"
          :prevButton="wizardPrevButton"
          :submitButton="s.fieldMetadata.submitButtonText ?? wizardSubmitButton"
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
            v-for="(group, i) in (s.fieldMetadata.wizardSummary ?? [])"
            :key="group.title"
            v-bind="group"
            @edit="s.slotProps?.gotoStep?.(i)"
          />
          <div v-if="s.fieldMetadata.wizardSummaryConfirmation" class="sft-confirm">
            <p class="sft-confirm-strong">
              Ready to submit?
            </p>
            <p>
              {{ s.fieldMetadata.wizardSummaryConfirmation }}
            </p>
          </div>
        </SectionCard>
      </slot>
    </template>
  </DynamicFormTemplate>
</template>
