import type { GeneratedFile, GeneratedLwcBundle, SldsMappedNode } from '../../schemas/src';

export interface LwcGeneratorOptions {
  target?: 'lightning__RecordPage' | 'lightning__AppPage' | 'lightning__HomePage';
  apiVersion?: string;
  generateReadme?: boolean;
}

export interface LwcGeneratorInput {
  componentName: string;
  mappedRoot: SldsMappedNode;
  options?: LwcGeneratorOptions;
}

export function generateLwcBundle(input: LwcGeneratorInput): GeneratedLwcBundle {
  const componentName = toCamelCase(input.componentName);
  const target = input.options?.target ?? 'lightning__RecordPage';
  const apiVersion = input.options?.apiVersion ?? '61.0';
  const warnings = collectWarnings(input.mappedRoot);
  const files: GeneratedFile[] = [
    createFile(componentName, 'html', renderHtml(input.mappedRoot)),
    createFile(componentName, 'js', renderJs(componentName, target)),
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

function renderHtml(root: SldsMappedNode): string {
  return `<template>\n${renderNode(root, 1)}\n</template>\n`;
}

function renderNode(node: SldsMappedNode, depth: number): string {
  const indent = '  '.repeat(depth);
  const attributes = renderAttributes(node);
  const openTag = `${indent}<${node.tagName}${attributes}>`;

  if (isSelfClosing(node)) {
    return `${indent}<${node.tagName}${attributes}></${node.tagName}>`;
  }

  const childLines = shouldRenderChildren(node)
    ? node.children.map((child) => renderNode(child, depth + 1))
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

function renderJs(componentName: string, target: string): string {
  const className = toPascalCase(componentName);
  const usesRecordId = target === 'lightning__RecordPage';
  const importLine = usesRecordId
    ? "import { LightningElement, api } from 'lwc';"
    : "import { LightningElement } from 'lwc';";
  const recordIdLine = usesRecordId ? '\n  @api recordId;\n' : '';

  return `${importLine}\n\nexport default class ${className} extends LightningElement {${recordIdLine}}\n`;
}

function renderCss(root: SldsMappedNode): string {
  const declarations = collectCssDeclarations(root);

  if (declarations.length === 0) {
    return ':host {\n  display: block;\n}\n';
  }

  return `${declarations.join('\n\n')}\n`;
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
