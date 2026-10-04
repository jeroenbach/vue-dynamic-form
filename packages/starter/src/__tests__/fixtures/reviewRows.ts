/** Rows for a `ReviewGroup`, including one with an empty value to exercise the placeholder fallback. */
export function reviewRows(): [label: string, value: string][] {
  return [
    ['Company name', 'Acme Industries'],
    ['Secondary contact', ''],
  ];
}
