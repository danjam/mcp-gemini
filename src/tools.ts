import { DEFAULT_MODEL, MODELS } from './models.js';
import type { MCPToolDefinition } from './types.js';

const modelSchemaProperty = {
  type: 'string',
  description: 'Model to use',
  enum: MODELS,
  default: DEFAULT_MODEL,
} as const;

export const tools = [
  {
    name: 'generate_text',
    description: 'Generate text using Google Gemini',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The prompt to send' },
        model: modelSchemaProperty,
        systemInstruction: { type: 'string', description: 'System instruction' },
        temperature: { type: 'number', description: 'Temperature (0-2)', default: 0.7 },
        maxTokens: { type: 'number', description: 'Max output tokens', default: 2048 },
        jsonMode: { type: 'boolean', description: 'Return JSON output', default: false },
        jsonSchema: { type: 'object', description: 'JSON schema for structured output' },
        grounding: { type: 'boolean', description: 'Enable Google Search grounding', default: false },
        conversationId: { type: 'string', description: 'ID for maintaining conversation context across calls' },
        safetySettings: {
          type: 'array',
          description: 'Safety settings for content filtering',
          items: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: [
                  'HARM_CATEGORY_HARASSMENT',
                  'HARM_CATEGORY_HATE_SPEECH',
                  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                  'HARM_CATEGORY_DANGEROUS_CONTENT',
                ],
              },
              threshold: {
                type: 'string',
                enum: ['BLOCK_NONE', 'BLOCK_ONLY_HIGH', 'BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE'],
              },
            },
          },
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'analyze_image',
    description: 'Analyze an image using Gemini vision. Provide either imageUrl or imageBase64.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Question about the image' },
        imageUrl: { type: 'string', description: 'URL of the image to analyze' },
        imageBase64: { type: 'string', description: 'Base64-encoded image (with or without data URI prefix)' },
        model: modelSchemaProperty,
      },
      required: ['prompt'],
    },
  },
  {
    name: 'list_models',
    description: 'List available Gemini models',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'code_review',
    description: 'Review a code diff using Gemini. Returns feedback on bugs, style, and improvements.',
    inputSchema: {
      type: 'object',
      properties: {
        diff: { type: 'string', description: 'The code diff or code to review' },
        context: { type: 'string', description: 'Optional context or focus areas (e.g. "focus on security")' },
        model: modelSchemaProperty,
      },
      required: ['diff'],
    },
  },
] satisfies MCPToolDefinition[];
