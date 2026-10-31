<script lang="ts" setup>
import type { Path } from 'vee-validate';
import type { DynamicFormSettings, Metadata } from './CheckoutFormTemplate.vue';
import type { SplitPaymentBranchShape } from './splitPaymentLedgerMath';
import { DynamicForm, removeNullValues, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { computed, ref } from 'vue';
import CheckoutFormTemplate from './CheckoutFormTemplate.vue';
import OrderSummary from './OrderSummary.vue';
import { collectSplitPaymentOccurrences, computeSplitPaymentLedger } from './splitPaymentLedgerMath';

export interface CheckoutFormValues {
  checkoutMethod?: {
    manual?: {
      contact?: {
        fullName?: string
        email?: string
        phone?: string
      }
      deliveryAddress?: {
        street?: string
        country?: string
        postalCode?: string
        city?: string
      }
      business?: {
        isBusiness?: boolean
        company?: string
        vatNumber?: string
      }
      shippingMethod?: {
        homeDelivery?: Record<string, never>
        pickup?: string
      }
      paymentMethod?: {
        card?: { cardNumber?: string, expiry?: string, cvc?: string }
        ideal?: { bank?: string }
        payPal?: Record<string, never>
        klarna?: { installmentPlan?: string }
      }
      splitPaymentActive?: boolean
      splitPayment?: {
        giftCard?: { order?: number, code?: string, amount?: string }[]
        voucher?: { order?: number, code?: string, amount?: string }[]
        card?: { order?: number, cardNumber?: string }[]
        payPal?: { order?: number, account?: string }[]
      }
      splitPaymentCoverage?: never
      giftMessage?: {
        addGiftMessage?: boolean
        message?: string
      }
      billing?: {
        sameAsShipping?: boolean
        street?: string
        country?: string
        postalCode?: string
        city?: string
      }
    }
  }
}

// #region constants
// The goods subtotal (VAT included), shared with the order summary's own subtotal line. What a
// shopper actually has to pay, and therefore what the split-payment ledger and Klarna's
// installment copy must reconcile against, is this plus shipping: see `total` below.
const ORDER_TOTAL = 248.50;
const HOME_DELIVERY_FEE = 4.95;

// Starting values for the split-payment sources, per occurrence index: a second gift card gets a
// different code and amount than the first, so duplicate rows never look like clones. Every field
// stays editable afterwards, since typing a different amount is exactly what shows the ledger
// reflowing. Card and PayPal carry no amount of their own; they cover whatever is left above them.
const SPLIT_PAYMENT_SEEDS = {
  giftCardCode: ['GIFT-4821', 'GIFT-9057', 'GIFT-1366'],
  giftCardAmount: ['50.00', '20.00', '10.00'],
  voucherCode: ['WELCOME25', 'SUMMER10', 'LOYAL5'],
  voucherAmount: ['25.00', '10.00', '5.00'],
  cardNumber: ['4242 4242 4242 4242', '5555 4444 3333 1111'],
  payPalAccount: ['shopper@example.com', 'family@example.com'],
};
const SPLIT_PAYMENT_MAX_OCCURS = 6;

const SPLIT_PAYMENT_BRANCHES: SplitPaymentBranchShape[] = [
  { name: 'giftCard', coversRemainder: false },
  { name: 'voucher', coversRemainder: false },
  { name: 'card', coversRemainder: true },
  { name: 'payPal', coversRemainder: true },
];

const COUNTRY_OPTIONS = [
  { key: 'NL', value: 'Netherlands' },
  { key: 'DE', value: 'Germany' },
  { key: 'other', value: 'Other' },
];

const BANK_OPTIONS = [
  { key: 'ing', value: 'ING' },
  { key: 'rabobank', value: 'Rabobank' },
  { key: 'abnAmro', value: 'ABN AMRO' },
  { key: 'bunq', value: 'bunq' },
];

const PICKUP_POINT_OPTIONS = [
  { key: 'ah-nieuwmarkt', value: 'Albert Heijn, Nieuwmarkt 18' },
  { key: 'postnl-damrak', value: 'PostNL, Damrak 62' },
];

const KLARNA_MONTHS = [3, 6, 12] as const;

// Country switches the active pattern, so an address held at two mount points (delivery and
// billing) only needs one shared ruleset, not a copy per field.
interface PostalRule {
  pattern: RegExp
  placeholder: string
  message: string
}

const POSTAL_RULES: Record<'NL' | 'DE' | 'other', PostalRule> = {
  NL: { pattern: /^[1-9]\d{3} ?[A-Z]{2}$/, placeholder: '1234 AB', message: 'Enter a valid Dutch postal code (4 digits and 2 letters).' },
  DE: { pattern: /^\d{5}$/, placeholder: '10115', message: 'Enter a valid German postal code (5 digits).' },
  other: { pattern: /^[a-z0-9][a-z0-9 -]{2,10}$/i, placeholder: 'Any format', message: 'Enter a valid postal or ZIP code.' },
};

const GIFT_MESSAGE_MAX_LENGTH = 200;
// One fixed object, reused as-is rather than rebuilt per computedProps run, so the field's rule
// set only rebuilds when the toggle actually flips, not on every keystroke.
const GIFT_MESSAGE_RESTRICTION = { maxLength: GIFT_MESSAGE_MAX_LENGTH };

const MESSAGES = {
  required: '{field} is required',
  minOccurs: 'At least {min} items required',
  choiceMinOccurs: 'The following fields need to occur at least {min} time(s): {field}',
  minLength: 'The minimum length of {field} is {length}',
  maxLength: 'The maximum length of {field} is {length}',
  length: '{field} must be exactly {length} characters',
  pattern: '{field} does not match the required pattern',
  minInclusive: '{field} must be at least {min}',
  maxInclusive: '{field} must be at most {max}',
  minExclusive: '{field} must be greater than {min}',
  maxExclusive: '{field} must be less than {max}',
  enumeration: '{field} must be one of the allowed values',
  whiteSpace: '{field} contains invalid whitespace (mode: {mode})',
  fractionDigits: '{field} may have at most {digits} decimal place(s)',
  totalDigits: '{field} may have at most {digits} significant digit(s)',
};
// #endregion constants

const {
  values,
  meta,
  resetForm,
  validateField,
  handleSubmit,
} = useDynamicForm<CheckoutFormValues>({
  // Billing starts "same as shipping", per Baymard's reduction tactics: the address subtree
  // only reveals once the shopper explicitly asks for a different billing address.
  initialValues: {
    checkoutMethod: {
      manual: {
        billing: { sameAsShipping: true },
      },
    },
  },
});

const isSubmitting = ref(false);
const submitted = ref<CheckoutFormValues>();

// `explicitChoiceSelection` clears a deselected branch's key entirely, so the key's mere presence
// (not its value) is what marks a branch active. This also covers the empty `homeDelivery`
// branch, which never carries a value of its own.
const selectedShipping = computed<'homeDelivery' | 'pickup' | undefined>(() => {
  const shippingMethod = values.checkoutMethod?.manual?.shippingMethod;
  if (!shippingMethod)
    return undefined;
  if ('pickup' in shippingMethod)
    return 'pickup';
  if ('homeDelivery' in shippingMethod)
    return 'homeDelivery';
  return undefined;
});

const total = computed(() => ORDER_TOTAL + (selectedShipping.value === 'homeDelivery' ? HOME_DELIVERY_FEE : 0));

// Split payment is opt-in: while inactive, the order is covered by definition (the single
// payment choice below is doing the work instead), so the gate stands down entirely.
const splitPaymentActive = computed(() => values.checkoutMethod?.manual?.splitPaymentActive === true);

const splitPaymentRemainingToAssign = computed(() => {
  if (!splitPaymentActive.value)
    return 0;
  const occurrences = collectSplitPaymentOccurrences(values.checkoutMethod?.manual?.splitPayment, SPLIT_PAYMENT_BRANCHES);
  // Reconciles against what the shopper is actually paying (goods plus shipping), the same figure
  // the place-order button and the order summary show, not the shipping-blind goods subtotal.
  return computeSplitPaymentLedger(occurrences, total.value).remainingToAssign;
});

// The engine silently revalidates groups and choices whenever a field inside them changes, so
// the form-level aggregate stays fresh and can gate the place-order button on its own.
const canSubmit = computed(() => meta.value.valid);

// A computed, not a plain object: the ledger and its coverage messages reconcile against the
// shipping-inclusive total, which changes live with the shipping method.
const settings = computed<DynamicFormSettings>(() => ({
  orderTotal: total.value,
  messages: MESSAGES,
}));

const seededSplitPaymentPaths = new Set<string>();

// #region metadata
const metadata: Metadata[] = [
  {
    // #region express-manual-choice
    name: 'checkoutMethod',
    type: 'heading',
    fieldOptions: { label: 'How would you like to check out?' },
    description: 'Choose one. Express skips the form; manual reveals it.',
    explicitChoiceSelection: true,
    preserveOnSwitch: true,
    choice: [
      {
        name: 'express',
        type: 'heading',
        fieldOptions: { label: '⚡ Express checkout' },
        description: 'Pay with a saved wallet. In a real store this would redirect to your wallet to confirm; this demo stops here.',
        presenceValue: true,
      },
      // #endregion express-manual-choice
      // The "manual" branch holds the rest of the checkout: contact, address, shipping,
      // payment, split payment, gift message, and billing.
      {
        name: 'manual',
        fieldOptions: { label: 'Enter details manually' },
        description: 'Fill in contact, shipping and payment.',
        children: [
          {
            name: 'contact',
            type: 'heading',
            fieldOptions: { label: 'Contact' },
            description: 'We only use this to send your order confirmation.',
            children: [
              { name: 'fullName', fieldOptions: { label: 'Full name' }, placeholder: 'e.g. Anna de Vries', fullWidth: true },
              { name: 'email', type: 'email', fieldOptions: { label: 'Email' }, validation: emailValidation },
              { name: 'phone', type: 'tel', minOccurs: 0, fieldOptions: { label: 'Phone' }, placeholder: '+31 6 1234 5678' },
            ],
          },
          {
            name: 'deliveryAddress',
            type: 'heading',
            fieldOptions: { label: 'Delivery address' },
            children: createAddressFields(),
          },
          {
            name: 'business',
            type: 'heading',
            fieldOptions: { label: 'Business order' },
            // Optional as a whole: nothing inside is ever filled unless the toggle is switched
            // on, which would otherwise leave this group's own aggregate value empty and trip
            // its default required check.
            minOccurs: 0,
            children: [
              // #region business-vat-toggle
              { name: 'isBusiness', type: 'checkbox', minOccurs: 0, fullWidth: true, fieldOptions: { label: 'I am ordering as a business' } },
              {
                name: 'company',
                fieldOptions: { label: 'Company name' },
                computedProps: [(thisField) => {
                  const isBusiness = readPath(values, `${thisField.parent.path}.isBusiness`) === true;
                  thisField.hide = !isBusiness;
                  // The minOccurs flip rebuilds the field's rule set, and vee-validate
                  // revalidates a field whenever its rules change, so a stale required error
                  // clears on hide without any manual revalidation.
                  thisField.minOccurs = isBusiness ? 1 : 0;
                }],
              },
              {
                name: 'vatNumber',
                fieldOptions: { label: 'VAT number' },
                computedProps: [(thisField) => {
                  const isBusiness = readPath(values, `${thisField.parent.path}.isBusiness`) === true;
                  thisField.hide = !isBusiness;
                  thisField.minOccurs = isBusiness ? 1 : 0;
                  // Swapping between these two stable function references (rather than a fresh
                  // closure each run) changes the field's own rule set, which rebuilds and
                  // revalidates automatically, picking up the pattern check without a manual
                  // revalidation call.
                  thisField.validation = isBusiness ? vatValidation : noOpValidation;
                }],
              },
              // #endregion business-vat-toggle
            ],
          },
          // #region shipping-choice
          {
            name: 'shippingMethod',
            type: 'heading',
            fieldOptions: { label: 'Shipping method' },
            explicitChoiceSelection: true,
            choice: [
              {
                name: 'homeDelivery',
                type: 'heading',
                fieldOptions: { label: '🏠 Home delivery' },
                description: `1 to 3 business days, ${HOME_DELIVERY_FEE.toFixed(2)}`,
                presenceValue: true,
              },
              {
                name: 'pickup',
                type: 'select',
                fieldOptions: { label: 'Pickup point' },
                description: 'Collect nearby, free',
                options: PICKUP_POINT_OPTIONS,
                restriction: { enumeration: PICKUP_POINT_OPTIONS.map(option => option.key) },
              },
            ],
          },
          // #endregion shipping-choice
          {
            name: 'paymentMethod',
            type: 'heading',
            fieldOptions: { label: 'How would you like to pay?' },
            explicitChoiceSelection: true,
            // While split payment is active this choice is disabled and deselected, so the two
            // payment paths never compete: maxOccurs 0 is the engine's own disable switch (it
            // stands down the choice's validation and disables every field beneath it), and the
            // template deselects a disabled choice, which also clears a previously chosen
            // method out of the order values.
            computedProps: [(thisField) => {
              thisField.maxOccurs = splitPaymentActive.value ? 0 : 1;
            }],
            // #region payment-choice
            choice: [
              {
                name: 'card',
                fieldOptions: { label: '💳 Card' },
                inertPaymentDisclaimer: true,
                children: [
                  { name: 'cardNumber', fieldOptions: { label: 'Card number' }, placeholder: '1234 5678 9012 3456', fullWidth: true },
                  { name: 'expiry', fieldOptions: { label: 'Expiry' }, placeholder: 'MM / YY' },
                  { name: 'cvc', fieldOptions: { label: 'CVC' }, placeholder: '123' },
                ],
              },
              {
                name: 'ideal',
                fieldOptions: { label: 'iDEAL' },
                inertPaymentDisclaimer: true,
                children: [
                  { name: 'bank', type: 'select', fieldOptions: { label: 'Your bank' }, fullWidth: true, options: BANK_OPTIONS, restriction: { enumeration: BANK_OPTIONS.map(option => option.key) } },
                ],
              },
              {
                name: 'payPal',
                type: 'heading',
                fieldOptions: { label: 'PayPal' },
                presenceValue: true,
              },
              {
                name: 'klarna',
                fieldOptions: { label: 'Klarna' },
                children: [
                  {
                    name: 'installmentPlan',
                    type: 'select',
                    fieldOptions: { label: 'Installment plan' },
                    fullWidth: true,
                    options: klarnaOptionsFor(ORDER_TOTAL),
                    restriction: { enumeration: KLARNA_MONTHS.map(String) },
                    computedProps: [(thisField) => {
                      thisField.options = klarnaOptionsFor(total.value);
                    }],
                  },
                ],
              },
            ],
            // #endregion payment-choice
          },
          {
            name: 'splitPaymentActive',
            type: 'checkbox',
            minOccurs: 0,
            fullWidth: true,
            fieldOptions: { label: 'Split your payment across multiple methods' },
          },
          // #region split-payment-choice
          {
            name: 'splitPayment',
            type: 'splitPayment',
            fieldOptions: { label: 'Split payment' },
            description: 'Add sources in the order they should apply. Codes and amounts are editable; changing an amount redistributes the remainder live.',
            // Never required by occurrence count: coverage (below) is the real gate, since one
            // row (e.g. a single card) can fully cover the total on its own.
            minOccurs: 0,
            maxOccurs: SPLIT_PAYMENT_MAX_OCCURS,
            explicitChoiceSelection: true,
            displayOrder: 'added',
            preserveOrder: true,
            computedProps: [(thisField) => {
              thisField.hide = !splitPaymentActive.value;
            }],
            // Every branch repeats the container's own type: the occurrence slot family
            // (`splitPayment-choice-array-item`) is driven by each branch's own `type`, not the
            // container's, so this is what routes every row to the ledger row component below.
            // Row fields are seeded with a per-occurrence starting value but stay fully editable:
            // each occurrence registers its own field (`splitPayment.giftCard[0].amount`) with its
            // own validation, and editing a gift card's amount reflows the whole ledger live.
            choice: [
              {
                name: 'giftCard',
                type: 'splitPayment',
                fieldOptions: { label: '🎁 Gift card' },
                description: 'Fixed amount',
                children: [
                  { name: 'code', fieldOptions: { label: 'Code' }, validation: splitCodeValidation, computedProps: [(thisField, fieldValue) => setupSplitPaymentField(thisField, fieldValue, SPLIT_PAYMENT_SEEDS.giftCardCode)] },
                  { name: 'amount', fieldOptions: { label: 'Amount' }, placeholder: '25.00', validation: splitAmountValidation, computedProps: [(thisField, fieldValue) => setupSplitPaymentField(thisField, fieldValue, SPLIT_PAYMENT_SEEDS.giftCardAmount)] },
                ],
              },
              {
                name: 'voucher',
                type: 'splitPayment',
                fieldOptions: { label: '🏷️ Voucher' },
                description: 'Fixed amount',
                children: [
                  { name: 'code', fieldOptions: { label: 'Code' }, validation: splitCodeValidation, computedProps: [(thisField, fieldValue) => setupSplitPaymentField(thisField, fieldValue, SPLIT_PAYMENT_SEEDS.voucherCode)] },
                  { name: 'amount', fieldOptions: { label: 'Amount' }, placeholder: '25.00', validation: splitAmountValidation, computedProps: [(thisField, fieldValue) => setupSplitPaymentField(thisField, fieldValue, SPLIT_PAYMENT_SEEDS.voucherAmount)] },
                ],
              },
              {
                name: 'card',
                type: 'splitPayment',
                fieldOptions: { label: '💳 Card' },
                description: 'Covers the remainder',
                children: [
                  { name: 'cardNumber', fieldOptions: { label: 'Card number' }, fullWidth: true, placeholder: '1234 5678 9012 3456', validation: splitCardNumberValidation, computedProps: [(thisField, fieldValue) => setupSplitPaymentField(thisField, fieldValue, SPLIT_PAYMENT_SEEDS.cardNumber)] },
                ],
              },
              {
                name: 'payPal',
                type: 'splitPayment',
                fieldOptions: { label: 'PayPal' },
                description: 'Covers the remainder',
                children: [
                  { name: 'account', type: 'email', fieldOptions: { label: 'Account' }, fullWidth: true, placeholder: 'you@example.com', validation: splitAccountValidation, computedProps: [(thisField, fieldValue) => setupSplitPaymentField(thisField, fieldValue, SPLIT_PAYMENT_SEEDS.payPalAccount)] },
                ],
              },
            ],
          },
          // #endregion split-payment-choice
          {
            // Carries no value of its own: the only way it can fail is its own validation
            // closure below, which is also the sole visible source of the coverage banner.
            name: 'splitPaymentCoverage',
            type: 'splitPaymentCoverage',
            minOccurs: 0,
            validation: () => splitPaymentCoverageValidation(),
            computedProps: [(thisField) => {
              // Reads every nested value here, not just the top-level key, so this recomputes
              // whenever any occurrence is added or removed, or any amount or order changes
              // anywhere below, which is exactly when the coverage check needs to re-run.
              JSON.stringify(values.checkoutMethod?.manual?.splitPayment);
              void splitPaymentActive.value;
              validateField(thisField.path as Path<CheckoutFormValues>);
            }],
          },
          // #region gift-message-field
          {
            name: 'giftMessage',
            type: 'heading',
            fieldOptions: { label: 'Extras' },
            // Optional as a whole: left untouched whenever no gift message is added.
            minOccurs: 0,
            children: [
              { name: 'addGiftMessage', type: 'checkbox', minOccurs: 0, fullWidth: true, fieldOptions: { label: 'Add a gift message' } },
              {
                name: 'message',
                type: 'textareaWithCounter',
                minOccurs: 0,
                fullWidth: true,
                fieldOptions: { label: 'Gift message' },
                placeholder: 'Write a short note…',
                // The engine's own maxLength rule enforces the limit directly off this
                // restriction, which also doubles as what the counter below reads
                // (`fieldMetadata.restriction?.maxLength`) for its own "x / 200" display.
                // Swapping between this stable object and `undefined` rebuilds the field's rule
                // set, which revalidates automatically, clearing a stale over-length error the
                // moment the toggle switches off.
                computedProps: [(thisField) => {
                  const wantsGiftMessage = readPath(values, `${thisField.parent.path}.addGiftMessage`) === true;
                  thisField.hide = !wantsGiftMessage;
                  thisField.restriction = wantsGiftMessage ? GIFT_MESSAGE_RESTRICTION : undefined;
                }],
              },
            ],
          },
          // #endregion gift-message-field
          {
            name: 'billing',
            type: 'heading',
            fieldOptions: { label: 'Billing address' },
            // Defaults to "same as shipping" (seeded via initialValues below), but kept optional
            // as a whole for the same reason as business/giftMessage: its own group value must
            // never block submit on account of this node's default required check.
            minOccurs: 0,
            // #region billing-reuse
            children: [
              { name: 'sameAsShipping', type: 'checkbox', minOccurs: 0, fullWidth: true, fieldOptions: { label: 'Billing address is the same as shipping' } },
              ...createAddressFields(),
            ],
            // #endregion billing-reuse
          },
        ],
      },
    ],
  },
];
// #endregion metadata

const onSubmit = handleSubmit(() => submitOrder());

async function submitOrder() {
  // The button disables while submitting, but an Enter-key submit can still fire.
  if (isSubmitting.value)
    return;
  isSubmitting.value = true;
  await new Promise(resolve => setTimeout(resolve, 900));
  submitted.value = removeNullValues(values);
  isSubmitting.value = false;
}

function placeAnotherOrder() {
  resetForm();
  // The next order's split-payment rows should seed again like a fresh form.
  seededSplitPaymentPaths.clear();
  submitted.value = undefined;
}

// #region helpers

// The monthly figure is what the shopper actually pays per installment, so it must track the full
// total including shipping, not just the goods subtotal; recomputed live through computedProps
// as the shipping method changes.
function klarnaOptionsFor(payableTotal: number) {
  return KLARNA_MONTHS.map(months => ({
    key: String(months),
    value: `${months} months, ${(payableTotal / months).toFixed(2)} / month`,
  }));
}

function postalRuleKeyFor(country: string | undefined): keyof typeof POSTAL_RULES {
  return country === 'NL' || country === 'DE' ? country : 'other';
}

function postalRuleFor(country: string | undefined): PostalRule {
  return POSTAL_RULES[postalRuleKeyFor(country)];
}

// A function reference per country, so a computedProps swap of thisField.validation on country
// change always points at one of these fixed functions: the reference itself changes, which is
// what drives the field's own rule-set rebuild and the revalidation that follows, without a
// manual revalidation call.
const POSTAL_VALIDATIONS: Record<keyof typeof POSTAL_RULES, (value: unknown) => true | string> = {
  NL: value => !value || POSTAL_RULES.NL.pattern.test(String(value)) || POSTAL_RULES.NL.message,
  DE: value => !value || POSTAL_RULES.DE.pattern.test(String(value)) || POSTAL_RULES.DE.message,
  other: value => !value || POSTAL_RULES.other.pattern.test(String(value)) || POSTAL_RULES.other.message,
};

// Stands a rule down entirely without removing it: swapping to this shared reference (rather than
// `undefined`) still rebuilds the field's rule set on toggle, the same way swapping to an active
// rule does.
function noOpValidation(): true {
  return true;
}

function emailValidation(value: unknown): true | string {
  if (!value)
    return true;
  return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(String(value)) || 'Enter a valid email address.';
}

function vatValidation(value: unknown): true | string {
  if (!value)
    return true;
  return /^[A-Z]{2}[A-Z0-9]{8,12}$/.test(String(value)) || 'Enter a valid VAT number.';
}

// Reads a dot-path off a plain reactive object. Needed because the per-country postal rule and
// the billing reuse both derive a sibling's value from a relative path (`thisField.parent.path`)
// that is only known at render time, so it cannot be captured once with `useFieldValue`.
function readPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value == null || typeof value !== 'object')
      return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

