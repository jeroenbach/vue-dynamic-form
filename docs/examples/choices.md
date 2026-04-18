# Choices

Choice fields are where the library differs most from a plain field renderer.

## What It Demonstrates

- simple mutually exclusive branches
- grouped choice branches
- array-based choice branches
- disabling sibling branches when one branch becomes active

## Example

<BasicFormExample name="choices" />

## Notes

Choice logic calculates runtime overrides for branch availability. That includes disabling siblings, relaxing nested branch requirements until a branch becomes active, and limiting branch array capacity inside a shared choice.
