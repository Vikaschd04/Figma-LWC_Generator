import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('Figma to LWC');
  context.subscriptions.push(outputChannel);

  const generateDisposable = vscode.commands.registerCommand(
    'figma-to-lwc.generate',
    async (uri?: vscode.Uri) => {
      try {
        // Step 1: Prompt to select Figma screenshot image file
        const fileUris = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          filters: { 'Image Files': ['png', 'jpg', 'jpeg', 'svg'] },
          openLabel: 'Select Figma Design Image'
        });

        if (!fileUris || fileUris.length === 0) {
          return;
        }

        const imagePath = fileUris[0].fsPath;
        outputChannel.clear();
        outputChannel.appendLine(`Loading image file: ${imagePath}`);

        // Read and convert file to Base64
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString('base64');

        // Step 2: Prompt for LWC Component Details
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

        // Optional User Story inputs to inject logical controls
        const storyTitle = await vscode.window.showInputBox({
          prompt: 'User Story Title (Optional)',
          placeHolder: 'e.g. Account Registration Form'
        });

        let userStory = undefined;
        if (storyTitle) {
          const storyDesc = await vscode.window.showInputBox({
            prompt: 'User Story Description (Optional)',
            placeHolder: 'e.g. Captures user details and registers an account...'
          });

          const storyCriteria = await vscode.window.showInputBox({
            prompt: 'Acceptance Criteria (Optional, comma-separated)',
            placeHolder: 'e.g. must validate email, must have reset button'
          });

          userStory = {
            title: storyTitle,
            description: storyDesc || '',
            acceptanceCriteria: storyCriteria
              ? storyCriteria.split(',').map((s) => s.trim()).filter(Boolean)
              : []
          };
        }

        // Step 3: Resolve Export Location
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

        // Step 4: Check Overwrites
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

        // Step 5: Send Image Generation API request
        outputChannel.appendLine(`Sending visual layout to Gemini Vision AI compiler...`);
        outputChannel.show();

        const response = await fetch(
          'https://figma-to-lwc-accelerator.vercel.app/api/generate-lwc',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              componentName: componentName,
              imageBase64: imageBase64,
              options: {
                target: targetOption,
                apiVersion: apiVersion,
                generateReadme: true
              },
              userStory: userStory
            })
          }
        );

        if (!response.ok) {
          const errData = (await response.json()) as { message?: string; error?: string };
          throw new Error(errData.message || errData.error || 'Server error generating LWC component.');
        }

        const data = (await response.json()) as {
          files: Array<{ path: string; content: string }>;
          warnings?: string[];
        };

        // Step 6: Write generated files to disk
        fs.mkdirSync(componentFolder, { recursive: true });

        const createdFiles: string[] = [];
        for (const file of data.files) {
          const filePath = path.join(componentFolder, path.basename(file.path));
          fs.writeFileSync(filePath, file.content, 'utf8');
          createdFiles.push(filePath);
        }

        outputChannel.appendLine(`Successfully wrote files to: ${componentFolder}`);

        if (data.warnings && data.warnings.length > 0) {
          outputChannel.appendLine('\nVision AI Warnings:');
          data.warnings.forEach((warning) => {
            outputChannel.appendLine(`- ${warning}`);
          });
          vscode.window.showWarningMessage(
            `LWC Component generated with warnings. Review output channel.`
          );
        } else {
          vscode.window.showInformationMessage(
            `LWC Component "${componentName}" generated successfully!`
          );
        }

        // Step 7: Offer to open generated files
        const viewOption = await vscode.window.showInformationMessage(
          `Open generated files for "${componentName}"?`,
          'Open Files'
        );

        if (viewOption === 'Open Files') {
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
