import type { FormValidationResult, GenericObject, Path } from 'vee-validate';
import type { InjectionKey } from 'vue';
import { FormContextKey } from 'vee-validate';
import { getCurrentInstance, inject } from 'vue';

type FormCtx = typeof FormContextKey extends InjectionKey<infer T> ? T : never;

function getFormContext(): FormCtx | undefined {
  // When called in the same component as useDynamicForm, inject() looks at the parent's provides
  // and won't find the context that useForm() just provided on the current instance.
  // So we check the current instance's own provides first, then fall back to inject for child-component usage.
  const instance = getCurrentInstance();
  const ownProvides = (instance as any)?.provides as Record<symbol, unknown> | undefined;
  if (ownProvides && (FormContextKey as symbol) in ownProvides)
    return ownProvides[FormContextKey as symbol] as FormCtx;

  return inject(FormContextKey);
}

export function useValidatePartialForm() {
  const form = getFormContext()!;

  async function validateSection(sectionPath: string): Promise<FormValidationResult<GenericObject>> {
    const fieldPaths = form.getAllPathStates()
      .map(state => state.path)
      .filter(path => path === sectionPath
        || path.startsWith(`${sectionPath}.`)
        || path.startsWith(`${sectionPath}[`));

    const validationResults = await Promise.all(
      fieldPaths.map(async path => ({
        path,
        result: await form.validateField(path as Path<GenericObject>),
      })),
    );

    const results = Object.fromEntries(
      validationResults.map(({ path, result }) => [path, result]),
    ) as FormValidationResult<GenericObject>['results'];

    const errors = Object.fromEntries(
      validationResults
        .filter(({ result }) => !result.valid)
        .map(({ path, result }) => [path, result.errors[0] ?? '']),
    ) as FormValidationResult<GenericObject>['errors'];

    return {
      valid: validationResults.every(({ result }) => result.valid),
      results,
      errors,
      source: 'fields',
    };
  }

  return { validateSection };
}
