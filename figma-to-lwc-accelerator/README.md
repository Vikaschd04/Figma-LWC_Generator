# Figma to Salesforce LWC Accelerator

Internal enterprise tooling for helping Salesforce development teams convert Figma UI designs and user stories into clean, reviewable Lightning Web Component assets.

The project is intentionally phased. Phase 0 establishes the repository structure, tooling, and documentation foundation only. Later phases will add typed Figma models, normalization, SLDS mapping, LWC generation, a backend API, a VS Code extension, and a Figma plugin.

## Why It Exists

Design-to-code output often creates brittle markup, inline styles, and code that does not match Salesforce delivery standards. This accelerator prioritizes LWC best practices, SLDS compatibility, maintainability, developer review, testability, and documentation over pixel-perfect but hard-to-own generated code.

## Architecture Overview

- `apps/backend`: future Node.js API for normalization, mapping, validation, and generation.
- `apps/figma-plugin`: future Figma plugin for selected frame extraction.
- `apps/vscode-extension`: future VS Code workflow for previewing and exporting generated LWC files.
- `packages/core`: shared orchestration and reusable utilities.
- `packages/schemas`: shared validation schemas and TypeScript models.
- `packages/lwc-generator`: future LWC file generation logic.
- `packages/slds-mapper`: future classified-design to SLDS mapping logic.
- `packages/test-fixtures`: shared Figma-style fixtures for tests.
- `generated-samples`: future generated demo components.
- `docs`: project architecture and engineering guidance.

## Install

```bash
npm install
```

## Run

Run the backend API:

```bash
npm run dev:backend
```

Useful checks:

```bash
curl http://localhost:3000/health
```

## Test

```bash
npm test
npm run lint
npm run typecheck
npm run format:check
```

## Current MVP Capabilities

- Monorepo folder structure is in place.
- TypeScript, Jest, ESLint, and Prettier are configured.
- A smoke test verifies the baseline test pipeline.
- Initial documentation exists for project continuity.
- Core TypeScript models exist for raw Figma nodes, normalized design nodes, classifications, generated files, and validation results.
- Zod validation utilities exist for raw Figma nodes, normalized design nodes, and generated files.
- Raw Figma-style JSON can be normalized into a stable intermediate design tree.
- A reusable Account Health Card raw Figma fixture is available for tests and future demo flows.
- Normalized design nodes can be classified into semantic UI types with confidence, reasons, and warnings.
- Classified design nodes can be mapped to Salesforce-oriented render primitives, Lightning base components, SLDS classes, and scoped CSS needs.
- Mapped render trees can generate LWC HTML, JavaScript, CSS, metadata XML, and component README files.
- Backend API exposes health, normalization, and LWC generation endpoints.

## Known Limitations

- No Figma extraction is implemented yet.
- Component classification is rule-based and intentionally conservative.
- Generated LWC behavior is intentionally minimal and requires developer review before deployment.
- VS Code extension and Figma plugin runtime are not implemented yet.
