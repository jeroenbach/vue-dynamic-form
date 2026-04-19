# Step 5: Advanced Fields

Beyond simple inputs, the library handles three structural field types: **groups**, **arrays**, and **choices**. Each requires a corresponding template slot.

## Groups (fields with `children`)

A field with `children` becomes a parent group. Its own `name` becomes a path segment, and its children are rendered inside it.

```ts
{
  name: 'billing',
  type: 'heading',
  fieldOptions: { label: 'Billing details' },
  children: [
    { name: 'street',   type: 'text', fieldOptions: { label: 'Street' } },
    { name: 'city',     type: 'text', fieldOptions: { label: 'City' } },
    { name: 'postcode', type: 'text', fieldOptions: { label: 'Postcode' } },
  ],
}
// → values.billing.street, values.billing.city, values.billing.postcode
```

### Optional Groups

Set `minOccurs: 0` on the parent to make the entire group optional. While none of its children have a value, child validation is suspended — the user is not forced to fill anything in. As soon as one child gets a value, all child `minOccurs` constraints are restored:

```ts
{
  name: 'secondaryContact',
  minOccurs: 0,
  fieldOptions: { label: 'Secondary contact (optional)' },
  children: [
    { name: 'name',  type: 'text', fieldOptions: { label: 'Name' } },
    { name: 'email', type: 'text', fieldOptions: { label: 'Email' } },
  ],
}
```

### Template Slot for Groups

Your `#default` slot handles both groups and plain inputs. Check `fieldMetadata.children?.length` to distinguish them:

```vue
<template #default="{ fieldMetadata, fieldContext: { label, errorMessage }, required, canRemoveItems, removeItem }">
  <!-- Group rendering -->
  <div v-if="fieldMetadata.children?.length" class="group">
    <h3>{{ label }}<span v-if="required"> *</span></h3>
    <p v-if="fieldMetadata.description">{{ fieldMetadata.description }}</p>
    <div class="group-fields">
      <slot />
    </div>
  </div>

  <!-- Input rendering -->
  <div v-else class="field">
    <label :for="fieldMetadata.path">
      {{ label }}<span v-if="required"> *</span>
    </label>
    <slot />
    <span v-if="errorMessage.value" class="error">{{ errorMessage.value }}</span>
    <button v-if="canRemoveItems" type="button" @click="removeItem">Remove</button>
  </div>
</template>
```

Alternatively, give each structural type its own named slot — for example `#heading` for section headings, so `#default` can stay purely for input fields.

## Arrays (Repeatable Fields)

Set `maxOccurs` greater than `1` to make a field repeatable. The library manages adding and removing occurrences.

```ts
{
  name: 'contacts',
  fieldOptions: { label: 'Contacts' },
  minOccurs: 1,
  maxOccurs: 5,
  children: [
    { name: 'name',  type: 'text', fieldOptions: { label: 'Name' } },
    { name: 'email', type: 'text', fieldOptions: { label: 'Email' } },
  ],
}
// → values.contacts[0].name, values.contacts[0].email, …
```

Simple fields (no children) can be arrays too:

```ts
{
  name: 'tags',
  type: 'text',
  fieldOptions: { label: 'Tag' },
  minOccurs: 0,
  maxOccurs: 10,
}
// → values.tags[0], values.tags[1], …
```

### Template Slots for Arrays

The rendering splits into two roles:

1. **`#array`** — rendered once; the outer container. Its `<slot />` yields all current occurrences.
2. **`#default`** (or a named slot) — rendered once per occurrence; the item wrapper.

```vue
<!-- Outer container -->
<template #array="{ fieldContext: { label, errorMessage }, required, canAddItems, addItem }">
  <section class="array-field">
    <h3>{{ label }}<span v-if="required"> *</span></h3>
    <slot />
    <button type="button" v-if="canAddItems" @click="addItem">+ Add</button>
    <span v-if="errorMessage.value" class="error">{{ errorMessage.value }}</span>
  </section>
</template>

<!-- Each occurrence -->
<template #default="{ fieldMetadata, fieldContext: { label, errorMessage }, required, canRemoveItems, removeItem }">
  <div class="array-item">
    <slot />
    <button type="button" v-if="canRemoveItems" @click="removeItem">✕ Remove</button>
  </div>
</template>
```

### Add/Remove Control Props

| Prop | When `true` |
|------|-------------|
| `canAddItems` | Current count is below `maxOccurs` |
| `canRemoveItems` | Current count is above `minOccurs` (or item has a value that can be cleared) |
| `addItem()` | Call to append a new occurrence |
| `removeItem()` | Call to remove the current occurrence |

## Choices (Mutually Exclusive Branches)

A field with `choice` presents several branches, of which the user fills in exactly one. Once one branch gets a value, all sibling branches are disabled.

```ts
{
  name: 'contactMethod',
  fieldOptions: { label: 'How should we reach you?' },
  minOccurs: 1,
  choice: [
    { name: 'email', type: 'text', fieldOptions: { label: 'Email address' } },
    { name: 'phone', type: 'text', fieldOptions: { label: 'Phone number' } },
  ],
}
```

With `minOccurs: 1`, at least one branch must be filled in. Set `minOccurs: 0` for an entirely optional choice.

### Choice + Groups

Each choice branch can itself be a group with children:

```ts
{
  name: 'payment',
  fieldOptions: { label: 'Payment method' },
  choice: [
    {
      name: 'card',
      fieldOptions: { label: 'Credit / debit card' },
      children: [
        { name: 'number', type: 'text', fieldOptions: { label: 'Card number' } },
        { name: 'cvv',    type: 'text', fieldOptions: { label: 'CVV' } },
      ],
    },
    {
      name: 'transfer',
      fieldOptions: { label: 'Bank transfer' },
      children: [
        { name: 'iban', type: 'text', fieldOptions: { label: 'IBAN' } },
      ],
    },
  ],
}
```

### Choice + Arrays

Combining `maxOccurs > 1` with `choice` lets the user add multiple occurrences, each picking its own branch independently:

```ts
{
  name: 'identifiers',
  maxOccurs: 3,
  fieldOptions: { label: 'Identity documents' },
  choice: [
    { name: 'passport',       type: 'text', fieldOptions: { label: 'Passport number' } },
    { name: 'drivingLicense', type: 'text', fieldOptions: { label: 'Driving licence' } },
  ],
}
```

### Template Slots for Choices

The rendering splits the same way as arrays:

1. **`#choice`** — rendered once; the outer wrapper.
2. **`#default`** (or named slot) — rendered once per branch; the `disabled` prop signals locked branches.

```vue
<!-- Outer wrapper -->
<template #choice="{ fieldContext: { label, errorMessage }, required, disabled }">
  <div class="choice-field">
    <h3>{{ label }}<span v-if="required"> *</span></h3>
    <slot />
    <span v-if="errorMessage.value" class="error">{{ errorMessage.value }}</span>
  </div>
</template>

<!-- Each branch -->
<template #default="{ fieldMetadata, fieldContext: { label, errorMessage }, required, disabled }">
  <div class="choice-branch" :class="{ 'is-disabled': disabled }">
    <label>{{ label }}</label>
    <slot />
    <span v-if="errorMessage.value" class="error">{{ errorMessage.value }}</span>
  </div>
</template>
```

## Live Example

<BasicFormExample name="choices" title="Choice Behaviors" description="Simple choices, grouped choices, and array-based choices rendered from metadata." />

---

For a complete property reference see [FieldMetadata](/reference/field-metadata), or explore the [Examples](/examples/).
