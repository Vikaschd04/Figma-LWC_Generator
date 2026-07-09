# Figma to Salesforce LWC Accelerator

Internal enterprise tooling for helping Salesforce development teams convert Figma UI designs and user stories into clean, reviewable Lightning Web Component assets.

The project is intentionally phased. Phase 0 establishes the repository structure, tooling, and documentation foundation only. Later phases will add typed Figma models, normalization, SLDS mapping, LWC generation, a backend API, a VS Code extension, and a Figma plugin.

## Why It Exists

Design-to-code output often creates brittle markup, inline styles, and code that does not match Salesforce delivery standards. This accelerator prioritizes LWC best practices, SLDS compatibility, maintainability, developer review, testability, and documentation over pixel-perfect but hard-to-own generated code.

## Architecture Overview

- `apps/backend`: Express API for normalization, mapping, user-story-driven blueprint compilation, and LWC generation.
- `apps/figma-plugin`: Figma editor plugin for real-time selection frame extraction and LWC file previewing.
- `apps/vscode-extension`: VS Code extension for importing design selections from clipboard, resolving local Salesforce DX directories, and generating files.
- `packages/core`: Shared orchestration: normalizer, classifier, blueprint compiler, and quality/a11y validation.
- `packages/schemas`: Shared Zod validation schemas and TypeScript model definitions.
- `packages/lwc-generator`: LWC code generator parsing mapped trees and blueprints.
- `packages/slds-mapper`: Design element mapping to Salesforce base components and SLDS layouts.
- `packages/test-fixtures`: Shared Figma selection JSON fixtures.
- `docs`: Project architecture and developer user guides.

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
```

Useful quality checks:

```bash
npm run lint
```

Strict compiler and formatter checks:

```bash
npm run typecheck
npm run format:check
```

## Current MVP Capabilities

- **Figma Integration**: Real-time selected frame parser traversing nested flex directions and Solid fills.
- **Normalizer**: Transforms figma channels, paddings, borders, and margins into structural layout grids.
- **Semantic Classifier**: Analyzes node style ratios, sizing, and names to identify inputs, cards, and buttons.
- **SLDS Mapper**: Converts semantic targets into Salesforce base controls (`lightning-input`, `lightning-button`, `lightning-icon`) and SLDS grid patterns.
- **Blueprint Compiler**: Scans product user stories for toast alerts, Apex controller calls, recordId contexts, and binds interactive inputs.
- **LWC Generator**: Emits standard, fully-fleshed markup, CSS stylesheet rules, metadata descriptor XMLs, and class lifecycle hooks.
- **Quality & Accessibility Validator**: Audits code outcomes against WCAG standard labels, alt properties, inline style blocks, and controller import decorators.
- **VS Code Extension**: Supports clipboard importing, local Salesforce DX paths auto-detection, and files previewing.

## Known Limitations

- Component classification is rule-based and intentionally conservative.
- Generated LWC behavior is a functional MVP (button clicks, form changes, toast alerts) and should be validated before production deployment.
