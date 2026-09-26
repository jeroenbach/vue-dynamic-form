<script lang="ts" setup>
import type { GetDynamicFormSettingsType } from '@/types/GetDynamicFormSettingsType';
import type { GetMetadataType } from '@/types/GetMetadataType';
import DynamicFormTemplate from '@/components/DynamicFormTemplate.vue';
import { defineMetadata } from '@/core/defineMetadata';
import IconButton from './components/IconButton.vue';

export type Metadata = GetMetadataType<typeof metadata>;

export type DynamicFormSettings = GetDynamicFormSettingsType<typeof metadata>;

const metadata = defineMetadata<
  {
    text: string
    textBoundByVModel: string
    select: string
    selectBoundByVModel: string
    checkbox: boolean
    checkboxBoundByVModel: boolean
    heading: never
    group: never
  },
  {
    description?: string
    options?: { key: string, value: string }[]
    fullWidth?: boolean
    disabled?: boolean
    hidden?: boolean
  },
  /**
   * Free to decide what attributes you want to pass internally between your templates.
   * You can add any attribute to a <slot /> and then it will be accessible in props.slotProps.
   */
  {
    hideLabel?: boolean
    /** Example on how to keep track of the levels */
    level?: number
    /** Helps identifying that we're below a choice field, so if we're rendering an array we can adjust our layout */
    belowChoiceField?: boolean
    hidden?: boolean
  },
  {
    showOptionalInsteadOfRequired?: boolean
    /**
     * Example-only switch for the wizard page wrapper: gate page visibility with `v-if` (unmounts
     * non-current pages) instead of the correct `v-show`. Lets a playground demonstrate the
     * clear-on-unmount data loss `v-show` avoids, and how `keepValuesOnUnmount` changes it.
     */
    wizardPageUseVIf?: boolean
  }
