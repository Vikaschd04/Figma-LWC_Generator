import type {
  GeneratedFile,
  GeneratedLwcBundle,
  SldsMappedNode,
  FeatureBlueprint
} from '../../schemas/src';

export interface LwcGeneratorOptions {
  target?: 'lightning__RecordPage' | 'lightning__AppPage' | 'lightning__HomePage';
  apiVersion?: string;
  generateReadme?: boolean;
}

export interface LwcGeneratorInput {
  componentName: string;
  mappedRoot: SldsMappedNode;
  options?: LwcGeneratorOptions;
  blueprint?: FeatureBlueprint;
}

export function generateLwcBundle(input: LwcGeneratorInput): GeneratedLwcBundle {
  const componentName = toCamelCase(input.componentName);
  const target = input.options?.target ?? 'lightning__RecordPage';
  const apiVersion = input.options?.apiVersion ?? '61.0';
  const warnings = collectWarnings(input.mappedRoot);
  const files: GeneratedFile[] = [
    createFile(componentName, 'html', renderHtml(input.mappedRoot, input.blueprint)),
    createFile(componentName, 'js', renderJs(componentName, target, input.blueprint)),
    createFile(componentName, 'css', renderCss(input.mappedRoot)),
    createFile(componentName, 'metaXml', renderMetaXml(apiVersion, target))
  ];

  if (input.options?.generateReadme ?? true) {
    files.push(createFile(componentName, 'readme', renderReadme(componentName, warnings)));
  }

  return {
    componentName,
    files,
    warnings
  };
}

function createFile(
  componentName: string,
  kind: GeneratedFile['kind'],
  content: string
): GeneratedFile {
  const extensionByKind: Record<GeneratedFile['kind'], string> = {
    html: 'html',
    js: 'js',
    css: 'css',
    metaXml: 'js-meta.xml',
    readme: 'md',
    apex: 'cls',
    jest: 'test.js'
  };
  const fileName = kind === 'readme' ? 'README' : componentName;

  return {
    path: `${componentName}/${fileName}.${extensionByKind[kind]}`,
    kind,
    content
  };
}

function renderHtml(root: SldsMappedNode, blueprint?: FeatureBlueprint): string {
  return `<template>\n${renderNode(root, 1, blueprint)}\n</template>\n`;
}

function renderNode(node: SldsMappedNode, depth: number, blueprint?: FeatureBlueprint): string {
  const indent = '  '.repeat(depth);
  const handlers = blueprint?.eventHandlers.filter((h) => h.targetNodeId === node.id) ?? [];
  let attributes = renderAttributes(node);

  handlers.forEach((handler) => {
    if (handler.actionKind === 'inputBinding') {
      const bindingProperty = handler.actionDetails?.property;
      attributes += ` value={${bindingProperty}} onchange={${handler.name}}`;
    } else {
      attributes += ` ${handler.domEvent}={${handler.name}}`;
    }
  });

  const openTag = `${indent}<${node.tagName}${attributes}>`;

  if (isSelfClosing(node)) {
    return `${indent}<${node.tagName}${attributes}></${node.tagName}>`;
  }

  const childLines = shouldRenderChildren(node)
    ? node.children.map((child) => renderNode(child, depth + 1, blueprint))
    : [];
  const text = node.text ? [`${'  '.repeat(depth + 1)}${escapeHtml(node.text)}`] : [];
  const content = [...text, ...childLines];

  if (content.length === 0) {
    return `${openTag}</${node.tagName}>`;
  }

  return `${openTag}\n${content.join('\n')}\n${indent}</${node.tagName}>`;
}

function renderAttributes(node: SldsMappedNode): string {
  const entries: [string, string][] = [
    ...(node.classes.length > 0 ? [['class', node.classes.join(' ')] as [string, string]] : []),
    ...Object.entries(node.attributes).map(
      ([key, value]) => [toKebabCase(key), value] as [string, string]
    )
  ];

  if (entries.length === 0) {
    return '';
  }

  return ` ${entries.map(([key, value]) => `${key}="${escapeAttribute(value)}"`).join(' ')}`;
}

function isSelfClosing(node: SldsMappedNode): boolean {
  return node.renderKind === 'lightning' || node.tagName === 'img';
}

function shouldRenderChildren(node: SldsMappedNode): boolean {
  return node.renderKind !== 'lightning' && node.tagName !== 'img';
}

