import { describe, expect, it } from 'vitest';
import { isPathInSection } from '../isPathInSection';

describe('isPathInSection', () => {
  it('matches the section path itself', () => {
    expect(isPathInSection('address', 'address')).toBe(true);
  });

  it('matches child paths via dot notation', () => {
    expect(isPathInSection('address.street', 'address')).toBe(true);
    expect(isPathInSection('address.street.number', 'address')).toBe(true);
  });

  it('matches indexed paths via bracket notation', () => {
    expect(isPathInSection('contacts[0]', 'contacts')).toBe(true);
    expect(isPathInSection('contacts[0].email', 'contacts')).toBe(true);
  });

  it('matches children of an indexed section', () => {
    expect(isPathInSection('contacts[0].email', 'contacts[0]')).toBe(true);
    expect(isPathInSection('contacts[1].email', 'contacts[0]')).toBe(false);
  });

  it('does not match unrelated paths sharing a prefix string', () => {
    expect(isPathInSection('addressLine', 'address')).toBe(false);
    expect(isPathInSection('addressLine.street', 'address')).toBe(false);
  });

  it('does not match a parent or sibling path', () => {
    expect(isPathInSection('address', 'address.street')).toBe(false);
    expect(isPathInSection('address.city', 'address.street')).toBe(false);
  });
});
