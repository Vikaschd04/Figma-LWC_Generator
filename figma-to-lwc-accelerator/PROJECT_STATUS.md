# Project Status

## Current Phase

Phase 12: MVP Hardening.

## Completed Phases

- Phase 0: Repository Setup.
- Phase 1: Define Core Data Models.
- Phase 2: Build Figma JSON Normalizer.
- Phase 3: Build Component Classifier.
- Phase 4: Build SLDS Mapping Engine.
- Phase 5: Build LWC Code Generator.
- Phase 6: Build Backend API.
- Phase 7: Build VS Code Extension MVP.
- Phase 8: Build Figma Plugin MVP.
- Phase 9: Add User Story Input and Feature Blueprint.
- Phase 10: Add Validation and Quality Checks.
- Phase 11: Add Sample Generated Components.

## Pending Phases

- Phase 12: MVP Hardening.

## Working Features

- Repository scaffold.
- npm workspace configuration.
- TypeScript typecheck command.
- Jest smoke test.
- ESLint command.
- Prettier check command.
- Raw Figma node TypeScript interfaces and Zod schemas.
- Normalized design node TypeScript interfaces and Zod schemas.
- Component classification, generated file, generated bundle, and validation result models.
- Schema validation helpers for raw Figma nodes, normalized nodes, and generated files.
- `normalizeFigmaTree` converts raw Figma-style node trees into normalized design node trees.
- Normalizer preserves hierarchy, dimensions, layout direction, spacing, padding, text, fills, borders, radius, and typography.
- Account Health Card fixture is available in `packages/test-fixtures`.
- `classifyDesignNode` converts normalized design trees into classified design trees.
- Classifier detects cards, headings, body text, buttons, badges, icons, images, inputs, layout containers, and unknown nodes.
- Classifications include confidence, reason, and warnings.
- `mapToSlds` converts classified design trees into mapped render trees.
- Mapper supports Lightning base component targets for buttons, inputs, and icons.
- Mapper supports SLDS/semantic HTML targets for cards, headings, body text, badges, layouts, images, containers, and unknown nodes.
- Mapper emits warnings and scoped CSS declarations when custom CSS is required.
- `generateLwcBundle` converts mapped trees into LWC HTML, JS, CSS, meta XML, and optional README output.
- Generator creates camelCase component folders and file names.
- Generator includes `@api recordId` only for record page targets.
- Generator snapshot tests cover HTML, JS, CSS, and meta XML.
- Backend Express app exposes `GET /health`, `POST /api/normalize`, and `POST /api/generate-lwc`.
- Backend validates requests with Zod and returns safe validation/internal error responses.
- VS Code extension is functional under `apps/vscode-extension`.
- VS Code extension commands support pasting Figma JSON from the clipboard or picking a file from the workspace.
- VS Code extension automatically resolves target output folder in Salesforce DX projects (detects `sfdx-project.json`).
- VS Code extension executes full normalizer, classifier, mapper, and generator locally and self-contained.
- VS Code extension opens generated files in the workspace editor for developer review.
- Figma plugin is functional under `apps/figma-plugin`.
- Figma plugin extracts selected frames recursively, serializing them into raw design JSON.
- Figma plugin UI renders a Salesforce-themed dashboard for copying JSON or calling the LWC generation API.
- Figma plugin UI provides built-in tabbed previewing for generated LWC HTML, JS, CSS, Meta-XML, and README files.
- Blueprint Compiler compiles User Story context (keywords like toast, Apex, recordId) and maps them to functional event bindings.
- LWC Generator supports Feature Blueprint, dynamically injecting state variables, change handlers, toast actions, and base component bindings.
- Quality Validation engine parses accessibility rules and reports styling warnings before output.
- Automated code generation script (`scripts/generate-samples.ts`) compiles LWC component samples directly using pipeline modules.
- Vercel Serverless deployment files (`api/index.ts`, `vercel.json`) are configured to support instant cloud hosting.

## Broken Or Incomplete Features

- Integration testing on real Salesforce Org pages is pending.

## Important Technical Decisions

- Use a TypeScript npm workspace monorepo.
- Keep design parsing, classification, mapping, and LWC generation in reusable packages.
- Start with rule-based generation before introducing optional AI-assisted recommendations.
- Prefer Salesforce Lightning base components and SLDS classes over custom markup and styles.
- Use Zod for runtime validation at package and API boundaries.
- Keep Phase 1 models behavior-free so later phases can evolve pipeline logic independently.
- Normalize raw Figma data before classification so downstream packages can avoid Figma-specific field handling.
- Treat Phase 2 semantic types as initial raw-type defaults only; richer UI intent belongs in Phase 3 classification.
- Keep classification rule-based and explainable so developers can review generated intent before code export.
- Treat classifier confidence as review guidance, not an automatic source of truth.
- Keep SLDS mapping separate from LWC file generation so Phase 5 can render mapped trees without repeating design heuristics.
- Prefer Lightning base components and SLDS classes before scoped CSS.
- Generate simple LWC controllers and avoid fake Apex imports or invented Salesforce metadata.
- Keep generated README warnings visible for developer review.
- Keep backend orchestration thin; reusable pipeline logic stays in packages.

## Current Risks

- Future phases must avoid overfitting to a single Figma fixture.
- SLDS mapping needs clear fallback rules for unsupported design styles.
- VS Code and Figma plugin testing will require a mix of automated and manual validation.
- Recursive schema changes require careful test coverage because raw and normalized design trees can be deeply nested.
- Normalization currently accepts only schema-supported Figma node and paint types.
- Classification is name and shape sensitive; ambiguous Figma layer names may produce generic containers or warnings.
- Current SLDS mapping uses a conservative default icon of `utility:info` until richer icon metadata is extracted.
- Generated components are structurally valid but do not implement business behavior or data wiring yet.
- Backend has no persistence, auth, rate limiting, or deployment hardening yet.
