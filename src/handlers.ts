import type { GenerateContentConfig, GoogleGenAI } from '@google/genai';
import { getHistory, saveHistory } from './conversations.js';
import { DEFAULT_MODEL, MODELS } from './models.js';
import type {
  AnalyzeImageArgs,
  ConversationMessage,
  CountTokensArgs,
  GenerateTextArgs,
  ToolHandler,
  ToolResult,
} from './types.js';

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
      return { ok: false, code: -32602, message: 'Invalid temperature: must be a number between 0 and 2' };
    }
    if (typeof maxTokens !== 'number' || maxTokens < 1 || !Number.isInteger(maxTokens)) {
      return { ok: false, code: -32602, message: 'Invalid maxTokens: must be a positive integer' };
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

    return { ok: true, text };
  }

  async function handleAnalyzeImage(args: Record<string, unknown>): Promise<ToolResult> {
    const { prompt, imageBase64, model = DEFAULT_MODEL } = args as unknown as AnalyzeImageArgs;
    const inlineData = parseImageData(imageBase64);
    const result = await genAI.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData }] }],
    });
    return { ok: true, text: result.text ?? '' };
  }

  async function handleCountTokens(args: Record<string, unknown>): Promise<ToolResult> {
    const { text, model = DEFAULT_MODEL } = args as unknown as CountTokensArgs;
    const result = await genAI.models.countTokens({
      model,
      contents: [{ role: 'user', parts: [{ text }] }],
    });
    return { ok: true, text: `Token count: ${result.totalTokens}` };
  }

  function handleListModels(): Promise<ToolResult> {
    return Promise.resolve({ ok: true, text: MODELS.join('\n') });
  }

  return {
    generate_text: handleGenerateText,
    analyze_image: handleAnalyzeImage,
    count_tokens: handleCountTokens,
    list_models: handleListModels,
  };
}
