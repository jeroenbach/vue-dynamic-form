# extendMetadata()

`extendMetadata` layers your own field types, field properties, slot properties, and settings on top of the starter catalogue. It is the starter's counterpart of the core [`defineMetadata()`](/reference/define-metadata): the same four generic parameters, pre-filled with everything the starter already declares.

```ts
import { extendMetadata } from '@bach.software/vue-dynamic-form-starter';

export const projectMetadata = extendMetadata<
  { range: string, rating: number }, // extra value types
  { min?: number, max?: number, step?: number, maxRating?: number }
>();

export type Metadata = GetMetadataType<typeof projectMetadata>;
```

Like `defineMetadata`, it is purely a type carrier: the returned object is an empty runtime stub, and nothing is merged at runtime.

## Signature

```ts
function extendMetadata<
  ExtraValueTypes extends Record<string, any> = object,
  ExtraFieldProperties extends object = object,
  ExtraSlotProperties extends object = object,
  ExtraSettingsProperties extends object = object,
>(): MetadataConfiguration;
```

| Parameter                 | Adds                                                                    | Starter baseline it extends                                          |
| ------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `ExtraValueTypes`         | New `type` names and the value type each stores                         | [`StarterValueTypes`](/reference/starter-field-types)                |
| `ExtraFieldProperties`    | New properties on every metadata node                                   | [`StarterFieldProperties`](/reference/starter-field-properties)      |
| `ExtraSlotProperties`     | New properties on the `slotProps` object passed between template layers | the starter's slot properties (`gotoStep` on wizard pages)           |
| `ExtraSettingsProperties` | New properties on the `settings` object                                 | [the starter settings](/reference/starter-settings-theming#settings) |

## Wiring it up

Three pieces make an extension work end to end:

1. **Declare** the types with `extendMetadata` in a `.ts` file, so pages can import the `Metadata` type without pulling in a component.
2. **Wrap** `StarterFormTemplate`, pass the configuration via the `metadataConfiguration` prop, and supply one `<type>-input` slot per new type (see [the wrapper pattern](/reference/starter-form-template#the-wrapper-pattern)). Because the slot is named `<type>-input`, the new control renders inside the starter's built-in field chrome: label, description, required tag, and error message come for free.
3. **Type** your metadata arrays with `GetMetadataType<typeof yourMetadata>` and your settings with `GetDynamicFormSettingsType<typeof yourMetadata>`, so the new `type` values and properties are checked.

The [Extending The Starter Template](/guide/extending-starter) guide chapter shows all three steps with a live demo.

## Collision semantics

On a key collision your declaration **replaces** the built-in one, it does not merge with it:

- Redeclaring a built-in type (for example `text`) or a built-in property (for example `description`) removes the built-in declaration. Supply the matching slot as well in that case, because the built-in markup still assumes the built-in property shape.
- A `maxRating?: number` of your own and the built-in `password` object can coexist fine; only identical keys collide.

## Reserved names

`input` and `attributes` are not usable as field type names: they are the engine-carried slots every wrapper forwards. `icon` is reserved as a slot name too. See [Reserved slot names](/reference/starter-form-template#reserved-slot-names).

## Overriding built-ins without new types

The same wrapper mechanism restyles a built-in control: a dedicated per-type slot such as `text-input` wins over `default-input`, so you can replace one control and keep every other built-in rendering. No `extendMetadata` call is needed unless the types change.

## Related

- [Extending The Starter Template](/guide/extending-starter): the guide chapter with the live demo
- [defineMetadata()](/reference/define-metadata): the core function this builds on
- [StarterFormTemplate](/reference/starter-form-template): the wrapper pattern and slot resolution
