# Figma to Salesforce LWC Accelerator (Visual-First)

An enterprise developer tooling monorepo that accelerates Salesforce LWC UI development by compiling Figma design screenshots and mockup images directly into high-fidelity, custom-styled Salesforce Lightning Web Components (LWC) using Gemini Vision LLM.

---

## Why It Exists

Standard design-to-code generators often yield generic markup that loses layout details or deviates when rendered in Salesforce Orgs. This accelerator prioritizes:
- **Highest Visual Fidelity (Custom CSS)**: Generates detailed, custom-scoped CSS selector rules inside `.css` rather than generic, standard-styled SLDS classes, preserving background color tones, padding ratios, border colors, and layout wraps exactly.
- **Zero Functionality Assumption**: Avoids compiling imaginary controller states or unverified integrations.
- **Automated Local Verification**: VS Code extension features a local visual correctness reporter that spins up Puppeteer to capture and compare the generated LWC component against the mockup, printing similarity indices directly to the developer's console output.

---

## Monorepo Architecture

- [apps/backend](file:///Users/vivekkumar/Desktop/Salesforce/LWC_Figma_Generator/Figma-LWC_Generator/figma-to-lwc-accelerator/apps/backend): Express API running a robust multi-model fallback chain (`google/gemini-3.5-flash` -> `google/gemini-2.5-flash`).
- [apps/figma-plugin](file:///Users/vivekkumar/Desktop/Salesforce/LWC_Figma_Generator/Figma-LWC_Generator/figma-to-lwc-accelerator/apps/figma-plugin): Figma Developer plugin for screenshot-based layout generation.
- [apps/vscode-extension](file:///Users/vivekkumar/Desktop/Salesforce/LWC_Figma_Generator/Figma-LWC_Generator/figma-to-lwc-accelerator/apps/vscode-extension): VS Code extension incorporating headless browser layout verification and visual diff overlays.
