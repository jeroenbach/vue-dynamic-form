<script lang="ts" setup>
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import type { LoadingResolve } from '../utils/loadingResolve';
import type { AppIconName } from './AppIcon.vue';
import type { Props as ReviewGroupProps } from './ReviewGroup.vue';
import { defineMetadata, DynamicFormTemplate } from '@bach.software/vue-dynamic-form';
import { toValue } from 'vue';
import ArrayField from './ArrayField.vue';
import ArraySectionCard from './ArraySectionCard.vue';
import CheckboxField from './CheckboxField.vue';
import ChoiceField from './ChoiceField.vue';
import ChoiceSectionCard from './ChoiceSectionCard.vue';
import FormField from './FormField.vue';
import FormWizard from './FormWizard.vue';
import GroupField from './GroupField.vue';
import RepeaterCard from './RepeaterCard.vue';
import ReviewGroup from './ReviewGroup.vue';
import SectionCard from './SectionCard.vue';
import SelectInput from './SelectInput.vue';
import TextInput from './TextInput.vue';
import ToggleSwitch from './ToggleSwitch.vue';

const nextButton = 'Continue';
const prevButton = 'Back';
const submitButton = 'Submit';

// #region template-metadata-contract
export type Metadata = GetMetadataType<typeof metadata>;

const metadata = defineMetadata<
  {
    wizard: never
    wizardPage: never
    wizardSummaryPage: never
    heading: never
    text: string
    select: string
    checkbox: boolean | undefined
  },
  {
    description?: string
    helpText?: string
    arrayItemName?: string
    arrayItemNamePlural?: string
    arrayItemFieldForTitle?: string
    arrayNoItemsMessage?: string
    iconName?: AppIconName
    dependentOnMessage?: string
    placeholder?: string
    options?: { key: string, value: string }[]
    fullWidth?: boolean
    disabled?: boolean
    hide?: boolean
    validatePage?: (pageIndex: number, loadingResolve: LoadingResolve) => Promise<void>
    submitForm?: (loadingResolve: LoadingResolve) => Promise<void>
    changeChoice?: (key: string) => void
    falseAsUndefined?: boolean
    wizardSummary?: ReviewGroupProps[]
    submitButtonText?: string
  },
  {
    currentStepIndex?: number
    gotoStepIndex?: (index: number) => void
  }
