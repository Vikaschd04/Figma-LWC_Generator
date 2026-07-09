/// <reference types="@figma/plugin-typings" />

figma.showUI(__html__, { width: 500, height: 650 });

function sendSelection() {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'selection', node: null });
    return;
  }

  const rootNode = selection[0];
  const serialized = serializeNode(rootNode);
  figma.ui.postMessage({ type: 'selection', node: serialized });
}

// Send initial selection on load
sendSelection();

// Watch for selection changes
figma.on('selectionchange', () => {
  sendSelection();
});

// Listen for notifications or messages from UI
figma.ui.onmessage = (msg: { type: string; message?: string }) => {
  if (msg.type === 'notify' && msg.message) {
    figma.notify(msg.message);
  }
};

interface SerializedPaint {
  type: string;
  visible?: boolean;
  color?: { r: number; g: number; b: number; a?: number };
}

interface SerializedTextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeightPx?: number;
  letterSpacing?: number;
}

interface SerializedNode {
  id: string;
  name: string;
  type: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  layoutMode?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  layoutAlign?: string;
  layoutGrow?: number;
  primaryAxisSizingMode?: string;
  counterAxisSizingMode?: string;
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  cornerRadius?: number;
  opacity?: number;
  characters?: string;
  fills?: SerializedPaint[];
  strokes?: SerializedPaint[];
  strokeWeight?: number;
  style?: SerializedTextStyle;
  textAlignHorizontal?: string;
  children?: SerializedNode[];
}

function serializeNode(node: SceneNode): SerializedNode {
  const result: SerializedNode = {
    id: node.id,
    name: node.name,
    type: node.type
  };

  // Dimensions and Coordinates
  if ('width' in node && typeof node.width === 'number') {
    result.width = node.width;
  }
  if ('height' in node && typeof node.height === 'number') {
    result.height = node.height;
  }
  if ('x' in node && typeof node.x === 'number') {
    result.x = node.x;
  }
  if ('y' in node && typeof node.y === 'number') {
    result.y = node.y;
  }

  // Auto Layout settings
  if ('layoutMode' in node && typeof node.layoutMode === 'string') {
    result.layoutMode = node.layoutMode; // 'HORIZONTAL', 'VERTICAL', or 'NONE'

    if ('itemSpacing' in node && typeof node.itemSpacing === 'number') {
      result.itemSpacing = node.itemSpacing;
    }
    if ('paddingTop' in node && typeof node.paddingTop === 'number') {
      result.paddingTop = node.paddingTop;
    }
    if ('paddingRight' in node && typeof node.paddingRight === 'number') {
      result.paddingRight = node.paddingRight;
    }
    if ('paddingBottom' in node && typeof node.paddingBottom === 'number') {
      result.paddingBottom = node.paddingBottom;
    }
    if ('paddingLeft' in node && typeof node.paddingLeft === 'number') {
      result.paddingLeft = node.paddingLeft;
    }
    if ('primaryAxisAlignItems' in node && typeof node.primaryAxisAlignItems === 'string') {
      result.primaryAxisAlignItems = node.primaryAxisAlignItems;
    }
    if ('counterAxisAlignItems' in node && typeof node.counterAxisAlignItems === 'string') {
      result.counterAxisAlignItems = node.counterAxisAlignItems;
    }
    if ('primaryAxisSizingMode' in node && typeof node.primaryAxisSizingMode === 'string') {
      result.primaryAxisSizingMode = node.primaryAxisSizingMode;
    }
    if ('counterAxisSizingMode' in node && typeof node.counterAxisSizingMode === 'string') {
      result.counterAxisSizingMode = node.counterAxisSizingMode;
    }
  }

  // Layout alignments for children of Auto Layouts
  if ('layoutAlign' in node && typeof node.layoutAlign === 'string') {
    result.layoutAlign = node.layoutAlign;
  }
  if ('layoutGrow' in node && typeof node.layoutGrow === 'number') {
    result.layoutGrow = node.layoutGrow;
  }

  // Opacity
  if ('opacity' in node && typeof node.opacity === 'number') {
    result.opacity = node.opacity;
  }

  // Corner Radius
  if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
    result.cornerRadius = node.cornerRadius;
  }

  // Text Nodes specifics
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    result.characters = textNode.characters;
    const textStyle: SerializedTextStyle = {};

    const fontName = textNode.fontName;
    if (fontName && typeof fontName !== 'symbol') {
      textStyle.fontFamily = fontName.family;
    }

    const fontSize = textNode.fontSize;
    if (typeof fontSize === 'number') {
      textStyle.fontSize = fontSize;
    }

    const fontWeight = textNode.fontWeight;
    if (typeof fontWeight === 'number') {
      textStyle.fontWeight = fontWeight;
    }

    const lineHeight = textNode.lineHeight;
    if (lineHeight && typeof lineHeight !== 'symbol' && lineHeight.unit === 'PIXELS') {
      textStyle.lineHeightPx = lineHeight.value;
    }

    const letterSpacing = textNode.letterSpacing;
    if (letterSpacing && typeof letterSpacing !== 'symbol' && letterSpacing.unit === 'PIXELS') {
      textStyle.letterSpacing = letterSpacing.value;
    }

    result.style = textStyle;

    if ('textAlignHorizontal' in node && typeof node.textAlignHorizontal === 'string') {
      result.textAlignHorizontal = node.textAlignHorizontal;
    }
  }

  // Fills & Strokes
  if ('fills' in node && Array.isArray(node.fills)) {
    result.fills = serializePaints(node.fills);
  }
  if ('strokes' in node && Array.isArray(node.strokes)) {
    result.strokes = serializePaints(node.strokes);

    if ('strokeWeight' in node && typeof node.strokeWeight === 'number') {
      result.strokeWeight = node.strokeWeight;
    }
  }

  // Recursive Children
  if ('children' in node && Array.isArray(node.children)) {
    result.children = node.children.map(serializeNode);
  }

  return result;
}

function serializePaints(paints: readonly Paint[]): SerializedPaint[] {
  return paints
    .filter(
      (paint) =>
        paint.visible !== false &&
        (paint.type === 'SOLID' || paint.type === 'GRADIENT_LINEAR' || paint.type === 'IMAGE')
    )
    .map((paint) => {
      const serialized: SerializedPaint = {
        type: paint.type,
        visible: paint.visible
      };

      if (paint.type === 'SOLID' && 'color' in paint) {
        serialized.color = {
          r: paint.color.r,
          g: paint.color.g,
          b: paint.color.b,
          a: paint.opacity ?? 1
        };
      }

      return serialized;
    });
}
