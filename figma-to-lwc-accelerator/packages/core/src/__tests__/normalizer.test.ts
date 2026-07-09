import { accountHealthCardRawFixture } from '../../../test-fixtures/src';
import { normalizeFigmaTree } from '../normalizer';

describe('normalizeFigmaTree', () => {
  it('normalizes a frame to a container node', () => {
    const normalized = normalizeFigmaTree(accountHealthCardRawFixture);

    expect(normalized).toMatchObject({
      id: '1:1',
      name: 'Account Health Card',
      semanticType: 'container',
      layout: {
        direction: 'column',
        width: 360,
        height: 220,
        gap: 12,
        padding: {
          top: 16,
          right: 16,
          bottom: 16,
          left: 16
        }
      }
    });
  });

  it('normalizes text nodes and typography', () => {
    const normalized = normalizeFigmaTree(accountHealthCardRawFixture);
    const title = normalized.children[0];

    expect(title).toMatchObject({
      name: 'Title',
      semanticType: 'bodyText',
      text: 'Account Health',
      styles: {
        typography: {
          fontFamily: 'Salesforce Sans',
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 24
        }
      }
    });
  });

  it('preserves child hierarchy recursively', () => {
    const normalized = normalizeFigmaTree(accountHealthCardRawFixture);
    const button = normalized.children.find((child) => child.name === 'View Details Button');

    expect(normalized.children).toHaveLength(3);
    expect(button?.children).toHaveLength(1);
    expect(button?.children[0]).toMatchObject({
      id: '1:4',
      name: 'Label',
      text: 'View Details'
    });
  });

  it('converts auto layout direction and spacing into normalized layout', () => {
    const normalized = normalizeFigmaTree(accountHealthCardRawFixture);
    const button = normalized.children.find((child) => child.name === 'View Details Button');

    expect(button?.layout).toEqual({
      direction: 'row',
      width: 120,
      height: 32,
      gap: 8,
      padding: {
        top: 6,
        right: 12,
        bottom: 6,
        left: 12
      }
    });
  });

  it('normalizes fills, borders, and radius to stable style data', () => {
    const normalized = normalizeFigmaTree(accountHealthCardRawFixture);

    expect(normalized.styles).toEqual({
      fills: [{ hex: '#ffffff', opacity: 1 }],
      strokes: [{ hex: '#dddbda', opacity: 1 }],
      strokeWeight: 1,
      borderRadius: 4
    });
  });

  it('handles missing optional fields safely', () => {
    const normalized = normalizeFigmaTree({
      id: '2:1',
      name: 'Bare Text',
      type: 'TEXT'
    });

    expect(normalized).toEqual({
      id: '2:1',
      name: 'Bare Text',
      semanticType: 'bodyText',
      text: '',
      children: []
    });
  });
});
