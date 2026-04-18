import { describe, expect, it } from 'vitest';
import { setInPath } from './setInPath';

describe('setInPath', () => {
  it('should set a simple non-nested property', () => {
    const obj = {};
    setInPath(obj, 'name', 'John');
    expect(obj).toEqual({ name: 'John' });
  });

  it('should set a nested property', () => {
    const obj = {};
    setInPath(obj, 'user.name', 'John');
    expect(obj).toEqual({ user: { name: 'John' } });
  });

  it('should set a deeply nested property', () => {
    const obj = {};
    setInPath(obj, 'user.address.city', 'Amsterdam');
    expect(obj).toEqual({ user: { address: { city: 'Amsterdam' } } });
  });

  it('should set array values using bracket notation', () => {
    const obj = {};
    setInPath(obj, 'items[0]', 'first');
    expect(obj).toEqual({ items: ['first'] });
  });

  it('should set nested properties within arrays', () => {
    const obj = {};
    setInPath(obj, 'users[0].name', 'John');
    expect(obj).toEqual({ users: [{ name: 'John' }] });
  });

  it('should set deeply nested array properties', () => {
    const obj = {};
    setInPath(obj, 'data.users[0].address.city', 'Amsterdam');
    expect(obj).toEqual({
      data: {
        users: [
          {
            address: {
              city: 'Amsterdam',
            },
          },
        ],
      },
    });
  });

  it('should overwrite existing values', () => {
    const obj = { name: 'John' };
    setInPath(obj, 'name', 'Jane');
    expect(obj).toEqual({ name: 'Jane' });
  });

  it('should overwrite existing nested values', () => {
    const obj = { user: { name: 'John' } };
    setInPath(obj, 'user.name', 'Jane');
    expect(obj).toEqual({ user: { name: 'Jane' } });
  });

  it('should handle null intermediate values by replacing them', () => {
    const obj = { user: null };
    setInPath(obj, 'user.name', 'John');
    expect(obj).toEqual({ user: { name: 'John' } });
  });

  it('should handle undefined intermediate values by replacing them', () => {
    const obj = { user: undefined };
    setInPath(obj, 'user.name', 'John');
    expect(obj).toEqual({ user: { name: 'John' } });
  });

  it('should preserve existing sibling properties', () => {
    const obj = { user: { age: 30 } };
    setInPath(obj, 'user.name', 'John');
    expect(obj).toEqual({ user: { age: 30, name: 'John' } });
  });

  it('should handle multiple array indices', () => {
    const obj = {};
    setInPath(obj, 'items[0]', 'first');
    setInPath(obj, 'items[1]', 'second');
    setInPath(obj, 'items[2]', 'third');
    expect(obj).toEqual({ items: ['first', 'second', 'third'] });
  });

  it('should handle setting undefined as a value', () => {
    const obj = { name: 'John' };
    setInPath(obj, 'name', undefined);
    expect(obj).toEqual({ name: undefined });
  });

  it('should handle setting null as a value', () => {
    const obj = { name: 'John' };
    setInPath(obj, 'name', null);
    expect(obj).toEqual({ name: null });
  });

  it('should handle setting objects as values', () => {
    const obj = {};
    const value = { city: 'Amsterdam', country: 'Netherlands' };
    setInPath(obj, 'user.address', value);
    expect(obj).toEqual({ user: { address: value } });
  });

  it('should handle setting arrays as values', () => {
    const obj = {};
    const value = ['apple', 'banana', 'orange'];
    setInPath(obj, 'user.favorites', value);
    expect(obj).toEqual({ user: { favorites: value } });
  });

  it('should handle mixed array and object paths', () => {
    const obj = {};
    setInPath(obj, 'data.items[0].tags[0]', 'tag1');
    expect(obj).toEqual({
      data: {
        items: [
          {
            tags: ['tag1'],
          },
        ],
      },
    });
  });

  it('should create intermediate objects for existing paths', () => {
    const obj = { user: { name: 'John' } };
    setInPath(obj, 'user.address.city', 'Amsterdam');
    expect(obj).toEqual({
      user: {
        name: 'John',
        address: {
          city: 'Amsterdam',
        },
      },
    });
  });
});
