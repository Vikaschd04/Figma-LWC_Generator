import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  classifyDesignNode,
  normalizeFigmaTree,
  validateLwcBundle
} from '../../../packages/core/src';
import { generateLwcBundle } from '../../../packages/lwc-generator/src';
import { mapToSlds } from '../../../packages/slds-mapper/src';
import { rawFigmaNodeSchema } from '../../../packages/schemas/src';

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('Figma to LWC');
  context.subscriptions.push(outputChannel);

  const generateDisposable = vscode.commands.registerCommand(
    'figma-to-lwc.generate',
    async (uri?: vscode.Uri) => {
      try {
        // Step 1: Obtain Figma Node JSON input
        const inputOption = await vscode.window.showQuickPick(
          ['📋 Paste JSON from Clipboard', '📁 Select JSON file from workspace...'],
          { placeHolder: 'Select the raw Figma JSON source' }
        );

        if (!inputOption) {
          return;
        }

        let rawJsonText = '';

        if (inputOption.startsWith('📋')) {
          rawJsonText = await vscode.env.clipboard.readText();
          const trimmed = rawJsonText.trim();
          if (!trimmed) {
            vscode.window.showErrorMessage('Clipboard is empty. Please copy Figma JSON first.');
            return;
          }
          if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
            vscode.window.showErrorMessage(
              'Clipboard content does not appear to be valid JSON. Please copy the raw JSON from the Figma plugin first.'
            );
            return;
          }
        } else {
          const fileUris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: { 'JSON Files': ['json'] },
            openLabel: 'Select Figma JSON'
          });

          if (!fileUris || fileUris.length === 0) {
            return;
          }

          rawJsonText = fs.readFileSync(fileUris[0].fsPath, 'utf8');
        }

        // Step 2: Parse and Validate Figma JSON
        let rawNode: unknown;
        try {
          rawNode = JSON.parse(rawJsonText);
        } catch (e: unknown) {
          vscode.window.showErrorMessage(
            `Failed to parse JSON text: ${e instanceof Error ? e.message : String(e)}`
          );
          return;
        }

        const parseResult = rawFigmaNodeSchema.safeParse(rawNode);
        if (!parseResult.success) {
          outputChannel.clear();
          outputChannel.appendLine('Figma JSON Validation Failures:');
          parseResult.error.issues.forEach((err) => {
            outputChannel.appendLine(`- [${err.path.join('.') || 'root'}]: ${err.message}`);
          });
          outputChannel.show();
          vscode.window.showErrorMessage(
            'Figma JSON is invalid. Review the Figma to LWC output channel for details.'
          );
          return;
        }

        // Step 3: Prompt for LWC Component Details
        const componentName = await vscode.window.showInputBox({
          prompt: 'Enter LWC Component Name (camelCase)',
          placeHolder: 'accountHealthCard',
          value: 'figmaComponent',
          validateInput: (value) => {
            if (!value) {
              return 'Component name is required.';
            }
            if (!/^[a-z][a-zA-Z0-9]*$/.test(value)) {
              return 'Component name must be camelCase (start with lowercase letter, alphanumeric only).';
            }
            return null;
          }
        });

        if (!componentName) {
          return;
        }

        const targetOption = await vscode.window.showQuickPick(
          ['lightning__RecordPage', 'lightning__AppPage', 'lightning__HomePage'],
          { placeHolder: 'Select the default page target for the component' }
        );

        if (!targetOption) {
          return;
        }

        const apiVersion = await vscode.window.showInputBox({
          prompt: 'Enter Salesforce API Version',
          value: '61.0',
          validateInput: (value) => {
            if (!value || !/^\d+\.\d+$/.test(value)) {
              return 'Valid API version (e.g. 61.0) is required.';
            }
            return null;
          }
        });

        if (!apiVersion) {
          return;
        }

        // Step 4: Resolve Export Location
        let exportDir: string | undefined;

        if (uri && fs.statSync(uri.fsPath).isDirectory()) {
          exportDir = uri.fsPath;
        } else {
          // Look for SFDX workspace project
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            const sfdxConfigPath = path.join(workspaceRoot, 'sfdx-project.json');

            if (fs.existsSync(sfdxConfigPath)) {
              try {
                const sfdxContent = fs.readFileSync(sfdxConfigPath, 'utf8');
                const sfdxProject = JSON.parse(sfdxContent);
                const defaultDir = (sfdxProject.packageDirectories || []).find(
                  (d: { path: string; default?: boolean }) => d.default === true || d.path
                );
                if (defaultDir) {
                  const relativeLwcPath = path.join(defaultDir.path, 'main', 'default', 'lwc');
                  const fullLwcPath = path.join(workspaceRoot, relativeLwcPath);
                  if (fs.existsSync(fullLwcPath)) {
                    exportDir = fullLwcPath;
                  }
                }
              } catch {
                // Ignore parsing errors, fall back to folder selector
              }
            }
          }

          if (!exportDir) {
            vscode.window.showInformationMessage(
              'No Salesforce DX LWC directory auto-detected. Please select a folder.'
            );
            const folderUris = await vscode.window.showOpenDialog({
              canSelectFiles: false,
              canSelectFolders: true,
              canSelectMany: false,
              openLabel: 'Select Export Directory'
            });

            if (!folderUris || folderUris.length === 0) {
              return;
            }
            exportDir = folderUris[0].fsPath;
          }
        }

        const componentFolder = path.join(exportDir, componentName);

        // Step 5: Check Overwrites
        if (fs.existsSync(componentFolder)) {
          const overwriteOption = await vscode.window.showWarningMessage(
            `A component named "${componentName}" already exists. Overwrite?`,
            { modal: true },
            'Yes',
            'No'
          );

          if (overwriteOption !== 'Yes') {
            return;
          }
        }

        // Step 6: Generate Component Bundle
        outputChannel.clear();
        outputChannel.appendLine(`Starting LWC code generation for "${componentName}"...`);

        const normalized = normalizeFigmaTree(parseResult.data);
        const classified = classifyDesignNode(normalized);
        const mapped = mapToSlds(classified);
        const bundle = generateLwcBundle({
          componentName,
          mappedRoot: mapped,
          options: {
            target: targetOption as
              'lightning__RecordPage' | 'lightning__AppPage' | 'lightning__HomePage',
            apiVersion,
            generateReadme: true
          }
        });

        // Step 7: Write to File System
        fs.mkdirSync(componentFolder, { recursive: true });

        const createdFiles: string[] = [];
        for (const file of bundle.files) {
          const filePath = path.join(componentFolder, path.basename(file.path));
          fs.writeFileSync(filePath, file.content, 'utf8');
          createdFiles.push(filePath);
        }

        outputChannel.appendLine(`Successfully wrote files to: ${componentFolder}`);

        // Step 8: Validate Generated Component Bundle
        const validationResult = validateLwcBundle(bundle, mapped);

        if (bundle.warnings.length > 0) {
          outputChannel.appendLine('\nMapping / Classification Warnings:');
          bundle.warnings.forEach((warning) => {
            outputChannel.appendLine(`- ${warning}`);
          });
        }

        if (validationResult.messages.length > 0) {
          outputChannel.appendLine('\nQuality & Accessibility Validation Issues:');
          validationResult.messages.forEach((msg) => {
            outputChannel.appendLine(`- [${msg.severity.toUpperCase()}] ${msg.message}`);
          });
        }

        const errors = validationResult.messages.filter((m) => m.severity === 'error');
        const warnings = [
          ...bundle.warnings,
          ...validationResult.messages.filter((m) => m.severity === 'warning').map((m) => m.message)
        ];

        if (errors.length > 0) {
          vscode.window.showErrorMessage(
            `LWC Component generated with ${errors.length} validation error(s). Review output channel.`
          );
        } else if (warnings.length > 0) {
          vscode.window.showWarningMessage(
            `LWC Component generated with ${warnings.length} warning(s). Review output channel.`
          );
        } else {
          vscode.window.showInformationMessage(
            `LWC Component "${componentName}" generated successfully with 0 warnings/errors!`
          );
        }

        outputChannel.show();

        // Step 8: Offer to open generated files
        const viewOption = await vscode.window.showInformationMessage(
          `Open generated files for "${componentName}"?`,
          'Open Files'
        );

        if (viewOption === 'Open Files') {
          // Sort files to open README first, then js, html, css
          const extensionPriority = ['.md', '.html', '.js', '.css'];
          const sortedFiles = [...createdFiles].sort((a, b) => {
            const extA = path.extname(a);
            const extB = path.extname(b);
            return extensionPriority.indexOf(extA) - extensionPriority.indexOf(extB);
          });

          for (const filePath of sortedFiles) {
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document, { preview: false });
          }
        }
      } catch (err: unknown) {
        const error = err as Error;
        vscode.window.showErrorMessage(`An error occurred: ${error.message}`);
        outputChannel.appendLine(`\nError: ${error.stack || error.message}`);
        outputChannel.show();
      }
    }
  );

  context.subscriptions.push(generateDisposable);
}

export function deactivate() {}