// Shared setup for every split-payment row field, run from its computedProps. Seeds the field the
// first time its occurrence is added, picking the seed by the occurrence's own index (read from
// its path) so a second gift card starts with a different code and amount than the first. The
// seen-paths set makes seeding once-per-path: without it, a shopper clearing the field would see
// the seed instantly snap back. The field is also only required while split payment is the active
// path, mirroring the toggle-revealed fields above, so a hidden, half-edited row never blocks
// submit; the minOccurs flip rebuilds each row's rule set, which makes vee-validate re-run the
// row's format rules too, so they pick up the toggle without any manual revalidation.
function setupSplitPaymentField(thisField: { path?: string, minOccurs?: number }, fieldValue: { value: unknown }, seeds: readonly string[]): void {
  thisField.minOccurs = splitPaymentActive.value ? 1 : 0;
  const path = thisField.path ?? '';
  if (fieldValue.value == null && !seededSplitPaymentPaths.has(path)) {
    const match = /\[(\d+)\]/.exec(path);
    const index = match ? Number(match[1]) : 0;
    fieldValue.value = seeds[index % seeds.length];
  }
  seededSplitPaymentPaths.add(path);
}

// The split-payment row format rules: active only while split payment is the active path,
// standing down entirely once the toggle is off. Each rule reads the live toggle from its
// closure so the rule reference itself never changes; required is not handled here but by the
// engine's own minOccurs check, gated in setupSplitPaymentField above.
function splitAmountValidation(value: unknown): true | string {
  if (!splitPaymentActive.value || !value)
    return true;
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text))
    return 'Enter an amount like 25.00 (digits, up to 2 decimals).';
  if (Number.parseFloat(text) <= 0)
    return 'Enter an amount greater than zero.';
  return true;
}

