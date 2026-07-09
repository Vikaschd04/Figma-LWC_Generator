import type { NormalizedDesignNode } from '../../../schemas/src';
import { accountHealthCardRawFixture } from '../../../test-fixtures/src';
import { classifyDesignNode } from '../classifier';
import { normalizeFigmaTree } from '../normalizer';

describe('classifyDesignNode', () => {
  it('classifies a named card container correctly', () => {
    const classified = classifyDesignNode(normalizeFigmaTree(accountHealthCardRawFixture));

    expect(classified.semanticType).toBe('card');
    expect(classified.classification).toMatchObject({
      semanticType: 'card',
      confidence: 0.92,
      reason: 'Node name indicates a card container.'
    });
  });

  it('classifies a named button correctly', () => {
    const classified = classifyDesignNode(normalizeFigmaTree(accountHealthCardRawFixture));
    const button = classified.children.find((child) => child.name === 'View Details Button');

    expect(button?.semanticType).toBe('button');
    expect(button?.classification.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('classifies heading text from title naming and typography', () => {
    const classified = classifyDesignNode(normalizeFigmaTree(accountHealthCardRawFixture));
    const title = classified.children.find((child) => child.name === 'Title');

    expect(title?.semanticType).toBe('heading');
    expect(title?.classification.reason).toContain('heading');
  });

  it('classifies badge-like pill nodes', () => {
    const badgeNode: NormalizedDesignNode = {
      id: 'badge-1',
      name: 'Status Badge',
      semanticType: 'container',
      layout: {
        direction: 'row',
        width: 72,
        height: 24
      },
      styles: {
        fills: [{ hex: '#e3fcef', opacity: 1 }],
        strokes: [],
        borderRadius: 12
      },
      children: [
        {
          id: 'badge-label',
          name: 'Label',
          semanticType: 'bodyText',
          text: 'Healthy',
          children: []
        }
      ]
    };

    const classified = classifyDesignNode(badgeNode);

    expect(classified.semanticType).toBe('badge');
    expect(classified.classification.confidence).toBeGreaterThan(0.8);
  });

  it('classifies row and column containers as layout when no stronger semantic hint exists', () => {
    const layoutNode: NormalizedDesignNode = {
      id: 'layout-1',
      name: 'Content Row',
      semanticType: 'container',
      layout: {
        direction: 'row',
        gap: 8
      },
      children: []
    };

    const classified = classifyDesignNode(layoutNode);

    expect(classified.semanticType).toBe('layout');
    expect(classified.classification.reason).toContain('layout direction');
  });

  it('leaves unknown elements as unknown with a warning', () => {
    const unknownNode: NormalizedDesignNode = {
      id: 'unknown-1',
      name: 'Decorative Shape',
      semanticType: 'unknown',
      children: []
    };

    const classified = classifyDesignNode(unknownNode);

    expect(classified.semanticType).toBe('unknown');
    expect(classified.classification.warnings).toEqual([
      'No semantic classification rule matched "Decorative Shape".'
    ]);
  });
});
