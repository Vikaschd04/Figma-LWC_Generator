# Figma to Salesforce LWC Accelerator (Visual-First)

An enterprise developer tooling monorepo that accelerates Salesforce LWC UI development by compiling Figma design screenshots and mockup images directly into high-fidelity, standard Salesforce Lightning Web Components (LWC) and SLDS layout structures using Gemini Vision LLM.

---

## Why It Exists

Standard design-to-code generators often yield fragile, non-semantic markup with heavy inline styles. This accelerator leverages Vision LLMs combined with SFDX directory resolution to output compliant, reviewable LWC packages:
- **Zero Inline Styles**: Enforces scoped CSS classes and SLDS layout patterns.
- **Salesforce Base Component Mapping**: Converts buttons, inputs, icons, and badges into Lightning counterparts rather than native divs.
- **Reactive JS Controllers**: Automatically wires fields, event handlers, and toast notifications from user stories.
- **Standard Salesforce DX Setup**: Places generated components directly into your local project workspace.

---

## Monorepo Architecture

- [apps/backend](file:///Users/vivekkumar/Desktop/Salesforce/LWC_Figma_Generator/Figma-LWC_Generator/figma-to-lwc-accelerator/apps/backend): A serverless Express backend deployed on Vercel that handles OpenRouter Vision AI generation using a robust multi-model fallback chain (`google/gemini-3.5-flash` -> `google/gemini-2.5-flash`).
- [apps/figma-plugin](file:///Users/vivekkumar/Desktop/Salesforce/LWC_Figma_Generator/Figma-LWC_Generator/figma-to-lwc-accelerator/apps/figma-plugin): A Figma Developer plugin that captures high-res PNG layouts and displays the generated LWC source codes dynamically in the editor panels.
- [apps/vscode-extension](file:///Users/vivekkumar/Desktop/Salesforce/LWC_Figma_Generator/Figma-LWC_Generator/figma-to-lwc-accelerator/apps/vscode-extension): A VS Code extension allowing developers to select a local design image file and write LWC bundles directly to disk.

---

## Install & Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set your OpenRouter environment key:
   ```bash
   export OPENROUTER_API_KEY="your_api_key_here"
   ```
3. Run the backend API:
   ```bash
   npm run dev:backend
   ```
4. Run tests:
   ```bash
   npm test
   ```