function splitCodeValidation(value: unknown): true | string {
  if (!splitPaymentActive.value || !value)
    return true;
  return /^[A-Z0-9][A-Z0-9-]{3,19}$/i.test(String(value).trim()) || 'Enter a valid code (letters, digits and dashes).';
}

function splitCardNumberValidation(value: unknown): true | string {
  if (!splitPaymentActive.value || !value)
    return true;
  return /^\d{13,19}$/.test(String(value).replace(/[\s-]/g, '')) || 'Enter a valid card number (13 to 19 digits).';
}

function splitAccountValidation(value: unknown): true | string {
  if (!splitPaymentActive.value)
    return true;
  return emailValidation(value);
}

// The hidden coverage field's own validation message: the one visible error source naming the
// exact shortfall or overshoot, independent of whether the live readout above has already
// re-rendered with the same numbers.
function splitPaymentCoverageValidation(): true | string {
  const remaining = splitPaymentRemainingToAssign.value;
  if (remaining === 0)
    return true;
  if (remaining > 0)
    return `Your payment sources must cover the full order total of ${total.value.toFixed(2)}. Add ${remaining.toFixed(2)} more before placing the order.`;
  return `Your payment sources exceed the order total of ${total.value.toFixed(2)} by ${Math.abs(remaining).toFixed(2)}. Reorder or remove a source before placing the order.`;
}

