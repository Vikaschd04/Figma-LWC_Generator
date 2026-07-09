# Testing Strategy

## Unit Testing Approach

Unit tests will cover schema validation, normalization, classification, SLDS mapping, LWC generation, and validation rules as those phases are implemented.

Phase 1 unit tests cover valid and invalid raw Figma nodes, normalized design nodes, and generated file models through Zod schemas.

Phase 2 unit tests cover Figma tree normalization, hierarchy preservation, text extraction, auto layout conversion, style token conversion, and safe handling of missing optional fields.

Phase 3 unit tests cover semantic classification for cards, buttons, headings, badges, layout rows/columns, and unknown elements with warnings.

Phase 4 unit tests cover SLDS mapping for buttons, cards, text, unsupported nodes, and scoped CSS generation.

Phase 5 unit tests cover generated file names, nonempty output, record-page `recordId` behavior, and inline snapshots for generated HTML, JS, CSS, and meta XML.

Phase 6 backend tests cover health checks, normalization, LWC generation, validation failures, and internal error handling with Supertest.

## Integration Testing Approach

Integration tests will validate end-to-end flows from raw Figma-like JSON through generated LWC file output.

## Snapshot Testing For Generated Code

Snapshot tests will protect generated HTML, JavaScript, CSS, metadata XML, and component README output once the generator is implemented.

## Manual QA Checklist

- Validate Figma plugin selection handling.
- Validate JSON preview and copy behavior.
- Validate LWC generation from sample JSON.
- Validate VS Code export behavior.
- Validate generated files inside a Salesforce DX project.

## Future E2E Testing Plan

Future hardening can add browser-level tests for the backend preview workflow, VS Code extension command tests, and manual Figma plugin QA scripts.
