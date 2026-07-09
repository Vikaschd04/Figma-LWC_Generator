import * as fs from 'fs';
import * as path from 'path';
import {
  normalizeFigmaTree,
  classifyDesignNode,
  compileFeatureBlueprint,
  validateLwcBundle
} from '../packages/core/src';
import { mapToSlds } from '../packages/slds-mapper/src';
import { generateLwcBundle } from '../packages/lwc-generator/src';
import type { RawFigmaNode, UserStory } from '../packages/schemas/src';

const accountRegisterCardNode: RawFigmaNode = {
  id: '1:100',
  name: 'Card / Register Account',
  type: 'FRAME',
  layoutMode: 'VERTICAL',
  itemSpacing: 12,
  paddingTop: 16,
  paddingRight: 16,
  paddingBottom: 16,
  paddingLeft: 16,
  fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, visible: true }],
  children: [
    {
      id: '1:101',
      name: 'Input / Account Name',
      type: 'TEXT',
      characters: 'Enter Account Name',
      fills: [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 }, visible: true }]
    },
    {
      id: '1:102',
      name: 'Input / Email Address',
      type: 'TEXT',
      characters: 'Enter Email',
      fills: [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 }, visible: true }]
    },
    {
      id: '1:103',
      name: 'Button / Register Account',
      type: 'TEXT',
      characters: 'Submit Details',
      fills: [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 }, visible: true }]
    }
  ]
};

const accountRegisterStory: UserStory = {
  title: 'Register Account Form',
  description:
    'As a sales representative, I want a form to register new accounts. Typing account name and email address should update internal parameters, and clicking the register button should trigger a success toast alert notification.',
  acceptanceCriteria: ['Binds values from inputs', 'Displays success toast notification']
};

const contactDetailLoaderNode: RawFigmaNode = {
  id: '2:100',
  name: 'Card / Contact Loader',
  type: 'FRAME',
  layoutMode: 'VERTICAL',
  itemSpacing: 8,
  paddingTop: 12,
  paddingRight: 12,
  paddingBottom: 12,
  paddingLeft: 12,
  fills: [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 }, visible: true }],
  children: [
    {
      id: '2:101',
      name: 'Heading / Detail Overview',
      type: 'TEXT',
      characters: 'Contact Overview Status',
      fills: []
    },
    {
      id: '2:102',
      name: 'Badge / Verification',
      type: 'TEXT',
      characters: 'Verified VIP',
      fills: []
    }
  ]
};

const contactDetailStory: UserStory = {
  title: 'Contact Details Page Controller',
  description:
    'As a contact manager, I want to load contact details context directly on the record detail page from a controller Apex database wire call using the record id parameter.',
  acceptanceCriteria: [
    'Requires record id context page details',
    'Fetches data via backend controller server methods'
  ]
};

function compileAndWrite(rawNode: RawFigmaNode, story: UserStory, targetFolderName: string) {
  const normalized = normalizeFigmaTree(rawNode);
  const classified = classifyDesignNode(normalized);
  const mapped = mapToSlds(classified);
  const blueprint = compileFeatureBlueprint(classified, story);

  const bundle = generateLwcBundle({
    componentName: blueprint.componentName,
    mappedRoot: mapped,
    options: {
      target:
        targetFolderName === 'contactDetailLoader' ? 'lightning__RecordPage' : 'lightning__AppPage',
      apiVersion: '61.0',
      generateReadme: true
    },
    blueprint
  });

  const validation = validateLwcBundle(bundle, mapped);
  if (!validation.valid) {
    console.error(`Validation failed for ${blueprint.componentName}:`);
    console.error(JSON.stringify(validation.messages, null, 2));
    process.exit(1);
  }

  const outputBase = path.join(__dirname, '..', 'generated-samples', blueprint.componentName);
  if (fs.existsSync(outputBase)) {
    fs.rmSync(outputBase, { recursive: true, force: true });
  }
  fs.mkdirSync(outputBase, { recursive: true });

  for (const file of bundle.files) {
    const outputPath = path.join(outputBase, path.basename(file.path));
    fs.writeFileSync(outputPath, file.content, 'utf8');
    console.log(`- Created ${blueprint.componentName}/${path.basename(file.path)}`);
  }
}

console.log('Compiling and generating sample components...');
compileAndWrite(accountRegisterCardNode, accountRegisterStory, 'accountRegisterCard');
compileAndWrite(contactDetailLoaderNode, contactDetailStory, 'contactDetailLoader');
console.log('Samples generated successfully!');
