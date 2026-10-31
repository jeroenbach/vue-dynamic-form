<script lang="ts" setup>
import type { GenericValidateFunction } from 'vee-validate';
import type { DynamicFormSettings, Metadata } from './InboxRulesTemplate.vue';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { computed, ref } from 'vue';
import { collectRules, routeInbox, TEST_INBOX } from './inboxRoutingMath';
import InboxRulesTemplate from './InboxRulesTemplate.vue';
import TestInboxPanel from './TestInboxPanel.vue';

export interface InboxRuleFields {
  order?: number
  action?: string
  folder?: string
  label?: string
  forwardTo?: string
}

export interface InboxRulesValues {
  rules?: {
    fromSender?: ({ email?: string } & InboxRuleFields)[]
    subjectContains?: ({ text?: string } & InboxRuleFields)[]
    largerThan?: ({ size?: number, unit?: string } & InboxRuleFields)[]
    hasAttachment?: InboxRuleFields[]
  }
}

// #region constants
const RULES_MAX_OCCURS = 20;

const ACTION_OPTIONS = [
  { key: 'folder', value: 'Move to folder' },
  { key: 'label', value: 'Apply label' },
  { key: 'forward', value: 'Forward to' },
  { key: 'delete', value: 'Delete' },
];

const UNIT_OPTIONS = [
  { key: 'KB', value: 'KB' },
  { key: 'MB', value: 'MB' },
];

const EMAIL_PATTERN = '^.+@.+\\..+$';

const MESSAGES = {
  required: '{field} is required',
  pattern: 'Enter a valid email address.',
};
// #endregion constants

const { values, meta, handleSubmit } = useDynamicForm<InboxRulesValues>();

const canSubmit = computed(() => meta.value.valid);
const submitted = ref(false);

// #region live-routing
// Reads straight off the form's own reactive values on every change (add, edit, remove, or
// reorder), never through computedProps: this is a read-only display projection, not field state.
const routedInbox = computed(() => routeInbox(collectRules(values.rules), TEST_INBOX));
// #endregion live-routing

const settings: DynamicFormSettings = {
  messages: MESSAGES,
};

