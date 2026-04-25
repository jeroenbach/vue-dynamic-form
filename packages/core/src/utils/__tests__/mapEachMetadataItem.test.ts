import type { GetMetadataType } from '@/types/GetMetadataType';
import { describe, expect, it } from 'vitest';
import { defineMetadata } from '@/core/defineMetadata';
import { mapEachMetadataItem } from '@/utils/mapEachMetadataItem';

export type TestMetadata = GetMetadataType<typeof _metadata>;

const _metadata = defineMetadata<
  {
    text: string
  },
  {
    visited?: boolean
    visitOrder?: number
  }
>();

describe('mapEachMetadataItem', () => {
  it('returns the original metadata when no metadata is provided', () => {
    expect(mapEachMetadataItem(undefined as never, item => item)).toBeUndefined();
  });

  it('returns the original metadata when no callback is provided', () => {
    const metadata: TestMetadata = { name: 'root', type: 'text' };
    expect(mapEachMetadataItem(metadata, undefined as never)).toBe(metadata);
  });

  it('maps root, children and choice items recursively in traversal order', () => {
    let visitOrder = 0;
    const metadata: TestMetadata = {
      name: 'root',
      type: 'text',
      children: [
        {
          name: 'child',
          type: 'text',
          choice: [
            { name: 'grandchild-choice', type: 'text' },
          ],
        },
      ],
      choice: [
        { name: 'root-choice', type: 'text' },
      ],
    };

    const result = mapEachMetadataItem(metadata, (item) => {
      item.visited = true;
      item.visitOrder = ++visitOrder;
      return item;
    });

    expect(result).toEqual({
      name: 'root',
      type: 'text',
      visited: true,
      visitOrder: 1,
      children: [
        {
          name: 'child',
          type: 'text',
          visited: true,
          visitOrder: 2,
          choice: [
            { name: 'grandchild-choice', type: 'text', visited: true, visitOrder: 3 },
          ],
        },
      ],
      choice: [
        { name: 'root-choice', type: 'text', visited: true, visitOrder: 4 },
      ],
    });
  });

  it('passes a shallow clone to the callback and leaves the original tree unchanged', () => {
    const metadata: TestMetadata = {
      name: 'root',
      type: 'text',
      children: [{ name: 'child', type: 'text' }],
    };

    const callbackItems: TestMetadata[] = [];
    mapEachMetadataItem(metadata, (item) => {
      callbackItems.push(item);
      item.visited = true;
      return item;
    });

    expect(callbackItems[0]).not.toBe(metadata);
    expect(callbackItems[1]).not.toBe(metadata.children?.[0]);
    expect(metadata).toEqual({
      name: 'root',
      type: 'text',
      children: [{ name: 'child', type: 'text' }],
    });
  });
});