// Shared by the delivery and billing address fragments: a field in the reused subtree reads its
// own sibling `sameAsShipping` flag through a relative path, which only resolves at the billing
// mount point. At delivery, the sibling simply does not exist, so the field stays visible and
// required there by default.
//
// The minOccurs flips below need no manual revalidation: flipping minOccurs rebuilds the field's
// rule set, and vee-validate re-validates a field whenever its rules change, so a stale required
// error clears on hide by itself (and a freshly revealed pristine field only gets a silent
// validity check, never a visible error).
function createAddressFields(): Metadata[] {
  return [
    {
      name: 'street',
      fieldOptions: { label: 'Street and number' },
      placeholder: 'e.g. Keizersgracht 123',
      fullWidth: true,
      computedProps: [(thisField) => {
        const isActive = readPath(values, `${thisField.parent.path}.sameAsShipping`) !== true;
        thisField.hide = !isActive;
        thisField.minOccurs = isActive ? 1 : 0;
      }],
    },
    {
      name: 'country',
      type: 'select',
      fieldOptions: { label: 'Country' },
      options: COUNTRY_OPTIONS,
      restriction: { enumeration: COUNTRY_OPTIONS.map(option => option.key) },
      computedProps: [(thisField) => {
        const isActive = readPath(values, `${thisField.parent.path}.sameAsShipping`) !== true;
        thisField.hide = !isActive;
        thisField.minOccurs = isActive ? 1 : 0;
      }],
    },
    // #region per-country-postal
    {
      name: 'postalCode',
      fieldOptions: { label: 'Postal code' },
      computedProps: [(thisField) => {
        const isActive = readPath(values, `${thisField.parent.path}.sameAsShipping`) !== true;
        thisField.hide = !isActive;
        thisField.minOccurs = isActive ? 1 : 0;

        const country = readPath(values, `${thisField.parent.path}.country`) as string | undefined;
        thisField.placeholder = postalRuleFor(country).placeholder;
        // Swapping to the other country's fixed function reference on country change rebuilds
        // the field's rule set, which revalidates the already-entered value against the new
        // pattern immediately.
        thisField.validation = isActive ? POSTAL_VALIDATIONS[postalRuleKeyFor(country)] : noOpValidation;
      }],
    },
    // #endregion per-country-postal
    {
      name: 'city',
      fieldOptions: { label: 'City' },
      computedProps: [(thisField) => {
        const isActive = readPath(values, `${thisField.parent.path}.sameAsShipping`) !== true;
        thisField.hide = !isActive;
        thisField.minOccurs = isActive ? 1 : 0;
      }],
    },
  ];
}

