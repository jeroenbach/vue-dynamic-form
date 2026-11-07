import { describe, expect, it } from 'vitest';
import { firstFocusableWithin, firstInvalidWithin, focusFirstInvalid, focusWithTemporaryTabindex } from '@/focus';

function elementFromHtml(html: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.append(wrapper);
  return wrapper;
}

describe('focusWithTemporaryTabindex', () => {
  it('adds tabindex="-1", focuses the element, and removes the attribute on its next blur', () => {
    const container = elementFromHtml('<div><span>not focusable</span></div>');
    const target = container.querySelector('span') as HTMLElement;

    focusWithTemporaryTabindex(target);

    expect(target.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(target);

    target.dispatchEvent(new Event('blur'));
    expect(target.hasAttribute('tabindex')).toBe(false);
  });

  it('does not remove the attribute before a blur happens', () => {
    const container = elementFromHtml('<div><span>not focusable</span></div>');
    const target = container.querySelector('span') as HTMLElement;

    focusWithTemporaryTabindex(target);

    expect(target.hasAttribute('tabindex')).toBe(true);
  });
});

describe('firstFocusableWithin', () => {
  it('returns the first focusable descendant', () => {
    const container = elementFromHtml('<div><span>text</span><button>Go</button><input /></div>');

    expect(firstFocusableWithin(container)).toBe(container.querySelector('button'));
  });

  it('skips disabled candidates', () => {
    const container = elementFromHtml('<div><button disabled>Disabled</button><input /></div>');

    expect(firstFocusableWithin(container)).toBe(container.querySelector('input'));
  });

  it('skips a negative tabindex before an otherwise-focusable element', () => {
    const container = elementFromHtml('<div><a href="#" tabindex="-1">Skip</a><button>Go</button></div>');

    expect(firstFocusableWithin(container)).toBe(container.querySelector('button'));
  });

  it('finds an element made focusable only through a non-negative tabindex', () => {
    const container = elementFromHtml('<div><div tabindex="0">Target</div></div>');

    expect(firstFocusableWithin(container)).toBe(container.querySelector('div[tabindex]'));
  });

  it('returns undefined for a container with nothing focusable', () => {
    const container = elementFromHtml('<div><span>text</span></div>');

    expect(firstFocusableWithin(container)).toBeUndefined();
  });

  it('returns undefined for a null or missing container, without throwing', () => {
    expect(firstFocusableWithin(null)).toBeUndefined();
    expect(firstFocusableWithin(undefined)).toBeUndefined();
  });
});

describe('firstInvalidWithin', () => {
  it('returns the first element marked aria-invalid="true"', () => {
    const container = elementFromHtml('<div><input /><input aria-invalid="true" /><input aria-invalid="true" /></div>');

    expect(firstInvalidWithin(container)).toBe(container.querySelectorAll('input')[1]);
  });

  it('does not match aria-invalid="false"', () => {
    const container = elementFromHtml('<div><input aria-invalid="false" /></div>');

    expect(firstInvalidWithin(container)).toBeUndefined();
  });

  it('returns undefined for a container with nothing invalid', () => {
    const container = elementFromHtml('<div><input /></div>');

    expect(firstInvalidWithin(container)).toBeUndefined();
  });

  it('skips a button marked aria-invalid, such as a wizard step with errors, in favor of an actual invalid field', () => {
    const container = elementFromHtml('<div><button aria-invalid="true">Step 1</button><input aria-invalid="true" /></div>');

    expect(firstInvalidWithin(container)).toBe(container.querySelector('input'));
  });

  it('returns undefined for a null or missing container, without throwing', () => {
    expect(firstInvalidWithin(null)).toBeUndefined();
    expect(firstInvalidWithin(undefined)).toBeUndefined();
  });

  it('skips a candidate hidden by an ancestor\'s display: none, matching a later visible one instead', () => {
    const container = elementFromHtml(`
      <div>
        <div style="display:none"><input aria-invalid="true" id="hidden" /></div>
        <input aria-invalid="true" id="visible" />
      </div>
    `);

    expect(firstInvalidWithin(container)).toBe(container.querySelector('#visible'));
  });

  it('returns undefined when every invalid candidate is hidden', () => {
    const container = elementFromHtml(`
      <div style="display:none"><input aria-invalid="true" /></div>
    `);

    expect(firstInvalidWithin(container)).toBeUndefined();
  });
});

describe('focusFirstInvalid', () => {
  it('focuses the matched element directly when it is itself focusable', () => {
    const container = elementFromHtml('<div><input aria-invalid="true" /></div>');

    focusFirstInvalid(container);

    expect(document.activeElement).toBe(container.querySelector('input'));
  });

  it('focuses the nearest focusable descendant when the matched invalid element is not itself focusable, such as a radiogroup wrapper', () => {
    const container = elementFromHtml(`
      <div>
        <div role="radiogroup" aria-invalid="true">
          <button tabindex="-1">Card A</button>
          <button tabindex="0">Card B</button>
        </div>
      </div>
    `);

    focusFirstInvalid(container);

    expect(document.activeElement).toBe(container.querySelectorAll('button')[1]);
  });

  it('is a no-op when the matched invalid element has no focusable descendant', () => {
    const container = elementFromHtml('<div role="radiogroup" aria-invalid="true"><span>no cards</span></div>');
    const activeBefore = document.activeElement;

    focusFirstInvalid(container);

    expect(document.activeElement).toBe(activeBefore);
  });

  it('is a no-op when the container has nothing invalid, or is missing', () => {
    const activeBefore = document.activeElement;

    expect(() => focusFirstInvalid(elementFromHtml('<div><input /></div>'))).not.toThrow();
    expect(() => focusFirstInvalid(null)).not.toThrow();
    expect(document.activeElement).toBe(activeBefore);
  });
});

describe('no shared state between calls', () => {
  it('two independently constructed containers do not affect each other', () => {
    const containerA = elementFromHtml('<div><input aria-invalid="true" /></div>');
    const containerB = elementFromHtml('<div><input /></div>');

    expect(firstInvalidWithin(containerA)).toBe(containerA.querySelector('input'));
    expect(firstInvalidWithin(containerB)).toBeUndefined();

    const targetA = containerA.querySelector('input') as HTMLElement;
    const targetB = containerB.querySelector('input') as HTMLElement;
    focusWithTemporaryTabindex(targetA);
    expect(targetB.hasAttribute('tabindex')).toBe(false);
  });
});
