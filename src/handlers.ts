import type { GenerateContentConfig, GoogleGenAI } from '@google/genai';
import { getHistory, saveHistory } from './conversations.js';
import { DEFAULT_MODEL, MODELS } from './models.js';
import type {
  AnalyzeImageArgs,
  CodeReviewArgs,
  ConversationMessage,
  GenerateTextArgs,
  ToolHandler,
  ToolResult,
} from './types.js';

function ok(text: string): ToolResult {
  return { ok: true, text };
}

function fail(message: string): ToolResult {
  return { ok: false, message };
}

const DATA_URI_PATTERN = /^data:(.+);base64,(.+)$/;

export function parseImageData(imageBase64: string): { mimeType: string; data: string } {
  const match = imageBase64.match(DATA_URI_PATTERN);
  if (match) {
    // biome-ignore lint/style/noNonNullAssertion: regex capture groups guaranteed by DATA_URI_PATTERN
    return { mimeType: match[1]!, data: match[2]! };
  }
  return { mimeType: 'image/jpeg', data: imageBase64 };
}

export function createHandlers(genAI: GoogleGenAI): Record<string, ToolHandler> {
  async function handleGenerateText(args: Record<string, unknown>): Promise<ToolResult> {
    const {
      prompt,
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 2048,
      conversationId,
      systemInstruction,
      jsonMode,
      jsonSchema,
      grounding,
      safetySettings,
    } = args as unknown as GenerateTextArgs;

    if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
      return fail('Invalid temperature: must be a number between 0 and 2');
    }
    if (typeof maxTokens !== 'number' || maxTokens < 1 || !Number.isInteger(maxTokens)) {
      return fail('Invalid maxTokens: must be a positive integer');
    }

    const userMessage: ConversationMessage = { role: 'user', parts: [{ text: prompt }] };
    const history = conversationId ? getHistory(conversationId) : [];
    const contents = [...history, userMessage];

    const config: GenerateContentConfig = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    if (systemInstruction) {
      config.systemInstruction = { parts: [{ text: systemInstruction }] };
    }
    if (jsonMode) {
      config.responseMimeType = 'application/json';
      if (jsonSchema) {
        config.responseSchema = jsonSchema;
      }
    }
    if (grounding) {
      config.tools = [{ googleSearch: {} }];
    }
    if (safetySettings) {
      config.safetySettings = safetySettings;
    }

    const result = await genAI.models.generateContent({ model, contents, config });
    const text = result.text ?? '';

    if (conversationId) {
      saveHistory(conversationId, [...history, userMessage, { role: 'model', parts: [{ text }] }]);
    }

    return ok(text);
  }

  async function handleAnalyzeImage(args: Record<string, unknown>): Promise<ToolResult> {
    const { prompt, imageBase64, imageUrl, model = DEFAULT_MODEL } = args as unknown as AnalyzeImageArgs;

    if (!imageBase64 && !imageUrl) {
      return fail('Either imageBase64 or imageUrl must be provided');
    }

    const imagePart = imageBase64
      ? { inlineData: parseImageData(imageBase64) }
      : // biome-ignore lint/style/noNonNullAssertion: guard above ensures imageUrl is defined when imageBase64 is absent
        { fileData: { fileUri: imageUrl!, mimeType: 'image/jpeg' } };

    const result = await genAI.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }],
    });
    return ok(result.text ?? '');
  }

  function handleListModels(): Promise<ToolResult> {
    return Promise.resolve(ok(MODELS.join('\n')));
  }

  async function handleCodeReview(args: Record<string, unknown>): Promise<ToolResult> {
    const { diff, context, model = DEFAULT_MODEL } = args as unknown as CodeReviewArgs;

    const baseInstruction =
      'You are an expert code reviewer. Review the following diff for bugs, style issues, security concerns, and potential improvements. Be concise and actionable.';
    const systemInstruction = context ? `${baseInstruction}\n\nAdditional context: ${context}` : baseInstruction;

    const result = await genAI.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: diff }] }],
      config: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        systemInstruction: { parts: [{ text: systemInstruction }] },
      },
    });

    return ok(result.text ?? '');
  }

  return {
    generate_text: handleGenerateText,
    analyze_image: handleAnalyzeImage,
    list_models: handleListModels,
    code_review: handleCodeReview,
  };
}
