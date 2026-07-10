# Figma to Salesforce LWC Generator (Visual-First)

Convert Figma design screenshots and mockup images into production-ready Salesforce Lightning Web Components (LWC) using Gemini Vision AI.

---

## Key Capabilities

- **Fidelity-First Custom Styling**: Instructs the LLM to output custom HTML containers and precise CSS selector rules in `.css` instead of generic SLDS card classes, preserving margins, rounded corners, and background fills exactly as they appear in the Figma mockup.
- **Zero Functionality Assumption**: Focuses exclusively on recreating the design screenshot exactly, without generating imaginary controllers, Apex bindings, or fake state variables.
- **Local Visual Verification**: After writing the LWC files to disk, the extension automatically spins up a local headless browser to render the component, compares it pixel-by-pixel against the design mockup, and logs a Layout Similarity Score to the Output Channel while saving a highlight overlay (`visual-diff-output.png`) in the component folder.

---

## How to Use the Extension

1. Save a clear screenshot of the desired design frame in Figma as a PNG or JPG.
2. Open the Command Palette using `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows).
3. Select **`Figma to LWC: Generate Component from Image`**.
4. Choose your design screenshot image file.
5. Provide a camelCase LWC component name (e.g. `cardRegisterAccount`) and select a layout target.
6. Review the **Figma to LWC Output Channel** for the similarity index report and layout difference score.
