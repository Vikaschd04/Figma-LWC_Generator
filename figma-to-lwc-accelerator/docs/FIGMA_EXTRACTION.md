# Figma Extraction

## Extracted Data

Extraction logic is not implemented yet. Phase 1 defines the raw payload shape future extraction must produce: hierarchy, node IDs, node names, node types, dimensions, coordinates, layout mode, spacing, padding, text, fills, strokes, stroke weight, radius, and selected text style properties.

Phase 2 adds normalization for this raw shape. The normalizer consumes the raw payload and produces a stable intermediate design tree with only the fields downstream classifiers and generators should need.

## Supported Figma Node Types

Initial schema support:

- `FRAME`
- `COMPONENT`
- `INSTANCE`
- `TEXT`
- `RECTANGLE`
- `VECTOR`
- `GROUP`

## Unsupported Figma Node Types

Unsupported nodes will be preserved as generic nodes when useful and surfaced as warnings when they cannot be mapped safely.

The raw schema currently rejects unsupported node types so plugin and import flows can fail early with actionable feedback. Later extraction work may add an explicit unsupported-node wrapper if preserving unknown nodes proves useful.

## Layer Naming Recommendations

Designers should use names that express intent, such as `Card / Account Health`, `Button / Primary`, `Title`, `Subtitle`, `Status Badge`, and `Icon / Utility`.

Phase 3 classification uses layer names as one signal. Clear names improve classification confidence for cards, buttons, headings, badges, icons, images, and inputs. Ambiguous decorative or unnamed layers may remain `unknown` and produce warnings.

## Auto Layout Handling

The raw model accepts `layoutMode`, `itemSpacing`, and padding fields. Future normalization will convert those values into `NormalizedLayout.direction`, `gap`, and `padding` so later mapping can choose SLDS grid classes or scoped component CSS.

Implemented Phase 2 behavior:

- `HORIZONTAL` maps to `row`.
- `VERTICAL` maps to `column`.
- `NONE` or missing layout mode maps to `none` when other layout data exists.
- `itemSpacing` maps to `gap`.
- Individual padding fields map to normalized top, right, bottom, and left values with missing sides defaulting to `0`.

## Token Handling

Phase 1 models separate raw Figma paint/text style fields from normalized color, spacing, typography, radius, and border fields. Mapping will prefer SLDS classes and Salesforce-compatible styling patterns before custom CSS.

Implemented Phase 2 token behavior:

- Visible solid fills and strokes are converted from Figma RGB channel values to hex colors.
- Paint alpha becomes normalized opacity and defaults to `1`.
- Text style fields map to normalized typography fields.
- Corner radius maps to normalized border radius.
- Stroke weight maps to normalized stroke weight.
