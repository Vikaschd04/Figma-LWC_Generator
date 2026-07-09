# Figma to Salesforce LWC Generator (Visual)

Convert Figma design screenshots and mockup images into standard Salesforce Lightning Web Components (LWC) and SLDS (Salesforce Lightning Design System) code using Gemini Vision AI.

---

## Features

- **Visual Translation**: Upload/select a Figma design screenshot image (PNG, JPG, SVG) and instantly convert it into clean, standards-compliant HTML, JS, CSS, and Meta-XML LWC files.
- **User Story Integration**: Interprets optional functional user story requirements to generate reactive variables, input change handlers, component events, and logic configurations.
- **Automatic SFDX Directory Detection**: Resolves Salesforce project structures (`sfdx-project.json`) and writes components directly into the local `force-app/main/default/lwc/` directory.

---

## Requirements & Prerequisites

- **Salesforce DX Project**: An active Salesforce DX workspace on your computer containing `sfdx-project.json`.
- **Figma Design Screenshot**: A PNG, JPG, or SVG screenshot of the selected component/frame from your Figma canvas.

---

## How to Use the Extension

1. **Take a Screenshot**:
   - Take a clear screenshot of the desired design frame in Figma and save it to your local machine.
2. **Execute inside VS Code**:
   - Open the Command Palette using `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows).
   - Type **`Figma to LWC: Generate Component from Image`** and hit Enter.
   - Select your saved design screenshot image file from the file dialog.
   - Enter your component name using camelCase notation (e.g. `cardRegisterAccount`).
   - Select a target layout framework (e.g. `lightning__RecordPage`).
   - Enter optional User Story details to inject active controls.
3. **Review**:
   - The extension automatically submits the image to the Vision compiler and writes the LWC bundle directly into your workspace's LWC folder.
   - Agree to open the LWC bundle in the editor window.
