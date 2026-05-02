import type { Ref } from 'vue';

/** Current lifecycle state of a loading promise. */
export type LoadingResolveStatus
  = | 'pending' // still running
    | 'succeeded' // resolved with true
    | 'failed'; // resolved with false

export interface LoadingResolve {
  /**
   * Settle the promise without throwing. Pass `false` to signal failure;
   * omit or pass `true` to signal success. The awaited boolean reflects this value.
   */
  (isSuccess?: boolean): void
  /**
   * Await this to know when the operation finishes.
   * Resolves to `true` on success, `false` on failure.
   */
  promise: Promise<boolean>
  /** Returns the current lifecycle state of the promise. */
  getStatus: () => LoadingResolveStatus
}

/**
 * Creates an externally-controllable promise useful for tracking async UI operations.
 * The returned `resolve` function settles the promise with a boolean instead of throwing,
 * so callers can `await resolve.promise` without a try/catch.
 * @param isRunningRef optional ref set to `true` while the promise is pending, `false` once settled
 * @returns a `resolve` function that also exposes `.promise` and `.getStatus()`
 */
export function createLoadingResolve(isRunningRef?: Ref<boolean>) {
  let resolve!: LoadingResolve;
  let status: LoadingResolveStatus = 'pending';
  if (isRunningRef)
    isRunningRef.value = true;

  const promise = new Promise<boolean>((res) => {
    resolve = ((isSuccess?: boolean) => {
      if (isRunningRef)
        isRunningRef.value = false;
      // treat undefined as true — only an explicit false signals failure
      res(isSuccess !== false);
      status = isSuccess !== false ? 'succeeded' : 'failed';
    }) as LoadingResolve;
  });

  resolve.promise = promise;
  resolve.getStatus = () => status;

  return resolve;
}
