import { extendMetadata } from '@/metadata';

export const textMetadata = { name: 'text', type: 'text', fieldOptions: { label: 'First name' } };

export const selectMetadata = {
  name: 'select',
  type: 'select',
  fieldOptions: { label: 'Industry' },
  options: [{ key: 'software', value: 'Software' }, { key: 'healthcare', value: 'Healthcare' }],
};

export const headingMetadata = {
  name: 'person',
  type: 'heading',
  fieldOptions: { label: 'Person' },
  children: [
    { name: 'first', type: 'text', fieldOptions: { label: 'First' } },
    { name: 'last', type: 'text', fieldOptions: { label: 'Last' } },
  ],
};

export const checkboxMetadata = { name: 'subscribe', type: 'checkbox', fieldOptions: { label: 'Subscribe' } };

export const passwordMetadata = { name: 'password', type: 'password', fieldOptions: { label: 'Password' }, showStrengthBar: true };

export const richTextMetadataConfiguration = extendMetadata<object, { toolbar?: boolean }>();

export const richTextMetadata = { name: 'body', type: 'text', fieldOptions: { label: 'Body' }, toolbar: true };

// No `type` here on purpose: a plain group (no explicit `heading` type) routes through the
// engine's `default` slot family, distinct from `headingMetadata` above, which is deliberately
// typed `heading` and routes through the `heading` slot family instead.
export const groupMetadata = {
  name: 'address',
  fieldOptions: { label: 'Billing address' },
  description: 'Shown only when a paid tier is selected.',
  children: [
    { name: 'street', type: 'text', fieldOptions: { label: 'Street' } },
    { name: 'city', type: 'text', fieldOptions: { label: 'City' } },
  ],
};

export const inlineArrayMetadata = {
  name: 'tags',
  type: 'text',
  fieldOptions: { label: 'Tags' },
  maxOccurs: 3,
};

export const headingArrayMetadata = {
  name: 'contacts',
  type: 'heading',
  fieldOptions: { label: 'Contacts' },
  maxOccurs: 3,
  minOccurs: 0,
  arrayItemName: 'contact',
  arrayItemNamePlural: 'contacts',
  arrayItemFieldForTitle: 'first',
  children: [
    { name: 'first', type: 'text', fieldOptions: { label: 'First' } },
    { name: 'last', type: 'text', fieldOptions: { label: 'Last' } },
  ],
};
