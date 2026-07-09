import {
  generatedFileSchema,
  normalizedDesignNodeSchema,
  rawFigmaNodeSchema,
  validateGeneratedFile,
  validateNormalizedDesignNode,
  validateRawFigmaNode
} from '../index';

describe('Phase 1 schema validation', () => {
  it('accepts a valid raw Figma node tree', () => {
    const result = validateRawFigmaNode({
      id: '1:1',
      name: 'Account Health Card',
      type: 'FRAME',
      width: 360,
      height: 220,
      layoutMode: 'VERTICAL',
      children: [
        {
          id: '1:2',
          name: 'Title',
          type: 'TEXT',
          characters: 'Account Health',
          style: {
            fontFamily: 'Salesforce Sans',
            fontSize: 18,
            fontWeight: 700
          }
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid raw Figma node type', () => {
    const result = rawFigmaNodeSchema.safeParse({
      id: '1:1',
      name: 'Unsupported Widget',
      type: 'STARSHIP'
    });

    expect(result.success).toBe(false);
  });

  it('accepts a normalized design node with required children array', () => {
    const result = validateNormalizedDesignNode({
      id: 'normalized-1',
      name: 'Account Health Card',
      semanticType: 'card',
      layout: {
        direction: 'column',
        width: 360,
        height: 220,
        gap: 12
      },
      styles: {
        fills: [{ hex: '#ffffff', opacity: 1 }],
        strokes: [],
        borderRadius: 4
      },
      children: []
    });

    expect(result.success).toBe(true);
  });

  it('rejects a normalized node without children', () => {
    const result = normalizedDesignNodeSchema.safeParse({
      id: 'normalized-1',
      name: 'Missing Children',
      semanticType: 'container'
    });

    expect(result.success).toBe(false);
  });

  it('accepts a generated file model', () => {
    const result = validateGeneratedFile({
      path: 'accountHealthCard/accountHealthCard.html',
      kind: 'html',
      content: '<template></template>'
    });

    expect(result.success).toBe(true);
  });

  it('rejects a generated file without a path', () => {
    const result = generatedFileSchema.safeParse({
      path: '',
      kind: 'js',
      content: 'export default class AccountHealthCard {}'
    });

    expect(result.success).toBe(false);
  });
});
