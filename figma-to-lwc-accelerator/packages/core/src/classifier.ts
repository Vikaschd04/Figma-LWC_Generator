import {
  type ClassifiedDesignNode,
  type ComponentClassification,
  type NormalizedDesignNode,
  type SemanticNodeType
} from '../../schemas/src';

export function classifyDesignNode(node: NormalizedDesignNode): ClassifiedDesignNode {
  const children = node.children.map(classifyDesignNode);
  const classification = classifySingleNode(node, children);

  return {
    ...node,
    semanticType: classification.semanticType,
    classification,
    children
  };
}

function classifySingleNode(
  node: NormalizedDesignNode,
  classifiedChildren: ClassifiedDesignNode[]
): ComponentClassification {
  const name = node.name.toLowerCase();
  const text = node.text?.trim();
  const childText = classifiedChildren.some((child) => child.text?.trim());

  if (name.includes('button') || (childText && name.includes('btn'))) {
    return createClassification(
      'button',
      0.95,
      'Node name indicates a button and contains label text.'
    );
  }

  if (name.includes('badge') || name.includes('pill') || isPillLike(node, classifiedChildren)) {
    return createClassification(
      'badge',
      0.86,
      'Node appears to be a compact pill or badge element.'
    );
  }

  if (name.includes('card')) {
    return createClassification('card', 0.92, 'Node name indicates a card container.');
  }

  if (name.includes('icon') || node.semanticType === 'icon') {
    return createClassification('icon', 0.86, 'Node name or source type indicates an icon.');
  }

  if (name.includes('image') || name.includes('avatar') || name.includes('photo')) {
    return createClassification('image', 0.84, 'Node name indicates an image-like visual element.');
  }

  if (name.includes('input') || name.includes('field') || name.includes('combobox')) {
    return createClassification('input', 0.82, 'Node name indicates an input control.');
  }

  if (text !== undefined) {
    return classifyTextNode(node, text);
  }

  if (node.layout?.direction === 'row' || node.layout?.direction === 'column') {
    return createClassification('layout', 0.74, 'Node has normalized layout direction.');
  }

  if (node.semanticType === 'container') {
    return createClassification(
      'container',
      0.62,
      'Node is a generic container without stronger semantic hints.'
    );
  }

  return createClassification(
    'unknown',
    0.2,
    'No reusable classification rule matched this node.',
    [`No semantic classification rule matched "${node.name}".`]
  );
}

function classifyTextNode(node: NormalizedDesignNode, text: string): ComponentClassification {
  const name = node.name.toLowerCase();
  const fontSize = node.styles?.typography?.fontSize ?? 0;
  const fontWeight = node.styles?.typography?.fontWeight ?? 0;

  if (name.includes('subtitle') || name.includes('body')) {
    return createClassification(
      'bodyText',
      0.84,
      'Text name indicates body or supporting content.'
    );
  }

  if (name.includes('title') || name.includes('heading') || fontSize >= 18 || fontWeight >= 700) {
    return createClassification(
      'heading',
      0.9,
      'Text name or typography indicates heading content.'
    );
  }

  if (text.length > 0) {
    return createClassification(
      'bodyText',
      0.82,
      'Text node is readable body or supporting content.'
    );
  }

  return createClassification('bodyText', 0.7, 'Text node defaults to body text.');
}

function isPillLike(
  node: NormalizedDesignNode,
  classifiedChildren: ClassifiedDesignNode[]
): boolean {
  const width = node.layout?.width;
  const height = node.layout?.height;
  const radius = node.styles?.borderRadius ?? 0;
  const hasTextChild = classifiedChildren.some(
    (child) => child.semanticType === 'heading' || child.semanticType === 'bodyText'
  );

  if (width === undefined || height === undefined || height === 0) {
    return false;
  }

  return hasTextChild && height <= 32 && width <= 160 && radius >= height / 2 - 2;
}

function createClassification(
  semanticType: SemanticNodeType,
  confidence: number,
  reason: string,
  warnings: string[] = []
): ComponentClassification {
  return {
    semanticType,
    confidence,
    reason,
    warnings
  };
}
