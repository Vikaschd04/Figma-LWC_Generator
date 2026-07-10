import * as fs from 'fs';
import * as path from 'path';
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

async function run() {
  const args = process.argv.slice(2);
  const compArg = args.find((a) => a.startsWith('--comp='));
  const designArg = args.find((a) => a.startsWith('--design='));

  if (!compArg || !designArg) {
    console.error('Usage: npx tsx scripts/verify-lwc-visuals.ts --comp=<compName> --design=<imagePath>');
    process.exit(1);
  }

  const compName = compArg.split('=')[1];
  const designPath = path.resolve(designArg.split('=')[1]);

  if (!fs.existsSync(designPath)) {
    console.error(`Design image not found at path: ${designPath}`);
    process.exit(1);
  }

  // Look for generated component files
  let compDir = path.resolve(`generated-samples/${compName}`);
  if (!fs.existsSync(compDir)) {
    compDir = path.resolve(`force-app/main/default/lwc/${compName}`);
  }
  if (!fs.existsSync(compDir)) {
    compDir = path.resolve(`apps/vscode-extension/force-app/main/default/lwc/${compName}`);
  }

  if (!fs.existsSync(compDir)) {
    console.error(`Component directory for "${compName}" could not be found.`);
    process.exit(1);
  }

  const htmlPath = path.join(compDir, `${compName}.html`);
  const cssPath = path.join(compDir, `${compName}.css`);

  if (!fs.existsSync(htmlPath)) {
    console.error(`HTML file not found at: ${htmlPath}`);
    process.exit(1);
  }

  console.log(`Verifying LWC Component: ${compName}`);
  console.log(`Component Dir: ${compDir}`);
  console.log(`Original Design Screenshot: ${designPath}`);

  // Load LWC markup and styling
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');
  htmlContent = htmlContent.replace(/<template>/gi, '').replace(/<\/template>/gi, '');

  const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

  // Compose standard wrapper loaded with Salesforce Design System styles
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

  const tempHtmlPath = path.resolve('scripts/visual-preview-temp.html');
  fs.writeFileSync(tempHtmlPath, previewHtml, 'utf8');

  // Read design image dimensions using signature-aware decoder
  const designImage = readImage(designPath);
  const width = designImage.width;
  const height = designImage.height;

  console.log(`Design Dimensions: ${width}x${height}`);

  console.log('Launching headless browser to capture LWC layout...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(`file://${tempHtmlPath}`);

  // Wait for layout stability
  await new Promise((resolve) => setTimeout(resolve, 500));

  const screenshotPath = path.resolve('scripts/visual-render-temp.png');
  await page.screenshot({ path: screenshotPath });
  await browser.close();

  // Load rendered screenshot image (which will be a PNG)
  const renderImage = readImage(screenshotPath);

  // Perform visual pixel match
  console.log('Comparing render layouts pixel by pixel...');
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

  // Save the mismatch diff markup overlay
  const diffPath = path.resolve('scripts/visual-diff-output.png');
  fs.writeFileSync(diffPath, PNG.sync.write(diffImage));

  console.log('\n--- VERIFICATION REPORT ---');
  console.log(`Total Mismatch Pixels: ${numDiffPixels} / ${totalPixels}`);
  console.log(`Layout Mismatch Index: ${diffPercentage.toFixed(2)}%`);
  console.log(`Layout Similarity Score: ${similarityScore.toFixed(2)}%`);
  console.log(`Visual Diff Highlight Saved: ${diffPath}`);
  console.log('---------------------------\n');

  // Clean up temporary preview file
  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }
}

run().catch((err) => {
  console.error('Visual verification failed:', err);
  process.exit(1);
});
