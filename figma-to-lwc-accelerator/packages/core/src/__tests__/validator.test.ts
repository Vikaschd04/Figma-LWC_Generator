import { validateLwcBundle } from '../validator';
import type { GeneratedLwcBundle, SldsMappedNode } from '../../../schemas/src';

describe('LWC Quality and Accessibility Validator', () => {
  const createMockBundle = (jsContent: string, metaXmlContent: string): GeneratedLwcBundle => ({
    componentName: 'testComponent',
    files: [
      { path: 'testComponent/testComponent.js', kind: 'js', content: jsContent },
      { path: 'testComponent/testComponent.js-meta.xml', kind: 'metaXml', content: metaXmlContent }
    ],
    warnings: []
  });

  const createMockNode = (
    semanticType: SldsMappedNode['semanticType'],
    attributes: Record<string, string>,
    children: SldsMappedNode[] = []
  ): SldsMappedNode => ({
    id: 'mock-id',
    name: 'Mock Element',
    tagName: 'div',
    classes: [],
    attributes,
    cssDeclarations: {},
    children,
    renderKind: 'html',
    semanticType,
    warnings: []
  });

  test('validates correct bundle and layout and returns no errors', () => {
    const node = createMockNode('container', {});
    const bundle = createMockBundle(
      "import { LightningElement } from 'lwc';\nexport default class Test extends LightningElement {}",
      '<?xml version="1.0" encoding="UTF-8"?><LightningComponentBundle><targets><target>lightning__AppPage</target></targets></LightningComponentBundle>'
    );

    const result = validateLwcBundle(bundle, node);

    expect(result.valid).toBe(true);
    expect(result.messages.length).toBe(0);
  });

  test('errors if input node lacks label attribute', () => {
    const node = createMockNode('input', { name: 'test' });
    const bundle = createMockBundle("import { LightningElement } from 'lwc';", '');

    const result = validateLwcBundle(bundle, node);

    expect(result.valid).toBe(false);
    expect(result.messages.some((m) => m.code === 'A11Y_INPUT_MISSING_LABEL')).toBe(true);
  });

  test('errors if button node lacks label/title attributes', () => {
    const node = createMockNode('button', { name: 'click-me' });
    const bundle = createMockBundle("import { LightningElement } from 'lwc';", '');

    const result = validateLwcBundle(bundle, node);

    expect(result.valid).toBe(false);
    expect(result.messages.some((m) => m.code === 'A11Y_BUTTON_MISSING_LABEL')).toBe(true);
  });

  test('errors if image node lacks alt attribute', () => {
    const node = createMockNode('image', { src: 'pic.png' });
    const bundle = createMockBundle("import { LightningElement } from 'lwc';", '');

    const result = validateLwcBundle(bundle, node);

    expect(result.valid).toBe(false);
    expect(result.messages.some((m) => m.code === 'A11Y_IMAGE_MISSING_ALT')).toBe(true);
  });

  test('errors if icon node lacks alternativeText attribute', () => {
    const node = createMockNode('icon', { iconName: 'utility:check' });
    const bundle = createMockBundle("import { LightningElement } from 'lwc';", '');

    const result = validateLwcBundle(bundle, node);

    expect(result.valid).toBe(false);
    expect(result.messages.some((m) => m.code === 'A11Y_ICON_MISSING_ALT')).toBe(true);
  });

  test('errors if node uses inline style attribute', () => {
    const node = createMockNode('container', { style: 'color: red;' });
    const bundle = createMockBundle("import { LightningElement } from 'lwc';", '');

    const result = validateLwcBundle(bundle, node);

    expect(result.valid).toBe(false);
    expect(result.messages.some((m) => m.code === 'QUALITY_INLINE_STYLE_DETECTED')).toBe(true);
  });

  test('warns if unknown node is mapped to div', () => {
    const node = createMockNode('unknown', {});
    const bundle = createMockBundle("import { LightningElement } from 'lwc';", '');

    const result = validateLwcBundle(bundle, node);

    expect(result.valid).toBe(true);
    expect(result.messages.some((m) => m.code === 'QUALITY_UNKNOWN_NODE_MAPPED')).toBe(true);
  });

  test('errors if @api is used in JS but not imported', () => {
    const node = createMockNode('container', {});
    const bundle = createMockBundle(
      "import { LightningElement } from 'lwc';\nexport default class Test extends LightningElement {\n  @api recordId;\n}",
      ''
    );

    const result = validateLwcBundle(bundle, node);

    expect(result.valid).toBe(false);
    expect(result.messages.some((m) => m.code === 'QUALITY_MISSING_API_IMPORT')).toBe(true);
  });

  test('errors if @wire is used in JS but not imported', () => {
    const node = createMockNode('container', {});
    const bundle = createMockBundle(
      "import { LightningElement } from 'lwc';\nexport default class Test extends LightningElement {\n  @wire(getRecord) rec;\n}",
      ''
    );

    const result = validateLwcBundle(bundle, node);

    expect(result.valid).toBe(false);
    expect(result.messages.some((m) => m.code === 'QUALITY_MISSING_WIRE_IMPORT')).toBe(true);
  });

  test('errors if ShowToastEvent is referenced in JS but not imported', () => {
    const node = createMockNode('container', {});
    const bundle = createMockBundle(
      "import { LightningElement } from 'lwc';\nexport default class Test extends LightningElement {\n  fire() { this.dispatchEvent(new ShowToastEvent()); }\n}",
      ''
    );

    const result = validateLwcBundle(bundle, node);

    expect(result.valid).toBe(false);
    expect(result.messages.some((m) => m.code === 'QUALITY_MISSING_TOAST_IMPORT')).toBe(true);
  });

  test('warns if targeting record page but JS lacks recordId', () => {
    const node = createMockNode('container', {});
    const bundle = createMockBundle(
      "import { LightningElement } from 'lwc';\nexport default class Test extends LightningElement {}",
      '<?xml version="1.0" encoding="UTF-8"?><LightningComponentBundle><targets><target>lightning__RecordPage</target></targets></LightningComponentBundle>'
    );

    const result = validateLwcBundle(bundle, node);

    expect(result.valid).toBe(true);
    expect(result.messages.some((m) => m.code === 'QUALITY_RECORD_PAGE_MISSING_RECORD_ID')).toBe(
      true
    );
  });
});
