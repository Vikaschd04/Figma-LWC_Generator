import type { ClassifiedDesignNode } from '../../../schemas/src';
import { classifyDesignNode, normalizeFigmaTree } from '../../../core/src';
import { accountHealthCardRawFixture } from '../../../test-fixtures/src';
import { mapToSlds } from '../mapper';

function getClassifiedFixture(): ClassifiedDesignNode {
  return classifyDesignNode(normalizeFigmaTree(accountHealthCardRawFixture));
}

describe('mapToSlds', () => {
  it('maps a button to lightning-button', () => {
    const mapped = mapToSlds(getClassifiedFixture());
    const button = mapped.children.find((child) => child.name === 'View Details Button');

    expect(button).toMatchObject({
      renderKind: 'lightning',
      tagName: 'lightning-button',
      classes: ['slds-m-top_small'],
      attributes: {
        label: 'View Details',
        variant: 'brand'
      }
    });
  });

  it('maps a card to an SLDS card wrapper', () => {
    const mapped = mapToSlds(getClassifiedFixture());

    expect(mapped).toMatchObject({
      renderKind: 'html',
      tagName: 'section',
      classes: ['slds-card', 'slds-p-around_medium']
    });
  });

  it('maps heading and body text to semantic HTML with SLDS classes', () => {
    const mapped = mapToSlds(getClassifiedFixture());
    const title = mapped.children.find((child) => child.name === 'Title');
    const subtitle = mapped.children.find((child) => child.name === 'Subtitle');

    expect(title).toMatchObject({
      tagName: 'h2',
      classes: ['slds-text-heading_small'],
      text: 'Account Health'
    });
    expect(subtitle).toMatchObject({
      tagName: 'p',
      classes: ['slds-text-body_regular'],
      text: 'Current customer risk overview'
    });
  });

  it('maps unsupported nodes to generic HTML with a warning', () => {
    const unknownNode: ClassifiedDesignNode = {
      id: 'unknown-1',
      name: 'Decorative Shape',
      semanticType: 'unknown',
      classification: {
        semanticType: 'unknown',
        confidence: 0.2,
        reason: 'No reusable classification rule matched this node.',
        warnings: ['No semantic classification rule matched "Decorative Shape".']
      },
      children: []
    };

    const mapped = mapToSlds(unknownNode);

    expect(mapped).toMatchObject({
      tagName: 'div',
      warnings: [
        'No semantic classification rule matched "Decorative Shape".',
        'Unsupported node "Decorative Shape" mapped to a generic div for developer review.'
      ]
    });
  });

  it('generates custom CSS only when needed', () => {
    const rowNode: ClassifiedDesignNode = {
      id: 'row-1',
      name: 'Content Row',
      semanticType: 'layout',
      layout: {
        direction: 'row',
        gap: 8
      },
      classification: {
        semanticType: 'layout',
        confidence: 0.74,
        reason: 'Node has normalized layout direction.',
        warnings: []
      },
      children: []
    };
    const columnNode: ClassifiedDesignNode = {
      ...rowNode,
      id: 'column-1',
      name: 'Content Column',
      layout: {
        direction: 'column',
        gap: 12
      }
    };

    expect(mapToSlds(rowNode).cssDeclarations).toEqual({});
    expect(mapToSlds(columnNode).cssDeclarations).toEqual({
      display: 'flex',
      'flex-direction': 'column',
      gap: '12px'
    });
  });
});
