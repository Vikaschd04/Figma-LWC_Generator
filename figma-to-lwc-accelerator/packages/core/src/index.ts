export const projectName = 'Figma to Salesforce LWC Accelerator';

export function getProjectName(): string {
  return projectName;
}

export * from './classifier';
export * from './normalizer';
export * from './blueprint';
export * from './validator';
export * from '../../schemas/src';
