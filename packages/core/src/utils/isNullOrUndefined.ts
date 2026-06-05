export function isNullOrUndefined(arg: any) {
  return arg === undefined || arg === null;
}

export function isNotNullOrUndefined(arg: any) {
  return !isNullOrUndefined(arg);
}
