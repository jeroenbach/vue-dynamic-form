# Arrays And Groups

This example focuses on nested structure rather than a single field.

## What It Demonstrates

- optional and required groups
- repeatable fields
- repeatable grouped sections
- nested children inside array occurrences

## Example

<BasicFormExample name="arrays" />

<BasicFormExample name="groups" />

## Notes

Array behavior is driven by `minOccurs` and `maxOccurs`. Group behavior comes from `children`, while optional groups relax child requirements until the group becomes active.
