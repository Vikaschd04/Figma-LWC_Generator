import { z } from 'zod';

export const figmaNodeTypeSchema = z.enum([
  'FRAME',
  'COMPONENT',
  'INSTANCE',
  'TEXT',
  'RECTANGLE',
  'VECTOR',
  'GROUP'
]);

export const figmaLayoutModeSchema = z.enum(['NONE', 'HORIZONTAL', 'VERTICAL']);
export const figmaAxisAlignSchema = z.enum(['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN', 'BASELINE']);
export const figmaSizingModeSchema = z.enum(['FIXED', 'HUG', 'FILL']);
export const figmaTextAlignSchema = z.enum(['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED']);

export const rawFigmaColorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
  a: z.number().min(0).max(1).optional()
});

export const rawFigmaPaintSchema = z.object({
  type: z.enum(['SOLID', 'GRADIENT_LINEAR', 'IMAGE']),
  visible: z.boolean().optional(),
  color: rawFigmaColorSchema.optional()
});

export const rawFigmaTextStyleSchema = z.object({
  fontFamily: z.string().min(1).optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.number().positive().optional(),
  lineHeightPx: z.number().positive().optional(),
  letterSpacing: z.number().optional()
});

export const rawFigmaNodeSchema: z.ZodType<{
  id: string;
  name: string;
  type: z.infer<typeof figmaNodeTypeSchema>;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  layoutMode?: z.infer<typeof figmaLayoutModeSchema>;
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
  fills?: z.infer<typeof rawFigmaPaintSchema>[];
  strokes?: z.infer<typeof rawFigmaPaintSchema>[];
  strokeWeight?: number;
  style?: z.infer<typeof rawFigmaTextStyleSchema>;
  textAlignHorizontal?: string;
  children?: z.infer<typeof rawFigmaNodeSchema>[];
}> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: figmaNodeTypeSchema,
    width: z.number().nonnegative().optional(),
    height: z.number().nonnegative().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    layoutMode: figmaLayoutModeSchema.optional(),
    primaryAxisAlignItems: z.string().optional(),
    counterAxisAlignItems: z.string().optional(),
    layoutAlign: z.string().optional(),
    layoutGrow: z.number().optional(),
    primaryAxisSizingMode: z.string().optional(),
    counterAxisSizingMode: z.string().optional(),
    itemSpacing: z.number().nonnegative().optional(),
    paddingTop: z.number().nonnegative().optional(),
    paddingRight: z.number().nonnegative().optional(),
    paddingBottom: z.number().nonnegative().optional(),
    paddingLeft: z.number().nonnegative().optional(),
    cornerRadius: z.number().nonnegative().optional(),
    opacity: z.number().optional(),
    characters: z.string().optional(),
    fills: z.array(rawFigmaPaintSchema).optional(),
    strokes: z.array(rawFigmaPaintSchema).optional(),
    strokeWeight: z.number().nonnegative().optional(),
    style: rawFigmaTextStyleSchema.optional(),
    textAlignHorizontal: z.string().optional(),
    children: z.array(rawFigmaNodeSchema).optional()
  })
);

export const semanticNodeTypeSchema = z.enum([
  'container',
  'layout',
  'card',
  'heading',
  'bodyText',
  'button',
  'badge',
  'icon',
  'image',
  'input',
  'unknown'
]);

export const layoutDirectionSchema = z.enum(['none', 'row', 'column']);

export const normalizedSpacingSchema = z.object({
  top: z.number().nonnegative(),
  right: z.number().nonnegative(),
  bottom: z.number().nonnegative(),
  left: z.number().nonnegative()
});

export const normalizedLayoutSchema = z.object({
  direction: layoutDirectionSchema,
  width: z.number().nonnegative().optional(),
  height: z.number().nonnegative().optional(),
  gap: z.number().nonnegative().optional(),
  padding: normalizedSpacingSchema.optional(),
  justifyContent: z.string().optional(),
  alignItems: z.string().optional(),
  flexGrow: z.number().optional()
});

