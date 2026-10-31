<script lang="ts" setup>
import { computed } from 'vue';

export interface CartItem {
  label: string
  quantity: number
  amount: number
}

export interface Props {
  /** The goods subtotal, VAT included. Owned by the host so it stays the one source of truth shared with payment copy. */
  subtotal: number
  /** Home delivery's flat fee. Pickup is always free, so it never needs its own prop. */
  homeDeliveryFee: number
  /** Undefined until a shipping method is chosen; the cart shows a placeholder and excludes shipping from the total in that state. */
  shippingMethod?: 'homeDelivery' | 'pickup'
}

const { subtotal, homeDeliveryFee, shippingMethod } = defineProps<Props>();

const VAT_INCLUDED = 43.13;

const items: CartItem[] = [
  { label: 'Ergonomic desk chair', quantity: 1, amount: 199.00 },
  { label: 'Felt desk mat', quantity: 1, amount: 49.50 },
];

const shippingLabel = computed(() => {
  if (shippingMethod === 'pickup')
    return 'Shipping (pickup)';
  if (shippingMethod === 'homeDelivery')
    return 'Shipping (home delivery)';
  return 'Select a shipping method';
});

const shippingAmount = computed(() => {
  if (shippingMethod === 'pickup')
    return 0;
  if (shippingMethod === 'homeDelivery')
    return homeDeliveryFee;
  return undefined;
});

const total = computed(() => subtotal + (shippingAmount.value ?? 0));

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}
</script>

<template>
  <aside class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm" data-testid="order-summary">
    <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
      Order summary
    </h3>
    <ul class="mt-4 flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
      <li v-for="item in items" :key="item.label" class="flex justify-between">
        <span><span class="text-slate-500 dark:text-slate-400">{{ item.quantity }} &times;</span> {{ item.label }}</span>
        <span>{{ formatAmount(item.amount) }}</span>
      </li>
    </ul>
    <div class="mt-4 flex flex-col gap-2 border-t border-slate-200 dark:border-slate-700 pt-4 text-sm">
      <div class="flex justify-between text-slate-700 dark:text-slate-300">
        <span>Subtotal</span>
        <span>{{ formatAmount(subtotal) }}</span>
      </div>
      <div class="flex justify-between" :class="shippingAmount === undefined ? 'text-slate-400 dark:text-slate-500 italic' : 'text-slate-700 dark:text-slate-300'" data-testid="order-summary-shipping">
        <span>{{ shippingLabel }}</span>
        <span>{{ shippingAmount === undefined ? '' : formatAmount(shippingAmount) }}</span>
      </div>
      <div class="flex justify-between text-slate-700 dark:text-slate-300">
        <span>VAT included in subtotal</span>
        <span>{{ formatAmount(VAT_INCLUDED) }}</span>
      </div>
      <div class="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-base font-semibold text-slate-900 dark:text-slate-100" data-testid="order-summary-total">
        <span>Total</span>
        <span>{{ formatAmount(total) }}</span>
      </div>
    </div>
  </aside>
</template>
