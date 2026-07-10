import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { z } from 'zod';

const generateRequestSchema = z.object({
  componentName: z.string().min(1),
  imageBase64: z.string().min(1),
  options: z.object({
    target: z.string().optional(),
    apiVersion: z.string().optional(),
    generateReadme: z.boolean().optional()
  }).optional(),
  userStory: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    acceptanceCriteria: z.array(z.string()).optional()
  }).optional()
});

export function createBackendApp() {
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
    '/api/generate-lwc',
    safeHandler(async (request, response) => {
      const parsed = generateRequestSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json(toValidationError(parsed.error));
        return;
      }

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        response.status(500).json({
          error: 'OpenRouter API key is not configured.',
          message: 'Please configure the OPENROUTER_API_KEY environment variable in your deployment.'
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
   Acceptance Criteria: ${userStory.acceptanceCriteria?.join(', ') || ''}`
        : 'No functional requirements provided.';

      const prompt = `You are a Principal Salesforce UI/UX Developer. Your task is to analyze the provided Figma design screenshot and generate a production-ready, pixel-perfect Salesforce Lightning Web Component (LWC) that visualizes it with high fidelity.

Follow these strict rules:
1. Component Structure & Naming:
   - Component directory and filenames must be named: ${compName}.
   - The JS controller class name must be: ${compName.charAt(0).toUpperCase() + compName.slice(1)}.
   - Ensure the template target page configuration is ${target} with API version ${apiVersion}.

2. Alignment & Layout (Fidelity):
   - Replicate the visual spacing, margins, padding, alignment, and flex wrapping.
   - Use standard Salesforce Lightning design structures (<lightning-card>, layout grids, spacing utilities) wherever possible.
   - Match all typography sizes, font weights, custom border colors, background colors, and rounded corners.

3. Base Component Mapping:
   - Map design inputs to standard Salesforce base components (e.g. <lightning-input>, <lightning-combobox>, <lightning-button>, <lightning-badge>, <lightning-icon>).
   - Use correct variant attributes (e.g., variant="brand" for primary buttons, variant="neutral" for secondary buttons) to align with standard SLDS.

4. Spacing, Colors & CSS:
   - Do NOT use inline styles.
   - Write standard CSS selectors inside "${compName}.css" for custom background styles, hover behaviors, font imports, borders, or specific flex alignments that exceed default SLDS classes.
   - Prepend ':host { display: block; }' at the top of the stylesheet.

5. Functional Logic:
   - Based on the user story below, declare appropriate reactive state fields (@track) and write complete JS action controller methods (e.g., input change handlers, button click handlers, toast alert triggers, or public variables):
     ${userStoryPrompt}
   - Implement event handlers with descriptive comments. Do not generate stub methods without logic.

6. Accessibility (A11y):
   - Enforce WCAG guidelines: specify labels for all inputs, define alternative alt text configurations for images, use aria labels, and maintain proper heading hierarchy (h1, h2, h3).

7. Outputs Required:
   Generate exactly 4 files matching standard LWC structures:
   - "${compName}.html" (Component HTML template)
   - "${compName}.js" (JS Controller class with all state and imports)
   - "${compName}.css" (CSS layout stylesheet)
   - "${compName}.js-meta.xml" (Salesforce metadata config specifying targets)

Return your output as a strict JSON object with these exact keys:
{
  "html": "string",
  "css": "string",
  "js": "string",
  "metaXml": "string"
}

Do not surround the output with markdown backticks, prefixing, or commentary outside the JSON structure. Returns only the parseable JSON.`;

      try {
        const modelsToTry = [
          { model: 'google/gemini-3.5-flash', max_tokens: 2048 },
          { model: 'google/gemini-2.5-flash', max_tokens: 4096 },
          { model: 'meta-llama/llama-3.2-11b-vision-instruct:free', max_tokens: 2048 }
        ];

        let parsedResult = null;
        let lastError = null;

      for (const config of modelsToTry) {
        try {
          const openRouterResponse = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://figma-to-lwc-accelerator.vercel.app',
                'X-Title': 'Figma to LWC Accelerator'
              },
              body: JSON.stringify({
                model: config.model,
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
                max_tokens: config.max_tokens,
                response_format: {
                  type: 'json_object'
                }
              })
            }
          );

          if (!openRouterResponse.ok) {
            const rawError = await openRouterResponse.text();
            throw new Error(`Model ${config.model} failed with status ${openRouterResponse.status}: ${rawError}`);
          }

          const responseData = await openRouterResponse.json();
          const rawText = responseData.choices?.[0]?.message?.content;
          if (!rawText) {
            throw new Error(`Empty response from model ${config.model}`);
          }

          parsedResult = JSON.parse(rawText.trim());
          break; // Success, exit fallback loop
        } catch (err: any) {
          console.warn(`Fallback notice: Attempt with model ${config.model} failed. Error:`, err.message || err);
          lastError = err;
        }
      }

      if (!parsedResult) {
        throw new Error(`All fallback LLM models failed. Last error: ${lastError?.message || lastError}`);
      }

        const files = [
          { path: `${compName}/${compName}.html`, kind: 'html', content: parsedResult.html },
          { path: `${compName}/${compName}.js`, kind: 'js', content: parsedResult.js },
          { path: `${compName}/${compName}.css`, kind: 'css', content: parsedResult.css },
          { path: `${compName}/${compName}.js-meta.xml`, kind: 'metaXml', content: parsedResult.metaXml },
          {
            path: `${compName}/README.md`,
            kind: 'readme',
            content: `# ${compName}\n\nGenerated by Figma to Salesforce LWC Accelerator via Vision AI.`
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
        console.error('OpenRouter Vision Generation failed:', err);
        response.status(500).json({
          error: 'OpenRouter Vision Generation failed',
          message: err.message || String(err)
        });
      }
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