// #endregion helpers
</script>

<template>
  <div class="form-demo checkout-layout">
    <form class="flex flex-col gap-6" @submit="onSubmit">
      <DynamicForm :template="CheckoutFormTemplate" :metadata :settings />

      <div v-if="!submitted" class="flex flex-col gap-3">
        <button
          type="submit"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors cursor-pointer hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!canSubmit || isSubmitting"
          data-testid="place-order-button"
        >
          <span v-if="isSubmitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {{ isSubmitting ? 'Placing order…' : `Place order, ${total.toFixed(2)}` }}
        </button>
      </div>

      <div
        v-else
        class="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-4 text-sm text-emerald-900 dark:text-emerald-200"
        data-testid="order-success-banner"
      >
        <span>✅</span>
        <span>
          <strong>Order placed.</strong>
          A confirmation is on its way to {{ submitted?.checkoutMethod?.manual?.contact?.email }}.
          (Demo only: nothing was charged.)
          <button type="button" class="ml-2 underline cursor-pointer hover:no-underline" @click="placeAnotherOrder">
            Place another order
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

    <OrderSummary
      class="cart-rail"
      :subtotal="ORDER_TOTAL"
      :homeDeliveryFee="HOME_DELIVERY_FEE"
      :shippingMethod="selectedShipping"
    />
  </div>
</template>

<style scoped>
.checkout-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;
}

.cart-rail {
  position: sticky;
  top: 24px;
}

@media (max-width: 1279px) {
  .checkout-layout {
    grid-template-columns: 1fr;
  }

  .cart-rail {
    position: static;
    order: -1;
  }
}
</style>
