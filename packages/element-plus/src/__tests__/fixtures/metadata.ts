import { extendMetadata } from '@/metadata';

export const textMetadata = { name: 'text', type: 'text', label: 'First name' };

export const dateAndTextMetadata = [
  { name: 'date', type: 'date', label: 'Birthday' },
  { name: 'text', type: 'text', label: 'First name' },
];

export const attributesMetadata = {
  name: 'text',
  type: 'text',
  label: 'Greeting',
  attributes: [{ name: 'lang', type: 'text', minOccurs: 0 }],
};

export const headingMetadata = {
  name: 'person',
  type: 'heading',
  label: 'Person',
  children: [
    { name: 'first', type: 'text', label: 'First' },
    { name: 'last', type: 'text', label: 'Last' },
  ],
};

export const richTextMetadataConfiguration = extendMetadata<{ richText: string }>();

export const richTextMetadata = { name: 'body', type: 'richText', label: 'Body' };

const options = [{ label: 'One', value: 1 }, { label: 'Two', value: 2 }];

export const allTypesMetadata = [
  { name: 'text', type: 'text', label: 'Text' },
  { name: 'select', type: 'select', label: 'Select', options },
  { name: 'checkbox', type: 'checkbox', label: 'Checkbox' },
  { name: 'radio', type: 'radio', label: 'Radio', options },
  { name: 'date', type: 'date', label: 'Date' },
  { name: 'time', type: 'time', label: 'Time' },
  { name: 'datetime', type: 'datetime', label: 'Datetime' },
  { name: 'switch', type: 'switch', label: 'Switch' },
  { name: 'number', type: 'number', label: 'Number' },
  { name: 'rate', type: 'rate', label: 'Rate' },
  { name: 'slider', type: 'slider', label: 'Slider' },
  { name: 'color', type: 'color', label: 'Color' },
  { name: 'cascader', type: 'cascader', label: 'Cascader', options: [] },
  { name: 'transfer', type: 'transfer', label: 'Transfer', transfer: { data: [] } },
  { name: 'upload', type: 'upload', label: 'Upload' },
  { name: 'heading', type: 'heading', label: 'Heading' },
  { name: 'divider', type: 'divider', label: 'Divider' },
];
