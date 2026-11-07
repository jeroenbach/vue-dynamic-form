// DOM-only focus helpers. Each function takes the element(s) it needs as an
// argument and keeps no state of its own, so callers can use them freely
// without worrying about leftover state from an earlier call.

const FOCUSABLE_SELECTOR = 'button, input, select, textarea, a[href], [tabindex]';

/**
 * Focuses a non-interactive container (e.g. a page wrapper) without adding it
 * to the tab order permanently. `tabindex="-1"` is applied only long enough to
 * call `.focus()`, then removed the moment the element next loses focus, so
 * the markup carries no trace of it once the user tabs away.
 */
export function focusWithTemporaryTabindex(el: HTMLElement): void {
  el.setAttribute('tabindex', '-1');
  el.focus();
  el.addEventListener('blur', () => el.removeAttribute('tabindex'), { once: true });
}

function isDisabled(el: HTMLElement): boolean {
  return 'disabled' in el && (el as HTMLButtonElement | HTMLInputElement).disabled;
}

function hasNegativeTabindex(el: HTMLElement): boolean {
  const value = el.getAttribute('tabindex');
  return value !== null && Number(value) < 0;
}

function isFocusable(el: HTMLElement): boolean {
  return el.matches(FOCUSABLE_SELECTOR) && !isDisabled(el) && !hasNegativeTabindex(el);
}

// `display: none` (what v-show writes) makes an element unfocusable, but querySelector still
// returns it, so a hidden wizard page's field can otherwise shadow a later visible one.
// checkVisibility() is the direct way to ask this, but it is not implemented in every test
// environment, so this falls back to walking the ancestor chain for an inline/computed
// `display: none`, which is what v-show actually sets.
function isVisible(el: HTMLElement): boolean {
  if (typeof el.checkVisibility === 'function')
    return el.checkVisibility();

  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (getComputedStyle(node).display === 'none')
      return false;
  }
  return true;
}

/** First focusable, enabled descendant of `container`, or `undefined` if there is none. */
export function firstFocusableWithin(container: HTMLElement | null | undefined): HTMLElement | undefined {
  if (!container)
    return undefined;

  for (const candidate of container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) {
    if (!isDisabled(candidate) && !hasNegativeTabindex(candidate))
      return candidate;
  }
  return undefined;
}

/**
 * First visible descendant of `container` marked `aria-invalid="true"`, or `undefined` if there
 * is none. Excludes `<button>`: it never carries a field value, so an `aria-invalid` on one (the
 * wizard stepper uses it to flag a step with errors) is a status indicator, not an invalid field
 * itself. The matched element itself is not guaranteed to be focusable (e.g. a `radiogroup`
 * wrapper carries `aria-invalid`, not any of its cards), so callers that want to move focus
 * should use `focusFirstInvalid` rather than focusing this result directly.
 */
export function firstInvalidWithin(container: HTMLElement | null | undefined): HTMLElement | undefined {
  if (!container)
    return undefined;

  for (const candidate of container.querySelectorAll<HTMLElement>('[aria-invalid="true"]:not(button)')) {
    if (isVisible(candidate))
      return candidate;
  }
  return undefined;
}

/**
 * Moves focus to the first invalid field inside `containerEl`. Intended for a
 * consumer's own `onInvalidSubmit` handler, so a failed submit takes the user
 * straight to what needs fixing. A no-op when there is nothing invalid inside,
 * or when `containerEl` is missing.
 *
 * The matched element is focused directly when it is itself focusable; otherwise (e.g. a
 * `radiogroup` section whose `aria-invalid` lives on the group, not on any one card) the nearest
 * focusable descendant is focused instead, so the user still lands inside the invalid section.
 */
export function focusFirstInvalid(containerEl: HTMLElement | null | undefined): void {
  const invalid = firstInvalidWithin(containerEl);
  if (!invalid)
    return;
  (isFocusable(invalid) ? invalid : firstFocusableWithin(invalid))?.focus();
}
