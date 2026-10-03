<script
  lang="ts"
  setup
  generic="TMetadataConfiguration extends MetadataConfiguration = typeof elementPlusMetadata"
>
import type { MetadataConfiguration } from '@bach.software/vue-dynamic-form';
import type {
  ElButton,
  ElCard,
  ElCascader,
  ElCheckbox,
  ElColorPicker,
  ElDatePicker,
  ElDivider,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElRate,
  ElSelect,
  ElSlider,
  ElStep,
  ElSteps,
  ElSwitch,
  ElTag,
  ElTimePicker,
  ElTransfer,
  ElUpload,
} from 'element-plus';
import type { ElementPlusFormTemplateSlots } from '@/slots';
import { DynamicFormTemplate } from '@bach.software/vue-dynamic-form';
import { useSlots } from 'vue';
import { elementPlusMetadata } from '@/metadata';

const props = defineProps<{
  /** Defaults to `elementPlusMetadata`. Pass an `extendMetadata` result to type your own field types and properties. */
  metadataConfiguration?: TMetadataConfiguration
}>();

defineSlots<ElementPlusFormTemplateSlots<TMetadataConfiguration>>();
const slots = useSlots();

// The fallback markup is written against the built-in catalogue; the generic only widens the slot scopes consumers see.
const metadata = (props.metadataConfiguration ?? elementPlusMetadata) as typeof elementPlusMetadata;

// `input` and `attributes` are reserved: they carry the engine's field and attribute render and may not be field types.
// Every other slot a consumer supplies reaches the dispatcher, so the names below (which get an explicit fallback
// template) are the only ones left out of the generic forward.
const unforwardedSlotNames = new Set([
  'input',
  'attributes',
  'default',
  'default-input',
  'default-array',
  'default-array-item',
  'default-choice',
  'default-choice-array',
  'default-choice-array-item',
  'default-wizard',
  'default-wizard-page',
  'text-input',
  'select-input',
  'checkbox',
  'checkbox-input',
  'radio-input',
  'date-input',
  'time-input',
  'datetime-input',
  'switch',
  'switch-input',
  'number-input',
  'rate-input',
  'slider-input',
  'color-input',
  'cascader-input',
  'transfer-input',
  'upload-input',
  'heading',
  'divider',
]);

// Without a value format the pickers emit `Date` objects, while the field types declare strings.
const pickerValueFormats = {
  date: 'YYYY-MM-DD',
  time: 'HH:mm:ss',
  datetime: 'YYYY-MM-DD HH:mm:ss',
};

function dateValueFormat(type?: string) {
  return type?.startsWith('datetime') ? pickerValueFormats.datetime : pickerValueFormats.date;
}

// `ElTransfer` has no disabled prop of its own; the per-item flag is what blocks moving an item.
function transferData(data: Record<string, any>[] | undefined, disabled: boolean) {
  return disabled ? data?.map(item => ({ ...item, disabled: true })) : data;
}

interface LockableScope {
  disabled: boolean
  fieldMetadata: { disabled?: unknown }
}

// `maxOccurs: 0` reaches the template as `disabled`, the extended `disabled` property as field metadata.
function isLocked(scope: LockableScope) {
  return scope.disabled || !!scope.fieldMetadata.disabled;
}

// An item's path ends in its index; the test ids are keyed by the array's own path.
function arrayPathOf(itemPath: string) {
  return itemPath.replace(/\[\d+\]$/, '');
}

interface BranchLike {
  name?: string
  label?: string
}

function branchLabel(branch: BranchLike) {
  return branch.label ?? branch.name;
}

interface StepLike {
  name?: string
  label?: string
}

function stepTitle(page: StepLike, index: number) {
  return page.label ?? page.name ?? `Step ${index + 1}`;
}

interface WizardScope extends LockableScope {
  currentStepIndex: number
  wizardConfig: { allowForwardJump: boolean }
  gotoStep: (index: number) => unknown
}

function canJumpToStep(scope: WizardScope, index: number) {
  return !isLocked(scope) && index !== scope.currentStepIndex
    && (index < scope.currentStepIndex || scope.wizardConfig.allowForwardJump);
}

// `ElSteps` has no per-step click event, so the jump is layered on each step. The engine decides whether the move happens.
function jumpToStep(scope: WizardScope, index: number) {
  if (canJumpToStep(scope, index))
    scope.gotoStep(index);
}

