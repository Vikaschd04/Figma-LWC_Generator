# Architecture

## System Architecture

The accelerator is organized as a TypeScript monorepo with three application surfaces and reusable shared packages.

- Figma plugin: extracts selected design data and produces raw Figma-style JSON.
- Backend service: validates, normalizes, classifies, maps, generates, and validates output.
- VS Code extension: lets a developer import design JSON, review generated files, and export LWC files into a Salesforce DX project.
- Shared packages: keep schema, normalization, mapping, generation, and fixtures independent from any single UI.

## Package Responsibilities

- `packages/core`: shared orchestration and cross-package utilities.
- `packages/schemas`: raw Figma, normalized design, classification, generated file, and validation schemas.
- `packages/slds-mapper`: rules for mapping classified nodes to Lightning base components, semantic HTML, SLDS classes, and scoped CSS needs.
- `packages/lwc-generator`: creates LWC file contents from mapped design trees.
- `packages/test-fixtures`: reusable Figma-like JSON and expected-output fixtures.

## Core Model Contracts

Phase 1 introduces behavior-free TypeScript contracts and Zod schemas in `packages/schemas`.

- Raw Figma models capture selected node data, hierarchy, dimensions, auto layout hints, text, fills, strokes, radius, and typography.
- Normalized design models capture stable semantic nodes with layout, text, styles, and children.
- Classification models capture semantic type, confidence, reason, and warnings.
- Generated file models capture output path, file kind, and content.
- Validation models capture pass/fail state and structured messages.

The `packages/core` package re-exports these contracts so application layers can consume a single shared public surface while implementation packages remain separately testable.

## Data Flow

1. A selected Figma node is extracted by the plugin or pasted into the VS Code extension.
2. Raw JSON is validated against schema models.
3. Raw design data is normalized into a stable intermediate tree.
4. Normalized nodes are classified into semantic UI types.
5. Classified nodes are mapped to SLDS and LWC rendering primitives.
6. The generator creates LWC files and supporting documentation.
7. Validation checks run before files are exported.

## Figma To Normalized Design Pipeline

`normalizeFigmaTree(rawNode)` transforms validated `RawFigmaNode` trees into `NormalizedDesignNode` trees.

The Phase 2 normalizer:

- Validates input with `rawFigmaNodeSchema`.
- Preserves node hierarchy recursively.
- Converts Figma `layoutMode` into normalized `row`, `column`, or `none` direction.
- Preserves dimensions, gap, and padding as normalized layout data.
- Converts solid visible paints into normalized hex colors and opacity.
- Preserves stroke weight, border radius, text content, and text style values.
- Applies basic raw-type semantic defaults only.

The normalizer does not classify UI intent such as button, card, badge, heading, or body text beyond initial defaults. That richer semantic pass belongs to Phase 3.

## Normalized Design To LWC Generation Pipeline

Normalized nodes are classified with `ComponentClassification`, then mapped to Salesforce-safe rendering primitives with `SldsMappedNode`.

The Phase 4 mapper:

- Converts buttons, inputs, and icons to Lightning base component targets.
- Converts cards, headings, body text, badges, images, containers, and layouts to semantic HTML plus SLDS classes.
- Uses SLDS grid classes for row layouts.
- Emits scoped CSS declarations for column flex layouts and custom gaps.
- Carries classification warnings forward and adds mapping warnings for unsupported nodes or custom CSS needs.

Future phases will generate `GeneratedFile` outputs from the mapped tree and report warnings where a design cannot be represented cleanly with SLDS or Lightning base components.

Phase 5 adds `generateLwcBundle(input)`, which converts a mapped tree into a `GeneratedLwcBundle`.

The generator:

- Normalizes the requested component name to camelCase.
- Creates `.html`, `.js`, `.css`, `.js-meta.xml`, and optional `README.md` files.
- Renders Lightning base components and semantic HTML from mapped nodes.
- Emits scoped CSS only from mapped CSS declarations.
- Emits `@api recordId` only for record page targets.
- Carries warnings into the generated component README.

The generator does not invent Apex imports, Salesforce fields, object metadata, or business behavior.

## VS Code Extension Flow

Future phases will add commands for importing JSON, previewing generated LWC files, choosing a component name and output folder, preventing accidental overwrites, and writing files into a Salesforce DX project.

## Backend API Flow

Phase 6 exposes health, normalization, and LWC generation endpoints with request validation, safe error handling, and structured generation summaries.

- `GET /health` returns `{ "status": "ok" }`.
- `POST /api/normalize` accepts `{ "rawFigmaNode": ... }` and returns a normalized design tree.
- `POST /api/generate-lwc` accepts `componentName`, `rawFigmaNode`, and options, then returns generated files, warnings, and summary counts.

The backend orchestrates shared package logic only; normalization, classification, mapping, and generation remain in reusable packages.