export const normalizedColorSchema = z.object({
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  opacity: z.number().min(0).max(1)
});

export const normalizedTypographySchema = z.object({
  fontFamily: z.string().min(1).optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.number().positive().optional(),
  lineHeight: z.number().positive().optional(),
  letterSpacing: z.number().optional()
});

export const normalizedStyleSchema = z.object({
  fills: z.array(normalizedColorSchema),
  strokes: z.array(normalizedColorSchema),
  strokeWeight: z.number().nonnegative().optional(),
  borderRadius: z.number().nonnegative().optional(),
  opacity: z.number().optional(),
  textAlign: z.string().optional(),
  typography: normalizedTypographySchema.optional()
});

export const normalizedDesignNodeSchema: z.ZodType<{
  id: string;
  name: string;
  semanticType: z.infer<typeof semanticNodeTypeSchema>;
  layout?: z.infer<typeof normalizedLayoutSchema>;
  text?: string;
  styles?: z.infer<typeof normalizedStyleSchema>;
  children: z.infer<typeof normalizedDesignNodeSchema>[];
}> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    semanticType: semanticNodeTypeSchema,
    layout: normalizedLayoutSchema.optional(),
    text: z.string().optional(),
    styles: normalizedStyleSchema.optional(),
    children: z.array(normalizedDesignNodeSchema)
  })
);

export const componentClassificationSchema = z.object({
  semanticType: semanticNodeTypeSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  warnings: z.array(z.string())
});

export const generatedFileKindSchema = z.enum([
  'html',
  'js',
  'css',
  'metaXml',
  'readme',
  'apex',
  'jest'
]);

export const generatedFileSchema = z.object({
  path: z.string().min(1),
  kind: generatedFileKindSchema,
  content: z.string()
});

export const generatedLwcBundleSchema = z.object({
  componentName: z.string().regex(/^[a-z][a-zA-Z0-9]*$/),
  files: z.array(generatedFileSchema).min(1),
  warnings: z.array(z.string())
});

export const validationSeveritySchema = z.enum(['info', 'warning', 'error']);

export const validationMessageSchema = z.object({
  code: z.string().min(1),
  severity: validationSeveritySchema,
  message: z.string().min(1),
  path: z.string().optional()
});

export const validationResultSchema = z.object({
  valid: z.boolean(),
  messages: z.array(validationMessageSchema)
});

export const userStorySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  acceptanceCriteria: z.array(z.string())
});

export const blueprintPropertySchema = z.object({
  name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  type: z.string().min(1),
  defaultValue: z.string().optional(),
  isApi: z.boolean(),
  description: z.string().optional()
});

export const blueprintEventHandlerSchema = z.object({
  name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  domEvent: z.string().min(1),
  targetNodeId: z.string().min(1),
  actionKind: z.enum(['toast', 'wire', 'custom', 'inputBinding']),
  actionDetails: z.record(z.string(), z.string()).optional()
});

export const featureBlueprintSchema = z.object({
  componentName: z.string().regex(/^[a-z][a-zA-Z0-9]*$/),
  properties: z.array(blueprintPropertySchema),
  eventHandlers: z.array(blueprintEventHandlerSchema),
  imports: z.array(z.string()),
  warnings: z.array(z.string())
});

export function validateRawFigmaNode(input: unknown) {
  return rawFigmaNodeSchema.safeParse(input);
}

export function validateNormalizedDesignNode(input: unknown) {
  return normalizedDesignNodeSchema.safeParse(input);
}

export function validateGeneratedFile(input: unknown) {
  return generatedFileSchema.safeParse(input);
}

export function validateUserStory(input: unknown) {
  return userStorySchema.safeParse(input);
}

export function validateFeatureBlueprint(input: unknown) {
  return featureBlueprintSchema.safeParse(input);
}
