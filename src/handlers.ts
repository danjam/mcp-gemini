import type { GenerateContentConfig } from '@google/genai';

import { MODELS, DEFAULT_MODEL, DEFAULT_EMBEDDING_MODEL } from './models.js';
import { getHistory, saveHistory } from './conversations.js';
import type { ConversationMessage, RequestId, Responder, ToolHandler } from './types.js';

const DATA_URI_PATTERN = /^data:(.+);base64,(.+)$/;

function parseImageData(imageBase64: string): { mimeType: string; data: string } {
  const match = imageBase64.match(DATA_URI_PATTERN);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: 'image/jpeg', data: imageBase64 };
}

export function createHandlers(
  genAI: { models: any },
  responder: Responder,
): Record<string, ToolHandler> {
  const { textReply, error } = responder;

  async function handleGenerateText(id: RequestId, args: Record<string, any>): Promise<void> {
    const model = args.model ?? DEFAULT_MODEL;

    const temperature = args.temperature ?? 0.7;
    if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
      error(id, -32602, 'Invalid temperature: must be a number between 0 and 2');
      return;
    }
    const maxTokens = args.maxTokens ?? 2048;
    if (typeof maxTokens !== 'number' || maxTokens < 1 || !Number.isInteger(maxTokens)) {
      error(id, -32602, 'Invalid maxTokens: must be a positive integer');
      return;
    }

    const userMessage: ConversationMessage = { role: 'user', parts: [{ text: args.prompt }] };
    const history = args.conversationId ? getHistory(args.conversationId) : [];
    const contents = [...history, userMessage];

    const config: GenerateContentConfig = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    if (args.systemInstruction) {
      config.systemInstruction = { parts: [{ text: args.systemInstruction }] };
    }
    if (args.jsonMode) {
      config.responseMimeType = 'application/json';
      if (args.jsonSchema) {
        config.responseSchema = args.jsonSchema;
      }
    }
    if (args.grounding) {
      config.tools = [{ googleSearch: {} }];
    }
    if (args.safetySettings) {
      config.safetySettings = args.safetySettings;
    }

    const result = await genAI.models.generateContent({ model, contents, config });
    const text = result.text ?? '';

    if (args.conversationId) {
      saveHistory(args.conversationId, [...history, userMessage, { role: 'model', parts: [{ text }] }]);
    }

    textReply(id, text);
  }

  async function handleAnalyzeImage(id: RequestId, args: Record<string, any>): Promise<void> {
    const model = args.model ?? DEFAULT_MODEL;
    const inlineData = parseImageData(args.imageBase64);
    const result = await genAI.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: args.prompt }, { inlineData }] }],
    });
    textReply(id, result.text ?? '');
  }

  async function handleCountTokens(id: RequestId, args: Record<string, any>): Promise<void> {
    const model = args.model ?? DEFAULT_MODEL;
    const result = await genAI.models.countTokens({
      model,
      contents: [{ role: 'user', parts: [{ text: args.text }] }],
    });
    textReply(id, `Token count: ${result.totalTokens}`);
  }

  function handleListModels(id: RequestId): Promise<void> {
    textReply(id, MODELS.join('\n'));
    return Promise.resolve();
  }

  async function handleEmbedText(id: RequestId, args: Record<string, any>): Promise<void> {
    const model = args.model ?? DEFAULT_EMBEDDING_MODEL;
    const result = await genAI.models.embedContent({ model, contents: args.text });
    const values = result.embeddings?.[0]?.values ?? [];
    textReply(id, JSON.stringify({ model, dimensions: values.length, embedding: values }));
  }

  return {
    generate_text: handleGenerateText,
    analyze_image: handleAnalyzeImage,
    count_tokens: handleCountTokens,
    list_models: handleListModels,
    embed_text: handleEmbedText,
  };
}