>();
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <template #heading="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, canAddItems, addItem, canRemoveItems, removeItem, slotProps }">
      <div v-if="!fieldMetadata.hidden" class="mt-4" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <h3 v-if="label" class="flex text-xl font-bold gap-2 items-center mb-2" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled }">
          {{ label }}
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" :data-testid="`${fieldMetadata.path}-add-button`" @click="addItem" />
          <IconButton v-if="canRemoveItems" icon="minus" tabindex="-1" color="red" :data-testid="`${fieldMetadata.path}-remove-button`" @click="removeItem" />
        </h3>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <slot :level="(slotProps?.level ?? 0) + 1" />
        </div>
      </div>
    </template>

    <template #heading-array>
      <!-- Don't show any extra elements for the heading -->
      <slot />
    </template>

    <template #default-choice="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, slotProps, settings: { showOptionalInsteadOfRequired }, addChoiceOccurrence, removeChoiceOccurrence, canAddChoiceOccurrence, usedChoiceOccurrences }">
      <div v-if="!fieldMetadata.hidden" class="flex flex-col gap-2" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <span class="flex gap-2 items-center" :class="{ 'text-gray-500': disabled }">
          {{ label }}
          <span v-if="required && !showOptionalInsteadOfRequired" class="text-red-500 dark:text-rose-400">*</span>
          <span v-if="!required && showOptionalInsteadOfRequired" class="text-sm text-gray-400">(optional)</span>
        </span>
        <!--
          Explicit-choice-selection test harness: exercises addChoiceOccurrence/removeChoiceOccurrence/
          canAddChoiceOccurrence through the real public slot-prop contract, the same way
          addItem/removeItem are already tested through #default-array.
        -->
        <div>Used choice occurrences: <span :data-testid="`${fieldMetadata.path}-used-choice-occurrences`">{{ usedChoiceOccurrences }}</span></div>
        <div v-if="fieldMetadata.choice?.length" class="flex gap-2 flex-wrap">
          <button
            v-for="branch in fieldMetadata.choice"
            :key="`${branch.name}-add`"
            type="button"
            :disabled="!canAddChoiceOccurrence(branch.name)"
            :data-testid="`${fieldMetadata.path}.${branch.name}-add-choice-button`"
            @click="addChoiceOccurrence(branch.name)"
          >
            Add {{ branch.name }}
          </button>
          <button
            v-for="branch in fieldMetadata.choice"
            :key="`${branch.name}-remove`"
            type="button"
            :data-testid="`${fieldMetadata.path}.${branch.name}-remove-choice-button`"
            @click="removeChoiceOccurrence(branch.name)"
          >
            Remove {{ branch.name }}
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 ms-6">
          <slot :level="(slotProps?.level ?? 0) + 1" :below-choice-field="true" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
      </div>
    </template>

    <!--
      Same harness as #default-choice, but for repeatable (maxOccurs > 1) choices, which
      dispatch through the -choice-array slot family. Identical markup and testids so tests
      drive both modes through the same selectors.
    -->
    <template #default-choice-array="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, slotProps, settings: { showOptionalInsteadOfRequired }, addChoiceOccurrence, removeChoiceOccurrence, canAddChoiceOccurrence, usedChoiceOccurrences }">
      <div v-if="!fieldMetadata.hidden" class="flex flex-col gap-2" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <span class="flex gap-2 items-center" :class="{ 'text-gray-500': disabled }">
          {{ label }}
          <span v-if="required && !showOptionalInsteadOfRequired" class="text-red-500 dark:text-rose-400">*</span>
          <span v-if="!required && showOptionalInsteadOfRequired" class="text-sm text-gray-400">(optional)</span>
        </span>
        <div>Used choice occurrences: <span :data-testid="`${fieldMetadata.path}-used-choice-occurrences`">{{ usedChoiceOccurrences }}</span></div>
        <div v-if="fieldMetadata.choice?.length" class="flex gap-2 flex-wrap">
          <button
            v-for="branch in fieldMetadata.choice"
            :key="`${branch.name}-add`"
            type="button"
            :disabled="!canAddChoiceOccurrence(branch.name)"
            :data-testid="`${fieldMetadata.path}.${branch.name}-add-choice-button`"
            @click="addChoiceOccurrence(branch.name)"
          >
            Add {{ branch.name }}
          </button>
          <button
            v-for="branch in fieldMetadata.choice"
            :key="`${branch.name}-remove`"
            type="button"
            :data-testid="`${fieldMetadata.path}.${branch.name}-remove-choice-button`"
            @click="removeChoiceOccurrence(branch.name)"
          >
            Remove {{ branch.name }}
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 ms-6">
          <slot :level="(slotProps?.level ?? 0) + 1" :below-choice-field="true" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
      </div>
    </template>

    <template #default-choice-array-item="{ fieldMetadata, slotProps, branchKey, globalIndex, insertionOrder, canAddItems, addItem, removeItem }">
      <!--
        Repeatable explicit-choice occurrence test harness: renders the branchKey slot
        prop directly (as a "kind badge") so tests can assert it arrived as a real slot prop
        rather than being inferred from the path, plus add/remove buttons wired to
        addItem/removeItem (addItem appends another occurrence of this occurrence's own branch,
        so the occurrence behaves like a regular array item). Forwards the default slot for the
        occurrence's own fields, mirroring #default's own remove-button pattern. insertionOrder is optional (undefined for an occurrence never
        added this session), so its absence is asserted as "the testid does not exist" rather
        than a rendered "undefined" string.
      -->
      <div v-if="!fieldMetadata.hidden" class="flex flex-col gap-2 border-s-2 ps-2" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <div class="flex gap-2 items-center">
          <span :data-testid="`${fieldMetadata.path}-kind-badge`">{{ branchKey }}</span>
          globalIndex: <span :data-testid="`${fieldMetadata.path}-global-index`">{{ globalIndex }}</span>
          insertionOrder: <span v-if="insertionOrder !== undefined" :data-testid="`${fieldMetadata.path}-insertion-order`">{{ insertionOrder }}</span>
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" :data-testid="`${fieldMetadata.path}-add-choice-button`" @click="addItem" />
          <IconButton icon="minus" tabindex="-1" color="red" :data-testid="`${fieldMetadata.path}-remove-choice-button`" @click="removeItem" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <slot :level="(slotProps?.level ?? 0) + 1" />
        </div>
      </div>
    </template>

    <!--
      Wizard container test harness: builds its stepper purely from the `pages` slot prop (never
      `fieldMetadata.children`), so a stepper/navigation desync would fail any test asserting the
      rendered step list against actual navigation. Buttons/spans mirror the -choice harness above.
    -->
    <template #default-wizard="{ fieldMetadata, fieldContext: { errorMessage, label }, pages, currentStepIndex, pageCount, isFirst, isLast, isValidating, next, prev, gotoStep }">
      <div class="flex flex-col gap-2">
        <span>{{ label }}</span>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="(page, pageIndex) in pages"
            :key="page.path"
            type="button"
            :data-testid="`${fieldMetadata.path}-goto-${pageIndex}-button`"
            @click="gotoStep(pageIndex)"
          >
            {{ page.name }}
          </button>
        </div>
        <span :data-testid="`${fieldMetadata.path}-currentStepIndex`">{{ currentStepIndex }}</span>
        <span :data-testid="`${fieldMetadata.path}-pageCount`">{{ pageCount }}</span>
        <span :data-testid="`${fieldMetadata.path}-isFirst`">{{ isFirst }}</span>
        <span :data-testid="`${fieldMetadata.path}-isLast`">{{ isLast }}</span>
        <span :data-testid="`${fieldMetadata.path}-isValidating`">{{ isValidating }}</span>
        <div class="flex gap-2">
          <button type="button" :data-testid="`${fieldMetadata.path}-prev-button`" @click="prev">
            Previous
          </button>
          <button type="button" :data-testid="`${fieldMetadata.path}-next-button`" @click="next">
            Next
          </button>
        </div>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 ms-6">
          <slot />
        </div>
      </div>
    </template>

    <!--
      Wizard page visibility wrapper. The correct implementation gates with v-show (keeps every
      page mounted so values and validation survive navigation). The wizardPageUseVIf setting flips
      it to v-if so a playground can show the clear-on-unmount data loss v-show avoids; it defaults
      off, so tests and every other consumer keep the correct v-show behaviour.
    -->
    <template #default-wizard-page="{ fieldMetadata, isCurrent, settings: { wizardPageUseVIf } }">
      <div
        v-if="!wizardPageUseVIf"
        v-show="isCurrent"
        :data-testid="`${fieldMetadata.path}-page`"
        :data-current="isCurrent"
      >
        <slot />
      </div>
      <div
        v-else-if="isCurrent"
        :data-testid="`${fieldMetadata.path}-page`"
        :data-current="isCurrent"
      >
        <slot />
      </div>
    </template>

    <template #default-array="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, canAddItems, addItem, settings: { showOptionalInsteadOfRequired } }">
      <div v-if="!fieldMetadata.hidden" class="flex flex-col gap-2" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <label :for="`${fieldMetadata.path}[0]`" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled }" class="flex gap-2 items-center">
          {{ label }}
          <span v-if="required && !showOptionalInsteadOfRequired" class="text-red-500 dark:text-rose-400">*</span>
          <span v-if="!required && showOptionalInsteadOfRequired" class="text-sm text-gray-400">(optional)</span>
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" :data-testid="`${fieldMetadata.path}-add-button`" @click="addItem" />
        </label>
        <slot :hide-label="true" />
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
      </div>
    </template>

    <template #default="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, canRemoveItems, removeItem, slotProps, settings: { showOptionalInsteadOfRequired } }">
      <div v-if="!fieldMetadata.hidden" class="flex flex-col gap-2" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <label v-if="!slotProps?.hideLabel" :for="fieldMetadata.path" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled }" class="flex gap-1 items-center">
          {{ label }}
          <span v-if="required && !showOptionalInsteadOfRequired" class="text-red-500 dark:text-rose-400">*</span>
          <span v-if="!required && showOptionalInsteadOfRequired" class="text-sm text-gray-400">(optional)</span>
        </label>
        <div class="flex gap-2 items-center">
          <div class="flex flex-col grow">
            <slot />
          </div>
          <IconButton :class="{ invisible: !canRemoveItems }" icon="minus" tabindex="-1" color="red" :data-testid="`${fieldMetadata.path}-remove-button`" @click="removeItem" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
      </div>
      <slot name="attributes" />
    </template>

    <template #group-array="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, canAddItems, addItem, slotProps, settings: { showOptionalInsteadOfRequired } }">
      <template v-if="fieldMetadata.hidden" />
      <!-- In case we're below a choice field, the first array item is not automatically added, so show a label with buttons -->
      <div v-else-if="slotProps?.belowChoiceField" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <span class="flex gap-2 items-center mb-2" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled }">
          {{ label }}
          <span v-if="required && !showOptionalInsteadOfRequired" class="text-red-500 dark:text-rose-400">*</span>
          <span v-if="!required && showOptionalInsteadOfRequired" class="text-sm text-gray-400">(optional)</span>
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" :data-testid="`${fieldMetadata.path}-add-button`" @click="addItem" />
        </span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 ms-6">
          <slot :level="(slotProps?.level ?? 0) + 1" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
      </div>
      <!-- In case we show an input directly, show a label and buttons -->
      <slot v-else />
    </template>

    <template #group="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, canAddItems, canRemoveItems, addItem, removeItem, slotProps, settings: { showOptionalInsteadOfRequired } }">
      <!-- In case of a grouped field we render the field differently -->
      <div v-if="!fieldMetadata.hidden" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <span v-if="!slotProps?.hideLabel" class="flex gap-2 items-center mb-2" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled }">
          {{ label }}
          <span v-if="required && !showOptionalInsteadOfRequired" class="text-red-500 dark:text-rose-400">*</span>
          <span v-if="!required && showOptionalInsteadOfRequired" class="text-sm text-gray-400">(optional)</span>
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" :data-testid="`${fieldMetadata.path}-add-button`" @click="addItem" />
          <IconButton v-if="canRemoveItems" icon="minus" tabindex="-1" :data-testid="`${fieldMetadata.path}-remove-button`" color="red" @click="removeItem" />
        </span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 ms-6">
          <slot :level="(slotProps?.level ?? 0) + 1" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
      </div>
      <slot name="attributes" />
    </template>

    <template #select-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange }, disabled }">
      <select
        :id="fieldMetadata.path"
        :value="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm"
        @change="handleChange"
        @blur="handleBlur"
      >
        <option v-for="{ key: optionKey, value: optionValue } in fieldMetadata.options" :key="optionKey" :value="optionKey">
          {{ optionValue }}
        </option>
      </select>
    </template>

    <template #selectBoundByVModel-input="{ fieldMetadata, fieldContext: { value, handleBlur }, disabled }">
      <select
        :id="fieldMetadata.path"
        v-model="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm"
        @blur="handleBlur"
      >
        <option v-for="{ key: optionKey, value: optionValue } in fieldMetadata.options" :key="optionKey" :value="optionKey">
          {{ optionValue }}
        </option>
      </select>
    </template>

    <template #checkbox-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange }, disabled }">
      <input
        :id="fieldMetadata.path"
        :checked="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        type="checkbox"
        class="h-6 bg-gray-100 border-gray-200 border rounded px-3 text-sm"
        @change="handleChange(($event.target as HTMLInputElement).checked)"
        @blur="handleBlur"
      >
    </template>

    <template #checkboxBoundByVModel-input="{ fieldMetadata, fieldContext: { value, handleBlur }, disabled }">
      <input
        :id="fieldMetadata.path"
        v-model="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        type="checkbox"
        class="h-6 bg-gray-100 border-gray-200 border rounded px-3 text-sm"
        @blur="handleBlur"
      >
    </template>

    <template #textBoundByVModel-input="{ fieldMetadata, fieldContext: { value, handleBlur }, disabled }">
      <input
        :id="fieldMetadata.path"
        v-model="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        type="text"
        class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm"
        @blur="handleBlur"
      >
    </template>

    <template #default-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange }, disabled }">
      <input
        :id="fieldMetadata.path"
        :value="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        type="text"
        class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm"
        @input="handleChange"
        @blur="handleBlur"
      >
    </template>
  </DynamicFormTemplate>
</template>
