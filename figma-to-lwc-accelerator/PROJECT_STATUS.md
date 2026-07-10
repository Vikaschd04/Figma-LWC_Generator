# Project Status — Figma to Salesforce LWC Accelerator

## Current Status
* **Phase 13: Vision LLM Image-to-Code Integration** is fully completed and operational in production.
* Both the Figma Plugin and the VS Code Extension are converted to be visual-first, utilizing design screenshots for LWC generation.

---

## Completed Milestones
- **Visual Capture Integration (Figma Plugin)**: Captures selections as PNG bytes and handles Base64 formatting inside `ui.html`.
- **VS Code Extension (Visual Input)**: Swapped raw JSON text entry for a native file picker prompting developers to select layout mockups (`PNG`, `JPG`, `SVG`) and writes the component directly to SFDX directories.
- **Serverless Backend (OpenRouter Fallback Chain)**: Exposed `/api/generate-lwc` which runs a robust sequential model fallback chain (`google/gemini-3.5-flash` at 2048 tokens -> `google/gemini-2.5-flash` at 4096 tokens) to satisfy billing and size constraints.
- **Clean Interface**: Completely deprecated complex AST mappings, rule-based normalizer stages, and clipboard JSON pastes.

---

## Supported Features
- Standard LWC generation with HTML templates, CSS style files, JS controller frameworks, and SFDX meta-XML configurations.
- Optional User Story integration for binding action behaviors, change tracking fields, and toast notices.
- Automatic SFDX project output path detection.
- Complete package-level verification check coverage.

---

## Next Phase Planning (Layout Efficiency & Correctness)
* **Visual Validation Comparison**: Render visual screenshot previews against compiled Salesforce component outputs and calculate rendering mismatch metrics.
* **Component Styling Hooks Integration**: Extract CSS variables directly from Figma design layouts to map them to Salesforce standard global design hooks.
