import { compileFeatureBlueprint } from '../blueprint';
import type { ClassifiedDesignNode, UserStory } from '../../../schemas/src';

describe('Blueprint Compiler', () => {
  const mockClassifiedTree: ClassifiedDesignNode = {
    id: 'root-id',
    name: 'Account Details Card',
    semanticType: 'card',
    children: [
      {
        id: 'input-name',
        name: 'Account Name',
        semanticType: 'input',
        children: [],
        classification: {
          semanticType: 'input',
          confidence: 0.9,
          reason: 'Test',
          warnings: []
        }
      },
      {
        id: 'btn-save',
        name: 'Save Button',
        semanticType: 'button',
        children: [],
        classification: {
          semanticType: 'button',
          confidence: 0.95,
          reason: 'Test',
          warnings: []
        }
      }
    ],
    classification: {
      semanticType: 'card',
      confidence: 0.9,
      reason: 'Test',
      warnings: []
    }
  };

  test('compiles basic properties and handles naming', () => {
    const userStory: UserStory = {
      title: 'View Account Details',
      description: 'As a user I want to see the details.',
      acceptanceCriteria: ['Show account fields']
    };

    const blueprint = compileFeatureBlueprint(mockClassifiedTree, userStory);

    expect(blueprint.componentName).toBe('accountDetailsCard');
    expect(blueprint.properties.some((p) => p.name === 'accountNameValue')).toBe(true);
    expect(blueprint.eventHandlers.some((e) => e.name === 'handleAccountNameChange')).toBe(true);
    expect(blueprint.eventHandlers.some((e) => e.name === 'handleSaveButtonClick')).toBe(true);
  });

  test('detects recordId need from user story text', () => {
    const userStory: UserStory = {
      title: 'Edit Account Page',
      description: 'Requires loading records for a specific record ID detail page.',
      acceptanceCriteria: ['Validate recordid context']
    };

    const blueprint = compileFeatureBlueprint(mockClassifiedTree, userStory);

    expect(blueprint.properties.some((p) => p.name === 'recordId')).toBe(true);
  });

  test('detects toast show notifications and adds imports', () => {
    const userStory: UserStory = {
      title: 'Alert Success Details',
      description: 'Trigger success toast notification alert on save.',
      acceptanceCriteria: ['Must show success notification toast']
    };

    const blueprint = compileFeatureBlueprint(mockClassifiedTree, userStory);

    expect(blueprint.imports.some((imp) => imp.includes('platformShowToastEvent'))).toBe(true);
    const saveHandler = blueprint.eventHandlers.find((e) => e.targetNodeId === 'btn-save');
    expect(saveHandler?.actionKind).toBe('toast');
  });

  test('detects Apex wiring requests and generates wired properties', () => {
    const userStory: UserStory = {
      title: 'Fetch Server Data',
      description: 'Fetch data via controller Apex class.',
      acceptanceCriteria: ['Retrieve backend responses']
    };

    const blueprint = compileFeatureBlueprint(mockClassifiedTree, userStory);

    expect(blueprint.imports.some((imp) => imp.includes('@salesforce/apex'))).toBe(true);
    expect(blueprint.properties.some((p) => p.name === 'wiredData')).toBe(true);
  });
});
