import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import TestForm from '@/examples/TestForm.vue';
import { setupState } from './DynamicFormItem.test-helpers';
import { setupState as setupChoiceState } from './DynamicFormItemChoice.test-helpers';

// These tests exercise the full vee-validate form API (resetForm, resetField, setFieldValue,
// setValues, validate, validateField, setFieldError, setErrors, submitCount, meta) against a
// choice field. DynamicFormItemChoice does not guard its own value watcher the way
// DynamicFormItem/DynamicFormItemArray do: it anchors validation at the nearest ancestor path and
// relies on vee-validate's own built-in asymmetry (only surface new error text once a field has
// been validated) instead of the library's own suppression. The point here is to prove the form
// API still behaves correctly for that shape, with no stale errors resurrected after a reset.
//
// The form context is read off the choice component's own `formContext` (a plain `useFormContext()`
// local variable), rather than through TestForm's own exposed subset, since TestForm only
// destructures a handful of the form's methods. `formContext` is the exact same shared object
// vee-validate provides everywhere in the tree, patched in place by useDynamicForm, so driving it
// here is equivalent to driving it through any other injected handle.

describe('component DynamicFormItemChoice form API', () => {
  function mountSimpleChoice() {
    return mount(TestForm, {
      attachTo: document.body,
      props: {
        metadata: [{
          name: 'pick',
          fieldOptions: { label: 'Pick One' },
          choice: [
            { name: 'opt1', fieldOptions: { label: 'Option 1' } },
            { name: 'opt2', fieldOptions: { label: 'Option 2' } },
          ],
        }],
        settings: { messages: { choiceMinOccurs: 'Pick at least {min} in {field}' } },
      },
    });
  }

  function mountChoiceWithOwnRestriction() {
    return mount(TestForm, {
      attachTo: document.body,
      props: {
        metadata: [{
          name: 'pick',
          fieldOptions: { label: 'Pick One' },
          choice: [
            { name: 'opt1', fieldOptions: { label: 'Option 1' }, restriction: { minLength: 5 } },
            { name: 'opt2', fieldOptions: { label: 'Option 2' } },
          ],
        }],
        settings: { messages: { minLength: 'Min length is {length}' } },
      },
    });
  }

  function mountExplicitChoice() {
    return mount(TestForm, {
      attachTo: document.body,
      props: {
        metadata: [{
          name: 'pick',
          explicitChoiceSelection: true,
          fieldOptions: { label: 'Pick One' },
          choice: [
            { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
            { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
          ],
        }],
        settings: { messages: { choiceMinOccurs: 'Choice required' } },
      },
    });
  }

  function mountRepeatableChoice() {
    return mount(TestForm, {
      attachTo: document.body,
      props: {
        metadata: [{
          name: 'pick',
          explicitChoiceSelection: true,
          maxOccurs: 3,
          fieldOptions: { label: 'Pick Several' },
          choice: [
            {
              name: 'apiEndpoint',
              maxOccurs: 2,
              fieldOptions: { label: 'Api Endpoint' },
              children: [{ name: 'url', fieldOptions: { label: 'Url' }, restriction: { minLength: 5 } }],
            },
            { name: 'crmExport', maxOccurs: 2, fieldOptions: { label: 'Crm Export' } },
          ],
        }],
        settings: { messages: { choiceMinOccurs: 'Pick at least {min} in {field}', minLength: 'Min length is {length}' } },
      },
    });
  }

  function formContextOf(wrapper: ReturnType<typeof mount>, path = 'pick') {
    return setupChoiceState(wrapper, path)!.formContext;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // setFieldValue on a branch path
  // ─────────────────────────────────────────────────────────────────────────
  describe('setFieldValue on a branch path', () => {
    it('selects the branch and clears a prior choiceMinOccurs error raised by a failed submit', async () => {
      const wrapper = mountSimpleChoice();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);

      const formContext = formContextOf(wrapper);
      formContext.setFieldValue('pick.opt1', 'hello');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
      expect((wrapper.find('[id="pick.opt1"]').element as HTMLInputElement).value).toBe('hello');
    });

    it('with shouldValidate false leaves an untouched choice silently updated, without surfacing error text', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      formContext.setFieldValue('pick.opt1', 'temporary', false);
      await flushPromises();
      formContext.setFieldValue('pick.opt1', '', false);
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
      expect(formContext.meta.value.valid).toBe(false);
    });

    it('with shouldValidate false on a branch does not surface the branch\'s own error, but a real edit afterward does', async () => {
      const wrapper = mountChoiceWithOwnRestriction();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      formContext.setFieldValue('pick.opt1', 'hi', false);
      await flushPromises();
      expect((wrapper.find('[id="pick.opt1"]').element as HTMLInputElement).value).toBe('hi');
      expect(wrapper.find('[data-testid="pick.opt1-error-message"]').exists()).toBe(false);

      // A genuinely different value, so the input actually changes and the branch's own
      // watcher runs (an identical value would be a no-op ref assignment, triggering nothing).
      await wrapper.find('[id="pick.opt1"]').setValue('ab');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick.opt1-error-message"]').exists()).toBe(true);
    });

    it('once left invalid by a shouldValidate false write, subsequent normal interaction still validates the choice', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      formContext.setFieldValue('pick.opt1', 'temporary', false);
      await flushPromises();
      formContext.setFieldValue('pick.opt1', '', false);
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);

      await wrapper.find('[id="pick.opt1"]').setValue('hello');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // setValues
  // ─────────────────────────────────────────────────────────────────────────
  describe('setValues', () => {
    it('selects a branch programmatically', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      formContext.setValues({ pick: { opt1: 'hello' } });
      await flushPromises();

      expect((wrapper.find('[id="pick.opt1"]').element as HTMLInputElement).value).toBe('hello');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });

    it('with shouldValidate false writes the branch value without immediately validating it', async () => {
      const wrapper = mountChoiceWithOwnRestriction();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      formContext.setValues({ pick: { opt1: 'hi' } }, false);
      await flushPromises();

      expect((wrapper.find('[id="pick.opt1"]').element as HTMLInputElement).value).toBe('hi');
      expect(wrapper.find('[data-testid="pick.opt1-error-message"]').exists()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // The key regression area: resetForm must not resurrect the choice error
  // ─────────────────────────────────────────────────────────────────────────
  describe('resetForm after a failed submit', () => {
    it('clears the choiceMinOccurs error and it does not reappear once the reset flush settles', async () => {
      const wrapper = mountSimpleChoice();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);

      const formContext = formContextOf(wrapper);
      formContext.resetForm();
      await flushPromises();
      await nextTick();
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // resetForm with values / force
  // ─────────────────────────────────────────────────────────────────────────
  describe('resetForm with values / force', () => {
    it('resetForm({ values }) preselects a branch', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      formContext.resetForm({ values: { pick: { opt1: 'preset' } } });
      await flushPromises();

      expect((wrapper.find('[id="pick.opt1"]').element as HTMLInputElement).value).toBe('preset');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });

    it('resetForm with force true fully replaces values, dropping keys absent from the new state', async () => {
      const wrapper = mountSimpleChoice();
      await wrapper.find('[id="pick.opt1"]').setValue('hello');
      await flushPromises();

      const formContext = formContextOf(wrapper);
      formContext.resetForm({ values: { pick: { opt2: 'world' } } }, { force: true });
      await flushPromises();

      expect((wrapper.find('[id="pick.opt1"]').element as HTMLInputElement).value).toBe('');
      expect((wrapper.find('[id="pick.opt2"]').element as HTMLInputElement).value).toBe('world');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // resetForm after switching branches
  // ─────────────────────────────────────────────────────────────────────────
  describe('resetForm after switching branches', () => {
    it('clears values back to initial, with no stale branch value or error left over', async () => {
      const wrapper = mountExplicitChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[id="pick.selfServe"]').setValue('hello');
      await flushPromises();

      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();

      const formContext = formContextOf(wrapper);
      formContext.resetForm();
      await flushPromises();
      await nextTick();
      await flushPromises();

      // selfServe was switched away from before the reset: it stays deselected, its old value
      // does not leak back.
      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(false);
      // Switching branches is local UI state (explicitlySelectedBranch), not form data, so
      // resetForm does not touch which branch is selected; it only resets guidedRollout's own
      // value back to its original (empty) initial value, with no stale error.
      expect((wrapper.find('[id="pick.guidedRollout"]').element as HTMLInputElement).value).toBe('');
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // resetField on a branch path
  // ─────────────────────────────────────────────────────────────────────────
  describe('resetField on a branch path', () => {
    it('resets only the targeted branch back to its own initial value and clears its own error, leaving its sibling untouched', async () => {
      // Both branches are preloaded via initialValues rather than typed in sequence: with the
      // default maxOccurs:1 budget, filling one branch through the UI disables the other (the
      // shared occurrence slot is already spent), so two independently filled branches only
      // coexist when loaded directly into form state. opt1's initial value is deliberately valid
      // ('hello' passes minLength:5): resetField falls back to the field's own initial value, not
      // to empty, so editing it invalid first and resetting it is what proves the fallback.
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            fieldOptions: { label: 'Pick One' },
            choice: [
              { name: 'opt1', fieldOptions: { label: 'Option 1' }, restriction: { minLength: 5 } },
              { name: 'opt2', fieldOptions: { label: 'Option 2' } },
            ],
          }],
          initialValues: { pick: { opt1: 'hello', opt2: 'world' } },
          settings: { messages: { minLength: 'Min length is {length}' } },
        },
      });
      await flushPromises();

      await wrapper.find('[id="pick.opt1"]').setValue('ab');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick.opt1-error-message"]').exists()).toBe(true);

      const formContext = formContextOf(wrapper);
      formContext.resetField('pick.opt1' as any);
      await flushPromises();

      expect((wrapper.find('[id="pick.opt1"]').element as HTMLInputElement).value).toBe('hello');
      expect(wrapper.find('[data-testid="pick.opt1-error-message"]').exists()).toBe(false);
      expect((wrapper.find('[id="pick.opt2"]').element as HTMLInputElement).value).toBe('world');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // validate / validateField at the choice anchor path
  // ─────────────────────────────────────────────────────────────────────────
  describe('validate and validateField', () => {
    it('validate() in force mode surfaces the choiceMinOccurs error on an untouched choice', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      await formContext.validate();
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);
    });

    it('validate({ mode: "silent" }) updates meta.valid without surfacing error text', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      await formContext.validate({ mode: 'silent' });
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
      expect(formContext.meta.value.valid).toBe(false);
    });

    it('validateField at the choice anchor path surfaces the error by default', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      const result = await formContext.validateField('pick' as any);
      await flushPromises();

      expect(result.valid).toBe(false);
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);
    });

    it('validateField at the choice anchor path with mode silent does not surface error text', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      const result = await formContext.validateField('pick' as any, { mode: 'silent' });
      await flushPromises();

      expect(result.valid).toBe(false);
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // setFieldError / setErrors at the anchor path
  // ─────────────────────────────────────────────────────────────────────────
  describe('setFieldError and setErrors', () => {
    it('setFieldError sets and clears the error at the choice anchor path directly', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      formContext.setFieldError('pick' as any, 'Custom choice error');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').text()).toContain('Custom choice error');
      expect((formContext.errors.value as any).pick).toBe('Custom choice error');

      formContext.setFieldError('pick' as any, undefined);
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });

    it('setErrors sets the choice error alongside a branch error in one call', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      formContext.setErrors({ 'pick': 'Batch error', 'pick.opt1': 'Branch error' } as any);
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').text()).toContain('Batch error');
      expect(wrapper.find('[data-testid="pick.opt1-error-message"]').text()).toContain('Branch error');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Submit pipeline
  // ─────────────────────────────────────────────────────────────────────────
  describe('submit pipeline', () => {
    it('increments submitCount and touches every branch field even when the choice is invalid', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      expect(formContext.submitCount.value).toBe(0);

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(formContext.submitCount.value).toBe(1);
      expect(formContext.meta.value.touched).toBe(true);
      expect(setupState(wrapper, 'pick.opt1')?.fieldContext.meta.touched).toBe(true);
      expect(setupState(wrapper, 'pick.opt2')?.fieldContext.meta.touched).toBe(true);

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(formContext.submitCount.value).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // meta.dirty
  // ─────────────────────────────────────────────────────────────────────────
  describe('meta.dirty', () => {
    it('becomes true once a branch gets a value and false again after resetForm', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      expect(formContext.meta.value.dirty).toBe(false);

      await wrapper.find('[id="pick.opt1"]').setValue('hello');
      await flushPromises();
      expect(formContext.meta.value.dirty).toBe(true);

      formContext.resetForm();
      await flushPromises();
      await nextTick();
      expect(formContext.meta.value.dirty).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Live value at a branch path
  // ─────────────────────────────────────────────────────────────────────────
  describe('live value at a branch path', () => {
    it('reflects both DOM input and programmatic writes', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();
      const formContext = formContextOf(wrapper);

      await wrapper.find('[id="pick.opt1"]').setValue('hello');
      await flushPromises();
      expect((formContext.values as any).pick.opt1).toBe('hello');

      formContext.setFieldValue('pick.opt1', 'updated');
      await flushPromises();
      expect((formContext.values as any).pick.opt1).toBe('updated');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Repeatable choice occurrences (maxOccurs > 1)
  // ─────────────────────────────────────────────────────────────────────────
  describe('repeatable choice occurrences', () => {
    it('resetForm clears an added occurrence\'s own error without resurrecting it, though the occurrence itself survives (pushing it staged its own initial value baseline)', async () => {
      const wrapper = mountRepeatableChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[id="pick.apiEndpoint[0].url"]').setValue('hi');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick.apiEndpoint[0].url-error-message"]').exists()).toBe(true);

      const formContext = formContextOf(wrapper);
      formContext.resetForm();
      await flushPromises();
      await nextTick();
      await flushPromises();

      // Pushing an occurrence stages its own initial value, so a plain resetForm (no force)
      // keeps the occurrence itself and only resets its content back to that (empty) baseline,
      // unlike a field with no field-array involvement, which would simply disappear on reset.
      expect(wrapper.find('[id="pick.apiEndpoint[0].url"]').exists()).toBe(true);
      expect((wrapper.find('[id="pick.apiEndpoint[0].url"]').element as HTMLInputElement).value).toBe('');
      expect(wrapper.find('[data-testid="pick.apiEndpoint[0].url-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });

    it('setFieldValue into an added occurrence path validates it', async () => {
      const wrapper = mountRepeatableChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();

      const formContext = formContextOf(wrapper);
      formContext.setFieldValue('pick.apiEndpoint[0].url' as any, 'hi');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick.apiEndpoint[0].url-error-message"]').exists()).toBe(true);
    });
  });
});
