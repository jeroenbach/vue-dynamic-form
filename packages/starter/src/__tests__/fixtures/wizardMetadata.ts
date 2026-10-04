export interface SummaryGroup {
  title: string
  rows: [label: string, value: string][]
  dataTestid?: string
}

export interface WizardMetadataOptions {
  name?: string
  label?: string
  description?: string
  pages?: number
  wizard?: boolean | { allowForwardJump?: boolean, validateOnJump?: boolean }
  requiredPages?: number[]
  summaryGroups?: SummaryGroup[]
  confirmation?: string
  extra?: Record<string, unknown>
}

/**
 * A wizard with one text field per page: `<name>.page<i>.field<i>`, optional unless the
 * page is listed as required. Supplying `summaryGroups` or `confirmation` appends a trailing
 * review page whose single child is a `wizardSummaryPage`-typed field carrying them.
 */
export function wizardMetadata({
  name = 'wizard',
  label = 'Client Onboarding',
  description = 'Launch approach',
  pages = 3,
  wizard = true,
  requiredPages = [],
  summaryGroups,
  confirmation,
  extra = {},
}: WizardMetadataOptions = {}) {
  const dataPages = Array.from({ length: pages }, (_, index) => ({
    name: `page${index}`,
    fieldOptions: { label: `Page ${index + 1}` },
    children: [{
      name: `field${index}`,
      type: 'text',
      fieldOptions: { label: `Field ${index + 1}` },
      minOccurs: requiredPages.includes(index) ? 1 : 0,
    }],
  }));

  const reviewPage = (summaryGroups !== undefined || confirmation !== undefined)
    ? [{
        name: 'review',
        fieldOptions: { label: 'Review' },
        children: [{
          name: 'summary',
          type: 'wizardSummaryPage',
          fieldOptions: { label: 'Review and submit' },
          wizardSummary: summaryGroups,
          wizardSummaryConfirmation: confirmation,
        }],
      }]
    : [];

  return {
    name,
    fieldOptions: { label },
    description,
    wizard,
    ...extra,
    children: [...dataPages, ...reviewPage],
  };
}

export function fieldPath(index: number, wizardPath = 'wizard') {
  return `${wizardPath}.page${index}.field${index}`;
}
