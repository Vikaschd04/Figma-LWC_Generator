import { classifyDesignNode, normalizeFigmaTree } from '../../../core/src';
import { mapToSlds } from '../../../slds-mapper/src';
import { accountHealthCardRawFixture } from '../../../test-fixtures/src';
import { generateLwcBundle } from '../generator';

function generateFixtureBundle() {
  const normalized = normalizeFigmaTree(accountHealthCardRawFixture);
  const classified = classifyDesignNode(normalized);
  const mapped = mapToSlds(classified);

  return generateLwcBundle({
    componentName: 'Account Health Card',
    mappedRoot: mapped,
    options: {
      target: 'lightning__RecordPage',
      generateReadme: true
    }
  });
}

describe('generateLwcBundle', () => {
  it('generates the expected component folder and file names', () => {
    const bundle = generateFixtureBundle();

    expect(bundle.componentName).toBe('accountHealthCard');
    expect(bundle.files.map((file) => file.path)).toEqual([
      'accountHealthCard/accountHealthCard.html',
      'accountHealthCard/accountHealthCard.js',
      'accountHealthCard/accountHealthCard.css',
      'accountHealthCard/accountHealthCard.js-meta.xml',
      'accountHealthCard/README.md'
    ]);
  });

  it('snapshot tests generated HTML', () => {
    const html = generateFixtureBundle().files.find((file) => file.kind === 'html')?.content;

    expect(html).toMatchInlineSnapshot(`
"<template>
  <section class="slds-card slds-p-around_medium">
    <h2 class="slds-text-heading_small">
      Account Health
    </h2>
    <lightning-button class="slds-m-top_small" label="View Details" variant="brand"></lightning-button>
    <p class="slds-text-body_regular">
      Current customer risk overview
    </p>
  </section>
</template>
"
`);
  });

  it('snapshot tests generated JS', () => {
    const js = generateFixtureBundle().files.find((file) => file.kind === 'js')?.content;

    expect(js).toMatchInlineSnapshot(`
"import { LightningElement, api } from 'lwc';

export default class AccountHealthCard extends LightningElement {
  @api recordId;
}
"
`);
  });

  it('snapshot tests generated CSS', () => {
    const css = generateFixtureBundle().files.find((file) => file.kind === 'css')?.content;

    expect(css).toMatchInlineSnapshot(`
":host {
  display: block;
}
"
`);
  });

  it('snapshot tests generated meta XML', () => {
    const xml = generateFixtureBundle().files.find((file) => file.kind === 'metaXml')?.content;

    expect(xml).toMatchInlineSnapshot(`
"<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
  <apiVersion>61.0</apiVersion>
  <isExposed>true</isExposed>
  <targets>
    <target>lightning__RecordPage</target>
  </targets>
</LightningComponentBundle>
"
`);
  });

  it('validates no generated file is empty', () => {
    const bundle = generateFixtureBundle();

    expect(bundle.files.every((file) => file.content.trim().length > 0)).toBe(true);
  });

  it('omits recordId when the target is not a record page', () => {
    const mapped = mapToSlds(classifyDesignNode(normalizeFigmaTree(accountHealthCardRawFixture)));
    const bundle = generateLwcBundle({
      componentName: 'Home Card',
      mappedRoot: mapped,
      options: {
        target: 'lightning__HomePage'
      }
    });

    const js = bundle.files.find((file) => file.kind === 'js')?.content;

    expect(js).toContain("import { LightningElement } from 'lwc';");
    expect(js).not.toContain('@api recordId');
  });

  it('generates HTML and JS with functional bindings when a blueprint is provided', () => {
    const mapped = mapToSlds(classifyDesignNode(normalizeFigmaTree(accountHealthCardRawFixture)));
    const bundle = generateLwcBundle({
      componentName: 'Account Card',
      mappedRoot: mapped,
      options: {
        target: 'lightning__RecordPage'
      },
      blueprint: {
        componentName: 'accountCard',
        properties: [
          { name: 'recordId', type: 'string', isApi: true },
          { name: 'nameValue', type: 'string', defaultValue: "''", isApi: false }
        ],
        eventHandlers: [
          {
            name: 'handleNameChange',
            domEvent: 'onchange',
            targetNodeId: '1:45',
            actionKind: 'inputBinding',
            actionDetails: { property: 'nameValue' }
          },
          {
            name: 'handleSaveClick',
            domEvent: 'onclick',
            targetNodeId: '1:46',
            actionKind: 'toast',
            actionDetails: { title: 'Success', message: 'Saved successfully.' }
          }
        ],
        imports: ["import { ShowToastEvent } from 'lightning/platformShowToastEvent';"],
        warnings: []
      }
    });

    const js = bundle.files.find((file) => file.kind === 'js')?.content;

    expect(js).toContain("import { ShowToastEvent } from 'lightning/platformShowToastEvent';");
    expect(js).toContain('@api recordId;');
    expect(js).toContain("nameValue = '';");
    expect(js).toContain('handleNameChange(event)');
    expect(js).toContain('handleSaveClick()');
  });
});
