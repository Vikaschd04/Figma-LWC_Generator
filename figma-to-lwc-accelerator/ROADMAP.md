# Roadmap — Figma to Salesforce LWC Accelerator

## Phase 15: Visual Correctness Completed (Current Phase)

- **Headless visual correctness runner**:
  * Puppeteer visual screenshot comparison integrated directly inside VS Code extension.
  * Mismatch index similarity score logging and red delta overlays generation completed.
- **Precision prompt updates**:
  * Removed user stories logic.
  * Direct custom HTML/CSS generator instructions implemented.

---

## Phase 16: Future Quality Optimizations

- **VSIX Bundled Puppeteer Resolver**:
  * Bundle chromium executables within the vsix file package to guarantee zero installation overhead on developer workstations.
- **Dynamic CSS Variable Refinement**:
  * Auto-inject global Salesforce Design styling hook fallbacks into the generated `.css` selectors where applicable.
