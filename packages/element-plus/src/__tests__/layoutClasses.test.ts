import type { VueWrapper } from '@vue/test-utils';
import { ElDivider, ElFormItem, ElSwitch } from 'element-plus';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { mountInForm } from './fixtures/mountInForm';

const prefix = 'epft-';
const rowClass = `${prefix}switch-row`;
const blockClass = `${prefix}heading`;
const titleClass = `${prefix}heading-title`;

const switchWithLabel = { name: 'notify', type: 'switch', label: 'Notify me' };
const switchWithoutLabel = { name: 'notify', type: 'switch' };
const headingWithChildren = {
  name: 'person',
  type: 'heading',
  label: 'Person',
  children: [
    { name: 'first', type: 'text', label: 'First' },
    { name: 'last', type: 'text', label: 'Last' },
  ],
};

function scopeIdOf(element: Element) {
  return element.getAttributeNames().find(name => name.startsWith('data-v-'));
}

function classTokensIn(wrapper: VueWrapper<any>) {
  const elements = [wrapper.element as Element, ...wrapper.element.querySelectorAll('*')];
  return elements.flatMap(element => [...element.classList]);
}

describe('switch layout', () => {
  it('lays out the label and the control in one row, label first', async () => {
    const { wrapper } = await mountInForm({ metadata: switchWithLabel });

    const row = wrapper.find(`.${rowClass}`);
    expect(row.exists()).toBe(true);
    expect(row.element.querySelector(':scope > span')!.textContent).toBe('Notify me');
    expect(row.find('.el-switch').exists()).toBe(true);
    expect(row.html().indexOf('Notify me')).toBeLessThan(row.html().indexOf('el-switch'));
  });

  it('renders only the control in the row when there is no label', async () => {
    const { wrapper } = await mountInForm({ metadata: switchWithoutLabel });

    const row = wrapper.find(`.${rowClass}`);
    expect(row.exists()).toBe(true);
    expect(row.element.querySelector(':scope > span')).toBeNull();
    expect(row.findComponent(ElSwitch).exists()).toBe(true);
  });

  it('keeps the same row when the switch is disabled', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...switchWithLabel, disabled: true } });

    const row = wrapper.find(`.${rowClass}`);
    expect(row.find('.el-switch').classes()).toContain('is-disabled');
    expect(row.element.querySelector(':scope > span')!.textContent).toBe('Notify me');
  });
});

describe('heading layout', () => {
  it('renders the title inside the heading block, followed by the children', async () => {
    const { wrapper } = await mountInForm({ metadata: headingWithChildren });

    const block = wrapper.find(`.${blockClass}`);
    const title = block.find(`.${titleClass}`);
    expect(title.element.tagName).toBe('H3');
    expect(title.text()).toBe('Person');
    expect(block.findAll('input')).toHaveLength(2);
    expect(block.element.firstElementChild).toBe(title.element);
  });

  it('keeps rendering the title element when the heading has no label', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...headingWithChildren, label: undefined } });

    const title = wrapper.find(`.${titleClass}`);
    expect(title.exists()).toBe(true);
    expect(title.text()).toBe('');
    expect(wrapper.find(`.${blockClass}`).findAll('input')).toHaveLength(2);
  });
});

describe('divider', () => {
  it('keeps the Element Plus divider with its label', async () => {
    const { wrapper } = await mountInForm({ metadata: { name: 'part', type: 'divider', label: 'Part two' } });

    expect(wrapper.findComponent(ElDivider).text()).toBe('Part two');
  });
});

describe('form item chrome', () => {
  it('keeps wrapping plain inputs in a form item', async () => {
    const { wrapper } = await mountInForm({ metadata: { name: 'text', type: 'text', label: 'First name' } });

    expect(wrapper.findComponent(ElFormItem).exists()).toBe(true);
  });
});

describe('scoped styles', () => {
  it('marks fallback markup with the package scope id', async () => {
    const { wrapper } = await mountInForm({ metadata: [switchWithLabel, headingWithChildren] });

    for (const selector of [`.${rowClass}`, `.${blockClass}`, `.${titleClass}`])
      expect(scopeIdOf(wrapper.find(selector).element)).toBeDefined();
  });

  it('does not scope consumer-supplied slot content', async () => {
    const fallback = await mountInForm({ metadata: switchWithLabel });
    const scopeId = scopeIdOf(fallback.wrapper.find(`.${rowClass}`).element)!;

    const { wrapper } = await mountInForm({
      metadata: switchWithLabel,
      template: createConsumerWrapper({
        overrides: { switch: (scope, slots) => h('section', { 'data-testid': 'custom' }, slots.default?.(scope)) },
      }),
    });

    const custom = wrapper.find('[data-testid="custom"]');
    expect(custom.exists()).toBe(true);
    expect(custom.attributes(scopeId)).toBeUndefined();
    expect(wrapper.find(`.${rowClass}`).exists()).toBe(false);
  });
});

describe('class hygiene', () => {
  const elementPlusStates = /^(?:is-|asterisk-)/;

  it('renders only Element Plus and package prefixed classes for the switch and heading', async () => {
    const { wrapper } = await mountInForm({ metadata: [switchWithLabel, headingWithChildren] });

    const foreign = classTokensIn(wrapper).filter(token => !token.startsWith('el-') && !token.startsWith(prefix) && !elementPlusStates.test(token));
    expect(foreign).toEqual([]);
  });
});
