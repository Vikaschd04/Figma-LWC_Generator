export type FigmaNodeType =
  'FRAME' | 'COMPONENT' | 'INSTANCE' | 'TEXT' | 'RECTANGLE' | 'VECTOR' | 'GROUP';

export type FigmaLayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL';

export interface RawFigmaColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface RawFigmaPaint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'IMAGE';
  visible?: boolean;
  color?: RawFigmaColor;
}

export interface RawFigmaTextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeightPx?: number;
  letterSpacing?: number;
}

export interface RawFigmaNode {
  id: string;
  name: string;
  type: FigmaNodeType;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  layoutMode?: FigmaLayoutMode;
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  cornerRadius?: number;
  characters?: string;
  fills?: RawFigmaPaint[];
  strokes?: RawFigmaPaint[];
  strokeWeight?: number;
  style?: RawFigmaTextStyle;
  children?: RawFigmaNode[];
}

export type SemanticNodeType =
  | 'container'
  | 'layout'
  | 'card'
  | 'heading'
  | 'bodyText'
  | 'button'
  | 'badge'
  | 'icon'
  | 'image'
  | 'input'
  | 'unknown';

export type LayoutDirection = 'none' | 'row' | 'column';

export interface NormalizedSpacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface NormalizedLayout {
  direction: LayoutDirection;
  width?: number;
  height?: number;
  gap?: number;
  padding?: NormalizedSpacing;
}

export interface NormalizedColor {
  hex: string;
  opacity: number;
}

export interface NormalizedTypography {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
}

export interface NormalizedStyle {
  fills: NormalizedColor[];
  strokes: NormalizedColor[];
  strokeWeight?: number;
  borderRadius?: number;
  typography?: NormalizedTypography;
}

export interface NormalizedDesignNode {
  id: string;
  name: string;
  semanticType: SemanticNodeType;
  layout?: NormalizedLayout;
  text?: string;
  styles?: NormalizedStyle;
  children: NormalizedDesignNode[];
}

export interface ComponentClassification {
  semanticType: SemanticNodeType;
  confidence: number;
  reason: string;
  warnings: string[];
}

export interface ClassifiedDesignNode extends NormalizedDesignNode {
  classification: ComponentClassification;
  children: ClassifiedDesignNode[];
}

export type SldsRenderKind = 'lightning' | 'html';

export interface SldsMappedNode {
  id: string;
  name: string;
  semanticType: SemanticNodeType;
  renderKind: SldsRenderKind;
  tagName: string;
  classes: string[];
  attributes: Record<string, string>;
  text?: string;
  cssDeclarations: Record<string, string>;
  warnings: string[];
  children: SldsMappedNode[];
}

export type GeneratedFileKind = 'html' | 'js' | 'css' | 'metaXml' | 'readme' | 'apex' | 'jest';

export interface GeneratedFile {
  path: string;
  kind: GeneratedFileKind;
  content: string;
}

export interface GeneratedLwcBundle {
  componentName: string;
  files: GeneratedFile[];
  warnings: string[];
}

export type ValidationSeverity = 'info' | 'warning' | 'error';

export interface ValidationMessage {
  code: string;
  severity: ValidationSeverity;
  message: string;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  messages: ValidationMessage[];
}

export interface UserStory {
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

export interface BlueprintProperty {
  name: string;
  type: string;
  defaultValue?: string;
  isApi: boolean;
  description?: string;
}

export interface BlueprintEventHandler {
  name: string;
  domEvent: string;
  targetNodeId: string;
  actionKind: 'toast' | 'wire' | 'custom' | 'inputBinding';
  actionDetails?: Record<string, string>;
}

export interface FeatureBlueprint {
  componentName: string;
  properties: BlueprintProperty[];
  eventHandlers: BlueprintEventHandler[];
  imports: string[];
  warnings: string[];
}
