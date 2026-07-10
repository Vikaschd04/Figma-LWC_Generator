import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import puppeteer from 'puppeteer';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';
import pixelmatch from 'pixelmatch';

function readImage(filePath: string): { width: number; height: number; data: Buffer } {
  const buffer = fs.readFileSync(filePath);
  // Check JPEG signature: FFD8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    const raw = jpeg.decode(buffer);
    return { width: raw.width, height: raw.height, data: raw.data };
  }
  // Default to PNG
  const png = PNG.sync.read(buffer);
  return { width: png.width, height: png.height, data: png.data };
}

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
              }
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

        // Step 6.5: Local Visual Correctness Verification & Comparison
        try {
          outputChannel.appendLine(`\nStarting local LWC Visual Quality comparison...`);

          let htmlContent = fs.readFileSync(path.join(componentFolder, `${componentName}.html`), 'utf8');
          htmlContent = htmlContent.replace(/<template>/gi, '').replace(/<\/template>/gi, '');

          const cssPath = path.join(componentFolder, `${componentName}.css`);
          const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

          const previewHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>LWC Visual Diff Preview</title>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/design-system/2.24.2/styles/salesforce-lightning-design-system.min.css"
    />
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: transparent;
      }
      /* Custom LWC CSS */
      ${cssContent}
    </style>
  </head>
  <body>
    <div class="slds-scope" style="display: inline-block; width: 100%; height: 100%;">
      ${htmlContent}
    </div>
  </body>
</html>`;

          const tempHtmlPath = path.join(componentFolder, 'visual-preview-temp.html');
          fs.writeFileSync(tempHtmlPath, previewHtml, 'utf8');

          const designImage = readImage(imagePath);
          const width = designImage.width;
          const height = designImage.height;

          outputChannel.appendLine(`Design screenshot layout resolution: ${width}x${height}`);

          const browser = await puppeteer.launch({ headless: true });
          const page = await browser.newPage();
          await page.setViewport({ width, height, deviceScaleFactor: 1 });
          await page.goto(`file://${tempHtmlPath}`);

          // Wait for rendering stability
          await new Promise((resolve) => setTimeout(resolve, 500));

          const screenshotPath = path.join(componentFolder, 'visual-render-temp.png');
          await page.screenshot({ path: screenshotPath });
          await browser.close();

          const renderImage = readImage(screenshotPath);
          const diffImage = new PNG({ width, height });
          const numDiffPixels = pixelmatch(
            designImage.data,
            renderImage.data,
            diffImage.data,
            width,
            height,
            { threshold: 0.1 }
          );

          const totalPixels = width * height;
          const diffPercentage = (numDiffPixels / totalPixels) * 100;
          const similarityScore = 100 - diffPercentage;

          const diffOutputPath = path.join(componentFolder, 'visual-diff-output.png');
          fs.writeFileSync(diffOutputPath, PNG.sync.write(diffImage));

          // Cleanup temp files
          if (fs.existsSync(tempHtmlPath)) {
            fs.unlinkSync(tempHtmlPath);
          }
          if (fs.existsSync(screenshotPath)) {
            fs.unlinkSync(screenshotPath);
          }

          outputChannel.appendLine(`\n--- LWC VISUAL VERIFICATION REPORT ---`);
          outputChannel.appendLine(`Layout Similarity Score: ${similarityScore.toFixed(2)}%`);
          outputChannel.appendLine(`Layout Mismatch Index: ${diffPercentage.toFixed(2)}%`);
          outputChannel.appendLine(`Total Mismatch Pixels: ${numDiffPixels} / ${totalPixels}`);
          outputChannel.appendLine(`Visual Diff Markup Saved: ${diffOutputPath}`);
          outputChannel.appendLine(`--------------------------------------\n`);

          createdFiles.push(diffOutputPath);
        } catch (vErr: any) {
          outputChannel.appendLine(`Visual Verification Warning: ${vErr.message || vErr}`);
        }

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
          const extensionPriority = ['.md', '.html', '.js', '.css', '.png'];
          const sortedFiles = [...createdFiles].sort((a, b) => {
            const extA = path.extname(a);
            const extB = path.extname(b);
            return extensionPriority.indexOf(extA) - extensionPriority.indexOf(extB);
          });

          for (const filePath of sortedFiles) {
            // Avoid opening binary PNG file directly in text editors
            if (path.extname(filePath) === '.png') {
              continue;
            }
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
