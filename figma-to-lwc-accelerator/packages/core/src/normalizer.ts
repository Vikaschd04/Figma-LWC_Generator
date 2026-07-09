import {
  type FigmaLayoutMode,
  type LayoutDirection,
  type NormalizedColor,
  type NormalizedDesignNode,
  type NormalizedLayout,
  type NormalizedStyle,
  type NormalizedTypography,
  type RawFigmaColor,
  type RawFigmaNode,
  type RawFigmaPaint,
  type SemanticNodeType,
  rawFigmaNodeSchema
} from '../../schemas/src';

export function normalizeFigmaTree(rawNode: RawFigmaNode): NormalizedDesignNode {
  const node = rawFigmaNodeSchema.parse(rawNode);

  return normalizeNode(node);
}

function normalizeNode(node: RawFigmaNode): NormalizedDesignNode {
  const layout = normalizeLayout(node);
  const styles = normalizeStyle(node);
  const text = normalizeText(node);

  return {
    id: node.id,
    name: node.name,
    semanticType: inferInitialSemanticType(node),
    ...(layout ? { layout } : {}),
    ...(text !== undefined ? { text } : {}),
    ...(styles ? { styles } : {}),
    children: (node.children ?? []).map(normalizeNode)
  };
}

function inferInitialSemanticType(node: RawFigmaNode): SemanticNodeType {
  switch (node.type) {
    case 'FRAME':
    case 'COMPONENT':
    case 'INSTANCE':
    case 'GROUP':
      return 'container';
    case 'TEXT':
      return 'bodyText';
    case 'VECTOR':
      return 'icon';
    case 'RECTANGLE':
      return 'unknown';
  }
}

function normalizeLayout(node: RawFigmaNode): NormalizedLayout | undefined {
  const direction = normalizeLayoutDirection(node.layoutMode);
  const padding = normalizePadding(node);
  const justifyContent = mapJustifyContent(node.primaryAxisAlignItems);
  const alignItems = mapAlignItems(node.counterAxisAlignItems);
  const flexGrow = node.layoutGrow;

  const hasLayoutData =
    direction !== 'none' ||
    node.width !== undefined ||
    node.height !== undefined ||
    node.itemSpacing !== undefined ||
    padding !== undefined ||
    justifyContent !== undefined ||
    alignItems !== undefined ||
    flexGrow !== undefined;

  if (!hasLayoutData) {
    return undefined;
  }

  return {
    direction,
    ...(node.width !== undefined ? { width: node.width } : {}),
    ...(node.height !== undefined ? { height: node.height } : {}),
    ...(node.itemSpacing !== undefined ? { gap: node.itemSpacing } : {}),
    ...(padding ? { padding } : {}),
    ...(justifyContent !== undefined ? { justifyContent } : {}),
    ...(alignItems !== undefined ? { alignItems } : {}),
    ...(flexGrow !== undefined ? { flexGrow } : {})
  };
}

function normalizeLayoutDirection(layoutMode?: FigmaLayoutMode): LayoutDirection {
  if (layoutMode === 'HORIZONTAL') {
    return 'row';
  }

  if (layoutMode === 'VERTICAL') {
    return 'column';
  }

  return 'none';
}

function normalizePadding(node: RawFigmaNode): NormalizedLayout['padding'] {
  const hasPadding =
    node.paddingTop !== undefined ||
    node.paddingRight !== undefined ||
    node.paddingBottom !== undefined ||
    node.paddingLeft !== undefined;

  if (!hasPadding) {
    return undefined;
  }

  return {
    top: node.paddingTop ?? 0,
    right: node.paddingRight ?? 0,
    bottom: node.paddingBottom ?? 0,
    left: node.paddingLeft ?? 0
  };
}

function normalizeStyle(node: RawFigmaNode): NormalizedStyle | undefined {
  const fills = normalizePaints(node.fills);
  const strokes = normalizePaints(node.strokes);
  const typography = normalizeTypography(node);
  const textAlign = mapTextAlign(node.textAlignHorizontal);
  const opacity = node.opacity;
  const hasStyleData =
    fills.length > 0 ||
    strokes.length > 0 ||
    node.strokeWeight !== undefined ||
    node.cornerRadius !== undefined ||
    opacity !== undefined ||
    textAlign !== undefined ||
    typography !== undefined;

  if (!hasStyleData) {
    return undefined;
  }

  return {
    fills,
    strokes,
    ...(node.strokeWeight !== undefined ? { strokeWeight: node.strokeWeight } : {}),
    ...(node.cornerRadius !== undefined ? { borderRadius: node.cornerRadius } : {}),
    ...(opacity !== undefined ? { opacity } : {}),
    ...(textAlign !== undefined ? { textAlign } : {}),
    ...(typography ? { typography } : {})
  };
}

function normalizePaints(paints?: RawFigmaPaint[]): NormalizedColor[] {
  return (paints ?? [])
    .filter((paint) => paint.visible !== false && paint.type === 'SOLID' && paint.color)
    .map((paint) => normalizeColor(paint.color as RawFigmaColor));
}

function normalizeColor(color: RawFigmaColor): NormalizedColor {
  return {
    hex: `#${toHexChannel(color.r)}${toHexChannel(color.g)}${toHexChannel(color.b)}`,
    opacity: color.a ?? 1
  };
}

function toHexChannel(value: number): string {
  return Math.round(value * 255)
    .toString(16)
    .padStart(2, '0');
}

function normalizeTypography(node: RawFigmaNode): NormalizedTypography | undefined {
  if (!node.style) {
    return undefined;
  }

  return {
    ...(node.style.fontFamily ? { fontFamily: node.style.fontFamily } : {}),
    ...(node.style.fontSize !== undefined ? { fontSize: node.style.fontSize } : {}),
    ...(node.style.fontWeight !== undefined ? { fontWeight: node.style.fontWeight } : {}),
    ...(node.style.lineHeightPx !== undefined ? { lineHeight: node.style.lineHeightPx } : {}),
    ...(node.style.letterSpacing !== undefined ? { letterSpacing: node.style.letterSpacing } : {})
  };
}

function normalizeText(node: RawFigmaNode): string | undefined {
  if (node.type !== 'TEXT') {
    return undefined;
  }

  return node.characters ?? '';
}

function mapJustifyContent(align?: string): string | undefined {
  switch (align) {
    case 'MIN': return 'flex-start';
    case 'CENTER': return 'center';
    case 'MAX': return 'flex-end';
    case 'SPACE_BETWEEN': return 'space-between';
    default: return undefined;
  }
}

function mapAlignItems(align?: string): string | undefined {
  switch (align) {
    case 'MIN': return 'flex-start';
    case 'CENTER': return 'center';
    case 'MAX': return 'flex-end';
    case 'BASELINE': return 'baseline';
    default: return undefined;
  }
}

function mapTextAlign(align?: string): string | undefined {
  switch (align) {
    case 'LEFT': return 'left';
    case 'CENTER': return 'center';
    case 'RIGHT': return 'right';
    case 'JUSTIFIED': return 'justify';
    default: return undefined;
  }
}
