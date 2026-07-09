import type {
  GeneratedLwcBundle,
  SldsMappedNode,
  ValidationMessage,
  ValidationResult
} from '../../schemas/src';

export function validateLwcBundle(
  bundle: GeneratedLwcBundle,
  mappedRoot: SldsMappedNode
): ValidationResult {
  const messages: ValidationMessage[] = [];

  // 1. Validate the recursive mapped node tree
  validateMappedNode(mappedRoot, messages);

  // 2. Validate the generated file outputs
  validateCodeFiles(bundle, messages);

  const hasErrors = messages.some((msg) => msg.severity === 'error');

  return {
    valid: !hasErrors,
    messages
  };
}

function validateMappedNode(node: SldsMappedNode, messages: ValidationMessage[]) {
  // 1. Accessibility Input Label Check
  if (node.semanticType === 'input') {
    const hasLabel =
      node.attributes.label !== undefined ||
      Object.keys(node.attributes).some((k) => k.toLowerCase() === 'label');
    if (!hasLabel) {
      messages.push({
        code: 'A11Y_INPUT_MISSING_LABEL',
        severity: 'error',
        message: `Accessibility Error: Input element "${node.name}" lacks a label attribute.`,
        path: node.id
      });
    }
  }

  // 2. Accessibility Button Label/Title Check
  if (node.semanticType === 'button') {
    const hasLabel =
      node.attributes.label !== undefined ||
      node.attributes.title !== undefined ||
      Object.keys(node.attributes).some(
        (k) => k.toLowerCase() === 'label' || k.toLowerCase() === 'title'
      );
    if (!hasLabel) {
      messages.push({
        code: 'A11Y_BUTTON_MISSING_LABEL',
        severity: 'error',
        message: `Accessibility Error: Button element "${node.name}" lacks a label or title attribute.`,
        path: node.id
      });
    }
  }

  // 3. Accessibility Image Alt Text Check
  if (node.semanticType === 'image') {
    const hasAlt =
      node.attributes.alt !== undefined ||
      Object.keys(node.attributes).some((k) => k.toLowerCase() === 'alt');
    if (!hasAlt) {
      messages.push({
        code: 'A11Y_IMAGE_MISSING_ALT',
        severity: 'error',
        message: `Accessibility Error: Image element "${node.name}" lacks an alt attribute.`,
        path: node.id
      });
    }
  }

  // 4. Accessibility Icon Descriptor Check
  if (node.semanticType === 'icon') {
    const hasAlt =
      node.attributes.alternativeText !== undefined ||
      node.attributes['alternative-text'] !== undefined ||
      Object.keys(node.attributes).some(
        (k) =>
          k.toLowerCase().includes('alternativetext') ||
          k.toLowerCase().includes('alternative-text')
      );
    if (!hasAlt) {
      messages.push({
        code: 'A11Y_ICON_MISSING_ALT',
        severity: 'error',
        message: `Accessibility Error: Icon element "${node.name}" lacks an alternativeText attribute.`,
        path: node.id
      });
    }
  }

  // 5. Inline style attribute block
  const hasStyleAttr =
    node.attributes.style !== undefined ||
    Object.keys(node.attributes).some((k) => k.toLowerCase() === 'style');
  if (hasStyleAttr) {
    messages.push({
      code: 'QUALITY_INLINE_STYLE_DETECTED',
      severity: 'error',
      message: `Quality Error: Inline styles are not allowed. Node "${node.name}" uses inline style attribute.`,
      path: node.id
    });
  }

  // 6. Unknown node mapped to div
  if (node.semanticType === 'unknown') {
    messages.push({
      code: 'QUALITY_UNKNOWN_NODE_MAPPED',
      severity: 'warning',
      message: `Quality Warning: Unsupported design node "${node.name}" mapped to a generic div for developer review.`,
      path: node.id
    });
  }

  node.children.forEach((child) => validateMappedNode(child, messages));
}

function validateCodeFiles(bundle: GeneratedLwcBundle, messages: ValidationMessage[]) {
  const jsFile = bundle.files.find((f) => f.kind === 'js');
  const metaXmlFile = bundle.files.find((f) => f.kind === 'metaXml');

  if (jsFile) {
    const jsContent = jsFile.content;

    // Check @api import is present
    if (
      jsContent.includes('@api') &&
      !/import\s+{[^}]*\bapi\b[^}]*}\s+from\s+['"]lwc['"]/g.test(jsContent)
    ) {
      messages.push({
        code: 'QUALITY_MISSING_API_IMPORT',
        severity: 'error',
        message: `Quality Error: JS controller uses @api decorator but "api" is not imported from lwc.`,
        path: jsFile.path
      });
    }

    // Check @wire import is present
    if (
      jsContent.includes('@wire') &&
      !/import\s+{[^}]*\bwire\b[^}]*}\s+from\s+['"]lwc['"]/g.test(jsContent)
    ) {
      messages.push({
        code: 'QUALITY_MISSING_WIRE_IMPORT',
        severity: 'error',
        message: `Quality Error: JS controller uses @wire decorator but "wire" is not imported from lwc.`,
        path: jsFile.path
      });
    }

    // Check ShowToastEvent usage
    if (
      jsContent.includes('ShowToastEvent') &&
      !jsContent.includes('lightning/platformShowToastEvent')
    ) {
      messages.push({
        code: 'QUALITY_MISSING_TOAST_IMPORT',
        severity: 'error',
        message: `Quality Error: ShowToastEvent is referenced in JS but not imported from lightning/platformShowToastEvent.`,
        path: jsFile.path
      });
    }
  }

  if (metaXmlFile && jsFile) {
    const metaXmlContent = metaXmlFile.content;
    const jsContent = jsFile.content;

    // Check record page recordId context
    const isTargetingRecordPage = metaXmlContent.includes('<target>lightning__RecordPage</target>');
    if (isTargetingRecordPage && !jsContent.includes('recordId')) {
      messages.push({
        code: 'QUALITY_RECORD_PAGE_MISSING_RECORD_ID',
        severity: 'warning',
        message: `Quality Warning: Component targets lightning__RecordPage but controller lacks recordId property.`,
        path: jsFile.path
      });
    }
  }
}
