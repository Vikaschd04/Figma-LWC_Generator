import request from 'supertest';
import { accountHealthCardRawFixture } from '../../../../packages/test-fixtures/src';
import { createBackendApp } from '../app';

describe('backend API', () => {
  it('responds to health checks', async () => {
    await request(createBackendApp()).get('/health').expect(200, { status: 'ok' });
  });

  it('normalizes raw Figma JSON', async () => {
    const response = await request(createBackendApp())
      .post('/api/normalize')
      .send({ rawFigmaNode: accountHealthCardRawFixture })
      .expect(200);

    expect(response.body.normalizedDesign).toMatchObject({
      name: 'Account Health Card',
      semanticType: 'container'
    });
  });

  it('generates LWC files', async () => {
    const response = await request(createBackendApp())
      .post('/api/generate-lwc')
      .send({
        componentName: 'Account Health Card',
        rawFigmaNode: accountHealthCardRawFixture,
        options: {
          target: 'lightning__RecordPage',
          generateReadme: true
        }
      })
      .expect(200);

    expect(response.body).toMatchObject({
      componentName: 'accountHealthCard',
      summary: {
        fileCount: 5,
        warningCount: 0
      }
    });
    expect(response.body.files.map((file: { path: string }) => file.path)).toContain(
      'accountHealthCard/accountHealthCard.html'
    );
  });

  it('returns useful validation errors for bad requests', async () => {
    const response = await request(createBackendApp())
      .post('/api/generate-lwc')
      .send({ componentName: '' })
      .expect(400);

    expect(response.body.error).toBe('Invalid request');
    expect(response.body.issues.length).toBeGreaterThan(0);
  });

  it('handles internal errors safely', async () => {
    const response = await request(
      createBackendApp({
        generateBundle: () => {
          throw new Error('simulated failure');
        }
      })
    )
      .post('/api/generate-lwc')
      .send({
        componentName: 'Account Health Card',
        rawFigmaNode: accountHealthCardRawFixture
      })
      .expect(500);

    expect(response.body).toEqual({ error: 'Internal server error' });
  });
});
