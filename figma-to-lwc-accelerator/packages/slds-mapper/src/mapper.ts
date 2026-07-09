import type { ClassifiedDesignNode, SldsMappedNode } from '../../schemas/src';

type MappingBlueprint = Pick<SldsMappedNode, 'renderKind' | 'tagName' | 'classes' | 'attributes'>;

export function mapToSlds(node: ClassifiedDesignNode): SldsMappedNode {
  const children = node.children.map(mapToSlds);
  const blueprint = mapNode(node);
  const cssDeclarations = mapCssDeclarations(node);
  
  // Attach unique scoped CSS class name if there are any visual properties extracted
  if (Object.keys(cssDeclarations).length > 0) {
    const sanitizedId = node.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const ftlClass = `ftl-node-${sanitizedId}`;
    blueprint.classes.push(ftlClass);
  }

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
        classes: [],
        attributes: {
          label: getChildText(node) || node.name,
          variant: inferButtonVariant(node.name)
        }
      };
    case 'input':
      return {
        renderKind: 'lightning',
        tagName: 'lightning-input',
        classes: [],
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
        classes: ['slds-card'],
        attributes: {}
      };
    case 'heading':
      return {
        renderKind: 'html',
        tagName: 'h2',
        classes: [],
        attributes: {}
      };
    case 'bodyText':
      return {
        renderKind: 'html',
        tagName: 'p',
        classes: [],
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
        classes: [],
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
  return {
    renderKind: 'html',
    tagName: 'div',
    classes: [],
    attributes: {}
  };
}

function mapCssDeclarations(node: ClassifiedDesignNode): Record<string, string> {
  const cssDeclarations: Record<string, string> = {};

  // Flex Layout configurations
  if (node.semanticType === 'layout') {
    cssDeclarations.display = 'flex';
    if (node.layout?.direction === 'row') {
      cssDeclarations['flex-direction'] = 'row';
    } else if (node.layout?.direction === 'column') {
      cssDeclarations['flex-direction'] = 'column';
    }
  }

  // Alignments (Justify & Align)
  if (node.layout?.justifyContent) {
    cssDeclarations['justify-content'] = node.layout.justifyContent;
  }
  if (node.layout?.alignItems) {
    cssDeclarations['align-items'] = node.layout.alignItems;
  }

  // Flex grow
  if (node.layout?.flexGrow !== undefined) {
    cssDeclarations['flex-grow'] = String(node.layout.flexGrow);
  }

  // Gap
  if (node.layout?.gap !== undefined) {
    cssDeclarations.gap = `${node.layout.gap}px`;
  }

  // Padding
  if (node.layout?.padding) {
    const p = node.layout.padding;
    cssDeclarations.padding = `${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`;
  }

  // Background Fill (Solid paints)
  if (node.styles?.fills && node.styles.fills.length > 0) {
    const fill = node.styles.fills[0];
    cssDeclarations['background-color'] = getCssColor(fill.hex, fill.opacity);
  }

  // Text Color (Solid paints on typography/text nodes)
  if ((node.semanticType === 'heading' || node.semanticType === 'bodyText') && node.styles?.fills && node.styles.fills.length > 0) {
    const fill = node.styles.fills[0];
    cssDeclarations.color = getCssColor(fill.hex, fill.opacity);
  }

  // Borders & Strokes
  if (node.styles?.strokes && node.styles.strokes.length > 0) {
    const stroke = node.styles.strokes[0];
    const weight = node.styles.strokeWeight ?? 1;
    cssDeclarations.border = `${weight}px solid ${getCssColor(stroke.hex, stroke.opacity)}`;
  }

  // Border Radius
  if (node.styles?.borderRadius !== undefined) {
    cssDeclarations['border-radius'] = `${node.styles.borderRadius}px`;
  }

  // Opacity
  if (node.styles?.opacity !== undefined) {
    cssDeclarations.opacity = String(node.styles.opacity);
  }

  // Text alignment
  if (node.styles?.textAlign !== undefined) {
    cssDeclarations['text-align'] = node.styles.textAlign;
  }

  // Typography details
  if (node.styles?.typography) {
    const t = node.styles.typography;
    if (t.fontFamily) {
      cssDeclarations['font-family'] = `'${t.fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
    }
    if (t.fontSize !== undefined) {
      cssDeclarations['font-size'] = `${t.fontSize}px`;
    }
    if (t.fontWeight !== undefined) {
      cssDeclarations['font-weight'] = String(t.fontWeight);
    }
    if (t.lineHeight !== undefined) {
      cssDeclarations['line-height'] = `${t.lineHeight}px`;
    }
    if (t.letterSpacing !== undefined) {
      cssDeclarations['letter-spacing'] = `${t.letterSpacing}px`;
    }
  }

  // Width & Height for visual blocks
  if (node.semanticType === 'image' || node.semanticType === 'container' || node.semanticType === 'unknown') {
    if (node.layout?.width !== undefined) {
      cssDeclarations.width = `${node.layout.width}px`;
    }
    if (node.layout?.height !== undefined) {
      cssDeclarations.height = `${node.layout.height}px`;
    }
  }

  return cssDeclarations;
}

function getCssColor(hex: string, opacity: number): string {
  if (opacity === 1) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
