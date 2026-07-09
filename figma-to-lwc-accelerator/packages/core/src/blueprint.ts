import type {
  ClassifiedDesignNode,
  UserStory,
  FeatureBlueprint,
  BlueprintProperty,
  BlueprintEventHandler
} from '../../schemas/src';

export function compileFeatureBlueprint(
  classifiedRoot: ClassifiedDesignNode,
  userStory: UserStory
): FeatureBlueprint {
  const properties: BlueprintProperty[] = [];
  const eventHandlers: BlueprintEventHandler[] = [];
  const imports: string[] = [];
  const warnings: string[] = [];

  const storyText =
    `${userStory.title} ${userStory.description} ${userStory.acceptanceCriteria.join(' ')}`.toLowerCase();

  // 1. Identify core Salesforce DX inputs from story context
  const needsRecordId =
    storyText.includes('record id') ||
    storyText.includes('record page') ||
    storyText.includes('recordid');
  if (needsRecordId) {
    properties.push({
      name: 'recordId',
      type: 'string',
      isApi: true,
      description: 'The ID of the current Salesforce record.'
    });
  }

  // 2. Scan story for action triggers
  const needsToast =
    storyText.includes('toast') ||
    storyText.includes('success notification') ||
    storyText.includes('alert') ||
    storyText.includes('notify');
  if (needsToast) {
    imports.push("import { ShowToastEvent } from 'lightning/platformShowToastEvent';");
  }

  const needsApex =
    storyText.includes('apex') || storyText.includes('server') || storyText.includes('controller');
  if (needsApex) {
    const inferredApexMethod = `${toPascalCase(userStory.title || 'Data')}Controller.getData`;
    imports.push(`import getApexData from '@salesforce/apex/${inferredApexMethod}';`);
    properties.push({
      name: 'wiredData',
      type: 'any',
      isApi: false,
      description: 'Wired storage for server call responses.'
    });
  }

  // 3. Traverse design nodes recursively to locate buttons and inputs
  const collectInteractiveNodes = (node: ClassifiedDesignNode) => {
    if (node.semanticType === 'input') {
      const fieldName = toCamelCase(node.name);
      const propName = `${fieldName}Value`;

      // Prevent duplicates
      if (!properties.some((p) => p.name === propName)) {
        properties.push({
          name: propName,
          type: 'string',
          defaultValue: "''",
          isApi: false,
          description: `Input value for ${node.name}.`
        });
      }

      eventHandlers.push({
        name: `handle${toPascalCase(node.name)}Change`,
        domEvent: 'onchange',
        targetNodeId: node.id,
        actionKind: 'inputBinding',
        actionDetails: {
          property: propName
        }
      });
    }

    if (node.semanticType === 'button') {
      const actionName = toPascalCase(node.name);

      eventHandlers.push({
        name: `handle${actionName}Click`,
        domEvent: 'onclick',
        targetNodeId: node.id,
        actionKind: needsToast ? 'toast' : 'custom',
        actionDetails: {
          message: `Action "${node.name}" executed successfully!`,
          title: 'Success',
          variant: 'success'
        }
      });
    }

    node.children.forEach(collectInteractiveNodes);
  };

  collectInteractiveNodes(classifiedRoot);

  return {
    componentName: toCamelCase(classifiedRoot.name || 'generatedComponent'),
    properties,
    eventHandlers,
    imports,
    warnings
  };
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
