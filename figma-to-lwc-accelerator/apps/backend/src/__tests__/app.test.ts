import request from 'supertest';
import { createBackendApp } from '../app';

describe('backend API', () => {
  it('responds to health checks', async () => {
    await request(createBackendApp()).get('/health').expect(200, { status: 'ok' });
  });

  it('returns useful validation errors for missing imageBase64', async () => {
    const response = await request(createBackendApp())
      .post('/api/generate-lwc')
      .send({ componentName: 'testComponent' })
      .expect(400);

    expect(response.body.error).toBe('Invalid request');
    expect(response.body.issues.length).toBeGreaterThan(0);
  });

  it('handles missing API keys gracefully', async () => {
    const originalKey = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    try {
      const response = await request(createBackendApp())
        .post('/api/generate-lwc')
        .send({
          componentName: 'testComponent',
          imageBase64: 'mockBase64String'
        })
        .expect(500);

      expect(response.body.error).toBe('OpenRouter API key is not configured.');
    } finally {
      process.env.OPENROUTER_API_KEY = originalKey;
    }
  });
});
