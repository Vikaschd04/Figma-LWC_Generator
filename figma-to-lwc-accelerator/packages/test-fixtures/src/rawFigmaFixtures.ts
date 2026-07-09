import type { RawFigmaNode } from '../../schemas/src';

export const accountHealthCardRawFixture: RawFigmaNode = {
  id: '1:1',
  name: 'Account Health Card',
  type: 'FRAME',
  width: 360,
  height: 220,
  layoutMode: 'VERTICAL',
  itemSpacing: 12,
  paddingTop: 16,
  paddingRight: 16,
  paddingBottom: 16,
  paddingLeft: 16,
  cornerRadius: 4,
  fills: [
    {
      type: 'SOLID',
      color: {
        r: 1,
        g: 1,
        b: 1,
        a: 1
      }
    }
  ],
  strokes: [
    {
      type: 'SOLID',
      color: {
        r: 0.8667,
        g: 0.8588,
        b: 0.8549,
        a: 1
      }
    }
  ],
  strokeWeight: 1,
  children: [
    {
      id: '1:2',
      name: 'Title',
      type: 'TEXT',
      characters: 'Account Health',
      style: {
        fontFamily: 'Salesforce Sans',
        fontSize: 18,
        fontWeight: 700,
        lineHeightPx: 24
      }
    },
    {
      id: '1:3',
      name: 'View Details Button',
      type: 'FRAME',
      width: 120,
      height: 32,
      layoutMode: 'HORIZONTAL',
      itemSpacing: 8,
      paddingTop: 6,
      paddingRight: 12,
      paddingBottom: 6,
      paddingLeft: 12,
      cornerRadius: 4,
      fills: [
        {
          type: 'SOLID',
          color: {
            r: 0.0078,
            g: 0.4471,
            b: 0.7412,
            a: 1
          }
        }
      ],
      children: [
        {
          id: '1:4',
          name: 'Label',
          type: 'TEXT',
          characters: 'View Details',
          style: {
            fontFamily: 'Salesforce Sans',
            fontSize: 13,
            fontWeight: 400,
            lineHeightPx: 18
          }
        }
      ]
    },
    {
      id: '1:5',
      name: 'Subtitle',
      type: 'TEXT',
      characters: 'Current customer risk overview',
      style: {
        fontFamily: 'Salesforce Sans',
        fontSize: 13,
        fontWeight: 400,
        lineHeightPx: 18
      }
    }
  ]
};