function renderJs(componentName: string, target: string, blueprint?: FeatureBlueprint): string {
  const className = toPascalCase(componentName);

  const baseLwcImports = new Set<string>(['LightningElement']);
  const extraImports = new Set<string>();

  if (target === 'lightning__RecordPage') {
    baseLwcImports.add('api');
  }

  if (blueprint) {
    blueprint.properties.forEach((p) => {
      if (p.isApi) {
        baseLwcImports.add('api');
      }
    });
    blueprint.imports.forEach((imp) => {
      extraImports.add(imp);
    });
  }

  const importLine = `import { ${Array.from(baseLwcImports).join(', ')} } from 'lwc';`;
  const extraImportLines =
    Array.from(extraImports).length > 0 ? '\n' + Array.from(extraImports).join('\n') : '';

  let classBody = '';

  if (
    target === 'lightning__RecordPage' &&
    (!blueprint || !blueprint.properties.some((p) => p.name === 'recordId'))
  ) {
    classBody += '\n  @api recordId;\n';
  }

  if (blueprint) {
    blueprint.properties.forEach((p) => {
      const decorator = p.isApi ? '@api ' : '';
      const defaultVal = p.defaultValue !== undefined ? ` = ${p.defaultValue}` : '';
      const docComment = p.description ? `  // ${p.description}\n` : '';
      classBody += `\n${docComment}  ${decorator}${p.name}${defaultVal};\n`;
    });

    blueprint.eventHandlers.forEach((handler) => {
      if (handler.actionKind === 'inputBinding') {
        const bindingProperty = handler.actionDetails?.property;
        classBody += `\n  ${handler.name}(event) {\n    this.${bindingProperty} = event.target.value;\n  }\n`;
      } else if (handler.actionKind === 'toast') {
        const title = handler.actionDetails?.title || 'Notification';
        const message = handler.actionDetails?.message || 'Action executed successfully.';
        const variant = handler.actionDetails?.variant || 'info';
        classBody += `\n  ${handler.name}() {\n    this.dispatchEvent(\n      new ShowToastEvent({\n        title: '${title}',\n        message: '${message}',\n        variant: '${variant}'\n      })\n    );\n  }\n`;
      } else {
        classBody += `\n  ${handler.name}() {\n    // Custom logic for ${handler.name}\n    console.log('Action triggered: ${handler.name}');\n  }\n`;
      }
    });
  }

  return `${importLine}${extraImportLines}\n\nexport default class ${className} extends LightningElement {${classBody}}\n`;
}

function renderCss(root: SldsMappedNode): string {
  const declarations = collectCssDeclarations(root);
  const base = ':host {\n  display: block;\n}';

  if (declarations.length === 0) {
    return `${base}\n`;
  }

  return `${base}\n\n${declarations.join('\n\n')}\n`;
}

function collectCssDeclarations(root: SldsMappedNode): string[] {
  const declarations: string[] = [];
  const visit = (node: SldsMappedNode) => {
    const className = node.classes.find((item) => item.startsWith('ftl-'));

    if (className && Object.keys(node.cssDeclarations).length > 0) {
      declarations.push(
        `.${className} {\n${Object.entries(node.cssDeclarations)
          .map(([property, value]) => `  ${property}: ${value};`)
          .join('\n')}\n}`
      );
    }

    node.children.forEach(visit);
  };

  visit(root);
  return declarations;
}

function renderMetaXml(apiVersion: string, target: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">\n  <apiVersion>${escapeHtml(apiVersion)}</apiVersion>\n  <isExposed>true</isExposed>\n  <targets>\n    <target>${escapeHtml(target)}</target>\n  </targets>\n</LightningComponentBundle>\n`;
}

function renderReadme(componentName: string, warnings: string[]): string {
  const warningLines =
    warnings.length > 0
      ? warnings.map((warning) => `- ${warning}`).join('\n')
      : '- No generation warnings.';

  return `# ${componentName}\n\nGenerated by Figma to Salesforce LWC Accelerator.\n\n## Generated Files\n\n- ${componentName}.html\n- ${componentName}.js\n- ${componentName}.css\n- ${componentName}.js-meta.xml\n\n## Warnings\n\n${warningLines}\n\n## Developer Review\n\n- Confirm behavior, data sources, and events before deployment.\n- Replace placeholder icon metadata if this component includes icons.\n`;
}

function collectWarnings(root: SldsMappedNode): string[] {
  const warnings: string[] = [];
  const visit = (node: SldsMappedNode) => {
    warnings.push(...node.warnings);
    node.children.forEach(visit);
  };

  visit(root);
  return [...new Set(warnings)];
}

function toCamelCase(value: string): string {
  const words = value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'generatedComponent';
  }

  const [firstWord, ...remainingWords] = words;
  return `${firstWord.toLowerCase()}${remainingWords.map(toPascalCase).join('')}`;
}

function toPascalCase(value: string): string {
  const camel = toCamelCase(value);
  return `${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}
