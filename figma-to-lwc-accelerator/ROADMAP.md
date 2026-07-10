# Roadmap — Figma to Salesforce LWC Accelerator

## Phase 14: Visual Correctness & Layout Enhancements (Next Phase)

- **LWC Visual Comparison Tool**:
  * Build a test rendering harness to mount generated LWC code inside a headless browser (Puppeteer) and capture a screenshot.
  * Compare LWC screenshots against the original Figma mockup image using pixel-diff algorithms to compute a layout deviation score.
- **SLDS Token Extraction**:
  * Parse CSS custom property styles directly from the design image to map color palettes and margins into standard SLDS global styling hooks (`--slds-c-card-*`).
- **Interactive Component Stubs**:
  * Generate stub integrations for Apex `@wire` adapters if the visual layout suggests standard query components (e.g. data tables, form inputs).

---

## Phase 15: Developer Workflows & Integrations

- **VS Code Clipboard Image Detection**:
  * Automatically detect when a PNG is copied to the clipboard and offer to generate the LWC component directly.
- **Apex Controller Autogeneration**:
  * Create accompanying Apex controller classes to back up LWC component actions when backend data transactions are requested.