// Reads a dot/bracket-notation path off a plain reactive object, e.g.
// `rules.subjectContains[0].action`. Splits on both separators, since a path segment with an
// array index (`subjectContains[0]`) is two lookups (key, then index), not one.
function readPath(source: unknown, path: string): unknown {
  const segments = path.match(/[^.[\]]+/g) ?? [];
  return segments.reduce<unknown>((value, key) => {
    if (value == null || typeof value !== 'object')
      return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

// Strips a field path's own last segment (e.g. `.folder`) to get the occurrence it belongs to,
// then points at that occurrence's own `action`. A companion field's metadata node is shared
// across every occurrence of its branch, so its own path (which does carry the occurrence index,
// e.g. `rules.subjectContains[2].folder`) is the only reliable way to find its own sibling action;
// a field's `parent` reference points at that one shared branch node, not a specific occurrence.
function actionPathFor(fieldPath: string): string {
  return `${fieldPath.slice(0, fieldPath.lastIndexOf('.'))}.action`;
}

function siblingAction(thisField: { path?: string }): unknown {
  return readPath(values, actionPathFor(thisField.path ?? ''));
}

function emailFormat(value: unknown): true | string {
  if (!value)
    return true;
  return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(String(value)) || 'Enter a valid email address.';
}

// #region action-reveal
// A companion field (folder / label / forwardTo) only ever needs to validate while its own
// occurrence's action still points at it. Reading the sibling action through the validation ctx,
// rather than a single shared flag, is what makes this correct for every occurrence independently:
// a module-level boolean could only ever represent one rule's action, not N of them.
function companionValidation(expectedAction: string, formatCheck?: (value: unknown) => true | string): GenericValidateFunction {
  return (value, ctx) => {
    // ctx.field is the human-readable label used in error messages; ctx.name carries the actual
    // registered path, which is what a sibling lookup needs.
    const action = readPath(ctx.form, actionPathFor(ctx.name));
    if (action !== expectedAction)
      return true;
    return formatCheck ? formatCheck(value) : true;
  };
}

// The shared action block every branch carries: a required action select plus its three
// companion fields, each hidden and de-required unless its own action is selected. This also
// gives every branch, including "Has attachment", non-empty children (see the hasAttachment
// branch below), so none of them need a presence marker to satisfy the engine's required check.
function createRuleActionFields(): Metadata[] {
  return [
    {
      name: 'action',
      type: 'select',
      fieldOptions: { label: 'Then' },
      options: ACTION_OPTIONS,
      restriction: { enumeration: ACTION_OPTIONS.map(option => option.key) },
    },
    {
      name: 'folder',
      type: 'text',
      fieldOptions: { label: 'Folder' },
      placeholder: 'e.g. Large files',
      minOccurs: 0,
      validation: companionValidation('folder'),
      computedProps: [(thisField) => {
        const action = siblingAction(thisField);
        thisField.hide = action !== 'folder';
        thisField.minOccurs = action === 'folder' ? 1 : 0;
      }],
    },
    {
      name: 'label',
      type: 'text',
      fieldOptions: { label: 'Label' },
      placeholder: 'e.g. Newsletters',
      minOccurs: 0,
      validation: companionValidation('label'),
      computedProps: [(thisField) => {
        const action = siblingAction(thisField);
        thisField.hide = action !== 'label';
        thisField.minOccurs = action === 'label' ? 1 : 0;
      }],
    },
    {
      name: 'forwardTo',
      type: 'email',
      fieldOptions: { label: 'Forward to' },
      placeholder: 'name@example.com',
      minOccurs: 0,
      validation: companionValidation('forward', emailFormat),
      computedProps: [(thisField) => {
        const action = siblingAction(thisField);
        thisField.hide = action !== 'forward';
        thisField.minOccurs = action === 'forward' ? 1 : 0;
      }],
    },
  ];
}
// #endregion action-reveal

// #region metadata
const metadata: Metadata[] = [
  {
    name: 'rules',
    type: 'rule',
    fieldOptions: { label: 'Routing rules' },
    description: 'Applied top to bottom. The first rule that matches a message wins.',
    // Zero rules is valid data: every message simply stays in the Inbox until a rule is added.
    minOccurs: 0,
    maxOccurs: RULES_MAX_OCCURS,
    explicitChoiceSelection: true,
    displayOrder: 'added',
    // Required for the up/down reorder control to have anything to write: every branch below
    // already carries the shared action block as children, so this needs no metadata reshape.
    preserveOrder: true,
    choice: [
      {
        name: 'fromSender',
        type: 'rule',
        fieldOptions: { label: 'From sender' },
        children: [
          {
            name: 'email',
            type: 'email',
            fieldOptions: { label: 'Sender email' },
            placeholder: 'name@example.com',
            restriction: { pattern: EMAIL_PATTERN },
          },
          ...createRuleActionFields(),
        ],
      },
      {
        name: 'subjectContains',
        type: 'rule',
        fieldOptions: { label: 'Subject contains' },
        children: [
          { name: 'text', type: 'text', fieldOptions: { label: 'Text in subject' }, placeholder: 'e.g. Invoice' },
          ...createRuleActionFields(),
        ],
      },
      {
        name: 'largerThan',
        type: 'rule',
        fieldOptions: { label: 'Larger than' },
        children: [
          { name: 'size', type: 'number', fieldOptions: { label: 'Size' }, placeholder: '1' },
          {
            name: 'unit',
            type: 'select',
            fieldOptions: { label: 'Unit' },
            options: UNIT_OPTIONS,
            restriction: { enumeration: UNIT_OPTIONS.map(option => option.key) },
          },
          ...createRuleActionFields(),
        ],
      },
      // #region hasattachment-branch
      {
        name: 'hasAttachment',
        type: 'rule',
        fieldOptions: { label: 'Has attachment' },
        // No filter field of its own: the shared action block below already gives this branch
        // children, so it satisfies the engine's default required check with nothing artificial.
        children: [
          ...createRuleActionFields(),
        ],
      },
      // #endregion hasattachment-branch
    ],
  },
];
// #endregion metadata

const onSubmit = handleSubmit(() => {
  submitted.value = true;
});

function editRules() {
  submitted.value = false;
}
</script>

<template>
  <div class="form-demo inbox-rules-layout">
    <form class="flex flex-col gap-6" @submit="onSubmit">
      <DynamicForm :template="InboxRulesTemplate" :metadata :settings />

      <div v-if="!submitted" class="flex flex-col gap-3">
        <button
          type="submit"
          class="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors cursor-pointer hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!canSubmit"
          data-testid="save-rules-button"
        >
          Save rule set
        </button>
      </div>

      <div
        v-else
        class="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-4 text-sm text-emerald-900 dark:text-emerald-200"
        data-testid="rules-saved-banner"
      >
        <span>✅</span>
        <span>
          <strong>Rule set saved.</strong>
          (Demo only: nothing was sent.)
          <button type="button" class="ml-2 underline cursor-pointer hover:no-underline" @click="editRules">
            Edit rules
          </button>
        </span>
      </div>

      <pre
        v-if="!submitted"
        class="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg text-sm overflow-auto"
      >
IsDirty: {{ meta.dirty }}
Touched: {{ meta.touched }}
Valid: {{ meta.valid }}

// form values:
{{ JSON.stringify(values, null, 2) }}
      </pre>
    </form>

    <TestInboxPanel class="inbox-rail" :routedInbox="routedInbox" />
  </div>
</template>

<style scoped>
.inbox-rules-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
}

.inbox-rail {
  position: sticky;
  top: 24px;
}

@media (max-width: 1023px) {
  .inbox-rules-layout {
    grid-template-columns: 1fr;
  }

  .inbox-rail {
    position: static;
    order: -1;
  }
}
</style>