// A function called from the template: `useSlots()` is not reactive, so a computed would never see a slot added after mount.
function forwardedSlotNames() {
  return Object.keys(slots).filter(name => !unforwardedSlotNames.has(name));
}

// Without an `input` forward the unnamed `default` slot is the engine's field render and not a chrome override.
// The empty name never matches a slot, so the built-in chrome renders.
function chromeSlotName() {
  return slots.input ? 'default' : '';
}
</script>

<template>
  <DynamicFormTemplate :metadataConfiguration="metadata">
    <!-- Default wrapper with form item -->
    <template #default="s">
      <slot :name="chromeSlotName()" v-bind="s">
        <ElFormItem
          :label="s.fieldMetadata.label"
          :size="s.fieldMetadata.size"
          :required="s.required"
        >
          <slot name="input">
            <slot />
          </slot>
          <p
            v-if="s.fieldContext.errorMessage.value"
            class="epft-field-error"
            :data-testid="`${s.fieldMetadata.path}-error-message`"
          >
            {{ s.fieldContext.errorMessage.value }}
          </p>
        </ElFormItem>
      </slot>
      <slot name="attributes" />
    </template>

    <!-- Default input fallback -->
    <template #default-input="s">
      <slot name="default-input" v-bind="s">
        <ElInput
          :modelValue="s.fieldContext.value.value"
          :placeholder="s.fieldMetadata.placeholder"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :readonly="s.fieldMetadata.readonly"
          :size="s.fieldMetadata.size"
          :clearable="s.fieldMetadata.clearable"
          @update:modelValue="s.fieldContext.handleChange"
        />
      </slot>
    </template>

    <!-- Text input -->
    <template #text-input="s">
      <slot name="text-input" v-bind="s">
        <ElInput
          :modelValue="s.fieldContext.value.value"
          :placeholder="s.fieldMetadata.placeholder"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :readonly="s.fieldMetadata.readonly"
          :size="s.fieldMetadata.size"
          :clearable="s.fieldMetadata.clearable"
          @update:modelValue="s.fieldContext.handleChange"
        />
      </slot>
    </template>

    <!-- Select -->
    <template #select-input="s">
      <slot name="select-input" v-bind="s">
        <ElSelect
          :modelValue="s.fieldContext.value.value"
          :placeholder="s.fieldMetadata.placeholder"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :size="s.fieldMetadata.size"
          :clearable="s.fieldMetadata.clearable"
          :filterable="s.fieldMetadata.filterable"
          :multiple="s.fieldMetadata.multiple"
          @update:modelValue="s.fieldContext.handleChange"
        >
          <ElOption
            v-for="option in s.fieldMetadata.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </slot>
    </template>

    <!-- Checkbox -->
    <template #checkbox="s">
      <slot name="checkbox" v-bind="s">
        <div>
          <slot name="input">
            <slot />
          </slot>
        </div>
      </slot>
      <slot name="attributes" />
    </template>

    <template #checkbox-input="s">
      <slot name="checkbox-input" v-bind="s">
        <ElCheckbox
          :modelValue="s.fieldContext.value.value"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :size="s.fieldMetadata.size"
          @update:modelValue="s.fieldContext.handleChange"
        >
          {{ s.fieldMetadata.label }}
        </ElCheckbox>
      </slot>
    </template>

    <!-- Radio Group -->
    <template #radio-input="s">
      <slot name="radio-input" v-bind="s">
        <ElRadioGroup
          :modelValue="s.fieldContext.value.value"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :size="s.fieldMetadata.size"
          @update:modelValue="s.fieldContext.handleChange"
        >
          <ElRadio
            v-for="option in s.fieldMetadata.options"
            :key="option.value"
            :label="option.value"
          >
            {{ option.label }}
          </ElRadio>
        </ElRadioGroup>
      </slot>
    </template>

    <!-- Date picker -->
    <template #date-input="s">
      <slot name="date-input" v-bind="s">
        <ElDatePicker
          :modelValue="s.fieldContext.value.value"
          :type="s.fieldMetadata.date?.type || 'date'"
          :placeholder="s.fieldMetadata.placeholder"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :readonly="s.fieldMetadata.readonly"
          :size="s.fieldMetadata.size"
          :clearable="s.fieldMetadata.clearable"
          :format="s.fieldMetadata.format"
          :valueFormat="s.fieldMetadata.valueFormat ?? dateValueFormat(s.fieldMetadata.date?.type)"
          @update:modelValue="s.fieldContext.handleChange"
        />
      </slot>
    </template>

    <!-- Time picker -->
    <template #time-input="s">
      <slot name="time-input" v-bind="s">
        <ElTimePicker
          :modelValue="s.fieldContext.value.value"
          :placeholder="s.fieldMetadata.placeholder"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :readonly="s.fieldMetadata.readonly"
          :size="s.fieldMetadata.size"
          :clearable="s.fieldMetadata.clearable"
          :format="s.fieldMetadata.format"
          :valueFormat="s.fieldMetadata.valueFormat ?? pickerValueFormats.time"
          @update:modelValue="s.fieldContext.handleChange"
        />
      </slot>
    </template>

    <!-- DateTime picker -->
    <template #datetime-input="s">
      <slot name="datetime-input" v-bind="s">
        <ElDatePicker
          :modelValue="s.fieldContext.value.value"
          type="datetime"
          :placeholder="s.fieldMetadata.placeholder"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :readonly="s.fieldMetadata.readonly"
          :size="s.fieldMetadata.size"
          :clearable="s.fieldMetadata.clearable"
          :format="s.fieldMetadata.format"
          :valueFormat="s.fieldMetadata.valueFormat ?? pickerValueFormats.datetime"
          @update:modelValue="s.fieldContext.handleChange"
        />
      </slot>
    </template>

    <!-- Switch -->
    <template #switch="s">
      <slot name="switch" v-bind="s">
        <div class="epft-switch-row">
          <span v-if="s.fieldMetadata.label">{{ s.fieldMetadata.label }}</span>
          <slot name="input">
            <slot />
          </slot>
        </div>
      </slot>
      <slot name="attributes" />
    </template>

    <template #switch-input="s">
      <slot name="switch-input" v-bind="s">
        <ElSwitch
          :modelValue="s.fieldContext.value.value"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :size="s.fieldMetadata.size"
          @update:modelValue="s.fieldContext.handleChange"
        />
      </slot>
    </template>

    <!-- Number input -->
    <template #number-input="s">
      <slot name="number-input" v-bind="s">
        <ElInputNumber
          :modelValue="s.fieldContext.value.value"
          :placeholder="s.fieldMetadata.placeholder"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :readonly="s.fieldMetadata.readonly"
          :size="s.fieldMetadata.size"
          :min="s.fieldMetadata.min"
          :max="s.fieldMetadata.max"
          :step="s.fieldMetadata.step"
          :precision="s.fieldMetadata.number?.precision"
          @update:modelValue="s.fieldContext.handleChange"
        />
      </slot>
    </template>

    <!-- Rate -->
    <template #rate-input="s">
      <slot name="rate-input" v-bind="s">
        <ElRate
          :modelValue="s.fieldContext.value.value"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :max="s.fieldMetadata.max || 5"
          @update:modelValue="s.fieldContext.handleChange"
        />
      </slot>
    </template>

    <!-- Slider -->
    <template #slider-input="s">
      <slot name="slider-input" v-bind="s">
        <ElSlider
          :modelValue="s.fieldContext.value.value"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :min="s.fieldMetadata.min"
          :max="s.fieldMetadata.max"
          :step="s.fieldMetadata.step"
          :showStops="s.fieldMetadata.slider?.showStops"
          :range="s.fieldMetadata.slider?.range"
          @update:modelValue="s.fieldContext.handleChange"
        />
      </slot>
    </template>

    <!-- Color picker -->
    <template #color-input="s">
      <slot name="color-input" v-bind="s">
        <ElColorPicker
          :modelValue="s.fieldContext.value.value"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :size="s.fieldMetadata.size"
          :showAlpha="s.fieldMetadata.color?.showAlpha"
          :colorFormat="s.fieldMetadata.color?.colorFormat"
          @update:modelValue="s.fieldContext.handleChange"
        />
      </slot>
    </template>

    <!-- Cascader -->
    <template #cascader-input="s">
      <slot name="cascader-input" v-bind="s">
        <ElCascader
          :modelValue="s.fieldContext.value.value"
          :options="s.fieldMetadata.options"
          :props="s.fieldMetadata.cascader?.props"
          :placeholder="s.fieldMetadata.placeholder"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :size="s.fieldMetadata.size"
          :clearable="s.fieldMetadata.clearable"
          :filterable="s.fieldMetadata.filterable"
          @update:modelValue="s.fieldContext.handleChange"
        />
      </slot>
    </template>

    <!-- Transfer -->
    <template #transfer-input="s">
      <slot name="transfer-input" v-bind="s">
        <ElTransfer
          :modelValue="s.fieldContext.value.value"
          :data="transferData(s.fieldMetadata.transfer?.data, !!(s.fieldMetadata.disabled || s.disabled))"
          :filterable="s.fieldMetadata.filterable"
          @update:modelValue="s.fieldContext.handleChange"
        />
      </slot>
    </template>

    <!-- Upload -->
    <template #upload-input="s">
      <slot name="upload-input" v-bind="s">
        <ElUpload
          :fileList="s.fieldContext.value.value"
          :action="s.fieldMetadata.upload?.action"
          :accept="s.fieldMetadata.upload?.accept"
          :listType="s.fieldMetadata.upload?.listType"
          :autoUpload="s.fieldMetadata.upload?.autoUpload"
          :showFileList="s.fieldMetadata.upload?.showFileList"
          :disabled="s.fieldMetadata.disabled || s.disabled"
          :onChange="(_file: unknown, fileList: unknown[]) => s.fieldContext.handleChange(fileList)"
          :onRemove="(_file: unknown, fileList: unknown[]) => s.fieldContext.handleChange(fileList)"
        >
          <ElButton :size="s.fieldMetadata.size" :disabled="s.fieldMetadata.disabled || s.disabled">
            Click to upload
          </ElButton>
        </ElUpload>
      </slot>
    </template>

    <!-- Heading -->
    <template #heading="s">
      <slot name="heading" v-bind="s">
        <div class="epft-heading">
          <h3 class="epft-heading-title">
            {{ s.fieldMetadata.label }}
          </h3>
          <slot name="input">
            <slot />
          </slot>
        </div>
      </slot>
      <slot name="attributes" />
    </template>

    <!-- Divider -->
    <template #divider="s">
      <slot name="divider" v-bind="s">
        <ElDivider>
          {{ s.fieldMetadata.label }}
        </ElDivider>
      </slot>
    </template>

    <!-- Array section -->
    <template #default-array="s">
      <slot name="default-array" v-bind="s">
        <ElCard class="epft-array-section" shadow="never" :data-testid="`${s.fieldMetadata.path}-array-section`">
          <template #header>
            <span class="epft-array-title" :class="{ 'is-required': s.required }">{{ s.fieldMetadata.label }}</span>
          </template>
          <div class="epft-array-items">
            <slot name="input">
              <slot />
            </slot>
          </div>
          <p v-if="s.fieldContext.errorMessage.value" class="epft-array-error">
            {{ s.fieldContext.errorMessage.value }}
          </p>
          <template #footer>
            <ElButton
              :disabled="!s.canAddItems || isLocked(s)"
              :data-testid="`${s.fieldMetadata.path}-add-button`"
              @click="s.canAddItems && !isLocked(s) && s.addItem()"
            >
              Add
            </ElButton>
          </template>
        </ElCard>
      </slot>
    </template>

    <!-- Array item -->
    <template #default-array-item="s">
      <slot name="default-array-item" v-bind="s">
        <ElCard
          class="epft-array-item"
          shadow="never"
          :data-testid="`${arrayPathOf(s.fieldMetadata.path)}-array-item-${s.index}`"
        >
          <div class="epft-array-item-row">
            <div class="epft-array-item-content">
              <slot name="input">
                <slot />
              </slot>
              <p v-if="s.fieldContext.errorMessage.value" class="epft-array-error">
                {{ s.fieldContext.errorMessage.value }}
              </p>
            </div>
            <ElButton
              :disabled="!s.canRemoveItems || isLocked(s)"
              :data-testid="`${arrayPathOf(s.fieldMetadata.path)}-remove-button-${s.index}`"
              @click="s.canRemoveItems && !isLocked(s) && s.removeItem()"
            >
              Remove
            </ElButton>
          </div>
        </ElCard>
      </slot>
      <slot name="attributes" />
    </template>

    <!-- Single choice section -->
    <template #default-choice="s">
      <slot name="default-choice" v-bind="s">
        <ElCard class="epft-choice-section" shadow="never" :data-testid="`${s.fieldMetadata.path}-choice-section`">
          <template #header>
            <span class="epft-array-title" :class="{ 'is-required': s.required }">{{ s.fieldMetadata.label }}</span>
          </template>
          <div v-if="s.fieldMetadata.explicitChoiceSelection" class="epft-choice-controls">
            <ElButton
              v-for="branch in s.fieldMetadata.choice"
              :key="branch.name"
              :type="s.activeChoiceOccurrences.some(occurrence => occurrence.branchKey === branch.name) ? 'primary' : 'default'"
              :disabled="!s.canAddChoiceOccurrence(branch.name) || isLocked(s)"
              :data-testid="`${s.fieldMetadata.path}.${branch.name}-add-choice-button`"
              @click="s.canAddChoiceOccurrence(branch.name) && !isLocked(s) && s.addChoiceOccurrence(branch.name)"
            >
              {{ branchLabel(branch) }}
            </ElButton>
            <ElButton
              v-for="occurrence in s.activeChoiceOccurrences"
              :key="occurrence.branchKey"
              :disabled="isLocked(s)"
              :data-testid="`${s.fieldMetadata.path}.${occurrence.branchKey}-remove-choice-button`"
              @click="!isLocked(s) && s.removeChoiceOccurrence(occurrence.branchKey)"
            >
              Remove
            </ElButton>
          </div>
          <slot name="input">
            <slot />
          </slot>
          <p
            v-if="s.fieldContext.errorMessage.value"
            class="epft-array-error"
            :data-testid="`${s.fieldMetadata.path}-error-message`"
          >
            {{ s.fieldContext.errorMessage.value }}
          </p>
        </ElCard>
      </slot>
    </template>

    <!-- Repeatable choice section -->
    <template #default-choice-array="s">
      <slot name="default-choice-array" v-bind="s">
        <ElCard class="epft-choice-section" shadow="never" :data-testid="`${s.fieldMetadata.path}-choice-section`">
          <template #header>
            <div class="epft-choice-header">
              <span class="epft-array-title" :class="{ 'is-required': s.required }">{{ s.fieldMetadata.label }}</span>
              <ElTag size="small" :data-testid="`${s.fieldMetadata.path}-choice-counter`">
                {{ s.usedChoiceOccurrences }} of {{ s.fieldMetadata.maxOccurs }}
              </ElTag>
            </div>
          </template>
          <div v-if="s.fieldMetadata.explicitChoiceSelection" class="epft-choice-controls">
            <ElButton
              v-for="branch in s.fieldMetadata.choice"
              :key="branch.name"
              :disabled="!s.canAddChoiceOccurrence(branch.name) || isLocked(s)"
              :data-testid="`${s.fieldMetadata.path}.${branch.name}-add-choice-button`"
              @click="s.canAddChoiceOccurrence(branch.name) && !isLocked(s) && s.addChoiceOccurrence(branch.name)"
            >
              Add {{ branchLabel(branch) }}
            </ElButton>
          </div>
          <div class="epft-array-items">
            <slot name="input">
              <slot />
            </slot>
          </div>
          <p
            v-if="s.fieldContext.errorMessage.value"
            class="epft-array-error"
            :data-testid="`${s.fieldMetadata.path}-error-message`"
          >
            {{ s.fieldContext.errorMessage.value }}
          </p>
        </ElCard>
      </slot>
    </template>

    <!-- Repeatable choice occurrence -->
    <template #default-choice-array-item="s">
      <slot name="default-choice-array-item" v-bind="s">
        <ElCard class="epft-choice-occurrence" shadow="never" :data-testid="`${s.fieldMetadata.path}-choice-occurrence`">
          <template #header>
            <div class="epft-choice-header">
              <div class="epft-choice-badges">
                <ElTag size="small" :data-testid="`${s.fieldMetadata.path}-kind-badge`">
                  {{ s.fieldMetadata.label ?? s.branchKey }}
                </ElTag>
                <span class="epft-choice-number">#<span :data-testid="`${s.fieldMetadata.path}-global-index`">{{ s.globalIndex + 1 }}</span></span>
                <span v-if="s.insertionOrder !== undefined" class="epft-choice-number">
                  Added #<span :data-testid="`${s.fieldMetadata.path}-insertion-order`">{{ s.insertionOrder }}</span>
                </span>
              </div>
              <ElButton
                :disabled="!s.canRemoveItems || isLocked(s)"
                :data-testid="`${s.fieldMetadata.path}-remove-choice-button`"
                @click="s.canRemoveItems && !isLocked(s) && s.removeItem()"
              >
                Remove
              </ElButton>
            </div>
          </template>
          <slot name="input">
            <slot />
          </slot>
          <p v-if="s.fieldContext.errorMessage.value" class="epft-array-error">
            {{ s.fieldContext.errorMessage.value }}
          </p>
        </ElCard>
      </slot>
      <slot name="attributes" />
    </template>

    <!-- Wizard container -->
    <template #default-wizard="s">
      <slot name="default-wizard" v-bind="s">
        <div class="epft-wizard" :data-testid="`${s.fieldMetadata.path}-wizard`">
          <ElSteps v-if="s.pages.length" :active="s.currentStepIndex" finishStatus="success">
            <ElStep
              v-for="(page, index) in s.pages"
              :key="page.path"
              :title="stepTitle(page, index)"
              :class="{ 'epft-wizard-step-clickable': canJumpToStep(s, index) }"
              :data-testid="`${s.fieldMetadata.path}-step-${index}`"
              @click="jumpToStep(s, index)"
            />
          </ElSteps>
          <div class="epft-wizard-pages">
            <slot name="input">
              <slot />
            </slot>
          </div>
          <p
            v-if="s.fieldContext.errorMessage.value"
            class="epft-array-error"
            :data-testid="`${s.fieldMetadata.path}-error-message`"
          >
            {{ s.fieldContext.errorMessage.value }}
          </p>
          <div class="epft-wizard-navigation">
            <ElButton
              v-if="!s.isFirst"
              nativeType="button"
              :disabled="isLocked(s)"
              :data-testid="`${s.fieldMetadata.path}-prev-button`"
              @click="!isLocked(s) && s.prev()"
            >
              Previous
            </ElButton>
            <ElButton
              v-if="!s.isLast"
              type="primary"
              nativeType="button"
              :disabled="s.isValidating || isLocked(s)"
              :loading="s.isValidating"
              :data-testid="`${s.fieldMetadata.path}-next-button`"
              @click="!isLocked(s) && s.next()"
            >
              Next
            </ElButton>
            <ElButton
              v-else
              type="primary"
              nativeType="submit"
              :disabled="s.isValidating || isLocked(s)"
              :loading="s.isValidating"
              :data-testid="`${s.fieldMetadata.path}-submit-button`"
            >
              Submit
            </ElButton>
          </div>
        </div>
      </slot>
    </template>

    <!-- Wizard page: hidden with v-show so its fields stay registered -->
    <template #default-wizard-page="s">
      <slot name="default-wizard-page" v-bind="s">
        <div
          v-show="s.isCurrent"
          class="epft-wizard-page"
          :data-page="s.pageIndex"
          :data-testid="`${s.fieldMetadata.path}-page`"
        >
          <slot name="input">
            <slot />
          </slot>
        </div>
      </slot>
    </template>

    <!-- Slots the consumer adds on top of the built-in ones, such as the input slot of an own field type -->
    <template v-for="name in forwardedSlotNames()" :key="name" #[name]="s">
      <slot :name="name" v-bind="s" />
    </template>
  </DynamicFormTemplate>
</template>

<style scoped>
.epft-switch-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.epft-heading {
  margin: 1rem 0;
}

.epft-heading-title {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 600;
}
.epft-array-title {
  font-weight: 600;
}

.epft-array-title.is-required::before {
  content: '*';
  margin-right: 4px;
  color: var(--el-color-danger);
}

.epft-array-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.epft-array-item-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.epft-array-item-content {
  flex: 1;
  min-width: 0;
}

.epft-field-error {
  flex-basis: 100%;
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1;
  color: var(--el-color-danger);
}

.epft-array-error {
  margin: 0.5rem 0 0;
  font-size: 12px;
  line-height: 1;
  color: var(--el-color-danger);
}

.epft-choice-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.epft-choice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.epft-choice-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.epft-choice-number {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.epft-wizard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.epft-wizard-step-clickable {
  cursor: pointer;
}

.epft-wizard-navigation {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
