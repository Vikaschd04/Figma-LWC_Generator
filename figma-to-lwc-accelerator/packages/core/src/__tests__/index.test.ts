import { getProjectName } from '../index';

describe('core package smoke test', () => {
  it('exposes the project name', () => {
    expect(getProjectName()).toBe('Figma to Salesforce LWC Accelerator');
  });
});
