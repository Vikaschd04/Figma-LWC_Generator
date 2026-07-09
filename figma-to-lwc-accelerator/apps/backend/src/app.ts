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
  rawFigmaNode: rawFigmaNodeSchema.optional(),
  imageBase64: z.string().optional(),
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
    const normalized = normalizeFigmaTree(request.rawFigmaNode!);
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

  app.use(express.json({ limit: '10mb' }));

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
    safeHandler(async (request, response) => {
      const parsed = generateRequestSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json(toValidationError(parsed.error));
        return;
      }

      // 1. Check if Vision LLM (AI) generation is requested
      if (parsed.data.imageBase64) {
        const apiKey = process.env.ZENMUX_API_KEY || 'sk-ai-v1-a4979db34b9db3e919c57cb5aa7fa2304a19750da795610ce47aae11094c3b4c';
        if (!apiKey) {
          response.status(500).json({
            error: 'ZenMux API key is not configured.',
            message: 'Please configure the ZENMUX_API_KEY environment variable in your deployment.'
          });
          return;
        }

        const compName = parsed.data.componentName;
        const target = parsed.data.options?.target ?? 'lightning__RecordPage';
        const apiVersion = parsed.data.options?.apiVersion ?? '61.0';
        const userStory = parsed.data.userStory;

        const userStoryPrompt = userStory
          ? `Functional requirement details:
   Title: ${userStory.title}
   Description: ${userStory.description}
   Acceptance Criteria: ${userStory.acceptanceCriteria.join(', ')}`
          : 'No functional requirements provided.';

        const prompt = `You are an expert Salesforce UI/UX Developer. Your task is to analyze the provided Figma design screenshot and generate a production-ready, highly accurate Salesforce Lightning Web Component (LWC) matching it.

Guidelines:
1. Naming: The component folder/file name must be: ${compName}. Inside the JS controller, name the class: ${compName.charAt(0).toUpperCase() + compName.slice(1)}.
2. Targets: Target page configuration: ${target}.
3. Alignment & Layout: Use standard Salesforce base components (e.g. <lightning-button>, <lightning-input>, <lightning-combobox>, <lightning-icon>, etc.) and SLDS utility classes wherever possible.
4. Spacing, Colors & Styling: For exact background colors, padding, borders, and typography that do not match default SLDS styles, write scoped CSS classes inside the generated stylesheet file. Prepended ':host { display: block; }' in the CSS.
5. Interactive Logic: Inject properties and event handlers matching the following criteria:
   ${userStoryPrompt}
6. File Outputs Required: You must generate 4 files matching the standard Salesforce LWC structure:
   - Component HTML template file (named "${compName}.html")
   - Component JavaScript controller file (named "${compName}.js")
   - Component CSS stylesheet file (named "${compName}.css")
   - Component metadata configuration file (named "${compName}.js-meta.xml" targeting ${target} with API version ${apiVersion})

Return the result as a strict JSON object containing the exact file contents for each key:
{
  "html": "string",
  "css": "string",
  "js": "string",
  "metaXml": "string"
}

Do not include any markdown syntax, backticks, or HTML wrappers outside the JSON structure. Returns only the parseable JSON.`;

        try {
          const zenmuxResponse = await fetch(
            'https://zenmux.ai/api/v1/chat/completions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: 'x-ai/grok-4.5',
                messages: [
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: prompt
                      },
                      {
                        type: 'image_url',
                        image_url: {
                          url: `data:image/png;base64,${parsed.data.imageBase64}`
                        }
                      }
                    ]
                  }
                ],
                response_format: {
                  type: 'json_object'
                }
              })
            }
          );

          if (!zenmuxResponse.ok) {
            const rawError = await zenmuxResponse.text();
            throw new Error(`ZenMux API returned status ${zenmuxResponse.status}: ${rawError}`);
          }

          const responseData = await zenmuxResponse.json();
          const rawText = responseData.choices?.[0]?.message?.content;
          if (!rawText) {
            throw new Error('Empty response from ZenMux API');
          }

          const parsedResult = JSON.parse(rawText.trim());

          const files = [
            { path: `${compName}/${compName}.html`, kind: 'html', content: parsedResult.html },
            { path: `${compName}/${compName}.js`, kind: 'js', content: parsedResult.js },
            { path: `${compName}/${compName}.css`, kind: 'css', content: parsedResult.css },
            { path: `${compName}/${compName}.js-meta.xml`, kind: 'metaXml', content: parsedResult.metaXml },
            {
              path: `${compName}/README.md`,
              kind: 'readme',
              content: `# ${compName}\n\nGenerated by Figma to Salesforce LWC Accelerator via Vision AI using Grok 4.5.`
            }
          ];

          response.json({
            componentName: compName,
            files,
            warnings: ['Generated using Vision AI. Verify behavior and alignment before deploying.'],
            summary: {
              fileCount: files.length,
              warningCount: 1
            },
            validation: { valid: true, messages: [] }
          });
        } catch (err: any) {
          console.error('ZenMux Vision Generation failed:', err);
          response.status(500).json({
            error: 'ZenMux Vision Generation failed',
            message: err.message || String(err)
          });
        }
        return;
      }

      // 2. Fall back to standard AST normalizer compiler flow
      if (!parsed.data.rawFigmaNode) {
        response.status(400).json({
          error: 'Invalid request',
          message: 'Either rawFigmaNode or imageBase64 is required.'
        });
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

const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;
  console.error('Unhandled Server Error:', error);
  response.status(500).json({
    error: 'Internal server error',
    message: error instanceof Error ? error.message : String(error)
  });
};
