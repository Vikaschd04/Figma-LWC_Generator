import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { z } from 'zod';
import {
  classifyDesignNode,
  normalizeFigmaTree,
  compileFeatureBlueprint,
  validateLwcBundle
} from '../../../packages/core/src';
import { generateLwcBundle } from '../../../packages/lwc-generator/src';
import { mapToSlds } from '../../../packages/slds-mapper/src';
import {
  type GeneratedLwcBundle,
  type NormalizedDesignNode,
  rawFigmaNodeSchema,
  userStorySchema
} from '../../../packages/schemas/src';

const generationOptionsSchema = z
  .object({
    target: z
      .enum(['lightning__RecordPage', 'lightning__AppPage', 'lightning__HomePage'])
      .optional(),
    apiVersion: z.string().min(1).optional(),
    generateReadme: z.boolean().optional()
  })
  .optional();

const normalizeRequestSchema = z.object({
  rawFigmaNode: rawFigmaNodeSchema
});

const generateRequestSchema = z.object({
  componentName: z.string().min(1),
  rawFigmaNode: rawFigmaNodeSchema,
  options: generationOptionsSchema,
  userStory: userStorySchema.optional()
});

export interface BackendDependencies {
  normalizeTree: (rawNode: z.infer<typeof rawFigmaNodeSchema>) => NormalizedDesignNode;
  generateBundle: (request: z.infer<typeof generateRequestSchema>) => GeneratedLwcBundle;
}

const defaultDependencies: BackendDependencies = {
  normalizeTree: normalizeFigmaTree,
  generateBundle: (request) => {
    const normalized = normalizeFigmaTree(request.rawFigmaNode);
    const classified = classifyDesignNode(normalized);
    const mapped = mapToSlds(classified);

    const blueprint = request.userStory
      ? compileFeatureBlueprint(classified, request.userStory)
      : undefined;

    return generateLwcBundle({
      componentName: request.componentName,
      mappedRoot: mapped,
      options: request.options,
      blueprint
    });
  }
};

export function createBackendApp(overrides: Partial<BackendDependencies> = {}) {
  const dependencies = { ...defaultDependencies, ...overrides };
  const app = express();

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.post(
    '/api/normalize',
    safeHandler((request, response) => {
      const parsed = normalizeRequestSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json(toValidationError(parsed.error));
        return;
      }

      response.json({
        normalizedDesign: dependencies.normalizeTree(parsed.data.rawFigmaNode),
        warnings: []
      });
    })
  );

  app.post(
    '/api/generate-lwc',
    safeHandler((request, response) => {
      const parsed = generateRequestSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json(toValidationError(parsed.error));
        return;
      }

      const bundle = dependencies.generateBundle(parsed.data);

      const normalized = normalizeFigmaTree(parsed.data.rawFigmaNode);
      const classified = classifyDesignNode(normalized);
      const mapped = mapToSlds(classified);
      const validation = validateLwcBundle(bundle, mapped);

      response.json({
        componentName: bundle.componentName,
        files: bundle.files,
        warnings: bundle.warnings,
        summary: {
          fileCount: bundle.files.length,
          warningCount: bundle.warnings.length
        },
        validation
      });
    })
  );

  app.use(errorHandler);

  return app;
}

function safeHandler(handler: RequestHandler): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function toValidationError(error: z.ZodError) {
  return {
    error: 'Invalid request',
    issues: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }))
  };
}

const errorHandler: ErrorRequestHandler = (_error, _request, response, next) => {
  void next;

  response.status(500).json({
    error: 'Internal server error'
  });
};
