# Figma to Salesforce LWC Generator

Convert Figma layout designs and User Story blueprints into standard Salesforce Lightning Web Components (LWC) and SLDS (Salesforce Lightning Design System) code.

---

## Features

- **Instant Translation**: Convert Figma node design structures directly into clean, standards-compliant HTML, JS, CSS, and Meta-XML LWC files.
- **User Story Integration**: Interprets functional user story requirements to generate reactive variables, change handlers, component events, and Apex bindings dynamically.
- **Accessibility Auditing**: Built-in accessibility checker validations (contrast checks, missing labels, alternative alt text configurations).
- **Automatic SFDX Directory Detection**: Resolves project structures (`sfdx-project.json`) and writes components directly into the local `force-app/main/default/lwc/` directory.

---

## Requirements & Prerequisites

- **Salesforce DX Project**: An active Salesforce DX workspace on your computer containing `sfdx-project.json`.
- **Figma Account**: Figma plugin client containing the **Figma to Salesforce LWC Generator** plugin to export design JSON payload representations.

---

## How to Use the Extension

1. **Copy Design JSON from Figma**:
   - Open your layout file inside the Figma app.
   - Run the **Figma to Salesforce LWC Generator** plugin.
   - Open the **Raw JSON** tab and copy the node metadata payload.
2. **Execute inside VS Code**:
   - Open the Command Palette using `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows).
   - Type **`Figma to LWC: Generate Component from JSON`** and hit Enter.
   - Choose **📋 Paste JSON from Clipboard**.
   - Name your component using camelCase notation (e.g. `cardRegisterAccount`).
   - Select a target layout framework (e.g. `lightning__RecordPage`).
3. **Review**:
   - The extension automatically transpiles the markup and places the output files inside your workspace LWC folder.
   - Read the **Figma to LWC Output Channel** log console to check for accessibility warning audits.
   - Agree to open the LWC bundle in the editor window.
