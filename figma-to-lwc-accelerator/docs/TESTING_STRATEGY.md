# Testing Strategy

## Unit Testing Approach

Unit tests will cover schema validation, normalization, classification, SLDS mapping, LWC generation, and validation rules as those phases are implemented.

Phase 1 unit tests cover valid and invalid raw Figma nodes, normalized design nodes, and generated file models through Zod schemas.

Phase 2 unit tests cover Figma tree normalization, hierarchy preservation, text extraction, auto layout conversion, style token conversion, and safe handling of missing optional fields.

Phase 3 unit tests cover semantic classification for cards, buttons, headings, badges, layout rows/columns, and unknown elements with warnings.

Phase 4 unit tests cover SLDS mapping for buttons, cards, text, unsupported nodes, and scoped CSS generation.

Phase 5 unit tests cover generated file names, nonempty output, record-page `recordId` behavior, and inline snapshots for generated HTML, JS, CSS, and meta XML.

Phase 6 backend tests cover health checks, normalization, LWC generation, validation failures, and internal error handling with Supertest.

Phase 9 unit tests cover keyword extraction rules (e.g. toast notification triggers, Apex imports, recordId page targets) and reactive data bindings inside the LWC generator.

Phase 10 unit tests cover the Accessibility (a11y) validation checks (missing input labels, button labels, alt text, icon alternativeText), inline styles checks, and JS controller decorator import audits.

## Integration Testing Approach

Integration tests validate end-to-end paths:

- Input design JSON + User Story parsed via Express backend `/api/generate-lwc` $\to$ verify code matches functional event boundaries and runs clean of validation errors.
- Local VS Code extensions importing the clipboard design payloads $\to$ validating files are written to standard Salesforce DX paths and loaded into editor windows.

## Snapshot Testing For Generated Code

Snapshot tests protect generated HTML, JavaScript, CSS, metadata XML, and component README output to ensure layout structures remain consistent.

## Manual QA Checklist

- Validate Figma plugin selection handling.
- Validate JSON preview and copy behavior.
- Validate LWC generation from sample JSON.
- Validate VS Code export behavior.
- Validate generated files inside a Salesforce DX project.

## Future E2E Testing Plan

Future hardening can add browser-level tests for the backend preview workflow, VS Code extension command tests, and manual Figma plugin QA scripts.

## Command Execution Checklist

Run all checks locally before merging:

```bash
# Run the Jest unit/integration test suites
npm test

# Verify global lint checks
npm run lint

# Verify type correctness
npm run typecheck

# Verify Prettier formats
npm run format:check
```