>();
// #endregion template-metadata-contract
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <!-- #region structural-slots -->
    <template #wizard="{ fieldMetadata, fieldContext: { errorMessage, label } }">
      <FormWizard
        v-slot="{ currentStepIndex, gotoStep }"
        :title="label"
        :subTitle="fieldMetadata.description"
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
        :steps="fieldMetadata.children?.map(x => ({ title: toValue(x.fieldOptions?.label) ?? x.name, description: x.helpText }))"
        :nextButton
        :prevButton
        :submitButton="fieldMetadata.submitButtonText ?? submitButton"
        @validate-page="fieldMetadata.validatePage"
        @submit="fieldMetadata.submitForm"
      >
        <slot :current-step-index :gotoStepIndex="gotoStep" />
      </FormWizard>
    </template>

    <template #wizardPage="{ fieldMetadata, fieldContext: { errorMessage, label }, slotProps, index }">
      <SectionCard
        v-show="slotProps.currentStepIndex !== undefined && slotProps.currentStepIndex === index"
        :label
        :description="fieldMetadata.description"
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
      >
        <slot />
      </SectionCard>
    </template>

    <template #wizardSummaryPage="{ fieldMetadata, fieldContext: { errorMessage, label }, slotProps, index }">
      <SectionCard
        v-if="slotProps.currentStepIndex !== undefined && slotProps.currentStepIndex === index"
        :label
        :description="fieldMetadata.description"
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
      >
        <ReviewGroup
          v-for="(group, i) in (fieldMetadata.wizardSummary ?? [])"
          :key="group.title"
          class="md:col-span-2"
          v-bind="group"
          @edit="slotProps.gotoStepIndex?.(i)"
        />
        <div class="md:col-span-2 mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p class="font-medium">
            Ready to submit?
          </p>
          <p class="mt-0.5">
            We'll create the onboarding workspace and email each contact an invite.
          </p>
        </div>
      </SectionCard>
    </template>

    <template #wizardPage-choice="{ fieldMetadata, fieldContext: { errorMessage, label }, slotProps, index }">
      <ChoiceSectionCard
        v-show="slotProps.currentStepIndex !== undefined && slotProps.currentStepIndex === index"
        v-slot="{ selectedOption }"
        :label
        :description="fieldMetadata.description"
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
        :options="fieldMetadata.choice.map(x => ({ value: x.name, title: toValue(x.fieldOptions?.label), description: x.description, icon: x.iconName }))"
        @select="fieldMetadata.changeChoice?.($event)"
      >
        <slot :selectedOption />
      </ChoiceSectionCard>
    </template>

    <template #wizardPage-array="{ fieldMetadata, fieldContext: { errorMessage, label, value }, canAddItems, addItem, slotProps, index }">
      <ArraySectionCard
        v-show="slotProps.currentStepIndex !== undefined && slotProps.currentStepIndex === index"
        :label
        :description="fieldMetadata.description"
        :noItemsMessage="fieldMetadata.arrayNoItemsMessage"
        :addButtonText="`Add another ${fieldMetadata.arrayItemName}`"
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
        :canAddItems
        :itemsCount="value.value?.length ?? 0"
        :itemsName="fieldMetadata.arrayItemName"
        :itemsNamePlural="fieldMetadata.arrayItemNamePlural"
        @add-item="addItem"
      >
        <slot />
      </ArraySectionCard>
    </template>

    <template #wizardPage-array-item="{ fieldMetadata, fieldContext: { value }, canRemoveItems, removeItem, index }">
      <RepeaterCard
        :class="{ 'md:col-span-2': fieldMetadata.fullWidth }"
        class="hide-optional"
        :index
        :title="fieldMetadata.arrayItemFieldForTitle && (value.value as any)?.[fieldMetadata.arrayItemFieldForTitle]"
        :placeholderTitle="`New ${fieldMetadata.arrayItemName}`"
        :canRemove="canRemoveItems"
        :data-testid="fieldMetadata.path"
        @remove="removeItem"
      >
        <slot />
      </RepeaterCard>
    </template>

    <template #default-choice="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required }">
      <ChoiceField
        v-show="!fieldMetadata.hide"
        :class="{ 'md:col-span-2': fieldMetadata.fullWidth }"
        :label
        :description="fieldMetadata.description"
        :required
        :disabled="fieldMetadata.disabled || disabled"
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
      >
        <slot />
      </ChoiceField>
    </template>

    <template #default-array="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, canAddItems, addItem }">
      <ArrayField
        v-show="!fieldMetadata.hide"
        :class="{ 'md:col-span-2': fieldMetadata.fullWidth }"
        :label
        :description="fieldMetadata.description"
        :required
        :disabled="fieldMetadata.disabled || disabled"
        :can-add-items="canAddItems"
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
        @add="addItem"
      >
        <slot />
      </ArrayField>
    </template>

    <template #checkbox="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required }">
      <CheckboxField
        v-show="!fieldMetadata.hide"
        :input-id="fieldMetadata.path"
        :class="{ 'md:col-span-2': fieldMetadata.fullWidth }"
        :label
        :description="fieldMetadata.description"
        :required
        :disabled="fieldMetadata.disabled || disabled"
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
      >
        <slot />
      </CheckboxField>
    </template>

    <template #default="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, canAddItems, canRemoveItems, addItem, removeItem }">
      <GroupField
        v-if="fieldMetadata.children?.length"
        v-show="!fieldMetadata.hide"
        class="md:col-span-2"
        :label
        :description="fieldMetadata.description"
        :required
        :disabled="fieldMetadata.disabled || disabled"
        :can-add-items="canAddItems"
        :can-remove-items="canRemoveItems"
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
        @add="addItem"
        @remove="removeItem"
      >
        <slot />
      </GroupField>
      <FormField
        v-else
        v-show="!fieldMetadata.hide"
        :class="{ 'md:col-span-2': fieldMetadata.fullWidth }"
        :disabled="fieldMetadata.disabled || disabled"
        :input-id="fieldMetadata.path"
        :description="fieldMetadata.description"
        :label
        :required
        :dependentOnMessage="fieldMetadata.dependentOnMessage"
        :errorMessage="errorMessage.value"
      >
        <slot />
      </FormField>
    </template>
    <!-- #endregion structural-slots -->

    <!-- #region input-slots -->
    <template #select-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange, errorMessage }, disabled }">
      <SelectInput
        :id="fieldMetadata.path"
        :value="value.value"
        :options="fieldMetadata.options"
        :disabled="fieldMetadata.disabled || disabled"
        :errorMessage="errorMessage.value"
        @change="handleChange"
        @blur="handleBlur"
      />
    </template>

    <template #checkbox-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange, errorMessage }, disabled }">
      <ToggleSwitch
        :id="fieldMetadata.path"
        :checked="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        :errorMessage="errorMessage.value"
        :falseAsUndefined="fieldMetadata.falseAsUndefined"
        @change="handleChange"
        @blur="handleBlur"
      />
    </template>

    <template #default-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange, errorMessage }, disabled }">
      <TextInput
        :id="fieldMetadata.path"
        :value="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        :errorMessage="errorMessage.value"
        :placeholder="fieldMetadata.placeholder"
        @input="handleChange"
        @blur="handleBlur"
      />
    </template>
    <!-- #endregion input-slots -->
  </DynamicFormTemplate>
</template>

<style lang="css">
.hide-optional .optional-tag {
  display: none;
}
</style>
