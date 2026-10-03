import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { flushPromises } from '@vue/test-utils';
import * as elementPlus from 'element-plus';
import { describe, expect, it } from 'vitest';
import { camelize } from 'vue';
import { boundContract } from './fixtures/boundContract';
import { expectNoWarnings } from './fixtures/expectNoWarnings';
import { mountInForm } from './fixtures/mountInForm';

const options = [{ label: 'One', value: 1 }];

const extraMetadata: Record<string, Record<string, unknown>> = {
  select: { options },
  radio: { options },
  cascader: { options: [] },
  transfer: { transfer: { data: [] } },
};

function declaredNames(component: any) {
  const props = Array.isArray(component.props) ? component.props : Object.keys(component.props ?? {});
  const emits = Array.isArray(component.emits) ? component.emits : Object.keys(component.emits ?? {});
  return { props: props.map(camelize), emits: emits.map(camelize) };
}

function isDeclared(key: string, component: any) {
  const { props, emits } = declaredNames(component);
  if (props.includes(key))
    return true;
  const event = key.match(/^on([A-Z].*)$/)?.[1];
  return !!event && emits.includes(camelize(event[0].toLowerCase() + event.slice(1)));
}

async function boundKeys(type: string, componentName: string) {
  const { wrapper } = await mountInForm({
    metadata: { name: 'f', type, label: 'Field', minOccurs: 0, ...extraMetadata[type] },
  });
  if (componentName === 'ElOption') {
    await wrapper.find('.el-select__wrapper').trigger('click');
    await flushPromises();
  }
  const component = (elementPlus as any)[componentName];
  const found = wrapper.findComponent(component);
  expect(found.exists()).toBe(true);
  return Object.keys(found.vm.$.vnode.props ?? {}).map(camelize).filter(key => key !== 'key');
}

describe('component ElementPlusFormTemplate - bound control contract', () => {
  expectNoWarnings();

  describe.each(Object.entries(boundContract))('%s', (type, contracts) => {
    it.each(contracts.map(contract => [contract.component, contract] as const))('binds only the listed props and events of %s', async (_name, contract) => {
      const keys = await boundKeys(type, contract.component);

      expect([...keys].sort()).toEqual([...contract.bound].sort());
    });

    it.each(contracts.map(contract => [contract.component, contract] as const))('lists only props and events that %s declares', (_name, contract) => {
      const component = (elementPlus as any)[contract.component];

      for (const key of contract.bound)
        expect(isDeclared(key, component), `${contract.component} declares ${key}`).toBe(true);
    });
  });

  it('binds the radio option through label and not value', async () => {
    const keys = await boundKeys('radio', 'ElRadio');

    expect(keys).toContain('label');
    expect(keys).not.toContain('value');
  });

  it('binds neither transfer target keys nor an upload model value, which those components do not declare', async () => {
    expect(isDeclared('disabled', elementPlus.ElTransfer)).toBe(false);
    expect(isDeclared('targetKeys', elementPlus.ElTransfer)).toBe(false);
    expect(await boundKeys('transfer', 'ElTransfer')).not.toContain('targetKeys');
    expect(isDeclared('modelValue', elementPlus.ElUpload)).toBe(false);
    expect(await boundKeys('upload', 'ElUpload')).not.toContain('modelValue');
  });
});

describe('package peer range', () => {
  const packageRoot = resolve(__dirname, '../..');
  const workspaceRoot = resolve(packageRoot, '../..');

  it('resolves the element-plus peer dependency through the framework catalog', () => {
    const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));

    expect(manifest.peerDependencies['element-plus']).toBe('catalog:framework');
  });

  it('keeps the framework catalog entry for element-plus at the supported floor', () => {
    const workspace = readFileSync(resolve(workspaceRoot, 'pnpm-workspace.yaml'), 'utf8');
    const framework = workspace.match(/^ {2}framework:\n((?: {4}.*\n)+)/m)?.[1] ?? '';

    expect(framework).toMatch(/^ {4}element-plus: '>=2\.0\.0'$/m);
  });
});
