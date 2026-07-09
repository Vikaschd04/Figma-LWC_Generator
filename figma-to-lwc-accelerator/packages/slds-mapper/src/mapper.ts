import type { ClassifiedDesignNode, SldsMappedNode } from '../../schemas/src';

type MappingBlueprint = Pick<SldsMappedNode, 'renderKind' | 'tagName' | 'classes' | 'attributes'>;

export function mapToSlds(node: ClassifiedDesignNode): SldsMappedNode {
  const children = node.children.map(mapToSlds);
  const blueprint = mapNode(node);
  const cssDeclarations = mapCssDeclarations(node);
  const warnings = [...node.classification.warnings, ...mapWarnings(node, cssDeclarations)];

  return {
    id: node.id,
    name: node.name,
    semanticType: node.semanticType,
    renderKind: blueprint.renderKind,
    tagName: blueprint.tagName,
    classes: blueprint.classes,
    attributes: blueprint.attributes,
    ...(node.text !== undefined ? { text: node.text } : {}),
    cssDeclarations,
    warnings,
    children
  };
}

function mapNode(node: ClassifiedDesignNode): MappingBlueprint {
  switch (node.semanticType) {
    case 'button':
      return {
        renderKind: 'lightning',
        tagName: 'lightning-button',
        classes: ['slds-m-top_small'],
        attributes: {
          label: getChildText(node) || node.name,
          variant: inferButtonVariant(node.name)
        }
      };
    case 'input':
      return {
        renderKind: 'lightning',
        tagName: 'lightning-input',
        classes: ['slds-m-bottom_small'],
        attributes: {
          label: node.name
        }
      };
    case 'icon':
      return {
        renderKind: 'lightning',
        tagName: 'lightning-icon',
        classes: [],
        attributes: {
          iconName: 'utility:info',
          size: 'small',
          alternativeText: node.name
        }
      };
    case 'card':
      return {
        renderKind: 'html',
        tagName: 'section',
        classes: ['slds-card', 'slds-p-around_medium'],
        attributes: {}
      };
    case 'heading':
      return {
        renderKind: 'html',
        tagName: 'h2',
        classes: ['slds-text-heading_small'],
        attributes: {}
      };
    case 'bodyText':
      return {
        renderKind: 'html',
        tagName: 'p',
        classes: ['slds-text-body_regular'],
        attributes: {}
      };
    case 'badge':
      return {
        renderKind: 'html',
        tagName: 'span',
        classes: ['slds-badge'],
        attributes: {}
      };
    case 'layout':
      return mapLayout(node);
    case 'container':
      return {
        renderKind: 'html',
        tagName: 'div',
        classes: ['slds-p-around_medium'],
        attributes: {}
      };
    case 'image':
      return {
        renderKind: 'html',
        tagName: 'img',
        classes: ['slds-image'],
        attributes: {
          alt: node.name
        }
      };
    case 'unknown':
      return {
        renderKind: 'html',
        tagName: 'div',
        classes: [],
        attributes: {}
      };
  }
}

function mapLayout(node: ClassifiedDesignNode): MappingBlueprint {
  if (node.layout?.direction === 'row') {
    return {
      renderKind: 'html',
      tagName: 'div',
      classes: ['slds-grid', 'slds-gutters'],
      attributes: {}
    };
  }

  return {
    renderKind: 'html',
    tagName: 'div',
    classes: ['ftl-flex-column'],
    attributes: {}
  };
}

function mapCssDeclarations(node: ClassifiedDesignNode): Record<string, string> {
  const cssDeclarations: Record<string, string> = {};

  if (node.semanticType === 'layout' && node.layout?.direction === 'column') {
    cssDeclarations.display = 'flex';
    cssDeclarations['flex-direction'] = 'column';
  }

  if (node.layout?.gap !== undefined && needsCustomGap(node)) {
    cssDeclarations.gap = `${node.layout.gap}px`;
  }

  return cssDeclarations;
}

function needsCustomGap(node: ClassifiedDesignNode): boolean {
  return node.semanticType === 'layout' && node.layout?.direction === 'column';
}

function mapWarnings(
  node: ClassifiedDesignNode,
  cssDeclarations: Record<string, string>
): string[] {
  const warnings: string[] = [];

  if (node.semanticType === 'unknown') {
    warnings.push(`Unsupported node "${node.name}" mapped to a generic div for developer review.`);
  }

  if (Object.keys(cssDeclarations).length > 0) {
    warnings.push(`Custom scoped CSS required for "${node.name}".`);
  }

  return warnings;
}

function getChildText(node: ClassifiedDesignNode): string | undefined {
  return node.children.find((child) => child.text?.trim())?.text?.trim();
}

function inferButtonVariant(name: string): string {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('secondary') || lowerName.includes('neutral')) {
    return 'neutral';
  }

  return 'brand';
}
